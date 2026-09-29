# Users Service

User profile and preferences management for the fashion e-commerce platform. Served behind the **API Gateway** at `/api/users/*` and backed by the `users_db` PostgreSQL database.

> **Status:** the service defines the API surface/contract and serves live health/metrics endpoints. Profile and address endpoints currently return documented placeholder responses — implement the storage logic in a follow-up iteration.

## Endpoints

| Method | Path                | Description                              |
| ------ | ------------------- | ---------------------------------------- |
| GET    | `/api/users/me`     | Current user's profile *(stub)*          |
| PUT    | `/api/users/me`     | Update current user's profile *(stub)*   |
| POST   | `/api/users/addresses` | Add a shipping address *(stub)*       |
| GET    | `/api/users/health` | Service health check                     |
| GET    | `/health`           | Root health check                        |
| GET    | `/metrics`          | Prometheus metrics                       |

## Environment variables

| Variable       | Required | Description                                  |
| -------------- | -------- | -------------------------------------------- |
| `SERVICE_NAME` | yes      | Service identity, e.g. `users`               |
| `SERVICE_PORT` | yes      | Port the app listens on inside the container |
| `DATABASE_URL` | yes      | `postgresql://user:pass@host:port/users_db`  |

Injected by Docker Compose (root `.env`), Kubernetes (`ecommerce-secrets`), or a local `.env` (see `.env.example`).

## Local development

```bash
cd fashion-ecommerce/backend/services/users
python -m venv venv
source venv/bin/activate          # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
# export DATABASE_URL, SERVICE_NAME=users, SERVICE_PORT=8000
uvicorn app.main:app --reload --port 8000
```

## Docker

```bash
docker build -t ecommerce-users .
docker run --rm -p 3005:8000 \
  -e SERVICE_NAME=users -e SERVICE_PORT=8000 \
  -e DATABASE_URL=postgresql://<db-user>:<db-password>@host.docker.internal:5432/users_db \
  ecommerce-users
```

In the full stack (`docker compose up`), Docker Compose publishes the service at `http://localhost:3005`.

## Observability

`/metrics` via the shared FastAPI middleware — `http_requests_total`, `http_request_duration_seconds`, `http_requests_in_progress`, `service_info`. Scraped by Prometheus every 15s.

## API docs

- Swagger UI: http://localhost:3005/docs
- ReDoc: http://localhost:3005/redoc

## Testing

```bash
pytest
```
