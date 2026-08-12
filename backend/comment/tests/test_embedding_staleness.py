import pytest
from comment.models import Comment, StaleEmbeddingError, hash_embedding_source
from comment.services import create_comment, replace_comment_text
from comment.tests.fakes import FakeEmbeddingClient
from comment.tests.factories import CommentFactory


@pytest.fixture
def embedding_client():
    return FakeEmbeddingClient()


@pytest.mark.django_db
def test_create_comment_records_the_embedded_source(embedding_client):
    comment = create_comment("a first comment", embedding_client)
    assert embedding_client.embedded_texts == ["a first comment"]
    assert comment.embedding_source_hash == hash_embedding_source("a first comment")
    assert not comment.has_stale_embedding


@pytest.mark.django_db
def test_replacing_text_reembeds(embedding_client):
    comment = create_comment("original text", embedding_client)
    original_embedding = list(comment.embedding)

    updated = replace_comment_text(
        comment.pk, "an entirely new subject", embedding_client
    )

    assert embedding_client.embedded_texts == [
        "original text",
        "an entirely new subject",
    ]
    assert list(updated.embedding) != original_embedding
    assert updated.embedding_source_hash == hash_embedding_source(
        "an entirely new subject"
    )
    assert not updated.has_stale_embedding


@pytest.mark.django_db
def test_replacing_text_persists_the_new_embedding(embedding_client):
    comment = create_comment("original text", embedding_client)
    replace_comment_text(comment.pk, "an entirely new subject", embedding_client)

    stored = Comment.objects.get(pk=comment.pk)
    assert stored.text == "an entirely new subject"
    assert not stored.has_stale_embedding


@pytest.mark.django_db
def test_editing_text_without_reembedding_is_rejected():
    comment = CommentFactory(text="original text")
    comment.text = "an entirely new subject"

    with pytest.raises(StaleEmbeddingError):
        comment.save()


@pytest.mark.django_db
def test_saving_a_comment_with_no_embedding_source_is_rejected():
    with pytest.raises(StaleEmbeddingError):
        Comment.objects.create(text="no embedding recorded", embedding=[0.0] * 1536)
