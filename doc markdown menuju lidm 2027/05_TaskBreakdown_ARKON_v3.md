# Task Breakdown
## ARKON v1.0 — Development Roadmap & Sprint Plan
### Target: LIDM Belmawa 2027

---

## 1. EXECUTIVE SUMMARY ROADMAP

Total horizon: **12 bulan** (Juni 2026 — Mei 2027)
4 Phase utama, masing-masing 3 bulan:
- Phase 1: Production Hardening
- Phase 2: Feature Completion & Pilot
- Phase 3: LIDM Differentiators
- Phase 4: Polish & Submission

**Prioritas absolut sebelum LIDM:**
1. Data N-Gain empiris dari pilot nyata (requirement juri)
2. Redis + multi-tenant (stability untuk demo)
3. PDF report export (kebutuhan Persona C — pimpinan akademik)
4. Mobile responsiveness yang layak demo

---

## 2. PHASE 1: Production Hardening
### Durasi: Bulan 1-3 (Juni – Agustus 2026)
**Goal:** Platform stabil, aman, dan siap untuk pilot deployment

---

### Sprint 1.1: Security & Infrastructure (2 minggu)

#### TASK-SEC-001 — Refresh Token Revocation
**Priority:** CRITICAL  
**Effort:** 4-6 jam  
**Why:** Auth system saat ini tidak bisa truly logout user (token masih valid)  
**Steps:**
1. Tambah kolom `refresh_token_hash` dan `token_expires` di tabel `users` (atau tabel baru `user_tokens`)
2. Saat login: simpan hash refresh token ke DB
3. Saat `/api/auth/refresh-token`: verify hash di DB, update dengan hash baru
4. Saat logout: delete record dari DB
5. Update `auth.test.js` untuk cover scenario ini
**Files:** `arch-ai-backend/routes/auth.routes.js`, migrations/003_token_revocation.sql

#### TASK-SEC-002 — File Upload Validation Hardening
**Priority:** HIGH  
**Effort:** 3-4 jam  
**Steps:**
1. Tambah MIME type validation (server-side, bukan hanya ekstensi)
2. Set max file size ke 10MB via Multer config
3. Tambah virus scanning ringan (magic bytes check untuk embedded scripts)
4. Return error yang jelas jika file rejected
**Files:** `arch-ai-backend/config/upload.js`

#### TASK-SEC-003 — Socket.io Per-Event Authorization
**Priority:** HIGH  
**Effort:** 4-6 jam  
**Steps:**
1. Tambah middleware di `socket.service.js` yang verifikasi token saat connect
2. Untuk setiap event yang sensitive (quiz:answer, room:message), verify: user memang member room tersebut
3. Tolak event dari user yang bukan member
**Files:** `arch-ai-backend/services/socket.service.js`

#### TASK-SEC-004 — Secrets Audit & .env Hardening
**Priority:** HIGH  
**Effort:** 2 jam  
**Steps:**
1. Audit .gitignore — pastikan .env tidak pernah tercommit
2. Ganti semua default/weak secrets di .env.example dengan placeholder clear
3. Buat dokumentasi: "required secrets dan cara mendapatkannya"
4. Jika menggunakan Doppler atau Infisical: setup untuk production

---

### Sprint 1.2: Performance & Scalability (2 minggu)

#### TASK-PERF-001 — Redis Integration
**Priority:** CRITICAL  
**Effort:** 8-12 jam  
**Why:** Tanpa Redis, aplikasi tidak bisa scale horizontal; Socket.io kehilangan state jika ada 2 instance  
**Steps:**
1. Install `ioredis` dan `@socket.io/redis-adapter`
2. Setup Redis connection di `config/redis.js`
3. Attach Redis adapter ke Socket.io server:
   ```javascript
   const { createAdapter } = require('@socket.io/redis-adapter');
   io.adapter(createAdapter(pubClient, subClient));
   ```
4. Pindahkan session cache ke Redis (optional untuk phase 1, required untuk scale)
5. Tambah leaderboard caching: cache hasil leaderboard query selama 30 detik
6. Update docker-compose.yml: tambah service `redis: image: redis:7-alpine`
**Files:** `arch-ai-backend/server.js`, `config/redis.js` (baru), `docker-compose.yml`

