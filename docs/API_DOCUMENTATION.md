# ARKON API Documentation
Versi: 2.0.0

## Base URL
Semua endpoint berawalan `/api`. Pada environment lokal: `http://localhost:3000/api`. Pada production, arahkan ke Reverse Proxy (Nginx) Anda.
Seluruh endpoint (kecuali registrasi/login) memerlukan Header: `Authorization: Bearer <token>`

---

## 1. Authentication (`/api`)
- `POST /register`: Mendaftarkan akun (mahasiswa/dosen). Body: `full_name`, `identifier_number`, `password`, `role`.
- `POST /login`: Autentikasi dan menerima JWT. Body: `identifier_number`, `password`.
- `POST /verify-email`: Verifikasi akun melalui token via email Resend.

## 2. Rooms / Manajemen Kelas (`/api/rooms`)
- `POST /create`: (Dosen) Membuat kelas baru. Mengembalikan `room_code`.
- `POST /join`: (Mahasiswa) Bergabung ke kelas dengan `room_code`.
- `GET /my-rooms`: Mengambil daftar kelas milik user yang terotentikasi.
- `GET /:id`: Mendapatkan detail konfigurasi spesifik dari sebuah kelas.
- `PATCH /:id`: (Dosen) Mengubah mode aman (Safe Mode), kolaborasi (Isolation/Public).

## 3. Activities & Quizzes (`/api/activities`)
- `POST /`: (Dosen) Membuat tugas, kuis, atau simulasi baru untuk suatu Room.
- `GET /room/:room_id`: Menampilkan daftar semua aktivitas aktif.
- `DELETE /:id`: (Dosen) Menghapus tugas yang sudah selesai.

## 4. Gamification (Coins & Economy) (`/api`)
- `GET /coins/:student_id`: Cek saldo koin saat ini.
- `POST /coins/earn`: Menambah koin (Body: `amount`, `reason`). Dilindungi oleh Rate Limiter.
- `POST /coins/spend`: Mengurangi koin untuk pembelian.
- `POST /daily-login`: Mencatat *streak* harian dan mendistribusikan koin bonus (maks day 7).

## 5. PC Quest Shop & Inventory (`/api/pc-quest`)
- `GET /inventory/:student_id`: Menampilkan semua komponen PC yang telah dibeli mahasiswa.
- `POST /buy`: Membeli komponen PC (Body: `component_id`). Koin dikurangi secara transaksional.
- `POST /sell`: Menjual kembali komponen PC (Refund koin sebesar 70%).

## 6. Showroom (Social Feed) (`/api/showroom`)
- `POST /publish`: Menyimpan rakitan PC selesai dari Assembly Lab ke linimasa publik.
- `GET /builds`: Mendapatkan daftar rakitan (dengan fitur *pagination* & *sorting*: 'newest', 'most_liked', dll).
- `POST /react`: Memberikan reaksi "Like" atau "Fire" pada rakitan PC tertentu.
- `POST /comment`: Mengirimkan komentar pada rakitan PC orang lain.

## 7. Component Detective (`/api/detective`)
- `POST /submit`: Menyimpan skor akhir (waktu & akurasi) dari mini-game identifikasi komponen.
- `GET /leaderboard`: Menampilkan peringkat mingguan para detektif komponen tercepat.

## 8. Item Response Theory (IRT) (`/api/irt`)
- `POST /responses`: (Mahasiswa) Mengirimkan jawaban kuis untuk dikalkulasi menggunakan Rasch Model.
- `GET /theta/:room_id`: Mengambil nilai $\theta$ mahasiswa di kelas terkait.

## 9. Analytics & Heatmap (`/api/analytics` & `/api/analytics/heatmap`)
- `GET /room/:id`: (Dosen) Menyajikan data komprehensif distribusi nilai (termasuk grafik N-Gain).
- `GET /student/:student_id/room/:room_id`: (Dosen) Rapor spesifik progres individu.
- `GET /`: (Dosen) Menampilkan *heat map* partisipasi harian/mingguan mahasiswa secara visual.

## 10. AI Insights (Google Gemini) (`/api/ai`)
- `POST /analyze-work`: Mengirim JSON hasil rakit PC mahasiswa untuk dikritik secara generatif oleh AI (kompatibilitas & saran *bottleneck*).
- `POST /adaptive-hint`: Menghasilkan *hint* dinamis sesuai tingkat kemampuan (Theta) saat mahasiswa mengalami *stuck* berulang kali.

## 11. Study Groups (`/api/study-groups`)
- `POST /`: Membuat grup belajar kecil di dalam suatu Room.
- `GET /room/:room_id`: Mengambil list semua Study Groups aktif.
- `POST /:group_id/join`: Bergabung ke dalam Study Group.

## 12. Live Quiz (`/api/live-quiz`)
- `POST /create`: (Dosen) Inisiasi *flash quiz* dadakan berbasis socket (tersambung ke `io.emit`).
- `POST /answer`: (Mahasiswa) Submit jawaban kuis live dengan latensi mili-detik.

## 13. Tournaments (`/api/tournaments`)
- `POST /create`: (Dosen) Membuat bagan turnamen sistem gugur (Single Elimination).
- `GET /:tournament_id/bracket`: Menampilkan visualisasi bagan pertandingan mahasiswa.

## 14. Student Work (`/api/student-work`)
- `GET /room/:room_id`: Mengumpulkan semua artefak 3D, catatan, dan tugas milik seluruh mahasiswa dalam satu etalase (khusus Dosen).

## 15. Achievements (`/api/achievements`)
- `POST /unlock`: Membuka kunci *Badge* (misal: First Step, Quiz Warrior, Archi Master).
- `GET /:student_id`: Menampilkan koleksi Badge mahasiswa.

## 16. Notes (Buku Catatan Digital) (`/api/notes`)
- `PATCH /:id`: Menyimpan progres pencatatan materi (*rich text*) mahasiswa. Auto-save sinkron setiap 5 detik.

## 17. System Health (`/api/health`)
- `GET /`: (DevOps) Mengecek *Uptime*, koneksi PostgreSQL DB, ketersediaan Gemini API Key, dan metrik penggunaan *Memory/Heap*. HTTP 200 (OK) atau HTTP 503 (Degraded).

---
*(Dokumentasi ini disajikan dengan spesifikasi lengkap untuk keperluan integrasi front-end dan penilaian audit teknis LIDM 2027).*
