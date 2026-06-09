# Product Requirements Document (PRD)
## ARKON v1.0 — AI-Integrated Computer Architecture Learning Ecosystem
### Target: LIDM Belmawa 2027 — Divisi ITDP (Inovasi Teknologi Digital Pendidikan)

---

## 1. EXECUTIVE SUMMARY

**ARKON** (Architecture + AI) adalah ekosistem pembelajaran cerdas berbasis web yang mentransformasi mata kuliah Arsitektur & Organisasi Komputer (AOK) dari pendekatan konvensional menjadi pengalaman imersif berbasis data dan AI. Platform ini menyatukan simulasi 3D interaktif, augmented reality (AR), adaptive assessment berbasis Item Response Theory (IRT Rasch Model), dan Generative AI dalam satu ekosistem terintegrasi.

**Problem Statement yang Dituju:**
Pembelajaran AOK/Arsitektur Komputer di perguruan tinggi Indonesia menghadapi tiga hambatan fundamental:
1. Akses laboratorium hardware yang mahal dan terbatas (gap infrastruktur antar PT)
2. Tidak adanya mekanisme penilaian yang menyesuaikan kemampuan individual (one-size-fits-all)
3. Rendahnya engagement mahasiswa terhadap materi yang bersifat abstrak dan teknis

**Solusi ARKON:** Virtual lab + adaptive intelligence + gamification = pembelajaran yang terukur, terjangkau, dan engaging.

---

## 2. PRODUCT VISION & GOALS

### 2.1 Vision Statement
> "Menjadi standar nasional platform edukasi teknik komputer di perguruan tinggi Indonesia yang dapat diadaptasi oleh siapapun, di manapun, tanpa bergantung pada infrastruktur fisik yang mahal."

### 2.2 LIDM 2027 Alignment
Berdasarkan pola penilaian LIDM divisi ITDP:

| Kriteria Juri LIDM | Bobot | Implementasi di ARKON |
|---|---|---|
| Dampak terhadap kualitas pendidikan | 20% | IRT adaptive assessment + N-Gain analytics membuktikan peningkatan hasil belajar terukur |
| Kejelasan masalah & tujuan | 20% | Gap lab hardware + penilaian non-adaptif = masalah nyata yang tervalidasi |
| Inovasi teknologi digital | 25% | Kombinasi IRT + 3D/AR + GenAI yang unik di ekosistem pendidikan Indonesia |
| Rencana implementasi | 20% | Pilot di 3 PT, roadmap bertahap, integrasi SISTER/PDDIKTI |
| Keberlanjutan & skalabilitas | 15% | Open-source core, multi-tenant, Docker-ready |

### 2.3 OKRs (Objectives & Key Results)

**Objective 1: Validasi dampak pedagogis**
- KR1: N-Gain score rata-rata ≥ 0.3 (kategori "sedang-tinggi" Hake) pada mahasiswa yang menggunakan ARKON minimal 8 sesi
- KR2: Tingkat penyelesaian adaptive quiz ≥ 75% (vs. baseline quiz konvensional ~45%)
- KR3: Penurunan kesenjangan nilai antara mahasiswa berkemampuan tinggi-rendah ≥ 15%

**Objective 2: Adopsi & Skalabilitas**
- KR1: 3 perguruan tinggi pilot sebelum submit LIDM
- KR2: 500+ mahasiswa aktif di platform
- KR3: Uptime produksi ≥ 99.5%

**Objective 3: Keunggulan teknis yang dapat didemonstrasikan**
- KR1: IRT theta estimation error < 0.15 pada test bank ≥ 100 soal
- KR2: Waktu loading 3D model < 3 detik pada koneksi 4G
- KR3: Real-time quiz latency < 200ms untuk 50 concurrent users

---

## 3. USER PERSONAS

### Persona A: Mahasiswa Teknik Informatika / Sistem Komputer
- **Konteks:** Semester 3-4, sedang menempuh mata kuliah AOK atau Organisasi & Arsitektur Komputer
- **Pain Points:**
  - Tidak bisa menyentuh/melihat komponen CPU/PC secara langsung
  - Soal ujian terasa acak dan tidak mencerminkan tingkat kemampuan
  - Belajar sendiri membosankan, tidak ada feedback instan
- **Goals:**
  - Memahami konsep fetch-decode-execute cycle secara visual
  - Tahu di mana posisi kemampuannya dibanding teman sekelasnya
  - Dapat belajar kapanpun dari HP/laptop
- **Behavioral Notes:** Sangat responsif terhadap gamifikasi, leaderboard, dan achievement. Motivasi ekstrinsik kuat.