#### TASK-PERF-002 — 3D Asset Optimization
**Priority:** HIGH  
**Effort:** 8-16 jam (bergantung jumlah model)  
**Steps:**
1. Audit ukuran semua .glb file di `/public/models/`
2. Install `gltf-pipeline`: `npm install -g gltf-pipeline`
3. Batch compress: `gltf-pipeline -i model.glb -o model_compressed.glb --draco.compressionLevel 10`
4. Target: semua model < 5MB, idealnya < 2MB
5. LOD: buat versi _low.glb (50% polygon reduction via Blender atau meshoptimizer) untuk mobile
6. Update komponen Three.js untuk load LOD berdasarkan device pixel ratio / connection type
7. Pindahkan model files ke CDN (Cloudflare R2 atau BunnyCDN)
**Files:** `/public/models/` (semua .glb), `src/components/PcAssembly.jsx`, `src/pages/ArLab.jsx`

#### TASK-PERF-003 — Database Index Addition
**Priority:** MEDIUM  
**Effort:** 1-2 jam  
**Steps:**
1. Buat `migrations/003_indexes.sql` dengan index yang direkomendasikan di SSD §5.2
2. Run EXPLAIN ANALYZE pada 5 query terberat (leaderboard, analytics heatmap, IRT question selection)
3. Tambah index yang missing berdasarkan hasil EXPLAIN
**Files:** `arch-ai-backend/migrations/003_indexes.sql` (baru)

#### TASK-PERF-004 — Frontend Bundle Analysis
**Priority:** MEDIUM  
**Effort:** 3-4 jam  
**Steps:**
1. Install `rollup-plugin-visualizer` ke vite.config.js
2. Run build + analyze: identifikasi chunk terbesar
3. Target: vendor chunk < 500KB gzipped
4. Audit: apakah Three.js ter-import dengan benar (tree-shakeable)
5. Lazy load: pastikan PcAssembly, ArLab, CpuSimulator tidak masuk bundle awal

---

### Sprint 1.3: Core Feature Gaps (2 minggu)

#### TASK-FEAT-001 — PDF Report Export
**Priority:** HIGH (butuh untuk LIDM — bukti N-Gain)  
**Effort:** 12-16 jam  
**Steps:**
1. Install `puppeteer` atau `@react-pdf/renderer`
2. Desain template laporan:
   - Cover: nama kelas, dosen, semester
   - Summary: N-Gain overview, distribusi theta
   - Per-student: theta trajectory, quiz history
3. Endpoint baru: `GET /api/analytics/report/:roomId` → return PDF stream
4. Frontend: tombol "Export Laporan PDF" di AnalyticsDashboard
**Files:** `routes/analytics.routes.js`, `src/components/AnalyticsDashboard.jsx`

#### TASK-FEAT-002 — Theta Progress UI Improvement
**Priority:** HIGH  
**Effort:** 4-6 jam  
**Steps:**
1. Buat mapping theta → level nama:
   ```javascript
   // theta: <-2 = "Pemula", -2 to -1 = "Dasar", -1 to 0 = "Berkembang",
   //         0 to 1 = "Kompeten", 1 to 2 = "Mahir", >2 = "Master"
   ```
2. Buat `TheoProgressCard` component: circular ring + level name + percentile
3. Ganti tampilan raw theta di QuizGame.jsx dan QuizLevelMap.jsx
4. Tambah: "Kamu lebih baik dari X% mahasiswa di kelas ini"
**Files:** `src/components/QuizGame.jsx`, `src/components/QuizLevelMap.jsx`, `src/components/TheoProgressCard.jsx` (baru)

#### TASK-FEAT-003 — Room Archive Feature
**Priority:** MEDIUM  
**Effort:** 4-6 jam  
**Steps:**
1. Tambah kolom `status` (active/archived) di tabel rooms via migration
2. Endpoint: `PATCH /api/rooms/:id/archive`
3. Frontend: tombol archive di RoomSettings.jsx (dosen only)
4. Filter: di LecturerDashboard, default tampilkan hanya active rooms

