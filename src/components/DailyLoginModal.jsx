import { useState, useEffect } from 'react';
import { Gift, X, Check } from 'lucide-react';
import { useToast } from './Toast';

const STREAK_REWARDS = [50, 50, 75, 75, 100, 100, 200];

export default function DailyLoginModal({ studentId, token, apiUrl, onClaim, onClose }) {
  const toast = useToast();
  const [streak, setStreak] = useState(0);
  const [streakDay, setStreakDay] = useState(1);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [claimed, setClaimed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if we should show (once per 24h)
    const lastShown = localStorage.getItem('arkon_daily_login_shown');
    const today = new Date().toDateString();
    if (lastShown === today) return;

    setShow(true);
    localStorage.setItem('arkon_daily_login_shown', today);
  }, []);

    const handleClaim = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/daily-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ student_id: studentId }),
      });
      
      if (!res.ok) throw new Error('Gagal menghubungi server');
      
      const data = await res.json();
      if (data.already_claimed) {
        setStreak(data.streak);
        setStreakDay(((data.streak - 1) % 7) + 1);
        setCoinsEarned(data.coins_earned);
        setClaimed(true);
      } else {
        setStreak(data.streak);
        setStreakDay(data.streak_day);
        setCoinsEarned(data.coins_earned);
        setClaimed(true);
        if (onClaim) onClaim(data.total_coins);
      }
    } catch (err) {
      console.error('Daily login error:', err);
      toast.error('Gagal mengklaim koin. Silakan coba lagi nanti atau periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[var(--bg-surface)] border border-border dark:border-slate-800 rounded-3xl w-[420px] max-w-[90vw] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-rose-500/20 p-6 text-center border-b border-border">
          <button onClick={() => { setShow(false); if(onClose) onClose(); }} className="absolute top-4 right-4 text-secondary hover:text-secondary transition">
            <X size={18} />
          </button>
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/30">
            <Gift size={32} className="text-foreground" />
          </div>
          <h2 className="text-xl font-black text-foreground mb-1">Login Harian 🎁</h2>
          <p className="text-secondary text-sm">Klaim koin gratis setiap hari!</p>
        </div>

        {/* Streak Calendar */}
        <div className="p-6">
          <div className="grid grid-cols-7 gap-2 mb-6">
            {STREAK_REWARDS.map((reward, i) => {
              const day = i + 1;
              const isCurrent = day === streakDay && claimed;
              const isPast = claimed && day < streakDay;
              return (
                <div
                  key={i}
                  className={`relative flex flex-col items-center p-2 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-amber-500/20 border-amber-500/50 scale-105'
                      : isPast
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800'
                  }`}
                >
                  <span className="text-[10px] font-bold text-secondary mb-1">Day {day}</span>
                  <span className="text-xs font-black text-amber-600">🪙{reward}</span>
                  {isPast && <Check size={12} className="text-emerald-600 mt-1" />}
                  {isCurrent && <span className="text-[10px] mt-1">✨</span>}
                  {day === 7 && <span className="absolute -top-1 -right-1 text-[10px]">🎉</span>}
                </div>
              );
            })}
          </div>

          {/* Streak Info */}
          {claimed && (
            <div className="text-center mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <p className="text-emerald-600 font-bold text-sm">
                +{coinsEarned} koin diterima! 🪙
              </p>
              <p className="text-secondary text-xs mt-1">Streak: {streak} hari berturut-turut</p>
            </div>
          )}

          {/* Action Button */}
          {!claimed ? (
            <button
              onClick={handleClaim}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-foreground font-black rounded-xl hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/30 disabled:opacity-50 text-sm"
            >
              {loading ? 'Mengklaim...' : '🪙 Klaim Koin Hari Ini!'}
            </button>
          ) : (
            <button
              onClick={() => { setShow(false); if(onClose) onClose(); }}
              className="w-full py-3 bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-700 text-foreground font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm"
            >
              Tutup
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
