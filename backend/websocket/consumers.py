import json
from channels.generic.websocket import AsyncWebsocketConsumer
from websocket.authentication import authenticate_access_token

MAX_MESSAGE_BYTES = 4096
AUTHENTICATION_FAILED_CODE = 4001
MESSAGE_TOO_LARGE_CODE = 4002
INVALID_MESSAGE_CODE = 4003


class EchoConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.group_name = f"echo_{self.room_name}"
        self.connection = None
        self.closing = False
        await self.accept()

    async def disconnect(self, code):
        if self.connection is not None and self.channel_layer:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        if self.closing:
            return
        if len(text_data.encode("utf-8")) > MAX_MESSAGE_BYTES:
            await self._close(MESSAGE_TOO_LARGE_CODE)
            return
        if self.connection is None:
            await self._authenticate(text_data)
            return
        await self._broadcast(text_data)

    async def _authenticate(self, text_data):
        token = self._read_auth_token(text_data)
        if token is None:
            await self._close(AUTHENTICATION_FAILED_CODE)
            return
        connection = await authenticate_access_token(token)
        if connection is None:
            await self._close(AUTHENTICATION_FAILED_CODE)
            return
        self.connection = connection
        self.scope["user"] = connection.user
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.send(
            text_data=json.dumps(
                {
                    "type": "auth_ok",
                    "user_id": connection.user.pk,
                    "expires_at": connection.expires_at.isoformat(),
                }
            )
        )

    def _read_auth_token(self, text_data):
        try:
            message = json.loads(text_data)
        except json.JSONDecodeError:
            return None
        if not isinstance(message, dict) or message.get("type") != "auth":
            return None
        return message.get("token") or None

    async def _broadcast(self, text_data):
        text = self._read_message_text(text_data)
        if text is None:
            await self._close(INVALID_MESSAGE_CODE)
            return
        await self.channel_layer.group_send(
            self.group_name,
            {"type": "echo.message", "text": text},
        )

    def _read_message_text(self, text_data):
        try:
            message = json.loads(text_data)
        except json.JSONDecodeError:
            return None
        if not isinstance(message, dict) or message.get("type") != "message":
            return None
        text = message.get("text")
        if not isinstance(text, str) or not text:
            return None
        return text

    async def echo_message(self, event):
        await self.send(
            text_data=json.dumps({"type": "message", "text": event["text"]})
        )

    async def _close(self, code):
        self.closing = True
        await self.close(code=code)
