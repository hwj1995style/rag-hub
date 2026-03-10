import hashlib
from parser_worker.models import PersistedChunk


class EmbeddingService:
    def __init__(self, embedding_dim: int):
        self._embedding_dim = embedding_dim

    def embed_chunks(self, chunks: list[PersistedChunk]) -> list[tuple[str, list[float]]]:
        return [(chunk.chunk_id, self._embed_text(chunk.content_text)) for chunk in chunks]

    def _embed_text(self, text: str) -> list[float]:
        seed = hashlib.sha256(text.encode('utf-8')).digest()
        values = []
        for i in range(self._embedding_dim):
            byte = seed[i % len(seed)]
            values.append(round(byte / 255.0, 6))
        return values