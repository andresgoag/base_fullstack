"""Adds embedding staleness tracking and the HNSW index for cosine search.

TUNING — THE INDEX PARAMETERS BELOW ARE STARTING POINTS, NOT ANSWERS.

Without a vector index every similarity query is a sequential scan over the
whole table, which is invisible at seed-data size and fatal in production.
`m=16, ef_construction=64` are pgvector's defaults and suit a small table; they
are not tuned for any particular workload.

When adapting this for real data:

- Raise `m` and `ef_construction` for higher recall at the cost of build time
  and index size. Build cost grows quickly — index a production-sized copy
  before committing to values.
- Set `hnsw.ef_search` per connection (default 40) to trade recall for latency
  at query time. It is a runtime knob and needs no migration.
- Build the index AFTER bulk-loading rows, not before. On a large table, prefer
  `AddIndexConcurrently` from `django.contrib.postgres.operations` inside a
  migration marked `atomic = False`, so writes are not blocked for the duration.
- `vector_cosine_ops` must match the distance function used at query time
  (`CosineDistance` in `comment/services.py`). A mismatch silently falls back to
  a sequential scan.
"""

import hashlib
import pgvector.django.indexes
from django.db import migrations, models


def backfill_embedding_source_hash(apps, schema_editor):
    Comment = apps.get_model("comment", "Comment")
    for comment in Comment.objects.all().iterator():
        comment.embedding_source_hash = hashlib.sha256(
            comment.text.encode("utf-8")
        ).hexdigest()
        comment.save(update_fields=["embedding_source_hash"])


def clear_embedding_source_hash(apps, schema_editor):
    Comment = apps.get_model("comment", "Comment")
    Comment.objects.all().update(embedding_source_hash="")


class Migration(migrations.Migration):

    dependencies = [
        ("comment", "0002_comment"),
    ]

    operations = [
        migrations.AddField(
            model_name="comment",
            name="embedding_source_hash",
            field=models.CharField(default="", max_length=64),
        ),
        migrations.RunPython(
            backfill_embedding_source_hash, clear_embedding_source_hash
        ),
        migrations.AddIndex(
            model_name="comment",
            index=pgvector.django.indexes.HnswIndex(
                ef_construction=64,
                fields=["embedding"],
                m=16,
                name="comment_embedding_hnsw",
                opclasses=["vector_cosine_ops"],
            ),
        ),
    ]
