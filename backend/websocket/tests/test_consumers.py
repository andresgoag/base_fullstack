import uuid
from datetime import timedelta

import pytest
from channels.testing import WebsocketCommunicator
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken

from backend.asgi import application
from websocket.protocol import (
    CLOSE_AUTH_TIMEOUT,
    CLOSE_MESSAGE_TOO_LARGE,
    CLOSE_RATE_LIMIT_EXCEEDED,
    CLOSE_TOKEN_EXPIRED,
    CLOSE_UNAUTHORIZED,
)
from websocket.routing import websocket_urlpatterns

ALLOWED_ORIGIN_HEADERS = [(b"origin", b"http://localhost:5173")]


def build_communicator(path, headers=None):
    return WebsocketCommunicator(
        application,
        path,
        headers=ALLOWED_ORIGIN_HEADERS if headers is None else headers,
    )


@pytest.fixture
def user(db):
    unique_id = uuid.uuid4()
    return get_user_model().objects.create_user(
        email=f"test-{unique_id}@example.com",
        phone=f"+1415555{str(unique_id.int)[:4]}",
        password="testpassword123",
        first_name="Test",
        last_name="User",
    )


@pytest.fixture
def valid_token(user):
    return str(AccessToken.for_user(user))


@pytest.fixture
def refresh_token(user):
    return str(RefreshToken.for_user(user))


@pytest.fixture
def channel_layer_settings(settings):
    settings.CHANNEL_LAYERS = {
        "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}
    }
    settings.ALLOWED_HOSTS = ["localhost", "127.0.0.1", "testserver"]
    yield


async def connect_authenticated(token, path="/ws/echo/room1/"):
    communicator = build_communicator(path)
    await communicator.connect()
    await communicator.send_json_to({"type": "auth", "token": token})
    await communicator.receive_json_from()
    return communicator


