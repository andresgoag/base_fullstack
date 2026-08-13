# base_fullstack

A batteries-included fullstack template for kicking off new projects. Fork it, rename a few things, set your env vars, and you have a typed React frontend talking to a Django REST + Channels backend, backed by PostgreSQL (with `pgvector`) and Valkey — all wired together with Docker Compose and a CI pipeline.

## What's in the box

- **JWT authentication** with short-lived access tokens, rotating refresh tokens, server-side blacklisting, and rate-limited login/refresh. Custom email-based user model with a required phone field.
- **Real-time WebSockets** via Django Channels — a room-based echo consumer with origin validation, access-token auth that resolves the real user onto `scope["user"]`, and a ready-to-use React hook.
- **Semantic similarity search** with `pgvector` + OpenAI embeddings — an HNSW-indexed cosine search behind a swappable `EmbeddingClient` boundary, with staleness tracking so an edited comment can't silently keep an outdated vector.
- **Single-flight session management** — refresh tokens are single-use server-side, so the frontend collapses every concurrent refresh into one request and always persists the rotated token. `apiClient` is the one way to make an authenticated request.
- **Typed end to end** — TypeScript (strict) on the frontend, self-documenting Python on the backend.
- **Dev tooling** — Black/Flake8/Pytest for the backend, ESLint/Prettier/Vitest for the frontend, all enforced in GitHub Actions.

## Tech stack

| Layer        | Choice                                                                 |
| ------------ | ---------------------------------------------------------------------- |
| Frontend     | React 19 · TypeScript · Vite 7 · React Router 7 · React Query · Axios · React Hook Form · React Bootstrap · SCSS |
| Backend      | Python 3.13 · Django 5.2 · Django REST Framework · Djoser · SimpleJWT · Django Channels · Daphne (ASGI) |
| Data         | PostgreSQL 16 (`pgvector/pgvector:pg16`) · Valkey 8 (Channels layer)   |
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
| `AUTH_THROTTLE_RATE`      | `10/minute`                                              | Rate limit on the JWT login and refresh endpoints         |
| `DATABASE_URL`            | `postgresql://postgres:dev_password@postgres:5432/postgres` | Postgres connection string                             |
| `PHONENUMBER_DEFAULT_REGION` | `US`                                                  | Default region for parsing phone numbers                  |
| `OPENAI_API_KEY`          | _(empty)_                                                | OpenAI key for embeddings — required by the `comment` app |
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

All of these are throttled at `AUTH_THROTTLE_RATE`. Login and refresh go through `ThrottledTokenObtainPairView` / `ThrottledTokenRefreshView`; the `/auth/users/` routes go through `ThrottledUserViewSet`, which `backend/backend/urls.py` mounts on a router **ahead of** the `djoser.urls` include so it wins URL resolution. Refresh tokens rotate on use and old ones are blacklisted.

### Comments / similarity search

| Method | Path                                    | Description                                        |
| ------ | --------------------------------------- | -------------------------------------------------- |
| GET    | `/comments/similar/?text=...&limit=...` | Closest comments by cosine distance over embeddings |

`text` is required and capped at 2000 characters; `limit` defaults to 5 and accepts 1–50. Both are validated by `SimilarCommentsQuerySerializer`, so bad input is a 400 and never reaches the embedding provider.

> **This endpoint is a sample, not a production-ready view.** It is deliberately `AllowAny` and unthrottled so the template runs with no setup — which makes it an unauthenticated, uncapped spend endpoint that anyone who can reach it can use to drain your OpenAI budget. `comment/api/views.py` carries the full warning and the three changes to make before shipping anything modelled on it.

> **`OPENAI_API_KEY` is required for the `comment` app to function.** There is no fallback path. If you don't want embeddings, remove the app rather than leaving the key blank.

#### How the embedding boundary is wired

The domain code never imports the OpenAI SDK:

- `comment/embeddings.py` defines the `EmbeddingClient` Protocol (`dimensions`, `embed(text)`) and `OpenAIEmbeddingClient`, the only adapter that talks to the vendor.
- `comment/clients.py` is the composition root — `get_embedding_client()` builds the adapter from settings.
- `comment/services.py` holds the behavior (`create_comment`, `replace_comment_text`, `find_similar_comments`) and **receives** a client rather than constructing one. Tests pass `FakeEmbeddingClient` straight in; no monkeypatching of module attributes.
- `comment/constants.py` owns `EMBEDDING_DIMENSIONS`, the single source of truth shared by the model field and the adapter.

