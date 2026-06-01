import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-foreground px-4">
      <ShieldAlert className="w-24 h-24 text-primary mb-6" />
      <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-slate-300 mb-6 text-center">Halaman Tidak Ditemukan</h2>
      <p className="text-slate-400 max-w-md text-center mb-8">
        Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.
      </p>
      <Link 
        to="/" 
        className="px-6 py-3 bg-primary hover:bg-primary-hover text-foreground font-medium rounded-lg transition-colors"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}
