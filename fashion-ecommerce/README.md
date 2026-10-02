# Fashion E-Commerce

Application source code for the cloud-native e-commerce platform — the React storefront, the FastAPI microservices, and the PostgreSQL provisioning scripts.

```
fashion-ecommerce/
├── backend/       # Python 3.11 FastAPI microservices (+ shared dev tooling)
├── database/      # PostgreSQL init scripts: schema, seed data, verification
└── frontend/      # React 18 storefront (Create React App, React Router v6)
```

## Components

| Path                    | Description                                                        |
| ----------------------- | ------------------------------------------------------------------ |
| [`backend/`](backend/README.md)   | `auth`, `gateway`, `orders`, `products`, `users` services           |
| [`database/`](database/README.md) | DB bootstrapping: `init/` (auto-run on first container start) and `maintenance/` SQL |
| [`frontend/`](frontend/README.md) | Browser SPA — product browsing, cart, wishlist, auth, orders        |

## How the pieces fit together

- **Frontend** (`frontend/`) calls only the **Gateway** (`backend/services/gateway`) — a FastAPI reverse proxy that forwards `/api/auth`, `/api/products`, `/api/orders` and `/api/users` to the right service.
- Each backend service reads all configuration from environment variables that Docker Compose (root `.env`), Kubernetes (the `ecommerce-secrets` Secret) or a local `.env` file provides.
- Docker Compose mounts the `database/init/` scripts into the PostgreSQL container's `/docker-entrypoint-initdb.d`, and Kubernetes mounts them from an equivalent ConfigMap (`gitops/k8s/database/configmap.yml`). The scripts create the per-service databases (`auth_db`, `products_db`, `orders_db`, `users_db`), their tables, and demo seed data.

## Running locally

The simplest way is at the **repository root** — follow the [Docker Compose deployment guide in the root README](../README.md#deploy-with-docker-compose-local-development) (`cp .env.example .env`, then `docker compose up -d --build`).

For per-service development instructions see each service's README under `backend/services/`.