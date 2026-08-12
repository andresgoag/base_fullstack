import pytest
from rest_framework.test import APIClient
from pgvector.django import CosineDistance
from comment.api.serializers import MAX_QUERY_TEXT_LENGTH
from comment.models import Comment
from comment.services import find_similar_comments
from comment.tests.fakes import FakeEmbeddingClient
from comment.tests.factories import CommentFactory, unit_vector


@pytest.fixture
def seeded_comments(db):
    return [
        CommentFactory(text="axis zero", embedding=unit_vector(0)),
        CommentFactory(text="axis one", embedding=unit_vector(1)),
        CommentFactory(text="axis two", embedding=unit_vector(2)),
    ]


@pytest.fixture
def embedding_client():
    return FakeEmbeddingClient()


@pytest.fixture
def api_client(monkeypatch, embedding_client):
    monkeypatch.setattr(
        "comment.api.views.get_embedding_client", lambda: embedding_client
    )
    return APIClient()


@pytest.mark.django_db
def test_cosine_distance_orders_in_database(seeded_comments):
    queryset = Comment.objects.annotate(
        distance=CosineDistance("embedding", unit_vector(1))
    ).order_by("distance")
    results = list(queryset)
    assert results[0].text == "axis one"
    assert results[0].distance < results[1].distance


@pytest.mark.django_db
def test_find_similar_comments_ranks_by_distance(seeded_comments, embedding_client):
    embedding_client.vector_by_text["anything"] = unit_vector(2)
    results = find_similar_comments("anything", embedding_client, limit=5)
    assert results[0].text == "axis two"
    assert embedding_client.embedded_texts == ["anything"]


@pytest.mark.django_db
def test_similar_endpoint_returns_ranked_comments(
    seeded_comments, api_client, embedding_client
):
    embedding_client.vector_by_text["anything"] = unit_vector(2)
    response = api_client.get("/comments/similar/", {"text": "anything"})
    assert response.status_code == 200
    assert response.data[0]["text"] == "axis two"
    assert "distance" in response.data[0]


@pytest.mark.django_db
def test_similar_endpoint_requires_text(api_client):
    response = api_client.get("/comments/similar/")
    assert response.status_code == 400
    assert "text" in response.data


@pytest.mark.django_db
def test_similar_endpoint_rejects_blank_text(api_client):
    response = api_client.get("/comments/similar/", {"text": "   "})
    assert response.status_code == 400
    assert "text" in response.data


@pytest.mark.django_db
def test_similar_endpoint_rejects_overlong_text(api_client, embedding_client):
    response = api_client.get(
        "/comments/similar/", {"text": "x" * (MAX_QUERY_TEXT_LENGTH + 1)}
    )
    assert response.status_code == 400
    assert embedding_client.embedded_texts == []


@pytest.mark.django_db
def test_similar_endpoint_honours_limit(seeded_comments, api_client):
    response = api_client.get("/comments/similar/", {"text": "anything", "limit": 2})
    assert response.status_code == 200
    assert len(response.data) == 2


@pytest.mark.django_db
def test_similar_endpoint_rejects_out_of_range_limit(api_client):
    response = api_client.get("/comments/similar/", {"text": "anything", "limit": 0})
    assert response.status_code == 400
    assert "limit" in response.data
