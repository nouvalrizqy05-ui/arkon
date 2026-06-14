import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Layers, ArrowLeft, Mail, Github, MapPin, Send,
  Building2, GraduationCap, FlaskConical, Newspaper, MoreHorizontal,
  Users, Database, MessageSquare, Globe
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

  const checkToken = () => {
    const t = localStorage.getItem('auth_token');
    if (!t) return false;
    try {
      const base64Url = t.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const pad = base64.length % 4;
      const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
      const payload = JSON.parse(atob(padded));
      if (payload.exp * 1000 > Date.now()) return true;
    } catch(e) {}
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    return false;
  };
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
                            : 'bg-[var(--bg-surface)] border-slate-200 text-secondary hover:border-primary/20'
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
                    icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200',
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
                      <div className="w-10 h-10 rounded-xl bg-[var(--bg-surface)] border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
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
      <section className="py-8 bg-[var(--bg-surface)] border-t border-border">
        <div className="container mx-auto px-6 max-w-7xl text-center">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Tim ARKON — Kelompok 10 · Semarang
          </p>
        </div>
      </section>
    </div>
  );
}
