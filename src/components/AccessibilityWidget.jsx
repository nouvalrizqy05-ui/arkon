import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

const STORAGE_KEY = 'arkon_a11y';

function getStoredSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { contrast: false, textScale: 0 };
}

export default function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState(getStoredSettings);

  const applySettings = useCallback((s) => {
    const root = document.documentElement;

    // High contrast
    if (s.contrast) {
      root.classList.add('a11y-high-contrast');
    } else {
      root.classList.remove('a11y-high-contrast');
    }

    // Text scale (-2 to +4 steps, each step = 0.1rem base font increase)
    const baseSize = 16 + (s.textScale * 2); // 2px per step
    root.style.fontSize = `${baseSize}px`;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }, []);

  useEffect(() => {
    applySettings(settings);
  }, [settings, applySettings]);

  const toggleContrast = () => {
    setSettings(prev => ({ ...prev, contrast: !prev.contrast }));
  };

  const changeTextScale = (delta) => {
    setSettings(prev => {
      const newScale = Math.max(-2, Math.min(4, prev.textScale + delta));
      return { ...prev, textScale: newScale };
    });
  };

  const resetAll = () => {
    const defaults = { contrast: false, textScale: 0 };
    setSettings(defaults);
  };

  const scaleLabels = ['XS', 'S', 'Normal', 'L', 'XL', 'XXL', '3XL'];
  const currentLabel = scaleLabels[settings.textScale + 2] || 'Normal';

  return (
    <>
      {/* Floating Button — Bottom Left */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-[9999] w-12 h-12 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full shadow-xl shadow-emerald-700/30 flex items-center justify-center transition-all hover:scale-110 cursor-pointer border-2 border-emerald-600"
        aria-label="Aksesibilitas"
        title="Pengaturan Aksesibilitas"
      >
        {/* Accessibility icon (universal) */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="4.5" r="2.5" />
          <path d="M12 7v6" />
          <path d="M8 21l2-7" />
          <path d="M16 21l-2-7" />
          <path d="M6 11h12" />
        </svg>
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 left-6 z-[9999] w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-black text-foreground">Aksesibilitas</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-secondary transition-colors cursor-pointer"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5">
              {/* High Contrast Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a10 10 0 0 1 0 20z" fill="currentColor" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-foreground">Kontras tinggi</span>
                </div>
                <button
                  onClick={toggleContrast}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                    settings.contrast
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                      : 'bg-slate-100 text-secondary border-slate-200'
                  }`}
                >
                  {settings.contrast ? 'Aktif' : 'Mati'}
                </button>
              </div>

              {/* Text Scale */}
              <div>
                <p className="text-xs font-bold text-secondary mb-3">Ukuran teks</p>
                <div className="flex items-center justify-between bg-slate-50 rounded-xl border border-slate-200 px-1 py-1">
                  <button
                    onClick={() => changeTextScale(-1)}
                    disabled={settings.textScale <= -2}
                    className="w-10 h-10 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-foreground font-black text-lg transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                    aria-label="Perkecil teks"
                  >
                    −
                  </button>
                  <span className="text-sm font-bold text-foreground flex-1 text-center">{currentLabel}</span>
                  <button
                    onClick={() => changeTextScale(1)}
                    disabled={settings.textScale >= 4}
                    className="w-10 h-10 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-foreground font-black text-lg transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                    aria-label="Perbesar teks"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Reset */}
              <button
                onClick={resetAll}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-secondary text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                Reset
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
