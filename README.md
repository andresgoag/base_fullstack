# base_fullstack

A batteries-included fullstack template for kicking off new projects. Fork it, rename a few things, set your env vars, and you have a typed React frontend talking to a Django REST + Channels backend, backed by PostgreSQL (with `pgvector`) and Valkey — all wired together with Docker Compose and a CI pipeline.

## What's in the box

- **JWT authentication** with short-lived access tokens, rotating refresh tokens, server-side blacklisting, and rate-limited auth endpoints. Custom email-based user model with a required phone field.
- **Real-time WebSockets** via Django Channels — a room-based echo consumer with JWT auth-on-connect and a ready-to-use React hook.
- **Semantic similarity search** with `pgvector` + OpenAI embeddings — comments are auto-embedded on save and queried by cosine distance.
- **Typed end to end** — TypeScript (strict) on the frontend, self-documenting Python on the backend.
- **Dev tooling** — Black/Flake8/Pytest for the backend, ESLint/Prettier/Vitest for the frontend, all enforced in GitHub Actions.

## Tech stack

| Layer        | Choice                                                                 |
| ------------ | ---------------------------------------------------------------------- |
| Frontend     | React 19 · TypeScript · Vite 7 · React Router 7 · React Query · Axios · React Hook Form · React Bootstrap · SCSS |
| Backend      | Python 3.13 · Django 5.2 · Django REST Framework · Djoser · SimpleJWT · Django Channels · Daphne (ASGI) |
| Data         | PostgreSQL 16 (`pgvector/pgvector:pg16`) · Valkey 8 (channel layer + cache) |
| Embeddings   | OpenAI API (`text-embedding-3-small` by default)                       |
| Packaging    | `uv` (backend) · `bun` (frontend)                                      |
| Orchestration| Docker Compose · GitHub Actions CI                                     |

## Architecture

```
┌─────────────┐   HTTP / WS    ┌──────────────────────────┐
│  Frontend   │ ─────────────► │  Backend (Daphne / ASGI)  │
│  React+Vite │                │  Django REST + Channels   │
│  :5173      │ ◄───────────── │  :8000                    │
└─────────────┘                └────────────┬──────────────┘
                                             │
                          ┌──────────────────┴──────────────────┐
                          ▼                                      ▼
                 ┌─────────────────┐                   ┌──────────────────┐
                 │ PostgreSQL 16   │                   │   Valkey 8       │
                 │ + pgvector      │                   │ channel layer    │
                 │ :5432           │                   │ :6379            │
                 └─────────────────┘                   └──────────────────┘
```

The backend runs under Daphne (ASGI) so HTTP and WebSocket traffic share one process. `backend/backend/asgi.py` uses a `ProtocolTypeRouter` to split the two.

## Quick start

Prerequisites: **Docker Desktop**. (Optional: `uv` and `bun` locally if you want to run tooling outside the containers.)

```bash
# 1. Create env files from the samples
cp .env.sample .env
cp frontend/.env.sample frontend/.env

# 2. Build and start everything
docker compose up --build

# 3. Seed development data (in a second terminal)
docker compose exec backend python manage.py seed
docker compose exec backend python manage.py seed_comments
```

Then visit:

| Service       | URL                          |
| ------------- | ---------------------------- |
| Frontend      | http://localhost:5173        |
| Backend API   | http://localhost:8000        |
| Django admin  | http://localhost:8000/admin  |

Seeded accounts (from `backend/user/management/commands/seed.py`):

| Role  | Email           | Password           |
| ----- | --------------- | ------------------ |
| Admin | `admin@dev.com` | `goodskunk95`      |
| User  | `user@dev.com`  | `Str0ngP@ssword!`  |

> Migrations and `collectstatic` run automatically on backend container start. The `seed` commands are idempotent — pass `--reset` to wipe and recreate the seeded rows.

## Configuration

All configuration is env-driven. There are two env files; both are gitignored, and `.env.sample` files are the templates.

### Root `.env` (consumed by the backend container via `env_file`)