### Persona B: Dosen / Instruktur AOK
- **Konteks:** Mengajar 2-4 kelas per semester, 30-60 mahasiswa per kelas
- **Pain Points:**
  - Tidak punya data objektif tentang distribusi pemahaman mahasiswa
  - Menghabiskan waktu banyak untuk membuat dan mengevaluasi soal
  - Sulit mendeteksi mahasiswa yang kesulitan sebelum UTS
- **Goals:**
  - Melihat heatmap pemahaman kelas secara real-time
  - Membuat live quiz interaktif tanpa effort besar
  - Generate analitik N-Gain per semester sebagai bukti efektivitas mengajar
- **Behavioral Notes:** Mengutamakan kemudahan penggunaan dan keandalan. Tidak toleran terhadap downtime saat jam kuliah.

### Persona C: Koordinator Program Studi / Pimpinan Akademik
- **Konteks:** Bertanggung jawab atas akreditasi dan kualitas kurikulum
- **Goals:**
  - Data output pembelajaran yang dapat dimasukkan dalam laporan akreditasi
  - Bukti inovasi pembelajaran digital untuk evaluasi PDDIKTI
- **Behavioral Notes:** Tertarik pada agregat, bukan individual. Butuh export laporan PDF.

---

## 4. FEATURE REQUIREMENTS

### 4.1 Core Features (MUST HAVE — sudah ada di codebase)

#### F-001: Classroom Workspace (Room System)
- Dosen membuat "Room" dengan kode unik, mahasiswa join via kode
- Role-based access: mahasiswa vs. dosen, RBAC ketat
- Room modes: isolation (individual) / collab (study group)
- Safe mode toggle untuk mencegah akses simulasi saat ujian
- **Status:** ✅ Implemented (rooms.routes.js, RoomHub.jsx, ClassroomWorkspace.jsx)

#### F-002: Adaptive Quiz (IRT Rasch Model)
- Soal berikutnya dipilih berdasarkan Maximum Information dari theta mahasiswa saat ini
- Estimasi theta via Newton-Raphson MLE (15 iterasi)
- Progress tersimpan per room (student_ability table)
- Visual progress map: QuizLevelMap.jsx
- **Status:** ✅ Implemented (irt.service.js, irt.routes.js, IRTQuiz.tsx)

#### F-003: 3D PC Assembly Simulator
- Drag-and-drop komponen PC ke slot yang benar dalam lingkungan 3D
- Validasi kompatibilitas antar komponen (compatibility-rules.js)
- PC benchmark score kalkulasi (benchmark-calculator.js)
- Model 3D: CPU AMD/Intel, GPU, RAM DDR4/DDR5, motherboard, PSU, cooler
- PC Showroom: lihat dan bandingkan build orang lain
- **Status:** ✅ Implemented (PcAssembly.jsx, PcShowroom.jsx, pc-components.js)

#### F-004: CPU Visual Simulator (Fetch-Decode-Execute)
- Visualisasi siklus instruksi: Fetch → Decode → Execute → Write-back
- Komponen: Program Counter, ALU, Control Unit, Accumulator, RAM
- Step-by-step execution dengan log
- Built with Svelte (cpu-visual-simulator/), embedded ke React
- **Status:** ✅ Implemented (CpuSimulator.jsx, CpuVisual.jsx)

#### F-005: AR Hardware Lab
- Web AR via WebXR / Google Model Viewer
- Scan permukaan → komponen PC muncul dalam AR
- Label interaktif pada tiap bagian komponen
- Requires: camera permission
- **Status:** ✅ Implemented (ArLab.jsx, ARHardwareLab.tsx)

#### F-006: Live Quiz (Real-time)
- Dosen launch quiz → mahasiswa join via room
- Timer per soal, skor berdasarkan kecepatan + kebenaran
- Leaderboard real-time via Socket.io
- Boss Raid mode: kelas vs. soal "boss" bersama
- **Status:** ✅ Implemented (live-quiz.routes.js, socket.service.js, LiveQuizPanel.jsx)

#### F-007: Gamification System
- Coin economy: earn dari quiz, daily login, achievements
- PC Shop: beli komponen virtual dengan koin (estetika/flex)
- Achievement badges: 20+ jenis (berdasarkan schema)
- Daily login streak dengan multiplier koin
- Double Coins Event (dosen toggle per room)
- Tournament: single elimination bracket, dosen-organized
- Detective Mode: mini-game identifikasi komponen bertingkat
- Main Leaderboard lintas room
- **Status:** ✅ Implemented (gamification.routes.js, AchievementSystem.jsx)

#### F-008: AI Assistant (Gemini-powered)
- Chat AI yang aware konteks materi (upload PDF kuliah → AI baca → jawab)
- Generate soal quiz otomatis dari PDF materi
- N-Gain analysis: AI interprets pre-post score data
- Resilient: model rotation + retry logic saat quota limit
- Rate limiting: 5 req/min di endpoint AI
- **Status:** ✅ Implemented (ai.routes.js, GeminiAdvisor.tsx)