#### TASK-FEAT-004 — AI Error Graceful Fallback
**Priority:** HIGH  
**Effort:** 3-4 jam  
**Steps:**
1. Wrap semua Gemini calls dalam try-catch yang mengembalikan standardized error response
2. Jika semua model dalam rotation gagal: return `{error: "AI_UNAVAILABLE", message: "..."}`
3. Frontend: detect `AI_UNAVAILABLE` → tampilkan banner "Fitur AI sementara tidak tersedia"
4. Jangan crash, jangan blank screen
**Files:** `routes/ai.routes.js`, `src/pages/ClassroomWorkspace.jsx`

---

## 3. PHASE 2: Feature Completion & Pilot
### Durasi: Bulan 4-6 (September – November 2026)
**Goal:** Deploy ke PT pilot, kumpulkan data N-Gain empiris

---

### Sprint 2.1: Multi-Tenant & Onboarding (2 minggu)

#### TASK-TENANT-001 — Basic Multi-Tenant Support
**Priority:** CRITICAL untuk pilot  
**Effort:** 16-24 jam  
**Steps:**
1. Tentukan strategi: row-level security (RLS) dengan `institution_id` kolom (rekomendasi untuk phase ini)
2. Tambah tabel `institutions` (id, name, domain, created_at)
3. Tambah kolom `institution_id` di tabel `users` via migration
4. Middleware: extract institution context dari JWT atau subdomain
5. Semua query yang relevan: filter by institution_id
6. Daftar endpoint yang perlu diaudit: users, rooms, leaderboard, analytics

#### TASK-TENANT-002 — Institution Admin Panel
**Priority:** HIGH  
**Effort:** 12-16 jam  
**Steps:**
1. Role baru: `admin_institusi`
2. Dashboard admin: daftar semua dosen + mahasiswa di institusi
3. Fitur: invite/remove dosen, lihat aggregate stats institusi
4. Access control: admin_institusi hanya bisa lihat data institusinya sendiri

#### TASK-ONBOARD-001 — Dosen Onboarding Improvements
**Priority:** HIGH  
**Effort:** 6-8 jam  
**Steps:**
1. Wizard "Buat Kelas Pertama" yang guided (step-by-step)
2. Template room: pilih mata kuliah → otomatis seed beberapa soal starter
3. Email welcome dengan quick start guide
4. Video tutorial embed di dashboard (link YouTube)

---

### Sprint 2.2: Content Expansion (2 minggu)

#### TASK-CONTENT-001 — Quiz Bank Expansion
**Priority:** CRITICAL untuk IRT validity  
**Effort:** 40-80 jam (content work)  
**Why:** IRT butuh minimum 30 soal per topik yang di-calibrate untuk estimasi reliable  
**Steps:**
1. Audit `quizzes.json`: hitung soal per topik, identifikasi topik yang < 30 soal
2. Buat spreadsheet template untuk input soal baru
3. Untuk setiap soal baru: tentukan: teks, 4 opsi, jawaban benar, difficulty parameter (b), topik
4. Prioritas topik: CPU Architecture, Memory Hierarchy, ALU, Instruction Set, Cache, I/O, Pipeline
5. Target: ≥ 50 soal per topik, total ≥ 350 soal
6. Calibrate difficulty: soal mudah b = -1.5, sedang b = 0, sulit b = 1.5
7. Import ke quizzes.json dengan format konsisten

#### TASK-CONTENT-002 — Quiz Authoring Interface untuk Dosen
**Priority:** HIGH  
**Effort:** 16-20 jam  
**Steps:**
1. Form: tambah soal baru (teks, 4 opsi, jawaban, difficulty, topik, tags)
2. Preview: tampilkan soal seperti yang dilihat mahasiswa
3. Edit/delete soal existing
4. Bulk import via CSV
5. RBAC: hanya dosen room tersebut yang bisa edit soal bank room-nya

---

### Sprint 2.3: Pilot Deployment & Data Collection (2 minggu + ongoing)

