import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useToast } from '../components/Toast';

export default function ResetPassword() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Token tidak valid atau hilang.');
      navigate('/login');
    }
  }, [token, navigate, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Konfirmasi password tidak cocok!');
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: formData.password })
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        toast.success(data.message);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        toast.error(data.error || 'Gagal mereset password.');
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
        <div className="flex flex-col items-center mb-8 mt-4 text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 text-primary">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Set Password Baru</h1>
          <p className="text-secondary text-sm mt-2 px-4">
            Keamanan akun Anda adalah prioritas. Masukkan password baru yang kuat.
          </p>
        </div>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="new-pass" className="block text-sm font-bold text-foreground mb-2">Password Baru</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                <input 
                  id="new-pass"
                  type="password" 
                  required 
                  minLength={6}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-border dark:border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-slate-50 dark:bg-[#080C1A] text-sm font-medium dark:text-foreground" 
                  placeholder="••••••••" 
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirm-pass" className="block text-sm font-bold text-foreground mb-2">Konfirmasi Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                <input 
                  id="confirm-pass"
                  type="password" 
                  required 
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-border dark:border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-slate-50 dark:bg-[#080C1A] text-sm font-medium dark:text-foreground" 
                  placeholder="••••••••" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3.5 bg-primary text-foreground rounded-2xl font-bold hover:bg-primary-hover transition-all mt-8 cursor-pointer shadow-lg shadow-primary/30 disabled:opacity-50"
            >
              {isLoading ? 'Memperbarui...' : 'Simpan Password Baru'}
            </button>
          </form>
        ) : (
          <div className="text-center p-8 bg-emerald-500/10 rounded-3xl border border-emerald-500/20">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-foreground shadow-lg shadow-emerald-500/30 animate-bounce">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-emerald-500 font-bold text-lg mb-2">Berhasil!</h2>
            <p className="text-sm text-secondary">
              Password Anda telah diperbarui. Mengalihkan Anda ke halaman Login...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
