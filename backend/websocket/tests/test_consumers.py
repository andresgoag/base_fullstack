import pytest
from django.contrib.auth import get_user_model
from channels.testing import WebsocketCommunicator
from rest_framework_simplejwt.tokens import RefreshToken
from websocket.routing import websocket_urlpatterns
from channels.routing import URLRouter

User = get_user_model()

ROOM_NAME = "testroom"


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email="ws@example.com",
        phone="+14155552671",
        first_name="WS",
        last_name="User",
        password="Str0ngP@ssword!",
    )


@pytest.fixture
def valid_token(user):
    return str(RefreshToken.for_user(user).access_token)


@pytest.fixture
def communicator():
    async def build(room_name=ROOM_NAME):
        app = URLRouter(websocket_urlpatterns)
        comm = WebsocketCommunicator(app, f"/ws/echo/{room_name}/")
        return comm

    return build


@pytest.mark.django_db(transaction=True)
async def test_connect_accepts_socket(communicator):
    comm = await communicator()
    connected, _ = await comm.connect()
    assert connected
    await comm.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_non_auth_type_closes_with_4001(communicator):
    comm = await communicator()
    await comm.connect()
    await comm.send_json_to({"type": "chat", "token": "irrelevant"})
    response = await comm.receive_output()
    assert response["type"] == "websocket.close"
    assert response["code"] == 4001


@pytest.mark.django_db(transaction=True)
async def test_invalid_token_closes_with_4001(communicator):
    comm = await communicator()
    await comm.connect()
    await comm.send_json_to({"type": "auth", "token": "invalid.token.here"})
    response = await comm.receive_output()
    assert response["type"] == "websocket.close"
    assert response["code"] == 4001


@pytest.mark.django_db(transaction=True)
async def test_malformed_json_closes_with_4001(communicator):
    comm = await communicator()
    await comm.connect()
    await comm.send_to(text_data="not json at all")
    response = await comm.receive_output()
    assert response["type"] == "websocket.close"
    assert response["code"] == 4001


@pytest.mark.django_db(transaction=True)
async def test_missing_token_key_closes_with_4001(communicator):
    comm = await communicator()
    await comm.connect()
    await comm.send_json_to({"type": "auth"})
    response = await comm.receive_output()
    assert response["type"] == "websocket.close"
    assert response["code"] == 4001


@pytest.mark.django_db(transaction=True)
async def test_valid_auth_does_not_close_connection(
    communicator, valid_token, settings
):
    settings.CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer",
        }
    }
    comm = await communicator()
    await comm.connect()
    await comm.send_json_to({"type": "auth", "token": valid_token})
    assert await comm.receive_nothing(timeout=0.3)
    await comm.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_authenticated_message_is_echoed_to_room(
    communicator, valid_token, settings
):
    settings.CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer",
        }
    }
    sender = await communicator()
    receiver = await communicator()
    await sender.connect()
    await receiver.connect()
    await sender.send_json_to({"type": "auth", "token": valid_token})
    await receiver.send_json_to({"type": "auth", "token": valid_token})
    assert await sender.receive_nothing(timeout=0.3)
    assert await receiver.receive_nothing(timeout=0.3)
    message = "hello room"
    await sender.send_to(text_data=message)
    received_by_sender = await sender.receive_from()
    received_by_receiver = await receiver.receive_from()
    assert received_by_sender == message
    assert received_by_receiver == message
    await sender.disconnect()
    await receiver.disconnect()
