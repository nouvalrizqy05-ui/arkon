import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Briefcase, Hash, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../components/Toast';

export default function Login() {
  const navigate = useNavigate();
  const toast = useToast();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const [role, setRole] = useState('mahasiswa');
  const [formData, setFormData] = useState({ identifier_number: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);
  const [tempEmail, setTempEmail] = useState('');
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    const reason = localStorage.getItem('logout_reason');
    if (reason) { toast.warning(reason); localStorage.removeItem('logout_reason'); }
  }, []);

  const handleResendVerification = async () => {
    if (!tempEmail) return;
    try {
      const res = await fetch(`${API_URL}/api/resend-verification`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: tempEmail })
      });
      if (res.ok) { toast.success('Email verifikasi baru telah dikirim!'); setShowResendButton(false); }
      else toast.error('Gagal mengirim ulang email.');
    } catch { toast.error('Kesalahan server.'); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier_number: formData.identifier_number, password: formData.password })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('user_id', data.user.id);
        localStorage.setItem('user_name', data.user.full_name);
        localStorage.setItem('user_role', data.user.role);
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('refresh_token', data.refreshToken);
        toast.success(`Selamat datang, ${data.user.full_name}!`);
        setTimeout(() => {
          if (data.user.role === 'mahasiswa') navigate('/workspace');
          else if (data.user.role === 'dosen') navigate('/lecturer-dashboard');
          else toast.error('Role tidak dikenali.');
        }, 500);
      } else {
        if (data.needs_verification) { toast.error(data.error); setTempEmail(data.email); setShowResendButton(true); }
        else toast.error(data.error || 'Login gagal. Periksa kembali kredensial Anda.');
      }
    } catch { toast.error('Tidak dapat terhubung ke server.'); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* ── Left panel — branding ───────────────── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 flex-col justify-between p-10 relative overflow-hidden bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-200 dark:from-[#05111b] dark:via-[#081a28] dark:to-[#050f18]">
        {/* Layered depth circles */}
        <div className="absolute top-[-80px] right-[-80px] w-80 h-80 rounded-full"
          style={{ background: 'rgba(5,150,105,.08)' }} />
        <div className="absolute bottom-[-60px] left-[-60px] w-64 h-64 rounded-full"
          style={{ background: 'rgba(5,150,105,.06)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
          style={{ background: 'rgba(255,255,255,.35)', backdropFilter: 'blur(1px)' }} />

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-em bg-gradient-to-br from-emerald-600 to-emerald-800">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-foreground dark:text-white">
              AR<span className="text-gradient-em">KON</span>
            </span>
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          {/* Overlapping feature cards */}
          <div className="relative h-52">
            <div className="absolute top-0 left-4 right-4 card p-4 border-l-4 border-primary">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">IRT Adaptive Learning</p>
              <p className="text-sm text-secondary">Quiz menyesuaikan kesulitan secara real-time berdasarkan kemampuan θ kamu.</p>
            </div>
            <div className="absolute top-12 left-0 right-8 card p-4 shadow-float z-10">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">AR Hardware Lab</p>
              <p className="text-sm text-secondary">Eksplorasi komponen PC dalam 3D — dari CPU hingga Memory Hierarchy.</p>
            </div>
            <div className="absolute top-24 left-8 right-0 card p-4 border-l-4" style={{ borderColor: '#0ea5e9' }}>
              <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-1">CPU Simulator</p>
              <p className="text-sm text-secondary">Tulis assembly & lihat siklus Fetch-Decode-Execute berjalan visual.</p>
            </div>
          </div>
          <p className="text-xs text-secondary font-medium">
            Platform edukasi Arsitektur Komputer berbasis Stallings COA edisi 10.
            Dirancang untuk mahasiswa Teknik Informatika Semester 3–4.
          </p>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-secondary">© 2027 ARKON — LIDM Inovasi Teknologi Digital Pendidikan</p>
        </div>
      </div>

      {/* ── Right panel — form ──────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 bg-[var(--bg-primary)]">
        <div className="w-full max-w-md animate-fade-up">

          {/* Back link */}
          <Link to="/"
            className="inline-flex items-center gap-1.5 text-secondary hover:text-primary transition-colors text-sm font-medium mb-8 group">
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            Kembali ke beranda
          </Link>

          <h1 className="text-2xl font-bold text-foreground mb-1">Selamat datang kembali</h1>
          <p className="text-secondary text-sm mb-7">Masuk ke ARKON Workspace kamu</p>

          {/* Role toggle */}
          <div className="flex p-1 rounded-xl mb-7 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            role="radiogroup" aria-label="Pilih peran">
            {[
              { id: 'mahasiswa', label: 'Mahasiswa', Icon: GraduationCap },
              { id: 'dosen',     label: 'Dosen',      Icon: Briefcase },
            ].map(({ id, label, Icon }) => (
              <button key={id} type="button" role="radio" aria-checked={role === id}
                onClick={() => setRole(id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  role === id
                    ? 'bg-white dark:bg-slate-700 text-primary shadow-sm border border-slate-200 dark:border-slate-600'
                    : 'text-secondary hover:text-foreground'
                }`}>
                <Icon size={16} aria-hidden="true" /> {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Identifier */}
            <div>
              <label htmlFor="login-id" className="block text-sm font-semibold text-foreground mb-1.5">
                {role === 'mahasiswa' ? 'NIM' : 'NIP'}
              </label>
              <div className="relative">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" aria-hidden="true" />
                <input id="login-id" type="text" required
                  value={formData.identifier_number}
                  onChange={e => setFormData({ ...formData, identifier_number: e.target.value })}
                  className="input-field pl-10"
                  placeholder={role === 'mahasiswa' ? 'Masukkan NIM Anda' : 'Masukkan NIP Anda'} />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="login-password" className="text-sm font-semibold text-foreground">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary font-medium hover:underline">
                  Lupa password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" aria-hidden="true" />
                <input id="login-password" type={showPass ? 'text' : 'password'} required
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary hover:text-foreground transition-colors"
                  aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={isLoading}
              className="btn-primary w-full py-3 mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {isLoading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Memeriksa...</>
                : 'Masuk Sekarang'}
            </button>
          </form>

          {showResendButton && (
            <button onClick={handleResendVerification}
              className="w-full mt-3 text-sm text-primary underline font-medium hover:text-primary-hover transition-colors">
              Kirim ulang email verifikasi
            </button>
          )}

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-sm text-secondary">
              Belum punya akun?{' '}
              <Link to="/register" className="text-primary font-semibold hover:underline">Daftar di sini</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
