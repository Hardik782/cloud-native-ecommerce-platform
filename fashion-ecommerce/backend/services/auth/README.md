# Auth Service

Authentication and user management for the fashion e-commerce platform.

- Issues short-lived **JWT access tokens** (HS256) on register/login.
- Stores users in its own `auth_db` database with **bcrypt**-hashed passwords.
- Supports two roles via the `User` model: `customer` and `admin`.
- Runs behind the **API Gateway**, which forwards `/api/auth/*` here.

## Endpoints

The gateway serves every route below at `http://localhost:3001/api/auth/…`.

| Method | Path                        | Description                                    | Auth |
| ------ | --------------------------- | ---------------------------------------------- | ---- |
| POST   | `/api/auth/register`        | Register a new user, returns JWT + user        | —    |
| POST   | `/api/auth/login`           | Authenticate, returns JWT + user               | —    |
| POST   | `/api/auth/logout`          | Client-side logout (client discards the token) | —    |
| GET    | `/api/auth/users/me`        | Current user's profile                         | Bearer |
| PUT    | `/api/auth/users/me`        | Update first/last name                         | Bearer |
| GET    | `/api/auth/users/{user_id}` | View a user by ID (self or admin only)         | Bearer |
| GET    | `/api/auth/health`          | Service health check                           | —    |
| GET    | `/health`                   | Root health check                              | —    |
| GET    | `/metrics`                  | Prometheus metrics                             | —    |

### Response shape

`register` and `login` return:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "<jwt>",
    "expires_in": 3600,
    "user": { "id": "…", "email": "…", "role": "customer", "first_name": "…" }
  }
}
```

The access token claims are `{"sub": <user_id>, "email": <email>, "role": <role>, "exp": <expiry>}`.

## Environment variables

| Variable         | Required | Default | Description                                  |
| ---------------- | -------- | ------- | -------------------------------------------- |
| `SERVICE_NAME`   | yes      | —       | Service identity, e.g. `auth` (metric label) |
| `SERVICE_PORT`   | yes      | —       | Port the app listens on inside the container |
| `DATABASE_URL`   | yes      | —       | `postgresql://user:pass@host:port/auth_db`   |
| `JWT_SECRET`     | yes      | —       | Signing secret (**change in production**)    |
| `JWT_ALGORITHM`  | yes      | —       | e.g. `HS256`                                 |
| `JWT_EXPIRES_IN` | yes      | —       | Token lifetime in seconds (default 3600)     |

Docker Compose (root `.env`), Kubernetes (the `ecommerce-secrets` Secret) or a local `.env` file supplies these values (see `.env.example`).

## Local development

```bash
cd fashion-ecommerce/backend/services/auth
python -m venv venv
source venv/bin/activate          # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # adjust DATABASE_URL / JWT_SECRET as needed
uvicorn app.main:app --reload --port 8000
```

Table creation (`users`) happens automatically on startup via `Base.metadata.create_all`.

## Docker

```bash
docker build -t ecommerce-auth .
docker run --rm -p 3002:8000 \
  -e SERVICE_NAME=auth -e SERVICE_PORT=8000 \
  -e DATABASE_URL=postgresql://<db-user>:<db-password>@host.docker.internal:5432/auth_db \
  -e JWT_SECRET=<your-jwt-secret> -e JWT_ALGORITHM=HS256 -e JWT_EXPIRES_IN=3600 \
  ecommerce-auth
```

In the full stack (`docker compose up`), Docker Compose publishes the service at `http://localhost:3002`.

## Observability

The shared middleware in `app/core/metrics.py` generates `/metrics` — counters/histograms/gauges for `http_requests_total`, `http_request_duration_seconds`, `http_requests_in_progress`, `service_info`. Prometheus scrapes it every 15s under Docker Compose and through the `ecommerce-services` ServiceMonitor under Kubernetes.

## API docs

- Swagger UI: http://localhost:3002/docs
- ReDoc: http://localhost:3002/redoc

## Testing

```bash
pytest
```
