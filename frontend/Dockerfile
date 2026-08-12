# Production image. Dockerfile.dev is the one docker-compose.yml uses.
#
# Vite inlines VITE_* variables at build time, so they are build args, not
# runtime env. A given image is bound to the API origin it was built against.
FROM oven/bun:1 AS build
WORKDIR /app
COPY bun.lock package.json ./
RUN bun install --frozen-lockfile
COPY . .

ARG VITE_API_BASE_URL
ARG VITE_WEBSOCKET_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_WEBSOCKET_URL=${VITE_WEBSOCKET_URL}

RUN bun run build

FROM nginxinc/nginx-unprivileged:1-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
