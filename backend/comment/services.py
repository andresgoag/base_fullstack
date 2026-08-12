from pgvector.django import CosineDistance
from comment.models import Comment, hash_embedding_source


def create_comment(text, embedding_client):
    return Comment.objects.create(
        text=text,
        embedding=embedding_client.embed(text),
        embedding_source_hash=hash_embedding_source(text),
    )


def replace_comment_text(comment_id, text, embedding_client):
    comment = Comment.objects.get(pk=comment_id)
    comment.text = text
    comment.embedding = embedding_client.embed(text)
    comment.embedding_source_hash = hash_embedding_source(text)
    comment.save()
    return comment


def find_similar_comments(text, embedding_client, limit):
    query_embedding = embedding_client.embed(text)
    return list(
        Comment.objects.annotate(
            distance=CosineDistance("embedding", query_embedding)
        ).order_by("distance")[:limit]
    )
