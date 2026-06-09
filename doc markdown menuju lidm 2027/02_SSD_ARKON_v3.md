# System Design Document (SSD)
## ARKON v1.0 — Technical Architecture & Engineering Decisions

---

## 1. SYSTEM OVERVIEW

ARKON adalah aplikasi web full-stack yang terdiri dari:
- **Frontend:** React 18 SPA (Single Page Application) dengan lazy-loading agresif
- **Backend:** Node.js + Express 5 REST API + Socket.io WebSocket server
- **Embedded Simulator:** Svelte app (cpu-visual-simulator) yang di-serve sebagai static bundle
- **Standalone Lab:** React/Vite app (aok-interaktif-lab) yang dapat jalan independent atau embedded
- **Database:** PostgreSQL single instance (production: managed PostgreSQL, e.g. Supabase/Railway)
- **File Storage:** Cloudinary (media), lokal uploads/ (PDF materi)
- **AI:** Google Generative AI SDK (Gemini 2.0 Flash)
- **Real-time:** Socket.io dengan event-based communication

---

## 2. ARCHITECTURE DECISIONS

### 2.1 ADR-001: Monolithic Backend vs. Microservices

**Decision:** Tetap gunakan monolithic Express backend dengan modular architecture internal.

**Rationale:**
- Tim kecil (mahasiswa + dosen pembimbing): operasional microservices terlalu complex
- Current traffic tidak memerlukan horizontal service scaling per-domain
- Modularisasi sudah ada melalui: `routes/`, `services/`, `middleware/`, `config/`
- Bisa di-extract ke microservice nanti jika volume naik (evolutionary architecture)

**Tradeoff:** Jika AI service (Gemini) overloaded, bisa mempengaruhi socket latency. Mitigasi: separate worker thread untuk AI calls.

### 2.2 ADR-002: PostgreSQL sebagai Single DB

**Decision:** PostgreSQL dengan UUID primary keys dan JSONB untuk flexible data.

**Rationale:**
- JSONB digunakan untuk: `components` di pc_builds, `options` di quiz, `benchmark_scores`, `questions` di tournament_matches — semua butuh flexibility tanpa overhead join
- UUID untuk semua ID utama menghindari enumerable ID attacks
- `pgcrypto` extension untuk UUID generation di server side

**Current Schema Highlight:**
```
users → rooms → class_members (many-to-many)
users → student_ability (per room IRT state)
rooms → live_quiz_sessions → live_quiz_questions → live_quiz_answers
rooms → tournaments → tournament_participants → tournament_matches
users → pc_builds → build_reactions / build_comments
users → study_groups → study_group_members → study_group_messages
```

**Scaling Risk:** Single write node. Mitigasi roadmap: read replica untuk analytics queries.

### 2.3 ADR-003: IRT di Backend, bukan Frontend

**Decision:** Semua IRT computation (theta estimation, question selection) dilakukan di backend (Node.js), bukan browser.

**Rationale:**
- Mencegah manipulasi theta dari client
- Menjaga consistency: theta tersimpan di `student_ability` table, bukan localStorage
- Newton-Raphson 15 iterasi = ~0.2ms di Node.js, tidak signifikan
- Integrity penting untuk kredibilitas data di LIDM demo

### 2.4 ADR-004: Svelte CPU Simulator sebagai Embedded Bundle

**Decision:** cpu-visual-simulator tetap ditulis Svelte dan di-bundle ke `/public/simulator/build/`, lalu di-serve oleh Express sebagai static file. React load via `<iframe>` atau route redirect ke `/simulator/index.html`.

**Rationale:**
- cpu-visual-simulator adalah open-source project terpisah (ada PDF paper penelitiannya)
- Svelte memberikan bundle size lebih kecil untuk komponen ini (interaktif tapi tidak butuh React ecosystem)
- Tidak perlu port ke React; gunakan sebagai-ada

**Tradeoff:** Auth state tidak otomatis tershare dengan iframe. Solusi: postMessage API untuk minimal handshake.

---

## 3. COMPONENT ARCHITECTURE

### 3.1 Backend Module Structure

