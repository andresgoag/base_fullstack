# WebSocket Echo Integration Implementation Plan

## Overview

This plan adds real-time WebSocket capabilities to the Django/React fullstack application using Django Channels on the backend with python-socketio for Socket.IO protocol support, and socket.io-client on the frontend. The implementation includes JWT authentication for secure WebSocket connections and a simple echo feature to demonstrate real-time bidirectional communication.

## Architecture Decision

After researching the integration options, the recommended approach is:

**Backend**: Django Channels + python-socketio (ASGI mode) + Daphne
- Django Channels provides the ASGI infrastructure
- python-socketio adds Socket.IO protocol support as an ASGI application
- Both can coexist in the same ASGI routing configuration
- Daphne serves as the ASGI server (replaces Django's WSGI server)

**Frontend**: socket.io-client (React)
- Standard Socket.IO client library for JavaScript
- Integrates with existing React Context pattern
- Supports JWT authentication via query parameters

## 1. Backend Changes

### 1.1 Dependencies (pyproject.toml)

Add the following packages to the `dependencies` array:

```toml
"channels>=4.3.0",
"channels-redis>=4.2.0",
"python-socketio>=5.13.0",
"daphne>=4.2.0",
```

**Rationale**:
- `channels`: Core WebSocket support for Django
- `channels-redis`: Redis channel layer for production (optional for dev, uses in-memory)
- `python-socketio`: Socket.IO server implementation
- `daphne`: ASGI HTTP/WebSocket server

### 1.2 Django Settings Updates (backend/backend/settings.py)

Add after existing `INSTALLED_APPS`:

```python
INSTALLED_APPS = [
    "daphne",  # Must be first for ASGI
    "django.contrib.admin",
    # ... existing apps ...
    "channels",
]

ASGI_APPLICATION = "backend.asgi.application"

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer"
    },
}

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
]

CORS_ALLOW_CREDENTIALS = True
```

**Notes**:
- `daphne` must be listed first in INSTALLED_APPS to handle ASGI properly
- `InMemoryChannelLayer` is fine for development; use Redis for production
- CORS credentials are needed for Socket.IO cookie-based fallbacks

### 1.3 ASGI Configuration (backend/backend/asgi.py)

Replace the entire file:

```python
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
import socketio
from chat.sio_server import sio

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        socketio.ASGIApp(sio, django_asgi_app)
    ),
})
```

**Rationale**:
- `ProtocolTypeRouter` routes between HTTP and WebSocket protocols
- Socket.IO ASGI app handles WebSocket connections
- Falls back to Django ASGI app for standard HTTP requests
- `AllowedHostsOriginValidator` provides CORS protection

### 1.4 Create New Django App: `chat`

```bash
cd backend
uv run manage.py startapp chat
```

Add `"chat"` to `INSTALLED_APPS` in settings.py.

### 1.5 Socket.IO Server (backend/chat/sio_server.py)

Create new file:

```python
import socketio
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async
from datetime import datetime

User = get_user_model()

sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='http://localhost:5173',
    logger=True,
    engineio_logger=True
)

@sio.event
async def connect(sid, environ, auth):
    token = auth.get('token') if auth else None

    if not token:
        raise ConnectionRefusedError('Authentication token required')

    try:
        access_token = AccessToken(token)
        user_id = access_token['user_id']
        user = await sync_to_async(User.objects.get)(id=user_id)

        await sio.save_session(sid, {'user_id': user_id, 'username': user.username})
        print(f'User {user.username} connected: {sid}')

        await sio.emit('connected', {
            'message': f'Welcome {user.username}!',
            'sid': sid
        }, to=sid)

    except Exception as e:
        print(f'Authentication failed: {str(e)}')
        raise ConnectionRefusedError('Invalid authentication token')

@sio.event
async def disconnect(sid):
    session = await sio.get_session(sid)
    username = session.get('username', 'Unknown')
    print(f'User {username} disconnected: {sid}')

@sio.event
async def echo(sid, data):
    session = await sio.get_session(sid)
    username = session.get('username', 'Unknown')

    message = data.get('message', '')
    print(f'Echo from {username}: {message}')

    await sio.emit('echo_response', {
        'message': message,
        'username': username,
        'timestamp': datetime.now().isoformat()
    }, to=sid)
```

**Key Features**:
- JWT authentication via `auth` parameter on connection
- Session management stores user information
- Echo event handler demonstrates bidirectional communication
- Async/await pattern for performance

### 1.6 Update Docker Configuration

**docker-compose.yml**: Update backend service command:

```yaml
backend:
  build: backend
  command: ["daphne", "-b", "0.0.0.0", "-p", "8000", "backend.asgi:application"]
  # ... rest remains the same
```

**backend/Dockerfile**: No changes needed (Daphne will be installed via pyproject.toml)

### 1.7 Environment Variables

Add to `.env.sample`:

```
WEBSOCKET_URL=ws://localhost:8000
```

Add to `frontend/.env.sample`:

```
VITE_WEBSOCKET_URL=ws://localhost:8000
```

## 2. Frontend Changes

### 2.1 Dependencies (frontend/package.json)

Add to `dependencies`:

```json
"socket.io-client": "^4.8.1"
```

Install: `bun install socket.io-client`

### 2.2 Create WebSocket Context

Create `frontend/src/context/websocket/WebSocketContext.tsx`:

```typescript
import { createContext, useContext } from "react";
import type { Socket } from "socket.io-client";

interface WebSocketContextObject {
  socket: Socket | null;
  isConnected: boolean;
  sendEcho: (message: string) => void;
}

export const WebSocketContext = createContext<WebSocketContextObject>({
  socket: null,
  isConnected: false,
  sendEcho: () => {},
});

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocketContext must be used within a WebSocketProvider");
  }
  return context;
};
```

**Pattern**: Follows the existing AuthContext pattern in the codebase.

### 2.3 Create WebSocket Provider

Create `frontend/src/context/websocket/WebSocketContextProvider.tsx`:

```typescript
import { useState, useEffect, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { WebSocketContext } from "./WebSocketContext";
import { useAuthContext } from "context/auth/AuthContext";
import { useToastContext } from "context/toast/ToastContext";

const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || "ws://localhost:8000";

type ContextProps = {
  children: React.ReactNode;
};

export const WebSocketContextProvider = ({ children }: ContextProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { access } = useAuthContext();
  const { showToast } = useToastContext();

  useEffect(() => {
    if (!access) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const newSocket = io(WEBSOCKET_URL, {
      auth: {
        token: access,
      },
      transports: ['websocket'],
    });

    newSocket.on("connect", () => {
      console.log("WebSocket connected");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      showToast({
        type: "danger",
        message: "WebSocket connection failed. Please check your authentication.",
      });
    });

    newSocket.on("connected", (data) => {
      showToast({
        type: "success",
        message: data.message,
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [access, showToast]);

  const sendEcho = useCallback(
    (message: string) => {
      if (socket && isConnected) {
        socket.emit("echo", { message });
      } else {
        showToast({
          type: "warning",
          message: "Not connected to WebSocket server",
        });
      }
    },
    [socket, isConnected, showToast]
  );

  return (
    <WebSocketContext.Provider
      value={{
        socket,
        isConnected,
        sendEcho,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};
```

**Key Features**:
- Auto-connects when user has access token
- Auto-disconnects on logout
- JWT passed via `auth` parameter
- Toast notifications for connection events
- Follows existing context provider patterns

### 2.4 Create Echo Component

Create `frontend/src/components/EchoChat/EchoChat.tsx`:

```typescript
import { useState, useEffect } from "react";
import { Form, Button, Card, ListGroup, Badge } from "react-bootstrap";
import { useWebSocketContext } from "context/websocket/WebSocketContext";

interface EchoMessage {
  message: string;
  username: string;
  timestamp: string;
}

export const EchoChat = () => {
  const { socket, isConnected, sendEcho } = useWebSocketContext();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<EchoMessage[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleEchoResponse = (data: EchoMessage) => {
      setMessages((prev) => [...prev, data]);
    };

    socket.on("echo_response", handleEchoResponse);

    return () => {
      socket.off("echo_response", handleEchoResponse);
    };
  }, [socket]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendEcho(message);
      setMessage("");
    }
  };

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">
          WebSocket Echo Chat{" "}
          <Badge bg={isConnected ? "success" : "secondary"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </h5>
      </Card.Header>
      <Card.Body>
        <ListGroup className="mb-3" style={{ maxHeight: "300px", overflowY: "auto" }}>
          {messages.length === 0 ? (
            <ListGroup.Item className="text-muted">
              No messages yet. Send a message to see the echo!
            </ListGroup.Item>
          ) : (
            messages.map((msg, idx) => (
              <ListGroup.Item key={idx}>
                <div className="d-flex justify-content-between">
                  <div>
                    <strong>{msg.username}:</strong> {msg.message}
                  </div>
                  <small className="text-muted">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </small>
                </div>
              </ListGroup.Item>
            ))
          )}
        </ListGroup>

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={!isConnected}
            />
          </Form.Group>
          <Button
            type="submit"
            variant="primary"
            disabled={!isConnected || !message.trim()}
          >
            Send Echo
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};
```

**Design**:
- Uses existing Bootstrap components (Card, Form, ListGroup, Badge)
- Real-time message display
- Connection status indicator
- Disabled state when disconnected
- Follows React best practices with controlled components

### 2.5 Update Router

Modify `frontend/src/Router.tsx`:

```typescript
import { WebSocketContextProvider } from "context/websocket/WebSocketContextProvider";

const Router = () => {
  return (
    <BrowserRouter>
      <AuthContextProvider>
        <WebSocketContextProvider>
          <Routes>
            {/* ... existing routes ... */}
          </Routes>
        </WebSocketContextProvider>
      </AuthContextProvider>
    </BrowserRouter>
  );
};
```

**Placement**: WebSocketContextProvider wraps routes inside AuthContextProvider so it has access to auth context.

### 2.6 Update Dashboard

Modify `frontend/src/pages/Dashboard/Dashboard.tsx`:

```typescript
import { useAuthContext } from "context/auth/AuthContext";
import { MainNavbar } from "components/MainNavbar/MainNavbar";
import { EchoChat } from "components/EchoChat/EchoChat";

export const Dashboard = () => {
  const { currentUser } = useAuthContext();

  return (
    <>
      <MainNavbar />
      <div className="container mt-3">
        <h1>Hello {currentUser?.first_name}!</h1>
        <h3>Dashboard</h3>

        <div className="row mt-4">
          <div className="col-md-8 offset-md-2">
            <EchoChat />
          </div>
        </div>
      </div>
    </>
  );
};
```

**Integration**: Adds EchoChat component to existing dashboard layout.

### 2.7 Environment Configuration

Update `frontend/src/config.ts`:

```typescript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL;
export const ACCESS_LIFETIME = import.meta.env.VITE_ACCESS_LIFETIME - 1;
export const REFRESH_LIFETIME = import.meta.env.VITE_REFRESH_LIFETIME - 1;
```

## 3. Testing Strategy

### 3.1 Backend Tests

Create `backend/chat/test_websocket.py`:

```python
import pytest
from channels.testing import WebsocketCommunicator
from backend.asgi import application
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from asgiref.sync import sync_to_async

User = get_user_model()

@pytest.mark.django_db
@pytest.mark.asyncio
async def test_websocket_connection_with_valid_token():
    user = await sync_to_async(User.objects.create_user)(
        username='testuser',
        email='test@example.com',
        password='testpass123'
    )

    token = str(AccessToken.for_user(user))

    communicator = WebsocketCommunicator(
        application,
        "/socket.io/",
        headers=[(b"authorization", f"Bearer {token}".encode())]
    )

    connected, _ = await communicator.connect()
    assert connected

    await communicator.disconnect()

@pytest.mark.django_db
@pytest.mark.asyncio
async def test_echo_functionality():
    user = await sync_to_async(User.objects.create_user)(
        username='testuser',
        email='test@example.com',
        password='testpass123'
    )

    token = str(AccessToken.for_user(user))

    communicator = WebsocketCommunicator(
        application,
        "/socket.io/",
        headers=[(b"authorization", f"Bearer {token}".encode())]
    )

    connected, _ = await communicator.connect()
    assert connected

    await communicator.send_json_to({
        "type": "echo",
        "message": "Hello World"
    })

    response = await communicator.receive_json_from()
    assert response["type"] == "echo_response"
    assert "Hello World" in response["message"]

    await communicator.disconnect()
```

**Coverage**:
- Authentication validation
- Echo functionality
- Connection/disconnection flow

### 3.2 Frontend Tests (Manual)

**Test Checklist**:

1. **Authentication Flow**
   - [ ] WebSocket connects automatically after login
   - [ ] WebSocket disconnects on logout
   - [ ] Connection shows proper status badge

2. **Echo Functionality**
   - [ ] Send message and receive echo response
   - [ ] Messages display with username and timestamp
   - [ ] Input field clears after sending

3. **Error Handling**
   - [ ] Cannot send messages when disconnected
   - [ ] Toast notification on connection error
   - [ ] Proper error message for invalid token

4. **Connection Persistence**
   - [ ] Reconnects after page refresh (if token valid)
   - [ ] Maintains connection across navigation
   - [ ] Handles network interruptions gracefully

### 3.3 Integration Testing

**Docker Environment Test**:

```bash
# Start all services
docker compose up --build

# Check backend logs for WebSocket connections
docker compose logs -f backend

# Check for Socket.IO handshake messages
docker compose logs backend | grep "socket.io"

# Verify Daphne is running
docker compose exec backend ps aux | grep daphne
```

**Manual Browser Testing**:
1. Open http://localhost:5173
2. Login with valid credentials
3. Navigate to Dashboard
4. Check browser console for WebSocket connection logs
5. Send echo message and verify response
6. Check Network tab for WebSocket frames

## 4. Configuration Updates Summary

### 4.1 Backend Files Created/Modified

**Created**:
- `backend/chat/__init__.py`
- `backend/chat/apps.py`
- `backend/chat/sio_server.py`
- `backend/chat/test_websocket.py`

**Modified**:
- `backend/backend/settings.py`
- `backend/backend/asgi.py`
- `backend/pyproject.toml`
- `docker-compose.yml`
- `.env.sample`

### 4.2 Frontend Files Created/Modified

**Created**:
- `frontend/src/context/websocket/WebSocketContext.tsx`
- `frontend/src/context/websocket/WebSocketContextProvider.tsx`
- `frontend/src/components/EchoChat/EchoChat.tsx`

**Modified**:
- `frontend/package.json`
- `frontend/src/Router.tsx`
- `frontend/src/pages/Dashboard/Dashboard.tsx`
- `frontend/src/config.ts`
- `frontend/.env.sample`

## 5. Implementation Sequence

**Phase 1: Backend Setup (30-45 min)**
1. Add dependencies to pyproject.toml
2. Run `uv sync` to install packages
3. Update settings.py with ASGI configuration
4. Create chat app: `uv run manage.py startapp chat`
5. Create sio_server.py with Socket.IO handlers
6. Update asgi.py with ProtocolTypeRouter
7. Test locally: `uv run daphne backend.asgi:application`

**Phase 2: Docker Configuration (10-15 min)**
1. Update docker-compose.yml backend command
2. Update environment files
3. Test: `docker compose up --build`
4. Verify Daphne logs show ASGI server running

**Phase 3: Frontend Context & Infrastructure (20-30 min)**
1. Install socket.io-client: `bun install socket.io-client`
2. Create WebSocketContext.tsx
3. Create WebSocketContextProvider.tsx
4. Update config.ts with WEBSOCKET_URL
5. Update Router.tsx with provider

**Phase 4: Frontend UI Component (15-20 min)**
1. Create EchoChat component
2. Update Dashboard to include EchoChat
3. Test connection in browser console

**Phase 5: Testing & Debugging (30-45 min)**
1. Write backend tests
2. Run pytest: `uv run pytest chat/test_websocket.py`
3. Manual frontend testing checklist
4. Check WebSocket frames in browser DevTools
5. Verify authentication flow

**Phase 6: Documentation (10-15 min)**
1. Update README.md with WebSocket setup instructions
2. Document environment variables
3. Add troubleshooting section

**Total Estimated Time**: 2-3 hours

## 6. Potential Challenges & Solutions

### Challenge 1: Socket.IO and Django Channels Coexistence

**Issue**: Socket.IO uses its own protocol on top of WebSocket, which differs from native Channels consumers.

**Solution**: Use ProtocolTypeRouter to route WebSocket connections to Socket.IO's ASGI app while maintaining HTTP routing to Django. This is the recommended approach per python-socketio documentation.

### Challenge 2: JWT Authentication in WebSocket

**Issue**: WebSockets don't support HTTP headers like REST APIs, so JWT can't be sent via Authorization header.

**Solution**: Use Socket.IO's `auth` parameter on connection. The client passes the token during the handshake, and the server validates it before accepting the connection. This is a standard pattern for WebSocket JWT authentication.

### Challenge 3: Token Refresh During Long WebSocket Sessions

**Issue**: Access tokens expire (default 5 minutes), but WebSocket connection remains open.

**Solution**: Implement one of these strategies:
- **Option A (Simple)**: Disconnect and reconnect when access token refreshes (implemented in provider)
- **Option B (Advanced)**: Emit token refresh event to update session without reconnecting

For this MVP, Option A is implemented as it leverages existing token refresh logic in AuthContextProvider.

### Challenge 4: CORS Configuration

**Issue**: Socket.IO requires specific CORS settings for cross-origin WebSocket connections.

**Solution**: Configure both Django CORS settings (`CORS_ALLOW_CREDENTIALS = True`) and Socket.IO CORS settings (`cors_allowed_origins`) to match the frontend origin.

### Challenge 5: Docker Networking

**Issue**: WebSocket URL differs between local and containerized environments.

**Solution**: Use environment variables (`VITE_WEBSOCKET_URL`) to configure the URL based on deployment environment. Default to `ws://localhost:8000` for development.

## 7. Production Considerations (Future)

This implementation is development-ready. For production:

1. **Channel Layer**: Replace InMemoryChannelLayer with Redis
   ```python
   CHANNEL_LAYERS = {
       "default": {
           "BACKEND": "channels_redis.core.RedisChannelLayer",
           "CONFIG": {
               "hosts": [("redis", 6379)],
           },
       },
   }
   ```

2. **WebSocket URL**: Use environment-specific URLs (wss:// for production)

3. **Connection Pooling**: Configure Socket.IO connection limits

4. **Monitoring**: Add logging and metrics for WebSocket connections

5. **Load Balancing**: Configure sticky sessions for multi-server deployments

6. **Security**: Add rate limiting for WebSocket events

## 8. Extensibility

This architecture supports adding more real-time features:

- **Chat Rooms**: Add room management to Socket.IO server
- **Notifications**: Create notification events and handlers
- **Collaborative Editing**: Implement operational transformation
- **Live Updates**: Subscribe to Django model changes via signals
- **Presence System**: Track online users with session management

The separation between Socket.IO (for real-time communication) and Django Channels (for ASGI infrastructure) allows flexibility in choosing the right tool for each feature.
