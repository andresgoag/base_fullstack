# Implementation Plan: Fix Frontend Dockerfile and Add CI Pipeline

**Last Updated:** 2026-02-28

## Executive Summary

Two tightly related infrastructure tasks:

1. Fix `frontend/Dockerfile.dev` so it uses the official Bun image instead of the Node.js image.
2. Add a GitHub Actions workflow (`test_pr`) that builds all Docker services using the GitHub Actions cache and runs the backend pytest suite.

---

## Task 1: Fix `frontend/Dockerfile.dev`

### Problem

`frontend/Dockerfile.dev` declares `FROM node:22` but calls `bun install --frozen-lockfile`. The Node.js 22 image does not include Bun.

### Fix

Replace `FROM node:22` with `FROM oven/bun:1` (official Bun Docker image).

### Updated file

```dockerfile
FROM oven/bun:1
WORKDIR /app
COPY bun.lock package.json ./
RUN bun install --frozen-lockfile
COPY . .
ENV HOST=0.0.0.0
```

---

## Task 2: GitHub Actions Workflow `test_pr`

### Files to modify/create

| File | Action |
|---|---|
| `frontend/Dockerfile.dev` | Line 1: `FROM node:22` → `FROM oven/bun:1` |
| `docker-compose.yml` | Expand backend build to long form with GHA cache; mark `.env` as optional; add GHA cache to frontend build |
| `.github/workflows/test_pr.yml` | Create new workflow |

### docker-compose.yml changes

1. Expand `backend.build` from shorthand to long form with `cache_from`/`cache_to`.
2. Change `backend.env_file` to use `path`/`required: false` map syntax.
3. Add `cache_from`/`cache_to` to `frontend.build`.

Full updated `docker-compose.yml`:

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg16
    volumes:
      - bitewise_postgres:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: postgres
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: dev_password
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 1s
      timeout: 5s
      retries: 10
    ports:
      - "5432:5432"

  backend:
    build:
      context: backend
      cache_from:
        - type=gha
      cache_to:
        - type=gha,mode=max
    command: ["uv", "run", "manage.py", "runserver", "0.0.0.0:8000"]
    env_file:
      - path: .env
        required: false
    volumes:
      - ./backend:/app
      - /app/.venv
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://postgres:dev_password@postgres:5432/postgres

  frontend:
    build:
      context: frontend
      dockerfile: Dockerfile.dev
      cache_from:
        - type=gha
      cache_to:
        - type=gha,mode=max
    command: ["bun", "run", "dev", "--", "--host"]
    volumes:
      - ./frontend:/app
      - frontend_node_modules:/app/node_modules
    ports:
      - "5173:5173"

volumes:
  frontend_node_modules:
  bitewise_postgres:
```

### Workflow YAML (`.github/workflows/test_pr.yml`)

```yaml
name: test_pr

on:
  workflow_call:
  pull_request:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: docker/setup-buildx-action@v3

      - uses: crazy-max/ghaction-github-runtime@v3

      - name: Build all services
        run: docker compose build

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: docker/setup-buildx-action@v3

      - uses: crazy-max/ghaction-github-runtime@v3

      - name: Build backend service
        run: docker compose build backend

      - name: Start postgres and backend
        env:
          ACCESS_LIFETIME: 300
          REFRESH_LIFETIME: 604800
        run: docker compose up -d postgres backend

      - name: Wait for postgres to be healthy
        run: |
          until docker compose exec -T postgres pg_isready -U postgres; do
            sleep 1
          done

      - name: Run pytest
        env:
          ACCESS_LIFETIME: 300
          REFRESH_LIFETIME: 604800
        run: docker compose exec -T backend uv run pytest
```

### Key design decisions

- **`crazy-max/ghaction-github-runtime@v3`**: Injects `ACTIONS_RUNTIME_TOKEN` and `ACTIONS_CACHE_URL` required by Docker Buildx GHA cache driver. Must run before any `docker compose build` call in both jobs.
- **`docker/setup-buildx-action@v3`**: Enables Buildx with GHA cache support on the runner.
- **`cache_from`/`cache_to` in `docker-compose.yml`**: Keeps CI YAML clean; both jobs use plain `docker compose build` with no extra flags.
- **`mode=max`**: Caches all intermediate layers so `uv sync --locked` layer is cached independently of source code changes.
- **`env_file required: false`**: Prevents Docker Compose from failing when `.env` is absent in CI. Requires Docker Compose v2.24+.
- **`docker compose exec -T`**: Disables pseudo-TTY for non-interactive CI.
- **Independent jobs**: Both jobs have no `needs:` relationship — they run in parallel. The test job builds the backend image itself, benefiting from GHA cache if the build job ran first (or from a previous run). Cold cache means each job builds independently, which is safe.
- **`ACCESS_LIFETIME`/`REFRESH_LIFETIME` in CI**: Required by `settings.py`. Hardcoded to `.env.sample` defaults (non-sensitive values). Passed as step-level `env` so they are available to the container via Docker Compose environment inheritance.
