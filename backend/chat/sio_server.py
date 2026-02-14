import socketio
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async
from datetime import datetime

User = get_user_model()

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="http://localhost:5173",
    logger=True,
    engineio_logger=True,
)


@sio.event
async def connect(sid, environ, auth):
    token = auth.get("token") if auth else None

    if not token:
        raise ConnectionRefusedError("Authentication token required")

    try:
        access_token = AccessToken(token)
        user_id = access_token["user_id"]
        user = await sync_to_async(User.objects.get)(id=user_id)

        await sio.save_session(sid, {"user_id": user_id, "username": user.username})
        print(f"User {user.username} connected: {sid}")

        await sio.emit(
            "connected", {"message": f"Welcome {user.username}!", "sid": sid}, to=sid
        )

    except Exception as e:
        print(f"Authentication failed: {str(e)}")
        raise ConnectionRefusedError("Invalid authentication token")


@sio.event
async def disconnect(sid):
    session = await sio.get_session(sid)
    username = session.get("username", "Unknown")
    print(f"User {username} disconnected: {sid}")


@sio.event
async def echo(sid, data):
    session = await sio.get_session(sid)
    username = session.get("username", "Unknown")

    message = data.get("message", "")
    print(f"Echo from {username}: {message}")

    await sio.emit(
        "echo_response",
        {
            "message": message,
            "username": username,
            "timestamp": datetime.now().isoformat(),
        },
        to=sid,
    )
