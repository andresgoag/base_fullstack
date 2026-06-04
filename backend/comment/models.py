from django.db import models
from pgvector.django import VectorField
from comment.embeddings import embed_text


class Comment(models.Model):
    text = models.TextField()
    embedding = VectorField(dimensions=1536)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "comment"

    def save(self, *args, **kwargs):
        if self.embedding is None:
            self.embedding = embed_text(self.text)
        super().save(*args, **kwargs)
