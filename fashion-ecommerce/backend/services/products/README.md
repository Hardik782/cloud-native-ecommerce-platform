# Products Service

Product catalog management for the fashion e-commerce platform — powered by FastAPI + async SQLAlchemy, backed by the `products_db` PostgreSQL database.

## Endpoints

The gateway serves every route below at `http://localhost:3001/api/products/…`.

| Method | Path                    | Description                                  |
| ------ | ----------------------- | -------------------------------------------- |
| GET    | `/api/products`         | List products with filtering + pagination    |
| GET    | `/api/products/genders` | List available genders (`men`, `women`, `unisex`, `all`) |
| GET    | `/api/products/{product_id}` | Fetch a single published product         |
| GET    | `/api/products/health`  | Service health check                         |
| GET    | `/health`               | Root health check                            |
| GET    | `/metrics`              | Prometheus metrics                           |

### `GET /api/products` — query parameters

| Parameter  | Type             | Default      | Description                                        |
| ---------- | ---------------- | ------------ | -------------------------------------------------- |
| `page`     | int ≥ 1          | `1`          | Page number                                        |
| `limit`    | int 1–100        | `12`         | Items per page                                     |
| `gender`   | `men`/`women`/`unisex`/`all` | — | Gender filter; `unisex` products appear only under `unisex`/`all` |
| `category` | string           | —            | Filter by category name                            |
| `search`   | string           | —            | Case-insensitive match on name/description/brand   |
| `min_price` / `max_price` | float | —       | Price range filter                                |
| `sort_by`  | `created_at`/`price`/`name` | `created_at` | Sort field                            |
| `sort_order`| `asc`/`desc`     | `desc`       | Sort direction                                     |

Response shape:

```json
{
  "products": [
    { "id": "…", "name": "…", "brand": "…", "price": 149.99, "gender": "men",
      "category": { "name": "…" }, "images": [ { "url": "…", "is_primary": true } ],
      "sizes": [ "S", "M", "L" ], "status": "published" }
  ],
  "pagination": {
    "current_page": 1, "total_pages": 10, "total": 120,
    "has_next": true, "has_prev": false
  }
}
```

The endpoint returns only products with `status = published`.

## Models

Defined in `app/models/product.py`:

| Model          | Table            | Notes                                        |
| -------------- | ---------------- | -------------------------------------------- |
| `Product`      | `products`       | name, slug, sku, brand, price, gender, inventory, `status` (`draft`/`published`/`archived`) |
| `Category`     | `categories`     | hierarchical (`parent_id`), gender-tagged    |
| `ProductImage` | `product_images` | `image_url`, `alt_text`, `is_primary`, `sort_order` |
| `ProductSize`  | `product_sizes`  | size + gender + inventory, unique per product|

Product lists eager-load images, sizes and category via `selectinload`.

## Environment variables

| Variable       | Required | Description                                  |
| -------------- | -------- | -------------------------------------------- |
| `SERVICE_NAME` | yes      | Service identity, e.g. `products`            |
| `SERVICE_PORT` | yes      | Port the app listens on inside the container |
| `DATABASE_URL` | yes      | `postgresql://user:pass@host:port/products_db` |

Injected by Docker Compose (root `.env`), Kubernetes (`ecommerce-secrets`), or a local `.env` (see `.env.example`).

## Local development

```bash
cd fashion-ecommerce/backend/services/products
python -m venv venv
source venv/bin/activate          # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
# export DATABASE_URL, SERVICE_NAME=products, SERVICE_PORT=8000
uvicorn app.main:app --reload --port 8000
```

The service creates tables automatically on startup; the Postgres init scripts (`fashion-ecommerce/database/init/03-seed-data.sql`) supply the seed data.

## Docker

```bash
docker build -t ecommerce-products .
docker run --rm -p 3003:8000 \
  -e SERVICE_NAME=products -e SERVICE_PORT=8000 \
  -e DATABASE_URL=postgresql://<db-user>:<db-password>@host.docker.internal:5432/products_db \
  ecommerce-products
```

In the full stack (`docker compose up`), Docker Compose publishes the service at `http://localhost:3003`.

## Observability

`/metrics` via the shared FastAPI middleware — `http_requests_total`, `http_request_duration_seconds`, `http_requests_in_progress`, `service_info`. Scraped by Prometheus every 15s.

## API docs

- Swagger UI: http://localhost:3003/docs
- ReDoc: http://localhost:3003/redoc

## Testing

```bash
pytest
```
