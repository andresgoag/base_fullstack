# base_fullstack

A batteries-included fullstack template: a typed React frontend talking to a
Django REST + Channels backend, with PostgreSQL (`pgvector`), Valkey, Docker
Compose and CI already wired together.

## Frontend

React 19 and TypeScript on Vite, served by `bun`. The frontend is a single-page
app that authenticates with JWTs, talks to a versioned REST API described by an
OpenAPI schema, and holds a live WebSocket connection to the backend.

Everything below is the shape the template expects new features to follow.
Deeper notes on each area live in [frontend/README.md](frontend/README.md).

### Stack

| Concern      | Choice                                                         |
| ------------ | -------------------------------------------------------------- |
| UI           | React 19 · React Bootstrap · Bootstrap 5 (SCSS)                |
| Language     | TypeScript 7 (`tsc`) with TypeScript 6 kept alongside for lint |
| Build        | Vite 8 (rolldown) · bun                                        |
| Routing      | react-router 8, data router                                    |
| Server state | TanStack Query 5                                               |
| Forms        | react-hook-form + zod via the standard-schema resolver         |
| HTTP         | axios                                                          |
| i18n         | i18next · react-i18next                                        |
| Testing      | Vitest 4 · Testing Library · axe-core · istanbul coverage      |
| Quality      | ESLint 10 (type-aware, jsx-a11y) · Prettier                    |

### Running it

The frontend runs in the `frontend` Compose service; run its tooling there too.

```bash
docker compose up --build --wait                      # start the whole environment
docker compose exec frontend bun run typecheck        # tsc -b
docker compose exec frontend bun run lint             # ESLint
docker compose exec frontend bun run format           # Prettier (write)
docker compose exec frontend bun run test             # Vitest
docker compose exec frontend bun run test:coverage    # Vitest + coverage
docker compose exec frontend bun run build            # typecheck + production build
docker compose exec frontend bun run contracts        # regenerate API + protocol types
docker compose exec frontend bun add <package>        # add a dependency
```

`node_modules` lives in a named volume, so after adding a dependency run
`bun install --frozen-lockfile` on the host as well to keep your editor's
TypeScript server in step with the container.

`frontend/.env` supplies `VITE_API_BASE_URL` and `VITE_WEBSOCKET_URL`. Both are
required — `src/config.ts` throws at startup if either is missing rather than
letting requests go to `undefined/...`.

### Layout

```
frontend/src/
  a11y/         Motion preferences and the accessibility test sweep
  api/          HTTP calls by domain, the axios clients, generated OpenAPI types
  auth/         Token store, JWT helpers, password rules
  components/   Reusable components, form fields, route guards
  context/      React context providers (auth, toasts)
  forms/        Form resolver, server error mapping
  hooks/        Reusable hooks
  i18n/         i18next setup and message catalogues
  layouts/      Layout routes rendering an Outlet
  pages/        Route-level components
  queries/      Query keys, the configured query client, hooks per domain
  test/         Test setup and helpers
  websocket/    Realtime protocol schemas and the room connection
```

Imports resolve from `src/` (`context/auth/AuthContext`, not `../../context/...`)
through the `paths` entry in `tsconfig.app.json`.

### Routing

`src/Router.tsx` exports a `routes` array consumed by `createBrowserRouter`, so
the real route table can be mounted in a memory router from tests. Every path is
a constant in `src/routes.ts`; links and redirects never hardcode a string.

Three layouts nest under a root route:

- **`RootLayout`** holds the auth provider, the skip link, the route announcer,
  and an `errorElement` that catches any render failure below it.
- **`PublicRoute`** keeps a signed-in visitor off the landing and auth pages.
- **`ProtectedRoute`** sends an anonymous visitor to the login page and remembers
  where they were heading; `AppLayout` sits below it and renders the navigation
  bar once for every signed-in page.

Pages are attached with `lazy`, so each one is its own chunk fetched on first
visit. Layouts and guards stay eager.

### Authentication

`src/auth/authSession.ts` is the single source of truth for tokens. It persists
the pair, collapses concurrent refreshes into one in-flight request, and always
stores the rotated refresh token the backend hands back. Three things drive a
refresh — a bootstrap check, a timer that fires shortly before the access token
expires, and a listener that re-checks when a background tab wakes — and all
three go through that one function.

A `storage` listener keeps every tab on the same session, so a logout in one tab
signs the others out and clears their caches.

Tokens live in `localStorage`, which means any script on the page can read them.
The production upgrade is an `HttpOnly` refresh cookie issued by the backend;
the store is deliberately the only module that would need to change.

### Data layer

`src/api` owns transport, `src/queries` owns caching, and nothing else touches
axios.

