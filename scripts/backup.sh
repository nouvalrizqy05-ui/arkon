#!/bin/bash
# ============================================================
# ARKON Database Backup Script — TASK-OPS-002
# NFR-REL-004: Automated daily backup, 30-day retention
# ============================================================
# Setup cron: 0 2 * * * /path/to/backup.sh >> /var/log/arkon-backup.log 2>&1
# ============================================================

set -euo pipefail

# ─── Config ───────────────────────────────────────────────
BACKUP_DIR="${BACKUP_DIR:-/var/backups/arkon}"
DB_URL="${DB_URL:-postgresql://localhost:5432/arkon_production}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/arkon_backup_$DATE.sql.gz"

# Optional: S3/R2 upload
S3_BUCKET="${S3_BUCKET:-}"  # Set to your bucket URL, e.g. s3://arkon-backups/

# ─── Functions ────────────────────────────────────────────
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

check_deps() {
  for dep in pg_dump gzip; do
    if ! command -v "$dep" &>/dev/null; then
      log "ERROR: $dep not found. Install postgresql-client."
      exit 1
    fi
  done
}

create_backup() {
  mkdir -p "$BACKUP_DIR"
  log "Starting backup → $BACKUP_FILE"
  
  if pg_dump "$DB_URL" | gzip > "$BACKUP_FILE"; then
    SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
    log "✅ Backup completed: $BACKUP_FILE ($SIZE)"
  else
    log "❌ Backup FAILED"
    exit 1
  fi
}

upload_to_s3() {
  if [[ -n "$S3_BUCKET" ]]; then
    if command -v aws &>/dev/null; then
      log "Uploading to S3: $S3_BUCKET"
      aws s3 cp "$BACKUP_FILE" "$S3_BUCKET/$(basename $BACKUP_FILE)"
      log "✅ S3 upload complete"
    elif command -v rclone &>/dev/null; then
      rclone copy "$BACKUP_FILE" "$S3_BUCKET"
      log "✅ rclone upload complete"
    else
      log "⚠️  S3_BUCKET set but neither aws nor rclone found. Skipping upload."
    fi
  fi
}

cleanup_old_backups() {
  log "Cleaning backups older than $RETENTION_DAYS days..."
  COUNT=$(find "$BACKUP_DIR" -name "arkon_backup_*.sql.gz" -mtime +"$RETENTION_DAYS" | wc -l)
  find "$BACKUP_DIR" -name "arkon_backup_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete
  log "Removed $COUNT old backup(s)"
}

test_backup() {
  log "Testing backup integrity..."
  if gzip -t "$BACKUP_FILE"; then
    log "✅ Backup integrity check passed"
  else
    log "❌ Backup integrity check FAILED"
    exit 1
  fi
}

# ─── Main ─────────────────────────────────────────────────
log "=== ARKON Backup Starting ==="
check_deps
create_backup
test_backup
upload_to_s3
cleanup_old_backups
log "=== ARKON Backup Complete ==="
