import hashlib
from django.db import models
from pgvector.django import HnswIndex, VectorField
from comment.constants import EMBEDDING_DIMENSIONS


def hash_embedding_source(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


class StaleEmbeddingError(RuntimeError):
    pass


class Comment(models.Model):
    text = models.TextField()
    embedding = VectorField(dimensions=EMBEDDING_DIMENSIONS)
    embedding_source_hash = models.CharField(max_length=64, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "comment"
        indexes = [
            HnswIndex(
                name="comment_embedding_hnsw",
                fields=["embedding"],
                m=16,
                ef_construction=64,
                opclasses=["vector_cosine_ops"],
            )
        ]

    @property
    def has_stale_embedding(self):
        return self.embedding_source_hash != hash_embedding_source(self.text)

    def save(self, *args, **kwargs):
        if self.has_stale_embedding:
            raise StaleEmbeddingError(
                "Comment.text does not match the text its embedding was built from. "
                "Write through comment.services.create_comment or "
                "comment.services.replace_comment_text so the embedding stays in sync."
            )
        super().save(*args, **kwargs)