#### Embeddings never silently go stale

`Comment` stores `embedding_source_hash` alongside the vector. Editing `text` without re-embedding leaves the search index describing text that no longer exists, so `Comment.save()` raises `StaleEmbeddingError` instead of writing the mismatch. Write through `create_comment` / `replace_comment_text` and the hash stays in sync automatically.

#### Vector index

`comment_embedding_hnsw` (HNSW, `vector_cosine_ops`) is created in migration `0003`. Without it every query is a sequential scan. The migration's docstring covers tuning `m` / `ef_construction`, the runtime `hnsw.ef_search` knob, and building the index concurrently on a large table — read it before adapting this for real data.

### WebSocket echo

Connect to `ws://localhost:8000/ws/echo/<room_name>/`. The origin is validated against `DJANGO_ALLOWED_HOSTS` (`AllowedHostsOriginValidator` in `backend/backend/asgi.py`) — CORS does not apply to WebSockets, so this is what prevents cross-site hijacking. A connection from a disallowed origin, or with no `Origin` header at all, is refused before it reaches the consumer.

Once connected, the socket is **unauthenticated until** the first message authenticates it. Every frame in both directions is JSON with a `type` discriminator:

```jsonc
// 1. client → server (first message, required)
{ "type": "auth", "token": "<JWT access token>" }
// 2. server → client on success
{ "type": "auth_ok", "user_id": 1, "expires_at": "2026-08-12T03:11:24+00:00" }
// 3. client → server
{ "type": "message", "text": "hello" }
// 4. server → every client in the room
{ "type": "message", "text": "hello" }
```

Only **access** tokens are accepted — a refresh token is rejected, as is a token for an inactive user. On success the consumer resolves the real user and puts it on `scope["user"]`, so anything you build on top of `EchoConsumer` can authorize per-user.

The server always stamps the outgoing `type` itself and only ever echoes the `text`, so a client cannot forge an `auth_ok` frame at other clients in the room.

Close codes: `4001` bad or missing token · `4002` frame over 4096 bytes (checked **before** the auth branch, so an unauthenticated client cannot make the server parse an oversized payload) · `4003` malformed or unrecognised frame.

The frontend wraps all of this in `useWebSocket` (`frontend/src/hooks/useWebSocket.ts`), which exposes `{ messages, isAuthenticated, sendMessage }`, reconnects automatically, and retains the last 200 messages. A live demo lives at `/websocket`.

> The socket is authenticated once, at connect time, and stays open past the access token's 5-minute lifetime. For long-lived connections carrying sensitive data, re-check `connection.expires_at` and force re-authentication.

## Project layout

```
.
├── docker-compose.yml          # postgres · valkey · backend · frontend (DEV ONLY)
├── .env.sample                 # root env template (backend config)
├── backend/
│   ├── Dockerfile              # uv-based dev image used by compose
│   ├── pyproject.toml          # deps managed by uv
│   ├── manage.py
│   ├── backend/                # project: settings, urls, asgi (HTTP+WS router)
│   ├── user/                   # custom email user model, throttled JWT views, seed
│   ├── websocket/              # EchoConsumer + token authentication + routing
│   └── comment/                # pgvector model, embedding boundary, services, seed
│       ├── constants.py        # EMBEDDING_DIMENSIONS — single source of truth
│       ├── embeddings.py       # EmbeddingClient Protocol + OpenAI adapter
│       ├── clients.py          # composition root: builds the adapter from settings
│       └── services.py         # create / re-embed / search — takes a client
└── frontend/
    ├── Dockerfile.dev          # bun dev image used by compose
    ├── package.json            # deps managed by bun
    └── src/
        ├── Router.tsx          # lazy-loaded routes + AuthContextProvider
        ├── config.ts           # reads VITE_* env vars
        ├── auth/               # session store, single-flight refresh, token expiry
        │   ├── session.ts      # the one owner of session state + localStorage
        │   ├── refreshSession.ts # single-flight; all refresh paths go through it
        │   ├── tokenExpiry.ts  # base64url-safe `exp` decode
        │   └── useSession.ts   # useSyncExternalStore binding for React
        ├── api/
        │   ├── client.ts       # apiClient — USE THIS for authenticated requests
        │   ├── authEndpoints.ts # login/register/refresh/blacklist (unauthenticated)
        │   └── user.ts         # example of a call made through apiClient
        ├── context/            # AuthContext, ToastContext
        ├── hooks/              # useWebSocket
        ├── components/         # ProtectedRoute, MainNavbar, ErrorBoundary, …
        └── pages/              # Home, Auth, Dashboard, WebSocketDemo, NotFound
```

