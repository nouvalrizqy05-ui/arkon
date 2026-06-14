import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Briefcase, User, Mail, Lock, Hash, ArrowLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useToast } from '../components/Toast';

const pwStrength = pass => {
  if (!pass) return 0;
  let s = 0;
  if (pass.length > 7)         s++;
  if (/[A-Z]/.test(pass))      s++;
  if (/[0-9]/.test(pass))      s++;
  if (/[^A-Za-z0-9]/.test(pass)) s++;
  return s;
};

const STRENGTH_META = [
  { color: 'bg-slate-200', label: '' },
  { color: 'bg-red-400',   label: 'Sangat Lemah' },
  { color: 'bg-orange-400',label: 'Lemah' },
  { color: 'bg-blue-400',  label: 'Kuat' },
  { color: 'bg-emerald-500',label: 'Sangat Kuat' },
];

export default function Register() {
  const navigate = useNavigate();
  const toast = useToast();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const [role, setRole] = useState('mahasiswa');
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '', identifier_number: '', email: '', password: ''
  });

  const strength = pwStrength(formData.password);
  const meta = STRENGTH_META[strength];

  const set = (k) => (e) => setFormData(p => ({ ...p, [k]: e.target.value }));

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role })
      });
      const data = await response.json();
      if (response.ok) {
        toast.success('Registrasi berhasil! Silakan login dengan akun baru Anda.');
        setTimeout(() => navigate('/login'), 1000);
      } else {
        toast.error(data.error || 'Gagal melakukan registrasi.');
      }
    } catch { toast.error('Tidak dapat terhubung ke server.'); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex">
      {/* ── Left decorative panel ───────────────── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 flex-col justify-between p-10 relative overflow-hidden bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-200 dark:from-[#05111b] dark:via-[#081a28] dark:to-[#050f18]">
        <div className="absolute top-[-60px] right-[-60px] w-72 h-72 rounded-full"
          style={{ background: 'rgba(5,150,105,.07)' }} />
        <div className="absolute bottom-[-80px] left-[-40px] w-80 h-80 rounded-full"
          style={{ background: 'rgba(5,150,105,.05)' }} />

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-em bg-gradient-to-br from-emerald-600 to-emerald-800">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-foreground dark:text-white">
              AR<span className="text-gradient-em">KON</span>
            </span>
          </Link>
        </div>

        <div className="relative z-10 space-y-4">
          <h2 className="text-2xl font-bold text-foreground dark:text-white leading-tight">
            Mulai perjalanan<br />
            belajar <span className="text-gradient-em">AOK</span> yang menyenangkan
          </h2>
          <p className="text-secondary text-sm leading-relaxed">
            Bergabung dengan ARKON dan rasakan perbedaan belajar Arsitektur Komputer dengan simulasi interaktif, gamifikasi, dan AI yang adaptif.
          </p>
          {/* Mini benefit list */}
          <div className="space-y-2.5 pt-2">
            {[
              'Quiz adaptif berbasis IRT Rasch Model',
              'AR Hardware Lab — eksplorasi 3D komponen',
              'CPU Simulator visual Fetch-Decode-Execute',
              'Dashboard analytics untuk dosen',
            ].map(text => (
              <div key={text} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm text-foreground dark:text-slate-300">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-secondary">© 2027 ARKON — LIDM Inovasi Teknologi Digital Pendidikan</p>
      </div>

      {/* ── Right panel — form ──────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 bg-[var(--bg-primary)] overflow-y-auto">
        <div className="w-full max-w-md animate-fade-up">

          <Link to="/"
            className="inline-flex items-center gap-1.5 text-secondary hover:text-primary transition-colors text-sm font-medium mb-8 group">
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            Kembali ke beranda
          </Link>

          <h1 className="text-2xl font-bold text-foreground mb-1">Buat akun</h1>
          <p className="text-secondary text-sm mb-7">Bergabung dengan ekosistem ARKON</p>

          {/* Role toggle */}
          <div className="flex p-1 rounded-xl mb-6 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            role="radiogroup" aria-label="Pilih peran">
            {[
              { id: 'mahasiswa', label: 'Mahasiswa', Icon: GraduationCap },
              { id: 'dosen',     label: 'Dosen',      Icon: Briefcase },
            ].map(({ id, label, Icon }) => (
              <button key={id} type="button" role="radio" aria-checked={role === id}
                onClick={() => setRole(id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  role === id ? 'bg-[var(--bg-surface)] dark:bg-slate-700 text-primary shadow-sm border border-slate-200 dark:border-slate-600' : 'text-secondary hover:text-foreground dark:hover:text-white'
                }`}>
                <Icon size={16} aria-hidden="true" /> {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Full name */}
            <div>
              <label htmlFor="reg-name" className="block text-sm font-semibold text-foreground mb-1.5">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" aria-hidden="true" />
                <input id="reg-name" type="text" required value={formData.full_name} onChange={set('full_name')}
                  className="input-field pl-10" placeholder="Muhammad Nouval" />
              </div>
            </div>

            {/* NIM/NIP */}
            <div>
              <label htmlFor="reg-id" className="block text-sm font-semibold text-foreground mb-1.5">
                {role === 'mahasiswa' ? 'NIM' : 'NIP'}
              </label>
              <div className="relative">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" aria-hidden="true" />
                <input id="reg-id" type="text" required value={formData.identifier_number} onChange={set('identifier_number')}
                  className="input-field pl-10"
                  placeholder={role === 'mahasiswa' ? 'Masukkan NIM' : 'Masukkan NIP'} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-sm font-semibold text-foreground mb-1.5">Email Aktif</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" aria-hidden="true" />
                <input id="reg-email" type="email" required value={formData.email} onChange={set('email')}
                  className="input-field pl-10" placeholder="email@kampus.ac.id" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-sm font-semibold text-foreground mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" aria-hidden="true" />
                <input id="reg-password" type={showPass ? 'text' : 'password'} required
                  value={formData.password} onChange={set('password')}
                  className="input-field pl-10 pr-10" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary hover:text-foreground transition-colors"
                  aria-label={showPass ? 'Sembunyikan' : 'Tampilkan'}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Strength bar */}
              {formData.password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[1,2,3,4].map(n => (
                      <div key={n}
                        className={`h-1 flex-1 rounded-full transition-colors ${n <= strength ? meta.color : 'bg-slate-200'}`} />
                    ))}
                  </div>
                  <span className={`text-xs font-semibold ${strength > 2 ? 'text-primary' : 'text-red-500'}`}>
                    {meta.label}
                  </span>
                </div>
              )}
            </div>

            <button type="submit" disabled={isLoading}
              className="btn-primary w-full py-3 mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {isLoading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Mendaftarkan...</>
                : 'Buat Akun Sekarang'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-sm text-secondary">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
