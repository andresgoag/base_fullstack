# Implementation Plan: pgvector-backed "Similar Comments" Example

## Goal

Add a self-contained example demonstrating pgvector + Django ORM cosine-similarity
search over a `Comment` model whose embeddings are produced locally by
sentence-transformers (`all-MiniLM-L6-v2`, 384 dims). A DRF endpoint accepts a query
text, embeds it locally, and returns the cosine-ranked nearest comments where the
ordering and limiting are performed by Postgres (not Python).

## Grounding (verified against the codebase)

- Apps live at top level (`user/`, `websocket/`). Each app: `apps.py` (AppConfig),
  `models.py`, `migrations/`. The `user` app adds `api/serializers.py`,
  `api/views.py`, `management/commands/`, and `tests/`.
- `backend/settings.py`: `INSTALLED_APPS` ends with `"user", "channels", "websocket"`.
  DRF is configured; default auth is JWT; `DEFAULT_AUTO_FIELD = BigAutoField`.
- `backend/urls.py` wires routes directly (no per-app `urls.py` include yet); imports
  views from `user.api.views`.
- Postgres image is `pgvector/pgvector:pg16` (extension binaries already present in
  the DB container; the extension still must be `CREATE EXTENSION`-enabled per DB via
  migration).
- Dependency management: `uv` with `pyproject.toml` + `uv.lock`. Dockerfile runs
  `uv sync --locked`, so `uv.lock` must be regenerated and the `backend` image rebuilt
  after adding deps.
- Code style: self-documenting, NO comments, NO docstrings, no abbreviations, no
  unnecessary blank lines, imports at module level. black line-length 88. flake8
  excludes `*/migrations/*`, `settings.py`, `__init__.py`; `max-line-length = 88`;
  ignores E203, W503.
- Tests: pytest + pytest-django, real Postgres. Existing tests use `@pytest.mark.django_db`
  and an `APIClient` fixture. New tests must prove ordering happens in the DB.

## New app name

`comment` (singular, matching the `user` convention).

## File tree to create

```
comment/
  __init__.py
  apps.py
  admin.py                         (optional; register Comment for convenience)
  models.py
  embeddings.py                    (lazy-loaded SentenceTransformer singleton)
  migrations/
    __init__.py
    0001_enable_pgvector.py        (VectorExtension)
    0002_comment.py               (CreateModel Comment, depends on 0001)
  api/
    __init__.py
    serializers.py
    views.py
  management/
    __init__.py
    commands/
      __init__.py
      seed_comments.py
  tests/
    __init__.py
    test_similarity.py             (DB-ordering test + API test)
```

All `__init__.py` files are empty.

## Dependency additions

Add to `pyproject.toml` `[project].dependencies`:

```
    "pgvector>=0.4.0",
    "sentence-transformers>=3.0.0",
```

Notes:
- `sentence-transformers` pulls `torch` (large image). This is accepted per user
  decision.
- `pgvector` provides `pgvector.django` (`VectorExtension`, `VectorField`,
  `CosineDistance`).

Commands (run on host, in the backend worktree root):

```
uv add pgvector sentence-transformers
uv lock
```

Then rebuild the image so `uv sync --locked` picks up the new lock:

```
docker compose build backend
```

(Or `docker compose up -d --build backend`.)

## Settings changes (backend/settings.py)

1. Add the app to `INSTALLED_APPS` (append after `"websocket",`):

```python
INSTALLED_APPS = [
    ...
    "user",
    "channels",
    "websocket",
    "comment",
]
```

2. Add one minimal setting (placed near the bottom with the other domain settings):

```python
EMBEDDING_MODEL_NAME = env("EMBEDDING_MODEL_NAME", default="all-MiniLM-L6-v2")
EMBEDDING_DIMENSIONS = 384
```

`settings.py` is flake8-excluded, so no style concern there.

## URL wiring (backend/urls.py)

Import the new view and add a route. Keep the flat style already used.

