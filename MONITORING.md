# ARKON Production Monitoring Guide
## TASK-OPS-001 — NFR-REL-005

---

## Stack Monitoring yang Direkomendasikan

### 1. Sentry.io — Error Tracking (Gratis tier cukup)

Setup:
1. Buat akun di https://sentry.io
2. Buat project baru → pilih **Node.js**
3. Salin DSN → simpan di environment variable:
   ```
   SENTRY_DSN=https://xxxxx@oxxxx.ingest.sentry.io/xxxxx
   ```
4. Sentry sudah terintegrasi di `arch-ai-backend/config/sentry.js`

Alert yang dikonfigurasi otomatis:
- Error rate > 5% per menit
- Unhandled exceptions
- Database connection failures

---

### 2. UptimeRobot — Uptime Monitoring (Gratis)

Setup:
1. Daftar di https://uptimerobot.com
2. Add Monitor → HTTP(s)
3. URL: `https://your-backend.render.com/api/health`
4. Interval: 5 menit
5. Alert contacts: email + Telegram

Target: NFR-REL-001 ≥ 99.5% uptime

---

### 3. Database Backup — NFR-REL-004

Setup backup harian:
```bash
# Di server production atau via cron job
crontab -e
# Tambahkan:
0 2 * * * /app/scripts/backup.sh >> /var/log/arkon-backup.log 2>&1
```

Konfigurasi environment:
```
BACKUP_DIR=/var/backups/arkon
RETENTION_DAYS=30
S3_BUCKET=s3://arkon-backups/daily/  # optional, untuk offsite
```

Test restore bulanan:
```bash
# Jalankan manual setiap bulan untuk verifikasi
./scripts/restore.sh /var/backups/arkon/arkon_backup_YYYYMMDD_HHMMSS.sql.gz postgresql://test_db_url
```

---

### 4. PostgreSQL Metrics

Query monitoring (tambahkan ke crontab atau Grafana):
```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Long running queries (> 30 detik)
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '30 seconds';

-- Table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

### 5. Alert Channels

| Channel | Trigger | Tool |
|---|---|---|
| Email | Downtime > 5 menit | UptimeRobot |
| Telegram | Error rate spike | Sentry |
| Email | Backup failed | Cron job output |
| Dashboard | Real-time errors | Sentry UI |

Setup Telegram bot untuk alert:
1. Buat bot via @BotFather di Telegram
2. Dapatkan bot token + chat ID
3. Set di environment:
   ```
   ALERT_WEBHOOK=https://api.telegram.org/bot<TOKEN>/sendMessage?chat_id=<CHAT_ID>
   ```

---

## Target Metrics (dari Requirements)

| Metric | Target | Monitoring |
|---|---|---|
| Uptime | ≥ 99.5% | UptimeRobot |
| API P95 latency | < 500ms | Sentry Performance |
| Error rate | < 1% | Sentry |
| Backup success | Daily | Cron log |
| DB connections | < 80 active | pg_stat_activity |
