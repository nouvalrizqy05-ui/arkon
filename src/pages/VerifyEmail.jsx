import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { useToast } from '../components/Toast';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const toast = useToast();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Token verifikasi tidak ditemukan.');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message);
          toast.success(data.message);
        } else {
          setStatus('error');
          setMessage(data.error || 'Verifikasi gagal.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Terjadi kesalahan koneksi ke server.');
      }
    };

    verify();
  }, [token, API_URL, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#080C1A]">
      <div className="bg-white dark:bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-border dark:border-border text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
            <h1 className="text-2xl font-bold text-foreground">Memverifikasi Email...</h1>
            <p className="text-secondary mt-2">Mohon tunggu sebentar sementara kami memproses data Anda.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-6 text-foreground shadow-lg shadow-emerald-500/20">
              <CheckCircle2 size={40} />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Verifikasi Berhasil!</h1>
            <p className="text-secondary mt-2 mb-8">{message}</p>
            <Link 
              to="/login" 
              className="w-full py-4 bg-primary text-foreground rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              Lanjut ke Login <ArrowRight size={18} />
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-rose-500 rounded-full flex items-center justify-center mb-6 text-foreground shadow-lg shadow-rose-500/20">
              <XCircle size={40} />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Verifikasi Gagal</h1>
            <p className="text-rose-500 font-medium mt-2 mb-8">{message}</p>
            <Link 
              to="/register" 
              className="text-primary font-bold hover:underline"
            >
              Coba daftar kembali
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
