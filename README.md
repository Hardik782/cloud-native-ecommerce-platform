# Cloud Native E-commerce Platform

A **cloud-native fashion e-commerce platform** built as a set of Python/FastAPI microservices with a React storefront, demonstrating production-grade DevOps practices end to end:

- **Local development** with Docker Compose
- **Cloud infrastructure** (AWS) provisioned with Terraform — VPC, EKS, ECR
- **GitOps delivery** with Argo CD and Kustomize
- **Observability** with Prometheus + Grafana (metrics every 15s, cross-service dashboard)

---

## Architecture

The platform runs under two implementations that expose the same services and the same `/metrics` endpoints. They differ in service discovery, configuration and how observability is wired — so each has its own diagram.

### Docker Compose architecture (local)

Single Docker host, one bridge network (`fashion-network`). Containers find each other by Compose service name (`fashion-ecommerce-<service>`); configuration comes from the root `.env`.

```
                        ┌──────────────────────────┐
   Browser ───────────▶ │  Frontend (nginx + React)│  host :80  → container :80
                        └────────────┬─────────────┘
                                     │ /api → GATEWAY_URL = http://fashion-ecommerce-gateway:8000
                        ┌────────────▼─────────────┐
                        │  API Gateway (FastAPI)   │  host :3001 → container :8000
                        └──┬───────┬───────┬──────┬┘
             ┌─────────────┘       │       │      └─────────────┐
       ┌─────▼──────┐   ┌─────────▼───┐ ┌─▼───────────┐ ┌─────▼────────┐
       │  Auth      │   │  Products   │ │  Orders     │ │  Users       │
       │ :3002→8000 │   │  :3003→8000 │ │ :3004→8000  │ │  :3005→8000  │
       └──────┬─────┘   └──────┬──────┘ └──────┬──────┘ └──────┬───────┘
              │                │               │               │
              └────────────────┴───────┬───────┴───────────────┘
                                       ▼
                    ┌──────────────────────────────────┐
                    │  PostgreSQL 15                   │  host :5432
                    │  auth/products/orders/users DBs  │
                    └──────────────────────────────────┘

   Observability (same network):
     Prometheus  host :9090 → :9090   scrapes every service /metrics + cAdvisor
     Grafana     host :8080 → :3000   "Ecommerce Microservices" dashboard
     cAdvisor    host :8081 → :8080   per-container CPU / memory metrics
```

### Kubernetes architecture (EKS, `gitops/`)

Workloads run in the `ecommerce` namespace; in-cluster DNS replaces Compose names; configuration is injected from the `ecommerce-secrets` Secret; images are pulled from ECR.

```
                        ┌──────────────────────────┐
   Browser ───────────▶ │  Frontend (nginx + React)│  frontend-service :80 → :80
                        └────────────┬─────────────┘      (Deployment)
                                     │ /api → http://gateway-service:3001
                        ┌────────────▼─────────────┐
                        │  API Gateway (FastAPI)   │  gateway-service :3001 → :8000
                        └──┬───────┬───────┬──────┬┘
             ┌─────────────┘       │       │      └─────────────┐
       ┌─────▼───────┐  ┌──────────▼───┐ ┌▼─────────────┐ ┌─────▼────────┐
       │ auth-service│  │products-     │ │orders-service│ │users-service │
       │ :3002→8000  │  │service       │ │ :3004→8000   │ │ :3005→8000   │
       └──────┬──────┘  │ :3003→8000   │ └──────┬───────┘ └──────┬───────┘
              │         └──────┬───────┘        │                │
              └────────────────┴───────┬────────┴────────────────┘
                                       ▼
                    ┌───────────────────────────────────┐
                    │  postgres-service :5432 (headless)│
                    │  StatefulSet postgres-0 + PVC     │
                    └───────────────────────────────────┘

   Observability (monitoring namespace, kube-prometheus-stack):
     Prometheus  ←  ServiceMonitor (label-based discovery, job=<service>, 15s)
     Grafana     ←  sidecar provisions the dashboard from the ConfigMap
   Delivery:  Argo CD Application → Kustomize (gitops/) → automated sync
```

