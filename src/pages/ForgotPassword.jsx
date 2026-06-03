import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Send, Lock, CheckCircle2 } from 'lucide-react';
import { useToast } from '../components/Toast';

export default function ForgotPassword() {
  const toast = useToast();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  
  const [step, setStep] = useState(1); // 1 = Input Email, 2 = Input New Password
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckEmail = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Email ditemukan, silakan masukkan sandi baru.');
        setStep(2);
      } else {
        toast.error(data.error || 'Email tidak terdaftar.');
      }
    } catch (error) {
      toast.error('Tidak dapat terhubung ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      return toast.error('Konfirmasi kata sandi tidak cocok.');
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/direct-reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Kata sandi berhasil diubah!');
        navigate('/login');
      } else {
        toast.error(data.error || 'Gagal mengubah kata sandi.');
      }
    } catch (error) {
      toast.error('Tidak dapat terhubung ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#080C1A] transition-colors relative">
      <div className="bg-white dark:bg-white p-8 md:p-10 rounded-3xl shadow-xl w-full max-w-md border border-border dark:border-border relative overflow-hidden">
        {step === 1 ? (
          <Link 
            to="/login" 
            className="absolute top-6 left-6 flex items-center gap-2 text-secondary hover:text-primary transition-colors text-sm font-bold group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>Kembali ke Login</span>
          </Link>
        ) : (
          <button 
            onClick={() => setStep(1)}
            className="absolute top-6 left-6 flex items-center gap-2 text-secondary hover:text-primary transition-colors text-sm font-bold group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>Kembali ke Email</span>
          </button>
        )}

        <div className="flex flex-col items-center mb-8 mt-10 text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 text-primary">
            {step === 1 ? <Mail className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {step === 1 ? 'Lupa Password?' : 'Sandi Baru'}
          </h1>
          <p className="text-secondary text-sm mt-2 px-4">
            {step === 1 
              ? 'Masukkan email akun Anda. Kami akan memeriksa apakah email tersebut terdaftar.'
              : `Ubah sandi untuk akun: ${email}`
            }
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleCheckEmail} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-foreground mb-2">
                Email Anda
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                <input 
                  id="email"
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-border dark:border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-slate-50 dark:bg-[#080C1A] text-sm font-medium dark:text-foreground" 
                  placeholder="Masukkan email terdaftar" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3.5 bg-primary text-foreground rounded-2xl font-bold hover:bg-primary-hover transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/30 disabled:opacity-50"
            >
              {isLoading ? 'Memeriksa...' : (
                <>
                  <Send size={18} />
                  Lanjut
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label htmlFor="new-password" className="block text-sm font-bold text-foreground mb-2">
                Kata Sandi Baru
              </label>
              <div className="relative mb-4">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                <input 
                  id="new-password"
                  type="password" 
                  required 
                  minLength="6"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-border dark:border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-slate-50 dark:bg-[#080C1A] text-sm font-medium dark:text-foreground" 
                  placeholder="Minimal 6 karakter" 
                />
              </div>

              <label htmlFor="confirm-password" className="block text-sm font-bold text-foreground mb-2">
                Konfirmasi Kata Sandi Baru
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                <input 
                  id="confirm-password"
                  type="password" 
                  required 
                  minLength="6"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-border dark:border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-slate-50 dark:bg-[#080C1A] text-sm font-medium dark:text-foreground" 
                  placeholder="Ketik ulang sandi baru" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3.5 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 disabled:opacity-50"
            >
              {isLoading ? 'Menyimpan...' : (
                <>
                  <CheckCircle2 size={18} />
                  Simpan & Login
                </>
              )}
            </button>
          </form>
        )}

        {step === 1 && (
          <div className="mt-8 text-center border-t border-border dark:border-border pt-6">
            <p className="text-sm text-secondary">Ingat password Anda? 
              <Link to="/login" className="text-primary font-bold hover:underline ml-1">Login sekarang</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