```python
from comment.api.views import SimilarCommentsView

urlpatterns = [
    ...
    path("comments/similar/", SimilarCommentsView.as_view(), name="comments-similar"),
]
```

## comment/apps.py

```python
from django.apps import AppConfig


class CommentConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "comment"
```

## comment/embeddings.py (lazy singleton)

Critical requirement: the SentenceTransformer must NOT be loaded at import time
(importing the module is enough to break/slow migrations and any management command).
Load lazily on first use and cache at module level.

```python
from django.conf import settings

_model = None


def get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer

        _model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
    return _model


def embed_text(text):
    vector = get_model().encode(text, normalize_embeddings=True)
    return vector.tolist()
```

Notes:
- `from sentence_transformers import SentenceTransformer` is intentionally inside
  `get_model()` so importing this module (and therefore importing `models.py`, which
  must stay import-cheap for migrations) does not import torch or download weights.
- `.encode(...)` returns a numpy array; `.tolist()` yields a plain Python list that
  `VectorField` / `CosineDistance` accept.
- `normalize_embeddings=True` is fine for cosine distance and matches the
  `all-MiniLM-L6-v2` recommended usage.

## comment/models.py

```python
from django.db import models
from pgvector.django import VectorField
from comment.embeddings import embed_text


class Comment(models.Model):
    text = models.TextField()
    embedding = VectorField(dimensions=384)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "comment"

    def save(self, *args, **kwargs):
        if self.embedding is None:
            self.embedding = embed_text(self.text)
        super().save(*args, **kwargs)
```

Design decisions:
- Embedding is populated in `save()` when not already set. This keeps the demo simple
  and explicit, and lets tests inject known embeddings directly (bypassing the model)
  by passing an explicit `embedding`, which is essential for a deterministic
  DB-ordering test.
- `dimensions=384` is hardcoded in the field (migrations capture the literal; settings
  constant is used by the serializer/tests for clarity). The literal must match
  `EMBEDDING_DIMENSIONS`.
- Importing `embed_text` here is safe because `embeddings.py` defers the torch import.

## Migrations

Two migrations. The extension migration MUST run before any `VectorField` column is
created, so the Comment migration depends on it.

### comment/migrations/0001_enable_pgvector.py

```python
from django.db import migrations
from pgvector.django import VectorExtension


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        VectorExtension(),
    ]
```

### comment/migrations/0002_comment.py

```python
import pgvector.django
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("comment", "0001_enable_pgvector"),
    ]

    operations = [
        migrations.CreateModel(
            name="Comment",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("text", models.TextField()),
                ("embedding", pgvector.django.VectorField(dimensions=384)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "db_table": "comment",
            },
        ),
    ]
```

Generation approach: rather than hand-writing, run
`docker compose exec backend python manage.py makemigrations comment` to generate
`0002`, then hand-add `0001_enable_pgvector.py` and edit `0002`'s `dependencies` to
point at it. Verify the generated file matches the sketch above (flake8 ignores
migrations, so generated formatting is acceptable).

## comment/api/serializers.py

```python
from rest_framework import serializers
from comment.models import Comment


class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ("id", "text", "created_at")
        read_only_fields = ("id", "created_at")


class SimilarCommentSerializer(serializers.ModelSerializer):
    distance = serializers.FloatField(read_only=True)

    class Meta:
        model = Comment
        fields = ("id", "text", "created_at", "distance")
        read_only_fields = fields
```

- `embedding` is deliberately excluded from output (large, not useful to clients).
- `distance` reads the annotated attribute set by the queryset annotation.

## comment/api/views.py

```python
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from pgvector.django import CosineDistance
from comment.api.serializers import SimilarCommentSerializer
from comment.embeddings import embed_text
from comment.models import Comment

DEFAULT_LIMIT = 5


class SimilarCommentsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        text = request.query_params.get("text")
        if not text:
            return Response(
                {"detail": "Query parameter 'text' is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        query_embedding = embed_text(text)
        comments = (
            Comment.objects.annotate(
                distance=CosineDistance("embedding", query_embedding)
            )
            .order_by("distance")[:DEFAULT_LIMIT]
        )
        serializer = SimilarCommentSerializer(comments, many=True)
        return Response(serializer.data)
```

