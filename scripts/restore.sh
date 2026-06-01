#!/bin/bash
# ARKON Database Restore Script
# Usage: ./restore.sh /path/to/backup.sql.gz [target_db_url]
set -euo pipefail

BACKUP_FILE="${1:-}"
DB_URL="${2:-$DB_URL}"

if [[ -z "$BACKUP_FILE" ]]; then
  echo "Usage: $0 <backup.sql.gz> [db_url]"
  exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "ERROR: Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "[$(date)] Restoring from: $BACKUP_FILE"
echo "[$(date)] Target DB: $DB_URL"
read -p "Are you sure? This will OVERWRITE the target database. (yes/no): " confirm
[[ "$confirm" != "yes" ]] && { echo "Aborted."; exit 1; }

gzip -dc "$BACKUP_FILE" | psql "$DB_URL"
echo "[$(date)] ✅ Restore complete"
