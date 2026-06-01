# UI/UX Flow Document
## ARKON v3.0 — User Experience Design & Interaction Flows

---

## 1. DESIGN PRINCIPLES

### 1.1 Core Principles

**1. Cognitive Load Reduction**
Arsitektur Komputer adalah materi yang secara inheren kompleks. Setiap keputusan desain harus mengurangi, bukan menambah, beban kognitif. Contoh implementasi:
- Skeleton loading (sudah ada SkeletonCard, SkeletonLoader) vs. blank screen
- Progressive disclosure: tampilkan fitur sesuai konteks, bukan semua sekaligus
- Onboarding tour terstruktur (sudah ada OnboardingTour.jsx)

**2. Feedback Immediacy**
Setiap aksi harus mendapat respons visual dalam < 100ms. Tidak ada aksi yang terasa "masuk ke void".
- Toast notifications untuk semua aksi (sudah ada Toast.jsx)
- Optimistic UI untuk coin transactions
- Real-time leaderboard update tanpa refresh

**3. Gamification sebagai Motivational Layer, bukan Distraksi**
Coin, badge, leaderboard harus reinforce learning behavior, bukan menggantikannya. Reward hanya muncul setelah aksi bermakna (submit quiz, complete level), bukan hanya hadir.

**4. Role Clarity**
UI mahasiswa dan dosen harus terasa seperti dua aplikasi berbeda yang berbagi infrastructure. Dosen tidak perlu melihat coin atau achievement; mahasiswa tidak perlu melihat heatmap analytics.

---

## 2. INFORMATION ARCHITECTURE

### 2.1 Sitemap

```
/ (Landing)
├── /login
├── /register
├── /forgot-password
├── /reset-password
└── /verify-email

[Authenticated — Mahasiswa]
/workspace (ClassroomWorkspace)
├── [Tab: Rooms] — RoomHub
│   ├── Room List / Join Room
│   └── [Inside Room] — Classroom environment
│       ├── Tab: Overview (assignments, materials)
│       ├── Tab: Quiz (IRT adaptive)
│       ├── Tab: Live Quiz (when active)
│       ├── Tab: Leaderboard
│       ├── Tab: Study Group (collaborative notes)
│       ├── Tab: Showroom (PC builds)
│       └── Tab: Student Work (submission)
├── [Tab: Lab] — AR Hardware Lab
│   └── AR Camera View + Component Labels
├── [Tab: Simulator] — CPU Simulator
│   ├── CPU Visual (React) — datapath visualization
│   └── CPU Assembly (Svelte iframe) — assembly execution
├── [Tab: PC Builder] — PcAssembly
│   ├── Component Shop
│   ├── Assembly Canvas (3D)
│   └── Benchmark Results
├── [Tab: Profile] — ProfileCustomization
│   ├── Avatar / Frame customization
│   ├── Achievement showcase
│   └── Coin balance
└── [Global: Leaderboard] — MainLeaderboard

[Authenticated — Dosen]
/lecturer-dashboard
├── Room Management (Create / Edit / Archive)
├── Per-Room Analytics
│   ├── Heatmap by topic
│   ├── N-Gain chart
│   ├── Student individual insight
│   └── Material upload
├── Live Quiz Control Panel
├── Tournament Management
└── GM (Game Master) Panel
    └── Manage events, double coin, announcements
```

### 2.2 Navigation Model

**Mahasiswa (ClassroomWorkspace):**
- Persistent sidebar kiri: Room list, navigasi antar fitur
- Top bar: Coin display, notifikasi, profil
- Dalam room: Tab-based navigation untuk semua sub-fitur
- Mobile: Bottom navigation bar (setelah F-014 diimplementasi)

**Dosen (LecturerDashboard):**
- Card-based overview untuk semua room
- Drill-down ke analytics per room
- Floating action button untuk aksi cepat (+ Create Room, Launch Quiz)

---

## 3. USER FLOWS

### 3.1 Flow: Mahasiswa — Onboarding & First Session

