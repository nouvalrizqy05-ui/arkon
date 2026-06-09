# System Requirements Document
## ARKON v1.0 — Functional & Non-Functional Requirements Specification

---

## 1. DOCUMENT SCOPE

Dokumen ini mendefinisikan seluruh kebutuhan sistem ARKON v1.0 secara terstruktur, mencakup:
- Functional Requirements (FR): apa yang harus dilakukan sistem
- Non-Functional Requirements (NFR): bagaimana sistem harus berperilaku
- Constraints: batasan teknis dan bisnis yang tidak bisa dinegosiasi
- Assumptions: asumsi yang mendasari spesifikasi

Status per requirement diberi label: `[DONE]` (sudah ada di codebase), `[PARTIAL]` (sebagian ada), `[TODO]` (belum ada).

---

## 2. FUNCTIONAL REQUIREMENTS

### 2.1 Authentication & User Management

**FR-AUTH-001** `[DONE]`
Sistem harus mengizinkan pengguna baru mendaftar dengan: nama lengkap, nomor identitas (NIM/NIP), email, password, dan role (mahasiswa/dosen).

**FR-AUTH-002** `[DONE]`
Sistem harus melakukan verifikasi email sebelum akun dapat digunakan. Token verifikasi harus expire dalam 24 jam.

**FR-AUTH-003** `[DONE]`
Sistem harus mengizinkan login dengan nomor identitas + password dan mengembalikan access token (JWT) + refresh token.

**FR-AUTH-004** `[DONE]`
Access token harus expire dalam waktu yang dikonfigurasi. Refresh token harus dapat digunakan untuk mendapatkan access token baru.

**FR-AUTH-005** `[DONE]`
Sistem harus menyediakan mekanisme reset password via email (forgot password → email link → reset form).

**FR-AUTH-006** `[TODO]`
Sistem harus invalidate semua refresh token milik user saat logout (token revocation). *Saat ini hanya rotation tanpa revocation.*

**FR-AUTH-007** `[TODO]`
Sistem harus mendukung Single Sign-On (SSO) via OAuth2 dengan provider institusi (Moodle/SISTER). *(roadmap)*

---

### 2.2 Room Management

**FR-ROOM-001** `[DONE]`
Dosen dapat membuat "Room" (kelas virtual) dengan: nama mata kuliah, kode unik auto-generate, dan konfigurasi awal.

**FR-ROOM-002** `[DONE]`
Mahasiswa dapat bergabung ke room dengan memasukkan kode room yang valid dan belum expired.

**FR-ROOM-003** `[DONE]`
Dosen dapat mengkonfigurasi room: safe mode (disable simulasi saat ujian), collab mode (isolation/collaborative), double coins event, max_members.

**FR-ROOM-004** `[DONE]`
Dosen dapat melihat daftar semua anggota room beserta status (online/offline) dan statistik ringkas.

**FR-ROOM-005** `[DONE]`
Dosen dapat mengupload materi (PDF) ke room. Mahasiswa di room tersebut dapat mengakses materi yang diupload.

**FR-ROOM-006** `[PARTIAL]`
Dosen dapat membuat invite link sekunder (selain room_code utama) untuk grup/gelombang tertentu. *(invite_code ada di schema, belum UI)*

**FR-ROOM-007** `[TODO]`
Dosen dapat menonaktifkan atau mengarsipkan room. Data analytics tetap tersimpan, mahasiswa tidak bisa mengakses fitur aktif.

---

### 2.3 Adaptive Assessment (IRT)

**FR-IRT-001** `[DONE]`
Sistem harus menghitung estimasi kemampuan (theta) mahasiswa menggunakan Rasch Model 1PL dengan Newton-Raphson MLE.

**FR-IRT-002** `[DONE]`
Sistem harus memilih soal berikutnya berdasarkan Maximum Information Function relatif terhadap theta saat ini. Soal yang sudah dijawab tidak boleh diulang dalam sesi yang sama.

**FR-IRT-003** `[DONE]`
Theta mahasiswa harus tersimpan per room di tabel `student_ability` dan persisten antar sesi.

**FR-IRT-004** `[DONE]`
Sistem harus memberikan reward koin setelah jawaban dikirim. Besaran koin harus bervariasi berdasarkan difficulty soal dan ketepatan jawaban.

**FR-IRT-005** `[PARTIAL]`
Sistem harus menampilkan progress theta kepada mahasiswa dalam format yang dapat dipahami (bukan angka mentah). *Backend ada, frontend masih tampil angka theta.*