- Every backend service exposes **`/health`**, **`/metrics`** (Prometheus), **`/docs`** (Swagger) and **`/redoc`**.
- The frontend serves traffic on port **80** in both deployments and calls **only the gateway**. The gateway proxies `/api/auth`, `/api/products`, `/api/orders` and `/api/users` server-side to the respective services. Kubernetes exposes the backend ports (`3002`–`3005`) as ClusterIP Services only; Docker Compose publishes them to the host for developer convenience.
- Each microservice owns its own database (`auth_db`, `products_db`, `orders_db`, `users_db`).

---

## Tech Stack

| Layer            | Technology                                                                 |
| ---------------- | -------------------------------------------------------------------------- |
| Backend services | Python 3.11, FastAPI, SQLAlchemy (async), Pydantic v2, uvicorn             |
| Frontend         | React 18, React Router v6, Create React App, axios                         |
| Database         | PostgreSQL 15 (UUID PKs, per-service databases, seedable init scripts)     |
| Local/CI runtime | Docker, Docker Compose                                                     |
| Kubernetes       | AWS EKS (v1.34), Kustomize, Argo CD, kube-prometheus-stack                 |
| Infrastructure   | Terraform (VPC / EKS / ECR / Argo CD modules)                              |
| Observability    | Prometheus, Grafana, ServiceMonitor, custom FastAPI metrics middleware     |
| Auth             | JWT (HS256), bcrypt password hashing, role-based access (customer/admin)   |

---

## Repository Layout

```
cloud-native-ecommerce-platform/
├── .env.example           # Environment template for docker compose
├── docker-compose.yml     # Full local stack (database, services, monitoring)
├── fashion-ecommerce/     # Application source code
│   ├── backend/           #   FastAPI microservices (auth, gateway, orders, products, users)
│   ├── database/          #   PostgreSQL init scripts (schema + seed + verify)
│   └── frontend/          #   React storefront
├── gitops/                # Kustomize manifests + Argo CD Application (Kubernetes)
├── infrastructure/        # Terraform — AWS VPC, EKS, ECR, Argo CD
├── prometheus/            # Prometheus scrape configuration (docker compose)
├── grafana/               # Grafana provisioning (datasource + dashboards)
```

See the individual READMEs for each area:

| Path                              | What it documents                               |
| --------------------------------- | ----------------------------------------------- |
| [`fashion-ecommerce/`](fashion-ecommerce/README.md) | Application code (backend, database, frontend) |
| [`gitops/`](gitops/README.md)     | Kubernetes / Argo CD GitOps manifests           |
| [`infrastructure/`](infrastructure/README.md) | Terraform AWS infrastructure          |
| [`prometheus/`](prometheus/README.md) | Prometheus scrape config                   |
| [`grafana/`](grafana/README.md)   | Grafana provisioning                            |
---

## Deployment Options

This project supports **two different deployment implementations**. The choice between them changes how configuration, service discovery, the database and updates work, so every section below names the deployment it describes.

| Aspect | **Docker Compose** (local) | **Kubernetes / EKS** (production) |
| --- | --- | --- |
| Entry point | [`docker-compose.yml`](docker-compose.yml) | [`gitops/`](gitops/README.md) manifests + Terraform |
| Container runtime | Single Docker host | Kubernetes cluster (multi-node) |
| Configuration | Root `.env` → container env vars | `ecommerce-secrets` **Secret** → env vars |
| Service discovery | Compose network, service names (`fashion-ecommerce-auth:8000`) | In-cluster DNS (`auth-service:3002`, `gateway-service:3001`) |
| Database | PostgreSQL container + named volume | PostgreSQL **StatefulSet** + PVC (EBS) |
| Images | Compose builds them locally | Built and pushed to ECR; the manifests hold short names (`ecommerce-<service>`) that Argo CD rewrites to the ECR URLs |
| Frontend port | Host `80` → `http://localhost` (nginx container listens on 80) | `frontend-service:80` (ClusterIP) → port-forward or ingress |
| Gateway endpoint (from the frontend) | `http://fashion-ecommerce-gateway:8000` via `GATEWAY_URL` (`.env`) | `http://gateway-service:3001` — Service maps `3001 → targetPort 8000` |
| Prometheus targets | Static list in `prometheus/prometheus.yml` | Dynamic `ServiceMonitor` discovery |
| Grafana dashboard | The Compose grafana container provisions it from a file | The Grafana sidecar provisions it from a ConfigMap |
| Updates / redeploys | `docker compose up -d --build` | `kubectl apply -k gitops` or Argo CD auto-sync |

