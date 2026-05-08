import json
from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class EchoConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.group_name = f"echo_{self.room_name}"
        self.authenticated = False
        self.closing = False
        await self.accept()

    async def disconnect(self, code):
        if self.authenticated and self.channel_layer:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        if self.closing:
            return
        if not self.authenticated:
            try:
                data = json.loads(text_data)
                if data.get("type") != "auth" or not data.get("token"):
                    self.closing = True
                    await self.close(code=4001)
                    return
                UntypedToken(data["token"])
                self.authenticated = True
                await self.channel_layer.group_add(self.group_name, self.channel_name)
                await self.send(text_data=json.dumps({"type": "auth_ok"}))
            except (InvalidToken, TokenError, json.JSONDecodeError):
                self.closing = True
                await self.close(code=4001)
            return
        if len(text_data) > 4096:
            self.closing = True
            await self.close(code=4002)
            return
        await self.channel_layer.group_send(
            self.group_name,
            {"type": "echo.message", "message": text_data},
        )

    async def echo_message(self, event):
        await self.send(text_data=event["message"])
