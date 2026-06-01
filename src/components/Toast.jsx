import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ==========================================
// TOAST NOTIFICATION SYSTEM
// Konsisten dengan dark-mode UI ARKON
// ==========================================

const ToastContext = createContext(null);

const TOAST_ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const TOAST_STYLES = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
  error: 'border-red-500/30 bg-red-500/10 text-red-400',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-600',
  info: 'border-blue-500/30 bg-blue-500/10 text-blue-600',
};

const TOAST_ICON_COLORS = {
  success: 'text-emerald-600',
  error: 'text-red-400',
  warning: 'text-amber-600',
  info: 'text-blue-600',
};

let toastIdCounter = 0;

function ToastItem({ toast, onRemove }) {
  const [isExiting, setIsExiting] = useState(false);
  const Icon = TOAST_ICONS[toast.type] || Info;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl
        max-w-[400px] w-full
        ${TOAST_STYLES[toast.type] || TOAST_STYLES.info}
        transition-all duration-300 ease-out
        ${isExiting ? 'opacity-0 translate-x-8 scale-95' : 'opacity-100 translate-x-0 scale-100'}
      `}
      style={{ animation: !isExiting ? 'slideInRight 0.3s ease-out' : undefined }}
    >
      <Icon size={20} className={`mt-0.5 flex-shrink-0 ${TOAST_ICON_COLORS[toast.type]}`} />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="font-bold text-sm text-foreground mb-0.5">{toast.title}</p>
        )}
        <p className="text-sm opacity-90 leading-relaxed">{toast.message}</p>
      </div>
      <button
        onClick={handleClose}
        className="flex-shrink-0 mt-0.5 text-secondary hover:text-secondary transition-colors"
        aria-label="Tutup notifikasi"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', options = {}) => {
    const id = ++toastIdCounter;
    setToasts(prev => [...prev, { id, message, type, ...options }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback({
    success: (msg, opts) => addToast(msg, 'success', opts),
    error: (msg, opts) => addToast(msg, 'error', opts),
    warning: (msg, opts) => addToast(msg, 'warning', opts),
    info: (msg, opts) => addToast(msg, 'info', opts),
  }, [addToast]);

  // Workaround: useCallback doesn't work with object literal
  const toastFns = {
    success: (msg, opts) => addToast(msg, 'success', opts),
    error: (msg, opts) => addToast(msg, 'error', opts),
    warning: (msg, opts) => addToast(msg, 'warning', opts),
    info: (msg, opts) => addToast(msg, 'info', opts),
  };

  return (
    <ToastContext.Provider value={toastFns}>
      {children}
      {/* Toast Container — fixed bottom-right */}
      <div
        className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-3 pointer-events-none"
        aria-label="Notifikasi"
      >
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Hook untuk menggunakan toast di komponen manapun.
 * @returns {{ success: Function, error: Function, warning: Function, info: Function }}
 * @example
 *   const toast = useToast();
 *   toast.success('Berhasil!');
 *   toast.error('Gagal!');
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast harus digunakan di dalam <ToastProvider>');
  return ctx;
}
