from dataclasses import dataclass
from datetime import datetime, timezone
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AbstractBaseUser
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import AccessToken


@dataclass(frozen=True)
class AuthenticatedConnection:
    user: AbstractBaseUser
    expires_at: datetime


@database_sync_to_async
def authenticate_access_token(raw_token):
    try:
        token = AccessToken(raw_token)
    except (InvalidToken, TokenError):
        return None
    user_id = token.payload.get(api_settings.USER_ID_CLAIM)
    if user_id is None:
        return None
    user = (
        get_user_model()
        .objects.filter(**{api_settings.USER_ID_FIELD: user_id, "is_active": True})
        .first()
    )
    if user is None:
        return None
    return AuthenticatedConnection(
        user=user,
        expires_at=datetime.fromtimestamp(token.payload["exp"], tz=timezone.utc),
    )
