/**
 * ARKON Dosen Onboarding Wizard — TASK-ONBOARD-001
 * Guided step-by-step untuk dosen baru membuat kelas pertama
 * Tersimpan di localStorage + backend progress table
 */
import { useState, useEffect } from 'react';
import { CheckCircle, Circle, ArrowRight, X, BookOpen, Users, Play, BarChart2, Sparkles } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

const STEPS = [
  {
    id: 'create_room',
    icon: BookOpen,
    title: 'Buat Kelas Pertama',
    desc: 'Mulai dengan membuat room kelas untuk mata kuliah Anda.',
    action: 'Buat Room Sekarang',
    color: 'bg-indigo-500',
    path: '/lecturer-dashboard/create-room'
  },
  {
    id: 'invite_students',
    icon: Users,
    title: 'Undang Mahasiswa',
    desc: 'Bagikan kode room ke mahasiswa agar mereka bisa bergabung.',
    action: 'Lihat Kode Room',
    color: 'bg-blue-500',
    path: '/lecturer-dashboard/rooms'
  },
  {
    id: 'launch_quiz',
    icon: Play,
    title: 'Jalankan Live Quiz Pertama',
    desc: 'Coba fitur live quiz — soal dikirim real-time ke semua mahasiswa.',
    action: 'Buat Live Quiz',
    color: 'bg-green-500',
    path: '/lecturer-dashboard/live-quiz'
  },
  {
    id: 'see_analytics',
    icon: BarChart2,
    title: 'Lihat Analytics Kelas',
    desc: 'Pantau distribusi kemampuan mahasiswa dan hitung N-Gain.',
    action: 'Buka Analytics',
    color: 'bg-purple-500',
    path: '/lecturer-dashboard/analytics'
  }
];

export default function DosenOnboardingWizard({ token, onComplete }) {
  const [completedSteps, setCompletedSteps] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Load progress from localStorage
    const saved = localStorage.getItem('arkon_onboarding_dosen');
    if (saved) {
      const parsed = JSON.parse(saved);
      setCompletedSteps(parsed.completed || {});
      if (parsed.dismissed) setDismissed(true);
    }
    // Also fetch from backend
    if (token) fetchProgress();
  }, [token]);

  const fetchProgress = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/onboarding-progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const completed = {};
        (data.steps || []).forEach(s => { completed[s.step] = true; });
        setCompletedSteps(prev => ({ ...prev, ...completed }));
      }
    } catch { /* silent */ }
  };

  const markStep = async (stepId) => {
    const newCompleted = { ...completedSteps, [stepId]: true };
    setCompletedSteps(newCompleted);
    localStorage.setItem('arkon_onboarding_dosen', JSON.stringify({ completed: newCompleted }));

    // Persist to backend
    try {
      await fetch(`${API_URL}/api/admin/onboarding-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ step: stepId })
      });
    } catch { /* silent */ }

    // Move to next
    const nextIdx = STEPS.findIndex((s, i) => i > currentStep && !newCompleted[s.id]);
    if (nextIdx !== -1) setCurrentStep(nextIdx);

    // All done
    if (Object.keys(newCompleted).length >= STEPS.length) {
      setTimeout(() => { onComplete?.(); }, 1500);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('arkon_onboarding_dosen', JSON.stringify({ completed: completedSteps, dismissed: true }));
  };

  const completedCount = Object.keys(completedSteps).length;
  const allDone = completedCount >= STEPS.length;

  if (dismissed && !allDone) return null;
  if (allDone) return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 border border-green-200 dark:border-green-700 rounded-2xl p-4 flex items-center gap-3">
      <Sparkles size={20} className="text-green-500 flex-shrink-0" />
      <div>
        <p className="font-bold text-green-700 dark:text-green-300 text-sm">Setup Selesai! 🎉</p>
        <p className="text-xs text-green-600 dark:text-green-400">Anda sudah menyelesaikan semua langkah onboarding. Selamat mengajar!</p>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">🚀 Setup Kelas Pertama</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{completedCount}/{STEPS.length} langkah selesai</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress bar */}
          <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${(completedCount / STEPS.length) * 100}%` }} />
          </div>
          <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Steps */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const done = completedSteps[step.id];
          const isCurrent = i === currentStep && !done;

          return (
            <div key={step.id}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                done ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' :
                isCurrent ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-600' :
                'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-70'
              }`}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${done ? 'bg-green-100 dark:bg-green-800' : `${step.color} opacity-${isCurrent ? '100' : '50'}`}`}>
                {done ? <CheckCircle size={15} className="text-green-600 dark:text-green-300" /> : <Icon size={15} className="text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold ${done ? 'text-green-700 dark:text-green-300 line-through' : 'text-gray-800 dark:text-gray-200'}`}>{step.title}</p>
                {!done && <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{step.desc}</p>}
                {isCurrent && !done && (
                  <button
                    onClick={() => markStep(step.id)}
                    className="mt-2 flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {step.action} <ArrowRight size={10} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