**FR-IRT-006** `[TODO]`
Sistem harus memiliki minimum 30 soal valid per topik sebelum IRT dapat memberikan estimasi reliable. Sistem harus memberi warning jika bank soal di bawah threshold.

**FR-IRT-007** `[TODO]`
Dosen harus dapat menetapkan parameter difficulty (b) untuk setiap soal melalui interface authoring. *Saat ini b ditetapkan di data statis.*

---

### 2.4 Live Quiz

**FR-LIVE-001** `[DONE]`
Dosen dapat membuat sesi live quiz dengan memilih soal dari bank dan mengatur durasi per soal.

**FR-LIVE-002** `[DONE]`
Sistem harus menggunakan WebSocket (Socket.io) untuk distribusi soal dan pengumpulan jawaban secara real-time.

**FR-LIVE-003** `[DONE]`
Skor mahasiswa di live quiz harus memperhitungkan ketepatan jawaban DAN kecepatan menjawab (answer_time_ms).

**FR-LIVE-004** `[DONE]`
Leaderboard harus diupdate secara real-time setelah setiap soal reveal.

**FR-LIVE-005** `[DONE]`
Dosen dapat mengontrol pace: kapan soal berikutnya ditampilkan, kapan jawaban direveal.

**FR-LIVE-006** `[PARTIAL]`
Boss Raid mode: satu soal sangat sulit ditampilkan ke seluruh kelas, mahasiswa menjawab bersama-sama, skor kolektif dihitung. *BossRaid.jsx ada, perlu validasi backend integration.*

**FR-LIVE-007** `[TODO]`
Sistem harus menyimpan hasil live quiz ke analytics sehingga dapat digunakan untuk kalkulasi N-Gain.

### 2.5 Adaptive Learning Path (ALP)

**FR-ALP-001** `[TODO]`
Sistem harus menyediakan mesin rekomendasi jalur belajar (Learning Path Engine) yang menyusun urutan materi/topik optimal untuk mahasiswa berdasarkan theta dan riwayat kinerjanya.

**FR-ALP-002** `[TODO]`
Sistem harus menggunakan AI untuk memberikan insight personal ("Personalized Insight") secara berkala (misal, setelah kuis atau secara mingguan) tentang kelemahan topik dan strategi perbaikan spesifik.

---

### 2.6 Gamification System

**FR-GAME-001** `[DONE]`
Sistem harus memiliki mata uang virtual (koin) yang dapat diperoleh dari: quiz benar, live quiz skor tinggi, daily login streak, achievement unlock.

**FR-GAME-002** `[DONE]`
Koin harus tersimpan dalam tabel `coin_transactions` dengan alasan transaksi tercatat. Saldo koin di tabel `users`.

**FR-GAME-003** `[DONE]`
Sistem harus mendukung daily login bonus dengan streak multiplier. Streak hilang jika skip 1 hari.

**FR-GAME-004** `[DONE]`
Sistem harus mendukung minimal 20 tipe achievement badge yang dapat di-unlock berdasarkan kondisi tertentu.

**FR-GAME-005** `[DONE]`
Mahasiswa dapat membeli komponen PC virtual di PC Shop menggunakan koin. Setiap komponen memiliki harga dan kategori.

**FR-GAME-006** `[DONE]`
Mahasiswa dapat merakit PC dari komponen yang dimiliki di 3D Assembly Workshop.

**FR-GAME-007** `[DONE]`
Hasil build PC harus divalidasi kompatibilitas (CPU socket, RAM type, PSU wattage) dan diberikan benchmark score.

**FR-GAME-008** `[DONE]`
Build PC dapat dipublikasi ke Showroom kelas dan mendapat reaksi (react) + komentar dari mahasiswa lain.

**FR-GAME-009** `[DONE]`
Tournament single elimination dapat dibuat dosen, dengan bracket otomatis, match berbasis quiz soal.

**FR-GAME-010** `[DONE]`
Leaderboard global lintas room, diperbarui setelah setiap transaksi koin.

**FR-GAME-011** `[PARTIAL]`
Season system: pemenang per "musim" dicatat di `season_winners`. *Schema ada, UI masih minimal.*

**FR-GAME-012** `[TODO]`
Rate limiting ketat untuk coin farming: sistem harus deteksi dan prevent abuse (menjawab salah berulang untuk mendapat koin dari correct answer saja, dll.).

---

### 2.6 3D & AR Features

**FR-3D-001** `[DONE]`
Sistem harus menampilkan model 3D komponen PC (CPU, GPU, RAM, motherboard, PSU, cooler, case) dalam format GLB/GLTF menggunakan Three.js.