@pytest.mark.django_db(transaction=True)
async def test_connect_and_auth_ok(user, valid_token, channel_layer_settings):
    communicator = build_communicator("/ws/echo/room1/")
    connected, _ = await communicator.connect()
    assert connected
    await communicator.send_json_to({"type": "auth", "token": valid_token})
    response = await communicator.receive_json_from()
    assert response == {"type": "auth_ok", "user_id": user.pk}
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_rejects_a_disallowed_origin(valid_token, channel_layer_settings):
    communicator = build_communicator(
        "/ws/echo/room1/", headers=[(b"origin", b"https://evil.example.com")]
    )
    connected, _ = await communicator.connect()
    assert not connected
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_rejects_a_refresh_token(refresh_token, channel_layer_settings):
    communicator = build_communicator("/ws/echo/room1/")
    await communicator.connect()
    await communicator.send_json_to({"type": "auth", "token": refresh_token})
    response = await communicator.receive_output()
    assert response["type"] == "websocket.close"
    assert response["code"] == CLOSE_UNAUTHORIZED
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_rejects_an_expired_token(user, channel_layer_settings):
    expired_token = AccessToken.for_user(user)
    expired_token.set_exp(lifetime=timedelta(seconds=-1))
    communicator = build_communicator("/ws/echo/room1/")
    await communicator.connect()
    await communicator.send_json_to({"type": "auth", "token": str(expired_token)})
    response = await communicator.receive_output()
    assert response["type"] == "websocket.close"
    assert response["code"] == CLOSE_UNAUTHORIZED
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_rejects_a_token_for_an_inactive_user(user, channel_layer_settings):
    token = str(AccessToken.for_user(user))
    user.is_active = False
    await user.asave()
    communicator = build_communicator("/ws/echo/room1/")
    await communicator.connect()
    await communicator.send_json_to({"type": "auth", "token": token})
    response = await communicator.receive_output()
    assert response["type"] == "websocket.close"
    assert response["code"] == CLOSE_UNAUTHORIZED
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_closes_a_socket_that_never_authenticates(
    settings, channel_layer_settings
):
    settings.WEBSOCKET_AUTH_TIMEOUT_SECONDS = 0.1
    communicator = build_communicator("/ws/echo/room1/")
    await communicator.connect()
    response = await communicator.receive_output(timeout=2)
    assert response["type"] == "websocket.close"
    assert response["code"] == CLOSE_AUTH_TIMEOUT
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_closes_the_socket_when_the_token_expires(user, channel_layer_settings):
    short_lived_token = AccessToken.for_user(user)
    short_lived_token.set_exp(lifetime=timedelta(seconds=1))
    communicator = await connect_authenticated(str(short_lived_token))
    response = await communicator.receive_output(timeout=3)
    assert response["type"] == "websocket.close"
    assert response["code"] == CLOSE_TOKEN_EXPIRED
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_invalid_token_closes_connection(channel_layer_settings):
    communicator = build_communicator("/ws/echo/room1/")
    await communicator.connect()
    await communicator.send_json_to({"type": "auth", "token": "invalid.token.here"})
    response = await communicator.receive_output()
    assert response["type"] == "websocket.close"
    assert response["code"] == CLOSE_UNAUTHORIZED
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_message_before_auth_closes_connection(channel_layer_settings):
    communicator = build_communicator("/ws/echo/room1/")
    await communicator.connect()
    await communicator.send_json_to({"type": "message", "text": "hello"})
    response = await communicator.receive_output()
    assert response["type"] == "websocket.close"
    assert response["code"] == CLOSE_UNAUTHORIZED
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_malformed_payload_closes_connection(channel_layer_settings):
    communicator = build_communicator("/ws/echo/room1/")
    await communicator.connect()
    await communicator.send_to(text_data="not json at all")
    response = await communicator.receive_output()
    assert response["type"] == "websocket.close"
    assert response["code"] == CLOSE_UNAUTHORIZED
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_oversized_message_closes_connection(valid_token, channel_layer_settings):
    communicator = await connect_authenticated(valid_token)
    await communicator.send_to(text_data="x" * 4097)
    response = await communicator.receive_output()
    assert response["type"] == "websocket.close"
    assert response["code"] == CLOSE_MESSAGE_TOO_LARGE
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_flooding_closes_the_connection(
    valid_token, settings, channel_layer_settings
):
    settings.WEBSOCKET_RATE_LIMIT_MESSAGES = 2
    communicator = await connect_authenticated(valid_token)
    for _ in range(3):
        await communicator.send_json_to({"type": "message", "text": "spam"})
    frame = await communicator.receive_output(timeout=2)
    while frame["type"] != "websocket.close":
        frame = await communicator.receive_output(timeout=2)
    assert frame["code"] == CLOSE_RATE_LIMIT_EXCEEDED
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_answers_a_ping_with_a_pong(valid_token, channel_layer_settings):
    communicator = await connect_authenticated(valid_token)
    await communicator.send_json_to({"type": "ping"})
    assert await communicator.receive_json_from() == {"type": "pong"}
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_reports_an_unsupported_message_type(valid_token, channel_layer_settings):
    communicator = await connect_authenticated(valid_token)
    await communicator.send_json_to({"type": "shout", "text": "hello"})
    response = await communicator.receive_json_from()
    assert response["type"] == "error"
    assert response["code"] == "unsupported_type"
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_reports_a_message_without_text(valid_token, channel_layer_settings):
    communicator = await connect_authenticated(valid_token)
    await communicator.send_json_to({"type": "message", "text": "   "})
    response = await communicator.receive_json_from()
    assert response["type"] == "error"
    assert response["code"] == "invalid_message"
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_echo_broadcasts_to_all_subscribers(
    user, valid_token, channel_layer_settings
):
    first = await connect_authenticated(valid_token)
    second = await connect_authenticated(valid_token)
    await first.send_json_to({"type": "message", "text": "hello"})
    first_response = await first.receive_json_from()
    second_response = await second.receive_json_from()
    assert first_response["text"] == "hello"
    assert first_response["sender"] == user.email
    assert first_response["room"] == "room1"
    assert first_response["id"] == second_response["id"]
    await first.disconnect()
    await second.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_room_isolation(valid_token, channel_layer_settings):
    room_a = await connect_authenticated(valid_token, "/ws/echo/room_a/")
    room_b = await connect_authenticated(valid_token, "/ws/echo/room_b/")
    await room_a.send_json_to({"type": "message", "text": "room_a_message"})
    response = await room_a.receive_json_from()
    assert response["text"] == "room_a_message"
    assert await room_b.receive_nothing()
    await room_a.disconnect()
    await room_b.disconnect()


def test_routing_exposes_the_echo_room():
    assert len(websocket_urlpatterns) == 1
