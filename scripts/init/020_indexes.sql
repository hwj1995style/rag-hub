CREATE INDEX idx_kb_document_biz_domain ON kb_document (biz_domain);
CREATE INDEX idx_kb_document_status ON kb_document (status);
CREATE INDEX idx_kb_document_department ON kb_document (department);

CREATE INDEX idx_kb_doc_ver_is_current ON kb_document_version (is_current);
CREATE INDEX idx_kb_doc_ver_file_hash ON kb_document_version (file_hash);
CREATE INDEX idx_kb_doc_ver_parse_status ON kb_document_version (parse_status);

CREATE INDEX idx_kb_chunk_chunk_type ON kb_chunk (chunk_type);
CREATE INDEX idx_kb_chunk_status ON kb_chunk (status);
CREATE INDEX idx_kb_chunk_page_no ON kb_chunk (page_no);

CREATE INDEX idx_kb_chunk_relation_type ON kb_chunk_relation (relation_type);

CREATE INDEX idx_kb_ingest_task_status ON kb_ingest_task (status);
CREATE INDEX idx_kb_ingest_task_created_at ON kb_ingest_task (created_at);

CREATE INDEX idx_kb_perm_resource ON kb_permission_policy (resource_type, resource_id);
CREATE INDEX idx_kb_perm_subject ON kb_permission_policy (subject_type, subject_value);

CREATE INDEX idx_kb_query_log_user_id ON kb_query_log (user_id);
CREATE INDEX idx_kb_query_log_session_id ON kb_query_log (session_id);
CREATE INDEX idx_kb_query_log_created_at ON kb_query_log (created_at);