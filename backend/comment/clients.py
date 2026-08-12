from functools import lru_cache
from django.conf import settings
from openai import OpenAI
from comment.constants import EMBEDDING_DIMENSIONS
from comment.embeddings import OpenAIEmbeddingClient


@lru_cache(maxsize=1)
def get_embedding_client():
    return OpenAIEmbeddingClient(
        client=OpenAI(api_key=settings.OPENAI_API_KEY),
        model_name=settings.EMBEDDING_MODEL_NAME,
        dimensions=EMBEDDING_DIMENSIONS,
    )
