# Fashion E-Commerce Frontend

A minimal, elegant React storefront for the fashion e-commerce platform. Built with **Create React App**, **React Router v6**, and the **Context API** (no Redux, no external UI kits).

## Features

- Home, Products (with gender tabs + filters), Product Detail, Cart, Wishlist, Login, Register, Profile, and Orders pages.
- The app persists Cart & Wishlist to `localStorage` and manages the JWT session with an automatic 401 → logout redirect.
- Responsive layout with a shared `Header` / `Footer` and product card components.
- Ships as the production bundle that nginx serves, proxying `/api` to the API Gateway.

## Getting Started (development)

1. Install dependencies:

   ```bash
   npm install
   ```

2. Make sure the backend stack is running (from the repository root: `docker compose up -d --build` — gateway on `localhost:3001`).

3. Start the dev server:

   ```bash
   npm start
   ```

   The app runs at `http://localhost:3000` with hot reload.

> The API client uses a **relative `/api` base** (`src/api/client.js`), so in development requests go to the same origin that serves the app. To run the frontend and gateway on different hosts/ports, set `REACT_APP_API_URL` in a local `.env` (Create React App only exposes build-time `REACT_APP_*` vars) and adjust `src/api/client.js` accordingly.

## Production build (Docker image)

Both deployments run the same image build — Compose and EKS/ECR both use this `Dockerfile`:

```bash
docker build -t ecommerce-frontend .
docker run --rm -p 80:80 ecommerce-frontend
```

The multi-stage `Dockerfile`:

- **stage 1** — `node:20-alpine`: `npm install` → `npm run build`.
- **stage 2** — `nginx:1.27-alpine`: serves the static bundle, with an `nginx.conf` that adds long-lived caching for assets/product images, an SPA fallback (`try_files … /index.html`) for React Router, and a `/api/` reverse proxy to the API gateway.

### Where nginx sends `/api` — same mechanism in both deployments

The image ships `nginx.conf.template`, rendered at container start by substituting the `GATEWAY_URL`
environment variable into the `/api/` reverse proxy (`proxy_pass ${GATEWAY_URL}/api/`).

- **Docker Compose:** `GATEWAY_URL` defaults to `http://fashion-ecommerce-gateway:8000` (root `.env.example`). The gateway container listens on `8000`.
- **Kubernetes:** `GATEWAY_URL` comes from the `ecommerce-secrets` Secret (`GATEWAY_SERVICE_URL=http://gateway-service:3001`). The `gateway-service` ClusterIP Service maps `port: 3001` → `targetPort: 8000`.

> nginx resolves the upstream hostname once at startup. If the gateway container restarts with a new IP and `/api` starts returning 502, reload the frontend with `docker compose restart frontend` (Compose) or restart the frontend pods (Kubernetes).

### Where the storefront is reachable — differs by deployment

The container listens on port **`80` in both deployments** (nginx `listen 80`); only the access path differs:

- **Docker Compose:** `ports: - "80:80"` publishes the container straight to the host, so the storefront answers at **`http://localhost`** — with no port-forward.
- **Kubernetes:** Kubernetes exposes `frontend-service` as a **ClusterIP** on port `80`, which keeps it off the public internet. Reach it with `kubectl -n ecommerce port-forward svc/frontend-service 4000:80` → `http://localhost:4000`, or through an ingress/LoadBalancer if one exists.

## Project structure

```
src/
├── api/          # axios client + endpoint wrappers (client, auth, products, orders, users)
├── contexts/     # Auth, Cart, Wishlist state (Cart/Wishlist persist to localStorage)
├── components/   # layout, header/footer, common UI, product cards
├── pages/        # route-level screens (Home, Products, ProductDetail, Cart, Wishlist,
│                 # Login, Register, Profile, Orders)
└── utils/        # helpers (e.g. price formatting)
```

## Notes

- The app stores the JWT in `localStorage` under `token`; the axios client attaches `Authorization: Bearer <token>` automatically and clears the session on a 401 response (`src/api/client.js`).
- Wishlist and Cart persist across reloads via `localStorage`.
- React Router v6 routes wrap Profile and Orders in `ProtectedRoute`.

## Repository link

Part of the [`cloud-native-ecommerce-platform`](../README.md) repo. The gateway it talks to is [`../backend/services/gateway`](../backend/services/gateway/README.md).
