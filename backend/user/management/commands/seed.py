from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

User = get_user_model()


SEED_USERS = [
    {
        "email": "admin@dev.com",
        "phone": "+14155550100",
        "first_name": "Admin",
        "last_name": "Dev",
        "password": "goodskunk95",
        "is_staff": True,
        "is_superuser": True,
    },
    {
        "email": "user@dev.com",
        "phone": "+14155550101",
        "first_name": "Regular",
        "last_name": "User",
        "password": "Str0ngP@ssword!",
        "is_staff": False,
        "is_superuser": False,
    },
]


class Command(BaseCommand):
    help = "Seed the database with development test data."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete seeded users (matched by email) before recreating them.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["reset"]:
            emails = [u["email"] for u in SEED_USERS]
            deleted, _ = User.objects.filter(email__in=emails).delete()
            self.stdout.write(f"Deleted {deleted} existing seeded record(s).")

        for data in SEED_USERS:
            self._seed_user(data)

        self.stdout.write(self.style.SUCCESS("Seed complete."))

    def _seed_user(self, data):
        password = data["password"]
        defaults = {
            "phone": data["phone"],
            "first_name": data["first_name"],
            "last_name": data["last_name"],
            "is_staff": data["is_staff"],
            "is_superuser": data["is_superuser"],
        }
        user, created = User.objects.update_or_create(
            email=data["email"], defaults=defaults
        )
        user.set_password(password)
        user.save(update_fields=["password"])
        action = "Created" if created else "Updated"
        self.stdout.write(f"{action} user {user.email}")
