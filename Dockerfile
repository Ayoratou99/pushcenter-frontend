# ---------------------------------------------------------------------------
# Stage 1: build the static bundle
# ---------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies from the lockfile first so this layer is cached.
COPY package.json package-lock.json .npmrc ./
RUN npm ci --no-audit --no-fund

# Build
COPY . .
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2: serve it with nginx
# ---------------------------------------------------------------------------
FROM nginxinc/nginx-unprivileged:alpine-slim

USER root

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

# The bundle reads window.__APP_CONFIG__ at runtime, so one image can serve any
# environment: this entrypoint rewrites config.js from the container env.
COPY docker-entrypoint.d/10-runtime-config.sh /docker-entrypoint.d/10-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/10-runtime-config.sh \
    && chown -R nginx:nginx /usr/share/nginx/html

USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