**FR-3D-002** `[DONE]`
Drag-and-drop komponen ke slot yang benar pada canvas 3D. Validasi real-time terhadap kompatibilitas.

**FR-3D-003** `[DONE]`
AR Lab menggunakan WebXR / Google Model Viewer untuk menampilkan model 3D dalam augmented reality via kamera perangkat.

**FR-3D-004** `[DONE]`
CPU Visual Simulator menampilkan siklus fetch-decode-execute dengan visualisasi datapath interaktif.

**FR-3D-005** `[TODO]`
3D model harus tersedia dalam beberapa level of detail (LOD) untuk mendukung perangkat low-end.

**FR-3D-006** `[TODO]`
Fallback statis (gambar/ilustrasi) harus tersedia untuk perangkat yang tidak mendukung WebGL atau WebXR.

---

### 2.7 AI-Powered Features

**FR-AI-001** `[DONE]`
Dosen dapat mengupload materi PDF dan sistem AI menghasilkan kumpulan soal quiz otomatis dari materi tersebut.

**FR-AI-002** `[DONE]`
AI memberikan feedback personal kepada mahasiswa berdasarkan skor quiz dan topik lemah.

**FR-AI-003** `[DONE]`
AI dapat menghitung dan menginterpretasikan N-Gain dari data pre-test dan post-test yang diberikan.

**FR-AI-004** `[DONE]`
AI assistant dapat menjawab pertanyaan mahasiswa dalam konteks materi yang diupload ke room.

**FR-AI-005** `[DONE]`
Sistem harus menerapkan model rotation dan retry logic jika Gemini API mengembalikan error rate limit.

**FR-AI-006** `[DONE]`
Respons AI harus di-cache per (file_path, feature_type) untuk menghindari panggilan redundan.

**FR-AI-007** `[TODO]`
Sistem harus menyediakan fallback graceful: jika semua model AI gagal, fitur AI disabled sementara dengan notifikasi ke user, bukan crash.

---

### 2.8 Analytics & Reporting

**FR-ANALYTICS-001** `[DONE]`
Dosen dapat melihat heatmap pemahaman per topik untuk seluruh kelas (HeatMapPanel.jsx).

**FR-ANALYTICS-002** `[DONE]`
Sistem menghitung N-Gain menggunakan formula Hake: `g = (post - pre) / (100 - pre)` dan mengklasifikasikan: tinggi (≥0.7), sedang (0.3-0.7), rendah (<0.3).

**FR-ANALYTICS-003** `[DONE]`
Dosen dapat melihat analytics individual mahasiswa: theta trajectory, activity log, skor per topik.

**FR-ANALYTICS-004** `[PARTIAL]`
Sistem harus menyediakan export laporan dalam format PDF. *ngain.service.js ada, PDF export belum.*

**FR-ANALYTICS-005** `[TODO]`
Laporan harus memuat: distribusi theta kelas, N-Gain per topik, top 10 soal paling sulit, mahasiswa berisiko (theta rendah + activity rendah).

---

### 2.9 Collaboration Features

**FR-COLLAB-001** `[DONE]`
Mahasiswa dapat membuat atau bergabung ke study group di dalam room.

**FR-COLLAB-002** `[DONE]`
Study group memiliki shared collaborative notes yang dapat diedit oleh semua anggota.

**FR-COLLAB-003** `[DONE]`
Study group memiliki chat room internal dengan pesan yang persisten.

**FR-COLLAB-004** `[DONE]`
Mahasiswa dapat mengupload hasil kerja (student_work) untuk dosen review.

**FR-COLLAB-005** `[TODO]`
Collaborative CPU Simulator: dua mahasiswa dapat menjalankan simulator secara sinkron (shared state via Socket.io). *(F-017 dari PRD)*

---

### 2.10 LMS & Mobile Integration

**FR-LMS-001** `[TODO]`
Sistem harus mampu menyinkronkan (Grade Sync) data penilaian (seperti theta akhir dan N-Gain) ke LMS eksternal (misal: Moodle) secara aman.

**FR-MOB-001** `[TODO]`
Aplikasi frontend harus dikonfigurasi sebagai Progressive Web App (PWA) dengan Service Worker untuk caching asset (offline-first capability).

**FR-MOB-002** `[TODO]`
Aplikasi frontend harus memberikan pengalaman User Interface (UI) yang optimal dan responsif khusus untuk perangkat mobile (Mobile UI), dengan navigasi bawah (bottom sheet/nav) dan layar penuh (full-screen) untuk 3D/AR.