#### TASK-DEPLOY-001 — Production Infrastructure Setup
**Priority:** CRITICAL  
**Effort:** 8-16 jam  
**Steps:**
1. Pilih cloud provider: Railway.app atau Render.com (affordable, simple) atau AWS EC2
2. Setup: PostgreSQL managed, Redis managed
3. Setup: Cloudflare untuk DNS, DDoS protection, CDN untuk static assets
4. Docker Compose production: `docker-compose.prod.yml` (sudah ada template)
5. SSL certificate: Let's Encrypt via Certbot atau Cloudflare
6. Env var management: Doppler atau langsung di provider dashboard
7. Health check monitoring: UptimeRobot (gratis) atau Better Uptime

#### TASK-DEPLOY-002 — CI/CD Pipeline
**Priority:** HIGH  
**Effort:** 4-8 jam  
**Steps:**
1. GitHub Actions workflow: on push to `main` → run tests → build Docker → deploy
2. Test gate: deploy hanya jika semua test pass
3. Staging environment: deploy ke staging URL dulu, manual promote ke production
**Files:** `.github/workflows/deploy.yml` (baru)

#### TASK-PILOT-001 — PT Pilot Onboarding
**Priority:** CRITICAL  
**Effort:** Ongoing (non-technical: coordination)  
**Steps:**
1. Identifikasi dan hubungi 3 PT target pilot
2. Setup akun institusi untuk tiap PT
3. Onboarding workshop dosen: ½ hari
4. Pre-test mahasiswa sebelum mulai menggunakan ARKON (baseline N-Gain)
5. 8 minggu penggunaan aktif (1 semester pendek atau ½ semester)
6. Post-test mahasiswa
7. Export laporan N-Gain dari platform
8. Hitung: pre-test avg, post-test avg, N-Gain score per kelas

---

## 4. PHASE 3: LIDM Differentiators
### Durasi: Bulan 7-9 (Desember 2026 – Februari 2027)
**Goal:** Bangun fitur yang membuat ARKON unik secara teknologis

---

### Sprint 3.1: Adaptive Learning Path (F-016)

#### TASK-ALP-001 — Learning Path Engine
**Priority:** HIGH (differentiator LIDM)  
**Effort:** 20-28 jam  
**Algorithm:**
```
Input:  theta mahasiswa, topik yang sudah dikuasai, topik yang lemah
Output: urutan topik yang direkomendasikan

Logic:
1. Map topik ke prerequisite graph (CPU Basics → ALU → Pipeline)
2. Cek: prerequisite terpenuhi? (theta topik prerequisite > threshold)
3. Rekomendasikan topik berikutnya: yang prerequisite-nya terpenuhi + masih ada gap
4. Update setiap kali theta berubah
```
**Steps:**
1. Buat `prerequisite-graph.js`: definisikan dependency antar topik
2. Backend endpoint: `GET /api/learning-path/:roomId` → return ordered topic recommendations
3. Frontend: `LearningPathPanel.jsx` — visualisasi jalan belajar dengan progress indicator
4. Integrasikan ke ClassroomWorkspace sebagai tab baru

#### TASK-ALP-002 — Personalized Insight Notification
**Priority:** MEDIUM  
**Effort:** 6-8 jam  
**Steps:**
1. Setelah quiz selesai: AI generate insight singkat "Kamu lemah di Memory Addressing. Saran: ulangi modul X"
2. Insight tersimpan per student per session
3. Tampilkan sebagai card di workspace dashboard
4. Weekly digest: dosen dapat email/notif ringkasan progress kelas

---

### Sprint 3.2: Moodle Integration (F-013)

#### TASK-LMS-001 — Moodle OAuth2 SSO
**Priority:** MEDIUM  
**Effort:** 16-24 jam  
**Steps:**
1. Setup Moodle OAuth2 provider di server Moodle (butuh akses admin Moodle)
2. Backend: implement OAuth2 client (`passport-moodle` atau custom)
3. Flow: user klik "Login dengan Moodle" → redirect → authorize → callback → create/link account di ARKON
4. Mapping: NIM dari Moodle → identifier_number di ARKON

