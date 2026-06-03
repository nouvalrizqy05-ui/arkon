import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Cpu, BrainCircuit, Server, BarChart2, Code, Terminal,
  Database, Users, BookOpen, ChevronDown, Star, Monitor, Bot, Play,
  FileCode, Layers, GraduationCap, Shield, CircuitBoard, ChevronRight, Gamepad2, Info,
  Mail, Github
} from 'lucide-react';
import HeroSection from './HeroSection';

export default function Landing() {
  const [aboutOpen, setAboutOpen] = useState(false);

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

  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    const el = document.getElementById(targetId);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const BENEFITS = [
    { icon: Server, title: "Room-Based Learning", desc: "Semua fitur terbungkus dalam Room. Dosen buat kelas, mahasiswa join via kode. Belajar mandiri juga bisa — buat Room pribadi kapan saja." },
    { icon: Gamepad2, title: "PC Quest Gamification", desc: "Selesaikan kuis interaktif melalui Peta Motherboard 2D, kumpulkan ARKON Coins, dan rakit PC impian Anda secara 3D." },
    { icon: BarChart2, title: "IRT Adaptive Analytics", desc: "Dashboard dosen berbasis Item Response Theory (Rasch Model 1PL) dan N-Gain yang mengukur efektivitas pembelajaran secara presisi." },
    { icon: Users, title: "Tinkercad-Style Classroom", desc: "Dosen bisa 'Tinker This' — masuk ke karya mahasiswa, beri feedback spasial, dan pantau progress real-time via WebSocket." },
  ];

  const PERSONAS = [
    { icon: GraduationCap, title: "Mahasiswa Arsitektur Komputer", desc: "Belajar merakit PC 3D, mengerjakan quiz interaktif, dan latihan dengan feedback dosen secara real-time di dalam Room.", color: "text-blue-500", bg: "bg-blue-50 border-blue-200" },
    { icon: BookOpen, title: "Dosen Pengampu", desc: "Buat Room, kelola tugas & aktivitas, pantau kemampuan (θ) mahasiswa lewat dashboard IRT + N-Gain, dan berikan feedback langsung.", color: "text-emerald-500", bg: "bg-emerald-50 border-emerald-200" },
    { icon: Monitor, title: "Belajar Mandiri", desc: "Buat Room pribadi untuk eksplorasi mandiri. Rakit PC, kerjakan quiz, dan tingkatkan kemampuan tanpa perlu bergabung ke kelas.", color: "text-purple-500", bg: "bg-purple-50 border-purple-200" },
  ];

  const [openFaq, setOpenFaq] = useState(null);
  const toggleFaq = (idx) => setOpenFaq(openFaq === idx ? null : idx);

  const FAQS = [
    { q: "Apa itu ARKON?", a: "ARKON (Adaptive Resource Komputer Architecture Education) adalah platform edukasi Arsitektur Komputer berbasis Room-based Learning & Interactive Simulation. Mahasiswa bisa belajar, mengerjakan kuis, dan merakit PC 3D secara langsung dalam satu platform." },
    { q: "Bagaimana sistem Room bekerja?", a: "Dosen membuat Room dan membagikan Room Code ke mahasiswa. Mahasiswa join via kode, lalu semua aktivitas (Assembly, Quiz, Detective) berlangsung di dalam Room. Mahasiswa juga bisa buat Room pribadi untuk belajar mandiri." },
    { q: "Apakah CPU Simulator bisa menjalankan kode Assembly?", a: "Ya! Simulator mendukung instruksi seperti LOAD, STORE, ADD, SUB, JUMP, dan HALT. Mahasiswa bisa menulis kode manual dan melihat setiap instruksi mengalir secara real-time melalui pipeline CPU." },
    { q: "Bagaimana dosen memantau progress mahasiswa?", a: "Dosen memiliki dashboard Analytics dengan IRT Rasch Model dan N-Gain scoring. Dosen juga bisa 'Tinker This' — masuk ke karya mahasiswa, melihat progress perakitan, dan memberikan feedback langsung." },
    { q: "Apakah ARKON gratis?", a: "ARKON dikembangkan sebagai proyek riset untuk kompetisi LIDM 2027 (TENTH GROUP / Kelompok 10). Platform ini gratis untuk digunakan dalam lingkungan akademik." },
  ];

  const TESTIMONIALS = [
    { name: "Rina Safitri", role: "Mahasiswa Teknik Informatika", content: "Fitur AI Tutor-nya luar biasa! Saya bisa langsung tanya konsep Register Transfer Level dan dapat jawaban dari modul dosen, bukan dari internet random.", avatar: "RS" },
    { name: "Ahmad Fauzan", role: "Mahasiswa Teknik Komputer", content: "CPU Simulator-nya bikin paham banget soal pipeline. Dulu cuma baca teori, sekarang bisa lihat langsung data mengalir dari RAM ke ALU.", avatar: "AF" },
    { name: "Dr. Dina Maharani", role: "Dosen Arsitektur Komputer", content: "Dashboard IRT Rasch Model membantu saya mengidentifikasi nilai theta (kemampuan) setiap mahasiswa dan topik mana yang paling membingungkan. Sangat berguna untuk menyesuaikan metode pengajaran.", avatar: "DM" },
  ];

  return (
    <div className="min-h-screen bg-white text-foreground font-sans selection:bg-primary/20 overflow-x-hidden">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border border-border backdrop-blur-xl border-b border-border transition-colors">
        <div className="container mx-auto max-w-7xl flex items-center justify-between h-20 px-6">
          <Link to="/" className="flex items-center gap-3 no-underline">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/30">
              <Layers className="w-5 h-5 text-foreground" />
            </div>
            <span className="text-2xl font-black tracking-tight text-foreground">AR<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500">KON</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-10">
            <a href="#features" onClick={(e) => handleNavClick(e, 'features')} className="text-sm font-bold text-secondary hover:text-primary transition-colors no-underline">Fitur</a>
            <Link to="/tentang" className="text-sm font-bold text-secondary hover:text-primary transition-colors no-underline">Tentang</Link>
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

      {/* Hero Section */}
      <HeroSection />

      {/* Marquee Benefits */}
      <section className="py-16 md:py-24 bg-muted border-y border-border overflow-hidden">
        <div className="w-full relative overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)' }}>
          <div className="flex w-max animate-marquee gap-6 hover:[animation-play-state:paused]">
            {[...BENEFITS, ...BENEFITS].map((item, idx) => (
              <div key={idx}
                className="group w-[300px] md:w-[360px] shrink-0 p-8 rounded-[2rem] bg-white backdrop-blur-md border border-border hover:border-primary/30 transition-all duration-300 hover:-translate-y-2 flex flex-col items-center text-center aspect-[4/3]">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-primary/30">
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-black mb-3 text-foreground">{item.title}</h3>
                <p className="text-secondary leading-relaxed font-medium text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENTO GRID FEATURES */}
      <section id="features" className="py-32 relative">
        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-foreground">Ekosistem Lengkap <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500">ARKON</span></h2>
            <p className="text-secondary text-lg max-w-2xl mx-auto font-medium">Satu platform untuk seluruh kebutuhan pembelajaran Arsitektur Komputer.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 md:auto-rows-[250px]">

            {/* Box 1: CPU Visual Simulator (Large Left) */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="col-span-1 md:col-span-2 lg:col-span-2 md:row-span-2 relative group p-8 rounded-[2.5rem] bg-white border border-border shadow-xl overflow-hidden hover:-translate-y-1 transition-all"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-6">
                <Cpu className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-3xl font-black mb-4 text-foreground">CPU Visual Simulator<br />& Assembly Engine</h3>
              <p className="text-secondary text-lg font-medium max-w-md">Visualisasi interaktif ALU, RAM, Program Counter, dan Control Unit. Tulis kode Assembly dan lihat setiap instruksi mengalir secara real-time.</p>
            </motion.div>

            {/* Box 2: Room System (Highlight Gradient) */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              className="col-span-1 md:col-span-1 lg:col-span-2 md:row-span-1 relative group p-8 rounded-[2.5rem] bg-gradient-to-br from-primary to-indigo-600 text-white shadow-xl overflow-hidden hover:-translate-y-1 transition-all flex flex-col justify-center"
            >
              <div className="absolute right-[-10%] top-[-10%] opacity-20"><Users className="w-48 h-48 text-white/10" /></div>
              <span className="inline-block px-3 py-1 bg-white shadow-sm border border-border backdrop-blur text-foreground text-[10px] font-black uppercase rounded-full w-max mb-3">Room-Based</span>
              <h3 className="text-2xl font-black mb-2 text-white">Tinkercad-Style Room</h3>
              <p className="text-white/80 font-medium text-sm">Semua pembelajaran di dalam Room. Dosen buat tugas, mahasiswa kerjakan, dosen review — semua real-time dan terstruktur.</p>
            </motion.div>

            {/* Box 3: PC Quest Gamification */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
              className="col-span-1 md:col-span-1 lg:col-span-1 md:row-span-1 relative p-8 rounded-[2.5rem] bg-white border border-border shadow-xl overflow-hidden flex flex-col justify-end hover:-translate-y-1 transition-all"
            >
              <Gamepad2 className="w-10 h-10 text-rose-500 mb-4" />
              <h3 className="text-xl font-black mb-2 text-foreground">PC Quest Map</h3>
              <p className="text-secondary text-sm font-medium">Kuis interaktif dengan peta level motherboard 2D yang seru dan menantang.</p>
            </motion.div>



            {/* Box 5: Lecturer Analytics (Full Width Bottom) */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 }}
              className="col-span-1 md:col-span-3 lg:col-span-4 md:row-span-1 relative p-8 rounded-[2.5rem] bg-white border border-border shadow-xl overflow-hidden hover:-translate-y-1 transition-all flex flex-col md:flex-row items-start md:items-center justify-between"
            >
              <div className="absolute top-1/2 left-1/2 w-full h-full bg-emerald-500/5 rounded-full -translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
              <div className="max-w-xl z-10">
                <div className="flex items-center gap-3 mb-3">
                  <BarChart2 className="w-8 h-8 text-emerald-500" />
                  <h3 className="text-2xl font-black text-foreground">Lecturer Analytics Dashboard</h3>
                </div>
                <p className="text-secondary font-medium">IRT Rasch Model (1PL): estimasi kemampuan (θ) per mahasiswa, adaptive quiz difficulty, N-Gain scoring, dan deteksi topik tersulit secara otomatis.</p>
              </div>
              <div className="mt-6 md:mt-0 z-10">
                <Database className="w-20 h-20 text-muted" />
              </div>
            </motion.div>

            {/* Box 6: AR Lab (Highlight Purple) */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.6 }}
              className="col-span-1 md:col-span-3 lg:col-span-4 md:row-span-1 relative p-8 rounded-[2.5rem] bg-gradient-to-br from-purple-600 to-violet-700 text-white shadow-xl overflow-hidden hover:-translate-y-1 transition-all flex flex-col md:flex-row items-start md:items-center justify-between"
            >
              <div className="absolute right-[-5%] bottom-[-20%] opacity-10"><CircuitBoard className="w-64 h-64 text-white/10" /></div>
              <div className="max-w-xl z-10">
                <span className="inline-block px-3 py-1 bg-white shadow-sm border border-border backdrop-blur text-foreground text-[10px] font-black uppercase rounded-full w-max mb-3">Augmented Reality</span>
                <div className="flex items-center gap-3 mb-3">
                  <CircuitBoard className="w-8 h-8 text-white" />
                  <h3 className="text-2xl font-black text-white">AR Computer Lab</h3>
                </div>
                <p className="text-purple-100 font-medium">Jelajahi komponen hardware komputer (CPU, RAM, GPU, Motherboard, dll) secara interaktif. Buka di smartphone untuk pengalaman Augmented Reality.</p>
              </div>
              <div className="mt-6 md:mt-0 z-10">
                <Link to="/ar-lab" className="px-6 py-3 bg-white text-purple-700 rounded-xl font-bold text-sm hover:scale-105 transition-all shadow-lg flex items-center gap-2 no-underline whitespace-nowrap">
                  Buka AR Lab <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* PERSONA SECTION */}
      <section id="personas" className="py-24 bg-muted border-y border-border">
        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4 text-foreground">Siapa yang Paling <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500">Terbantu?</span></h2>
            <p className="text-secondary font-medium">ARKON dirancang untuk seluruh ekosistem akademik Arsitektur Komputer.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PERSONAS.map((persona, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                className={`p-8 rounded-[2rem] border ${persona.bg} flex flex-col items-center text-center`}
              >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
                  <persona.icon className={`w-8 h-8 ${persona.color}`} />
                </div>
                <h3 className="text-xl font-black text-foreground mb-3">{persona.title}</h3>
                <p className="text-secondary text-sm font-medium">{persona.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM GAP SECTION */}
      <section className="py-24 bg-white border-y border-border">
        <div className="container mx-auto px-6 max-w-6xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-6 text-foreground">Mengapa <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">ARKON</span> Dibutuhkan?</h2>
            <p className="text-secondary text-lg max-w-2xl mx-auto font-medium">Data pendidikan vokasi dan tinggi di Indonesia menunjukkan kesenjangan infrastruktur yang nyata.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="p-8 rounded-[2rem] bg-red-50 border border-red-100 flex flex-col items-center">
              <span className="text-5xl font-black text-red-500 mb-4">78%</span>
              <p className="font-bold text-foreground mb-2">Kurang Fasilitas</p>
              <p className="text-secondary text-sm">Kampus di Indonesia kekurangan laboratorium komputer yang memadai dan up-to-date.</p>
              <span className="text-xs text-red-400 mt-4 font-bold uppercase">Sumber: BPS 2023</span>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="p-8 rounded-[2rem] bg-orange-50 border border-orange-100 flex flex-col items-center">
              <span className="text-5xl font-black text-orange-500 mb-4">Rp 500Jt+</span>
              <p className="font-bold text-foreground mb-2">Biaya Investasi Tinggi</p>
              <p className="text-secondary text-sm">Biaya rata-rata untuk membangun satu laboratorium hardware komputer yang komprehensif.</p>
              <span className="text-xs text-orange-400 mt-4 font-bold uppercase">Sumber: Kemendikbud</span>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="p-8 rounded-[2rem] bg-indigo-50 border border-indigo-100 flex flex-col items-center">
              <span className="text-5xl font-black text-indigo-500 mb-4">4.2x</span>
              <p className="font-bold text-foreground mb-2">Lebih Efektif</p>
              <p className="text-secondary text-sm">Mahasiswa terbukti lebih aktif berpartisipasi dengan metode gamified learning & simulasi.</p>
              <span className="text-xs text-indigo-600 mt-4 font-bold uppercase">Sumber: Journal of Edu Tech</span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SDGs CONTRIBUTION SECTION */}
      <section id="sdgs" className="py-32 bg-gradient-to-b from-white to-muted">
        <div className="container mx-auto px-6 max-w-6xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-6 text-foreground">Kontribusi Terhadap <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">SDGs</span></h2>
            <p className="text-secondary text-lg max-w-2xl mx-auto font-medium">ARKON berkomitmen mendukung Agenda 2030 PBB untuk pembangunan berkelanjutan.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="p-10 rounded-[3rem] bg-white border border-border shadow-xl text-left relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 -translate-y-1/2 translate-x-1/2 rounded-full" />
              <div className="w-16 h-16 bg-[#C5192D] rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-red-500/20">
                <span className="text-white font-black text-2xl">4</span>
              </div>
              <h3 className="text-2xl font-black text-[#C5192D] mb-4">Quality Education</h3>
              <p className="text-secondary font-medium leading-relaxed">
                Menghilangkan hambatan finansial bagi institusi pendidikan untuk memiliki laboratorium hardware yang mahal melalui simulasi 3D dan Augmented Reality yang dapat diakses dari perangkat apapun.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="p-10 rounded-[3rem] bg-white border border-border shadow-xl text-left relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 -translate-y-1/2 translate-x-1/2 rounded-full" />
              <div className="w-16 h-16 bg-[#F36D25] rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-orange-500/20">
                <span className="text-white font-black text-2xl">9</span>
              </div>
              <h3 className="text-2xl font-black text-[#F36D25] mb-4">Industry, Innovation & Infrastructure</h3>
              <p className="text-secondary font-medium leading-relaxed">
                Mendorong inovasi teknologi di sektor pendidikan vokasi melalui integrasi Generative AI dan Adaptive Learning Path untuk mencetak talenta digital yang kompeten di era industri 4.0.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-32 relative">
        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-foreground">Apa kata <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500">mereka?</span></h2>
            <p className="text-secondary text-lg font-medium">Testimoni dari pengguna ARKON di lingkungan akademik.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((item, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                className="p-8 rounded-[2rem] bg-white border border-border shadow-xl hover:-translate-y-2 transition-transform duration-300">
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-600" />)}
                </div>
                <p className="text-foreground/80 mb-8 leading-relaxed font-medium text-lg italic">"{item.content}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center text-white font-black text-lg shadow-md">
                    {item.avatar}
                  </div>
                  <div>
                    <p className="font-black text-foreground">{item.name}</p>
                    <p className="text-secondary text-xs font-bold uppercase tracking-wider">{item.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-32 bg-white border-y border-border">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-foreground">Pertanyaan <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500">Umum</span></h2>
          </motion.div>

          <div className="flex flex-col gap-4">
            {FAQS.map((faq, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.08 }}>
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left px-6 py-5 md:px-8 md:py-6 rounded-2xl bg-muted border border-border hover:border-primary/40 hover:shadow-lg transition-all duration-300 group cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-base md:text-lg font-bold text-foreground group-hover:text-primary transition-colors">{faq.q}</h3>
                    <ChevronDown className={`w-5 h-5 text-secondary shrink-0 transition-transform duration-300 ${openFaq === idx ? 'rotate-180 text-primary' : ''}`} />
                  </div>
                  <AnimatePresence>
                    {openFaq === idx && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <p className="pt-4 text-sm md:text-base text-secondary leading-relaxed font-medium">{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section — Tinkercad-style Dual Path */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="relative max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-primary to-indigo-700 p-8 md:p-12 text-center overflow-hidden shadow-2xl shadow-primary/30 border border-blue-400/30">

            <div className="absolute top-0 right-0 w-48 h-48 bg-white shadow-sm border border-border rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white shadow-sm border border-border rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-white mb-3 leading-tight">
                Mulai Belajar<br className="hidden sm:block" /> Arsitektur Komputer
              </h2>
              <p className="text-blue-100 text-sm md:text-base mb-8 max-w-lg mx-auto font-medium leading-relaxed">
                Pilih cara Anda untuk memulai.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                {/* Educators */}
                <Link to="/register" className="p-5 bg-white shadow-sm border border-border backdrop-blur-sm border border-border rounded-2xl hover:bg-white shadow-sm border border-border transition-all group no-underline">
                  <GraduationCap className="w-8 h-8 text-foreground mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <p className="text-foreground font-black text-sm mb-1">Dosen</p>
                  <p className="text-secondary text-[10px] font-medium">Buat Room & Kelola Kelas</p>
                </Link>
                {/* Students */}
                <Link to="/register" className="p-5 bg-white shadow-sm border border-border backdrop-blur-sm border border-border rounded-2xl hover:bg-white shadow-sm border border-border transition-all group no-underline">
                  <Users className="w-8 h-8 text-foreground mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <p className="text-foreground font-black text-sm mb-1">Mahasiswa</p>
                  <p className="text-secondary text-[10px] font-medium">Join Room via Kode</p>
                </Link>
                {/* On your own */}
                <Link to="/register" className="p-5 bg-white shadow-sm border border-border backdrop-blur-sm border border-border rounded-2xl hover:bg-white shadow-sm border border-border transition-all group no-underline">
                  <Monitor className="w-8 h-8 text-foreground mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <p className="text-foreground font-black text-sm mb-1">Mandiri</p>
                  <p className="text-secondary text-[10px] font-medium">Buat Room Pribadi</p>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-20 pb-10 border-t border-border bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/30">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-black tracking-tight text-foreground">AR<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500">KON</span></span>
              </div>
              <p className="text-secondary text-sm font-medium mb-6">Platform Edukasi Arsitektur Komputer interaktif berbasis gamifikasi dan simulasi 3D.</p>
              <div className="flex items-center gap-4">
                <a href="mailto:arkon.team@gmail.com" className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-secondary hover:text-primary hover:border-primary/30 transition-all"><Mail className="w-4 h-4" /></a>
                <a href="https://github.com/arkon-edu/arkon" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-secondary hover:text-primary hover:border-primary/30 transition-all"><Github className="w-4 h-4" /></a>
              </div>
            </div>
            <div>
              <h4 className="font-black text-sm text-foreground uppercase tracking-widest mb-6">Produk</h4>
              <ul className="space-y-4">
                <li><Link to="/cpu-simulator" className="text-sm text-secondary hover:text-primary font-medium transition-colors no-underline">CPU Simulator</Link></li>
                <li><Link to="/ar-lab" className="text-sm text-secondary hover:text-primary font-medium transition-colors no-underline">AR Hardware Lab</Link></li>
                <li><Link to="/#features" className="text-sm text-secondary hover:text-primary font-medium transition-colors no-underline">Semua Fitur</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-sm text-foreground uppercase tracking-widest mb-6">Perusahaan</h4>
              <ul className="space-y-4">
                <li><Link to="/tentang" className="text-sm text-secondary hover:text-primary font-medium transition-colors no-underline">Tentang Kami</Link></li>
                <li><Link to="/hubungi-kami" className="text-sm text-secondary hover:text-primary font-medium transition-colors no-underline">Hubungi Kami</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-sm text-foreground uppercase tracking-widest mb-6">Informasi</h4>
              <ul className="space-y-4">
                <li className="text-sm text-secondary font-medium">Versi: <strong className="text-foreground">1.0.0-pilot</strong></li>
                <li className="text-sm text-secondary font-medium">Kompetisi: <strong className="text-foreground">LIDM 2027</strong></li>
                <li className="text-sm text-secondary font-medium">Tim: <strong className="text-foreground">Kelompok 10</strong></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm font-bold text-secondary">
              © {new Date().getFullYear()} ARKON. All Rights Reserved.
            </p>
            <div className="flex gap-6">
              <Link to="/privacy" className="text-xs font-bold text-secondary hover:text-primary transition-colors no-underline">Privasi</Link>
              <Link to="/terms" className="text-xs font-bold text-secondary hover:text-primary transition-colors no-underline">Ketentuan</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}