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
                ("embedding", pgvector.django.VectorField(dimensions=1536)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "db_table": "comment",
            },
        ),
    ]
