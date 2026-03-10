import json
from urllib import request
from urllib.error import HTTPError, URLError
from parser_worker.models import PersistedChunk


class ElasticsearchIndexer:
    def __init__(self, endpoint: str, index_name: str, timeout_seconds: int):
        self._endpoint = endpoint.rstrip('/')
        self._index_name = index_name
        self._timeout_seconds = timeout_seconds

    def ensure_index(self):
        req = request.Request(
            url=f'{self._endpoint}/{self._index_name}',
            method='PUT',
            headers={'Content-Type': 'application/json'},
            data=json.dumps({
                'mappings': {
                    'properties': {
                        'chunk_id': {'type': 'keyword'},
                        'document_id': {'type': 'keyword'},
                        'version_id': {'type': 'keyword'},
                        'chunk_no': {'type': 'integer'},
                        'chunk_type': {'type': 'keyword'},
                        'title_path': {'type': 'text'},
                        'page_no': {'type': 'integer'},
                        'locator': {'type': 'keyword'},
                        'content_text': {'type': 'text'},
                        'content_summary': {'type': 'text'}
                    }
                }
            }).encode('utf-8')
        )
        try:
            request.urlopen(req, timeout=self._timeout_seconds).read()
        except HTTPError as exc:
            if exc.code != 400:
                raise
        except URLError:
            raise

    def bulk_index(self, chunks: list[PersistedChunk]):
        if not chunks:
            return
        lines = []
        for chunk in chunks:
            lines.append(json.dumps({'index': {'_index': self._index_name, '_id': chunk.chunk_id}}, ensure_ascii=False))
            lines.append(json.dumps({
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
            }, ensure_ascii=False))
        payload = ('\n'.join(lines) + '\n').encode('utf-8')
        req = request.Request(
            url=f'{self._endpoint}/_bulk?refresh=true',
            method='POST',
            headers={'Content-Type': 'application/x-ndjson'},
            data=payload,
        )
        with request.urlopen(req, timeout=self._timeout_seconds) as resp:
            body = json.loads(resp.read().decode('utf-8'))
            if body.get('errors'):
                raise RuntimeError('elasticsearch bulk index contains errors')

