import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Layers, ArrowLeft, Mail, Github, MapPin, Send,
  Building2, GraduationCap, FlaskConical, Newspaper, MoreHorizontal,
  Handshake, Database, MessageSquare, Globe
} from 'lucide-react';

const fadeUp = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };

const ROLE_OPTIONS = [
  { value: 'mahasiswa', label: 'Mahasiswa / Pelajar', icon: GraduationCap },
  { value: 'dosen', label: 'Dosen / Pengajar', icon: Building2 },
  { value: 'peneliti', label: 'Peneliti / Akademisi', icon: FlaskConical },
  { value: 'media', label: 'Media / Jurnalis', icon: Newspaper },
  { value: 'lainnya', label: 'Lainnya', icon: MoreHorizontal },
];

export default function HubungiKamiPage() {
  const [form, setForm] = useState({ name: '', email: '', role: '', org: '', message: '' });

  const isLoggedIn = !!localStorage.getItem('auth_token');
  const userName = localStorage.getItem('user_name');
  const userRole = localStorage.getItem('user_role');
  const dashboardPath = userRole === 'dosen' ? '/dosen' : '/mahasiswa';

  const handleMailto = () => {
    const subject = encodeURIComponent(`[ARKON Contact] dari ${form.name || 'Pengguna'} (${form.role || 'Umum'})`);
    const body = encodeURIComponent(
      `Nama: ${form.name}\nEmail: ${form.email}\nPeran: ${form.role}\nOrganisasi: ${form.org || '-'}\n\nPesan:\n${form.message}`
    );
    window.location.href = `mailto:arkon.team@gmail.com?subject=${subject}&body=${body}`;
  };

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
            <Link to="/tentang" className="text-sm font-bold text-secondary hover:text-primary transition-colors no-underline">Tentang</Link>
            <Link to="/hubungi-kami" className="text-sm font-bold text-primary transition-colors no-underline">Hubungi Kami</Link>
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

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-white to-slate-50">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div {...fadeUp}>
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-secondary hover:text-primary transition-colors no-underline mb-8">
              <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
            </Link>
            <p className="text-sm font-black text-primary uppercase tracking-widest mb-4">Hubungi Kami</p>
            <h1 className="text-4xl md:text-6xl font-black leading-[1.1] mb-6 text-foreground">
              Mari membangun <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500">pendidikan yang lebih cerdas</span> bersama
            </h1>
            <p className="text-lg text-secondary leading-relaxed max-w-3xl font-medium">
              ARKON adalah proyek riset untuk LIDM 2027. Kami terbuka untuk kolaborasi dengan institusi pendidikan, peneliti, dosen, dan siapa saja yang ingin memajukan pembelajaran Arsitektur Komputer di Indonesia.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Channels */}
      <section className="py-16 bg-white border-y border-border">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.div {...fadeUp} className="mb-12">
            <p className="text-sm font-black text-secondary uppercase tracking-widest mb-3">Saluran Kontak</p>
            <h2 className="text-2xl md:text-3xl font-black text-foreground">Cara tercepat menghubungi kami</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Mail, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200',
                title: 'Email', value: 'arkon.team@gmail.com',
                sub: 'Respons dalam 1-2 hari kerja.'
              },
              {
                icon: Github, color: 'text-foreground', bg: 'bg-slate-50 border-slate-200',
                title: 'GitHub', value: 'arkon-edu/arkon',
                sub: 'Bug report dan pull request publik.'
              },
              {
                icon: MapPin, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-200',
                title: 'Lokasi Tim', value: 'DI Yogyakarta, Indonesia',
                sub: 'Yogyakarta — basis pengembangan dan pilot deployment.'
              },
            ].map((item, idx) => (
              <motion.div key={idx} {...fadeUp} transition={{ delay: idx * 0.1 }}
                className={`p-6 rounded-[1.5rem] border ${item.bg}`}>
                <item.icon className={`w-6 h-6 ${item.color} mb-4`} />
                <h3 className="text-sm font-black text-foreground mb-1">{item.title}</h3>
                <p className="text-sm font-bold text-foreground mb-1">{item.value}</p>
                <p className="text-xs text-secondary font-medium">{item.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Form + Info Section */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left — Form */}
            <motion.div {...fadeUp}>
              <p className="text-sm font-black text-primary uppercase tracking-widest mb-3">Kirim Pesan</p>
              <h2 className="text-2xl md:text-3xl font-black text-foreground mb-2">Ceritakan kebutuhan Anda</h2>
              <p className="text-sm text-secondary font-medium mb-8">
                Isi formulir di bawah — kami akan membalas via email yang Anda cantumkan. Untuk laporan bug teknis, lampirkan langkah reproduksi atau screenshot.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Nama lengkap</label>
                  <input type="text" placeholder="Contoh: Budi Santoso"
                    className="input-field" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Email balasan</label>
                  <input type="email" placeholder="email@domain.id"
                    className="input-field" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Saya adalah</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ROLE_OPTIONS.map(role => (
                      <button key={role.value}
                        onClick={() => setForm(p => ({ ...p, role: role.value }))}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                          form.role === role.value
                            ? 'bg-primary-soft border-primary/30 text-primary'
                            : 'bg-white border-slate-200 text-secondary hover:border-primary/20'
                        }`}>
                        <role.icon className="w-3.5 h-3.5" />
                        {role.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Organisasi (opsional)</label>
                  <input type="text" placeholder="Contoh: Universitas Gadjah Mada, Dinas Pendidikan DIY"
                    className="input-field" value={form.org} onChange={e => setForm(p => ({ ...p, org: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Pesan</label>
                  <textarea rows={5} placeholder="Ceritakan kebutuhan, pertanyaan, atau ide kolaborasi Anda."
                    className="input-field resize-none" value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} />
                </div>

                <div className="bg-slate-100 border border-slate-200 rounded-xl p-3">
                  <p className="text-[11px] text-secondary font-medium">
                    <strong className="text-foreground">Catatan privasi:</strong> Formulir ini membuka aplikasi email Anda dengan isi yang sudah diformat. Tidak ada data yang dikirim ke server kami sebelum Anda menekan kirim di aplikasi email.
                  </p>
                </div>

                <button onClick={handleMailto}
                  className="btn-primary px-8 py-3 w-full text-base">
                  <Send className="w-4 h-4" /> Buka Aplikasi Email
                </button>
              </div>
            </motion.div>

            {/* Right — Collaboration Types */}
            <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
              <p className="text-sm font-black text-secondary uppercase tracking-widest mb-3">Bentuk Kolaborasi</p>
              <h2 className="text-2xl md:text-3xl font-black text-foreground mb-8">Apa yang ingin kami dengar</h2>

              <div className="space-y-5">
                {[
                  {
                    icon: Handshake, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200',
                    title: 'Kolaborasi Institusi',
                    desc: 'Universitas, politeknik, atau dinas pendidikan yang ingin uji coba ARKON sebagai media pembelajaran AOK — kami terbuka untuk pilot project.'
                  },
                  {
                    icon: Database, color: 'text-purple-500', bg: 'bg-purple-50 border-purple-200',
                    title: 'Akses Data & Riset',
                    desc: 'Akademisi atau peneliti pendidikan yang butuh akses ke data quiz, statistik IRT, atau hasil pilot study kami untuk publikasi — silakan ajukan tujuan riset.'
                  },
                  {
                    icon: MessageSquare, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-200',
                    title: 'Feedback Pengguna',
                    desc: 'Mahasiswa atau dosen yang sudah menggunakan ARKON — laporan akurasi quiz, pengalaman penggunaan, dan saran perbaikan sangat berharga untuk kami.'
                  },
                ].map((item, idx) => (
                  <div key={idx} className={`p-6 rounded-[1.5rem] border ${item.bg}`}>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                        <item.icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-foreground mb-1">{item.title}</h3>
                        <p className="text-xs text-secondary leading-relaxed font-medium">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tim Footer */}
      <section className="py-8 bg-white border-t border-border">
        <div className="container mx-auto px-6 max-w-7xl text-center">
          <p className="text-sm font-bold text-secondary">
            Tim ARKON — Kelompok 10 · DI Yogyakarta
          </p>
        </div>
      </section>
    </div>
  );
}