#### F-009: Analytics Dashboard
- Dosen: heatmap pemahaman per topik, distribusi theta, N-Gain per kelas
- Individual student insight: theta trajectory, activity log
- Export-ready data (roadmap: PDF report)
- **Status:** ✅ Implemented (AnalyticsDashboard.jsx, analytics.routes.js, ngain.service.js)

### 4.2 Features to Develop (SHOULD HAVE — production gap)

#### F-010: Multi-Perguruan Tinggi Support (Multi-tenant)
- Isolasi data per institusi (schema-level atau row-level)
- Subdomain atau tenant_id per PT
- Admin panel per PT untuk user management
- **Priority:** HIGH (required for pilot dan LIDM demo)

#### F-011: Offline-first PWA
- Service worker caching untuk simulasi dan materi
- Quiz dapat diselesaikan offline, sync saat online kembali
- Penting untuk mahasiswa dengan koneksi tidak stabil
- **Priority:** MEDIUM

#### F-012: PDF Report Generation
- Laporan akademis N-Gain per kelas (untuk akreditasi)
- Individual progress report per mahasiswa
- Export format: PDF (jsPDF atau server-side Puppeteer)
- **Priority:** HIGH (Persona C butuh ini)

#### F-013: LMS Integration (Moodle/SISTER)
- SSO via OAuth2 atau SAML dengan akun kampus
- Sync nilai ke SISTER / Moodle gradebook
- **Priority:** MEDIUM (differentiator kuat untuk LIDM)

#### F-014: Mobile App (React Native / PWA upgrade)
- Adaptive layout saat ini sudah ada tapi belum optimal untuk mobile
- AR experience di mobile membutuhkan optimasi khusus
- **Priority:** MEDIUM

#### F-015: Content Authoring Tool untuk Dosen
- Interface visual untuk membuat soal IRT (set difficulty parameter)
- Drag-drop builder untuk modul pembelajaran
- Tidak bergantung pada developer untuk tambah konten
- **Priority:** HIGH

### 4.3 LIDM-Differentiating Features (NICE TO HAVE)

#### F-016: Adaptive Learning Path
- Berdasarkan theta dan progress, sistem rekomendasikan urutan topik optimal
- Berbeda dari quiz adaptif: ini tentang urutan MATERI, bukan soal
- **Uniqueness:** Sangat sedikit platform pendidikan Indonesia yang punya ini

#### F-017: Collaborative CPU Simulation
- Dua mahasiswa bisa menjalankan CPU Simulator bersama (multi-cursor)
- Via Socket.io shared state
- **Uniqueness:** Tidak ada platform lain yang menawarkan ini di Indonesia

#### F-018: AR Assembly Grading
- Mahasiswa rakit PC dalam AR → sistem nilai ketepatan urutan dan kompatibilitas
- Grading otomatis tanpa dosen perlu hadir

---

## 5. NON-FUNCTIONAL REQUIREMENTS

### 5.1 Performance
- First Contentful Paint (FCP): < 2 detik
- 3D model load time: < 3 detik (4G, file ≤ 5MB per model)
- API response time: < 500ms untuk 95th percentile
- Socket.io event latency: < 200ms untuk 50 concurrent users

### 5.2 Security
- Semua endpoint kritis: rate limiting aktif (sudah implemented)
- JWT access + refresh token, bcrypt untuk password
- SQL injection: 100% parameterized queries
- RBAC enforcement: server-side, tidak hanya frontend
- Input sanitization: server-side via middleware/sanitize.js
- CORS policy ketat: whitelist domain

### 5.3 Availability & Reliability
- Target uptime: 99.5% (monthly)
- Graceful degradation: jika AI API down, fitur AI disabled, core platform tetap jalan
- Error boundary di React untuk prevent full crash
- Health check endpoint: GET /api/health

### 5.4 Accessibility
- WCAG 2.1 Level AA compliance (skip-to-content sudah ada)
- Keyboard navigation untuk semua fitur core
- Screen reader support minimal untuk halaman utama

### 5.5 Scalability
- Horizontal scaling siap (stateless backend + external DB)
- Redis untuk session dan socket state (belum ada, masuk roadmap)
- Database connection pooling (node-postgres sudah digunakan)

---

## 6. METRICS & SUCCESS CRITERIA

### 6.1 Learning Outcomes (Primary — untuk LIDM)
| Metric | Baseline | Target |
|---|---|---|
| N-Gain Score kelas | 0.15 (perkiraan tradisional) | ≥ 0.40 |
| Quiz completion rate | ~45% | ≥ 75% |
| Theta improvement (average) | 0.0 | ≥ +0.8 per semester |
| Time-on-platform per week | — | ≥ 60 menit/mahasiswa |

