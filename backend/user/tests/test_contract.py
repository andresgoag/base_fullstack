import pytest
import yaml
from django.conf import settings
from django.urls import reverse
from rest_framework.test import APIClient

from comment.api.serializers import SimilarCommentSerializer
from user.api.serializers import UserCreateSerializer, UserSerializer

USER_RESPONSE_FIELDS = {"id", "email", "phone", "first_name", "last_name"}
SIMILAR_COMMENT_FIELDS = {"id", "text", "created_at", "distance"}


def test_user_serializer_exposes_the_agreed_fields():
    assert set(UserSerializer().fields) == USER_RESPONSE_FIELDS


def test_user_create_serializer_never_returns_the_password():
    fields = UserCreateSerializer().fields
    assert set(fields) == USER_RESPONSE_FIELDS | {"password"}
    assert fields["password"].write_only


def test_similar_comment_serializer_exposes_the_agreed_fields():
    assert set(SimilarCommentSerializer().fields) == SIMILAR_COMMENT_FIELDS


def test_the_committed_schema_matches_the_current_api():
    from drf_spectacular.generators import SchemaGenerator

    generated = SchemaGenerator().get_schema(request=None, public=True)
    with open(settings.OPENAPI_SCHEMA_FILE) as schema_file:
        committed = yaml.safe_load(schema_file)
    assert sorted(committed["paths"]) == sorted(generated["paths"]), (
        "Run: docker compose exec backend python manage.py spectacular "
        "--file /schema/openapi.yml"
    )
    assert sorted(committed["components"]["schemas"]) == sorted(
        generated["components"]["schemas"]
    )


@pytest.mark.django_db
def test_refreshing_always_returns_a_new_refresh_token():
    client = APIClient()
    from django.contrib.auth import get_user_model

    get_user_model().objects.create_user(
        email="rotation@example.com",
        phone="+14155550333",
        password="Tr0ubad0ur-x9",
        first_name="Rotation",
        last_name="Example",
    )
    tokens = client.post(
        reverse("jwt-create"),
        {"email": "rotation@example.com", "password": "Tr0ubad0ur-x9"},
        format="json",
    ).data
    refreshed = client.post(
        reverse("jwt-refresh"), {"refresh": tokens["refresh"]}, format="json"
    ).data
    assert "refresh" in refreshed
    assert refreshed["refresh"] != tokens["refresh"]