Every request goes through a sender that unwraps the body and converts failures
into an `ApiError` carrying a `kind` (`network`, `validation`, `authentication`,
`permission`, `notFound`, `server`, `contract`, `unknown`), the status, and
`fieldErrors` keyed by the backend's field names. Two derived flags drive the
rest: `isRetryable` decides retries, and `isExpected` decides whether the global
handler shows a toast or the screen shows the error inline.

`createQueryClient` sets retry policy, stale times and the global error handler
in one place, and tests build their client from the same factory. Query keys live
in `queries/queryKeys.ts`. Each domain exposes hooks — `useCurrentUser`,
`useUpdateProfile`, `useSimilarComments` — rather than raw functions. Queries
forward the abort signal, so a superseded request is cancelled;
`useUpdateProfile` is the reference write, applying its change optimistically and
rolling back from a snapshot on failure.

### API contract

The backend is the source of truth. `drf-spectacular` writes the schema into the
shared `schema/` directory that both containers mount, and
`bun run contracts` turns it into `src/api/schema.d.ts` plus the WebSocket close
codes. Both artifacts are committed and CI fails on a diff.

Those generated types are wired in, so drift is a build error:

```ts
export const userSchema: z.ZodType<ApiSchemas["User"]> = z.object({ ... })
const asEndpoint = <Path extends keyof paths>(path: Path): Path => path
```

Rename a serializer field or move an endpoint, regenerate, and `tsc` points at
every place that has to change. Response bodies are parsed with zod at the edge,
so a mismatch raises a `contract` error instead of leaking `undefined` into the
UI. The API sits under `/api/v1/`, with the prefix in `src/api/endpoints.ts`
rather than the base URL.

### Forms

Each form is one zod schema annotated with the request type it must produce, so a
schema that stops matching the API fails to compile. `useValidatedForm` binds it
to react-hook-form, validates on blur, and disables the whole form while a
mutation is in flight. Because the schema transforms as it validates, submitted
payloads are already trimmed.

`TextField`, `FormField`, `PhoneField` and `SubmitButton` carry the markup and
the accessibility wiring. Server-side validation errors are mapped back onto the
fields they belong to, with a banner only for whatever could not be matched — a
duplicate email marks the email input rather than printing a sentence above the
form.

### Realtime

`websocket/protocol.ts` holds zod schemas for every frame the server can send and
the meaning of each close code. `RoomConnection` owns the socket and knows
nothing about React: it refreshes the access token before authenticating,
reconnects with a capped backoff, gives up on an unauthorized close, heartbeats
and reconnects when no pong answers, and queues messages written before the room
is ready. Its socket factory is injectable, which is how the tests drive it
without a server.

`useWebSocket` is the thin React binding. It opens a room only while a session
exists and writes incoming messages into the query cache, so a server push
updates TanStack Query state exactly like a fetched resource would.

### Accessibility

Every page renders a `<main id="main-content">` and `RootLayout` puts a skip link
ahead of it. On each navigation the route announcer sets the document title,
writes it into a polite live region, and moves focus to the main landmark — the
work the browser stops doing once you own the routing.

Headings start at `<h1>` on every page, field errors are announced and tied to
their inputs, colour never carries meaning alone, toasts pause on hover and can
always be dismissed, and animation is disabled under `prefers-reduced-motion`.
`eslint-plugin-jsx-a11y` runs in lint and `src/a11y/accessibility.test.tsx` runs
axe over rendered pages.

### Internationalisation

`src/i18n/config.ts` initialises i18next from the catalogues in
`src/i18n/locales` (English and Spanish ship with the template), detects the
language from `localStorage` then the browser, and keeps `<html lang>` and `dir`
in step. Components use `useTranslation`; modules that run outside React use the
exported `translate`; form schemas are built from `t` so validation messages
follow the current language rather than the language at import time.

The API is localised too — both axios clients send `Accept-Language` and Django's
`LocaleMiddleware` honours it, so backend errors come back translated.

### Testing

Vitest with jsdom and Testing Library. Tests use the real route table, the real
query client factory and the real providers; only the network boundary is mocked.
`src/test` holds the render helpers, a JWT builder and a fake WebSocket.

```bash
docker compose exec frontend bun run test
docker compose exec frontend bun run test:coverage
```

### Adding a feature

1. Add or change the endpoint on the backend, then regenerate the contract:
   `docker compose exec backend python manage.py spectacular --file /schema/openapi.yml`
   followed by `docker compose exec frontend bun run contracts`.
2. Add the request function in `src/api/<domain>.ts` using `sendRequest` and a
   path from `API_ENDPOINTS`, parsing the response with a schema in
   `src/models.ts`.
3. Expose a hook in `src/queries/<domain>.ts` with a key from `queryKeys`.
4. Add the page under `src/pages/`, register a lazy route with a `titleKey` in
   `src/Router.tsx`, and add its path to `src/routes.ts`.
5. Put every user-facing string in `src/i18n/locales/*.json`.
6. Cover it: a schema test, a hook or page test, and — for a new page — an entry
   in the accessibility sweep.