```
1. LANDING
   └── CTA: "Mulai Belajar" / "Lihat Demo"
       ↓
2. REGISTER
   Fields: Nama Lengkap, NIM, Role (Mahasiswa/Dosen), Email, Password
   └── Submit → Email verifikasi dikirim
       ↓
3. VERIFY EMAIL
   └── Klik link di email → redirect ke /workspace
       ↓
4. ONBOARDING TOUR (OnboardingTour.jsx — sudah ada)
   Step 1: "Ini adalah workspace kamu"
   Step 2: "Join room dosen kamu dengan kode ini"
   Step 3: "Selesaikan quiz adaptif untuk mulai belajar"
   Step 4: "Rakit PC virtual kamu di sini"
       ↓
5. JOIN ROOM
   Input: Kode room dari dosen
   └── Berhasil → masuk ClassroomWorkspace dengan room aktif
       ↓
6. FIRST ADAPTIVE QUIZ
   → Sistem mulai dari theta = 0 (soal medium)
   → Setelah 5 jawaban: sistem punya estimasi theta awal
   → Feedback instan: "Kamu cenderung kuat di [topik X]"
```

### 3.2 Flow: Mahasiswa — Adaptive Quiz Session

```
[Dari Tab Quiz di dalam Room]
     ↓
QUIZ LEVEL MAP (QuizLevelMap.jsx)
- Visual map: level-level seperti game
- Setiap level = cluster topik (CPU basics, Memory, ALU, dll.)
- Terkunci/terbuka berdasarkan theta dan progress
- Badge pada level yang sudah diselesaikan
     ↓
START QUIZ LEVEL
- Loading soal pertama dari backend (IRT: GET /irt/question/:roomId)
- Timer per soal (jika safe mode: tidak ada unlimited time)
     ↓
QUESTION DISPLAY
- Pertanyaan + 4 pilihan ganda (A/B/C/D)
- Progress bar: "Soal 3 dari 10"
- Coin reward preview: "Jawab benar = +15 koin"
     ↓
SUBMIT ANSWER
- Immediate visual feedback: benar (hijau) / salah (merah)
- Animasi coin jika benar
- Brief explanation (jika tersedia di quiz data)
     ↓
NEXT QUESTION
- Backend: hitung theta baru (Newton-Raphson)
- Frontend: tidak perlu tahu detail, hanya tampilkan soal berikutnya
     ↓
QUIZ COMPLETE (setelah N soal)
- Summary screen:
  - Theta baru: "Kemampuanmu naik ke level X"
  - Soal paling sulit yang berhasil dijawab
  - Total koin earned
  - CTA: "Lihat posisi di leaderboard" / "Coba lagi"
```

### 3.3 Flow: Dosen — Launch Live Quiz

```
[Di LecturerDashboard, pilih Room]
     ↓
LIVE QUIZ PANEL (LiveQuizPanel.jsx)
- Pilih: buat soal baru / ambil dari quiz bank
- Set: jumlah soal, durasi per soal
     ↓
PREVIEW & CONFIRM
- Review semua soal
- Tombol "Launch Quiz" (hanya aktif jika ≥ 1 mahasiswa sudah join room)
     ↓
WAITING LOBBY (real-time via Socket.io)
- Counter: "X mahasiswa siap"
- Dosen bisa kirim notif ke mahasiswa: "Quiz akan dimulai!"
     ↓
QUIZ RUNNING
Dosen view:
- Soal yang sedang berjalan + timer
- Live answer stats: "23/30 mahasiswa sudah jawab"
- Distribusi jawaban: bar chart A/B/C/D (update tiap detik)
- Tombol: "Tampilkan Jawaban Benar" (reveal) / "Soal Berikutnya"

Student view (LiveQuizStudent.jsx):
- Soal + pilihan jawaban
- Timer countdown
- Feedback setelah reveal: benar/salah + score
     ↓
REVEAL ANSWER
- Benar (misalnya C) di-highlight hijau
- Jawaban salah: di-highlight merah dengan label "jawabanmu"
- Leaderboard otomatis update
     ↓
QUIZ END
- Final leaderboard animasi (confetti untuk rank 1)
- Summary per mahasiswa: dikirim ke analytics
- Dosen dapat export hasil
```

### 3.4 Flow: Mahasiswa — 3D PC Assembly

