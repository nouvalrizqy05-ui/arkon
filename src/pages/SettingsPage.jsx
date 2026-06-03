import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Shield, Bell, Palette, Link as LinkIcon, Eye,
  Save, AlertTriangle, Monitor, Moon, Sun, Smartphone,
  CheckCircle2, Globe, FileText, Database, ShieldAlert
} from 'lucide-react';
import { useToast } from '../components/Toast';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const userRole = localStorage.getItem('user_role') || 'mahasiswa';
  const userName = localStorage.getItem('user_name') || 'Pengguna';

  // State form
  const [generalForm, setGeneralForm] = useState({
    name: userName,
    email: 'email@domain.com',
    whatsapp: '',
    language: 'id',
    timezone: 'Asia/Jakarta'
  });

  const [appearanceForm, setAppearanceForm] = useState({
    theme: 'system',
    density: 'comfortable',
    reducedMotion: false
  });

  const [notificationForm, setNotificationForm] = useState({
    emailAnnouncements: true,
    emailActivities: true,
    browserPush: false,
    sound: true
  });

  const dashboardPath = userRole === 'dosen' ? '/dosen' : '/mahasiswa';

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Pengaturan berhasil disimpan!');
    }, 800);
  };

  const tabs = [
    { id: 'general', label: 'Umum', icon: User, desc: 'Profil, kontak, dan lokalisasi' },
    { id: 'accessibility', label: 'Aksesibilitas', icon: Eye, desc: 'Tampilan dan kemudahan akses' },
    { id: 'security', label: 'Privasi & Keamanan', icon: Shield, desc: 'Kata sandi dan data Anda' },
    { id: 'notifications', label: 'Notifikasi', icon: Bell, desc: 'Pengaturan pemberitahuan' },
    { id: 'appearance', label: 'Tampilan', icon: Palette, desc: 'Tema dan personalisasi dashboard' },
    { id: 'integrations', label: 'Integrasi', icon: LinkIcon, desc: 'Koneksi dengan aplikasi lain' },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen">
      <div className="mb-8">
        <a href={dashboardPath} className="inline-flex items-center gap-2 text-sm font-bold text-secondary hover:text-primary transition-colors no-underline mb-6">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Kembali ke Dashboard
        </a>
        <h1 className="text-3xl font-black text-foreground">Pengaturan Akun</h1>
        <p className="text-secondary mt-2">Kelola preferensi akun, tampilan, dan privasi Anda di ekosistem ARKON.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar Nav */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <div className="bg-white rounded-3xl border border-slate-200 p-3 shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex flex-col items-start p-4 rounded-2xl transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-primary-soft text-primary border border-primary/20 shadow-sm'
                    : 'bg-transparent text-secondary hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 font-bold text-sm mb-1">
                  <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-primary' : 'text-slate-400'}`} />
                  {tab.label}
                </div>
                <span className={`text-[11px] pl-8 font-medium ${activeTab === tab.id ? 'text-primary/70' : 'text-slate-400'}`}>
                  {tab.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="text-xl font-black text-foreground">{tabs.find(t => t.id === activeTab)?.label}</h2>
              <p className="text-sm text-secondary font-medium">{tabs.find(t => t.id === activeTab)?.desc}</p>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary px-6 shadow-md"
            >
              {isSaving ? (
                <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan...</span>
              ) : (
                <span className="flex items-center gap-2"><Save className="w-4 h-4" /> Simpan Perubahan</span>
              )}
            </button>
          </div>

          {/* Form Content */}
          <div className="p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {/* ── UMUM ── */}
                {activeTab === 'general' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-secondary uppercase tracking-widest">Nama Lengkap</label>
                        <input type="text" className="input-field" value={generalForm.name} onChange={e => setGeneralForm({...generalForm, name: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-secondary uppercase tracking-widest">Peran Akun</label>
                        <input type="text" className="input-field bg-slate-100 text-slate-500 cursor-not-allowed capitalize" value={userRole} disabled />
                        <p className="text-[10px] text-slate-400 font-medium">Peran tidak dapat diubah setelah pendaftaran.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-secondary uppercase tracking-widest">Email</label>
                        <input type="email" className="input-field" value={generalForm.email} onChange={e => setGeneralForm({...generalForm, email: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-secondary uppercase tracking-widest">Nomor WhatsApp (Opsional)</label>
                        <input type="tel" className="input-field" placeholder="+62..." value={generalForm.whatsapp} onChange={e => setGeneralForm({...generalForm, whatsapp: e.target.value})} />
                      </div>
                    </div>

                    <hr className="border-slate-100" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-secondary uppercase tracking-widest">Bahasa Antarmuka</label>
                        <select className="input-field cursor-pointer" value={generalForm.language} onChange={e => setGeneralForm({...generalForm, language: e.target.value})}>
                          <option value="id">Bahasa Indonesia</option>
                          <option value="en">English (US)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-secondary uppercase tracking-widest">Zona Waktu</label>
                        <select className="input-field cursor-pointer" value={generalForm.timezone} onChange={e => setGeneralForm({...generalForm, timezone: e.target.value})}>
                          <option value="Asia/Jakarta">WIB (Asia/Jakarta)</option>
                          <option value="Asia/Makassar">WITA (Asia/Makassar)</option>
                          <option value="Asia/Jayapura">WIT (Asia/Jayapura)</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* ── AKSESIBILITAS ── */}
                {activeTab === 'accessibility' && (
                  <>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-4">
                      <div className="bg-emerald-100 p-2 rounded-xl shrink-0"><CheckCircle2 className="w-5 h-5 text-emerald-700" /></div>
                      <div>
                        <h4 className="text-sm font-bold text-emerald-900 mb-1">Widget Aksesibilitas Aktif</h4>
                        <p className="text-xs text-emerald-800 font-medium">Anda dapat menggunakan tombol aksesibilitas mengambang di pojok kiri bawah layar untuk mengatur kontras dan ukuran teks kapan saja tanpa harus membuka halaman pengaturan.</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-emerald-500/50 transition-colors">
                        <div>
                          <h4 className="text-sm font-bold text-foreground">Mode Dyslexia (OpenDyslexic)</h4>
                          <p className="text-xs text-secondary font-medium">Mengganti font bawaan dengan font khusus yang lebih mudah dibaca.</p>
                        </div>
                        <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-not-allowed opacity-50">
                          <div className="w-4 h-4 bg-white rounded-full absolute left-1 top-1" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-emerald-500/50 transition-colors">
                        <div>
                          <h4 className="text-sm font-bold text-foreground">Kurangi Animasi (Reduced Motion)</h4>
                          <p className="text-xs text-secondary font-medium">Mematikan animasi mengambang, parallax, dan transisi berat di seluruh aplikasi.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={appearanceForm.reducedMotion} onChange={e => setAppearanceForm({...appearanceForm, reducedMotion: e.target.checked})} />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-emerald-500/50 transition-colors">
                        <div>
                          <h4 className="text-sm font-bold text-foreground">Dukungan Screen Reader Khusus</h4>
                          <p className="text-xs text-secondary font-medium">Mengaktifkan aria-labels tambahan pada elemen grafis kompleks seperti CPU Simulator.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {/* ── PRIVASI & KEAMANAN ── */}
                {activeTab === 'security' && (
                  <>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-black text-foreground mb-4">Ubah Kata Sandi</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input type="password" placeholder="Kata sandi saat ini" className="input-field" />
                          <div />
                          <input type="password" placeholder="Kata sandi baru" className="input-field" />
                          <input type="password" placeholder="Konfirmasi kata sandi baru" className="input-field" />
                        </div>
                        <button className="mt-4 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors">Perbarui Kata Sandi</button>
                      </div>
                      <hr className="border-slate-100" />
                      <div>
                        <h3 className="text-sm font-black text-foreground mb-4">Autentikasi Dua Langkah (2FA)</h3>
                        <div className="flex items-center justify-between p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                          <div className="flex gap-4">
                            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center"><Smartphone className="w-5 h-5 text-slate-500" /></div>
                            <div>
                              <p className="font-bold text-sm text-foreground">Aplikasi Authenticator</p>
                              <p className="text-xs text-secondary font-medium">Belum diaktifkan. Gunakan Google Authenticator atau Authy.</p>
                            </div>
                          </div>
                          <button className="px-4 py-2 bg-white border border-slate-300 text-foreground font-bold text-xs rounded-xl shadow-sm hover:bg-slate-50 transition-colors">Aktifkan</button>
                        </div>
                      </div>
                      <hr className="border-slate-100" />
                      <div>
                        <h3 className="text-sm font-black text-red-600 mb-4 flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Zona Berbahaya</h3>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <button className="flex-1 flex items-center justify-center gap-2 p-4 border border-slate-200 hover:bg-slate-50 rounded-2xl text-foreground font-bold text-sm transition-colors">
                            <Database className="w-4 h-4" /> Ekspor Data Pribadi
                          </button>
                          <button className="flex-1 flex items-center justify-center gap-2 p-4 border border-red-200 bg-red-50 hover:bg-red-100 rounded-2xl text-red-700 font-bold text-sm transition-colors">
                            <AlertTriangle className="w-4 h-4" /> Hapus Akun Permanen
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ── NOTIFIKASI ── */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div className="p-5 border border-slate-200 rounded-2xl">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-bold text-sm text-foreground">Suara dalam Aplikasi</h4>
                          <p className="text-xs text-secondary font-medium">Bunyikan efek suara saat kuis selesai, badge didapat, atau chat masuk.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={notificationForm.sound} onChange={e => setNotificationForm({...notificationForm, sound: e.target.checked})} />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </div>
                      <hr className="border-slate-100 my-4" />
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-bold text-sm text-foreground">Browser Push Notifications</h4>
                          <p className="text-xs text-secondary font-medium">Terima notifikasi di desktop Anda meskipun ARKON tidak sedang dibuka.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={notificationForm.browserPush} onChange={e => setNotificationForm({...notificationForm, browserPush: e.target.checked})} />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-foreground mb-4">Preferensi Email</h3>
                      <div className="space-y-3">
                        <label className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors">
                          <input type="checkbox" className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" checked={notificationForm.emailAnnouncements} onChange={e => setNotificationForm({...notificationForm, emailAnnouncements: e.target.checked})} />
                          <div>
                            <p className="font-bold text-sm text-foreground">Pengumuman Sistem & Update</p>
                            <p className="text-xs text-secondary">Berita tentang fitur baru ARKON dan pengumuman LIDM.</p>
                          </div>
                        </label>
                        <label className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors">
                          <input type="checkbox" className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" checked={notificationForm.emailActivities} onChange={e => setNotificationForm({...notificationForm, emailActivities: e.target.checked})} />
                          <div>
                            <p className="font-bold text-sm text-foreground">Aktivitas Kelas</p>
                            <p className="text-xs text-secondary">Tugas baru dari dosen, penilaian, dan pesan penting di Room.</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAMPILAN ── */}
                {activeTab === 'appearance' && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xs font-bold text-secondary uppercase tracking-widest mb-4">Tema Aplikasi</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { id: 'light', icon: Sun, label: 'Terang', bg: 'bg-slate-50 border-slate-200' },
                          { id: 'dark', icon: Moon, label: 'Gelap', bg: 'bg-slate-900 border-slate-800 text-white' },
                          { id: 'system', icon: Monitor, label: 'Sistem', bg: 'bg-gradient-to-br from-slate-100 to-slate-200 border-slate-300' },
                        ].map(theme => (
                          <button
                            key={theme.id}
                            onClick={() => setAppearanceForm({...appearanceForm, theme: theme.id})}
                            className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                              appearanceForm.theme === theme.id ? 'border-emerald-500 ring-4 ring-emerald-500/10' : 'border-transparent'
                            } ${theme.bg}`}
                          >
                            <theme.icon className="w-6 h-6" />
                            <span className="font-bold text-sm">{theme.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-xs font-bold text-secondary uppercase tracking-widest mb-4">Kepadatan UI (Density)</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setAppearanceForm({...appearanceForm, density: 'comfortable'})}
                          className={`p-4 rounded-2xl border-2 text-left transition-all ${appearanceForm.density === 'comfortable' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:border-slate-300'}`}
                        >
                          <span className="font-bold text-sm block mb-1">Nyaman (Nyaman)</span>
                          <span className="text-xs text-secondary block">Lebih banyak ruang putih, elemen lebih besar. Cocok untuk layar sentuh.</span>
                        </button>
                        <button
                          onClick={() => setAppearanceForm({...appearanceForm, density: 'compact'})}
                          className={`p-4 rounded-2xl border-2 text-left transition-all ${appearanceForm.density === 'compact' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:border-slate-300'}`}
                        >
                          <span className="font-bold text-sm block mb-1">Padat (Compact)</span>
                          <span className="text-xs text-secondary block">Spasi lebih rapat, informasi lebih padat. Cocok untuk layar kecil/desktop.</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── INTEGRASI ── */}
                {activeTab === 'integrations' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-5 border border-slate-200 rounded-2xl hover:border-slate-300 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500 text-white rounded-xl flex items-center justify-center font-bold text-xl">G</div>
                        <div>
                          <h4 className="font-bold text-sm text-foreground">Google Calendar</h4>
                          <p className="text-xs text-secondary font-medium">Sinkronisasi deadline tugas dan jadwal Live Quiz ke kalender Anda.</p>
                        </div>
                      </div>
                      <button className="px-4 py-2 border border-slate-300 text-foreground font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors">Hubungkan</button>
                    </div>
                    
                    <div className="flex items-center justify-between p-5 border border-slate-200 rounded-2xl hover:border-slate-300 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-sky-500 text-white rounded-xl flex items-center justify-center font-bold text-xl"><Globe className="w-6 h-6" /></div>
                        <div>
                          <h4 className="font-bold text-sm text-foreground">Cloud Storage (Drive/OneDrive)</h4>
                          <p className="text-xs text-secondary font-medium">Simpan dan lampirkan file tugas langsung dari cloud Anda.</p>
                        </div>
                      </div>
                      <button className="px-4 py-2 border border-slate-300 text-foreground font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors">Hubungkan</button>
                    </div>

                    <div className="flex items-center justify-between p-5 border border-slate-200 rounded-2xl hover:border-slate-300 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-xl"><FileText className="w-6 h-6" /></div>
                        <div>
                          <h4 className="font-bold text-sm text-foreground">Aplikasi Catatan (Notion/Evernote)</h4>
                          <p className="text-xs text-secondary font-medium">Ekspor transkrip RAG AI dan ringkasan kelas ke aplikasi catatan Anda.</p>
                        </div>
                      </div>
                      <button className="px-4 py-2 border border-slate-300 text-foreground font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors">Hubungkan</button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
