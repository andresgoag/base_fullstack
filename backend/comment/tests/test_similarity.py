import pytest
from rest_framework.test import APIClient
from comment.models import Comment
from pgvector.django import CosineDistance


def make_vector(index):
    vector = [0.0] * 384
    vector[index] = 1.0
    return vector


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
    limited_sql = str(
        Comment.objects.annotate(
            distance=CosineDistance("embedding", query)
        ).order_by("distance")[:5].query
    ).lower()
    assert "limit" in limited_sql
    results = list(queryset)
    assert results[0].text == "axis one"
    assert results[0].distance < results[1].distance


@pytest.mark.django_db
def test_similar_endpoint_returns_ranked_comments(seeded_comments, monkeypatch):
    monkeypatch.setattr(
        "comment.api.views.embed_text", lambda text: make_vector(2)
    )
    client = APIClient()
    response = client.get("/comments/similar/", {"text": "anything"})
    assert response.status_code == 200
    assert response.data[0]["text"] == "axis two"
    assert "distance" in response.data[0]


@pytest.mark.django_db
def test_similar_endpoint_requires_text():
    client = APIClient()
    response = client.get("/comments/similar/")
    assert response.status_code == 400
