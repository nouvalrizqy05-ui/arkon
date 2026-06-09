# ARKON v1.0 — Production Deployment Guide
> Deploy ke Render.com (gratis untuk MVP pilot) — estimasi waktu: ~30 menit

---

## Prasyarat

- Akun [Render.com](https://render.com) (gratis)
- Repository di GitHub
- Gemini API key
- Cloudinary account (free tier cukup)
- Resend account (free tier: 3000 email/bulan)

---

## Step 1: Push ke GitHub

```bash
git add .
git commit -m "feat: ARKON v1.0 production-ready"
git push origin main
```

---

## Step 2: Deploy via render.yaml (otomatis)

1. Buka https://render.com → New → Blueprint
2. Pilih repository GitHub ARKON
3. Render akan detect `render.yaml` dan create semua services otomatis:
   - PostgreSQL database
   - Redis
   - Backend API
   - Frontend static site

---

## Step 3: Set Environment Variables

Di Render Dashboard → arkon-backend → Environment:

```
JWT_SECRET          = [generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"]
REFRESH_SECRET      = [generate: same command, different value]
GEMINI_API_KEY      = [dari Google AI Studio]
CLOUDINARY_CLOUD_NAME = [dari Cloudinary Console]
CLOUDINARY_API_KEY  = [dari Cloudinary Console]
CLOUDINARY_API_SECRET = [dari Cloudinary Console]
RESEND_API_KEY      = [dari Resend Dashboard]
EMAIL_FROM          = noreply@yourdomain.com
ALLOWED_ORIGINS     = https://arkon-frontend.onrender.com
FRONTEND_URL        = https://arkon-frontend.onrender.com
NODE_ENV            = production
```

DB_URL dan REDIS_URL akan ter-set otomatis dari render.yaml linkage.

---

## Step 4: Run Database Migrations

Di Render → arkon-backend → Shell:

```bash
# Jalankan semua migration secara berurutan
for f in migrations/00*.sql migrations/0[0-9]*.sql; do
  echo "Running $f..."
  psql "$DB_URL" -f "$f"
done
```

---

## Step 5: Verify Deployment

```bash
# Health check
curl https://arkon-backend.onrender.com/api/health

# Expected response:
{
  "status": "healthy",
  "database": { "status": "connected" },
  "redis": { "status": "connected" },
  "gemini": { "status": "available" }
}
```

---

## Step 6: Load Testing (sebelum pilot)

```bash
# Install k6
brew install k6  # macOS
# atau: apt install k6  # Ubuntu

# Run load test
k6 run -e BASE_URL=https://arkon-backend.onrender.com load-tests/live-quiz-load-test.js

# Target:
# ✅ P95 Latency < 200ms
# ✅ Error Rate < 1%
```

---

## Estimasi Biaya (Render.com)

| Service | Plan | Biaya/bulan |
|---|---|---|
| Backend API | Starter | $7 |
| PostgreSQL | Starter | $7 |
| Redis | Starter | $10 |
| Frontend | Static | Gratis |
| **Total** | | **~$24/bulan** |

*Render free tier: backend spin-down setelah 15 menit idle — gunakan Starter untuk pilot agar tidak spin-down saat demo*

---

## Monitoring Post-Deploy

Cek di Render Dashboard:
- Logs: Real-time log streaming
- Metrics: CPU, Memory, Request count
- Health: Auto-restart jika health check gagal

Untuk produksi penuh, pertimbangkan menambahkan:
- [Sentry](https://sentry.io) untuk error tracking (free tier tersedia)
- [UptimeRobot](https://uptimerobot.com) untuk uptime monitoring (gratis)
