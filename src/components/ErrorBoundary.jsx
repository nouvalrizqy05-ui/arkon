import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * ErrorBoundary — Menangkap error di React component tree.
 * Mencegah layar putih kosong saat terjadi crash di komponen anak.
 * Sangat penting untuk demo kompetisi LIDM.
 * 
 * Dua mode:
 * - fullPage (default): Tampilkan UI recovery satu halaman penuh (untuk App-level)
 * - inline: Tampilkan error card kecil di tempat komponen yang crash (untuk komponen individual)
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error(`🔥 [ErrorBoundary${this.props.name ? `: ${this.props.name}` : ''}] Caught error:`, error, errorInfo);

    // Auto-reload on Dynamic Import / Chunk Load Errors (highly critical for production deployments)
    const errorStr = error?.toString() || '';
    if (
      errorStr.includes('Failed to fetch dynamically imported module') ||
      errorStr.includes('ChunkLoadError') ||
      errorStr.includes('Loading chunk')
    ) {
      const now = Date.now();
      const lastRetry = sessionStorage.getItem('arkon_chunk_retry_time');
      
      // If we haven't retried in the last 10 seconds, reload the page to get the fresh asset bundle
      if (!lastRetry || now - parseInt(lastRetry, 10) > 10000) {
        sessionStorage.setItem('arkon_chunk_retry_time', now.toString());
        console.warn('🔄 Dynamic import/chunk load error detected. Reloading page to fetch latest version...');
        window.location.reload();
      }
    }
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // === INLINE MODE: Card kecil untuk komponen individual ===
      if (this.props.inline) {
        return (
          <div className="w-full p-6 bg-red-500/5 border border-red-500/15 rounded-2xl text-center">
            <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto mb-3 border border-red-500/20">
              <AlertTriangle size={24} className="text-red-400" />
            </div>
            <h3 className="text-sm font-black text-foreground mb-1">
              {this.props.name || 'Komponen'} Error
            </h3>
            <p className="text-secondary text-xs mb-4">
              Terjadi masalah saat memuat {this.props.name || 'fitur ini'}.
            </p>
            {this.state.error && (
              <details className="text-left mb-3 bg-red-500/5 border border-red-500/10 rounded-lg p-3">
                <summary className="text-[10px] font-bold text-red-400 cursor-pointer">🔍 Detail</summary>
                <pre className="mt-2 text-[9px] text-red-300/50 overflow-x-auto whitespace-pre-wrap font-mono">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--bg-surface)] dark:bg-slate-800 shadow-sm border border-border dark:border-slate-700 text-foreground dark:text-white font-bold rounded-lg text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
            >
              <RefreshCw size={12} /> Coba Lagi
            </button>
          </div>
        );
      }

      // === FULL PAGE MODE: Untuk App-level wrapping ===
      return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            {/* Error Icon */}
            <div className="w-20 h-20 bg-red-500/15 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <AlertTriangle size={40} className="text-red-400" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-black text-foreground mb-2">
              Oops, Ada Masalah! 😵
            </h1>
            <p className="text-secondary text-sm mb-6 leading-relaxed">
              Terjadi error yang tidak terduga. Jangan khawatir — data Anda aman. 
              Coba muat ulang halaman atau kembali ke beranda.
            </p>

            {/* Error Details (collapsible) */}
            {this.state.error && (
              <details className="text-left mb-6 bg-red-500/5 border border-red-500/10 rounded-xl p-4">
                <summary className="text-xs font-bold text-red-400 cursor-pointer select-none">
                  🔍 Detail Teknis (untuk developer)
                </summary>
                <pre className="mt-3 text-[10px] text-red-300/60 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-5 py-2.5 bg-[var(--bg-surface)] dark:bg-slate-800 shadow-sm border border-border dark:border-slate-700 text-foreground dark:text-white font-bold rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
              >
                <RefreshCw size={16} /> Coba Lagi
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl text-sm hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
              >
                <Home size={16} /> Ke Beranda
              </button>
            </div>

            {/* Branding */}
            <p className="text-secondary text-[10px] font-bold uppercase tracking-widest mt-8">
              ARKON Workspace • Error Recovery
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