#### TASK-LMS-002 — Grade Sync ke Moodle
**Priority:** MEDIUM  
**Effort:** 12-16 jam  
**Steps:**
1. Moodle REST API: `core_grades_update_grades`
2. Backend endpoint: `POST /api/lms/sync-grades/:roomId` → push N-Gain score + theta ke Moodle gradebook
3. Schedule: sync otomatis akhir setiap minggu, atau on-demand dari dosen
4. Log: simpan sync history, tampilkan status di AnalyticsDashboard

---

### Sprint 3.3: Mobile PWA Optimization (F-014)

#### TASK-MOBILE-001 — PWA Service Worker
**Priority:** MEDIUM  
**Effort:** 8-12 jam  
**Steps:**
1. Install `vite-plugin-pwa`
2. Configure: cache strategy untuk static assets, quiz data, 3D models kecil
3. Offline mode: quiz dapat diselesaikan offline, jawaban queued untuk sync
4. Push notification: "Live quiz dimulai oleh [dosen]!" (Web Push API)
5. Add to Home Screen prompt

#### TASK-MOBILE-002 — Mobile UI Audit & Fix
**Priority:** HIGH  
**Effort:** 16-24 jam  
**Steps:**
1. Audit semua halaman di viewport 375px (iPhone SE):
   - RoomHub: pastikan card grid 1-column di mobile
   - PcAssembly: implementasi tap-to-select (ganti drag-drop)
   - CpuSimulator iframe: pastikan responsive
   - LiveQuiz: timer dan soal readable, buttons tappable (min 44px)
2. Bottom navigation bar untuk mahasiswa di mobile
3. Hamburger menu untuk navigasi di mobile
4. Touch-friendly input: no zoom on input focus (font-size ≥ 16px di input)

---

## 5. PHASE 4: Polish & LIDM Submission
### Durasi: Bulan 10-12 (Maret – Mei 2027)
**Goal:** Demo-ready, dokumentasi lengkap, proposal LIDM submitted

---

### Sprint 4.1: UI/UX Polish (2 minggu)

#### TASK-UX-001 — Design System Audit
**Priority:** HIGH  
**Effort:** 8-12 jam  
**Steps:**
1. Audit color contrast semua halaman (tool: axe DevTools atau Lighthouse)
2. Fix accessibility gaps: form labels, aria-live, focus management
3. Ensure consistent spacing, typography, dan component style
4. Dark/Light mode parity check

#### TASK-UX-002 — Onboarding Flow Improvement
**Priority:** HIGH  
**Effort:** 6-8 jam  
**Steps:**
1. Improve OnboardingTour: lebih visual, less text
2. Progress indicator: "Langkah 2 dari 5"
3. Skip option yang jelas
4. "Tour ulang" di settings

#### TASK-UX-003 — Loading Performance Polish
**Priority:** MEDIUM  
**Effort:** 4-6 jam  
**Steps:**
1. Skeleton loading untuk semua view yang delay > 500ms
2. Optimistic UI untuk coin transactions (tampilkan saldo baru sebelum API confirm)
3. Transition animasi halus antar tab (Framer Motion sudah ada di tech stack)

---

### Sprint 4.2: Testing & Stability (2 minggu)

#### TASK-TEST-001 — Integration Test Suite
**Priority:** HIGH  
**Effort:** 16-24 jam  
**Steps:**
1. Install `supertest` dan `jest`
2. Test tiap critical endpoint:
   - POST /auth/register → POST /auth/login → GET /rooms → POST /rooms
   - GET /irt/question → POST /irt/submit → GET /irt/progress
   - POST /gamification/coins → GET /gamification/leaderboard
3. Test: unauthorized access harus return 401/403
4. Test: rate limiting kicks in setelah threshold

#### TASK-TEST-002 — Load Testing
**Priority:** HIGH  
**Effort:** 8-12 jam  
**Steps:**
1. Install k6 (`brew install k6`)
2. Buat scripts:
   - Test 1: 50 concurrent users, GET /workspace (static load)
   - Test 2: 30 concurrent users, POST /irt/submit (DB write load)
   - Test 3: 30 concurrent socket connections, simulate live quiz
