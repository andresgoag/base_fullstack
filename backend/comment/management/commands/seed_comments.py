from django.core.management.base import BaseCommand
from django.db import transaction
from comment.embeddings import embed_text
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

    def handle(self, *args, **options):
        embedded = [(text, embed_text(text)) for text in SEED_COMMENTS]
        self._write(options["reset"], embedded)

    @transaction.atomic
    def _write(self, reset, embedded):
        if reset:
            deleted, _ = Comment.objects.all().delete()
            self.stdout.write(f"Deleted {deleted} existing comment(s).")
        for text, embedding in embedded:
            Comment.objects.create(text=text, embedding=embedding)
            self.stdout.write(f"Created comment: {text}")
        self.stdout.write(self.style.SUCCESS("Comment seed complete."))
