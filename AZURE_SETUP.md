# ARKON — Panduan Deploy ke Azure for Students
## Pengganti Manual #1 dari roadmap 100/100

> Panduan ini menggantikan bagian Render.com dari dokumen ARKON_Manual_Setup.md
> Semua langkah menggunakan Azure for Students (kredit $100/tahun, tidak butuh kartu kredit)

---

## Layanan Azure yang Dibutuhkan

| Layanan | Azure Service | Kredit Estimasi |
|---|---|---|
| Backend API | App Service (B1 Free tier) | Gratis 1 tahun |
| Frontend React | Static Web Apps | **Gratis selamanya** |
| Database | Azure Database for PostgreSQL - Flexible Server | ~$13/bulan (pakai kredit) |
| Redis | Azure Cache for Redis (C0 Basic) | ~$13/bulan (pakai kredit) |
| **Total** | | **~$26/bulan** dari kredit $100 |

---

## TAHAP 1: Buat Resource Group

Resource group = "folder" di Azure yang menampung semua service ARKON.

1. Buka https://portal.azure.com → login dengan akun student
2. Cari "Resource groups" di search bar atas
3. Klik **+ Create**
4. Isi:
   - **Subscription**: Azure for Students
   - **Resource group name**: `arkon-production`
   - **Region**: Southeast Asia (Singapore — paling dekat Indonesia)
5. Klik **Review + create** → **Create**

---

## TAHAP 2: Buat PostgreSQL Flexible Server

1. Di portal Azure, cari **"Azure Database for PostgreSQL flexible servers"**
2. Klik **+ Create**
3. Isi tab **Basics**:
   - **Resource group**: `arkon-production`
   - **Server name**: `arkon-postgres` (ini jadi bagian URL koneksi)
   - **Region**: Southeast Asia
   - **PostgreSQL version**: 16
   - **Workload type**: Development (lebih murah)
   - **Compute + storage**: klik **Configure server** → pilih **Burstable, B1ms** (paling murah)
   - **Authentication**: PostgreSQL authentication only
   - **Admin username**: `arkonadmin`
   - **Password**: buat password kuat, simpan di Notepad
4. Klik tab **Networking**:
   - **Connectivity method**: Public access
   - Centang **Allow public access from any Azure service within Azure to this server**
   - Klik **+ Add current client IP address** (agar Anda bisa akses dari komputer)
5. Klik **Review + create** → **Create**
6. Tunggu ~5 menit sampai deployment selesai

**Catat Connection String:**
Setelah selesai → buka resource → klik **Connect** di sidebar kiri → pilih **Node.js**
Salin connection string, formatnya:
```
postgresql://arkonadmin:<password>@arkon-postgres.postgres.database.azure.com:5432/postgres?sslmode=require
```

---

## TAHAP 3: Buat Azure Cache for Redis

1. Di portal Azure, cari **"Azure Cache for Redis"**
2. Klik **+ Create**
3. Isi:
   - **Resource group**: `arkon-production`
   - **DNS name**: `arkon-redis` (akan jadi `arkon-redis.redis.cache.windows.net`)
   - **Location**: Southeast Asia
   - **Cache SKU**: **Basic C0** (paling murah, cukup untuk development/pilot)
   - **Cache size**: 250MB
4. Klik **Review + create** → **Create**
5. Tunggu ~5 menit

**Catat Redis Connection String:**
Setelah selesai → buka resource → klik **Access keys** di sidebar kiri
Salin **Primary connection string**, formatnya:
```
arkon-redis.redis.cache.windows.net:6380,password=<primary_key>,ssl=True,abortConnect=False
```

⚠️ **Format untuk kode Node.js (ioredis):**
```
rediss://:<primary_key>@arkon-redis.redis.cache.windows.net:6380
```
Perhatikan `rediss://` (double-s = TLS) dan `:` sebelum password.

---

## TAHAP 4: Buat App Service untuk Backend

1. Di portal Azure, cari **"App Services"**
2. Klik **+ Create** → **Web App**
3. Isi tab **Basics**:
   - **Resource group**: `arkon-production`
   - **Name**: `arkon-backend` (URL: `arkon-backend.azurewebsites.net`)
   - **Publish**: Code
   - **Runtime stack**: Node 20 LTS
   - **Operating System**: Linux
   - **Region**: Southeast Asia
   - **Pricing plan**: B1 (Basic, ~$13/bulan, gratis 1 tahun untuk students)
4. Klik **Review + create** → **Create**

---

## TAHAP 5: Konfigurasi Environment Variables di App Service

1. Buka App Service `arkon-backend`
2. Klik **Configuration** di sidebar kiri → tab **Application settings**
3. Klik **+ New application setting** untuk setiap variabel berikut:

