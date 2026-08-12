import factory
from django.contrib.auth import get_user_model

DEFAULT_PASSWORD = "Str0ngP@ssword!"


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = get_user_model()

    email = factory.Sequence(lambda n: f"user{n}@example.com")
    phone = factory.Sequence(lambda n: f"+1415555{n:04d}")
    first_name = "Test"
    last_name = "User"
    password = DEFAULT_PASSWORD

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        return model_class.objects.create_user(*args, **kwargs)
