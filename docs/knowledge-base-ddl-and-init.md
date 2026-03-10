# rag-hub DDL 与初始化说明

## 1. 文档目标

本文档定义当前 `rag-hub` 项目在 `MySQL + Elasticsearch + Qdrant` 架构下的数据库对象、初始化顺序和落库边界。

当前原则：

- MySQL 只负责业务元数据和日志
- Elasticsearch 负责全文索引
- Qdrant 负责向量索引
- 向量本体不落 MySQL，只保留映射关系

## 2. 数据库选型

建议：

- 数据库：MySQL 8.0
- 字符集：`utf8mb4`
- 时区：`Asia/Shanghai`
- 存储引擎：`InnoDB`

## 3. 建库示例

```sql
CREATE DATABASE kb DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'kb_user'@'%' IDENTIFIED BY 'change_me';
GRANT ALL PRIVILEGES ON kb.* TO 'kb_user'@'%';
FLUSH PRIVILEGES;
```

## 4. 表设计原则

- 所有业务表统一前缀 `kb_`
- 主键统一使用 `char(36)` UUID
- 时间字段统一使用 `datetime`
- JSON 字段统一使用 MySQL `json`
- Qdrant 只保存 `point_id` 映射关系

## 5. 核心表

### 5.1 kb_document

用于保存文档主信息。

### 5.2 kb_document_version

用于保存文档版本、生效状态、解析状态、索引状态。

### 5.3 kb_chunk

用于保存分块结果和定位信息。

### 5.4 kb_chunk_vector_ref

用于保存 chunk 和 Qdrant point 的映射。

### 5.5 kb_ingest_task

用于保存入库任务、重解析任务、重建索引任务。

### 5.6 kb_permission_policy

用于保存资源权限策略。

### 5.7 kb_query_log

用于保存问答日志、引用和召回记录。

## 6. 关键建表示例

### 6.1 kb_document

```sql
CREATE TABLE kb_document (
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
```

### 6.2 kb_document_version

```sql
CREATE TABLE kb_document_version (
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
```

### 6.3 kb_chunk

```sql
CREATE TABLE kb_chunk (
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
```

### 6.4 kb_chunk_vector_ref

```sql
CREATE TABLE kb_chunk_vector_ref (
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
```

### 6.5 kb_query_log

```sql
CREATE TABLE kb_query_log (
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
```

## 7. 数据落库边界

- MySQL：文档、版本、chunk、任务、权限、问答日志、Qdrant 映射
- Elasticsearch：chunk 文本索引
- Qdrant：chunk 向量和 payload

## 8. 初始化顺序

1. 初始化 MySQL 数据库和账号。
2. 执行 MySQL DDL。
3. 初始化 Elasticsearch 索引模板和索引。
4. 初始化 Qdrant collection。
5. 初始化管理员和测试数据。

## 9. DBA 验收要点

- MySQL 表、索引、外键已创建。
- MySQL JSON 字段可正常写入和查询。
- Elasticsearch 索引可写入 chunk 文本。
- Qdrant collection 可写入 point 并按 point_id 查询。
- 删除和重建索引时，MySQL 与 Qdrant 映射关系可回溯。

## 10. 相关文件

- [初始化脚本目录](D:/Projects/rag-hub/scripts/init)
- [OpenAPI 规范](D:/Projects/rag-hub/api/knowledge-base-openapi.yaml)
- [开发指南](D:/Projects/rag-hub/docs/knowledge-base-development-guide.md)