3. Run against staging environment
4. Identify bottleneck, fix, re-run
5. Document: hasil load test sebagai evidence di proposal LIDM

#### TASK-TEST-003 — E2E Critical Paths
**Priority:** MEDIUM  
**Effort:** 12-16 jam  
**Steps:**
1. Install Playwright
2. Scenarios:
   - Mahasiswa: Register → Verify Email → Login → Join Room → Complete Quiz → See Theta
   - Dosen: Login → Create Room → Upload Material → Launch Live Quiz → See Analytics
   - Gamification: Earn coin → Buy component → Build PC → Publish to showroom
3. Run di CI/CD pipeline (GitHub Actions)

---

### Sprint 4.3: LIDM Documentation (2 minggu)

#### TASK-DOC-001 — Technical Report (Laporan Teknis)
**Priority:** CRITICAL  
**Effort:** 24-32 jam (writing)  
**Structure (sesuai format ITDP LIDM):**
1. Abstrak (150-200 kata)
2. Latar Belakang: gap lab hardware, non-adaptive assessment, data empiris masalah
3. Tujuan dan Manfaat
4. Metode Pengembangan: ADDIE model atau Agile + formative evaluation
5. Analisa Fungsional: deskripsi tiap fitur + screenshot
6. Desain Produk: arsitektur sistem, ERD, flowchart
7. Rencana Implementasi: pilot results, N-Gain data, deployment plan
8. Video Proses Pengembangan: link YouTube (10-15 menit)
9. Daftar Pustaka: paper IRT Rasch, N-Gain Hake, WebXR, literatur pembelajaran adaptif

#### TASK-DOC-002 — Demo Video Production
**Priority:** CRITICAL  
**Effort:** 16-24 jam  
**Steps:**
1. Script video: 10-15 menit, bahasa Indonesia, subtitle English
2. Scene list:
   - 00:00-01:30 Problem statement + solusi
   - 01:30-04:00 Demo mahasiswa: join → quiz adaptif → AR lab → 3D assembly
   - 04:00-06:00 Demo dosen: create room → live quiz → analytics N-Gain
   - 06:00-08:00 Technical deep dive: IRT, AI integration, gamification
   - 08:00-10:00 Pilot results: before-after N-Gain data, user testimonial
   - 10:00-11:00 SDGs alignment + sustainability plan
3. Record screencast + voiceover
4. Edit: captions, B-roll komputer/mahasiswa, lower thirds untuk nama fitur
5. Upload ke YouTube sebagai unlisted

#### TASK-DOC-003 — Proposal ITDP LIDM
**Priority:** CRITICAL  
**Effort:** 16-20 jam  
**Steps:**
1. Ikuti format persis sesuai `Panduan LIDM 2027` (unduh dari simbelmawa)
2. Gunakan data empiris dari pilot: N-Gain aktual, jumlah user, engagement metrics
3. Sertakan: screenshot antarmuka, diagram arsitektur, tabel perbandingan dengan platform lain
4. Highlight: keunikan IRT Rasch yang real (bukan hanya klaim), 3D/AR yang sebenarnya jalan
5. Budget dan sustainability plan yang realistis

---

## 6. PARALLEL / ONGOING TASKS

Tugas-tugas berikut berjalan paralel di semua phase:

#### TASK-OPS-001 — Monitoring & Alerting Setup
**Priority:** HIGH  
**Steps:**
1. Sentry.io untuk error tracking (gratis tier cukup untuk pilot)
2. UptimeRobot untuk uptime monitoring (free)
3. PostgreSQL metrics: pg_stat_activity monitoring
4. Alert: error rate > 5% per menit → Telegram/email notif

#### TASK-OPS-002 — Regular Backup
**Priority:** HIGH  
**Steps:**
1. Script: `pg_dump` harian ke cloud storage (S3/R2)
2. Retention: 30 hari
3. Test restore: setiap bulan, pastikan backup bisa di-restore

