import { useState, useEffect } from 'react';
import { 
  BarChart2, TrendingUp, Target, Flame, BookOpen, 
  AlertTriangle, CheckCircle, Zap, Award, Loader2, Brain
} from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';
import SkeletonCard from './SkeletonCard';

export default function StudentInsight({ studentId, token, apiUrl }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    const fetchInsight = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/analytics/student-insight/${studentId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setData(await res.json());
      } catch (err) {
        console.error('Insight fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInsight();
  }, [studentId]);

  if (loading) return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="space-y-2">
          <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
          <div className="h-3 w-32 bg-slate-100 dark:bg-slate-700 rounded-md animate-pulse" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} variant="stat" />)}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard height="h-[320px]" />
        <SkeletonCard height="h-[320px]" />
      </div>
      
      <SkeletonCard variant="list" />
    </div>
  );

  if (!data) return (
    <div className="text-center py-20">
      <Brain size={48} className="mx-auto text-foreground mb-4" />
      <p className="font-bold text-secondary">Belum ada data insight</p>
      <p className="text-xs text-secondary mt-1">Selesaikan beberapa kuis untuk melihat analisis personal Anda</p>
    </div>
  );

  const { radarData, weaknesses, uasPrediction, uasCategory, stats, activity, streak, badges, coins } = data;

  // Color for UAS prediction gauge
  const uasColor = uasPrediction >= 85 ? '#10b981' : uasPrediction >= 70 ? '#6366f1' : uasPrediction >= 55 ? '#f59e0b' : '#ef4444';
  const uasStroke = `${(uasPrediction / 100) * 283}`;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
          <BarChart2 size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black text-foreground">Student Insight Dashboard</h2>
          <p className="text-xs text-secondary">Analisis performa personal berbasis AI Heuristik</p>
        </div>
      </div>

      {/* STAT CARDS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Kuis', value: stats.total_quizzes || 0, icon: Zap, color: 'text-rose-500', bg: 'bg-rose-50' },
          { label: 'Rata-rata Skor', value: `${stats.avg_score || 0}%`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary-soft' },
          { label: 'Streak Flashcard', value: `${streak.current_streak || 0} 🔥`, icon: Flame, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Badges', value: badges || 0, icon: Award, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        ].map((s, i) => (
          <div key={i} className="bg-[var(--bg-surface)] rounded-2xl border border-border dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center`}>
                <s.icon size={18} className={s.color} />
              </div>
            </div>
            <p className="text-2xl font-black text-foreground">{s.value}</p>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* MAIN CONTENT: Radar + UAS Prediction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="bg-[var(--bg-surface)] rounded-3xl border border-border dark:border-slate-800 p-6 shadow-sm">
          <h3 className="font-black text-foreground text-sm flex items-center gap-2 mb-4">
            <Target size={16} className="text-primary" /> Kekuatan per Topik
          </h3>
          {radarData.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData.map(r => ({ ...r, topic: r.topic?.substring(0, 20) || 'Topik' }))}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="topic" tick={{ fontSize: 9, fontWeight: 700 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                  <Radar name="Skor" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-secondary text-sm">
              <p>Selesaikan kuis dari berbagai modul untuk melihat radar chart</p>
            </div>
          )}
        </div>

        {/* UAS Prediction Gauge */}
        <div className="bg-[var(--bg-surface)] rounded-3xl border border-border dark:border-slate-800 p-6 shadow-sm flex flex-col items-center justify-center">
          <h3 className="font-black text-foreground text-sm flex items-center gap-2 mb-6 self-start">
            <TrendingUp size={16} className="text-emerald-500" /> Prediksi Nilai UAS
          </h3>
          
          {stats.total_quizzes >= 3 ? (
            <>
              <div className="relative w-40 h-40 mb-4">
                <svg className="w-40 h-40 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                  <circle cx="50" cy="50" r="45" fill="none" stroke={uasColor} strokeWidth="8" 
                    strokeDasharray={`${uasStroke} 283`} strokeLinecap="round" 
                    className="transition-all duration-1000 ease-out" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black" style={{ color: uasColor }}>{uasPrediction}</span>
                  <span className="text-[9px] font-bold text-secondary uppercase tracking-widest">/ 100</span>
                </div>
              </div>
              <div className="text-center">
                <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border"
                  style={{ color: uasColor, borderColor: uasColor, backgroundColor: `${uasColor}10` }}>
                  {uasCategory}
                </span>
                <p className="text-[10px] text-secondary mt-3 max-w-[250px] mx-auto leading-relaxed">
                  Prediksi berbasis {stats.total_quizzes} kuis, streak {streak.current_streak} hari, dan {badges} badge.
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                <TrendingUp size={32} className="text-foreground" />
              </div>
              <p className="font-bold text-secondary text-sm">Belum cukup data</p>
              <p className="text-[10px] text-secondary mt-1">Selesaikan minimal 3 kuis untuk melihat prediksi</p>
            </div>
          )}
        </div>
      </div>

      {/* WEAKNESS DETECTOR */}
      <div className="bg-[var(--bg-surface)] rounded-3xl border border-border dark:border-slate-800 p-6 shadow-sm">
        <h3 className="font-black text-foreground text-sm flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-amber-500" /> Weakness Detector
        </h3>
        {weaknesses.length > 0 ? (
          <div className="space-y-3">
            {weaknesses.map((w, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-500/20 text-red-500 dark:text-red-400 rounded-xl flex items-center justify-center shrink-0">
                  <AlertTriangle size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-red-800 dark:text-red-300 text-sm truncate">{w.topic}</p>
                  <p className="text-[10px] text-red-600 dark:text-red-400">Skor rata-rata: {w.score}% ({w.attempts} percobaan)</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <span className="px-3 py-1.5 bg-[var(--bg-surface)] text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-red-50 dark:hover:bg-red-500/10 transition">
                    🎴 Review Flashcard
                  </span>
                  <span className="px-3 py-1.5 bg-[var(--bg-surface)] text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-red-50 dark:hover:bg-red-500/10 transition">
                    ⚡ Ulangi Kuis
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 rounded-xl flex items-center justify-center">
              <CheckCircle size={18} />
            </div>
            <div>
              <p className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">Tidak ada kelemahan terdeteksi!</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Semua topik memiliki skor di atas 60%. Pertahankan!</p>
            </div>
          </div>
        )}
      </div>

      {/* ACTIVITY TIMELINE */}
      <div className="bg-[var(--bg-surface)] rounded-3xl border border-border dark:border-slate-800 p-6 shadow-sm">
        <h3 className="font-black text-foreground text-sm flex items-center gap-2 mb-4">
          <Flame size={16} className="text-orange-500" /> Aktivitas Belajar (14 Hari Terakhir)
        </h3>
        {activity.length > 0 ? (
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activity.map(a => ({ ...a, day: new Date(a.day).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) }))}>
                <defs>
                  <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12, border: '1px solid #e5e7eb' }} />
                <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#actGrad)" strokeWidth={2} name="Aktivitas" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-secondary text-center py-6">Belum ada aktivitas tercatat</p>
        )}
      </div>
    </div>
  );
}
