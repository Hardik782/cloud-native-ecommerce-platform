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

# Only substitute GATEWAY_URL, leave any other $vars alone
ENV NGINX_ENVSUBST_FILTER=GATEWAY_URL

# The entrypoint picks this up and writes /etc/nginx/conf.d/default.conf
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]