```
[Tab PC Builder]
     ↓
WORKSHOP VIEW
- Canvas 3D: PC case terbuka (Three.js)
- Panel kiri: komponen yang dimiliki (sudah dibeli dari PC Shop)
- Panel kiri: komponen yang bisa dibeli (dengan harga koin)
     ↓
DRAG COMPONENT
- Drag komponen dari panel ke slot di motherboard/case
- Snap-to-slot mechanism: komponen masuk ke slot yang benar
- Hover: tooltip nama komponen + spec
     ↓
COMPATIBILITY CHECK (real-time)
- Setelah tiap komponen diletakkan:
  - Hijau: kompatibel
  - Merah: "DDR5 RAM tidak kompatibel dengan motherboard ini"
  - Warning: "PSU 500W mungkin tidak cukup untuk GPU RTX 4090"
     ↓
RUN BENCHMARK
- Setelah build lengkap (minimal: CPU + RAM + Motherboard + PSU + GPU + Storage)
- Animasi "menghitung performa..."
- Hasil: Gaming Score, Productivity Score, Value Score
     ↓
SAVE & SHARE BUILD
- Beri nama build
- Dipublish ke Showroom kelas
- Teman bisa react (👍/⚡/🔥) dan komentar
- Achievement unlock jika benchmark score tinggi
```

### 3.5 Flow: Mahasiswa — AR Hardware Lab

```
[Tab Lab → AR Mode]
     ↓
PERMISSION REQUEST
- Request akses kamera
- Jika ditolak: tampilkan fallback 3D static view
     ↓
SURFACE DETECTION
- Guide overlay: "Arahkan kamera ke permukaan datar"
- Visual indicator: titik-titik AR tracking
     ↓
MODEL PLACEMENT
- Tap permukaan → komponen PC muncul (skala realistis)
- Default: motherboard dengan label arah
     ↓
EXPLORATION MODE
- Tap komponen → zoom + label muncul
  Label: nama, fungsi, spec khas
- Swipe → ganti komponen (CPU → GPU → RAM → dll.)
- Pinch to scale
     ↓
QUIZ MODE (AR-graded — F-018, roadmap)
- "Pasang CPU ke socket yang benar"
- User drag CPU model ke socket
- Sistem nilai: benar/salah + skor
```

---

## 4. STATE MANAGEMENT & UX PATTERNS

### 4.1 Loading States

| Scenario | Pattern |
|---|---|
| Page pertama kali load | SkeletonCard (sudah ada) |
| API request in progress | Spinner di tombol + disable |
| 3D model loading | Progress bar + persentase |
| Socket waiting for data | "Menunggu koneksi..." subtle indicator |

### 4.2 Error States

| Error Type | UI Treatment |
|---|---|
| Network error / API down | Toast merah + retry button |
| Quiz soal tidak tersedia | Fallback: "Tidak ada soal tersedia untuk level ini. Coba topik lain." |
| Gemini AI error | Tidak crash; tampilkan: "AI sedang tidak tersedia. Coba lagi nanti." |
| WebXR not supported | "AR tidak tersupport di browser ini. Gunakan tampilan 3D biasa." |
| Unauthorized | Redirect ke /login dengan pesan "Sesi habis, silakan login kembali" |

### 4.3 Empty States

| Context | Treatment |
|---|---|
| Belum join room | Ilustrasi + CTA "Join room dengan kode dari dosenmu" |
| Leaderboard kosong | "Jadilah yang pertama menyelesaikan quiz!" |
| Belum ada build di showroom | "Belum ada build. Rakit PC pertamamu di Workshop!" |
| Study group baru | "Belum ada pesan. Mulai diskusi dengan grupmu!" |

### 4.4 Confirmation Patterns

- **Aksi irreversible** (hapus room, reset progress): ConfirmDialog modal (sudah ada)
- **Aksi berisiko** (keluar dari quiz di tengah): toast warning "Progress akan hilang"
- **Aksi signifikan** (beli komponen mahal): preview total harga sebelum confirm

---

## 5. GAMIFICATION UX LAYER

### 5.1 Coin Feedback Loop

```
Earn coins → animated counter naik (CoinDisplay.jsx)
           → brief floating "+15 🪙" di atas display
           → Toast: "Kamu mendapat 15 koin untuk menjawab dengan benar!"

Spend coins → Shop: preview item sebelum beli
           → Confirmation: "Beli Corsair DDR5 seharga 300 koin?"
           → Sukses: animasi item masuk ke inventory
```

### 5.2 Achievement Notification

```
Trigger: backend kirim flag achievement_unlocked di response
         atau realtime via socket event achievement:earned

Animation sequence:
1. Overlay semi-transparan muncul
2. Badge animasi masuk dari bawah
3. "Achievement Unlocked: [Nama Badge]"
4. Subtitle: syarat yang terpenuhi
5. Dismiss otomatis setelah 3 detik atau tap untuk lihat detail
```

### 5.3 Theta Progress Visualization