```
arch-ai-backend/
├── server.js                 # Express app setup, middleware stack, error handling
├── config/
│   ├── db.js                 # PostgreSQL connection pool (node-postgres)
│   └── upload.js             # Multer config untuk PDF upload
├── middleware/
│   └── auth.js               # JWT verification + RBAC enforcement
├── routes/                   # Domain-based route modules
│   ├── auth.routes.js        # Register, login, forgot/reset password, email verify
│   ├── rooms.routes.js       # Room CRUD, join, member management
│   ├── ai.routes.js          # Gemini integration: quiz gen, feedback, N-Gain, summary
│   ├── gamification.routes.js# Coins, achievements, leaderboard, daily login, PC shop
│   ├── irt.routes.js         # Adaptive quiz: get question, submit answer, get theta
│   ├── live-quiz.routes.js   # Session create, question push, answer submit
│   ├── tournaments.routes.js # Bracket generation, match management
│   ├── analytics.routes.js   # Heatmap, N-Gain, room analytics
│   ├── activities.routes.js  # Activity log per student
│   ├── notes.routes.js       # Collaborative notes per study group
│   ├── study-groups.routes.js# Study group CRUD, messaging
│   ├── student-work.routes.js# File submission, viewing
│   ├── progress.routes.js    # user_progress key-value store
│   ├── achievements.routes.js# Badge unlock, listing
│   ├── users.routes.js       # Profile, preferences update
│   ├── heatmap.routes.js     # Heatmap data aggregation
│   └── gm.routes.js          # Game Master panel endpoints
├── services/
│   ├── irt.service.js        # Rasch Model, Newton-Raphson, item selection
│   ├── ngain.service.js      # N-Gain calculation (Hake formula), classification
│   └── socket.service.js     # Socket.io event handlers
└── utils/
    ├── validation.js         # Input validation helpers
    ├── sanitize.js           # XSS sanitization
    └── pagination.js         # Cursor-based pagination utility
```

### 3.2 Frontend Page Architecture

```
src/
├── App.jsx                   # Router, lazy loading, protected routes
├── pages/
│   ├── Landing.jsx           # Public landing (non-auth)
│   ├── Login.jsx / Register.jsx / ForgotPassword.jsx / ResetPassword.jsx / VerifyEmail.jsx
│   ├── ClassroomWorkspace.jsx # Main student workspace (room tabs, sidebar)
│   ├── LecturerDashboard.jsx  # Dosen overview: rooms, analytics
│   ├── ArLab.jsx              # AR Hardware Lab
│   ├── CpuSimulator.jsx       # Wrapper untuk Svelte simulator (iframe)
│   └── CpuVisual.jsx          # CPU visualization (React native component)
├── components/                # 40+ komponen, grouped by domain:
│   ├── [Room] RoomHub, RoomOverview, RoomSettings, RoomSidebar, CreateRoomModal
│   ├── [Quiz] QuizGame, QuizLevelMap
│   ├── [Live] LiveQuizPanel, LiveQuizStudent, LiveBroadcastPanel
│   ├── [3D] PcAssembly, PcShowroom, PcShop, ComponentDetective
│   ├── [Gamify] AchievementSystem, CoinDisplay, MainLeaderboard, BossRaid, ClassTournament, DailyLoginModal
│   ├── [AI] (AI embedded in workspace via ai.routes.js)
│   ├── [Analytics] AnalyticsDashboard, HeatMapPanel, StudentInsight
│   ├── [Collab] StudyGroup, ProjectNotes, StudentWorkViewer
│   └── [UI] Navbar, Toast, ErrorBoundary, SkeletonLoader, OnboardingTour, ConfirmDialog
└── contexts/ ThemeContext
```

---

## 4. DATA FLOW DIAGRAMS

### 4.1 Adaptive Quiz Flow (IRT)

