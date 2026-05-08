# WebSocket Channels Sample

## Summary

Add a Django Channels WebSocket echo sample to the fullstack template. Any authenticated client
can join a named room and broadcast plain-text messages to all subscribers in that room.
Demonstrates channel groups, JWT-based WS authentication via first-message handshake, and
Redis-backed channel layers.

## Acceptance Criteria

1. `ws://localhost:8000/ws/echo/<room_name>/` upgrades to WebSocket.
2. Unauthenticated connections are closed with code `4001`.
3. A message sent by any client in a room is echoed to **all** subscribers of that room.
4. Channel layer uses Redis (Docker Compose service).
5. `/dashboard/websocket` protected frontend page connects, sends, and displays messages.
6. Existing pytest suite and frontend lint/format checks pass.

## Architecture

- **Auth flow**: Consumer accepts the socket → waits for first message `{"type": "auth", "token": "<access>"}` → validates JWT with `UntypedToken` → adds to group or closes `4001`. Token never appears in the URL or server logs.
- **Channel layer**: `channels-redis` pointing at a `redis:7-alpine` Docker Compose service.
- **Frontend**: `useWebSocket` custom hook wraps native `WebSocket`, sends auth message on `onopen`, exposes `messages`, `isConnected`, `sendMessage`.

## Implementation Steps

### 1. Docker Compose — add Redis service

In `docker-compose.yml` add:
```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
```
Add `redis` as a dependency of the `backend` service.
Add `CHANNEL_LAYERS_REDIS_URL: redis://redis:6379` to the `backend` environment block.

### 2. Backend — install dependencies

Add to `backend/pyproject.toml`:
```
"channels>=4.2.0"
"channels-redis>=4.2.0"
```
Run `uv sync` inside the container.

### 3. Django settings (`backend/backend/settings.py`)

```python
INSTALLED_APPS += ["channels", "websocket"]
ASGI_APPLICATION = "backend.asgi.application"
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {"hosts": [env("CHANNEL_LAYERS_REDIS_URL", default="redis://localhost:6379")]},
    }
}
```

### 4. ASGI routing (`backend/backend/asgi.py`)

```python
from channels.routing import ProtocolTypeRouter, URLRouter
from websocket.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": URLRouter(websocket_urlpatterns),
})
```

### 5. New `websocket` Django app

**`backend/websocket/consumers.py`** — `EchoConsumer(AsyncWebsocketConsumer)`:
- `connect()`: accept unconditionally, set state to `awaiting_auth`
- `receive(text_data)`: on first message parse JSON, validate `UntypedToken(token)`, join group, set state to `authenticated`; on subsequent messages call `group_send`
- `disconnect()`: group_discard if authenticated
- `echo_message()`: send to client

**`backend/websocket/routing.py`**:
```python
re_path(r"ws/echo/(?P<room_name>\w+)/$", EchoConsumer.as_asgi())
```

### 6. Frontend — environment variable

Add to `.env`:
```
VITE_WS_BASE_URL=ws://localhost:8000
```

### 7. Frontend — `useWebSocket` hook

`frontend/src/hooks/useWebSocket.ts`:
- Connect on mount (when `access` token available)
- `onopen`: send `{"type": "auth", "token": access}`
- `onmessage`: append to `messages` state
- `onclose`: set `isConnected = false`
- Expose: `{ messages, isConnected, sendMessage }`

### 8. Frontend — demo page

`frontend/src/pages/Dashboard/WebSocketDemo.tsx`:
- Uses `useWebSocket("global")`
- Text input + Send button
- Scrollable message list
- Bootstrap styling matching existing Dashboard

### 9. Wire up the route

- Add `<Route path="websocket" element={<WebSocketDemo />} />` inside the protected `/` route in `Router.tsx`
- Add nav link in `MainNavbar`

## Out of Scope

- Persistence of messages
- Presence/typing indicators
- Production TLS/WSS configuration
- Redis auth/password

## Risks

| Risk | Mitigation |
|---|---|
| `channels-redis` version conflict | Use `channels-redis>=4.2` which supports Django 5.x and channels 4.x |
| First-message window (socket open but not yet authed) | State machine in consumer; no group_send allowed until authenticated |
| Token in memory only (not localStorage) | Hook re-connects when `access` changes; no stale token risk |
