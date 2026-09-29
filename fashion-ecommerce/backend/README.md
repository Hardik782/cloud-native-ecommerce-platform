# Backend

Python **FastAPI** microservices for the fashion e-commerce platform (Python 3.11+, async SQLAlchemy, Pydantic v2).

```
backend/
├── pyproject.toml      # Shared dev tooling configuration (black, ruff, mypy, pytest)
├── requirements.txt    # Backend-wide dev/test dependencies
└── services/
    ├── auth/           # Authentication & user management (JWT, bcrypt)
    ├── gateway/        # API gateway / reverse proxy (single entrypoint)
    ├── orders/         # Order processing (endpoint stubs)
    ├── products/       # Product catalog (list, filter, paginate, detail)
    └── users/          # User profile management (endpoint stubs)
```

## Services

| Service  | Port (host) | Role                                                     | README |
| -------- | ----------- | -------------------------------------------------------- | ------ |
| gateway  | 3001        | Server-side proxy for `auth`, `products`, `orders`, `users` | [gateway](services/gateway/README.md) |
| auth     | 3002        | Register/login/logout, JWT issuance & validation, user mgmt | [auth](services/auth/README.md) |
| products | 3003        | Product catalog with filtering, pagination, search       | [products](services/products/README.md) |
| orders   | 3004        | Order creation / history (contract stubs)                | [orders](services/orders/README.md) |
| users    | 3005        | Profile & addresses (contract stubs)                     | [users](services/users/README.md) |

> Host ports apply to Docker Compose and are the `ClusterIP` ports on Kubernetes; every service listens on **8000** inside its container.

## Shared conventions

Every service follows the same layout and conventions:

- `app/main.py` — FastAPI app with CORS, metrics middleware, health endpoints and routers.
- `app/core/config.py` — pydantic-settings `Settings` class reading everything from env vars (`SERVICE_NAME`, `SERVICE_PORT`, `DATABASE_URL`, …).
- `app/core/database.py` — async SQLAlchemy engine + session dependency; the service runs `Base.metadata.create_all` at startup to create tables.
- `app/core/metrics.py` — shared Prometheus middleware exposing `/metrics`.
- `/health`, `/api/<service>/health` where applicable, `/docs` (Swagger), `/redoc`.
- Runtime image: `python:3.11-slim`, entrypoint `uvicorn app.main:app --host 0.0.0.0 --port "$SERVICE_PORT"`.

## Local development

```bash
# From the repository root, run the whole stack:
#   cp .env.example .env && docker compose up -d --build
#     → postgres, prometheus, grafana, all services, gateway, frontend

# Or run a single service in isolation, e.g. products:
cd services/products
python -m venv venv
source venv/bin/activate          # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # if present; otherwise export required vars
uvicorn app.main:app --reload --port 8000
```

### Tooling

Configured centrally in `pyproject.toml` (line-length 100, Python 3.11 target):

```bash
pip install -r requirements.txt   # pytest, black, ruff, mypy + plugins

black .                 # format
ruff check .            # lint
mypy services           # type check
pytest                  # run tests (per-service)
```

## API reference

Each service ships its own interactive docs:
- Swagger UI: `http://localhost:<port>/docs`
- ReDoc: `http://localhost:<port>/redoc`

All endpoints are also reachable through the gateway at `http://localhost:3001/api/<service>/…`.

## Repository link

This directory is part of the [`cloud-native-ecommerce-platform`](../README.md) repo. Kubernetes manifests and Terraform infra live outside this folder (see the `gitops/` and `infrastructure/` directories at the repo root).