The sections below cover both paths in full — Docker Compose first, Kubernetes second.

---

## Deploy with Docker Compose (local development)

> **What this deploys:** every component — PostgreSQL, the five microservices, the gateway, the frontend, Prometheus, Grafana and cAdvisor — as containers on a single Docker host, defined in the root `docker-compose.yml`. This is the fastest way to run the app locally, but it is a single-host setup: it does **not** use Kubernetes, EKS, ECR or Argo CD.

### Prerequisites
- Docker **with Compose v2** (`docker compose version`)

### 1. Configure environment

```bash
cp .env.example .env
# Edit values if needed (JWT_SECRET at minimum for anything non-demo).
```

### 2. Build and start the stack

```bash
docker compose up -d --build
```

PostgreSQL runs its `init` scripts on first boot, creating all databases, tables, and seed data automatically.

### 3. Access the platform

| Component        | URL / credentials                                      |
| ---------------- | ------------------------------------------------------ |
| Storefront       | http://localhost — port 80                             |
| API Gateway      | http://localhost:3001 (Swagger: `/docs`)               |
| Auth service     | http://localhost:3002 (`/docs`, `/redoc`)              |
| Products service | http://localhost:3003 (`/docs`, `/redoc`)              |
| Orders service   | http://localhost:3004 (`/docs`, `/redoc`)              |
| Users service    | http://localhost:3005 (`/docs`, `/redoc`)              |
| PostgreSQL       | `localhost:5432` — credentials from `.env`   |
| Prometheus       | http://localhost:9090                                  |
| Grafana          | http://localhost:8080 — admin credentials set via `GF_SECURITY_ADMIN_USER` / `GF_SECURITY_ADMIN_PASSWORD` in `docker-compose.yml`        |

> Seed users (see `fashion-ecommerce/database/init/03-seed-data.sql`):
> `admin@fashion.com` (admin role) and `customer@fashion.com` (customer role).

> **The frontend always calls the gateway through its nginx proxy, targeting `GATEWAY_URL`:**
> - **Docker Compose:** `.env` sets `GATEWAY_URL=http://fashion-ecommerce-gateway:8000` (the Compose service name on `fashion-network`); the gateway container listens on `8000` and is published to the host as `3001:8000`.
> - **Kubernetes:** the `ecommerce-secrets` Secret provides `GATEWAY_SERVICE_URL=http://gateway-service:3001`; the `gateway-service` Service maps `port: 3001 → targetPort: 8000`.
>
> See [`fashion-ecommerce/frontend/README.md`](fashion-ecommerce/frontend/README.md) for details.

### 4. Try the API via the gateway

```bash
# Health check
curl http://localhost:3001/api/products/health

# List products (paginated, filterable)
curl "http://localhost:3001/api/products?page=1&limit=5&gender=men"

# Register a user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"<your-password>","first_name":"Demo","last_name":"User"}'
```

### 5. Stop / tear down

```bash
docker compose down          # stop containers (keeps volumes)
docker compose down -v       # stop containers and delete volumes (fresh DB next time)
```
---

## Observability

Both deployment implementations export the **same `/metrics` endpoint** from every service — same FastAPI middleware (`app/core/metrics.py`), same metric names (`http_requests_total`, `http_request_duration_seconds`, `http_requests_in_progress`, `service_info`). **What differs is how Prometheus discovers the targets and how the dashboard gets installed.**

### With Docker Compose (local)

- Prometheus uses the **static job list** in [`prometheus/prometheus.yml`](prometheus/README.md) — one job per service, scraped every 15s via Compose service names.
- Grafana (`:8080`) auto-provisions its Prometheus datasource from [`grafana/provisioning/datasources/prometheus.yml`](grafana/README.md).

### With Kubernetes (EKS)

