import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { useToast } from '../components/Toast';

export default function ForgotPassword() {
  const toast = useToast();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier_number: identifier })
      });

      const data = await response.json();

      if (response.ok) {
        setIsSent(true);
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Gagal mengirim permintaan.');
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
        <Link 
          to="/login" 
          className="absolute top-6 left-6 flex items-center gap-2 text-secondary hover:text-primary transition-colors text-sm font-bold group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Kembali ke Login</span>
        </Link>

        <div className="flex flex-col items-center mb-8 mt-10 text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 text-primary">
            <Mail className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Lupa Password?</h1>
          <p className="text-secondary text-sm mt-2 px-4">
            Masukkan NIM atau NIP Anda untuk menerima instruksi reset password melalui email.
          </p>
        </div>

        {!isSent ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="id-number" className="block text-sm font-bold text-foreground mb-2">
                NIM / NIP
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                <input 
                  id="id-number"
                  type="text" 
                  required 
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-border dark:border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-slate-50 dark:bg-[#080C1A] text-sm font-medium dark:text-foreground" 
                  placeholder="Masukkan NIM/NIP Anda" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3.5 bg-primary text-foreground rounded-2xl font-bold hover:bg-primary-hover transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/30 disabled:opacity-50"
            >
              {isLoading ? 'Mengirim...' : (
                <>
                  <Send size={18} />
                  Kirim Instruksi
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="text-center p-6 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
            <p className="text-emerald-500 font-bold mb-2">Instruksi Terkirim!</p>
            <p className="text-sm text-secondary">
              Periksa kotak masuk email Anda. Jika tidak ada, silakan cek folder Spam.
            </p>
            <button 
              onClick={() => setIsSent(false)}
              className="mt-4 text-xs text-primary font-bold hover:underline"
            >
              Kirim ulang email?
            </button>
          </div>
        )}

        <div className="mt-8 text-center border-t border-border dark:border-border pt-6">
          <p className="text-sm text-secondary">Ingat password Anda? 
            <Link to="/login" className="text-primary font-bold hover:underline ml-1">Login sekarang</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
