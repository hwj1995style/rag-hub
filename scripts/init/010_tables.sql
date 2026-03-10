CREATE TABLE IF NOT EXISTS kb_document (
    id char(36) PRIMARY KEY,
    doc_code varchar(64) NOT NULL,
    title varchar(512) NOT NULL,
    source_type varchar(32) NOT NULL,
    source_uri text,
    source_system varchar(128),
    owner varchar(128),
    department varchar(128),
    biz_domain varchar(128),
    security_level varchar(32) NOT NULL DEFAULT 'internal',
    language varchar(32) NOT NULL DEFAULT 'zh-CN',
    status varchar(32) NOT NULL DEFAULT 'draft',
    current_version_id char(36),
    is_deleted tinyint(1) NOT NULL DEFAULT 0,
    created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_kb_document_doc_code (doc_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS kb_document_version (
    id char(36) PRIMARY KEY,
    document_id char(36) NOT NULL,
    version_no varchar(64) NOT NULL,
    file_hash varchar(128) NOT NULL,
    file_name varchar(512) NOT NULL,
    file_size bigint NOT NULL DEFAULT 0,
    storage_path text NOT NULL,
    parse_status varchar(32) NOT NULL DEFAULT 'pending',
    index_status varchar(32) NOT NULL DEFAULT 'pending',
    effective_from datetime NULL,
    effective_to datetime NULL,
    is_current tinyint(1) NOT NULL DEFAULT 0,
    parser_version varchar(64),
    remark text,
    is_deleted tinyint(1) NOT NULL DEFAULT 0,
    created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_kb_doc_ver (document_id, version_no),
    KEY idx_kb_doc_ver_document_id (document_id),
    CONSTRAINT fk_kb_doc_ver_document FOREIGN KEY (document_id) REFERENCES kb_document(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS kb_chunk (
    id char(36) PRIMARY KEY,
    document_id char(36) NOT NULL,
    version_id char(36) NOT NULL,
    chunk_no int NOT NULL,
    chunk_type varchar(32) NOT NULL,
    title_path text,
    page_no int,
    sheet_name varchar(128),
    slide_no int,
    locator varchar(256),
    content_text longtext NOT NULL,
    content_summary text,
    token_count int NOT NULL DEFAULT 0,
    char_count int NOT NULL DEFAULT 0,
    status varchar(32) NOT NULL DEFAULT 'active',
    is_deleted tinyint(1) NOT NULL DEFAULT 0,
    created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_kb_chunk_ver_no (version_id, chunk_no),
    KEY idx_kb_chunk_document_id (document_id),
    KEY idx_kb_chunk_version_id (version_id),
    CONSTRAINT fk_kb_chunk_document FOREIGN KEY (document_id) REFERENCES kb_document(id),
    CONSTRAINT fk_kb_chunk_version FOREIGN KEY (version_id) REFERENCES kb_document_version(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS kb_chunk_vector_ref (
    id char(36) PRIMARY KEY,
    chunk_id char(36) NOT NULL,
    collection_name varchar(128) NOT NULL,
    point_id varchar(128) NOT NULL,
    embedding_model varchar(128) NOT NULL,
    embedding_dim int NOT NULL,
    status varchar(32) NOT NULL DEFAULT 'active',
    created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_kb_chunk_vector_ref (chunk_id, embedding_model),
    KEY idx_kb_chunk_vector_point (collection_name, point_id),
    CONSTRAINT fk_kb_chunk_vector_ref_chunk FOREIGN KEY (chunk_id) REFERENCES kb_chunk(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS kb_chunk_relation (
    id char(36) PRIMARY KEY,
    src_chunk_id char(36) NOT NULL,
    dst_chunk_id char(36) NOT NULL,
    relation_type varchar(64) NOT NULL,
    score decimal(5,4) NOT NULL DEFAULT 0,
    created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_kb_chunk_relation_src (src_chunk_id),
    KEY idx_kb_chunk_relation_dst (dst_chunk_id),
    CONSTRAINT fk_kb_chunk_relation_src FOREIGN KEY (src_chunk_id) REFERENCES kb_chunk(id) ON DELETE CASCADE,
    CONSTRAINT fk_kb_chunk_relation_dst FOREIGN KEY (dst_chunk_id) REFERENCES kb_chunk(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS kb_ingest_task (
    id char(36) PRIMARY KEY,
    task_type varchar(32) NOT NULL,
    source_uri text,
    document_id char(36),
    version_id char(36),
    status varchar(32) NOT NULL DEFAULT 'pending',
    step varchar(64),
    error_message text,
    retry_count int NOT NULL DEFAULT 0,
    started_at datetime NULL,
    finished_at datetime NULL,
    created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_kb_ingest_task_document_id (document_id),
    KEY idx_kb_ingest_task_version_id (version_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS kb_permission_policy (
    id char(36) PRIMARY KEY,
    resource_type varchar(32) NOT NULL,
    resource_id char(36) NOT NULL,
    subject_type varchar(32) NOT NULL,
    subject_value varchar(128) NOT NULL,
    effect varchar(16) NOT NULL,
    created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_kb_permission_policy (resource_type, resource_id, subject_type, subject_value, effect)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS kb_query_log (
    id char(36) PRIMARY KEY,
    user_id varchar(128),
    session_id varchar(128),
    query_text text NOT NULL,
    rewritten_query text,
    answer_text longtext,
    retrieved_chunk_ids_json json,
    citations_json json,
    feedback_score int,
    latency_ms int,
    trace_id varchar(128),
    created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS kb_admin_user (
    id char(36) PRIMARY KEY,
    username varchar(64) NOT NULL,
    password_hash varchar(255) NOT NULL,
    display_name varchar(128),
    role_code varchar(64) NOT NULL DEFAULT 'admin',
    status varchar(32) NOT NULL DEFAULT 'active',
    last_login_at datetime NULL,
    created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_kb_admin_user_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;