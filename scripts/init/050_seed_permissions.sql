INSERT INTO kb_permission_policy (id, resource_type, resource_id, subject_type, subject_value, effect)
SELECT UUID(), 'document', id, 'role', 'admin', 'allow'
FROM kb_document
ON DUPLICATE KEY UPDATE subject_value = VALUES(subject_value);