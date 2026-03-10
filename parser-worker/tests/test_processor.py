import tempfile
import unittest
from pathlib import Path

from parser_worker.config import AppConfig, DatabaseConfig, SearchConfig, StorageConfig, VectorConfig, WorkerConfig
from parser_worker.models import ChunkRecord, DocumentVersion, IngestTask, PersistedChunk
from parser_worker.processor import TaskProcessor


class FakeRepo:
    def __init__(self, task, version):
        self.task = task
        self.version = version
        self.claimed = False
        self.steps = []
        self.persisted_chunks = []
        self.persisted_vector_refs = []
        self.task_failed = None
        self.version_parse_failed = None
        self.version_index_failed = None
        self.task_success = False
        self.version_index_success = False

    def claim_pending_tasks(self, batch_size):
        if self.claimed:
            return []
        self.claimed = True
        return [self.task]

    def load_document_version(self, task):
        return self.version

    def mark_version_running(self, version_id):
        self.steps.append(('version_running', version_id))

    def replace_chunks(self, document_id, version_id, chunks):
        self.persisted_chunks = [PersistedChunk(
            chunk_id=f'chunk-{chunk.chunk_no}',
            document_id=document_id,
            version_id=version_id,
            chunk_no=chunk.chunk_no,
            chunk_type=chunk.chunk_type,
            title_path=chunk.title_path,
            page_no=chunk.page_no,
            locator=chunk.locator,
            content_text=chunk.content_text,
            content_summary=chunk.content_summary,
            token_count=chunk.token_count,
            char_count=chunk.char_count,
        ) for chunk in chunks]
        return self.persisted_chunks

    def mark_version_parse_success(self, version_id):
        self.steps.append(('parse_success', version_id))

    def mark_step(self, task_id, step):
        self.steps.append(('task_step', task_id, step))

    def replace_vector_refs(self, refs, collection_name, embedding_model, embedding_dim):
        self.persisted_vector_refs = [*refs]
        self.steps.append(('vector_refs', collection_name, embedding_model, embedding_dim, len(refs)))

    def mark_version_index_success(self, version_id):
        self.version_index_success = True
        self.steps.append(('index_success', version_id))

    def mark_success(self, task_id):
        self.task_success = True
        self.steps.append(('task_success', task_id))

    def mark_version_parse_failed(self, version_id, message):
        self.version_parse_failed = (version_id, message)

    def mark_version_index_failed(self, version_id, message):
        self.version_index_failed = (version_id, message)

    def mark_failed(self, task_id, message):
        self.task_failed = (task_id, message)


class FakeStorage:
    def __init__(self, local_file):
        self.local_file = local_file

    def fetch_to_local(self, source_path, download_dir):
        return self.local_file


class FakeEsIndexer:
    def __init__(self, raise_on_bulk=False):
        self.ensure_called = False
        self.bulk_items = []
        self.raise_on_bulk = raise_on_bulk

    def ensure_index(self):
        self.ensure_called = True

    def bulk_index(self, chunks):
        if self.raise_on_bulk:
            raise RuntimeError('es bulk failed')
        self.bulk_items = list(chunks)


class FakeQdrantIndexer:
    def __init__(self, raise_on_upsert=False):
        self.ensure_calls = []
        self.upsert_calls = []
        self.raise_on_upsert = raise_on_upsert

    def ensure_collection(self, vector_size):
        self.ensure_calls.append(vector_size)

    def upsert(self, chunks, embeddings):
        if self.raise_on_upsert:
            raise RuntimeError('qdrant upsert failed')
        self.upsert_calls.append((list(chunks), list(embeddings)))
        return [(chunk.chunk_id, chunk.chunk_id) for chunk in chunks]


class FakeEmbeddingService:
    def embed_chunks(self, chunks):
        return [(chunk.chunk_id, [0.1, 0.2, 0.3]) for chunk in chunks]


class TaskProcessorTest(unittest.TestCase):
    def setUp(self):
        self.config = AppConfig(
            worker=WorkerConfig(5, 5, Path('./tmp/downloads'), 500, 800),
            database=DatabaseConfig('127.0.0.1', 3306, 'kb', 'kb_user', 'change_me'),
            storage=StorageConfig('local', Path('./mock-storage')),
            search=SearchConfig(True, 'http://127.0.0.1:9200', 'kb_chunk', 10),
            vector=VectorConfig(True, 'http://127.0.0.1:6333', 'kb_chunk', 'mock-embedding-v1', 3, 10),
        )
        self.task = IngestTask('task-001', 'ingest', '/uploads/file.txt', 'doc-001', 'ver-001', 'running', 'parsing')
        self.version = DocumentVersion('doc-001', 'ver-001', '??????', 'txt', '/uploads/file.txt', '/uploads/file.txt', 'file.txt')
        self.tmpdir = tempfile.TemporaryDirectory()
        self.local_file = Path(self.tmpdir.name) / 'file.txt'
        self.local_file.write_text('????????n????????, encoding='utf-8')

    def tearDown(self):
        self.tmpdir.cleanup()

    def test_run_once_success_persists_chunks_and_vector_refs(self):
        repo = FakeRepo(self.task, self.version)
        qdrant = FakeQdrantIndexer()
        processor = TaskProcessor(
            db=None,
            storage=FakeStorage(self.local_file),
            config=self.config,
            repo=repo,
            es_indexer=FakeEsIndexer(),
            qdrant_indexer=qdrant,
            embedding_service=FakeEmbeddingService(),
            parser_fn=lambda path, source_type: path.read_text(encoding='utf-8'),
            splitter_fn=lambda content, chunk_size, max_chunk_size: [
                ChunkRecord(1, 'paragraph', '??????', 1, 'p1', content, '???', len(content), len(content))
            ],
        )

        processed = processor.run_once()

        self.assertEqual(processed, 1)
        self.assertTrue(repo.task_success)
        self.assertTrue(repo.version_index_success)
        self.assertEqual(len(repo.persisted_chunks), 1)
        self.assertEqual(len(repo.persisted_vector_refs), 1)
        self.assertEqual(qdrant.ensure_calls, [3])
        self.assertIsNone(repo.task_failed)
        self.assertIsNone(repo.version_parse_failed)
        self.assertIsNone(repo.version_index_failed)

    def test_run_once_indexing_failure_marks_task_failed(self):
        repo = FakeRepo(self.task, self.version)
        processor = TaskProcessor(
            db=None,
            storage=FakeStorage(self.local_file),
            config=self.config,
            repo=repo,
            es_indexer=FakeEsIndexer(),
            qdrant_indexer=FakeQdrantIndexer(raise_on_upsert=True),
            embedding_service=FakeEmbeddingService(),
            parser_fn=lambda path, source_type: path.read_text(encoding='utf-8'),
            splitter_fn=lambda content, chunk_size, max_chunk_size: [
                ChunkRecord(1, 'paragraph', '??????', 1, 'p1', content, '???', len(content), len(content))
            ],
        )

        processed = processor.run_once()

        self.assertEqual(processed, 1)
        self.assertFalse(repo.task_success)
        self.assertIsNotNone(repo.task_failed)
        self.assertIsNotNone(repo.version_index_failed)
        self.assertIsNone(repo.version_parse_failed)


if __name__ == '__main__':
    unittest.main()
