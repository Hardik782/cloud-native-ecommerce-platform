# Infrastructure

Terraform configuration that provisions the whole AWS foundation for the fashion e-commerce platform — **VPC, EKS cluster, ECR repositories, and the GitOps/observability tooling** (Argo CD + kube-prometheus-stack).

```
infrastructure/
├── main.tf              # Root module: wires VPC + EKS + ECR + Argo CD together
├── provider.tf          # Providers: AWS (>= 5), Kubernetes (>= 3), Helm (>= 3); Terraform >= 1.5
├── variables.tf         # Input variables (region, VPC, cluster, node group, repos)
├── terraform.tfvars     # Values for this deployment (us-east-1, t3.medium ×1–3, 6 repos)
├── outputs.tf           # cluster_name, cluster_endpoint, ecr_urls
└── modules/
    ├── vpc/             # VPC, internet gateway, 3 public subnets, route tables
    ├── eks/             # EKS 1.34, managed node group, IAM, EBS CSI driver
    ├── ecr/             # One private repository per service (6 repos)
    └── argocd/          # Helm: Argo CD + kube-prometheus-stack; also creates the `ecommerce` Argo CD Application
```

## What gets created

| Resource                            | Details                                                       |
| ----------------------------------- | ------------------------------------------------------------- |
| **VPC** (`modules/vpc`)             | `ecommerce-vpc` `10.0.0.0/16`, internet gateway, 3 public subnets (one per AZ in `us-east-1a/b/c`), public route table. Tags on the subnets let the EKS load balancer controller/EKS use them. |
| **EKS** (`modules/eks`)             | Cluster `ecommerce-cluster` (k8s **1.34**, public endpoint), managed node group `ecommerce-node-group` (`t3.medium`, ON_DEMAND, desired 2 / min 1 / max 3, 30 GiB), IAM roles + OIDC provider, **aws-ebs-csi-driver** addon with IRSA so Postgres PVs work. |
| **ECR** (`modules/ecr`)             | Private repos: `frontend`, `gateway`, `auth`, `products`, `orders`, `users` — `scan_on_push` enabled. |
| **Argo CD** (`modules/argocd`)      | Namespaces `argocd` + `monitoring`; Helm `argo-cd` (v6.7.0, ClusterIP, `server.insecure=true`); Helm `kube-prometheus-stack` (v56.21.0, ClusterIP services). The `argo-cd` release also creates the **`ecommerce` Application** via `extraObjects`, with a Kustomize `images` override that maps the manifests' short names (`ecommerce-auth`, …) to the ECR URLs from `module.ecr.repository_urls` (passed in as the `ecr_urls` variable). |

## Usage

Prerequisites: AWS credentials, `terraform` CLI.

```bash
cd infrastructure

terraform init                       # downloads providers/modules
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

Outputs:

```bash
terraform output cluster_name        # ecommerce-cluster
terraform output cluster_endpoint    # https://<eks-endpoint>
terraform output ecr_urls            # map of repo name → repository URL
```

### Tune with `terraform.tfvars`

```hcl
instance_types = ["t3.medium"]       # node type(s)
desired_size   = 2                   # scale-to/target nodes
min_size       = 1
max_size       = 3
repositories   = ["frontend", "gateway", "auth", "products", "orders", "users"]
```

`variables.tf` declares every variable with sensible defaults; only `subnets` (list of `{name, cidr_block, availability_zone}`) requires a value.

## Configure kubectl

```bash
aws eks update-kubeconfig --region us-east-1 --name ecommerce-cluster
```

## Accessing the deployed services

The Terraform configuration installs the application and observability tools as Kubernetes **ClusterIP** Services. **It does not expose the storefront, backend APIs, Grafana, Prometheus, or Argo CD directly through public web ports.** Use `kubectl port-forward` to access them from your own machine. These tunnels are temporary and stop when the command or terminal exits.

### 1. Connect to the EKS cluster

Run this after `terraform apply` (with AWS CLI credentials configured for the account that owns the cluster):

```bash
aws eks update-kubeconfig --region us-east-1 --name ecommerce-cluster
kubectl get nodes
```

If `kubectl get nodes` succeeds, `kubectl` is connected to the cluster. The EKS Kubernetes API endpoint uses HTTPS on port `443`; this is the **control-plane API**, not the storefront URL. API access is still subject to the EKS endpoint access settings and your AWS/IAM permissions.

### 2. Open the storefront

```bash
kubectl -n ecommerce port-forward svc/frontend-service 4000:80
```

Keep the command running and open <http://localhost:4000>.

### 3. Open Grafana and Prometheus

Run each command in a **separate terminal** and keep both running while you use the pages.

**Grafana dashboards**

```bash
kubectl -n monitoring port-forward svc/kube-prometheus-stack-grafana 3000:80
```

Open <http://localhost:3000>. Retrieve the configured Grafana admin password from the Kubernetes Secret rather than assuming a default password:

```bash
kubectl -n monitoring get secret kube-prometheus-stack-grafana \
  -o jsonpath='{.data.admin-password}' | base64 --decode; echo