---

## 3. NON-FUNCTIONAL REQUIREMENTS

### 3.1 Performance Requirements

**NFR-PERF-001** `[TODO — test required]`
Halaman utama (workspace) harus mencapai First Contentful Paint (FCP) < 2 detik pada koneksi 4G (minimum 10 Mbps).

**NFR-PERF-002** `[TODO]`
3D model standar (≤ 5MB per file setelah optimasi) harus selesai loading dalam < 3 detik pada 4G.

**NFR-PERF-003** `[TODO — test required]`
API response time untuk endpoint non-AI harus < 500ms pada percentile ke-95 saat 100 concurrent users.

**NFR-PERF-004** `[TODO — test required]`
Socket.io event (quiz question broadcast, leaderboard update) harus memiliki latency < 200ms pada 50 concurrent users dalam satu room.

**NFR-PERF-005** `[TODO]`
Aplikasi harus mendukung minimum 500 concurrent users tanpa degradasi signifikan.

### 3.2 Reliability Requirements

**NFR-REL-001** `[PARTIAL]`
Sistem harus memiliki uptime ≥ 99.5% (monthly). Health check endpoint sudah ada di `/api/health`. Monitoring belum terpasang.

**NFR-REL-002** `[DONE]`
Jika layanan AI (Gemini) tidak tersedia, fitur core (quiz, simulator, room) harus tetap berfungsi normal.

**NFR-REL-003** `[DONE]`
Frontend harus memiliki Error Boundary untuk mencegah full app crash akibat error komponen tertentu.

**NFR-REL-004** `[TODO]`
Sistem harus memiliki database backup otomatis minimal sekali per hari dengan retention 30 hari.

**NFR-REL-005** `[TODO]`
Sistem harus memiliki monitoring dan alerting: error rate spike, latency anomaly, database connection failure.

### 3.3 Security Requirements

**NFR-SEC-001** `[DONE]`
Semua komunikasi antara client dan server harus menggunakan HTTPS/TLS.

**NFR-SEC-002** `[DONE]`
Password harus di-hash menggunakan bcrypt dengan minimum 12 rounds.

**NFR-SEC-003** `[DONE]`
Seluruh query database harus menggunakan parameterized queries. Zero string concatenation untuk SQL.

**NFR-SEC-004** `[DONE]`
Endpoint kritis (coin, AI) harus menerapkan rate limiting.

**NFR-SEC-005** `[DONE]`
Akses ke data harus divalidasi server-side berdasarkan kepemilikan (ownership) dan role.

**NFR-SEC-006** `[TODO]`
File upload harus divalidasi: tipe file (PDF only untuk materi), ukuran maksimum (10MB), dan di-scan untuk konten berbahaya.

**NFR-SEC-007** `[TODO]`
Sistem harus memiliki audit log untuk aksi sensitif: pembuatan room, penghapusan data, perubahan role.

**NFR-SEC-008** `[TODO]`
Refresh token harus dapat di-revoke (stored in DB, checked on use).

### 3.4 Scalability Requirements

**NFR-SCALE-001** `[PARTIAL]`
Backend harus stateless untuk mendukung horizontal scaling. *Saat ini Socket.io menggunakan in-memory, butuh Redis adapter untuk multi-instance.*

**NFR-SCALE-002** `[TODO]`
Redis harus digunakan untuk: session management, Socket.io state, dan caching query berat (leaderboard).

**NFR-SCALE-003** `[TODO]`
Database harus mendukung read replica untuk memisahkan load query analytics dari query transaksional.

**NFR-SCALE-004** `[TODO]`
3D model files harus di-serve via CDN (bukan langsung dari server Express).

### 3.5 Maintainability Requirements

**NFR-MAINT-001** `[PARTIAL]`
Backend test coverage harus ≥ 70% untuk service layer. *Unit tests sudah ada untuk IRT, N-Gain, Auth. Integration tests belum ada.*

**NFR-MAINT-002** `[TODO]`
Frontend harus memiliki E2E test coverage untuk critical paths (login, join room, complete quiz).

**NFR-MAINT-003** `[DONE]`
Codebase harus menggunakan Docker untuk environment consistency antara development dan production.

**NFR-MAINT-004** `[TODO]`
Setiap API endpoint harus terdokumentasi (OpenAPI/Swagger atau README yang lengkap).