### Frontend auth flow

The refresh token is persisted in `localStorage`; the access token is held in memory. On load the app refreshes to obtain an access token, auto-refreshes ~30s before expiry, and retries once on a `401`. `ProtectedRoute` redirects unauthenticated users to `/auth/login`.

**`src/auth/session.ts` is the only thing that writes session state.** React reads it through `useSession()` (`useSyncExternalStore`), which means the axios interceptors can read and update the session without hooks or stale closures.

**Every refresh goes through `refreshSession()`, and it is single-flight.** This matters more than it looks: the backend rotates refresh tokens and blacklists the old one on every use, so a refresh token is strictly single-use. Two overlapping refreshes with the same token means one of them gets a `401` and the user is logged out. `refreshSession()` returns the same in-flight promise to every concurrent caller — React StrictMode's double-invoked effects, the scheduled pre-expiry refresh, and any number of simultaneous `401`s all collapse into one network call, and the rotated token is always persisted.

#### Making authenticated requests

Use `apiClient` from `src/api/client.ts`. It attaches the current access token, and on a `401` it refreshes once and replays the request:

```ts
import { apiClient } from "@/api/client";

export const fetchThings = async (): Promise<Thing[]> => {
  const response = await apiClient.get<Thing[]>("/things/");
  return response.data;
};
```

`src/api/user.ts` is a working example. Only the unauthenticated auth endpoints in `src/api/authEndpoints.ts` use bare `axios` — everything else should go through `apiClient`, so token attachment, refresh, and rotation stay in one place.

Imports resolve through the `@/*` alias (`@/api/client`, `@/auth/session`). It is scoped deliberately: a bare `*` mapping would shadow `node_modules`, so a `src/react.ts` would break every `import … from "react"`.

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

`.github/workflows/test_pr.yml` runs on PRs to `main` **and on push to `main`**, so a bad merge is caught rather than waiting for the next PR.

| Job | Checks |
| --- | --- |
| `build` | Builds every image. Sole writer of the GitHub Actions layer cache. |
| `test-backend` | Missing migrations · `check --deploy` · Black · Flake8 · Pytest with coverage |
| `test-frontend` | ESLint · Prettier · **`bun run build` (`tsc -b` + `vite build`)** · Vitest |

Three things worth knowing about how this is wired:

- **`bun run build` is the only step that typechecks.** ESLint is configured without `parserOptions.project`, so it is purely syntactic — `const x: number = "string"` passes it. Without this step, type errors and a broken bundle reach `main`.
- **The CI env file starts from `.env.sample`** (`cp .env.sample .env`, then append CI-specific overrides; later keys win). Hand-listing variables meant `CHANNEL_LAYERS_VALKEY_URL` silently went missing and the channel layer resolved to `localhost` in CI. Adding a variable to the sample now reaches CI automatically.
- **CI uses the same `docker-compose.yml` you do.** There is no CI-specific compose file — a GitHub runner is just another machine running the same containers, and anything that only breaks in CI is a bug worth reproducing locally.

`check --deploy` runs at `--fail-level ERROR`, so today's five warnings do not fail the build — it catches new errors. Tighten to `--fail-level WARNING` once you have cleared them.

## Using this as a starting point

1. **Rename the project.** Update `[project]` in `backend/pyproject.toml` and `name`/`description` in `frontend/package.json`.
2. **Set real secrets.** Generate a new `DJANGO_SECRET_KEY`, set `DJANGO_DEBUG=False` for non-local environments, and lock down `DJANGO_ALLOWED_HOSTS` / `CORS_ALLOWED_ORIGINS`.
3. **Decide on embeddings.** Set `OPENAI_API_KEY` if you want similarity search. If you don't, remove the `comment` app — leaving the key blank doesn't disable it, it just makes it error.
4. **Add a Django app.** Create it under `backend/`, register it in `settings.py`, and wire routes in `backend/backend/urls.py` (the project uses flat routing today — add an `include()` per app as it grows).
5. **Add a page.** Drop a component under `frontend/src/pages/` and register the route in `frontend/src/Router.tsx`, wrapping it in `ProtectedRoute` if it requires auth.
6. **Keep the patterns.** The `user`, `comment`, and `websocket` apps are the reference shapes for models, serializers, views, consumers, and seed commands. In particular, copy the way `comment` isolates its vendor SDK: a Protocol for the boundary, an adapter for the vendor, a composition root that builds it, and services that receive it. That is what keeps the domain code testable without monkeypatching.

