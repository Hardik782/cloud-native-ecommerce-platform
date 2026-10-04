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

## After provisioning

1. **Build & push images** — tag/push each service image to the ECR URL from `terraform output ecr_urls`. Repo names must match the module's `repositories` list (`frontend`, `gateway`, `auth`, `products`, `orders`, `users`), because the Argo CD Application overrides the manifests' short image names with those exact URLs.
2. **No placeholder edit needed** — the manifests reference short names (`ecommerce-<service>:latest`) with no account ID committed to git; the ECR URLs are injected at sync time by the Application's Kustomize `images` override (wired from `module.ecr.repository_urls` in `main.tf`).
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