### 6.2 Engagement (Secondary)
| Metric | Target |
|---|---|
| Daily Active Users / Monthly Active Users | ≥ 40% |
| Live quiz participation rate | ≥ 80% saat dosen jalankan |
| PC Build submissions per room | ≥ 5 per mahasiswa per semester |

### 6.3 Technical (Infrastructure)
| Metric | Target |
|---|---|
| Uptime | ≥ 99.5% |
| Page Load (P95) | < 3 detik |
| Bug rate (critical) | < 1 per 2 minggu dalam produksi |

---

## 7. CONSTRAINTS & RISKS

### 7.1 Technical Risks
| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Gemini API quota habis saat demo LIDM | Medium | High | Model rotation sudah implemented; tambah fallback ke OpenAI |
| 3D model terlalu berat di HP low-end | High | Medium | LOD (Level of Detail) system, compressed .glb |
| WebXR tidak support semua browser/device | High | Medium | Fallback ke model-viewer static, tidak semua fitur AR |
| Single PostgreSQL bottleneck | Low | High | Read replica, connection pool, cache layer |

### 7.2 Pedagogical Risks
| Risk | Mitigation |
|---|---|
| IRT model terlalu sedikit butir soal untuk estimasi valid (butuh min 30 soal per topik) | Expand quiz bank ke ≥ 200 soal; sudah ada 91KB quizzes.json |
| Gamifikasi distract dari learning | Lock coin reward hanya ke aktivitas bermakna (quiz selesai, bukan hanya login) |
| Dosen tidak mau adopsi (adoption barrier) | Training material, onboarding tour (sudah ada OnboardingTour.jsx) |

### 7.3 Competitive Risk
Tidak ada platform pendidikan Indonesia yang saat ini kombinasikan IRT adaptive quiz + 3D AR + gamification. Risiko kompetitor masuk rendah dalam jangka 12-18 bulan karena barrier teknis tinggi.

---

## 8. ROADMAP (menuju LIDM 2027)

### Phase 1: Production Hardening (Jun – Agt 2026)
- **Sprint 1.1 Security**: Token revocation, File upload hardening, Socket.io auth per-event, Secrets audit
- **Sprint 1.2 Performance**: Redis integration, 3D asset optimization, DB index audit, Bundle analysis
- **Sprint 1.3 Core Gaps**: PDF report export, Theta UI (level nama), Room archive, AI graceful fallback
- **Milestone**: Platform aman dan stabil untuk deployment

### Phase 2: Pilot & Konten (Sep – Nov 2026)
- **Sprint 2.1 Multi-tenant**: Multi-tenant (institution_id), Admin panel institusi, Wizard onboarding dosen
- **Sprint 2.2 Konten**: Quiz bank → 200+ soal, Content authoring tool
- **Sprint 2.3 Deploy & Pilot**: Production infra setup, CI/CD pipeline, PT pilot onboarding
- **Milestones**: ≥1 PT pilot aktif dengan data N-Gain; Quiz bank valid (≥200 soal)

### Phase 3: LIDM Differentiators (Des 2026 – Feb 2027)
- **Sprint 3.1 Adaptive LP**: Learning path engine, Personalized insight
- **Sprint 3.2 LMS & Mobile**: Moodle OAuth2 SSO, Grade sync Moodle, PWA service worker, Mobile UI audit & fix
- **Milestone**: Fitur unik yang tidak ada di platform lain tersedia

### Phase 4: Polish & LIDM Submit (Mar – Mei 2027)
- **Sprint 4.1 Polish**: Design system audit, Onboarding improvements, Loading performance
- **Sprint 4.2 Testing**: Integration test suite, Load testing (k6), E2E critical paths
- **Sprint 4.3 Dokumentasi**: Technical report (ITDP), Demo video produksi, Proposal LIDM submit
- **Milestones**: Load test passed (50 concurrent users), N-Gain empiris ≥0.30, PROPOSAL LIDM 2027 SUBMITTED ✓

---

## 9. OPEN QUESTIONS

1. **Multi-tenant vs. SaaS model?** Apakah ARKON harus bisa di-self-host per PT, atau semua di satu server cloud? Ini mempengaruhi arsitektur signifikan.
2. **Lisensi quiz bank?** Soal-soal di quizzes.json saat ini siapa yang buat? Apakah ada potensi IP issue?
3. **Integration dengan SISTER Dikti?** Seberapa feasible dari sisi regulasi dan API akses?
4. **Nama merek final?** "ARKON" sudah registered atau ada potensi konflik nama?

---

*Dokumen ini dibuat berdasarkan analisis kode ARKON v2.0 (commit: May 28, 2026) dan pola penilaian LIDM 2025-2026 sebagai proyeksi ke LIDM 2027.*
