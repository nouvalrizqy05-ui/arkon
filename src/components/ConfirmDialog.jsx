import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusTrap } from '../hooks/useFocusTrap';

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, danger = false }) {
  const trapRef = useFocusTrap(isOpen);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onCancel?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <motion.div
          ref={trapRef}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[var(--bg-surface)] dark:bg-slate-900 border border-border dark:border-slate-800 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl"
        >
          <h3 id="confirm-dialog-title" className="text-xl font-black text-foreground mb-3">{title}</h3>
          <p id="confirm-dialog-message" className="text-secondary mb-8 leading-relaxed text-sm">{message}</p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-6 py-3 rounded-2xl border border-border dark:border-slate-700 text-secondary hover:bg-muted dark:hover:bg-slate-800 transition-colors font-bold text-sm"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              className={`px-6 py-3 rounded-2xl font-bold text-white transition-colors text-sm shadow-lg ${
                danger ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20' : 'bg-primary hover:bg-primary-hover shadow-emerald-500/20'
              }`}
            >
              Konfirmasi
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
