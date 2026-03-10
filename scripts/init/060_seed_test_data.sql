INSERT INTO kb_document (id, doc_code, title, source_type, source_uri, source_system, owner, department, biz_domain, security_level, language, status, current_version_id, is_deleted)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'DOC-TEST-001',
    '客户额度审批管理办法',
    'pdf',
    '/uploads/customer-credit-policy.pdf',
    'seed',
    'admin',
    '信审部',
    '授信',
    'internal',
    'zh-CN',
    'active',
    '22222222-2222-2222-2222-222222222222',
    0
)
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    department = VALUES(department),
    biz_domain = VALUES(biz_domain);

INSERT INTO kb_document_version (id, document_id, version_no, file_hash, file_name, file_size, storage_path, parse_status, index_status, effective_from, effective_to, is_current, parser_version, remark, is_deleted)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'v1.0',
    'seedhash001',
    'customer-credit-policy.pdf',
    102400,
    '/uploads/customer-credit-policy.pdf',
    'success',
    'success',
    NOW(),
    NULL,
    1,
    'seed-parser-1.0',
    '测试版本',
    0
)
ON DUPLICATE KEY UPDATE
    parse_status = VALUES(parse_status),
    index_status = VALUES(index_status),
    remark = VALUES(remark);

INSERT INTO kb_chunk (id, document_id, version_id, chunk_no, chunk_type, title_path, page_no, sheet_name, slide_no, locator, content_text, content_summary, token_count, char_count, status, is_deleted)
VALUES
(
    '33333333-3333-3333-3333-333333333331',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    1,
    'paragraph',
    '3.2 申请材料',
    12,
    NULL,
    NULL,
    'p12',
    '客户额度审批申请需提交营业执照、近两年财务报表、授信申请书。',
    '客户额度审批申请材料说明',
    30,
    32,
    'active',
    0
),
(
    '33333333-3333-3333-3333-333333333332',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    2,
    'paragraph',
    '3.3 审批要求',
    13,
    NULL,
    NULL,
    'p13',
    '审批前需完成客户风险评级，并核验申请材料的完整性与有效性。',
    '审批前校验要求说明',
    28,
    31,
    'active',
    0
)
ON DUPLICATE KEY UPDATE
    content_text = VALUES(content_text),
    content_summary = VALUES(content_summary),
    title_path = VALUES(title_path);

INSERT INTO kb_chunk_vector_ref (id, chunk_id, collection_name, point_id, embedding_model, embedding_dim, status)
VALUES
(
    '88888888-8888-8888-8888-888888888881',
    '33333333-3333-3333-3333-333333333331',
    'kb_chunk',
    '33333333-3333-3333-3333-333333333331',
    'mock-embedding-v1',
    1024,
    'active'
),
(
    '88888888-8888-8888-8888-888888888882',
    '33333333-3333-3333-3333-333333333332',
    'kb_chunk',
    '33333333-3333-3333-3333-333333333332',
    'mock-embedding-v1',
    1024,
    'active'
)
ON DUPLICATE KEY UPDATE
    point_id = VALUES(point_id),
    embedding_dim = VALUES(embedding_dim),
    status = VALUES(status);

INSERT INTO kb_ingest_task (id, task_type, source_uri, document_id, version_id, status, step, error_message, retry_count, started_at, finished_at)
VALUES (
    '44444444-4444-4444-4444-444444444444',
    'ingest',
    '/uploads/customer-credit-policy.pdf',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'success',
    'completed',
    NULL,
    0,
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    status = VALUES(status),
    step = VALUES(step),
    error_message = VALUES(error_message);

INSERT INTO kb_permission_policy (id, resource_type, resource_id, subject_type, subject_value, effect)
VALUES
(
    '55555555-5555-5555-5555-555555555551',
    'document',
    '11111111-1111-1111-1111-111111111111',
    'role',
    'admin',
    'allow'
),
(
    '55555555-5555-5555-5555-555555555552',
    'document',
    '11111111-1111-1111-1111-111111111111',
    'department',
    '信审部',
    'allow'
)
ON DUPLICATE KEY UPDATE
    subject_value = VALUES(subject_value),
    effect = VALUES(effect);

INSERT INTO kb_query_log (id, user_id, session_id, query_text, rewritten_query, answer_text, retrieved_chunk_ids_json, citations_json, feedback_score, latency_ms, trace_id)
VALUES (
    '66666666-6666-6666-6666-666666666666',
    'seed-user',
    'seed-session-001',
    '客户额度审批需要哪些材料？',
    '客户额度审批申请材料清单',
    '根据制度，客户额度审批申请通常需要营业执照、近两年财务报表、授信申请书等材料。',
    JSON_ARRAY('33333333-3333-3333-3333-333333333331'),
    JSON_ARRAY(
        JSON_OBJECT(
            'documentId', '11111111-1111-1111-1111-111111111111',
            'documentTitle', '客户额度审批管理办法',
            'titlePath', '3.2 申请材料',
            'locator', 'p12',
            'snippet', '客户额度审批申请材料说明'
        )
    ),
    5,
    1200,
    'seed-trace-001'
)
ON DUPLICATE KEY UPDATE
    query_text = VALUES(query_text),
    rewritten_query = VALUES(rewritten_query),
    answer_text = VALUES(answer_text),
    citations_json = VALUES(citations_json);

INSERT INTO kb_admin_user (id, username, password_hash, display_name, role_code, status)
VALUES (
    '77777777-7777-7777-7777-777777777777',
    'tester',
    '<replace_with_password_hash>',
    '测试管理员',
    'admin',
    'active'
)
ON DUPLICATE KEY UPDATE
    display_name = VALUES(display_name),
    status = VALUES(status);