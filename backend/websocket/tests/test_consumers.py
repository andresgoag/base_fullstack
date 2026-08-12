import pytest
from channels.db import database_sync_to_async
from channels.testing import WebsocketCommunicator
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from backend.asgi import application
from user.tests.factories import UserFactory

ALLOWED_ORIGIN = [(b"origin", b"http://localhost:5173")]


def echo_communicator(room_name="room1", headers=ALLOWED_ORIGIN):
    return WebsocketCommunicator(application, f"/ws/echo/{room_name}/", headers=headers)


@pytest.fixture
def channel_layer_settings(settings):
    settings.CHANNEL_LAYERS = {
        "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}
    }
    yield


@pytest.fixture
def user(db):
    return UserFactory()


@pytest.fixture
def access_token(user):
    return str(AccessToken.for_user(user))


@pytest.fixture
def refresh_token(user):
    return str(RefreshToken.for_user(user))


@pytest.mark.django_db(transaction=True)
async def test_connect_and_auth_ok(access_token, channel_layer_settings):
    communicator = echo_communicator()
    connected, _ = await communicator.connect()
    assert connected
    await communicator.send_json_to({"type": "auth", "token": access_token})
    assert (await communicator.receive_json_from())["type"] == "auth_ok"
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_auth_ok_identifies_the_authenticated_user(
    user, access_token, channel_layer_settings
):
    communicator = echo_communicator()
    await communicator.connect()
    await communicator.send_json_to({"type": "auth", "token": access_token})
    response = await communicator.receive_json_from()
    assert response["user_id"] == user.pk
    assert response["expires_at"]
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_refresh_token_is_rejected(refresh_token, channel_layer_settings):
    communicator = echo_communicator()
    await communicator.connect()
    await communicator.send_json_to({"type": "auth", "token": refresh_token})
    response = await communicator.receive_output()
    assert response["type"] == "websocket.close"
    assert response["code"] == 4001
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_token_for_inactive_user_is_rejected(user, channel_layer_settings):
    token = str(AccessToken.for_user(user))

    @database_sync_to_async
    def deactivate():
        user.is_active = False
        user.save(update_fields=["is_active"])

    await deactivate()
    communicator = echo_communicator()
    await communicator.connect()
    await communicator.send_json_to({"type": "auth", "token": token})
    response = await communicator.receive_output()
    assert response["type"] == "websocket.close"
    assert response["code"] == 4001
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_missing_origin_is_rejected(channel_layer_settings):
    communicator = echo_communicator(headers=[])
    connected, _ = await communicator.connect()
    assert not connected
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_disallowed_origin_is_rejected(channel_layer_settings):
    communicator = echo_communicator(headers=[(b"origin", b"http://evil.example.com")])
    connected, _ = await communicator.connect()
    assert not connected
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_invalid_token_closes_connection(channel_layer_settings):
    communicator = echo_communicator()
    await communicator.connect()
    await communicator.send_json_to({"type": "auth", "token": "invalid.token.here"})
    response = await communicator.receive_output()
    assert response["type"] == "websocket.close"
    assert response["code"] == 4001
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_wrong_message_type_closes_connection(channel_layer_settings):
    communicator = echo_communicator()
    await communicator.connect()
    await communicator.send_json_to({"type": "wrong", "token": "anything"})
    response = await communicator.receive_output()
    assert response["type"] == "websocket.close"
    assert response["code"] == 4001
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_message_before_auth_closes_connection(channel_layer_settings):
    communicator = echo_communicator()
    await communicator.connect()
    await communicator.send_to(text_data="not auth message")
    response = await communicator.receive_output()
    assert response["type"] == "websocket.close"
    assert response["code"] == 4001
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_oversized_preauth_message_is_rejected_before_parsing(
    channel_layer_settings,
):
    communicator = echo_communicator()
    await communicator.connect()
    oversized_token = "x" * 5000
    await communicator.send_json_to({"type": "auth", "token": oversized_token})
    response = await communicator.receive_output()
    assert response["type"] == "websocket.close"
    assert response["code"] == 4002
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_oversized_message_closes_connection(
    access_token, channel_layer_settings
):
    communicator = echo_communicator()
    await communicator.connect()
    await communicator.send_json_to({"type": "auth", "token": access_token})
    await communicator.receive_json_from()
    await communicator.send_to(text_data="x" * 4097)
    response = await communicator.receive_output()
    assert response["type"] == "websocket.close"
    assert response["code"] == 4002
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_echo_broadcasts_to_all_subscribers(access_token, channel_layer_settings):
    first = echo_communicator()
    second = echo_communicator()
    await first.connect()
    await second.connect()
    await first.send_json_to({"type": "auth", "token": access_token})
    await first.receive_json_from()
    await second.send_json_to({"type": "auth", "token": access_token})
    await second.receive_json_from()
    await first.send_json_to({"type": "message", "text": "hello"})
    assert await first.receive_json_from() == {"type": "message", "text": "hello"}
    assert await second.receive_json_from() == {"type": "message", "text": "hello"}
    await first.disconnect()
    await second.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_client_cannot_spoof_an_auth_ok_frame(
    access_token, channel_layer_settings
):
    first = echo_communicator()
    second = echo_communicator()
    await first.connect()
    await second.connect()
    await first.send_json_to({"type": "auth", "token": access_token})
    await first.receive_json_from()
    await second.send_json_to({"type": "auth", "token": access_token})
    await second.receive_json_from()

    await first.send_json_to({"type": "auth_ok", "user_id": 999})

    response = await first.receive_output()
    assert response["type"] == "websocket.close"
    assert response["code"] == 4003
    assert await second.receive_nothing()
    await first.disconnect()
    await second.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_unframed_message_closes_connection(access_token, channel_layer_settings):
    communicator = echo_communicator()
    await communicator.connect()
    await communicator.send_json_to({"type": "auth", "token": access_token})
    await communicator.receive_json_from()
    await communicator.send_to(text_data="bare text is not a valid frame")
    response = await communicator.receive_output()
    assert response["type"] == "websocket.close"
    assert response["code"] == 4003
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_room_isolation(access_token, channel_layer_settings):
    room_a = echo_communicator("room_a")
    room_b = echo_communicator("room_b")
    await room_a.connect()
    await room_b.connect()
    await room_a.send_json_to({"type": "auth", "token": access_token})
    await room_a.receive_json_from()
    await room_b.send_json_to({"type": "auth", "token": access_token})
    await room_b.receive_json_from()
    await room_a.send_json_to({"type": "message", "text": "room_a_message"})
    assert await room_a.receive_json_from() == {
        "type": "message",
        "text": "room_a_message",
    }
    assert await room_b.receive_nothing()
    await room_a.disconnect()
    await room_b.disconnect()