```
Bukan angka mentah (0.5, 1.2, -0.3) → terlalu teknis untuk mahasiswa

Visualisasi:
- Level nama: "Pemula" → "Menengah" → "Mahir" → "Ahli" → "Master"
  (mapping dari theta range: <-1 / -1 to 0 / 0 to 1 / 1 to 2 / >2)
- Progress ring: visual circular progress
- "Kamu lebih baik dari 68% mahasiswa di kelas ini" (percentile rank)
- History chart: theta timeline per minggu
```

---

## 6. DESIGN SYSTEM REQUIREMENTS

### 6.1 Color Palette (Current — perlu audit)

```css
/* Dari tailwind.config.cjs dan index.css */
--color-primary:        /* warna utama brand (gelap, tech vibes) */
--color-primary-soft:   /* versi lighter untuk backgrounds */
--color-secondary:      /* text muted */

/* Catatan: project sudah punya ThemeContext.jsx — dark/light mode support */
```

### 6.2 Component Library Status

| Category | Status | Components |
|---|---|---|
| Layout | ✅ | Navbar, WorkspaceSidebar, RoomSidebar |
| Forms | ✅ | Input, Button (via Tailwind utilities) |
| Feedback | ✅ | Toast, ErrorBoundary, ConfirmDialog, SkeletonLoader |
| Data Display | ✅ | AnalyticsDashboard, HeatMapPanel, MainLeaderboard |
| Gamification UI | ✅ | CoinDisplay, AchievementSystem, DailyLoginModal |
| 3D/AR | ✅ | PcAssembly, ArLab (via Three.js + ModelViewer) |
| Missing | ❌ | Date picker, Multi-select filter, Rich text editor (untuk notes) |

### 6.3 Responsive Breakpoints (Target)

```
Mobile:  < 640px  — bottom nav, simplified layout, AR mode primary
Tablet:  640-1024px — collapsible sidebar, responsive grid
Desktop: > 1024px — full sidebar, multi-panel layout
```

---

## 7. ACCESSIBILITY REQUIREMENTS

### 7.1 Existing Implementation
- Skip-to-content link: `<a href="#main-content">` (App.jsx — sudah ada)
- Semantic: `<main id="main-content" role="main">`
- ARIA: ErrorBoundary menangani aria di error state

### 7.2 Gaps yang Harus Dipenuhi

```
[ ] Semua form fields: label yang benar (bukan hanya placeholder)
[ ] Icon-only buttons: aria-label
[ ] Live quiz timer countdown: aria-live="polite" untuk screen reader
[ ] 3D canvas: fallback text description untuk low-vision users
[ ] Color contrast: audit khusus untuk dark mode
[ ] Keyboard navigation: Tab order yang logis di semua halaman
[ ] Modal dialogs: focus trap + return focus saat dismiss
```

---

## 8. MOBILE UX NOTES

### 8.1 Critical Issues (Saat ini)

AR Lab: paling baik di mobile (kamera), tapi 3D models berat → perlu LOD
CPU Simulator (Svelte iframe): tidak responsive di layar kecil → perlu min-width handling
PcAssembly drag-and-drop: sulit di touchscreen → perlu tap-to-select alternative interaction

### 8.2 Mobile-first Redesign (F-014)

```
Strategi: adaptive interaction, bukan hanya scaling layout

3D Assembly di mobile:
- Ganti drag-drop → tap komponen → tap slot
- Pinch to zoom canvas
- Bottom sheet untuk komponen picker

CPU Simulator di mobile:
- Stack layout vertikal (bukan horizontal split)
- Larger touch targets untuk control buttons
- Simplified view mode: hide advanced settings

AR Lab di mobile:
- AR sudah native di mobile → prioritas utama
- Optimize WebXR launch sequence
```

---

## 9. UX METRICS & SUCCESS CRITERIA

| Metric | Target | Measurement |
|---|---|---|
| Task Completion Rate (join room + complete quiz) | ≥ 85% | Funnel analytics |
| Time-to-first-quiz (dari register) | < 5 menit | Event tracking |
| Quiz abandonment rate | < 25% | (completed / started) |
| Daily retention (D7) | ≥ 40% | Cohort analysis |
| System Usability Scale (SUS) Score | ≥ 70 (acceptable) | User testing survey |
| Error encounter rate | < 10% sessions | Error boundary logs |

---

*Dokumen ini mencerminkan state saat ini dan roadmap UX untuk ARKON v3.0 target LIDM 2027.*
