import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Check } from 'lucide-react';

const TOUR_STEPS = [
  {
    target: '.tour-step-1',
    title: '🖥️ Assembly Lab',
    content: 'Rakit komputer virtual dari nol! Pasang CPU, RAM, GPU, dan komponen lain. AI Gemini akan menganalisis hasil rakitanmu.',
    position: 'right'
  },
  {
    target: '.tour-step-2',
    title: '🎮 Quiz Adaptif (IRT)',
    content: 'Sistem kuis cerdas berbasis Item Response Theory (Rasch Model). Kesulitan soal menyesuaikan kemampuanmu secara otomatis — lihat badge "Adaptive Mode" saat bermain!',
    position: 'left'
  },
  {
    target: '.tour-step-3',
    title: '🤖 AI Assistant',
    content: 'Punya kesulitan? AI Gemini siap memberikan hint adaptif sesuai level theta-mu. Semakin sering salah, semakin detail petunjuknya.',
    position: 'top'
  },
  {
    target: null,
    title: '⚡ CPU Simulator',
    content: 'Tulis program assembly langsung! Simulator visual berbasis Svelte menampilkan siklus Fetch-Decode-Execute secara real-time. Akses dari menu "Belajar" di sidebar.',
    position: 'center'
  },
  {
    target: null,
    title: '🔬 AR Hardware Lab',
    content: 'Eksplorasi 8 komponen komputer dalam model 3D interaktif. Di smartphone, gunakan mode AR untuk menempatkan komponen di dunia nyata!',
    position: 'center'
  },
  {
    target: null,
    title: '🏆 Gamifikasi & Leaderboard',
    content: 'Kumpulkan koin dari kuis, rakit PC, dan login harian. Beli komponen di Shop, naik leaderboard, dan ikuti Tournament melawan mahasiswa lain!',
    position: 'center'
  }
];

export default function OnboardingTour({ isVisible, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tourBox, setTourBox] = useState(null);

  useEffect(() => {
    if (!isVisible) return;
    
    const updatePosition = () => {
      const step = TOUR_STEPS[currentStep];
      if (!step) return;
      
      // Remove highlights from all steps first
      TOUR_STEPS.forEach(s => {
        if (s.target) {
          const el = document.querySelector(s.target);
          if (el) el.classList.remove('ring-4', 'ring-primary', 'ring-offset-2', 'relative', 'z-50');
        }
      });

      if (!step.target) {
        // Center on screen for steps without a target element
        setTourBox({ top: window.innerHeight / 2 - 120, left: window.innerWidth / 2 - 160 });
        return;
      }
      
      const el = document.querySelector(step.target);
      if (el) {
        const rect = el.getBoundingClientRect();
        el.classList.add('ring-4', 'ring-primary', 'ring-offset-2', 'relative', 'z-50');
        
        let top = 0, left = 0;
        switch (step.position) {
          case 'right':
            top = rect.top;
            left = rect.right + 20;
            break;
          case 'left':
            top = rect.top;
            left = rect.left - 340;
            break;
          case 'top':
            top = rect.top - 200;
            left = rect.left;
            break;
          default:
            top = rect.top + rect.height + 20;
            left = rect.left;
        }
        
        setTourBox({ top, left });
      } else {
        // Element not found — center on screen
        setTourBox({ top: window.innerHeight / 2 - 120, left: window.innerWidth / 2 - 160 });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      TOUR_STEPS.forEach(s => {
        if (s.target) {
          const el = document.querySelector(s.target);
          if (el) el.classList.remove('ring-4', 'ring-primary', 'ring-offset-2', 'relative', 'z-50');
        }
      });
    };
  }, [currentStep, isVisible]);

  if (!isVisible || !tourBox) return null;

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const nextStep = () => {
    if (isLast) onClose();
    else setCurrentStep(c => c + 1);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" />
      <AnimatePresence>
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="fixed z-50 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-indigo-100 dark:border-slate-700 p-5"
          style={{ top: tourBox.top, left: tourBox.left }}
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={16} />
          </button>
          
          <div className="text-xs font-bold text-primary mb-2 tracking-wider">
            STEP {currentStep + 1} OF {TOUR_STEPS.length}
          </div>
          
          <h3 className="text-lg font-bold text-slate-900 dark:text-foreground mb-2">{step.title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
            {step.content}
          </p>
          
          <div className="flex justify-between items-center mt-6">
            <div className="flex flex-col gap-2">
              <div className="flex gap-1">
                {TOUR_STEPS.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentStep ? 'w-4 bg-primary' : 'w-1.5 bg-slate-200 dark:bg-slate-700'}`} />
                ))}
              </div>
              <button 
                onClick={onClose} 
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 text-left w-fit transition-colors"
              >
                Lewati Tour
              </button>
            </div>
            
            <button
              onClick={nextStep}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold flex items-center gap-1 transition-colors"
            >
              {isLast ? (
                <>Selesai <Check size={16} /></>
              ) : (
                <>Lanjut <ChevronRight size={16} /></>
              )}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