```

**Prometheus targets and queries**

```bash
kubectl -n monitoring port-forward svc/kube-prometheus-stack-prometheus 9090:9090
```

Open <http://localhost:9090>.

### 4. Open Argo CD

```bash
kubectl -n argocd port-forward svc/argocd-server 8080:80
```

Open <http://localhost:8080>. The configured Argo CD server uses HTTP internally (`server.insecure=true`), so use `http://` for this local port-forward. To retrieve the initial admin password, if the default admin account is enabled:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath='{.data.password}' | base64 --decode; echo
```

Sign in with username `admin`. If that Secret is absent, the initial password may already have been removed or the admin account may be configured differently.

### Port and exposure summary

| Component | Port used on your computer | URL | Publicly exposed by this Terraform configuration? |
| --- | ---: | --- | --- |
| Storefront | `4000` | <http://localhost:4000> | No — ClusterIP; local port-forward only |
| Grafana | `3000` | <http://localhost:3000> | No — ClusterIP; local port-forward only |
| Prometheus | `9090` | <http://localhost:9090> | No — ClusterIP; local port-forward only |
| Argo CD | `8080` | <http://localhost:8080> | No — ClusterIP; local port-forward only |
| EKS Kubernetes API | `443` | Endpoint shown by `terraform output cluster_endpoint` | Public endpoint is configured; access is controlled by EKS endpoint settings and AWS/IAM permissions |
| Backend APIs and database | Internal Service ports | Access from workloads inside the cluster | No public exposure documented here |

To inspect the Services actually created in the cluster, run:

```bash
kubectl get svc -A
kubectl -n ecommerce get svc
kubectl -n monitoring get svc
kubectl -n argocd get svc
```

A `ClusterIP` Service is reachable inside the cluster, not directly from the public internet. `localhost` URLs above work only while the matching `kubectl port-forward` command is running on your computer. For permanent remote access, configure a secured ingress/load balancer and authentication deliberately; do not open Grafana, Prometheus, or Argo CD to the internet just to make them reachable.

## After provisioning

1. **Build & push images** — tag/push each service image to the ECR URL from `terraform output ecr_urls`. Repo names must match the module's `repositories` list (`frontend`, `gateway`, `auth`, `products`, `orders`, `users`), because the Argo CD Application overrides the manifests' short image names with those exact URLs.
2. **No placeholder edit needed** — the manifests reference short names (`ecommerce-<service>:latest`); the ECR URLs are injected at sync time by the Application's Kustomize `images` override (wired from `module.ecr.repository_urls` in `main.tf`).
3. **Deploy the app** — the Argo CD `Application` is already registered by this Terraform config (`modules/argocd`), so it starts syncing `gitops/` automatically. To deploy without Argo CD, run `kubectl apply -k ../gitops` after adding a kustomize `images:` override for the ECR URLs.
4. **Observability** — the kube-prometheus-stack (Prometheus + Grafana + Alertmanager) is already installed; the `ecommerce-services` ServiceMonitor and dashboard ConfigMap in `gitops/` light up the "Ecommerce Microservices" Grafana dashboard.

## Files

| File            | Purpose                                                     |
| --------------- | ----------------------------------------------------------- |
| `main.tf`       | Root module composition (VPC → EKS → ECR → Argo CD) + the `kubernetes`/`helm` providers bound to the new cluster. Passes `module.ecr.repository_urls` into the `argocd` module as `ecr_urls`. |
| `provider.tf`   | Provider versions (`aws ~>5.0`, `kubernetes ~>3.0`, `helm ~>3.0`) and the AWS region. |
| `variables.tf`  | Declares all inputs, including the required `subnets` list. |
| `outputs.tf`    | `cluster_name`, `cluster_endpoint`, `ecr_urls`.             |
| `modules/argocd/main.tf` | Argo CD + kube-prometheus-stack Helm releases; defines the `ecommerce` Argo CD `Application` (via `extraObjects`) and its Kustomize `images` override. |
| `modules/argocd/variables.tf` | Declares the `ecr_urls` map (`name → repository URL`) the Application's image override consumes. |

## Tearing down

```bash
terraform destroy -var-file=terraform.tfvars
```

> **Note:** `terraform destroy` removes the cluster and namespaces. The `ecommerce-secrets` values and any PVC data are ephemeral — back up external state first.

## Related

- `gitops/` — the manifests Argo CD deploys into this cluster.
- `prometheus/`, `grafana/` — Docker-compose counterparts of the same monitoring stack for local dev.