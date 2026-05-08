import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

VALID_USER = {
    "email": "test@example.com",
    "phone": "+14155552671",
    "first_name": "Test",
    "last_name": "User",
    "password": "Str0ngP@ssword!",
    "re_password": "Str0ngP@ssword!",
}


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def created_user(db):
    return User.objects.create_user(
        email=VALID_USER["email"],
        phone=VALID_USER["phone"],
        first_name=VALID_USER["first_name"],
        last_name=VALID_USER["last_name"],
        password=VALID_USER["password"],
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
def test_login_returns_tokens(api_client, created_user):
    response = api_client.post(
        "/auth/jwt/create/",
        {"email": VALID_USER["email"], "password": VALID_USER["password"]},
        format="json",
    )
    assert response.status_code == 200
    assert "access" in response.data
    assert "refresh" in response.data


@pytest.mark.django_db
def test_me_requires_auth(api_client):
    response = api_client.get("/auth/users/me/")
    assert response.status_code == 401


@pytest.mark.django_db
def test_me_returns_user(api_client, created_user):
    login = api_client.post(
        "/auth/jwt/create/",
        {"email": VALID_USER["email"], "password": VALID_USER["password"]},
        format="json",
    )
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
    response = api_client.get("/auth/users/me/")
    assert response.status_code == 200
    assert response.data["email"] == VALID_USER["email"]
    assert response.data["phone"] == VALID_USER["phone"]


@pytest.mark.django_db
def test_refresh_rotates_token(api_client, created_user):
    login = api_client.post(
        "/auth/jwt/create/",
        {"email": VALID_USER["email"], "password": VALID_USER["password"]},
        format="json",
    )
    old_refresh = login.data["refresh"]
    response = api_client.post(
        "/auth/jwt/refresh/", {"refresh": old_refresh}, format="json"
    )
    assert response.status_code == 200
    assert response.data["access"] != login.data["access"]


@pytest.mark.django_db
def test_blacklisted_refresh_is_rejected(api_client, created_user):
    login = api_client.post(
        "/auth/jwt/create/",
        {"email": VALID_USER["email"], "password": VALID_USER["password"]},
        format="json",
    )
    refresh = login.data["refresh"]
    api_client.post("/auth/jwt/blacklist/", {"refresh": refresh}, format="json")
    response = api_client.post(
        "/auth/jwt/refresh/", {"refresh": refresh}, format="json"
    )
    assert response.status_code == 401
