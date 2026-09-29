# GitOps

Kubernetes manifests and the Argo CD configuration for deploying the fashion e-commerce platform — organized as a **Kustomize** tree and managed with a GitOps workflow.

```
gitops/
├── argo-cd.yml            # Argo CD Application: syncs this directory to the cluster
├── kustomization.yml      # Kustomize "root" — the resource list
├── namespace.yml          # `ecommerce` namespace
├── secrets.yml            # `ecommerce-secrets` Secret (dev/example values)
└── k8s/
    ├── backend/           # gateway, auth, products, orders, users (Deployment + Service)
    │   └── service-monitor.yml   # Prometheus ServiceMonitor for the 5 services
    ├── database/          # postgres StatefulSet, headless Service, init ConfigMap, restore-job
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
| `k8s/database/restore-job.yml` | One-off Job for restoring a database snapshot.                 |
| `k8s/backend/{service}.yml`    | Deployment (1 replica, liveness/readiness on `/health`) + ClusterIP Service per microservice. Each Deployment references an ECR image URL such as `<AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/gateway:latest`. |
| `k8s/backend/service-monitor.yml` | Prometheus `ServiceMonitor` selecting the 5 backend Services by their `app` metadata label and setting `jobLabel: app`. |
| `k8s/frontend/deployment.yml`  | Frontend (nginx) Deployment + Service (`frontend-service`, port 80). |
| `k8s/grafana-dashboard.yml`    | Dashboard ConfigMap carrying the `grafana_dashboard: "1"` label, which the sidecar uses to auto-provision the dashboard. |
| `argo-cd.yml`                  | Argo CD `Application` pointing at `github.com/Hardik782/cloud-native-ecommerce-platform`, `path: gitops`, `targetRevision: main`, auto-sync with prune + self-heal. |

## The Kustomize root (`kustomization.yml`)

Composes everything in order — namespace, secrets, database, backend, frontend, ServiceMonitor, dashboard — with `disableNameSuffixHash: true` so resource names stay clean.

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
- Image tags are `latest` in the manifests; pin immutable tags in a real pipeline.

## Next steps / deployment order

1. Provision AWS infrastructure (see [`infrastructure/`](../infrastructure/README.md)) — VPC, EKS, ECR, Argo CD + kube-prometheus-stack.
2. Build & push images to ECR.
3. Update `<AWS_ACCOUNT_ID>` placeholders in `gitops/k8s/**/*.yml` and apply the Secret values.
4. Apply the Argo CD `Application` (`argo-cd.yml`) or `kubectl apply -k gitops`.
5. Port-forward to verify: frontend, gateway, Prometheus, Grafana.