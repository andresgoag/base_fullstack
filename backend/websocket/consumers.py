import json
from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class EchoConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.group_name = f"echo_{self.room_name}"
        self.authenticated = False
        await self.accept()

    async def disconnect(self, code):
        if self.authenticated:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        if not self.authenticated:
            try:
                data = json.loads(text_data)
                if data.get("type") != "auth":
                    await self.close(code=4001)
                    return
                UntypedToken(data["token"])
                self.authenticated = True
                await self.channel_layer.group_add(self.group_name, self.channel_name)
            except (InvalidToken, TokenError, KeyError, json.JSONDecodeError):
                await self.close(code=4001)
            return
        await self.channel_layer.group_send(
            self.group_name,
            {"type": "echo.message", "message": text_data},
        )

    async def echo_message(self, event):
        await self.send(text_data=event["message"])