```
Student                Frontend              Backend              DB
  |                       |                     |                  |
  |-- Open quiz -------->  |                     |                  |
  |                       |-- GET /irt/question ->|                 |
  |                       |   (room_id, student_id)                 |
  |                       |                     |-- Query theta -->  |
  |                       |                     |<- theta = 0.5     |
  |                       |                     |-- Select question  |
  |                       |                     |   (max information)|
  |                       |<- {question, b} ----  |                  |
  |<- Render question ---  |                     |                  |
  |                       |                     |                  |
  |-- Submit answer ----->  |                     |                  |
  |                       |-- POST /irt/submit ->  |                 |
  |                       |   (correct, difficulty)                  |
  |                       |                     |-- Update theta    |
  |                       |                     |   Newton-Raphson  |
  |                       |                     |-- UPSERT          |
  |                       |                     |   student_ability |-> DB
  |                       |                     |-- Award coins     |-> gamification
  |                       |<- {new_theta, next} -  |                |
  |<- Next question ------  |                     |                  |
```

### 4.2 Live Quiz Real-time Flow

```
Dosen                   Socket.io Server        Students (N)
  |                          |                      |
  |-- Create session ------> API                    |
  |<- session_id ----------- API                    |
  |                          |                      |
  |-- emit quiz:launch ----> |                      |
  |                          |-- broadcast -------> |
  |                          |   quiz:started       |
  |-- emit quiz:question --> |                      |
  |                          |-- broadcast -------> |
  |                          |   (timer starts)     |
  |                          |<- quiz:answer -------| (each student)
  |                          |-- store answers      |
  |                          |-- calculate scores   |
  |<- leaderboard:update --- |                      |
  |                          |-- broadcast -------> |
  |                          |   leaderboard data   |
```

### 4.3 AI Query Flow (dengan resilience)

```
Frontend           Backend (ai.routes.js)        Gemini API
    |                     |                          |
    |-- POST /ai/... -->  |                          |
    |                     |-- Check AI cache ------  DB
    |                     |  (cache hit?) -------->  |
    |                     |                          |
    |                     |-- Call Gemini (model 1) ->|
    |                     |  if rate limit:          |
    |                     |-- Retry with model 2  -> |
    |                     |  if still fails:         |
    |                     |-- Return graceful error  |
    |                     |  (no crash)              |
    |                     |-- Store in ai_cache ---- DB
    |<-- AI response -----  |                        |
```

---

## 5. DATABASE SCHEMA (KEY TABLES)

### 5.1 Core Tables Summary

```sql
-- User management
users           (id, full_name, identifier_number, role, coins, theta, email, is_verified)
                -- Note: theta di users = global theta; per-room theta ada di student_ability

-- Classroom management
rooms           (id, dosen_id, room_code, course_name, is_live, collab_mode, is_safe_mode)
class_members   (room_id, student_id)  -- N:M junction

-- IRT & Assessment
student_ability (student_id, room_id, theta, responses_count)  -- per-room theta
analytics       (room_id, student_id, score, ai_feedback, material_id)

-- Gamification
coin_transactions   (student_id, amount, reason)
achievements        (student_id, badge_id)
daily_logins        (student_id, login_date, streak, coins_earned)
pc_components       (student_id, component_id)  -- purchased virtual components
pc_builds           (student_id, build_name, components JSONB, benchmark_scores JSONB)
detective_scores    (student_id, total_score, completion_time_ms, week_start)

-- Real-time features
live_quiz_sessions  (room_id, dosen_id, status)
live_quiz_questions (session_id, question_text, options JSONB, correct_index, duration_seconds)
live_quiz_answers   (session_id, question_id, student_id, is_correct, answer_time_ms, score)
tournaments         (room_id, title, format, status, max_players)
tournament_matches  (tournament_id, round, player1_id, player2_id, winner_id, questions JSONB)

-- Collaboration
study_groups        (room_id, name, creator_id, current_notes)
study_group_messages (group_id, student_id, content, message_type)

-- Materials & AI
materials       (room_id, file_name, file_type, file_path)
ai_cache        (file_path, feature_type, ai_data JSONB)  -- cache AI responses per file
```

### 5.2 Index Strategy

```sql
-- Existing (dari migrations):
CREATE INDEX idx_analytics_student ON analytics(student_id);
CREATE INDEX idx_analytics_room ON analytics(room_id);
CREATE INDEX idx_study_group_messages_group ON study_group_messages(group_id);

-- Recommended additions untuk production:
CREATE INDEX idx_class_members_room ON class_members(room_id);
CREATE INDEX idx_class_members_student ON class_members(student_id);
CREATE INDEX idx_student_ability_room ON student_ability(room_id);
CREATE INDEX idx_coin_transactions_student ON coin_transactions(student_id, created_at DESC);
CREATE INDEX idx_live_quiz_answers_session ON live_quiz_answers(session_id);
```

