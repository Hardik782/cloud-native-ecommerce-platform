# Database

PostgreSQL provisioning for the fashion e-commerce platform — schema, seed data and housekeeping SQL.

```
database/
├── init/            # Run automatically on first container start (docker-entrypoint-initdb.d)
│   ├── 01-create-databases.sh   # Creates auth_db, products_db, orders_db, users_db
│   ├── 02-schema.sql            # Tables for all four databases
│   ├── 03-seed-data.sql         # Categories, products, sizes, images, demo users
│   └── 04-verify.sql            # Row-count verification queries
└── maintenance/     # Manual housekeeping scripts
    ├── dedupe-products.sql      # Removes duplicate products (keeps first row)
    └── verify-dedupe.sql        # Verifies deduplication results
```

## Database topology

One PostgreSQL 15 server hosts **four logical databases**, one per microservice:

| Database        | Owned by service | Key tables                                              |
| --------------- | ---------------- | ------------------------------------------------------- |
| `auth_db`       | auth             | `users` (email, password_hash, role, …)                  |
| `products_db`   | products         | `categories`, `products`, `product_sizes`, `product_images` |
| `orders_db`     | orders           | (no tables yet — endpoints are contract stubs)           |
| `users_db`      | users            | `users` (profile data)                                   |

All tables use `UUID` primary keys (`uuid_generate_v4()`) and `created_at`/`updated_at` timestamps.

## How init scripts run

### Docker Compose

The PostgreSQL container mounts `database/init` into `/docker-entrypoint-initdb.d` (`docker-compose.yml`), so the scripts execute automatically — in filename order — the **first time** PostgreSQL initializes the volume:

```bash
docker compose up -d --build
```

To re-run from a clean state: `docker compose down -v && docker compose up -d`.

### Kubernetes

Kubernetes packs the same scripts into the `postgres-init-scripts` ConfigMap (`gitops/k8s/database/configmap.yml`) and mounts them into the Postgres **StatefulSet** at `/docker-entrypoint-initdb.d`.

## Seed data

`03-seed-data.sql` inserts:

- **Categories & ~40 products** across `men` / `women` / `unisex` genders with prices, descriptions, brands, sizes (e.g. S–XXXL depending on gender) and primary images.
- **Demo users** in both `auth_db` and `users_db`:
  - `admin@fashion.com` (role `admin`)
  - `customer@fashion.com` (role `customer`)
  - *(password hashes in the seed file are placeholders — register through the API on a fresh DB to get working credentials.)*

## Verification

Run `04-verify.sql` after seeding to confirm row counts:

```bash
docker compose exec postgres psql -U postgres -f /docker-entrypoint-initdb.d/04-verify.sql
```

or open an interactive shell on a database directly:

```psql
psql -U postgres -d products_db
```

## Maintenance scripts

- `maintenance/dedupe-products.sql` — collapses duplicate product rows (by name/sku), keeping the first occurrence and re-pointing child rows.
- `maintenance/verify-dedupe.sql` — checks that no duplicates remain.

Use them with `psql -U postgres -d products_db -f maintenance/dedupe-products.sql`.