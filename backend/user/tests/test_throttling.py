import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework.throttling import SimpleRateThrottle

from user.api.views import THROTTLED_USER_ACTIONS, ThrottledUserViewSet


@pytest.fixture
def strict_throttling(monkeypatch):
    monkeypatch.setattr(
        SimpleRateThrottle,
        "THROTTLE_RATES",
        {"auth": "3/minute", "embeddings": "3/minute"},
        raising=False,
    )
    SimpleRateThrottle.cache.clear()
    yield
    SimpleRateThrottle.cache.clear()


@pytest.fixture
def account(db):
    from django.contrib.auth import get_user_model

    return get_user_model().objects.create_user(
        email="throttled@example.com",
        phone="+14155550222",
        password="Tr0ubad0ur-x9",
        first_name="Throttled",
        last_name="Example",
    )


@pytest.mark.django_db
def test_password_reset_is_throttled(strict_throttling):
    client = APIClient()
    url = reverse("user-reset-password")
    statuses = [
        client.post(url, {"email": "nobody@example.com"}, format="json").status_code
        for _ in range(4)
    ]
    assert statuses[-1] == 429


@pytest.mark.django_db
def test_registration_is_throttled(strict_throttling):
    client = APIClient()
    url = reverse("user-list")
    statuses = [
        client.post(url, {"email": f"a{index}@example.com"}, format="json").status_code
        for index in range(4)
    ]
    assert statuses[-1] == 429


@pytest.mark.django_db
def test_reading_the_profile_is_not_throttled(strict_throttling, account):
    client = APIClient()
    client.force_authenticate(user=account)
    url = reverse("user-me")
    statuses = [client.get(url).status_code for _ in range(6)]
    assert statuses == [200] * 6


def test_the_routed_viewset_is_the_throttled_one():
    from backend.urls import router

    registered = {prefix: viewset for prefix, viewset, _ in router.registry}
    assert registered["users"] is ThrottledUserViewSet


def test_every_throttled_action_exists_on_the_viewset():
    for action in THROTTLED_USER_ACTIONS:
        assert hasattr(ThrottledUserViewSet, action)
