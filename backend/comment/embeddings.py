from dataclasses import dataclass
from typing import Protocol
from openai import OpenAI


class EmbeddingClient(Protocol):
    dimensions: int

    def embed(self, text: str) -> list[float]: ...


@dataclass(frozen=True)
class OpenAIEmbeddingClient:
    client: OpenAI
    model_name: str
    dimensions: int

    def embed(self, text):
        response = self.client.embeddings.create(
            model=self.model_name, input=text, dimensions=self.dimensions
        )
        return response.data[0].embedding
