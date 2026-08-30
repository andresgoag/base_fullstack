import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from comment.api.views import SimilarCommentsView


@pytest.mark.django_db
def test_validation_errors_follow_the_requested_language():
    client = APIClient()
    url = reverse("user-list")
    spanish = client.post(url, {}, format="json", headers={"Accept-Language": "es"})
    english = client.post(url, {}, format="json", headers={"Accept-Language": "en"})
    assert spanish.data["email"][0] != english.data["email"][0]
    assert "requerido" in str(spanish.data["email"][0])


@pytest.mark.django_db
def test_token_errors_follow_the_requested_language():
    client = APIClient()
    url = reverse("jwt-create")
    payload = {"email": "nobody@example.com", "password": "wrong"}
    spanish = client.post(
        url, payload, format="json", headers={"Accept-Language": "es"}
    )
    english = client.post(
        url, payload, format="json", headers={"Accept-Language": "en"}
    )
    assert spanish.data["detail"] != english.data["detail"]


@pytest.mark.django_db
def test_an_unknown_language_falls_back(settings):
    client = APIClient()
    response = client.post(
        reverse("user-list"), {}, format="json", headers={"Accept-Language": "zz"}
    )
    assert response.status_code == 400
    assert "This field is required." in str(response.data["email"][0])


def test_our_own_messages_are_translatable():
    from django.utils.functional import Promise

    view = SimilarCommentsView()
    assert view.throttle_scope == "embeddings"
    from django.utils.translation import gettext_lazy as _

    assert isinstance(_("Query parameter 'text' is required."), Promise)
