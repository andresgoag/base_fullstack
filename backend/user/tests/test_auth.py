import pytest
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.test import APIClient
from rest_framework.throttling import SimpleRateThrottle
from user.tests.factories import DEFAULT_PASSWORD, UserFactory

User = get_user_model()

VALID_USER = {
    "email": "test@example.com",
    "phone": "+14155552671",
    "first_name": "Test",
    "last_name": "User",
    "password": DEFAULT_PASSWORD,
    "re_password": DEFAULT_PASSWORD,
}


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def created_user(db):
    return UserFactory(email=VALID_USER["email"], phone=VALID_USER["phone"])


@pytest.fixture
def strict_throttle(monkeypatch):
    cache.clear()
    monkeypatch.setattr(SimpleRateThrottle, "THROTTLE_RATES", {"auth": "3/minute"})
    yield
    cache.clear()


def login(api_client, user_email):
    return api_client.post(
        "/auth/jwt/create/",
        {"email": user_email, "password": DEFAULT_PASSWORD},
        format="json",
    )


@pytest.mark.django_db
def test_register_creates_user(api_client):
    response = api_client.post("/auth/users/", VALID_USER, format="json")
    assert response.status_code == 201
    assert User.objects.filter(email=VALID_USER["email"]).exists()


@pytest.mark.django_db
def test_register_rejects_weak_password(api_client):
    data = {**VALID_USER, "password": "a", "re_password": "a"}
    response = api_client.post("/auth/users/", data, format="json")
    assert response.status_code == 400


@pytest.mark.django_db
def test_register_rejects_invalid_phone(api_client):
    data = {**VALID_USER, "phone": "555-1234"}
    response = api_client.post("/auth/users/", data, format="json")
    assert response.status_code == 400


@pytest.mark.django_db
def test_register_rejects_duplicate_email(api_client, created_user):
    data = {**VALID_USER, "phone": "+14155559999"}
    response = api_client.post("/auth/users/", data, format="json")
    assert response.status_code == 400


@pytest.mark.django_db
def test_register_rejects_duplicate_phone(api_client, created_user):
    data = {**VALID_USER, "email": "other@example.com"}
    response = api_client.post("/auth/users/", data, format="json")
    assert response.status_code == 400


@pytest.mark.django_db
def test_register_is_throttled(api_client, strict_throttle):
    statuses = [
        api_client.post(
            "/auth/users/",
            {
                **VALID_USER,
                "email": f"throttle{index}@example.com",
                "phone": f"+1415555{4000 + index}",
            },
            format="json",
        ).status_code
        for index in range(5)
    ]
    assert statuses[:3] == [201, 201, 201]
    assert statuses[3:] == [429, 429]


@pytest.mark.django_db
def test_login_is_throttled(api_client, created_user, strict_throttle):
    statuses = [login(api_client, VALID_USER["email"]).status_code for _ in range(5)]
    assert statuses[3:] == [429, 429]


@pytest.mark.django_db
def test_login_returns_tokens(api_client, created_user):
    response = login(api_client, VALID_USER["email"])
    assert response.status_code == 200
    assert "access" in response.data
    assert "refresh" in response.data


@pytest.mark.django_db
def test_me_requires_auth(api_client):
    response = api_client.get("/auth/users/me/")
    assert response.status_code == 401


@pytest.mark.django_db
def test_me_returns_user(api_client, created_user):
    tokens = login(api_client, VALID_USER["email"])
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens.data['access']}")
    response = api_client.get("/auth/users/me/")
    assert response.status_code == 200
    assert response.data["email"] == VALID_USER["email"]
    assert response.data["phone"] == VALID_USER["phone"]


@pytest.mark.django_db
def test_refresh_rotates_token(api_client, created_user):
    tokens = login(api_client, VALID_USER["email"])
    response = api_client.post(
        "/auth/jwt/refresh/", {"refresh": tokens.data["refresh"]}, format="json"
    )
    assert response.status_code == 200
    assert response.data["access"] != tokens.data["access"]


@pytest.mark.django_db
def test_blacklisted_refresh_is_rejected(api_client, created_user):
    tokens = login(api_client, VALID_USER["email"])
    refresh = tokens.data["refresh"]
    api_client.post("/auth/jwt/blacklist/", {"refresh": refresh}, format="json")
    response = api_client.post(
        "/auth/jwt/refresh/", {"refresh": refresh}, format="json"
    )
    assert response.status_code == 401
