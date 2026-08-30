import asyncio
import json
import time
from collections import deque
from uuid import uuid4

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken

from websocket.protocol import (
    CLOSE_AUTH_TIMEOUT,
    CLOSE_MESSAGE_TOO_LARGE,
    CLOSE_RATE_LIMIT_EXCEEDED,
    CLOSE_TOKEN_EXPIRED,
    CLOSE_UNAUTHORIZED,
    ERROR_INVALID_MESSAGE,
    ERROR_UNSUPPORTED_TYPE,
    MAX_MESSAGE_LENGTH,
)

User = get_user_model()


@database_sync_to_async
def get_active_user(user_id):
    return User.objects.filter(pk=user_id, is_active=True).first()


class EchoConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.group_name = f"echo_{self.room_name}"
        self.user = None
        self.token_expires_at = None
        self.recent_message_times = deque()
        self.is_closing = False
        self.expiry_task = None
        await self.accept()
        self.auth_timeout_task = asyncio.create_task(self.close_if_not_authenticated())

    async def disconnect(self, code):
        for task in (self.auth_timeout_task, self.expiry_task):
            if task is not None:
                task.cancel()
        if self.user is not None and self.channel_layer:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        if self.is_closing:
            return
        if text_data is None:
            await self.close_once(CLOSE_UNAUTHORIZED)
            return
        if len(text_data) > MAX_MESSAGE_LENGTH:
            await self.close_once(CLOSE_MESSAGE_TOO_LARGE)
            return
        try:
            content = json.loads(text_data)
        except json.JSONDecodeError:
            await self.close_once(CLOSE_UNAUTHORIZED)
            return
        if not isinstance(content, dict):
            await self.close_once(CLOSE_UNAUTHORIZED)
            return
        await self.receive_json(content)

    async def receive_json(self, content, **kwargs):
        message_type = content.get("type")
        if message_type == "auth":
            await self.authenticate(content)
            return
        if self.user is None:
            await self.close_once(CLOSE_UNAUTHORIZED)
            return
        if await self.has_expired_token():
            return
        if message_type == "ping":
            await self.send_json({"type": "pong"})
            return
        if message_type == "message":
            await self.broadcast(content)
            return
        await self.send_error(ERROR_UNSUPPORTED_TYPE, "Unsupported message type.")

    async def authenticate(self, content):
        token = content.get("token")
        if not isinstance(token, str) or not token:
            await self.close_once(CLOSE_UNAUTHORIZED)
            return
        try:
            access_token = AccessToken(token)
        except (InvalidToken, TokenError):
            await self.close_once(CLOSE_UNAUTHORIZED)
            return
        user = await get_active_user(access_token.payload.get("user_id"))
        if user is None or not await self.is_user_allowed_in_room(user, self.room_name):
            await self.close_once(CLOSE_UNAUTHORIZED)
            return
        is_first_authentication = self.user is None
        self.user = user
        self.token_expires_at = float(access_token.payload["exp"])
        self.watch_token_expiry()
        if is_first_authentication:
            await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.send_json({"type": "auth_ok", "user_id": user.pk})

    async def is_user_allowed_in_room(self, user, room_name):
        return True

    async def broadcast(self, content):
        text = content.get("text")
        if not isinstance(text, str) or not text.strip():
            await self.send_error(ERROR_INVALID_MESSAGE, "A message needs text.")
            return
        if self.has_exceeded_rate_limit():
            await self.close_once(CLOSE_RATE_LIMIT_EXCEEDED)
            return
        self.recent_message_times.append(time.monotonic())
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "echo.message",
                "message": {
                    "type": "message",
                    "id": str(uuid4()),
                    "room": self.room_name,
                    "sender": self.user.email,
                    "text": text,
                    "sent_at": timezone.now().isoformat(),
                },
            },
        )

    async def echo_message(self, event):
        await self.send_json(event["message"])

    async def send_error(self, code, detail):
        await self.send_json({"type": "error", "code": code, "detail": detail})

    async def close_once(self, code):
        if self.is_closing:
            return
        self.is_closing = True
        await self.close(code=code)

    async def close_if_not_authenticated(self):
        await asyncio.sleep(settings.WEBSOCKET_AUTH_TIMEOUT_SECONDS)
        if self.user is None:
            await self.close_once(CLOSE_AUTH_TIMEOUT)

    async def close_when_token_expires(self):
        await asyncio.sleep(max(self.token_expires_at - time.time(), 0))
        await self.close_once(CLOSE_TOKEN_EXPIRED)

    def watch_token_expiry(self):
        if self.expiry_task is not None:
            self.expiry_task.cancel()
        self.expiry_task = asyncio.create_task(self.close_when_token_expires())

    async def has_expired_token(self):
        if self.token_expires_at is not None and time.time() >= self.token_expires_at:
            await self.close_once(CLOSE_TOKEN_EXPIRED)
            return True
        return False

    def has_exceeded_rate_limit(self):
        window_start = time.monotonic() - settings.WEBSOCKET_RATE_LIMIT_WINDOW_SECONDS
        while self.recent_message_times and self.recent_message_times[0] < window_start:
            self.recent_message_times.popleft()
        return len(self.recent_message_times) >= settings.WEBSOCKET_RATE_LIMIT_MESSAGES
