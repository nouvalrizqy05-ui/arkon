import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Layers, ArrowLeft, BrainCircuit, Gamepad2, BarChart2,
  Server, Cpu, Monitor, Users, BookOpen, CircuitBoard,
  Globe, Wifi, Shield, Code, Database, Zap
} from 'lucide-react';

const fadeUp = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };

export default function TentangPage() {
  const checkToken = () => {
    const t = localStorage.getItem('auth_token');
    if (!t) return false;
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      if (payload.exp * 1000 > Date.now()) return true;
    } catch(e) {}
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    return false;
  };

  const isLoggedIn = checkToken();
  const userName = localStorage.getItem('user_name');
  const userRole = localStorage.getItem('user_role');
  const dashboardPath = userRole === 'dosen' ? '/dosen' : '/mahasiswa';

  return (
    <div className="min-h-screen bg-white text-foreground font-sans selection:bg-primary/20">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-border">
        <div className="container mx-auto max-w-7xl flex items-center justify-between h-20 px-6">
          <Link to="/" className="flex items-center gap-3 no-underline">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/30">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-foreground">AR<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500">KON</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-10">
            <Link to="/#features" className="text-sm font-bold text-secondary hover:text-primary transition-colors no-underline">Fitur</Link>
            <Link to="/tentang" className="text-sm font-bold text-primary transition-colors no-underline">Tentang</Link>
            <Link to="/hubungi-kami" className="text-sm font-bold text-secondary hover:text-primary transition-colors no-underline">Hubungi Kami</Link>
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <span className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-full text-sm font-semibold text-foreground">
                  🤖 Halo, {userName}
                </span>
                <Link to={dashboardPath} className="px-6 py-2.5 bg-emerald-700 text-white rounded-xl font-bold text-sm hover:bg-emerald-800 transition-colors shadow-lg no-underline">
                  Buka Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-secondary hover:text-primary transition-colors no-underline hidden sm:block">Sign In</Link>
                <Link to="/register" className="px-6 py-2.5 bg-foreground text-white rounded-xl font-bold text-sm hover:scale-105 transition-transform shadow-lg no-underline">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Manifesto Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-white to-slate-50">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div {...fadeUp}>
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-secondary hover:text-primary transition-colors no-underline mb-8">
              <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
            </Link>
            <p className="text-sm font-black text-primary uppercase tracking-widest mb-4">Manifesto</p>
            <h1 className="text-4xl md:text-6xl font-black leading-[1.1] mb-8 text-foreground">
              Mengapa kami membangun <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500">ARKON</span>
            </h1>
            <p className="text-lg md:text-xl text-secondary leading-relaxed max-w-3xl font-medium">
              Pembelajaran Arsitektur Komputer di Indonesia masih <strong className="text-foreground">bersifat teoritis dan pasif</strong> — mahasiswa membaca slide, menghafal struktur CPU, tanpa pernah menyentuh hardware sesungguhnya. ARKON mengubah itu dengan{' '}
              <strong className="text-primary">simulasi interaktif, AI adaptif, dan gamifikasi</strong> yang sudah tersedia gratis, agar setiap kampus — dari Sabang sampai Merauke — memiliki akses ke laboratorium virtual berkualitas.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Masalah Section */}
      <section className="py-24 bg-white border-y border-border">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.div {...fadeUp} className="mb-16">
            <p className="text-sm font-black text-red-500 uppercase tracking-widest mb-4">Masalah</p>
            <h2 className="text-3xl md:text-5xl font-black text-foreground">Tiga lubang besar di <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">pendidikan AOK</span></h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                num: '01', title: 'Teoritis dan pasif',
                desc: 'Mahasiswa hanya membaca slide dan mendengar penjelasan. Tidak ada praktik hands-on untuk merakit, mengonfigurasi, atau mendiagnosis komponen hardware secara langsung.'
              },
              {
                num: '02', title: 'Biaya lab tinggi',
                desc: 'Membangun satu laboratorium hardware komputer membutuhkan investasi Rp 500 juta+. Banyak kampus, terutama di daerah, tidak mampu menyediakan fasilitas ini.'
              },
              {
                num: '03', title: 'Evaluasi tidak adaptif',
                desc: 'Ujian masih menggunakan soal statis yang tidak menyesuaikan kemampuan individu. Dosen baru tahu kelemahan mahasiswa setelah UAS — sudah terlambat.'
              },
            ].map((item, idx) => (
              <motion.div key={idx} {...fadeUp} transition={{ delay: idx * 0.1 }}
                className="relative p-8 rounded-[2rem] bg-white border border-border shadow-lg">
                <span className="text-6xl font-black text-slate-100 absolute top-4 right-6">{item.num}</span>
                <h3 className="text-xl font-black text-foreground mb-3 relative z-10">{item.title}</h3>
                <p className="text-secondary text-sm leading-relaxed font-medium relative z-10">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Metodologi Section */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.div {...fadeUp} className="mb-16">
            <p className="text-sm font-black text-primary uppercase tracking-widest mb-4">Pendekatan</p>
            <h2 className="text-3xl md:text-5xl font-black text-foreground">Lima pilar, satu <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500">ekosistem</span></h2>
            <p className="text-secondary text-lg mt-4 font-medium max-w-2xl">Setiap fitur dibangun di atas teori pedagogis yang tervalidasi — bukan fitur asal-asalan.</p>
          </motion.div>

          <div className="space-y-6">
            {[
              {
                step: 1, icon: BookOpen, color: 'bg-blue-500',
                title: 'Room-Based Learning',
                desc: 'Seluruh interaksi terbungkus dalam "Room". Dosen membuat room, mahasiswa bergabung via kode. Semua tugas, quiz, dan kolaborasi berlangsung terstruktur di satu tempat — seperti Tinkercad, tapi untuk pendidikan.',
              },
              {
                step: 2, icon: Gamepad2, color: 'bg-rose-500',
                title: 'Gamifikasi Terukur (SDT Framework)',
                desc: 'Quiz interaktif melalui Peta Motherboard 2D, koin ARKON, dan rakitan PC 3D. Berdasarkan Self-Determination Theory (Ryan & Deci) untuk autonomy, competence, dan relatedness.',
              },
              {
                step: 3, icon: BarChart2, color: 'bg-emerald-500',
                title: 'IRT Rasch Model 1PL',
                desc: 'Estimasi kemampuan (θ) per mahasiswa menggunakan Item Response Theory. Soal menyesuaikan kesulitan secara otomatis. N-Gain scoring mengukur peningkatan pemahaman sebelum dan sesudah intervensi.',
              },
              {
                step: 4, icon: CircuitBoard, color: 'bg-purple-500',
                title: 'Interactive Simulation & AR',
                desc: 'CPU Visual Simulator menampilkan fetch-decode-execute cycle secara real-time. AR Lab menyajikan 8 model 3D komponen hardware yang bisa dilihat dalam Augmented Reality di smartphone.',
              },
              {
                step: 5, icon: BrainCircuit, color: 'bg-amber-500',
                title: 'Generative AI (Gemini RAG)',
                desc: 'AI Tutor berbasis Retrieval-Augmented Generation dari materi dosen. Feedback otomatis untuk rakitan PC dan hint adaptif untuk kuis — bukan jawaban generik dari internet.',
              },
            ].map((item, idx) => (
              <motion.div key={idx} {...fadeUp} transition={{ delay: idx * 0.08 }}
                className="flex gap-6 items-start p-8 bg-white rounded-[2rem] border border-border shadow-sm hover:shadow-lg transition-shadow">
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs font-black text-secondary">{item.step}</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground mb-2">{item.title}</h3>
                  <p className="text-secondary text-sm leading-relaxed font-medium">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-24 bg-white border-y border-border">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.div {...fadeUp} className="mb-16">
            <p className="text-sm font-black text-indigo-500 uppercase tracking-widest mb-4">Tech Stack</p>
            <h2 className="text-3xl md:text-5xl font-black text-foreground">Bahan baku</h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { label: 'Frontend', value: 'React 18 + Vite + Tailwind CSS + Framer Motion', icon: Code, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200' },
              { label: 'Backend', value: 'Node.js + Express 5 + Socket.io (Real-time)', icon: Server, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-200' },
              { label: 'AI Engine', value: 'Google Gemini 2.0 Flash + RAG Pipeline', icon: BrainCircuit, color: 'text-purple-500', bg: 'bg-purple-50 border-purple-200' },
              { label: 'Database', value: 'PostgreSQL (Supabase) + Redis Cache', icon: Database, color: 'text-rose-500', bg: 'bg-rose-50 border-rose-200' },
              { label: '3D / AR', value: 'Three.js + Google Model Viewer + Draco Compression', icon: Monitor, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200' },
              { label: 'Deployment', value: 'Azure App Service + Vercel + GitHub Actions CI/CD', icon: Globe, color: 'text-indigo-500', bg: 'bg-indigo-50 border-indigo-200' },
              { label: 'Analytics', value: 'IRT Rasch Model 1PL + N-Gain + Heatmap', icon: BarChart2, color: 'text-teal-500', bg: 'bg-teal-50 border-teal-200' },
              { label: 'Assessment', value: '14 Level Quiz + 200+ Soal Tervalidasi', icon: Gamepad2, color: 'text-pink-500', bg: 'bg-pink-50 border-pink-200' },
              { label: 'Reference', value: 'Stallings (2019) — Computer Organization & Architecture, 11th ed.', icon: BookOpen, color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200' },
            ].map((item, idx) => (
              <motion.div key={idx} {...fadeUp} transition={{ delay: idx * 0.05 }}
                className={`p-6 rounded-[1.5rem] border ${item.bg} flex flex-col gap-3`}>
                <div className="flex items-center gap-2">
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  <span className="text-xs font-black uppercase tracking-wider text-secondary">{item.label}</span>
                </div>
                <p className="text-sm font-bold text-foreground">{item.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tim Section */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <motion.div {...fadeUp}>
            <p className="text-sm font-black text-primary uppercase tracking-widest mb-4">Tim</p>
            <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">Tim ARKON — Kelompok 10</h2>
            <p className="text-secondary text-lg font-medium mb-2">LIDM Belmawa 2027 · Kategori Pengembangan Perangkat Lunak</p>
            <p className="text-secondary text-sm font-medium flex items-center justify-center gap-2">
              <Globe className="w-4 h-4" /> DI Yogyakarta, Indonesia
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <p className="text-sm font-bold text-secondary text-center">
            © {new Date().getFullYear()} ARKON — LIDM 2027 TENTH GROUP (KELOMPOK 10). All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
