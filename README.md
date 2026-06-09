# ARKON v1.0

ARKON adalah platform edukasi arsitektur komputer berbasis web yang menggabungkan room-based learning, simulasi CPU/3D, AI tutoring, analytics IRT Rasch, dan gamifikasi untuk mendukung pengalaman belajar yang interaktif di kelas maupun mandiri.

This repository contains:
- Frontend React + Vite for the student/lecturer web app
- Backend Node.js + Express + Socket.IO for APIs, auth, real-time collaboration, analytics, and AI features
- A separate Svelte/Rollup visual simulator package for CPU visualization

---

## Ringkasan Proyek

ARKON dirancang untuk membantu mahasiswa mempelajari arsitektur komputer melalui:
- room-based classroom workflow
- simulasi CPU dan perakitan PC 3D
- AI-assisted learning and question support
- lecturer analytics with IRT Rasch Model (1PL) and N-Gain
- gamification, progress tracking, achievements, and study groups

Project ini bukan hanya landing page atau demo; ini adalah aplikasi full-stack yang sudah memiliki:
- rute frontend terproteksi untuk role mahasiswa dan dosen
- API backend dengan auth, room, analytics, AI, live quiz, dan gamification
- real-time websocket untuk kolaborasi kelas
- dokumentasi API dan deployment setup

---

## Fitur Utama

### 1. Room-Based Learning
- membuat dan bergabung ke room belajar
- room code untuk kelas dan sesi mandiri
- tugas, aktivitas, dan progress dalam satu ruang belajar

### 2. CPU Simulator & Visualisasi
- simulasi CPU interaktif
- visualisasi ALU, RAM, PC, control unit, dan pipeline
- assembly instruction flow untuk memahami eksekusi program

### 3. 3D Assembly / PC Quest
- pengalaman merakit PC secara interaktif
- kuis interaktif berbasis peta/level motherboard
- gamifikasi coins, achievements, dan challenge progression

### 4. AI & Tutor Support
- AI routes untuk dukungan jawaban, materi, dan analisis pembelajaran
- integrasi Gemini AI di backend
- kemampuan adaptif untuk mendukung pembelajaran yang lebih personal

### 5. Analytics & IRT
- estimasi kemampuan mahasiswa menggunakan Rasch Model (1PL)
- tracking performa, N-Gain, dan insight pembelajaran dosen
- dashboard untuk memantau progress dan topik yang sulit

### 6. AR Lab / 3D Visualization
- visualisasi komponen hardware berbasis web
- opsi AR/3D untuk eksplorasi komponen komputer

### 7. Real-Time Collaboration
- Socket.IO untuk live quiz, classroom activity, dan update real-time
- support untuk study groups, tournaments, notes, dan progress sharing

---

## Arsitektur Aplikasi

### Frontend
- React 18
- Vite
- React Router
- Tailwind CSS
- Framer Motion
- Recharts
- Lucide icons
- PWA support via Vite PWA

### Backend
- Node.js + Express
- PostgreSQL
- Socket.IO
- Redis (optional / fallback mode)
- JWT auth
- Helmet, CORS, rate limiting, Sentry, Swagger docs

### Visual Simulator Package
- Svelte + Rollup
- TypeScript support
- dedicated CPU visual simulator bundle

---

## Struktur Repo

`	ext
.
├── src/                          # React frontend
│   ├── components/               # reusable UI, navbar, error boundaries, widget
│   ├── pages/                    # landing, login, dashboard, simulator, AR lab, settings
│   ├── contexts/                 # theme and app-level state
│   └── hooks/                    # custom hooks
├── arch-ai-backend/              # Express + Socket.IO backend
│   ├── routes/                   # AI, analytics, auth, rooms, live quiz, study groups, etc.
│   ├── services/                 # IRT, socket, simulator, analytics logic
│   ├── config/                   # db, redis, sentry, swagger, upload
│   └── migrations/               # database schema migration files
├── cpu-visual-simulator/         # Svelte/rollup visual simulator subproject
├── docs/                         # documentation and reports
├── scripts/                      # deployment and maintenance helpers
└── docker-compose*.yml           # local and production deployment setup
`

---

## Teknologi yang Digunakan

### Frontend
- React 18
- Vite 5
- Tailwind CSS
- Framer Motion
- React Router DOM
- Recharts
- Three.js / model-viewer

### Backend
- Express 5
- Socket.IO
- PostgreSQL with pg
- Redis + ioredis
- JWT + bcryptjs
- Cloudinary
- Swagger UI
- Sentry

### Quality & Ops
- ESLint
- Playwright (E2E)
- Jest (backend tests)
- Docker / docker-compose
- Vercel deployment support

---

## Menjalankan Aplikasi Secara Lokal

### 1. Frontend
`ash
npm install
npm run dev
`

### 2. Backend
`ash
cd arch-ai-backend
npm install
npm run dev
`

### 3. Visual Simulator
`ash
npm install --prefix cpu-visual-simulator
npm run build --prefix cpu-visual-simulator
`

### 4. Docker (opsional)
`ash
docker compose up -d --build
`

---

## Variabel Lingkungan

Backend memerlukan environment variables seperti:
- DATABASE_URL
- JWT_SECRET
- REFRESH_SECRET
- GEMINI_API_KEY
- REDIS_URL (opsional)
- CLOUDINARY_*
- SENTRY_DSN (opsional)

Untuk deployment production, cek dokumen deployment yang ada di repo:
- DEPLOYMENT.md
- DOCKER-README.md
- MONITORING.md

---

## Testing

### Backend
`ash
cd arch-ai-backend
npm test
`

### E2E
`ash
npx playwright test
`

---

## Deployment

Project ini sudah disiapkan untuk:
- Vercel (frontend)
- Docker / docker-compose (backend + frontend)
- Azure / hosting cloud dengan PostgreSQL + Redis support

Untuk detail deployment yang lebih lengkap, lihat:
- DEPLOYMENT.md
- render.yaml
- vercel.json
- railway.json
- docker-compose.yml
- docker-compose.prod.yml

---

## Dokumentasi Tambahan

Dokumen yang sudah ada di repo dapat membantu memahami arah pengembangan project:
- docs/TECHNICAL_REPORT.md
- docs/API_DOCUMENTATION.md
- docs/USER_MANUAL.md
- PHASE-2-COMPLETION.md
- AZURE_SETUP.md

---

## Catatan Penting

- Repo ini menggabungkan beberapa subproject dalam satu workspace.
- Aplikasi frontend dan backend dapat berjalan secara terpisah.
- Beberapa fitur memerlukan konfigurasi environment dan layanan pendukung (PostgreSQL, Redis, Gemini API).
- Untuk deployment yang stabil, disarankan menguji build lokal sebelum push ke hosting.

---

## Kesimpulan

ARKON adalah web app edukasi komputer architecture yang lengkap: classroom room, simulator CPU, AI tutor, analytics IRT, AR/3D visualization, dan gamification. README ini disusun agar lebih akurat mencerminkan kondisi proyek saat ini dibanding versi yang lebih umum dan kurang spesifik.
