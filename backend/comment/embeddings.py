from django.conf import settings
from openai import OpenAI

_client = None


def get_client():
    global _client
    if _client is None:
        _client = OpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


def embed_text(text):
    response = get_client().embeddings.create(
        model=settings.EMBEDDING_MODEL_NAME, input=text
    )
    return response.data[0].embedding
