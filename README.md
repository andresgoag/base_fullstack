# Project Documentation

## Overview

This project is a fullstack application. The `frontend` directory contains a web application built with React, TypeScript, and Vite. It is set up for development with Docker compose.

---

## Frontend Details

- **Framework:** React
- **Language:** TypeScript
- **Build Tool:** Vite
- **Linting:** ESLint
- **Styling:** SCSS (with Bootstrap)
- **Docker:** Development Dockerfile provided (`frontend/Dockerfile.dev`)

## Setup

1. Open a terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   bun install
   ```

## How to Run the project

### 1. Using Docker Compose (Recommended)

From the project root, run:

```bash
docker compose up --build
```

This will build and start all services defined in `docker-compose.yml`

### 2. Manual Run

1. Open a terminal and navigate to the `frontend` directory:

   ```bash
   cd frontend
   ```

2. Start the development server:
   ```bash
   bun run dev
   ```

## Linting

To check code quality with ESLint:

```bash
cd frontend
bun run lint
```

## Backend install libraries

```bash
uv add requests
```

change the secret key in the settings to an environment variable when used in prod

## WebSocket Integration

This project includes real-time WebSocket capabilities using Django Channels with Socket.IO. The integration supports JWT authentication and provides a foundation for building real-time features.

### Architecture

**Backend:**
- Django Channels with Daphne (ASGI server)
- python-socketio for Socket.IO protocol support
- JWT authentication via access tokens
- Event-based communication pattern

**Frontend:**
- socket.io-client for WebSocket connections
- WebSocketContext for state management
- Auto-connection with authentication
- Toast notifications for connection events

### Using WebSockets in Your Application

#### Backend: Adding New Socket.IO Events

To add new WebSocket events on the backend, edit `backend/chat/sio_server.py`:

```python
@sio.event
async def your_event_name(sid, data):
    session = await sio.get_session(sid)
    user_id = session.get('user_id')
    username = session.get('username')

    # Process the incoming data
    result = process_your_data(data)

    # Emit response back to the client
    await sio.emit('your_response_event', {
        'result': result,
        'username': username
    }, to=sid)

    # Or broadcast to all connected clients
    await sio.emit('broadcast_event', {'data': result})

    # Or emit to specific room
    await sio.emit('room_event', {'data': result}, room='room_name')
```

**Key Points:**
- Use `@sio.event` decorator for event handlers
- First parameter is always `sid` (session ID)
- Access user data via `await sio.get_session(sid)`
- Emit responses using `await sio.emit(event_name, data, to=sid)`
- Use async/await pattern for all operations

#### Frontend: Using WebSocket Context in Components

The WebSocketContext provides access to the Socket.IO connection:

```typescript
import { useWebSocketContext } from "context/websocket/WebSocketContext";

export const YourComponent = () => {
  const { socket, isConnected } = useWebSocketContext();
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!socket) return;

    // Listen for events from the server
    const handleYourEvent = (data) => {
      console.log("Received data:", data);
      setData(data);
    };

    socket.on("your_response_event", handleYourEvent);

    // Cleanup listener on unmount
    return () => {
      socket.off("your_response_event", handleYourEvent);
    };
  }, [socket]);

  const sendData = () => {
    if (socket && isConnected) {
      socket.emit("your_event_name", { message: "Hello" });
    }
  };

  return (
    <div>
      <button onClick={sendData} disabled={!isConnected}>
        Send Data
      </button>
    </div>
  );
};
```

**Key Points:**
- Import `useWebSocketContext` hook
- Check `isConnected` before emitting events
- Always clean up event listeners in useEffect return
- Socket is `null` until user is authenticated

#### Adding Custom Methods to WebSocketContext

To add reusable WebSocket methods, edit `frontend/src/context/websocket/WebSocketContextProvider.tsx`:

```typescript
const sendCustomData = useCallback(
  (data: CustomDataType) => {
    if (socket && isConnected) {
      socket.emit("custom_event", data);
    } else {
      showToast({
        type: "warning",
        message: "Not connected to WebSocket server",
      });
    }
  },
  [socket, isConnected, showToast]
);

// Add to context value
return (
  <WebSocketContext.Provider
    value={{
      socket,
      isConnected,
      sendEcho,
      sendCustomData, // Add your new method
    }}
  >
    {children}
  </WebSocketContext.Provider>
);
```

Then update the context interface in `WebSocketContext.tsx`:

```typescript
interface WebSocketContextObject {
  socket: Socket | null;
  isConnected: boolean;
  sendEcho: (message: string) => void;
  sendCustomData: (data: CustomDataType) => void; // Add your method
}
```

### Example: Echo Chat Feature

The project includes an example echo chat implementation:

**Backend Event Handler** (`backend/chat/sio_server.py`):
```python
@sio.event
async def echo(sid, data):
    session = await sio.get_session(sid)
    username = session.get('username', 'Unknown')
    message = data.get('message', '')

    await sio.emit('echo_response', {
        'message': message,
        'username': username,
        'timestamp': datetime.now().isoformat()
    }, to=sid)
```

**Frontend Component** (`frontend/src/components/EchoChat/EchoChat.tsx`):
- Displays connection status
- Sends messages via `sendEcho` method
- Listens for `echo_response` events
- Displays messages with username and timestamp

### Environment Variables

**Backend** (`.env`):
```
WEBSOCKET_URL=ws://localhost:8000
```

**Frontend** (`frontend/.env`):
```
VITE_WEBSOCKET_URL=ws://localhost:8000
```

### Testing WebSocket Connections

**Manual Testing:**
1. Start the application: `docker compose up --build`
2. Login to the frontend at http://localhost:5173
3. Navigate to the Dashboard
4. Check browser console for "WebSocket connected"
5. Use the Echo Chat component to test bidirectional communication
6. Check Network tab → WS for WebSocket frames

**Backend Logs:**
```bash
# View WebSocket connection logs
docker compose logs -f backend | grep "socket.io"

# Check Daphne ASGI server
docker compose exec backend ps aux | grep daphne
```

### Common WebSocket Patterns

**Broadcasting to All Users:**
```python
await sio.emit('notification', {'message': 'Server announcement'})
```

**Rooms for Group Communication:**
```python
# Join a room
await sio.enter_room(sid, 'room_name')

# Leave a room
await sio.leave_room(sid, 'room_name')

# Emit to room
await sio.emit('room_message', {'data': 'Hello room'}, room='room_name')
```

**Getting All Connected Users:**
```python
# Get all session IDs
sessions = await sio.get_session()
```

### Production Considerations

For production deployments:

1. **Use Redis for Channel Layer** (backend/backend/settings.py):
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

2. **Use WSS (Secure WebSocket):**
   ```
   VITE_WEBSOCKET_URL=wss://your-domain.com
   ```

3. **Configure Load Balancer:**
   - Enable sticky sessions for WebSocket connections
   - Use Redis channel layer for multi-server deployments

4. **Add Rate Limiting:**
   - Limit events per user per minute
   - Prevent abuse of WebSocket connections

### Troubleshooting

**WebSocket won't connect:**
- Check if user is authenticated (access token exists)
- Verify VITE_WEBSOCKET_URL matches backend URL
- Check browser console for connection errors
- Verify Daphne is running: `docker compose logs backend`

**Events not received:**
- Ensure event listener is registered before emitting
- Check event name matches between frontend and backend
- Verify socket is connected: `isConnected === true`
- Check backend logs for errors

**Token expired during WebSocket session:**
- Connection will automatically reconnect when token refreshes
- Implemented in WebSocketContextProvider via useEffect dependency on `access` token