- Prometheus (from the kube-prometheus-stack Helm chart) discovers targets dynamically through the **`ecommerce-services` ServiceMonitor** ([`gitops/k8s/backend/service-monitor.yml`](gitops/README.md)), which selects Services by label and labels targets `job=<service-name>`.
- The Grafana sidecar auto-installs the **"Ecommerce Microservices"** dashboard (`uid: ecommerce-microservices`) from the [`gitops/k8s/grafana-dashboard.yml`](gitops/README.md) ConfigMap, so neither deployment needs manual datasource or dashboard setup.

### The dashboard

Both deployments provision the same **"Ecommerce Microservices"** dashboard (uid `ecommerce-microservices`), but each copy shows only what its own platform can actually produce:

- **Docker Compose** ([`grafana/README.md`](grafana/README.md)) — 11 panels: request rate, latency, in-progress requests, error rate, Python process CPU/memory per service, container CPU/memory via cAdvisor (grouped by `container`), service health, and 4xx/5xx rates — with a per-service dropdown.
- **Kubernetes** ([`gitops/README.md`](gitops/README.md)) — the same panels scoped per pod, **plus** a "Pod Restart Count" panel fed by kube-state-metrics.

---

## Deploy with Kubernetes (AWS EKS + Argo CD)

> **What this deploys:** the production path. Terraform provisions the AWS foundation (VPC, EKS cluster, ECR repositories, Argo CD + kube-prometheus-stack), the CI pipeline pushes container images to ECR, and the `gitops/` manifests run the workload in the `ecommerce` namespace.
>
> **How it differs from Docker Compose:** configuration comes from the `ecommerce-secrets` Kubernetes **Secret** (not a local `.env`), service discovery uses in-cluster DNS (`auth-service:3002` instead of `fashion-ecommerce-auth:8000`), the database is a **StatefulSet** with a PVC (not a named volume), and updates flow through **Argo CD / `kubectl`** instead of `docker compose`.

### 1. Provision infrastructure with Terraform