---

## 6. API CONTRACT (KEY ENDPOINTS)

### 6.1 Authentication
```
POST /api/auth/register          Body: {full_name, identifier_number, role, password, email}
POST /api/auth/login             Body: {identifier_number, password}
                                 Response: {token, refreshToken, user}
POST /api/auth/refresh-token     Body: {refreshToken}
POST /api/auth/forgot-password   Body: {email}
POST /api/auth/reset-password    Body: {token, newPassword}
GET  /api/auth/verify/:token     → verifies email
```

### 6.2 IRT Adaptive Quiz
```
GET  /api/irt/question/:roomId   Headers: Authorization: Bearer <jwt>
                                 Response: {question, difficulty, remaining_pool}
POST /api/irt/submit             Body: {roomId, questionId, correct, difficulty}
                                 Response: {new_theta, coins_earned, is_complete}
GET  /api/irt/progress/:roomId   Response: {theta, responses_count, history}
```

### 6.3 Live Quiz (Socket.io events)
```
Dosen emits:
  quiz:launch    → {session_id}
  quiz:question  → {question, options, duration_seconds}
  quiz:reveal    → {correct_index, scores}
  quiz:end       → {final_leaderboard}

Student emits:
  quiz:join      → {session_id}
  quiz:answer    → {question_id, selected_index, answer_time_ms}

Server broadcasts:
  quiz:started   → all room members
  quiz:update    → leaderboard data
  quiz:closed    → session ended
```

### 6.4 AI Endpoints
```
POST /api/ai/generate-quiz       Body: {materialId, count, difficulty}
POST /api/ai/feedback            Body: {materialId, score, weakTopics[]}
POST /api/ai/ngain-analysis      Body: {roomId, preScores[], postScores[]}
POST /api/ai/summarize           Body: {materialId}
POST /api/ai/chat                Body: {message, context?, roomId?}
```

---

## 7. SECURITY ARCHITECTURE

### 7.1 Authentication & Authorization

```
Request → Rate Limiter → JWT Middleware → RBAC Check → Handler
                           ↓
                        Verify JWT (ACCESS_TOKEN_SECRET)
                        Extract: {id, role, identifier_number}
                        Attach to req.user
                           ↓
                        RBAC:
                        - mahasiswa: own data only
                        - dosen: own rooms + own room's students
                        - Ownership check: req.user.id === resource.owner_id
```

### 7.2 Security Layers (sudah implemented)

| Layer | Implementation |
|---|---|
| Transport | HTTPS (production) + Helmet HSTS |
| Authentication | JWT HS256, bcrypt(12 rounds), refresh token rotation |
| Authorization | RBAC middleware + ownership validation per query |
| Input Validation | Custom validation.js + type checking |
| Sanitization | middleware/sanitize.js (XSS clean) |
| SQL Injection | Parameterized queries $1, $2 — zero string concatenation |
| Rate Limiting | 5 req/min coins, 5 req/min AI; standard 100 req/10min global |
| CORS | Whitelist: frontend domain only |
| Headers | Helmet: CSP, X-Frame-Options, nosniff, referrer-policy |

### 7.3 Gaps yang Perlu Ditangani (Production)

```
CRITICAL:
[ ] Refresh token tidak ada revocation mechanism (rotation-only)
    Fix: store refresh token hash in DB, check on use, invalidate on logout
[ ] File upload: tidak ada virus scanning
    Fix: ClamAV integration atau cloud-based scan
[ ] Environment secrets: .env files terinclude di zip (visible)
    Fix: secret manager (Doppler, HashiCorp Vault, atau minimal .gitignore strict)

IMPORTANT:
[ ] Tidak ada audit log untuk tindakan sensitif (delete, role change)
[ ] Socket.io tidak ada authorization check per-event (hanya join room check)
    Fix: middleware per-event di socket.service.js
[ ] Database backup strategy tidak terdokumentasi
```

---