Key point to emphasize in code review: `.annotate(... CosineDistance ...)`,
`.order_by("distance")`, and the `[:DEFAULT_LIMIT]` slice all compile into a single
SQL statement. Postgres computes the distances, orders by them, and applies
`LIMIT 5`. No Python-side sorting or distance computation happens. The slice on a
lazy queryset becomes SQL `LIMIT`, so only 5 rows are fetched.

`permission_classes = [AllowAny]` keeps the demo callable without auth (the project
default is JWT-required). Acceptable for an example endpoint; note this divergence in
the PR description.

## comment/management/commands/seed_comments.py

Mirrors `user/management/commands/seed.py` (BaseCommand, `--reset`, transaction.atomic,
stdout messaging). Inserts a handful of comments via `Comment.objects.create(...)` so
`save()` computes embeddings locally.

```python
from django.core.management.base import BaseCommand
from django.db import transaction
from comment.models import Comment

SEED_COMMENTS = [
    "The weather today is sunny and warm.",
    "It is raining heavily outside this morning.",
    "I love hiking in the mountains on weekends.",
    "Mountain trails are great for a weekend hike.",
    "The new smartphone has an impressive camera.",
    "This laptop battery lasts the entire workday.",
    "The restaurant served delicious pasta last night.",
    "We had a wonderful dinner at the Italian place.",
]


class Command(BaseCommand):
    help = "Seed the database with example comments and local embeddings."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete all comments before seeding.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["reset"]:
            deleted, _ = Comment.objects.all().delete()
            self.stdout.write(f"Deleted {deleted} existing comment(s).")
        for text in SEED_COMMENTS:
            Comment.objects.create(text=text)
            self.stdout.write(f"Created comment: {text}")
        self.stdout.write(self.style.SUCCESS("Comment seed complete."))
```

Note: this command triggers the lazy model load (downloads weights on first run inside
the container). That is intended and acceptable.

## comment/admin.py (optional convenience)

```python
from django.contrib import admin
from comment.models import Comment


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "text", "created_at")
```

## Tests: comment/tests/test_similarity.py

Two goals:
1. Prove `CosineDistance` annotation orders rows in the DB (no torch needed: inject
   known unit vectors directly to keep it deterministic and fast).
2. Exercise the API endpoint end to end.

The DB-ordering test creates comments with explicit, hand-chosen 384-dim embeddings so
no model load is required and the expected order is known. We then assert both the
returned order and that the SQL contains the ordering/limit clause.

```python
import pytest
from django.db import connection
from rest_framework.test import APIClient
from comment.models import Comment


def make_vector(index):
    vector = [0.0] * 384
    vector[index] = 1.0
    return vector


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def seeded_comments(db):
    Comment.objects.create(text="axis zero", embedding=make_vector(0))
    Comment.objects.create(text="axis one", embedding=make_vector(1))
    Comment.objects.create(text="axis two", embedding=make_vector(2))


@pytest.mark.django_db
def test_cosine_distance_orders_in_database(seeded_comments):
    from pgvector.django import CosineDistance

    query = make_vector(1)
    queryset = Comment.objects.annotate(
        distance=CosineDistance("embedding", query)
    ).order_by("distance")
    sql = str(queryset.query).lower()
    assert "order by" in sql
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
```

Why this proves DB-side work:
- Injecting explicit embeddings means the test never loads sentence-transformers, so it
  is fast and deterministic, and the cosine math is done entirely by Postgres.
- Asserting `"order by" in str(queryset.query)` confirms ordering is in the SQL, not
  Python. The slice `[:k]` similarly compiles to SQL `LIMIT` (can additionally assert
  `"limit" in str(queryset[:2].query)` if desired).