| Name | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `DATABASE_URL` | (connection string dari Tahap 2) |
| `REDIS_URL` | `rediss://:<primary_key>@arkon-redis.redis.cache.windows.net:6380` |
| `JWT_SECRET` | (jalankan: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`) |
| `REFRESH_SECRET` | (jalankan lagi command yang sama, nilai berbeda) |
| `GEMINI_API_KEY` | (dari https://aistudio.google.com/app/apikey) |
| `CLOUDINARY_CLOUD_NAME` | (dari cloudinary.com dashboard) |
| `CLOUDINARY_API_KEY` | (dari cloudinary.com dashboard) |
| `CLOUDINARY_API_SECRET` | (dari cloudinary.com dashboard) |
| `RESEND_API_KEY` | (dari resend.com) |
| `EMAIL_FROM` | `noreply@arkon.dev` |
| `ENABLE_EMAIL_VERIFICATION` | `false` |
| `ALLOWED_ORIGINS` | (isi setelah frontend dibuat, contoh: `https://arkon.azurestaticapps.net`) |
| `FRONTEND_URL` | (sama dengan ALLOWED_ORIGINS) |

4. Klik **Save** → **Continue**
5. App Service akan restart otomatis

---

## TAHAP 6: Deploy Backend via GitHub Actions

Konfigurasi GitHub Actions sudah ada di `.github/workflows/azure-deploy.yml`.

Yang perlu Anda lakukan:

**A. Dapatkan Publish Profile:**
1. Di App Service `arkon-backend` → klik **Get publish profile** (tombol di toolbar atas)
2. Akan download file `.PublishSettings`
3. Buka file dengan text editor → salin seluruh isinya (format XML)

**B. Tambah GitHub Secret:**
1. Buka GitHub repository ARKON
2. Settings → Secrets and variables → Actions → **New repository secret**
3. Tambahkan:

| Secret Name | Value |
|---|---|
| `AZURE_WEBAPP_PUBLISH_PROFILE_BACKEND` | (isi XML dari Publish Profile) |
| `AZURE_BACKEND_URL` | `https://arkon-backend.azurewebsites.net` |

**C. Trigger Deploy:**
Setiap push ke branch `main` akan otomatis trigger deployment.
Atau manual: GitHub → Actions → "ARKON Azure Deployment" → **Run workflow**

---

## TAHAP 7: Deploy Frontend ke Azure Static Web Apps

Azure Static Web Apps adalah cara terbaik deploy React — **gratis selamanya**, CDN global.

1. Di portal Azure, cari **"Static Web Apps"**
2. Klik **+ Create**
3. Isi:
   - **Resource group**: `arkon-production`
   - **Name**: `arkon-frontend`
   - **Plan type**: Free
   - **Region**: East Asia (untuk CDN, bukan hosting)
   - **Source**: GitHub
   - Klik **Sign in with GitHub** → authorize → pilih repo ARKON
   - **Branch**: main
   - **Build presets**: React
   - **App location**: `/` (root folder)
   - **Output location**: `dist`
4. Klik **Review + create** → **Create**

Azure akan otomatis:
- Membuat GitHub Action baru di repo Anda untuk deploy Static Web Apps
- Set `AZURE_STATIC_WEB_APPS_API_TOKEN` sebagai GitHub Secret otomatis

**Tambahkan VITE_API_URL ke Static Web Apps:**
1. Buka Static Web Apps `arkon-frontend`
2. Configuration → **+ Add** → tambahkan:
   - Name: `VITE_API_URL`
   - Value: `https://arkon-backend.azurewebsites.net`
3. Save

---

## TAHAP 8: Jalankan Database Migration

1. Buka App Service `arkon-backend`
2. Klik **SSH** di sidebar kiri (atau gunakan **Console**)
3. Jalankan:
```bash
cd /home/site/wwwroot
node run_migration.js
```
Output yang diharapkan: semua migration applied successfully.

Jika SSH tidak tersedia, gunakan **Kudu** (https://arkon-backend.scm.azurewebsites.net):
- Klik Debug console → CMD
- Navigasi ke site/wwwroot: `cd /home/site/wwwroot`
- Jalankan migration

---

## TAHAP 9: Update ALLOWED_ORIGINS

Setelah frontend berhasil deploy:
1. Catat URL frontend Static Web Apps (contoh: `https://wonderful-meadow-1234.azurestaticapps.net`)
2. Kembali ke App Service `arkon-backend` → Configuration
3. Update `ALLOWED_ORIGINS` dengan URL frontend tersebut
4. Update `FRONTEND_URL` dengan URL yang sama
5. Save → restart

---

## TAHAP 10: Verifikasi

```
Test 1 — Backend health:
GET https://arkon-backend.azurewebsites.net/api/health
→ { "status": "healthy", "redis": { "status": "connected" }, ... }

Test 2 — Frontend:
Buka https://wonderful-meadow-1234.azurestaticapps.net
→ Halaman login ARKON muncul

Test 3 — Register:
Daftar akun → login → masuk workspace
→ Berhasil masuk tanpa error
```

---

## Troubleshooting Umum

**Backend error "SSL required" di PostgreSQL:**
Pastikan connection string mengandung `?sslmode=require` atau `ssl=true`.
File `config/db.js` sudah diupdate untuk Azure — pastikan menggunakan versi terbaru.

**Redis connection refused:**
- Pastikan URL menggunakan `rediss://` (double-s, bukan `redis://`)
- Port Azure Redis adalah 6380 (TLS), bukan 6379
- Cek di Azure Portal → Cache for Redis → Access keys untuk URL yang benar

**Socket.io disconnect/reconnect terus:**
Azure App Service punya ARR (Application Request Routing). Aktifkan sticky session:
1. App Service → Configuration → General settings
2. **ARR Affinity**: On
3. Save

**Frontend tidak bisa konek ke backend (CORS error):**
Pastikan ALLOWED_ORIGINS di App Service settings sudah diisi dengan URL frontend yang tepat (tanpa trailing slash).

**Build frontend gagal di GitHub Actions:**
Pastikan secret `AZURE_BACKEND_URL` sudah diisi. Format: `https://arkon-backend.azurewebsites.net`

---

## Setelah Deploy Berhasil: Langkah Selanjutnya

Kembali ke roadmap Manual #2, #3, #4 di dokumen ARKON_Manual_Setup.md untuk:
- Optimasi 3D model
- Mulai pilot
- Technical report + demo video