## 8. PRODUCTION INFRASTRUCTURE (Target)

### 8.1 Deployment Architecture

```
                        Cloudflare (DNS + DDoS protection)
                               ↓
                    Load Balancer / Reverse Proxy (Nginx)
                     ↙                         ↘
            Frontend SPA                  Backend API + Socket.io
            (CDN-served static)           (Node.js, 2x replicas)
                                               ↓
                                    Redis (session, socket state)
                                               ↓
                                    PostgreSQL (primary + read replica)
                                               ↓
                                    Cloudinary (media CDN)
```

### 8.2 Docker Compose (sudah ada di project)

```yaml
# Current: docker-compose.yml (dev)
services:
  frontend:   build, port 3000
  backend:    build, port 5000
  postgres:   image postgres:16, volume persist

# Production additions needed:
  redis:      image redis:7-alpine
  nginx:      reverse proxy, SSL termination
```

### 8.3 Environment Variables (Kritis)

```
# Backend
JWT_ACCESS_SECRET       = [min 64 char random]
JWT_REFRESH_SECRET      = [min 64 char random, berbeda dari access]
DATABASE_URL            = postgresql://user:pass@host:5432/arkon
GEMINI_API_KEY          = [Google AI Studio]
CLOUDINARY_URL          = [Cloudinary dashboard]
REDIS_URL               = redis://host:6379

# Frontend
VITE_API_URL            = https://api.arkon.edu.id
VITE_SOCKET_URL         = wss://api.arkon.edu.id
```

---

## 9. PERFORMANCE ENGINEERING

### 9.1 Frontend

```javascript
// Sudah dilakukan:
// 1. Code splitting via lazy() untuk semua heavy pages
const ArLab = lazy(() => import('./pages/ArLab'));

// 2. 3D model loading: Three.js GLTFLoader async
// 3. Recharts untuk analytics (tidak load semua data sekaligus)

// Yang perlu ditambahkan:
// 1. Virtual scroll untuk list panjang (leaderboard 100+ users)
// 2. Image optimization: WebP untuk assets
// 3. Bundle analysis: vite-bundle-visualizer untuk cari bloat
```

### 9.2 Backend

```javascript
// Sudah dilakukan:
// 1. Pagination utility (pagination.js)
// 2. AI cache table (ai_cache) — hindari re-call Gemini untuk materi sama

// Yang perlu ditambahkan:
// 1. Redis caching untuk leaderboard (expensive aggregation query)
// 2. Database query analysis: EXPLAIN ANALYZE semua query besar
// 3. Connection pooling: sudah via node-postgres pool, tune max_connections
```

### 9.3 3D Asset Optimization

```
Current 3D models: beberapa .glb di atas 50MB (gaming pc evo.glb = 48MB!)
Target per model: < 5MB

Actions:
1. Draco compression via gltf-pipeline
2. Texture size limit: 1024x1024 max
3. LOD (Level of Detail): 3 versi per model (high/med/low)
4. Lazy load model hanya saat user masuk AR/3D view
5. Cloudflare R2 + CDN untuk serve model files
```

---

## 10. TESTING STRATEGY

### 10.1 Existing Tests

```
arch-ai-backend/__tests__/
├── irt.service.test.js      # Rasch probability, Newton-Raphson, adaptive selection
├── ngain.service.test.js    # N-Gain calculation, Hake classification
├── gamification.test.js     # Coin system, achievements
└── auth.test.js             # Register, login, forgot password

src/__tests__/
└── Login.test.jsx           # Frontend login component
```

### 10.2 Testing Gaps (Production Readiness)

```
Missing:
[ ] Integration tests: API endpoint tests (supertest)
[ ] E2E tests: Playwright/Cypress untuk critical paths
    - Login → Join Room → Complete Quiz → See Updated Theta
    - Dosen → Launch Live Quiz → Students Answer → See Leaderboard
[ ] Load tests: k6 script untuk 50+ concurrent socket connections
[ ] IRT statistical validation: theta converges within expected range pada corpus soal valid
```

---

*Dokumen ini mencerminkan arsitektur aktual dari codebase ARKON v2.0 ditambah gap analysis dan rekomendasi untuk production-grade v1.0.*
