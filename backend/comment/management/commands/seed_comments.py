from dataclasses import dataclass
from django.core.management.base import BaseCommand
from django.db import transaction
from comment.clients import get_embedding_client
from comment.models import Comment, hash_embedding_source

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


@dataclass(frozen=True)
class EmbeddedComment:
    text: str
    embedding: list[float]


class Command(BaseCommand):
    help = "Seed the database with example comments and their embeddings."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete all comments before seeding.",
        )

    def handle(self, *args, **options):
        embedded_comments = self._embed_seed_comments()
        with transaction.atomic():
            if options["reset"]:
                self._delete_all_comments()
            self._create_comments(embedded_comments)
        self.stdout.write(self.style.SUCCESS("Comment seed complete."))

    def _embed_seed_comments(self):
        embedding_client = get_embedding_client()
        return [
            EmbeddedComment(text=text, embedding=embedding_client.embed(text))
            for text in SEED_COMMENTS
        ]

    def _delete_all_comments(self):
        deleted, _ = Comment.objects.all().delete()
        self.stdout.write(f"Deleted {deleted} existing comment(s).")

    def _create_comments(self, embedded_comments):
        for embedded_comment in embedded_comments:
            Comment.objects.create(
                text=embedded_comment.text,
                embedding=embedded_comment.embedding,
                embedding_source_hash=hash_embedding_source(embedded_comment.text),
            )
            self.stdout.write(f"Created comment: {embedded_comment.text}")
