import logging
import uuid
from parser_worker.models import DocumentVersion, IngestTask, PersistedChunk


class TaskRepository:
    def __init__(self, db):
        self._db = db

    def claim_pending_tasks(self, batch_size: int):
        select_sql = """
        SELECT id, task_type, source_uri, document_id, version_id, status, step
        FROM kb_ingest_task
        WHERE status = 'pending'
        ORDER BY created_at ASC
        LIMIT %s
        FOR UPDATE
        """
        update_sql = """
        UPDATE kb_ingest_task
        SET status=%s, step=%s, started_at=NOW(), updated_at=NOW()
        WHERE id=%s
        """
        with self._db.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(select_sql, (batch_size,))
                rows = cur.fetchall()
                tasks = [IngestTask(*row) for row in rows]
                for task in tasks:
                    cur.execute(update_sql, ('running', 'parsing', task.id))
                return tasks

    def mark_step(self, task_id: str, step: str):
        with self._db.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE kb_ingest_task SET step=%s, updated_at=NOW() WHERE id=%s",
                    (step, task_id),
                )

    def mark_success(self, task_id: str):
        with self._db.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE kb_ingest_task SET status='success', step='completed', finished_at=NOW(), updated_at=NOW(), error_message=NULL WHERE id=%s",
                    (task_id,),
                )

    def mark_failed(self, task_id: str, message: str):
        with self._db.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE kb_ingest_task SET status='failed', step='failed', finished_at=NOW(), updated_at=NOW(), retry_count=retry_count+1, error_message=%s WHERE id=%s",
                    (message[:2000], task_id),
                )

    def load_document_version(self, task: IngestTask) -> DocumentVersion:
        sql = """
        SELECT d.id, v.id, d.title, d.source_type, d.source_uri, v.storage_path, v.file_name
        FROM kb_document d
        JOIN kb_document_version v ON d.id = v.document_id
        WHERE d.id = %s AND v.id = %s
        """
        with self._db.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (task.document_id, task.version_id))
                row = cur.fetchone()
                if not row:
                    raise ValueError('document/version not found for task')
                return DocumentVersion(*row)

    def mark_version_running(self, version_id: str):
        with self._db.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE kb_document_version SET parse_status='running', index_status='pending', updated_at=NOW() WHERE id=%s",
                    (version_id,),
                )

    def mark_version_parse_success(self, version_id: str):
        with self._db.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE kb_document_version SET parse_status='success', index_status='running', updated_at=NOW() WHERE id=%s",
                    (version_id,),
                )

    def mark_version_index_success(self, version_id: str):
        with self._db.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE kb_document_version SET parse_status='success', index_status='success', updated_at=NOW() WHERE id=%s",
                    (version_id,),
                )

    def mark_version_parse_failed(self, version_id: str, message: str):
        with self._db.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE kb_document_version SET parse_status='failed', index_status='failed', remark=%s, updated_at=NOW() WHERE id=%s",
                    (message[:1000], version_id),
                )

    def mark_version_index_failed(self, version_id: str, message: str):
        with self._db.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE kb_document_version SET parse_status='success', index_status='failed', remark=%s, updated_at=NOW() WHERE id=%s",
                    (message[:1000], version_id),
                )

    def replace_chunks(self, document_id: str, version_id: str, chunks):
        persisted = []
        with self._db.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM kb_chunk_vector_ref WHERE chunk_id IN (SELECT id FROM kb_chunk WHERE version_id=%s)", (version_id,))
                cur.execute("DELETE FROM kb_chunk WHERE version_id=%s", (version_id,))
                for chunk in chunks:
                    chunk_id = str(uuid.uuid4())
                    cur.execute(
                        """
                        INSERT INTO kb_chunk (
                            id, document_id, version_id, chunk_no, chunk_type, title_path, page_no, sheet_name,
                            slide_no, locator, content_text, content_summary, token_count, char_count, status,
                            is_deleted, created_at, updated_at
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s,
                            %s, %s, %s, %s, %s, %s, 'active', 0, NOW(), NOW()
                        )
                        """,
                        (
                            chunk_id, document_id, version_id, chunk.chunk_no, chunk.chunk_type,
                            chunk.title_path, chunk.page_no, None, None, chunk.locator, chunk.content_text,
                            chunk.content_summary, chunk.token_count, chunk.char_count,
                        ),
                    )
                    persisted.append(PersistedChunk(
                        chunk_id=chunk_id,
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
                    ))
        logging.info('replaced chunks for version=%s count=%s', version_id, len(chunks))
        return persisted

    def replace_vector_refs(self, refs, collection_name: str, embedding_model: str, embedding_dim: int):
        if not refs:
            return
        with self._db.connection() as conn:
            with conn.cursor() as cur:
                for chunk_id, point_id in refs:
                    cur.execute(
                        """
                        INSERT INTO kb_chunk_vector_ref (
                            id, chunk_id, collection_name, point_id, embedding_model, embedding_dim, status, created_at, updated_at
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, 'active', NOW(), NOW()
                        )
                        ON DUPLICATE KEY UPDATE
                            collection_name=VALUES(collection_name),
                            point_id=VALUES(point_id),
                            embedding_dim=VALUES(embedding_dim),
                            status='active',
                            updated_at=NOW()
                        """,
                        (str(uuid.uuid4()), chunk_id, collection_name, point_id, embedding_model, embedding_dim),
                    )