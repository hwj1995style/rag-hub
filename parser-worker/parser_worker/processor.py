import logging
from parser_worker.indexers.elasticsearch_indexer import ElasticsearchIndexer
from parser_worker.indexers.embedding_service import EmbeddingService
from parser_worker.indexers.qdrant_indexer import QdrantIndexer
from parser_worker.parsers.dispatcher import parse_file
from parser_worker.repository import TaskRepository
from parser_worker.splitter import split_text


class TaskProcessor:
    def __init__(self, db, storage, config, repo=None, es_indexer=None, qdrant_indexer=None, embedding_service=None,
                 parser_fn=None, splitter_fn=None):
        self._repo = repo or TaskRepository(db)
        self._storage = storage
        self._config = config
        self._es = es_indexer or ElasticsearchIndexer(config.search.endpoint, config.search.index_name, config.search.timeout_seconds)
        self._qdrant = qdrant_indexer or QdrantIndexer(config.vector.endpoint, config.vector.collection_name, config.vector.timeout_seconds)
        self._embedding = embedding_service or EmbeddingService(config.vector.embedding_dim)
        self._parser_fn = parser_fn or parse_file
        self._splitter_fn = splitter_fn or split_text

    def run_once(self) -> int:
        tasks = self._repo.claim_pending_tasks(self._config.worker.batch_size)
        if not tasks:
            return 0
        for task in tasks:
            self._process_task(task)
        return len(tasks)

    def _process_task(self, task):
        logging.info('processing task=%s type=%s', task.id, task.task_type)
        phase = 'parsing'
        try:
            version = self._repo.load_document_version(task)
            self._repo.mark_version_running(version.version_id)
            local_file = self._storage.fetch_to_local(version.storage_path, self._config.worker.download_dir)
            content = self._parser_fn(local_file, version.source_type)
            chunks = self._splitter_fn(content, self._config.worker.chunk_size, self._config.worker.max_chunk_size)
            persisted_chunks = self._repo.replace_chunks(version.document_id, version.version_id, chunks)
            self._repo.mark_version_parse_success(version.version_id)

            phase = 'indexing'
            self._repo.mark_step(task.id, 'indexing')
            if self._config.search.enabled:
                self._es.ensure_index()
                self._es.bulk_index(persisted_chunks)
            if self._config.vector.enabled:
                embeddings = self._embedding.embed_chunks(persisted_chunks)
                self._qdrant.ensure_collection(self._config.vector.embedding_dim)
                refs = self._qdrant.upsert(persisted_chunks, embeddings)
                self._repo.replace_vector_refs(
                    refs,
                    self._config.vector.collection_name,
                    self._config.vector.embedding_model,
                    self._config.vector.embedding_dim,
                )

            self._repo.mark_version_index_success(version.version_id)
            self._repo.mark_success(task.id)
            logging.info('task=%s completed chunks=%s', task.id, len(persisted_chunks))
        except Exception as exc:
            logging.exception('task=%s failed', task.id)
            if task.version_id:
                if phase == 'indexing':
                    self._repo.mark_version_index_failed(task.version_id, str(exc))
                else:
                    self._repo.mark_version_parse_failed(task.version_id, str(exc))
            self._repo.mark_failed(task.id, str(exc))