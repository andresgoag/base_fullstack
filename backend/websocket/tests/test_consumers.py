import uuid
import pytest
from channels.testing import WebsocketCommunicator
from backend.asgi import application


@pytest.fixture
def valid_token(db):
    from django.contrib.auth import get_user_model
    from rest_framework_simplejwt.tokens import AccessToken

    User = get_user_model()
    unique_id = uuid.uuid4()
    user = User.objects.create_user(
        email=f"test-{unique_id}@example.com",
        phone=f"+1415555{str(unique_id.int)[:4]}",
        password="testpassword123",
        first_name="Test",
        last_name="User",
    )
    return str(AccessToken.for_user(user))


@pytest.fixture
def channel_layer_settings(settings):
    settings.CHANNEL_LAYERS = {
        "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}
    }
    yield


@pytest.mark.django_db(transaction=True)
async def test_connect_and_auth_ok(valid_token, channel_layer_settings):
    communicator = WebsocketCommunicator(application, "/ws/echo/room1/")
    connected, _ = await communicator.connect()
    assert connected
    await communicator.send_json_to({"type": "auth", "token": valid_token})
    response = await communicator.receive_json_from()
    assert response == {"type": "auth_ok"}
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_invalid_token_closes_connection(channel_layer_settings):
    communicator = WebsocketCommunicator(application, "/ws/echo/room1/")
    connected, _ = await communicator.connect()
    assert connected
    await communicator.send_json_to({"type": "auth", "token": "invalid.token.here"})
    response = await communicator.receive_output()
    assert response["type"] == "websocket.close"
    assert response["code"] == 4001
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_wrong_message_type_closes_connection(channel_layer_settings):
    communicator = WebsocketCommunicator(application, "/ws/echo/room1/")
    connected, _ = await communicator.connect()
    assert connected
    await communicator.send_json_to({"type": "wrong", "token": "anything"})
    response = await communicator.receive_output()
    assert response["type"] == "websocket.close"
    assert response["code"] == 4001
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_echo_broadcasts_to_all_subscribers(valid_token, channel_layer_settings):
    communicator1 = WebsocketCommunicator(application, "/ws/echo/room1/")
    communicator2 = WebsocketCommunicator(application, "/ws/echo/room1/")
    await communicator1.connect()
    await communicator2.connect()
    await communicator1.send_json_to({"type": "auth", "token": valid_token})
    await communicator1.receive_json_from()
    await communicator2.send_json_to({"type": "auth", "token": valid_token})
    await communicator2.receive_json_from()
    await communicator1.send_to(text_data="hello")
    response1 = await communicator1.receive_from()
    response2 = await communicator2.receive_from()
    assert response1 == "hello"
    assert response2 == "hello"
    await communicator1.disconnect()
    await communicator2.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_room_isolation(valid_token, channel_layer_settings):
    communicator_a = WebsocketCommunicator(application, "/ws/echo/room_a/")
    communicator_b = WebsocketCommunicator(application, "/ws/echo/room_b/")
    await communicator_a.connect()
    await communicator_b.connect()
    await communicator_a.send_json_to({"type": "auth", "token": valid_token})
    await communicator_a.receive_json_from()
    await communicator_b.send_json_to({"type": "auth", "token": valid_token})
    await communicator_b.receive_json_from()
    await communicator_a.send_to(text_data="room_a_message")
    response_a = await communicator_a.receive_from()
    assert response_a == "room_a_message"
    assert await communicator_b.receive_nothing()
    await communicator_a.disconnect()
    await communicator_b.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_message_before_auth_closes_connection(channel_layer_settings):
    communicator = WebsocketCommunicator(application, "/ws/echo/room1/")
    await communicator.connect()
    await communicator.send_to(text_data="not auth message")
    response = await communicator.receive_output()
    assert response["type"] == "websocket.close"
    assert response["code"] == 4001
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_oversized_message_closes_connection(valid_token, channel_layer_settings):
    communicator = WebsocketCommunicator(application, "/ws/echo/room1/")
    await communicator.connect()
    await communicator.send_json_to({"type": "auth", "token": valid_token})
    await communicator.receive_json_from()
    await communicator.send_to(text_data="x" * 4097)
    response = await communicator.receive_output()
    assert response["type"] == "websocket.close"
    assert response["code"] == 4002
    await communicator.disconnect()
