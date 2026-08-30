# Frontend

React 19 + TypeScript + Vite single-page app for the fullstack template.

## Stack

- **React 19** with **react-router** for routing
- **TanStack Query** for server state, **react-hook-form** for forms
- **Bootstrap 5** compiled from SCSS (`src/bootstrap.scss`) via **react-bootstrap**
- **Vitest** + **Testing Library** for tests, **ESLint** (type-aware) + **Prettier** for quality
- **Bun** as package manager and runtime

## Running

The app runs inside Docker Compose from the repository root:

```sh
docker compose up --build --wait
```

The dev server is served on http://localhost:5173.

Run any command against the running container:

```sh
docker compose exec frontend bun run test
```

Because `node_modules` lives in a Docker volume, run `bun install` on the host as
well after changing dependencies so the editor's TypeScript server sees the same
package versions.

## Scripts

| Script                  | Purpose                                               |
| ----------------------- | ----------------------------------------------------- |
| `bun run dev`           | Vite dev server with HMR                              |
| `bun run build`         | Type check then produce a production build in `dist/` |
| `bun run preview`       | Serve the production build locally                    |
| `bun run typecheck`     | Type check without emitting                           |
| `bun run lint`          | ESLint with type-aware rules                          |
| `bun run lint:fix`      | ESLint with autofix                                   |
| `bun run format`        | Format the project with Prettier                      |
| `bun run format:check`  | Fail if anything is unformatted                       |
| `bun run test`          | Run the test suite once                               |
| `bun run test:watch`    | Run tests in watch mode                               |
| `bun run test:coverage` | Run tests and report coverage                         |

## Environment

Copy `.env.sample` to `.env`. Variables are typed in `src/vite-env.d.ts` and read
through `src/config.ts`.

| Variable             | Purpose                                    |
| -------------------- | ------------------------------------------ |
| `VITE_API_BASE_URL`  | Base URL of the backend HTTP API           |
| `VITE_WEBSOCKET_URL` | Base URL of the backend WebSocket endpoint |

See the repository root `.claude/CLAUDE.md` for how these change when Docker host
ports are overridden.

## Authentication

`src/auth/authSession.ts` is the single authority for tokens. It holds the
access/refresh pair, persists it to `localStorage`, and is the only place that
calls the refresh endpoint. Every consumer reads from it:

- `AuthContextProvider` subscribes with `useSyncExternalStore` and exposes
  `session`, `currentUser`, `login`, `register` and `logout`.
- `src/api/client.ts` exports `apiClient`, an axios instance that attaches the
  access token and, on a 401, refreshes once and replays the request.
- `useWebSocket` reads the access token when it opens the socket.

Concurrent refreshes are collapsed into one in-flight request. This matters
because the backend runs with `ROTATE_REFRESH_TOKENS` and
`BLACKLIST_AFTER_ROTATION`: two simultaneous refreshes would invalidate each
other and sign the user out.

The session is kept fresh by three triggers: a timer scheduled from the access
token expiry, a `visibilitychange`/`focus` listener that catches tabs whose
timers were throttled while backgrounded, and the 401 interceptor. A `storage`
listener keeps every open tab on the same session, so signing out in one tab
signs out the rest.

Tokens live in `localStorage`, which means an XSS bug can read them. Moving the
refresh token to an httpOnly cookie is the upgrade path when a project needs it.

### Calling the API

Use `apiClient` from `src/api/client.ts` in API modules, or `useAxiosAuth()`
inside components for ad-hoc authenticated calls. Both return the same
pre-configured instance, so authentication never has to be wired by hand.
`src/api/tokens.ts` deliberately uses bare axios: the token endpoints must not
pass through the refresh interceptor.

### Flows

Login, registration with auto sign-in, logout with refresh-token blacklisting,
password reset, change password, profile editing, and account activation.
Activation is off by default; set `SEND_ACTIVATION_EMAIL=True` in the root
`.env` to require it, and registration will fall back to a "check your email"
message instead of signing the user straight in.

In development the backend prints emails to its console, so reset and activation
links are readable with `docker compose logs backend`.

## TypeScript

TypeScript 7 (the native compiler) provides `tsc` for builds. TypeScript 6 is
installed alongside under the `typescript` name because `typescript-eslint` still
requires the JavaScript compiler API. This is the aliasing arrangement documented
in the TypeScript 7.0 release notes and can be collapsed once `typescript-eslint`
supports TypeScript 7.

## Routing

`src/Router.tsx` exports a `routes` array consumed by `createBrowserRouter`, so
the route table can be mounted in a memory router from tests. Every path lives in
`src/routes.ts` as a `ROUTES` constant, and links or redirects reference those
constants rather than string literals.

The tree nests three layouts under a root route:

- `RootLayout` holds the auth provider and keeps the document title in sync with
  the `handle.title` of the deepest matched route. Its `errorElement` catches any
  render failure below it, so a broken page shows a recovery screen instead of a
  blank document.