- The endpoint test monkeypatches `embed_text` so it does not download the model in CI;
  it still exercises the real annotate/order_by/limit query path against Postgres.

Optional slow integration test (not required, can be marked/skipped in CI): a test that
calls the real `embed_text` and asserts semantically similar comments rank near each
other (e.g. the two "mountain hike" sentences). Keep it out of the default run to avoid
downloading weights.

## Sequencing / step-by-step

1. Add `pgvector` and `sentence-transformers` to `pyproject.toml`; run `uv add ...`
   and `uv lock` on the host.
2. Rebuild the backend image: `docker compose build backend`.
3. Create the `comment` app file tree (all files above). The app is created manually
   to control structure (matching the existing manual layout), or via
   `docker compose exec backend python manage.py startapp comment` then pruning
   unwanted files (`views.py`, `tests.py` at top level) to match the `api/` + `tests/`
   convention.
4. Add `"comment"` to `INSTALLED_APPS` and add `EMBEDDING_MODEL_NAME` /
   `EMBEDDING_DIMENSIONS` to `settings.py`.
5. Add the `0001_enable_pgvector` migration (hand-written), then generate `0002` via
   `makemigrations comment` and fix its `dependencies` to require `0001`.
6. Wire `SimilarCommentsView` into `backend/urls.py`.
7. Run migrations:
   `docker compose exec backend python manage.py migrate`.
8. Seed demo data:
   `docker compose exec backend python manage.py seed_comments --reset`
   (first run downloads the model into the container).
9. Manually verify:
   `curl 'http://localhost:8000/comments/similar/?text=weekend+mountain+hike'`.
10. Run tests: `docker compose exec backend pytest comment/`.
11. Run black + flake8:
    `docker compose exec backend black .` and
    `docker compose exec backend flake8`.

## Dependencies & sequencing constraints

- `VectorExtension()` (0001) must precede the `VectorField` column creation (0002) —
  enforced via the explicit migration dependency.
- The DB image already ships pgvector binaries (`pgvector/pgvector:pg16`); only the
  per-database `CREATE EXTENSION` (via `VectorExtension`) is needed. No image change
  for the DB.
- Adding deps requires regenerating `uv.lock` and rebuilding the `backend` image
  before migrations/tests run inside the container.
- Lazy model loading is mandatory: importing `comment.models` (which migrations and
  `manage.py` do) must not import torch or download weights. Achieved by deferring
  `from sentence_transformers import SentenceTransformer` into `get_model()`.

## Anticipated challenges

- First model load downloads ~80MB of weights into the container; CI tests avoid this
  by injecting embeddings / monkeypatching `embed_text`. Consider caching the HF model
  dir via a Docker volume for repeated local runs (optional, out of scope).
- Image size grows substantially due to torch. Accepted per user decision.
- `CosineDistance` returns cosine distance in `[0, 2]`; smaller is more similar, so
  ascending `order_by("distance")` is correct. If a similarity score is preferred for
  the response, expose `1 - distance` in the serializer (optional).
- Dimension mismatch errors surface at insert/query time; keep the field literal `384`
  in sync with `all-MiniLM-L6-v2` and `EMBEDDING_DIMENSIONS`.

### Critical Files for Implementation

- /Users/andresgoag/code/base_fullstack/.claude/worktrees/vectorfield/backend/comment/models.py
- /Users/andresgoag/code/base_fullstack/.claude/worktrees/vectorfield/backend/comment/embeddings.py
- /Users/andresgoag/code/base_fullstack/.claude/worktrees/vectorfield/backend/comment/api/views.py
- /Users/andresgoag/code/base_fullstack/.claude/worktrees/vectorfield/backend/comment/migrations/0001_enable_pgvector.py
- /Users/andresgoag/code/base_fullstack/.claude/worktrees/vectorfield/backend/backend/settings.py
