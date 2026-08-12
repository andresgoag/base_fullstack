import factory
from comment.constants import EMBEDDING_DIMENSIONS
from comment.models import Comment, hash_embedding_source


def unit_vector(axis):
    vector = [0.0] * EMBEDDING_DIMENSIONS
    vector[axis] = 1.0
    return vector


class CommentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Comment

    text = factory.Sequence(lambda n: f"comment number {n}")
    embedding = factory.LazyFunction(lambda: unit_vector(0))
    embedding_source_hash = factory.LazyAttribute(
        lambda comment: hash_embedding_source(comment.text)
    )