| Variable                  | Default                                                  | Purpose                                                   |
| ------------------------- | -------------------------------------------------------- | --------------------------------------------------------- |
| `ACCESS_LIFETIME`         | `300`                                                    | Access token lifetime in seconds (5 min)                  |
| `REFRESH_LIFETIME`        | `604800`                                                 | Refresh token lifetime in seconds (7 days)                |
| `DJANGO_SECRET_KEY`       | `change-me-in-production`                                | Django secret key — **change this**                       |
| `DJANGO_ALLOWED_HOSTS`    | `localhost,127.0.0.1`                                    | Comma-separated allowed hosts                             |
| `DJANGO_DEBUG`            | `True`                                                   | Debug mode — set `False` in production                    |
| `CORS_ALLOWED_ORIGINS`    | `http://localhost:5173`                                  | Comma-separated origins allowed to call the API           |
| `CHANNEL_LAYERS_VALKEY_URL`| `redis://valkey:6379`                                   | Valkey URL for the Channels layer                         |
| `AUTH_THROTTLE_RATE`      | `10/minute`                                              | Rate limit applied to auth endpoints                      |
| `DATABASE_URL`            | `postgresql://postgres:dev_password@postgres:5432/postgres` | Postgres connection string                             |
| `PHONENUMBER_DEFAULT_REGION` | `US`                                                  | Default region for parsing phone numbers                  |
| `OPENAI_API_KEY`          | _(empty)_                                                | OpenAI key for embeddings — optional                      |
| `EMBEDDING_MODEL_NAME`    | `text-embedding-3-small`                                 | OpenAI embedding model used when a key is present         |

### `frontend/.env` (consumed by Vite at build/dev time)

| Variable             | Default                  | Purpose                  |
| -------------------- | ------------------------ | ------------------------ |
| `VITE_API_BASE_URL`  | `http://localhost:8000`  | Backend REST base URL    |
| `VITE_WEBSOCKET_URL` | `ws://localhost:8000`    | WebSocket base URL       |

### Changing ports

Inter-service traffic uses container ports over the Compose network, so only browser-facing ports (backend, frontend) need env changes when remapped. See [.claude/CLAUDE.md](.claude/CLAUDE.md) for the override recipe:

- **Backend host port** (e.g. `8001:8000`): set `VITE_API_BASE_URL=http://localhost:8001` and `VITE_WEBSOCKET_URL=ws://localhost:8001` in `frontend/.env`, then restart the frontend.
- **Frontend host port** (e.g. `5174:5173`): set `CORS_ALLOWED_ORIGINS=http://localhost:5174` in root `.env`, then restart the backend.

Put port remappings in a gitignored `docker-compose.override.yml` rather than editing `docker-compose.yml`.

## API reference

### Authentication (Djoser + SimpleJWT)

| Method | Path                                  | Description                                  |
| ------ | ------------------------------------- | -------------------------------------------- |
| POST   | `/auth/users/`                        | Register a new user                          |
| GET    | `/auth/users/me/`                     | Current user (requires `Authorization`)      |
| POST   | `/auth/users/set_password/`           | Change password                              |
| POST   | `/auth/users/reset_password/`         | Request a password-reset email               |
| POST   | `/auth/users/reset_password_confirm/` | Confirm a password reset                     |
| POST   | `/auth/jwt/create/`                   | Log in — returns `access` + `refresh` tokens |
| POST   | `/auth/jwt/refresh/`                  | Exchange a refresh token for a new access token (rotates refresh) |
| POST   | `/auth/jwt/blacklist/`                | Revoke a refresh token (logout)              |

Login, refresh, and the Djoser user viewset are throttled at `AUTH_THROTTLE_RATE`. Refresh tokens rotate on use and old ones are blacklisted.

### Comments / similarity search

| Method | Path                          | Description                                                       |
| ------ | ----------------------------- | ---------------------------------------------------------------- |
| GET    | `/comments/similar/?text=...` | Returns the 5 closest comments by cosine distance over embeddings |

`comment.models.Comment` embeds its `text` on save through a lazily-instantiated OpenAI client (`comment/embeddings.py`). Distance is computed in Postgres via `pgvector`'s `CosineDistance`. If no `OPENAI_API_KEY` is set, the model degrades gracefully and the endpoint still responds.

### WebSocket echo

Connect to `ws://localhost:8000/ws/echo/<room_name>/`. The connection is **unauthenticated until** the first message authenticates it:

```jsonc
// 1. client → server (first message, required)
{ "type": "auth", "token": "<JWT access token>" }
// 2. server → client on success
{ "type": "auth_ok" }
```

A bad or missing token closes the socket with code `4001`. After auth, messages are broadcast to every client in `echo_<room_name>` via the Valkey channel layer (`websocket/consumers.py`). Messages over 4096 bytes are rejected. The frontend wraps all of this in `useWebSocket` (`frontend/src/hooks/useWebSocket.ts`), which exposes `{ messages, isAuthenticated, sendMessage }`. A live demo lives at `/websocket`.

