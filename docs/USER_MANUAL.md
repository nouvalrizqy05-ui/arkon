# Panduan Pengguna (User Manual) ARKON v2.0
Platform E-Learning Adaptif Arsitektur Komputer berbasis WebXR dan Gamifikasi.

---

## 💻 1. Persyaratan Sistem
Untuk mendapatkan pengalaman terbaik dalam menggunakan simulasi 3D dan analitik AI, pastikan perangkat Anda memenuhi standar berikut:
- **Browser:** Google Chrome (v90+), Mozilla Firefox (v88+), atau Microsoft Edge terbaru.
- **Koneksi Internet:** Minimal 5 Mbps (disarankan 10 Mbps untuk sinkronisasi Web Socket dan loading model 3D GLB).
- **Perangkat Keras:** Laptop/PC dengan RAM minimum 4GB (direkomendasikan 8GB) dan dukungan WebGL (aktif secara default di sebagian besar browser modern).
- **Resolusi Layar:** Minimum 1024x768 (Desktop) untuk tampilan *Classroom Workspace* yang optimal.

---

## 🎓 2. Panduan Dosen (Lecturer)

Dosen bertindak sebagai fasilitator dan evaluator utama di dalam platform.

### 2.1. Membuat dan Mengelola Kelas
1. **Registrasi/Login:** Gunakan NIP/NIDN untuk mendaftar sebagai dosen.
2. **Membuat Kelas:** Navigasi ke menu **Hub Utama**, klik **"Buat Kelas Baru"**. Anda akan diminta memasukkan nama mata kuliah dan sistem akan me-generate **Room Code** unik (contoh: `AOK-2027`).
3. **Mengundang Mahasiswa:** Bagikan **Room Code** tersebut kepada mahasiswa di kelas Anda.
4. **Manajemen Keamanan:** Jika kelas sudah penuh, dosen dapat mengaktifkan **Safe Mode** untuk mengunci pendaftaran anggota baru ke dalam kelas.

### 2.2. Mengelola Aktivitas dan Modul
1. Di dalam menu kelas (Room Sidebar), buka tab **"Kelola Tugas"**.
2. Anda dapat meluncurkan berbagai modul pembelajaran, seperti:
   - **Quiz Map:** Kuis berbasis *Item Response Theory* (IRT) yang beradaptasi dengan kemampuan mahasiswa.
   - **Assembly Lab:** Modul perakitan komputer 3D yang dapat diberi batasan *budget* koin.
   - **Component Detective:** Mini-game identifikasi komponen *motherboard*.

### 2.3. Analytics dan IRT Heatmap
1. Buka tab **"Analytics"** untuk melihat laporan performa kelas yang komprehensif.
2. **Rasch Model 1-PL:** Sistem akan menampilkan nilai *Theta* ($\theta$) setiap mahasiswa (estimasi kemampuan laten).
3. **AI Feedback:** Platform menggunakan Google Gemini AI untuk menganalisis titik lemah kolektif kelas (misal: "80% mahasiswa gagal di materi Pipeline") dan memberikan rekomendasi perbaikan silabus.
4. **Heatmap:** Pantau partisipasi aktif harian mahasiswa.

### 2.4. Live Broadcast & Polling
- Buka **"Kendali Kelas"** (Live Control).
- Gunakan fitur ini untuk memaksa (force-redirect) layar mahasiswa yang sedang *online* ke halaman materi tertentu atau meluncurkan *Pop-up Quiz* secara instan.

---

## 👨‍💻 3. Panduan Mahasiswa (Student)

Mahasiswa berinteraksi langsung dengan simulasi dan sistem gamifikasi.

### 3.1. Masuk ke Kelas (Room)
1. Login menggunakan NIM (Nomor Induk Mahasiswa).
2. Di **Dashboard Utama**, cari kolom "Gabung Kelas" dan masukkan **Room Code** dari dosen.
3. Setelah masuk, seluruh tugas, target *experience points* (XP), dan materi otomatis tersinkronisasi di Workspace.

### 3.2. Menyelesaikan Misi dan Mendapatkan Koin
ARKON menggunakan sistem ekonomi virtual untuk meningkatkan retensi belajar.
- **Daily Login:** Login setiap hari berturut-turut akan meningkatkan batas hadiah koin harian (hingga hari ke-7).
- **Mengerjakan Kuis:** Semakin sulit soal IRT yang Anda selesaikan, semakin besar *reward* koin yang diterima.
- **Toko Komponen (Hardware Shop):** Koin digunakan untuk membeli komponen PC virtual (CPU, RAM, GPU) yang dibutuhkan untuk menyelesaikan tugas perakitan.

### 3.3. Merakit PC (3D Assembly Lab)
1. Buka tab **Assembly Lab** di sidebar kelas.
2. Pilih komponen dari gudang (*inventory*) yang sudah Anda beli di toko.
3. Arahkan *mouse* (drag/rotate) untuk melihat kompatibilitas. Platform menggunakan deteksi *socket* (contoh: CPU AMD tidak bisa masuk ke Motherboard Intel).
4. Klik **Submit Build** untuk mempublikasikan rakitan Anda ke Showroom jika sukses di-*boot*.

### 3.4. Showroom & Kolaborasi Sosial
1. Buka tab **Showroom** untuk melihat hasil rakitan PC dari mahasiswa lain.
2. Anda dapat memberikan *reaction* (🔥/👍) dan komentar pada desain terbaik.
3. Buka tab **Group Chat (Study Group)** untuk bertanya secara *real-time* kepada dosen atau teman satu kelas mengenai teori yang belum dipahami.

### 3.5. Memantau Progress (Leaderboard)
- Evaluasi diri melalui **Leaderboard** kelas.
- Raih skor tertinggi untuk mendapatkan *Badge* Prestasi (seperti: "Quiz Warrior" atau "Perfect Score") yang akan tampil di profil Anda.

---
*Dokumen ini merupakan panduan resmi platform ARKON. Hak Cipta dilindungi undang-undang.*
