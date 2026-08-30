import pytest
from django.conf import settings
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from comment.models import Comment
from pgvector.django import CosineDistance


def make_vector(index):
    vector = [0.0] * settings.EMBEDDING_DIMENSIONS
    vector[index] = 1.0
    return vector


@pytest.fixture
def authenticated_user(db):
    return get_user_model().objects.create_user(
        email="reader@example.com",
        phone="+14155550111",
        password="Tr0ubad0ur-x9",
        first_name="Reader",
        last_name="Example",
    )


@pytest.fixture
def seeded_comments(db):
    Comment.objects.create(text="axis zero", embedding=make_vector(0))
    Comment.objects.create(text="axis one", embedding=make_vector(1))
    Comment.objects.create(text="axis two", embedding=make_vector(2))


@pytest.mark.django_db
def test_cosine_distance_orders_in_database(seeded_comments):
    query = make_vector(1)
    queryset = Comment.objects.annotate(
        distance=CosineDistance("embedding", query)
    ).order_by("distance")
    sql = str(queryset.query).lower()
    assert "order by" in sql
    assert "limit" in str(queryset[:5].query).lower()
    results = list(queryset)
    assert results[0].text == "axis one"
    assert results[0].distance < results[1].distance


@pytest.mark.django_db
def test_similar_endpoint_returns_ranked_comments(
    seeded_comments, authenticated_user, monkeypatch
):
    monkeypatch.setattr("comment.api.views.embed_text", lambda text: make_vector(2))
    client = APIClient()
    client.force_authenticate(user=authenticated_user)
    response = client.get(reverse("comments-similar"), {"text": "anything"})
    assert response.status_code == 200
    assert response.data[0]["text"] == "axis two"
    assert "distance" in response.data[0]


@pytest.mark.django_db
def test_similar_endpoint_requires_text(authenticated_user):
    client = APIClient()
    client.force_authenticate(user=authenticated_user)
    response = client.get(reverse("comments-similar"))
    assert response.status_code == 400


@pytest.mark.django_db
def test_similar_endpoint_requires_authentication():
    client = APIClient()
    response = client.get(reverse("comments-similar"), {"text": "anything"})
    assert response.status_code == 401
