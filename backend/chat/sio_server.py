import socketio
import logging
from rest_framework_simplejwt.tokens import AccessToken, TokenError
from rest_framework_simplejwt.exceptions import InvalidToken
from django.contrib.auth import get_user_model
from django.conf import settings
from asgiref.sync import sync_to_async
from datetime import datetime, timezone

logger = logging.getLogger(__name__)
User = get_user_model()

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=settings.CORS_ALLOWED_ORIGINS,
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
        logger.info(f"User {user.username} connected: {sid}")

        await sio.emit(
            "connected", {"message": f"Welcome {user.username}!", "sid": sid}, to=sid
        )

    except (InvalidToken, TokenError) as e:
        logger.warning(f"Authentication failed - invalid token: {str(e)}")
        raise ConnectionRefusedError("Invalid authentication token")
    except User.DoesNotExist:
        logger.warning("Authentication failed - user not found for token")
        raise ConnectionRefusedError("Invalid authentication token")


@sio.event
async def disconnect(sid):
    try:
        session = await sio.get_session(sid)
        username = session.get("username", "Unknown") if session else "Unknown"
        logger.info(f"User {username} disconnected: {sid}")
    except Exception as e:
        logger.error(f"Error during disconnect for {sid}: {str(e)}")


MAX_MESSAGE_LENGTH = 1000


@sio.event
async def echo(sid, data):
    session = await sio.get_session(sid)
    username = session.get("username", "Unknown")

    message = data.get("message", "")

    if len(message) > MAX_MESSAGE_LENGTH:
        logger.warning(
            f"Message from {username} exceeds max length: {len(message)} chars"
        )
        await sio.emit(
            "error",
            {"message": f"Message too long. Maximum {MAX_MESSAGE_LENGTH} characters."},
            to=sid,
        )
        return

    sanitized_message = message.strip()

    logger.info(f"Echo from {username}: {sanitized_message}")

    await sio.emit(
        "echo_response",
        {
            "message": sanitized_message,
            "username": username,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
        to=sid,
    )