## Security notes

This template stores the JWT refresh token in `localStorage` for simplicity — any JavaScript on the page (including a compromised dependency or an XSS bug) can read it. **No `Content-Security-Policy` is configured**, so nothing currently narrows that attack surface.

**For production**, address these before shipping:

- Move the refresh token to an `HttpOnly; Secure; SameSite=Lax` cookie issued by the backend. This makes it inaccessible to JavaScript and removes the XSS exfiltration risk, at the cost of needing CSRF protection on the refresh endpoint.
- Add a `Content-Security-Policy`, either as a `<meta>` tag in `frontend/index.html` or — better — as a response header from whatever serves the built frontend.
- Authenticate and throttle `/comments/similar/`. It ships open on purpose so the sample runs without setup; see the warning in `comment/api/views.py`.
- Run `python manage.py check --deploy` and clear the warnings — `SECURE_HSTS_SECONDS`, `SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`, and `CSRF_COOKIE_SECURE` are all unset, and behind a proxy you will also want `SECURE_PROXY_SSL_HEADER`.
- Replace the hardcoded dev Postgres password in `docker-compose.yml`, set a strong `DJANGO_SECRET_KEY`, lock down `DJANGO_ALLOWED_HOSTS` / `CORS_ALLOWED_ORIGINS`, and set `DJANGO_DEBUG=False`.
- Configure `LOGGING`. There is no logging config at all, so application errors go nowhere useful.
- Run the containers as a non-root user. The single Dockerfile per service targets local development, where compose bind-mounts your source, so it runs as root — see [Deploying](#deploying) for why those two things conflict.

Postgres and Valkey are bound to `127.0.0.1` so they are not reachable from the network, and `DJANGO_ALLOWED_HOSTS` doubles as the WebSocket origin allowlist — remember to include every browser-facing origin when you deploy.

> **Dependency volumes shadow the image.** `frontend_node_modules` and `backend_uv_venv` are named volumes mounted over `/app/node_modules` and `/app/.venv`. Docker only seeds a named volume from the image the first time it is created, so **rebuilding an image does not update an existing volume** — a newly added dependency will not appear until the volume is recreated. The symptom is a package that is installed in the image but missing at runtime. The fix:
>
> ```bash
> docker compose down && docker volume rm base_fullstack_frontend_node_modules base_fullstack_backend_uv_venv && docker compose up --build --wait
> ```

## Deploying

`docker-compose.yml` is a **development** stack: it publishes ports, hardcodes the database password, bind-mounts source for hot reload, and its containers run as **root**. Do not deploy it.

There is deliberately **one Dockerfile per service**, and it is the one compose uses locally and in CI — so nothing about the images is hidden or diverges between the two.

That means there is no production packaging here yet. When you add it, the things to decide are:

- **Run as a non-root user.** Note that this only works cleanly without a bind mount: a bind mount keeps the *host's* file ownership, so a non-root container user whose UID does not match the host's cannot write into it — `collectstatic`, `vite build`, and `pytest-cov` all fail. Docker Desktop on macOS remaps ownership and hides this, so it surfaces only on Linux and CI.
- **Build the frontend to static assets** (`bun run build`) and serve `dist/` from a real web server with a history fallback, rather than shipping the Vite dev server. `VITE_*` values are inlined at build time, so an image is bound to the API origin it was built against — one image per environment.
- **Everything in the [Security notes](#security-notes) checklist**, plus a managed Postgres and Valkey and a `LOGGING` config.

The backend image runs under Daphne and is otherwise deployment-ready.

## Recommended next steps

Deliberate gaps left for you to close, none of them blocking local development:

- **No API schema.** Add `drf-spectacular` if you want OpenAPI docs and a typed client.
- **No ownership on `Comment`.** It has no foreign key to `User`; real apps will want one, plus object-level permissions.
- **`db_table = "user"`** is a Postgres reserved word. Django quotes identifiers so the ORM is fine, but hand-written SQL will need `"user"` quoted. Rename the table if that bothers you.
- **No dependency automation.** No Dependabot or Renovate config and no `bun audit` / `pip-audit` step. For a template meant to be forked and left alone, staleness is the default outcome.
- **`CODEOWNERS` is a commented-out template.** Fill in real handles and pair it with a branch protection rule to make review non-bypassable.
