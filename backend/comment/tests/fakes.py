from dataclasses import dataclass, field
from comment.constants import EMBEDDING_DIMENSIONS


@dataclass
class FakeEmbeddingClient:
    vector_by_text: dict = field(default_factory=dict)
    dimensions: int = EMBEDDING_DIMENSIONS
    embedded_texts: list = field(default_factory=list)

    def embed(self, text):
        self.embedded_texts.append(text)
        if text in self.vector_by_text:
            return self.vector_by_text[text]
        vector = [0.0] * self.dimensions
        vector[len(text) % self.dimensions] = 1.0
        return vector
