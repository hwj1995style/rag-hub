import json
from urllib import request
from parser_worker.models import PersistedChunk


class QdrantIndexer:
    def __init__(self, endpoint: str, collection_name: str, timeout_seconds: int):
        self._endpoint = endpoint.rstrip('/')
        self._collection_name = collection_name
        self._timeout_seconds = timeout_seconds

    def ensure_collection(self, vector_size: int):
        req = request.Request(
            url=f'{self._endpoint}/collections/{self._collection_name}',
            method='PUT',
            headers={'Content-Type': 'application/json'},
            data=json.dumps({
                'vectors': {
                    'size': vector_size,
                    'distance': 'Cosine'
                }
            }).encode('utf-8')
        )
        try:
            request.urlopen(req, timeout=self._timeout_seconds).read()
        except Exception as exc:
            message = str(exc)
            if '409' not in message and 'already exists' not in message:
                raise

    def upsert(self, chunks: list[PersistedChunk], embeddings: list[tuple[str, list[float]]]) -> list[tuple[str, str]]:
        if not chunks or not embeddings:
            return []
        chunk_map = {chunk.chunk_id: chunk for chunk in chunks}
        points = []
        refs = []
        for chunk_id, vector in embeddings:
            chunk = chunk_map[chunk_id]
            point_id = chunk_id
            points.append({
                'id': point_id,
                'vector': vector,
                'payload': {
                    'chunk_id': chunk.chunk_id,
                    'document_id': chunk.document_id,
                    'version_id': chunk.version_id,
                    'chunk_no': chunk.chunk_no,
                    'chunk_type': chunk.chunk_type,
                    'title_path': chunk.title_path,
                    'page_no': chunk.page_no,
                    'locator': chunk.locator,
                    'content_text': chunk.content_text,
                    'content_summary': chunk.content_summary,
                }
            })
            refs.append((chunk_id, point_id))
        req = request.Request(
            url=f'{self._endpoint}/collections/{self._collection_name}/points',
            method='PUT',
            headers={'Content-Type': 'application/json'},
            data=json.dumps({'points': points}, ensure_ascii=False).encode('utf-8')
        )
        with request.urlopen(req, timeout=self._timeout_seconds) as resp:
            body = json.loads(resp.read().decode('utf-8'))
            if body.get('status') not in ('ok', None):
                raise RuntimeError('qdrant upsert failed')
        return refs

