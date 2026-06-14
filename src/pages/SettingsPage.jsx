import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  User, Shield, Bell, Palette, Link as LinkIcon, Eye,
  Save, AlertTriangle, Monitor, Moon, Sun, Smartphone,
  CheckCircle2, Globe, FileText, Database, ShieldAlert,
  Loader2, LogOut
} from 'lucide-react';
import { useToast } from '../components/Toast';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();

  const userRole = localStorage.getItem('user_role') || 'mahasiswa';
  const dashboardPath = userRole === 'dosen' ? '/dosen' : '/mahasiswa';
  const token = localStorage.getItem('auth_token');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Formulir pengaturan umum
  const [generalForm, setGeneralForm] = useState({
    name: '',
    email: '',
    whatsapp: '',
    language: 'id',
    timezone: 'Asia/Jakarta'
  });

  // Formulir pengaturan tampilan (appearance & accessibility)
  const [appearanceForm, setAppearanceForm] = useState({
    theme: 'system',
    density: 'comfortable',
    reducedMotion: false,
    screenReader: true,
  });

  // Formulir notifikasi
  const [notificationForm, setNotificationForm] = useState({
    emailAnnouncements: true,
    emailActivities: true,
    browserPush: false,
    sound: true
  });

  // Kata Sandi
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load Data
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/api/users/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setGeneralForm({
            name: data.full_name || '',
            email: data.email || '',
            whatsapp: data.whatsapp || '',
            language: data.language || 'id',
            timezone: data.timezone || 'Asia/Jakarta'
          });
          
          setAppearanceForm({
            theme: data.appearance_theme || 'system',
            density: data.appearance_density || 'comfortable',
            reducedMotion: data.accessibility_reduced_motion || false,
            screenReader: data.accessibility_screen_reader !== false,
          });

          setNotificationForm({
            emailAnnouncements: data.notif_email_announcements !== false,
            emailActivities: data.notif_email_activities !== false,
            browserPush: data.notif_browser_push || false,
            sound: data.notif_sound !== false
          });

          // Apply initial visual settings
          applyVisualSettings(data.appearance_theme, data.accessibility_reduced_motion);
        } else {
          toast.error('Gagal mengambil pengaturan akun.');
          const saved = localStorage.getItem('arkon_settings');
          if (saved) {
            try {
              const data = JSON.parse(saved);
              setGeneralForm({
                name: data.full_name || '',
                email: data.email || '',
                whatsapp: data.whatsapp || '',
                language: data.language || 'id',
                timezone: data.timezone || 'Asia/Jakarta'
              });
              setAppearanceForm({
                theme: data.appearance_theme || 'system',
                density: data.appearance_density || 'comfortable',
                reducedMotion: data.accessibility_reduced_motion || false,
                screenReader: data.accessibility_screen_reader !== false,
              });
              setNotificationForm({
                emailAnnouncements: data.notif_email_announcements !== false,
                emailActivities: data.notif_email_activities !== false,
                browserPush: data.notif_browser_push || false,
                sound: data.notif_sound !== false
              });
              applyVisualSettings(data.appearance_theme, data.accessibility_reduced_motion);
            } catch(e) {}
          }
        }
      } catch (err) {
        console.error(err);
        toast.error('Terjadi kesalahan saat menghubungi server.');
        const saved = localStorage.getItem('arkon_settings');
        if (saved) {
          try {
            const data = JSON.parse(saved);
            setGeneralForm({
              name: data.full_name || '',
              email: data.email || '',
              whatsapp: data.whatsapp || '',
              language: data.language || 'id',
              timezone: data.timezone || 'Asia/Jakarta'
            });
            setAppearanceForm({
              theme: data.appearance_theme || 'system',
              density: data.appearance_density || 'comfortable',
              reducedMotion: data.accessibility_reduced_motion || false,
              screenReader: data.accessibility_screen_reader !== false,
            });
            setNotificationForm({
              emailAnnouncements: data.notif_email_announcements !== false,
              emailActivities: data.notif_email_activities !== false,
              browserPush: data.notif_browser_push || false,
              sound: data.notif_sound !== false
            });
            applyVisualSettings(data.appearance_theme, data.accessibility_reduced_motion);
          } catch(e) {}
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [API_URL, token, navigate]);

  const applyVisualSettings = (theme, reducedMotion) => {
    // Theme logic - normally tailwind handles this via classes on HTML tag
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else if (theme === 'light') document.documentElement.classList.remove('dark');
    else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    // Reduced motion
    if (reducedMotion) {
      document.body.classList.add('reduced-motion');
    } else {
      document.body.classList.remove('reduced-motion');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        full_name: generalForm.name,
        email: generalForm.email,
        whatsapp: generalForm.whatsapp,
        language: generalForm.language,
        timezone: generalForm.timezone,
        
        notif_email_announcements: notificationForm.emailAnnouncements,
        notif_email_activities: notificationForm.emailActivities,
        notif_browser_push: notificationForm.browserPush,
        notif_sound: notificationForm.sound,
        
        appearance_theme: appearanceForm.theme,
        appearance_density: appearanceForm.density,
        accessibility_reduced_motion: appearanceForm.reducedMotion,
        accessibility_screen_reader: appearanceForm.screenReader
      };

      // Always save to localStorage as fallback
      localStorage.setItem('arkon_settings', JSON.stringify(payload));
      if (payload.full_name) localStorage.setItem('user_name', payload.full_name);

      // Apply visual settings immediately
      applyVisualSettings(appearanceForm.theme, appearanceForm.reducedMotion);

      // Attempt API save (non-blocking)
      try {
        const res = await fetch(`${API_URL}/api/users/settings`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          if (data.updated_name) {
            localStorage.setItem('user_name', data.updated_name);
          }
        }
      } catch (apiErr) {
        console.warn('API save failed, settings saved locally:', apiErr);
      }

      toast.success('Pengaturan berhasil disimpan!');
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan saat menyimpan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar dari akun Anda?')) {
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error('Konfirmasi kata sandi baru tidak cocok.');
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(data.error || 'Gagal mengubah kata sandi.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan jaringan.');
    }
  };

  const handleExportData = async () => {
    try {
      toast.info('Menyiapkan data ekspor Anda...');
      const res = await fetch(`${API_URL}/api/users/export-data`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Export failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `arkon-data-${new Date().getTime()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Data berhasil diekspor.');
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengekspor data.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('PERINGATAN: Apakah Anda yakin ingin menghapus akun Anda secara permanen? Semua data, riwayat pembelajaran, koin, dan progress akan hilang. Aksi ini tidak dapat dibatalkan.')) return;
    
    try {
      const res = await fetch(`${API_URL}/api/users/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success('Akun berhasil dihapus secara permanen.');
        localStorage.clear();
        navigate('/');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Gagal menghapus akun.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan jaringan.');
    }
  };

  const handleBrowserPushToggle = async (checked) => {
    if (checked) {
      if (!("Notification" in window)) {
        toast.error("Browser Anda tidak mendukung push notifications.");
        return;
      }
      
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setNotificationForm({...notificationForm, browserPush: true});
          toast.success("Notifikasi push berhasil diaktifkan.");
        } else {
          toast.error("Izin notifikasi ditolak oleh browser.");
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      setNotificationForm({...notificationForm, browserPush: false});
    }
  };

  const tabs = [
    { id: 'general', label: 'Umum', icon: User, desc: 'Profil, kontak, dan lokalisasi' },
    { id: 'accessibility', label: 'Aksesibilitas', icon: Eye, desc: 'Tampilan dan kemudahan akses' },
    { id: 'security', label: 'Privasi & Keamanan', icon: Shield, desc: 'Kata sandi dan data Anda' },
    { id: 'notifications', label: 'Notifikasi', icon: Bell, desc: 'Pengaturan pemberitahuan' },
    { id: 'appearance', label: 'Tampilan', icon: Palette, desc: 'Tema dan personalisasi dashboard' },
    { id: 'integrations', label: 'Integrasi', icon: LinkIcon, desc: 'Koneksi dengan aplikasi lain' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-primary)]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <span className="ml-3 font-semibold text-secondary">Memuat pengaturan...</span>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen">
      <div className="mb-8">
        <a href={dashboardPath} className="inline-flex items-center gap-2 text-sm font-bold text-secondary hover:text-primary transition-colors no-underline mb-6">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Kembali ke Dashboard
        </a>
        <h1 className="text-3xl font-black text-foreground dark:text-white">Pengaturan Akun</h1>
        <p className="text-secondary mt-2">Kelola preferensi akun, tampilan, dan privasi Anda di ekosistem ARKON.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar Nav */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <div className="bg-[var(--bg-surface)] rounded-3xl border border-border dark:border-slate-700 p-3 shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex flex-col items-start p-4 rounded-2xl transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-primary-soft text-primary border border-primary/20 shadow-sm'
                    : 'bg-transparent text-secondary hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 font-bold text-sm mb-1">
                  <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-primary' : 'text-slate-400'}`} />
                  {tab.label}
                </div>
                <span className={`text-[11px] pl-8 font-medium text-left ${activeTab === tab.id ? 'text-primary/70' : 'text-secondary/60'}`}>
                  {tab.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full bg-[var(--bg-surface)] rounded-3xl border border-border dark:border-slate-700 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-8 py-6 border-b border-border dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50">
            <div>
              <h2 className="text-xl font-black text-foreground dark:text-white">{tabs.find(t => t.id === activeTab)?.label}</h2>
              <p className="text-sm text-secondary font-medium">{tabs.find(t => t.id === activeTab)?.desc}</p>
            </div>
            
            {activeTab !== 'integrations' && activeTab !== 'security' && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-primary px-6 shadow-md w-full sm:w-auto"
              >
                {isSaving ? (
                  <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</span>
                ) : (
                  <span className="flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Simpan Perubahan</span>
                )}
              </button>
            )}
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
                        <select className="input-field cursor-pointer bg-[var(--bg-surface)]" value={generalForm.language} onChange={e => setGeneralForm({...generalForm, language: e.target.value})}>
                          <option value="id">Bahasa Indonesia</option>
                          <option value="en">English (US)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-secondary uppercase tracking-widest">Zona Waktu</label>
                        <select className="input-field cursor-pointer bg-[var(--bg-surface)]" value={generalForm.timezone} onChange={e => setGeneralForm({...generalForm, timezone: e.target.value})}>
                          <option value="Asia/Jakarta">WIB (Asia/Jakarta)</option>
                          <option value="Asia/Makassar">WITA (Asia/Makassar)</option>
                          <option value="Asia/Jayapura">WIT (Asia/Jayapura)</option>
                        </select>
                      </div>
                    </div>

                    <hr className="border-slate-100" />
                    
                    <div>
                      <h3 className="text-xs font-bold text-red-600 uppercase tracking-widest mb-4">Sesi Akun</h3>
                      <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 border border-red-200 bg-red-50 hover:bg-red-100 rounded-xl text-red-700 font-bold text-sm transition-colors">
                        <LogOut className="w-4 h-4" /> Keluar dari Akun (Logout)
                      </button>
                    </div>
                  </>
                )}

                {/* ── AKSESIBILITAS ── */}
                {activeTab === 'accessibility' && (
                  <>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start gap-4">
                      <div className="bg-emerald-100 p-2 rounded-xl shrink-0 hidden sm:block"><CheckCircle2 className="w-5 h-5 text-emerald-700" /></div>
                      <div>
                        <h4 className="text-sm font-bold text-emerald-900 mb-1 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-700 sm:hidden" /> Widget Aksesibilitas Aktif</h4>
                        <p className="text-xs text-emerald-800 font-medium">Anda dapat menggunakan tombol aksesibilitas mengambang di pojok kiri bawah layar untuk mengatur kontras dan ukuran teks kapan saja tanpa harus membuka halaman pengaturan.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-emerald-500/50 transition-colors gap-4">
                        <div>
                          <h4 className="text-sm font-bold text-foreground dark:text-white">Mode Dyslexia (OpenDyslexic)</h4>
                          <p className="text-xs text-secondary font-medium">Mengganti font bawaan dengan font khusus yang lebih mudah dibaca.</p>
                        </div>
                        <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-not-allowed opacity-50 shrink-0" title="Gunakan widget aksesibilitas di kiri bawah">
                          <div className="w-4 h-4 bg-[var(--bg-surface)] rounded-full absolute left-1 top-1" />
                        </div>
                      </div>
                      <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-emerald-500/50 transition-colors cursor-pointer gap-4">
                        <div>
                          <h4 className="text-sm font-bold text-foreground dark:text-white">Kurangi Animasi (Reduced Motion)</h4>
                          <p className="text-xs text-secondary font-medium">Mematikan animasi mengambang, parallax, dan transisi berat di seluruh aplikasi.</p>
                        </div>
                        <div className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input type="checkbox" className="sr-only peer" checked={appearanceForm.reducedMotion} onChange={e => setAppearanceForm({...appearanceForm, reducedMotion: e.target.checked})} />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--bg-surface)] after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </div>
                      </label>
                      <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-emerald-500/50 transition-colors cursor-pointer gap-4">
                        <div>
                          <h4 className="text-sm font-bold text-foreground dark:text-white">Dukungan Screen Reader Khusus</h4>
                          <p className="text-xs text-secondary font-medium">Mengaktifkan aria-labels tambahan pada elemen grafis kompleks seperti CPU Simulator.</p>
                        </div>
                        <div className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input type="checkbox" className="sr-only peer" checked={appearanceForm.screenReader} onChange={e => setAppearanceForm({...appearanceForm, screenReader: e.target.checked})} />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--bg-surface)] after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </div>
                      </label>
                    </div>
                  </>
                )}

                {/* ── PRIVASI & KEAMANAN ── */}
                {activeTab === 'security' && (
                  <>
                    <div className="space-y-6">
                      <form onSubmit={handleChangePassword}>
                        <h3 className="text-sm font-black text-foreground dark:text-white mb-4">Ubah Kata Sandi</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input type="password" required placeholder="Kata sandi saat ini" className="input-field" value={passwordForm.currentPassword} onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})} />
                          <div className="hidden md:block" />
                          <input type="password" required minLength="6" placeholder="Kata sandi baru" className="input-field" value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} />
                          <input type="password" required minLength="6" placeholder="Konfirmasi kata sandi baru" className="input-field" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} />
                        </div>
                        <button type="submit" className="mt-4 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors">Perbarui Kata Sandi</button>
                      </form>
                      <hr className="border-slate-100" />
                      <div>
                        <h3 className="text-sm font-black text-foreground dark:text-white mb-4">Autentikasi Dua Langkah (2FA)</h3>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-slate-50 border border-slate-200 rounded-2xl gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center shrink-0"><Smartphone className="w-5 h-5 text-slate-500" /></div>
                            <div>
                              <p className="font-bold text-sm text-foreground dark:text-white">Aplikasi Authenticator</p>
                              <p className="text-xs text-secondary font-medium">Belum diaktifkan. Fitur ini masih dalam tahap beta (LIDM mode).</p>
                            </div>
                          </div>
                          <button onClick={() => toast.info('Fitur 2FA belum tersedia untuk versi demo.')} className="px-4 py-2 bg-[var(--bg-surface)] border border-slate-300 text-foreground dark:text-white font-bold text-xs rounded-xl shadow-sm hover:bg-slate-50 transition-colors shrink-0">Aktifkan</button>
                        </div>
                      </div>
                      <hr className="border-slate-100" />
                      <div>
                        <h3 className="text-sm font-black text-red-600 mb-4 flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Zona Berbahaya</h3>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <button onClick={handleExportData} className="flex-1 flex items-center justify-center gap-2 p-4 border border-slate-200 hover:bg-slate-50 rounded-2xl text-foreground dark:text-white font-bold text-sm transition-colors">
                            <Database className="w-4 h-4" /> Ekspor Data Pribadi
                          </button>
                          <button onClick={handleDeleteAccount} className="flex-1 flex items-center justify-center gap-2 p-4 border border-red-200 bg-red-50 hover:bg-red-100 rounded-2xl text-red-700 font-bold text-sm transition-colors">
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
                      <label className="flex items-center justify-between mb-4 cursor-pointer">
                        <div>
                          <h4 className="font-bold text-sm text-foreground dark:text-white">Suara dalam Aplikasi</h4>
                          <p className="text-xs text-secondary font-medium">Bunyikan efek suara saat kuis selesai, badge didapat, atau chat masuk.</p>
                        </div>
                        <div className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                          <input type="checkbox" className="sr-only peer" checked={notificationForm.sound} onChange={e => setNotificationForm({...notificationForm, sound: e.target.checked})} />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--bg-surface)] after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </div>
                      </label>
                      <hr className="border-slate-100 my-4" />
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <h4 className="font-bold text-sm text-foreground dark:text-white">Browser Push Notifications</h4>
                          <p className="text-xs text-secondary font-medium">Terima notifikasi di desktop Anda meskipun ARKON tidak sedang dibuka.</p>
                        </div>
                        <div className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                          <input type="checkbox" className="sr-only peer" checked={notificationForm.browserPush} onChange={e => handleBrowserPushToggle(e.target.checked)} />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--bg-surface)] after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </div>
                      </label>
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-foreground dark:text-white mb-4">Preferensi Email</h3>
                      <div className="space-y-3">
                        <label className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors">
                          <input type="checkbox" className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" checked={notificationForm.emailAnnouncements} onChange={e => setNotificationForm({...notificationForm, emailAnnouncements: e.target.checked})} />
                          <div>
                            <p className="font-bold text-sm text-foreground dark:text-white">Pengumuman Sistem & Update</p>
                            <p className="text-xs text-secondary">Berita tentang fitur baru ARKON dan pengumuman LIDM.</p>
                          </div>
                        </label>
                        <label className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors">
                          <input type="checkbox" className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" checked={notificationForm.emailActivities} onChange={e => setNotificationForm({...notificationForm, emailActivities: e.target.checked})} />
                          <div>
                            <p className="font-bold text-sm text-foreground dark:text-white">Aktivitas Kelas</p>
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
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                          { id: 'light', icon: Sun, label: 'Terang', bg: 'bg-slate-50 border-slate-200' },
                          { id: 'dark', icon: Moon, label: 'Gelap', bg: 'bg-slate-900 border-slate-800 text-white' },
                          { id: 'system', icon: Monitor, label: 'Sistem', bg: 'bg-gradient-to-br from-slate-100 to-slate-200 border-slate-300 text-slate-800' },
                        ].map(theme => (
                          <button
                            key={theme.id}
                            onClick={() => setAppearanceForm({...appearanceForm, theme: theme.id})}
                            className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                              appearanceForm.theme === theme.id ? 'border-emerald-500 ring-4 ring-emerald-500/10' : 'border-transparent opacity-80 hover:opacity-100 hover:border-slate-400'
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          onClick={() => setAppearanceForm({...appearanceForm, density: 'comfortable'})}
                          className={`p-4 rounded-2xl border-2 text-left transition-all ${appearanceForm.density === 'comfortable' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:border-slate-300'}`}
                        >
                          <span className="font-bold text-sm block mb-1 text-foreground">Nyaman (Comfortable)</span>
                          <span className="text-xs text-secondary block">Lebih banyak ruang putih, elemen lebih besar. Cocok untuk layar sentuh.</span>
                        </button>
                        <button
                          onClick={() => setAppearanceForm({...appearanceForm, density: 'compact'})}
                          className={`p-4 rounded-2xl border-2 text-left transition-all ${appearanceForm.density === 'compact' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:border-slate-300'}`}
                        >
                          <span className="font-bold text-sm block mb-1 text-foreground">Padat (Compact)</span>
                          <span className="text-xs text-secondary block">Spasi lebih rapat, informasi lebih padat. Cocok untuk layar kecil/desktop.</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── INTEGRASI ── */}
                {activeTab === 'integrations' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-200 rounded-2xl hover:border-slate-300 transition-colors gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500 text-white rounded-xl flex items-center justify-center font-bold text-xl shrink-0">G</div>
                        <div>
                          <h4 className="font-bold text-sm text-foreground dark:text-white">Google Calendar</h4>
                          <p className="text-xs text-secondary font-medium">Sinkronisasi deadline tugas dan jadwal Live Quiz ke kalender Anda.</p>
                        </div>
                      </div>
                      <button onClick={() => toast.info('Fitur Integrasi segera hadir!')} className="px-4 py-2 border border-slate-300 text-foreground dark:text-white font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors shrink-0">Hubungkan</button>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-200 rounded-2xl hover:border-slate-300 transition-colors gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-sky-500 text-white rounded-xl flex items-center justify-center font-bold text-xl shrink-0"><Globe className="w-6 h-6" /></div>
                        <div>
                          <h4 className="font-bold text-sm text-foreground dark:text-white">Cloud Storage (Drive/OneDrive)</h4>
                          <p className="text-xs text-secondary font-medium">Simpan dan lampirkan file tugas langsung dari cloud Anda.</p>
                        </div>
                      </div>
                      <button onClick={() => toast.info('Fitur Integrasi segera hadir!')} className="px-4 py-2 border border-slate-300 text-foreground dark:text-white font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors shrink-0">Hubungkan</button>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-200 rounded-2xl hover:border-slate-300 transition-colors gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-xl shrink-0"><FileText className="w-6 h-6" /></div>
                        <div>
                          <h4 className="font-bold text-sm text-foreground dark:text-white">Aplikasi Catatan (Notion/Evernote)</h4>
                          <p className="text-xs text-secondary font-medium">Ekspor transkrip RAG AI dan ringkasan kelas ke aplikasi catatan Anda.</p>
                        </div>
                      </div>
                      <button onClick={() => toast.info('Fitur Integrasi segera hadir!')} className="px-4 py-2 border border-slate-300 text-foreground dark:text-white font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors shrink-0">Hubungkan</button>
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