#### TASK-CONTENT-003 — 3D Model Library Expansion
**Priority:** MEDIUM  
**Steps:**
1. Audit: komponen apa yang belum ada model 3D-nya
2. Source: Sketchfab (licensed for education), atau commission model baru
3. Target: 100% komponen di pc-components.js punya model 3D visual

---

## 7. DEPENDENCY MAP

```
TASK-SEC-001 (token revocation)
    └── blocks → TASK-TENANT-001 (multi-tenant uses auth system)

TASK-PERF-001 (Redis)
    └── blocks → TASK-DEPLOY-001 (production deploy assumes Redis)
    └── enables → TASK-DEPLOY-002 (CI/CD more reliable with Redis)

TASK-CONTENT-001 (quiz bank expansion)
    └── blocks → TASK-PILOT-001 (pilot needs valid quiz bank)
    └── enables → FR-IRT-006 (IRT validity)

TASK-DEPLOY-001 (production infra)
    └── blocks → TASK-PILOT-001 (pilot needs deployed app)

TASK-PILOT-001 (pilot deployment + data collection)
    └── blocks → TASK-DOC-001 (technical report needs empirical data)
    └── blocks → TASK-DOC-003 (LIDM proposal needs N-Gain data)

TASK-FEAT-001 (PDF report)
    └── enables → TASK-PILOT-001 (dosen butuh laporan saat pilot)
```

---

## 8. EFFORT SUMMARY

| Phase | Sprint | Story Points (est.) | Waktu Tim (2 dev) |
|---|---|---|---|
| Phase 1 | Security | 25 | 2 minggu |
| Phase 1 | Performance | 30 | 2 minggu |
| Phase 1 | Core Gaps | 35 | 2 minggu |
| Phase 2 | Multi-tenant | 50 | 3 minggu |
| Phase 2 | Content | 60 | 3 minggu (content-heavy) |
| Phase 2 | Pilot | 40 | 3 minggu |
| Phase 3 | Adaptive LP | 45 | 3 minggu |
| Phase 3 | LMS & Mobile | 55 | 3 minggu |
| Phase 4 | Polish | 35 | 2 minggu |
| Phase 4 | Testing | 45 | 2 minggu |
| Phase 4 | Documentation | 60 | 2 minggu |
| **TOTAL** | | **~480 pts** | **~27 minggu** |

**Asumsi tim:** 2 developer aktif, masing-masing 20-25 jam per minggu.
**Buffer:** 3 minggu buffer tersedia di 12 bulan timeline.

---

## 9. CRITICAL PATH (Must complete for LIDM)

```
1. Redis + Security fixes (Phase 1) [Minggu 1-6]
2. Quiz bank expansion ke ≥ 200 soal [Minggu 4-8]
3. Production deploy [Minggu 10]
4. Pilot di minimal 1 PT, 1 kelas, 8 minggu [Minggu 12-20]
5. Collect N-Gain data empiris [Minggu 20]
6. PDF report export [Minggu 14]
7. Load test passed (50 concurrent) [Minggu 22]
8. Technical report draft [Minggu 24]
9. Demo video final [Minggu 26]
10. Proposal LIDM submitted [Minggu 28-30]
```

---

## 10. RISK-ADJUSTED PRIORITIES

Jika resources terbatas (1 developer, part-time), fokus ke ini dalam urutan:

1. **TASK-PERF-001** (Redis) — tanpa ini, demo dengan > 1 server instance crash
2. **TASK-SEC-001** (token revocation) — credibility security di depan juri
3. **TASK-CONTENT-001** (quiz bank) — tanpa ini, IRT claim tidak valid
4. **TASK-DEPLOY-001** (production) — tanpa ini, tidak ada pilot data
5. **TASK-FEAT-001** (PDF report) — juri dan dosen butuh output tangible
6. **TASK-TEST-002** (load testing) — evidence technical untuk proposal
7. **TASK-DOC-001** (technical report) — output langsung untuk LIDM
8. **TASK-DOC-002** (demo video) — required by LIDM format

---

*Task breakdown ini dibuat berdasarkan analisis gap antara state codebase ARKON v2.0 (Mei 2026) dengan requirements LIDM ITDP dan production-grade standard.*
