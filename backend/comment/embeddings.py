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
