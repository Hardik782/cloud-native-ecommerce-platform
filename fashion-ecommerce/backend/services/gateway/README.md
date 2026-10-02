# Gateway Service

The **API Gateway** — the single entrypoint for all backend traffic in the fashion e-commerce platform. The React frontend only talks to this service; the gateway server-side proxies requests to the appropriate microservice.

## How it works

`app/routes/proxy.py` implements a catch-all:

- Router prefix: `/api`
- For each incoming request it maps the path prefix to an upstream base URL:

  | Path prefix | Upstream service | Compose URL (default) |
  | ----------- | ---------------- | --------------------- |
  | `/auth`     | `AUTH_URL`       | `http://fashion-ecommerce-auth:8000` |
  | `/products` | `PRODUCTS_URL`   | `http://fashion-ecommerce-products:8000` |
  | `/orders`   | `ORDERS_URL`     | `http://fashion-ecommerce-orders:8000` |
  | `/users`    | `USERS_URL`      | `http://fashion-ecommerce-users:8000` |

- The gateway rewrites the URL to `<upstream>/api/<path>`, preserves the query string and headers (dropping `Host`), and forwards `POST`/`PUT`/`PATCH` bodies.
- The gateway streams responses back verbatim (status code + headers + body). Unknown prefixes return `404`.

## Error handling

| Situation                     | Response                            |
| ----------------------------- | ----------------------------------- |
| Timeout (`httpx.TimeoutException`) | `504 Gateway timeout`           |
| Downstream unreachable (`ConnectError`) | `503 Service unavailable` |
| Upstream 4xx/5xx              | Passed through as-is                |

## Endpoints

| Method         | Path          | Description                          |
| -------------- | ------------- | ------------------------------------ |
| `*`            | `/api/{path}` | Proxy to the matching microservice   |
| GET            | `/health`     | Gateway health check                 |
| GET            | `/metrics`    | Prometheus metrics                   |

Example calls through the gateway:

```bash
curl http://localhost:3001/api/products/health
curl "http://localhost:3001/api/products?gender=women&page=2"
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@fashion.com","password":"..."}'
```

## Environment variables

| Variable        | Required | Description                                    |
| --------------- | -------- | ---------------------------------------------- |
| `SERVICE_NAME`  | yes      | Service identity, e.g. `gateway`               |
| `SERVICE_PORT`  | yes      | Port the app listens on inside the container (`8000` in both deployments; host publishing differs — see below) |
| `AUTH_URL`      | yes      | Base URL of the auth service                   |
| `PRODUCTS_URL`  | yes      | Base URL of the products service               |
| `ORDERS_URL`    | yes      | Base URL of the orders service                 |
| `USERS_URL`     | yes      | Base URL of the users service                  |

Injected by Docker Compose (root `.env`), Kubernetes (`ecommerce-secrets`), or a local `.env` (see `.env.example`). On Kubernetes the values use service DNS (`http://auth-service:3002`, etc.).

## How the frontend reaches the gateway

The frontend image renders `nginx.conf.template` at container start, substituting the `GATEWAY_URL`
environment variable into the `/api/` reverse-proxy upstream (`proxy_pass ${GATEWAY_URL}/api/`).

- **Docker Compose:** `GATEWAY_URL` defaults to `http://fashion-ecommerce-gateway:8000` (see root `.env.example`). The gateway container listens on `8000` (`SERVICE_PORT=8000`) and Compose publishes it to the host as `3001:8000`, so `http://localhost:3001` works from the host while containers talk to port `8000`.
- **Kubernetes:** `GATEWAY_URL` comes from the `ecommerce-secrets` Secret (`GATEWAY_SERVICE_URL=http://gateway-service:3001`). The `gateway-service` ClusterIP Service exposes `port: 3001` → `targetPort: 8000`, so the container also listens on `8000` there.

Either way the frontend image needs no edits — only the `GATEWAY_URL` value differs per deployment.

## Local development

```bash
cd fashion-ecommerce/backend/services/gateway
python -m venv venv
source venv/bin/activate          # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
# .env: point the *_URL vars at running services; run those services first
uvicorn app.main:app --reload --port 8000
```

The service creates an `httpx.AsyncClient(timeout=30)` HTTP client at startup and closes it on shutdown.

## Docker

Standalone (`SERVICE_PORT=8000` inside the container, published on host 3001):

```bash
docker build -t ecommerce-gateway .
docker run --rm -p 3001:8000 \
  -e SERVICE_NAME=gateway -e SERVICE_PORT=8000 \
  -e AUTH_URL=http://host.docker.internal:3002 \
  -e PRODUCTS_URL=http://host.docker.internal:3003 \
  -e ORDERS_URL=http://host.docker.internal:3004 \
  -e USERS_URL=http://host.docker.internal:3005 \
  ecommerce-gateway
```

In the full stack (`docker compose up`), Compose builds this same image and runs it with `ports: "3001:8000"` — the container listens on **8000** (`SERVICE_PORT=8000` from the root `.env`) and the host port is `3001`. The frontend's nginx reaches the container directly by its Compose service name, **`fashion-ecommerce-gateway:8000`** (the `GATEWAY_URL` value from the root `.env`) — see the [frontend README](../../../frontend/README.md). The `gateway-service` DNS name (`http://gateway-service:3001`) is the **Kubernetes** ClusterIP Service, not the Compose name.

## Observability

Same shared Prometheus middleware as every service (`app/core/metrics.py`), exposing `/metrics` — request counters, latency histogram, in-progress gauge, and service info.

Prometheus scrapes this service at **`fashion-ecommerce-gateway:8000`** under Docker Compose — see [`prometheus/prometheus.yml`](../../../../prometheus/README.md) (port 8000, matching the container's listen port). Under Kubernetes the ServiceMonitor discovers it by label instead.

## API docs

- Swagger UI: http://localhost:3001/docs
- ReDoc: http://localhost:3001/redoc

## Testing

```bash
pytest
```
