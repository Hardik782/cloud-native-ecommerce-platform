# Fashion E-Commerce Frontend

A minimal, elegant React storefront built with Create React App, React Router v6,
and the Context API (no Redux, no external UI kits).

## Getting Started

1. Install dependencies:
npm install

2. Make sure your backend API is running at the URL set in `.env`
   (`REACT_APP_API_URL`, defaults to `http://localhost:3001/api`).
3. Start the dev server:

npm start
   The app runs at `http://localhost:3000` and hot-reloads on changes.

## Structure

- `src/api` — axios client + endpoint wrappers (auth, products, orders, users)
- `src/contexts` — Auth, Cart, and Wishlist state (Cart/Wishlist persist to localStorage)
- `src/components` — shared layout, header/footer, and product UI
- `src/pages` — route-level screens (Home, Products, Product Detail, Cart,
  Wishlist, Login, Register, Profile, Orders)

## Notes

- JWT is stored in `localStorage` under `token`; the axios client attaches it
  automatically and clears it on a 401 response.
- Wishlist and Cart persist across reloads via `localStorage`.
- Update `.env` if your backend runs on a different host/port.