## Project layout

```
.
├── docker-compose.yml          # postgres · valkey · backend · frontend
├── .env.sample                 # root env template (backend config)
├── backend/
│   ├── Dockerfile              # multi-stage, uv-based
│   ├── pyproject.toml          # deps managed by uv
│   ├── manage.py
│   ├── backend/                # project: settings, urls, asgi (HTTP+WS router)
│   ├── user/                   # custom email user model, JWT views, seed command
│   ├── websocket/              # EchoConsumer + routing
│   └── comment/                # pgvector model, embeddings, similarity API, seed
└── frontend/
    ├── Dockerfile.dev          # bun dev image
    ├── package.json            # deps managed by bun
    └── src/
        ├── Router.tsx          # routes + AuthContextProvider
        ├── config.ts           # reads VITE_* env vars
        ├── api/                # axios auth functions
        ├── context/            # AuthContext, ToastContext
        ├── hooks/              # useWebSocket, useAxiosAuth (401 retry-refresh)
        ├── components/         # ProtectedRoute, MainNavbar, ToastMessage
        └── pages/              # Home, Auth (Login/Register), Dashboard, WebSocketDemo
```

### Frontend auth flow

The refresh token is persisted in `localStorage`; the access token is held in memory. On load the app refreshes to obtain an access token, attaches it as a `Bearer` header on every request, auto-refreshes ~30s before expiry, and retries once on a `401`. `ProtectedRoute` redirects unauthenticated users to `/auth/login`.

## Development workflow

The repo follows a "run commands inside the right Compose service" discipline.

### Backend

```bash
docker compose exec backend black .                              # format
docker compose exec backend flake8 .                             # lint
docker compose exec backend pytest                               # test
docker compose exec backend python manage.py migrate             # apply migrations
docker compose exec backend python manage.py makemigrations      # create migrations
docker compose exec backend python manage.py seed --reset        # reseed users
docker compose exec backend python manage.py seed_comments --reset  # reseed comments
docker compose exec backend uv add <package>                     # add a dependency
```

### Frontend

```bash
docker compose exec frontend bun run lint           # ESLint
docker compose exec frontend bun run format         # Prettier (write)
docker compose exec frontend bun run format:check   # Prettier (check)
docker compose exec frontend bun run test           # Vitest
docker compose exec frontend bun add <package>      # add a dependency
```

### Continuous integration

`.github/workflows/test_pr.yml` runs on PRs to `main`: it builds the Docker images, then runs the backend checks (Black, Flake8, Pytest) and frontend checks (ESLint, Prettier, Vitest). Keep these green locally before pushing.

## Using this as a starting point

1. **Rename the project.** Update `[project]` in `backend/pyproject.toml` and `name`/`description` in `frontend/package.json`.
2. **Set real secrets.** Generate a new `DJANGO_SECRET_KEY`, set `DJANGO_DEBUG=False` for non-local environments, and lock down `DJANGO_ALLOWED_HOSTS` / `CORS_ALLOWED_ORIGINS`.
3. **Decide on embeddings.** Add `OPENAI_API_KEY` if you want similarity search; otherwise the `comment` app can be removed.
4. **Add a Django app.** Create it under `backend/`, register it in `settings.py`, and wire routes in `backend/backend/urls.py` (the project uses flat routing today — add an `include()` per app as it grows).
5. **Add a page.** Drop a component under `frontend/src/pages/` and register the route in `frontend/src/Router.tsx`, wrapping it in `ProtectedRoute` if it requires auth.
6. **Keep the patterns.** The `user`, `comment`, and `websocket` apps are the reference shapes for models, serializers, views, consumers, and seed commands.

## Security notes

This template stores the JWT refresh token in `localStorage` for simplicity — any JavaScript on the page (including a compromised dependency or an XSS bug) can read it. A `Content-Security-Policy` is set via a `<meta>` tag in `frontend/index.html` to reduce the attack surface.

**For production**, move the refresh token to an `HttpOnly; Secure; SameSite=Lax` cookie issued by the backend. This makes it inaccessible to JavaScript and removes the XSS exfiltration risk, at the cost of needing CSRF protection on the refresh endpoint. Also replace the hardcoded dev Postgres password, set a strong `DJANGO_SECRET_KEY`, and disable `DJANGO_DEBUG`.
