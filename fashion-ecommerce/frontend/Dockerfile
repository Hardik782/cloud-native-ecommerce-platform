# frontend/Dockerfile

# ---------- Build stage ----------
FROM node:20-alpine AS build

WORKDIR /app

# Install deps first for better layer caching
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the source and build
COPY . .
RUN npm run build

# ---------- Serve stage ----------
FROM nginx:1.27-alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built app
COPY --from=build /app/build /usr/share/nginx/html

# Custom nginx config (SPA fallback for React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]