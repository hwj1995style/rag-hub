INSERT INTO kb_admin_user (id, username, password_hash, display_name, role_code)
VALUES ('00000000-0000-0000-0000-000000000001', 'admin', '<replace_with_password_hash>', '系统管理员', 'admin')
ON DUPLICATE KEY UPDATE username = VALUES(username);