**NFR-MAINT-005** `[PARTIAL]`
Migrasi database harus menggunakan file SQL terurut (`000_init.sql`, `001_room_rebuild.sql`, dst.). *Sudah ada pattern, tapi tidak ada automated migration runner yang terintegrasi CI.*

### 3.6 Accessibility Requirements

**NFR-A11Y-001** `[PARTIAL]`
Aplikasi harus memenuhi WCAG 2.1 Level AA. *Skip-to-content sudah ada. Audit menyeluruh belum dilakukan.*

**NFR-A11Y-002** `[TODO]`
Semua form input harus memiliki label yang benar (bukan hanya placeholder).

**NFR-A11Y-003** `[TODO]`
Live quiz timer harus menggunakan aria-live="polite" untuk screen reader.

**NFR-A11Y-004** `[TODO]`
Color contrast ratio harus memenuhi WCAG AA minimum: 4.5:1 untuk normal text, 3:1 untuk large text.

### 3.7 Compatibility Requirements

**NFR-COMPAT-001**
Browser support minimum: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+.

**NFR-COMPAT-002**
AR Lab (WebXR) hanya supported di Chrome mobile/Android dengan ARCore, dan Safari iOS 16+ dengan WebXR. Fallback static view untuk browser lain.

**NFR-COMPAT-003**
Aplikasi harus responsif dan dapat digunakan pada layar minimum 360px lebar.

---

## 4. CONSTRAINTS

### 4.1 Technical Constraints

| Constraint | Detail |
|---|---|
| Runtime | Node.js 18+ (LTS), React 18 |
| Database | PostgreSQL 14+ |
| AI | Google Gemini API — bukan open source model; ada quota limit |
| 3D engine | Three.js r128+ untuk kompatibilitas WebGL |
| WebXR | Tidak semua device mendukung; fallback wajib ada |

### 4.2 Business Constraints

| Constraint | Detail |
|---|---|
| Lisensi | MIT License — semua komponen utama harus compatible |
| Data residency | Data mahasiswa harus tersimpan di server Indonesia atau compliant Kemendikbud |
| Open source | Untuk LIDM, codebase mungkin perlu bisa diakses publik atau juri |

### 4.3 LIDM-Specific Constraints

| Constraint | Detail |
|---|---|
| Orisinalitas | Seluruh kode harus karya tim sendiri, AI boleh digunakan tapi wajib dikreditkan |
| Dokumentasi AI | Penggunaan Generative AI harus dijelaskan sesuai panduan Belmawa |
| Pilot data | Harus ada data empiris (N-Gain aktual) dari minimal satu PT pilot |

---

## 5. ASSUMPTIONS

**A-001:** Pengguna memiliki akses internet minimum 4G/LTE untuk menggunakan fitur 3D dan AR.

**A-002:** Institusi menggunakan sistem identifikasi mahasiswa (NIM) yang unik dan konsisten.

**A-003:** Dosen telah memiliki materi ajar dalam format PDF yang dapat diupload.

**A-004:** Browser mahasiswa mendukung WebGL minimal versi 2.0 untuk fitur 3D.

**A-005:** Gemini API akan tersedia selama demo LIDM (bukan diasumsikan stabil tanpa fallback).

**A-006:** Server production di-deploy di cloud dengan uptime SLA ≥ 99.9% dari provider.

---

## 6. REQUIREMENT TRACEABILITY MATRIX

| Requirement | Feature di PRD | Component | Test Coverage |
|---|---|---|---|
| FR-IRT-001/002 | F-002 | irt.service.js | irt.service.test.js ✅ |
| FR-GAME-001/002 | F-007 | gamification.routes.js | gamification.test.js ✅ |
| FR-AI-001-006 | F-008 | ai.routes.js | ❌ tidak ada test |
| FR-LIVE-001-005 | F-006 | socket.service.js, live-quiz.routes.js | ❌ tidak ada test |
| FR-3D-001-004 | F-003/004/005 | PcAssembly, ArLab, CpuSimulator | ❌ tidak ada test |
| FR-ANALYTICS-001-003 | F-009 | analytics.routes.js, ngain.service.js | ngain.service.test.js ✅ |
| FR-AUTH-001-005 | (core) | auth.routes.js | auth.test.js ✅ |

**Gap yang teridentifikasi:**
- AI routes: zero test coverage — kritis karena failure modes banyak
- Socket.io: zero test coverage — kritis karena real-time, banyak edge case
- Frontend: hanya 1 test file (Login.test.jsx) — jauh dari coverage yang memadai

---

*Dokumen ini valid untuk ARKON v1.0 development cycle, target submission LIDM 2027.*
