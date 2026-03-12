#!/bin/bash
set -e

DB_HOST=${DB_HOST:-127.0.0.1}
DB_PORT=${DB_PORT:-3306}
DB_NAME=${DB_NAME:-kb}
DB_USER=${DB_USER:-kb_user}
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/../.." && pwd)

for file in \
  "$REPO_ROOT/scripts/init/001_extensions.sql" \
  "$REPO_ROOT/scripts/init/010_tables.sql" \
  "$REPO_ROOT/scripts/init/020_indexes.sql" \
  "$REPO_ROOT/scripts/init/030_triggers.sql" \
  "$REPO_ROOT/scripts/init/040_seed_admin.sql" \
  "$REPO_ROOT/scripts/init/050_seed_permissions.sql" \
  "$REPO_ROOT/scripts/init/060_seed_test_data.sql"
 do
  mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME" < "$file"
 done
