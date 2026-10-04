# GitOps

Kubernetes manifests for deploying the fashion e-commerce platform — organized as a **Kustomize** tree and synced with a GitOps workflow. (The Argo CD `Application` that drives the sync is no longer a file here — it is created by the Terraform `argocd` module, see [`../infrastructure/`](../infrastructure/README.md).)

```
gitops/
├── kustomization.yml      # Kustomize "root" — the resource list
├── namespace.yml          # `ecommerce` namespace
├── secrets.yml            # `ecommerce-secrets` Secret (dev/example values)
└── k8s/
    ├── backend/           # gateway, auth, products, orders, users (Deployment + Service)
    │   └── service-monitor.yml   # Prometheus ServiceMonitor for the 5 services
    ├── database/          # postgres StatefulSet, headless Service, init ConfigMap
    ├── frontend/          # frontend Deployment + Service
    └── grafana-dashboard.yml     # "Ecommerce Microservices" Grafana dashboard (ConfigMap)
```

## Components

| File / dir                     | Purpose                                                        |
| ------------------------------ | -------------------------------------------------------------- |
| `namespace.yml`                | Creates the `ecommerce` namespace.                             |
| `secrets.yml`                  | `ecommerce-secrets` Opaque Secret: DB URLs, JWT settings, per-service names/ports, inter-service URLs. **Example values only** — manage real credentials with SealedSecrets/External Secrets/SOPS. |
| `k8s/database/statefulset.yml` | PostgreSQL 15 StatefulSet with `10Gi` PVC + `/docker-entrypoint-initdb.d` init scripts from a ConfigMap. |
| `k8s/database/configmap.yml`   | `postgres-init-scripts` — the same `01-create-databases.sh` / `02-schema.sql` / `03-seed-data.sql` used by Docker Compose. |
| `k8s/database/service.yml`     | Headless ClusterIP Service (`clusterIP: None`) for stable DNS. |
| `k8s/backend/{service}.yml`    | Deployment (1 replica, liveness/readiness on `/health`) + ClusterIP Service per microservice. Each Deployment references a short, registry-agnostic image name (`ecommerce-<service>:latest`); Argo CD's Kustomize `images` override rewrites it to the real ECR URL at sync time (see [Images and the Argo CD Application](#images-and-the-argo-cd-application)). |
| `k8s/backend/service-monitor.yml` | Prometheus `ServiceMonitor` selecting the 5 backend Services by their `app` metadata label and setting `jobLabel: app`. |
| `k8s/frontend/deployment.yml`  | Frontend (nginx) Deployment + Service (`frontend-service`, port 80). Image is the short name `ecommerce-frontend:latest`, rewritten to its ECR URL by Argo CD. |
| `k8s/grafana-dashboard.yml`    | Dashboard ConfigMap carrying the `grafana_dashboard: "1"` label, which the sidecar uses to auto-provision the dashboard. |
| *(Argo CD `Application`)*      | **Not a file in this directory.** The `ecommerce` Application is created by the Terraform `argocd` module ([`../infrastructure/modules/argocd`](../infrastructure/README.md)) through the `argo-cd` Helm release's `extraObjects`. It points at `github.com/Hardik782/cloud-native-ecommerce-platform` (`path: gitops`, `targetRevision: main`) and auto-syncs with prune + self-heal, applying a Kustomize `images` override from the `ecr_urls` module variable. |

## The Kustomize root (`kustomization.yml`)

Composes everything in order — namespace, secrets, database, backend, frontend, ServiceMonitor, dashboard — with `disableNameSuffixHash: true` so resource names stay clean.

## Images and the Argo CD Application

The Deployments deliberately reference **short image names** (`ecommerce-auth:latest`, `ecommerce-frontend:latest`, …) instead of fully-qualified ECR URLs, so no registry/account ID is committed to git. Two mechanisms resolve them:

- **Argo CD (GitOps)** — the `ecommerce` `Application` is created by the Terraform `argocd` module, whose `kustomize.images` override rewrites each short name to its ECR URL (`module.ecr.repository_urls`). Tag bumps come from the CI `update-manifests` job, which rewrites `image: ecommerce-<service>:<commit-sha>` in place.
- **Plain `kubectl`** — without Argo CD there is no override, so add an `images:` block to a kustomization overlay (or run `kustomize edit set image ecommerce-auth=<ECR_URL>`) before `kubectl apply -k`.


## Applying (without Argo CD)

```bash
kubectl apply -k gitops
```

Or build and inspect first:

```bash
kubectl kustomize gitops > rendered.yaml
```

## Inter-service networking

Every service gets a `ClusterIP` Service; config comes from the `ecommerce-secrets` Secret:

| Service | Service DNS             | Port → targetPort |
| ------- | ----------------------- | ----------------- |
| Gateway | `gateway-service`       | `3001 → 8000`     |
| Auth    | `auth-service`          | `3002 → 8000`     |
| Products| `products-service`      | `3003 → 8000`     |
| Orders  | `orders-service`        | `3004 → 8000`     |
| Users   | `users-service`         | `3005 → 8000`     |
| Postgres| `postgres-service`      | `5432 → 5432`     |
| Frontend| `frontend-service`      | `80 → 80`         |

## ServiceMonitor

`service-monitor.yml` selects Services by their **own** `metadata.labels.app` label (not `spec.selector`), and sets `jobLabel: app` so Prometheus labels each target `job=<service-name>` (e.g. `job="gateway"`). The Grafana dashboard's queries (`http_requests_total{job=~"$service"}`, `label_values(up{namespace="ecommerce"}, job)`) depend on both.

## Security notes

- `secrets.yml` ships with demo credentials; rotate before any non-local use.
- Prefer SealedSecrets / ExternalSecrets (e.g. AWS Secrets Manager) for real environments.
- The committed manifests use the `latest` tag on the short image names; the CI `update-manifests` job pins that tag to the commit SHA (`ecommerce-<service>:<sha>`) — pin immutable tags in a real pipeline.
- Images are referenced by short name (`ecommerce-<service>`) with no account ID in git; the ECR URL is injected at sync time by Argo CD's Kustomize `images` override (see [Images and the Argo CD Application](#images-and-the-argo-cd-application)). Applying without Argo CD requires adding that override yourself.

## Next steps / deployment order

1. Provision AWS infrastructure (see [`infrastructure/`](../infrastructure/README.md)) — VPC, EKS, ECR, Argo CD + kube-prometheus-stack. This also creates the `ecommerce` Argo CD `Application` (with its Kustomize `images` override) and wires it to the ECR URLs.
2. Build & push images to ECR. Repo names must match the Terraform `repositories` list: `frontend`, `gateway`, `auth`, `products`, `orders`, `users`.
3. Apply the Secret values.
4. Let Argo CD sync — the `Application` is already registered by Terraform. To deploy without Argo CD, add a kustomize `images:` override for the ECR URLs (see [Images and the Argo CD Application](#images-and-the-argo-cd-application)) and run `kubectl apply -k gitops`.
5. Port-forward to verify: frontend, gateway, Prometheus, Grafana.