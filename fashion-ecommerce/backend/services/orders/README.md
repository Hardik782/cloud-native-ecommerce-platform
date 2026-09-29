# Orders Service

Order processing and management for the fashion e-commerce platform. Served behind the **API Gateway** at `/api/orders/*` and backed by the `orders_db` PostgreSQL database.

> **Status:** the service defines the API surface/contract and serves live health/metrics endpoints. Order persistence (`create_order`, `get_order`, `get_my_orders`) currently returns documented placeholder responses — implement the storage logic once the frontend/checkout work fixes the contract.

## Endpoints

| Method | Path                 | Description                                          |
| ------ | -------------------- | ---------------------------------------------------- |
| POST   | `/api/orders/`       | Create an order *(stub)*                             |
| GET    | `/api/orders/my-orders` | Order history for the authenticated user *(returns `{ "orders": [] }`)* |
| GET    | `/api/orders/{order_id}` | Fetch a single order *(stub)*                    |
| GET    | `/api/orders/health` | Service health check                                 |
| GET    | `/health`            | Root health check                                    |
| GET    | `/metrics`           | Prometheus metrics                                   |

## Environment variables

| Variable              | Required | Description                                       |
| --------------------- | -------- | ------------------------------------------------- |
| `SERVICE_NAME`        | yes      | Service identity, e.g. `orders`                   |
| `SERVICE_PORT`        | yes      | Port the app listens on inside the container      |
| `DATABASE_URL`        | yes      | `postgresql://user:pass@host:port/orders_db`      |
| `AUTH_SERVICE_URL`    | yes      | Base URL of the auth service (for validating JWTs) |
| `PRODUCT_SERVICE_URL` | yes      | Base URL of the products service (for price/stock checks) |

Injected by Docker Compose (root `.env`), Kubernetes (`ecommerce-secrets`), or a local `.env` (see `.env.example`). In Kubernetes these use service DNS (`http://auth-service:3002`, `http://products-service:3003`).

## Local development

```bash
cd fashion-ecommerce/backend/services/orders
python -m venv venv
source venv/bin/activate          # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
# export DATABASE_URL, AUTH_SERVICE_URL, PRODUCT_SERVICE_URL, SERVICE_NAME=orders, SERVICE_PORT=8000
uvicorn app.main:app --reload --port 8000
```

## Docker

```bash
docker build -t ecommerce-orders .
docker run --rm -p 3004:8000 \
  -e SERVICE_NAME=orders -e SERVICE_PORT=8000 \
  -e DATABASE_URL=postgresql://<db-user>:<db-password>@host.docker.internal:5432/orders_db \
  -e AUTH_SERVICE_URL=http://host.docker.internal:3002 \
  -e PRODUCT_SERVICE_URL=http://host.docker.internal:3003 \
  ecommerce-orders
```

In the full stack (`docker compose up`), Docker Compose publishes the service at `http://localhost:3004`.

## Observability

`/metrics` via the shared FastAPI middleware — `http_requests_total`, `http_request_duration_seconds`, `http_requests_in_progress`, `service_info`. Scraped by Prometheus every 15s.

## API docs

- Swagger UI: http://localhost:3004/docs
- ReDoc: http://localhost:3004/redoc

## Testing

```bash
pytest
```
