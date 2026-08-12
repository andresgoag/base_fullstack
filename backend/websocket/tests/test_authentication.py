from datetime import datetime, timezone
import pytest
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from websocket.authentication import authenticate_access_token
from user.tests.factories import UserFactory

create_user = database_sync_to_async(UserFactory)
create_refresh_token = database_sync_to_async(RefreshToken.for_user)


@pytest.mark.django_db(transaction=True)
async def test_access_token_resolves_the_user():
    user = await create_user()
    token = AccessToken.for_user(user)

    connection = await authenticate_access_token(str(token))

    assert connection is not None
    assert connection.user == user
    assert connection.expires_at == datetime.fromtimestamp(
        token.payload["exp"], tz=timezone.utc
    )


@pytest.mark.django_db(transaction=True)
async def test_refresh_token_is_not_accepted():
    user = await create_user()
    refresh = await create_refresh_token(user)

    assert await authenticate_access_token(str(refresh)) is None


@pytest.mark.django_db(transaction=True)
async def test_garbage_token_is_not_accepted():
    assert await authenticate_access_token("not.a.token") is None


@pytest.mark.django_db(transaction=True)
async def test_expired_token_is_not_accepted():
    user = await create_user()
    token = AccessToken.for_user(user)
    token.set_exp(from_time=token.current_time, lifetime=-token.lifetime)

    assert await authenticate_access_token(str(token)) is None