- `PublicRoute` sends an authenticated visitor away from the landing and auth
  pages, honouring the destination `ProtectedRoute` remembered.
- `ProtectedRoute` sends an anonymous visitor to the login page and records where
  they were heading. `AppLayout` sits below it and renders the navigation bar
  once for every signed-in page.

Remembered destinations pass through `resolveInternalPath`, which drops anything
that is not a same-origin path.

Every page is attached to its route through `lazy`, so each one builds into its
own chunk and is fetched on first visit. Layouts and guards stay eager because
they render on every navigation, and `handle` stays on the static route object so
the document title is known before the chunk arrives. The root route renders
`LoadingScreen` as its `HydrateFallback` while the first chunk loads.

## Data layer

`src/api` owns transport and `src/queries` owns caching. Nothing else talks to
axios directly.

Every request goes through a sender built by `createRequestSender`, which
unwraps the response body and converts any failure into an `ApiError` carrying a
`kind` (`network`, `validation`, `authentication`, `permission`, `notFound`,
`server`, `contract`, `unknown`), the status, and `fieldErrors` keyed by the DRF
field name, so a form can point at the field that failed. `isRetryable` and
`isExpected` are derived from the kind: only network and server failures are
retried, and only unexpected failures reach the global toast handler — expected
ones are already shown inline by the screen that triggered them. Server and
network messages are replaced with our own copy so backend internals never
render.

Responses are parsed with the zod schemas in `src/models.ts`, which are the
single source of truth for both the runtime shape and the TypeScript types. A
payload that does not match raises a `contract` error instead of leaking
`undefined` into the UI.

`createQueryClient` sets the defaults in one place — retry policy, stale and
garbage collection times, and the global error handler. Tests build their client
with the same factory, so they exercise the production configuration. Query keys
live in `queries/queryKeys.ts` and are never written inline.

Each domain exposes hooks rather than raw functions: `useCurrentUser`,
`useUpdateProfile`, `useSimilarComments`. Queries forward the abort signal
TanStack Query provides, so a superseded request is cancelled. `useUpdateProfile`
is the reference for a write: it applies the change optimistically, rolls back
from a snapshot on failure, and invalidates the key when it settles. The whole
cache is cleared whenever the session ends, including a logout in another tab.

React Query Devtools are mounted in development only and are dropped from the
production bundle.

## Realtime

`src/websocket/protocol.ts` is the contract: zod schemas for every frame the
server can send (`message`, `auth_ok`, `pong`, `error`), the close codes the
consumer uses, and whether each one is worth reconnecting after. Anything that
does not parse is dropped rather than rendered.

`RoomConnection` owns the socket and knows nothing about React, so it is tested
directly. It refreshes the access token before authenticating, reconnects with a
capped backoff, gives up on an unauthorized or rate-limited close, sends a
heartbeat and reconnects when no pong answers it, and queues messages written
before the room is ready. Its socket factory is injectable, which is how the
tests drive it without a server.

`useWebSocket` is the thin React binding. It opens a room only while a session
exists, closes it on logout, and writes incoming messages into the query cache
under `queryKeys.websocket.room(name)` — so a server push updates TanStack Query
state and any component reading that key re-renders, the same way a fetched
resource would. The kept history is capped.

The consumer authenticates with an access token only, resolves the user, closes
the socket when that token expires, drops sockets that never authenticate, and
rate limits messages. `is_user_allowed_in_room` is the hook to add per-room
authorization. Origins are checked by `AllowedHostsOriginValidator` in
`backend/asgi.py`, so `DJANGO_ALLOWED_HOSTS` governs which sites may open a
socket.

## Forms

Every form is a zod schema annotated with the request type it must produce, so a
schema that stops matching the API is a compile error rather than a runtime 400:

```ts
const loginSchema: FormSchema<LoginData> = z.object({ ... })
```

`useValidatedForm` wires the schema to react-hook-form through the standard
schema resolver and sets `mode: "onTouched"`, so a visitor is told about a field
when they leave it rather than at the end. Passing `disabled` while a mutation is
in flight freezes the whole form, not just the button. Because the schema
transforms as it validates, the submitted payload is already trimmed.

Shared field primitives live in `src/validation.ts` — `emailField`,
`buildPersonNameField` (capped at the 150 characters the database accepts), and
`checkPasswordRules`, which attaches the strength problem to the password field
and the mismatch to the confirmation field. The phone schema sits next to
`PhoneField` so only the two forms that need it pull in the phone metadata.

`TextField`, `FormField`, `PhoneField` and `SubmitButton` carry the markup and
the accessibility wiring: the label is bound to the control, a failing control
gets `aria-invalid`, `is-invalid` and an `aria-describedby` pointing at the
message, and the message is a live region.

Server errors are mapped back onto fields. `readServerFormErrors` splits an
`ApiError` into the fields this form owns and whatever is left over;
`useServerFieldErrors` pushes the former into react-hook-form, and the form shows
a banner only for the remainder. A duplicate email marks the email input instead
of printing a sentence above the form.

