INSERT INTO kb_document (id, doc_code, title, source_type, source_uri, source_system, owner, department, biz_domain, security_level, language, status, current_version_id, is_deleted, created_at, updated_at)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'DOC-TEST-001',
    'Customer Credit Policy',
    'pdf',
    '/uploads/customer-credit-policy.pdf',
    'seed',
    'admin',
    'CreditReview',
    'credit',
    'internal',
    'en-US',
    'active',
    '22222222-2222-2222-2222-222222222222',
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

INSERT INTO kb_document_version (id, document_id, version_no, file_hash, file_name, file_size, storage_path, parse_status, index_status, effective_from, effective_to, is_current, parser_version, remark, is_deleted, created_at, updated_at)
VALUES
(
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'v1.0',
    'seedhash001',
    'customer-credit-policy.pdf',
    102400,
    '/uploads/customer-credit-policy.pdf',
    'success',
    'success',
    CURRENT_TIMESTAMP,
    null,
    true,
    'seed-parser-1.0',
    'current version',
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '22222222-2222-2222-2222-222222222223',
    '11111111-1111-1111-1111-111111111111',
    'v0.9',
    'seedhash000',
    'customer-credit-policy-v0.9.pdf',
    100000,
    '/uploads/customer-credit-policy-v0.9.pdf',
    'success',
    'success',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    false,
    'seed-parser-0.9',
    'history version',
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

INSERT INTO kb_chunk (id, document_id, version_id, chunk_no, chunk_type, title_path, page_no, sheet_name, slide_no, locator, content_text, content_summary, token_count, char_count, status, is_deleted, created_at, updated_at)
VALUES
(
    '33333333-3333-3333-3333-333333333331',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    1,
    'paragraph',
    '3.2 Required Materials',
    12,
    null,
    null,
    'p12',
    'Credit approval requires a business license, two years of financial statements, and a credit application form.',
    'Required materials for credit approval',
    30,
    110,
    'active',
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '33333333-3333-3333-3333-333333333332',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    2,
    'paragraph',
    '3.3 Review Requirements',
    13,
    null,
    null,
    'p13',
    'Review must verify customer risk rating and document completeness before approval.',
    'Review checks before approval',
    28,
    85,
    'active',
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222223',
    1,
    'paragraph',
    '2.1 Historical Rule',
    9,
    null,
    null,
    'p9',
    'Historical version used a different approval checklist.',
    'Historical version note',
    15,
    54,
    'active',
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

INSERT INTO kb_ingest_task (id, task_type, source_uri, document_id, version_id, status, step, error_message, retry_count, started_at, finished_at, created_at, updated_at)
VALUES (
    '44444444-4444-4444-4444-444444444444',
    'ingest',
    '/uploads/customer-credit-policy.pdf',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'success',
    'indexing',
    null,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

INSERT INTO kb_permission_policy (id, resource_type, resource_id, subject_type, subject_value, effect, created_at)
VALUES
(
    '55555555-5555-5555-5555-555555555551',
    'document',
    '11111111-1111-1111-1111-111111111111',
    'role',
    'admin',
    'allow',
    CURRENT_TIMESTAMP
),
(
    '55555555-5555-5555-5555-555555555552',
    'document',
    '11111111-1111-1111-1111-111111111111',
    'department',
    'CreditReview',
    'allow',
    CURRENT_TIMESTAMP
);

INSERT INTO kb_query_log (id, user_id, session_id, query_text, rewritten_query, answer_text, retrieved_chunk_ids_json, citations_json, feedback_score, latency_ms, trace_id, created_at)
VALUES (
    '66666666-6666-6666-6666-666666666666',
    'seed-user',
    'seed-session-001',
    'What materials are required for credit approval',
    'credit approval required materials checklist',
    'Credit approval usually requires a business license, financial statements, and a credit application form.',
    CAST('["33333333-3333-3333-3333-333333333331"]' AS JSON),
    CAST('[{"documentId":"11111111-1111-1111-1111-111111111111","documentTitle":"Customer Credit Policy","titlePath":"3.2 Required Materials","locator":"p12","snippet":"Credit approval requires a business license, two years of financial statements, and a credit application form."}]' AS JSON),
    5,
    1200,
    'seed-trace-001',
    CURRENT_TIMESTAMP
);

INSERT INTO kb_admin_user (id, username, password_hash, display_name, role_code, status, last_login_at, created_at, updated_at)
VALUES
(
    '77777777-7777-7777-7777-777777777777',
    'tester',
    '{noop}test123456',
    'Test Admin',
    'admin',
    'active',
    null,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '88888888-8888-8888-8888-888888888888',
    'viewer',
    '{noop}viewer123',
    'Read Only User',
    'viewer',
    'active',
    null,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