```bash
cd infrastructure
terraform init
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

This creates the VPC, the EKS cluster (1–3 `t3.medium` nodes), 6 ECR repositories (`frontend`, `gateway`, `auth`, `products`, `orders`, `users`), installs Argo CD + kube-prometheus-stack, and outputs `cluster_name`, `cluster_endpoint`, and `ecr_urls`.

### 2. Build and push images to ECR

Either let the CI pipeline do it (GitHub → **Actions** → *E-Commerce Platform CI Pipeline* → **Run workflow** — it builds and pushes all six images and bumps the manifest tags in one pass, see [CI / CD](#ci--cd)), or do it manually: build and push each service image to the repos from `terraform output ecr_urls` (e.g. `<AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/auth:<sha>`). Repository names must match the Terraform `repositories` list — unlike Docker Compose, images are **not** built on the deployment host.

The manifests themselves keep short, registry-agnostic names (`ecommerce-<service>:latest`); Argo CD's Kustomize `images` override — injected by the Terraform `argocd` module from `var.ecr_urls` — rewrites them to the real ECR URLs at sync time (see [CD — GitOps with Argo CD](#cd--gitops-with-argo-cd-kubernetes-only)).

### 3. Deploy the application (Argo CD)

No separate registration step: the Argo CD `Application` is created **by Terraform** — the `argocd` module adds it through the `argo-cd` Helm release's `extraObjects` ([`infrastructure/modules/argocd/main.tf`](infrastructure/README.md)), so `terraform apply` installs Argo CD *and* the `ecommerce` Application in one pass. It syncs the `gitops/` Kustomize tree into the `ecommerce` namespace with automated prune + self-healing, injecting config from the `ecommerce-secrets` Secret, and its Kustomize `images` override maps the manifests' short `ecommerce-<service>` names to the ECR URLs from `module.ecr.repository_urls`.

### Ports / service names on Kubernetes

| Service  | Manifest                              | ClusterIP service    | Port → targetPort |
| -------- | ------------------------------------- | -------------------- | ------------------ |
| Gateway  | `gitops/k8s/backend/gateway.yml`      | `gateway-service`    | `3001 → 8000`      |
| Auth     | `gitops/k8s/backend/auth.yml`         | `auth-service`       | `3002 → 8000`      |
| Products | `gitops/k8s/backend/products.yml`     | `products-service`   | `3003 → 8000`      |
| Orders   | `gitops/k8s/backend/orders.yml`       | `orders-service`     | `3004 → 8000`      |
| Users    | `gitops/k8s/backend/users.yml`        | `users-service`      | `3005 → 8000`      |
| Frontend | `gitops/k8s/frontend/deployment.yml`  | `frontend-service`   | `80 → 80`          |
| Postgres | `gitops/k8s/database/statefulset.yml` | `postgres-service` (headless) | `5432 → 5432` |

> **Note:** the Deployments reference short image names such as `ecommerce-gateway:latest`. Argo CD rewrites these to the ECR URLs supplied by Terraform's kustomize `images` override, so no account ID is committed to git. If you apply the manifests **without** Argo CD (plain `kubectl apply -k gitops`), the short names are left untouched — add a kustomize `images:` override for your ECR URLs first.

---

## CI / CD

| Stage              | Tool                                                                     | What it does                                                                  |
| ------------------ | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| CI — build & push  | GitHub Actions — [`.github/workflows/ci.yml`](.github/workflows/ci.yml)  | Builds all 6 images and pushes them to ECR tagged with the commit SHA.        |
| Manifest promotion | Same workflow, `update-manifests` job                                     | Rewrites the image tags in `gitops/k8s/**/*.yml` to the new SHA and commits.  |
| CD — deploy        | Argo CD — `Application` created by the Terraform `argocd` module ([`infrastructure/`](infrastructure/README.md)) | Auto-syncs `gitops/` into the `ecommerce` namespace (prune + self-heal).      |

### CI — GitHub Actions (`.github/workflows/ci.yml`)

The pipeline runs on **manual dispatch** (`workflow_dispatch`) — deliberately not `on: push`, because its own `update-manifests` job commits to `main`; a push trigger would re-run the pipeline on that commit in a loop.

**Job 1 — `build-and-push`** — a matrix over `auth`, `gateway`, `orders`, `products`, `users`, `frontend`:

1. Configures AWS credentials and logs in to Amazon ECR.
2. Builds the image — backends from `fashion-ecommerce/backend/services/<service>`, the frontend from `fashion-ecommerce/frontend`.
3. Tags it `<AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/<service>:<commit-sha>` and pushes it to ECR.

**Job 2 — `update-manifests`** (needs the build):

1. Rewrites the image tag in each backend manifest (`gitops/k8s/backend/<service>.yml`) and the frontend deployment (`gitops/k8s/frontend/deployment.yml`) to the new `<commit-sha>`.
2. Commits and pushes the change as `github-actions` → Argo CD sees the new revision and syncs the cluster.

One manual run therefore carries a change the whole way: **images in ECR → manifests updated in git → Argo CD deploys them**.

**Required repository secrets:** `AWS_ACCOUNT_ID`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`.

> **Note:** the committed manifests use short names (`ecommerce-<service>`) with **no** account ID or registry baked in. The `update-manifests` job rewrites the tag on those short names (`image: ecommerce-<service>:<commit-sha>`), while the Argo CD Application's Kustomize `images` override supplies the ECR repository URL. Because the registry stays out of git, there is **no `<AWS_ACCOUNT_ID>` placeholder to replace** before the first run.

### CD — GitOps with Argo CD (Kubernetes only)

- The `ecommerce` Application is created by the Terraform `argocd` module ([`infrastructure/modules/argocd`](infrastructure/README.md), **not** a manifest under `gitops/`) as part of the `argo-cd` Helm release's `extraObjects`. It points at this repository (`path: gitops`, `branch: main`) and continuously syncs the manifests into the cluster with auto-prune + self-heal — the CI pipeline's manifest-bump commits are what it picks up. Its Kustomize `images` override replaces the manifests' `ecommerce-<service>` names with the ECR URLs from `module.ecr.repository_urls`.
- **Kustomize** (`gitops/kustomization.yml`) composes the Kubernetes manifests (namespace, secrets, database, backend, frontend, ServiceMonitor, dashboard) and plays no role in the Docker Compose deployment.
- **Docker Compose has no CI/CD** — `docker compose up -d --build` builds the images locally on the host; ECR and this pipeline are only involved in the Kubernetes deployment.

---