`auth/passwordStrength.ts` mirrors Django's four validators, but its common
password list is a small sample of Django's ~20,000 entries. A password the
client accepts can still be refused by the server — which is why the server
message has to land on the field.

## API contract

The backend is the source of truth. `drf-spectacular` serves the schema at
`/api/schema/` (with a browsable UI at `/api/schema/docs/`) and writes it to the
shared `schema/` directory, which both containers mount:

```
docker compose exec backend python manage.py spectacular --file /schema/openapi.yml
docker compose exec frontend bun run contracts
```

The second command regenerates `src/api/schema.d.ts` from that document and
`src/websocket/protocolCodes.ts` from `schema/websocket.json`, so the WebSocket
close codes exist once and both languages read the same numbers. Both generated
files are committed, and CI regenerates them and fails on a diff.

Those generated types are what makes drift a build error rather than a runtime
surprise. Response schemas are annotated with the component they must produce and
endpoint paths are checked against the generated path list:

```ts
export const userSchema: z.ZodType<ApiSchemas["User"]> = z.object({ ... })
const asEndpoint = <Path extends keyof paths>(path: Path): Path => path
```

Rename a serializer field or move an endpoint, regenerate, and `tsc` points at
every place that has to change. Request payload types come from the same
components, so `LoginData` and `RegisterData` are the backend's own request
bodies rather than a hand-copied guess.

Response schemas are as strict as the request schemas: the API is expected to
return a valid email, an E.164 phone number, and names within the 150 characters
the column allows. Error bodies are parsed with a schema too, so the DRF envelope
(`detail`, `non_field_errors`, and per-field message lists) has the same
treatment as any other payload.

The API is served under `/api/v1/`; the prefix lives in `src/api/endpoints.ts`,
not in the base URL, so `VITE_API_BASE_URL` stays the bare host.

## Accessibility

Every page renders a `<main id="main-content" tabIndex={-1}>`, and `RootLayout`
puts a `visually-hidden-focusable` skip link ahead of it. `useRouteAnnouncement`
sets the document title from the deepest route's `handle.titleKey`, writes that
title into a polite live region, and moves focus to the main landmark on every
navigation after the first — the three things an SPA has to do by hand because
the browser no longer does them.

Headings start at `<h1>` on every page, with Bootstrap's `h3`/`h4` classes doing
the visual sizing so the outline is correct without changing the design. Field
errors carry `role="alert"`, and controls get `aria-invalid`, `is-invalid` and an
`aria-describedby` pointing at the message.

Colour is not used alone and colour that carries meaning uses the `-emphasis`
utilities: plain `text-warning` is `#ffc107`, which is 1.6:1 on white and fails
at any size.

Toasts default to six seconds, pause while the pointer or keyboard focus is in
the toast region, and can always be dismissed, which is what WCAG 2.2.1 asks for.
Anything animated is disabled under `prefers-reduced-motion`, including the
smooth scroll in the WebSocket demo.

`eslint-plugin-jsx-a11y` runs as part of `bun run lint`, and
`src/a11y/accessibility.test.tsx` runs axe over rendered pages and asserts the
landmark, skip link, heading level and focus behaviour.

## Internationalisation

`src/i18n/config.ts` initialises i18next with the catalogues in
`src/i18n/locales`, detects the language from `localStorage` then the browser,
and keeps `<html lang>` and `<html dir>` in step with it. Adding a right-to-left
language is a catalogue plus a `direction: "rtl"` entry in `SUPPORTED_LANGUAGES`
(Bootstrap's RTL stylesheet has to be swapped in as well).

Components use `useTranslation`. Modules that run outside React — the API error
mapper, the WebSocket close reasons — call the exported `translate` instead, and
form schemas are built from `t` inside a `useMemo`, so validation messages follow
the current language rather than the language at import time.

The API is localised too. Both axios clients send `Accept-Language`, and Django's
`LocaleMiddleware` honours it, so DRF, SimpleJWT, djoser and phonenumber_field
errors come back translated. `rest_framework_simplejwt` has to be in
`INSTALLED_APPS` for its catalogue to be merged — the `token_blacklist` app alone
is not enough. Project translations belong in `backend/locale`; our own strings
are wrapped in `gettext_lazy`.

## Layout

```
src/
  a11y/        Motion preferences and the accessibility test sweep
  api/         HTTP calls grouped by domain, the shared axios client, and the
               generated OpenAPI types
  auth/        Token store, JWT helpers, password rules
  queries/     Query keys, the configured query client, and hooks per domain
  websocket/   Realtime protocol schemas and the room connection
  components/  Reusable presentational components, form fields, route guards
  forms/       Form resolver, server error mapping
  i18n/        i18next setup and message catalogues
  context/     React context providers (auth, toasts)
  hooks/       Reusable hooks
  layouts/     Layout routes rendering an Outlet
  pages/       Route-level components
  test/        Test setup
```

Imports resolve from `src/` via the `paths` entry in `tsconfig.app.json`, so
modules are imported as `context/auth/AuthContext` rather than by relative path.
