import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { 
  Trophy, BookOpen, Zap, BrainCircuit, Layers, 
  Star, Cpu, Award, X, Sparkles, Crown, Check
} from 'lucide-react';

// ========================================
// BADGE DEFINITIONS
// ========================================
export const BADGES = {
  first_step: {
    id: 'first_step',
    name: 'First Step',
    desc: 'Bergabung ke kelas pertama',
    icon: Star,
    color: 'from-yellow-400 to-amber-500',
    xp: 50,
  },
  bookworm: {
    id: 'bookworm',
    name: 'Bookworm',
    desc: 'Membuka 3 modul materi',
    icon: BookOpen,
    color: 'from-blue-400 to-primary',
    xp: 100,
  },
  quiz_warrior: {
    id: 'quiz_warrior',
    name: 'Quiz Warrior',
    desc: 'Menyelesaikan kuis pertama',
    icon: Zap,
    color: 'from-rose-400 to-pink-500',
    xp: 150,
  },
  mind_mapper: {
    id: 'mind_mapper',
    name: 'Mind Mapper',
    desc: 'Generate Mind Map pertama',
    icon: BrainCircuit,
    color: 'from-emerald-400 to-teal-500',
    xp: 100,
  },
  card_master: {
    id: 'card_master',
    name: 'Card Master',
    desc: 'Mempelajari seluruh Flashcard',
    icon: Layers,
    color: 'from-amber-400 to-orange-500',
    xp: 100,
  },
  ar_explorer: {
    id: 'ar_explorer',
    name: 'AR Explorer',
    desc: 'Melihat semua 7 komponen di AR Lab',
    icon: Cpu,
    color: 'from-purple-400 to-violet-500',
    xp: 200,
  },
  perfect_score: {
    id: 'perfect_score',
    name: 'Perfect Score',
    desc: 'Mendapat skor 90+ di kuis',
    icon: Trophy,
    color: 'from-yellow-500 to-amber-600',
    xp: 300,
  },
  pipeline_master: {
    id: 'pipeline_master',
    name: 'Pipeline Master',
    desc: 'Menyelesaikan Assembly Challenge',
    icon: Award,
    color: 'from-cyan-400 to-blue-500',
    xp: 250,
  },
  tournament_champion: {
    id: 'tournament_champion',
    name: 'Tournament Champion',
    desc: 'Memenangkan turnamen kelas',
    icon: Crown,
    color: 'from-yellow-400 to-amber-600',
    xp: 500,
  },
};

const ALL_BADGE_IDS = Object.keys(BADGES);

// ========================================
// LEVEL SYSTEM
// ========================================
const LEVELS = [
  { level: 1, name: 'Newbie', minXP: 0 },
  { level: 2, name: 'Beginner', minXP: 100 },
  { level: 3, name: 'Learner', minXP: 250 },
  { level: 4, name: 'Apprentice', minXP: 450 },
  { level: 5, name: 'Explorer', minXP: 700 },
  { level: 6, name: 'Scholar', minXP: 1000 },
  { level: 7, name: 'Expert', minXP: 1350 },
  { level: 8, name: 'Master', minXP: 1750 },
  { level: 9, name: 'Grandmaster', minXP: 2200 },
  { level: 10, name: 'Legend', minXP: 2700 },
];

export function getLevel(totalXP) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (totalXP >= lvl.minXP) current = lvl;
    else break;
  }
  const nextLevel = LEVELS.find(l => l.level === current.level + 1);
  const xpForNext = nextLevel ? nextLevel.minXP : current.minXP;
  const xpProgress = nextLevel ? (totalXP - current.minXP) / (xpForNext - current.minXP) : 1;
  return { ...current, xpProgress: Math.min(xpProgress, 1), totalXP, nextXP: xpForNext };
}

export function getTotalXP(unlockedBadgeIds) {
  return unlockedBadgeIds.reduce((sum, id) => sum + (BADGES[id]?.xp || 0), 0);
}

// ========================================
// ACHIEVEMENT HOOK
// ========================================
export function useAchievements(studentId) {
  const [unlockedBadges, setUnlockedBadges] = useState([]);
  const [toastBadge, setToastBadge] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('auth_token');

  // Fetch existing badges on mount
  useEffect(() => {
    if (!studentId || !token) return;
    fetch(`${API_URL}/api/achievements/${studentId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(result => {
        const data = Array.isArray(result) ? result : (result.data || []);
        if (Array.isArray(data)) {
          setUnlockedBadges(data.map(d => d.badge_id));
        }
      })
      .catch(err => console.error('Failed to fetch achievements:', err));
  }, [studentId, token]);

  const unlockBadge = useCallback(async (badgeId) => {
    if (!studentId || !BADGES[badgeId]) return;
    if (unlockedBadges.includes(badgeId)) return; // Already owned

    try {
      const res = await fetch(`${API_URL}/api/achievements`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ student_id: studentId, badge_id: badgeId })
      });
      const data = await res.json();
      if (!data.already_owned) {
        setUnlockedBadges(prev => [...prev, badgeId]);
        setToastBadge(BADGES[badgeId]);
        // Auto-dismiss toast after 4 seconds
        setTimeout(() => setToastBadge(null), 4000);
      }
    } catch (err) {
      console.error('Failed to unlock badge:', err);
    }
  }, [studentId, unlockedBadges, token]);

  const dismissToast = useCallback(() => setToastBadge(null), []);

  const totalXP = getTotalXP(unlockedBadges);
  const levelInfo = getLevel(totalXP);

  return { unlockedBadges, unlockBadge, toastBadge, dismissToast, totalXP, levelInfo };
}

// ========================================
// UI COMPONENTS
// ========================================

// Badge Card (individual badge)
export function BadgeCard({ badge, unlocked = false, size = 'md' }) {
  const Icon = badge.icon;
  const sizeClasses = size === 'sm' 
    ? 'w-14 h-14' 
    : size === 'lg' ? 'w-24 h-24' : 'w-18 h-18';
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 32 : 22;

  return (
    <div className={`group relative flex flex-col items-center gap-1.5 ${size === 'sm' ? '' : 'p-2'}`} title={unlocked ? `${badge.name}: ${badge.desc}` : `🔒 ${badge.name}`}>
      <div className={`${sizeClasses} rounded-2xl flex items-center justify-center transition-all duration-300
        ${unlocked 
          ? `bg-gradient-to-br ${badge.color} shadow-lg shadow-current/20 ring-2 ring-white/50` 
          : 'bg-gray-100 border-2 border-dashed border-gray-300'
        }`}
      >
        <Icon size={iconSize} className={unlocked ? 'text-foreground drop-shadow-md' : 'text-foreground'} />
      </div>
      {size !== 'sm' && (
        <span className={`text-[10px] font-bold text-center leading-tight max-w-[80px] ${unlocked ? 'text-gray-700' : 'text-secondary'}`}>
          {badge.name}
        </span>
      )}
    </div>
  );
}

// Profile Badges Panel (for ClassroomWorkspace dashboard)
export function ProfileBadgesPanel({ studentName, unlockedBadges, levelInfo }) {
  return (
    <div className="bg-white rounded-3xl border border-border shadow-sm p-6 mb-6">
      <div className="flex items-start gap-5">
        {/* Avatar & Level */}
        <div className="relative shrink-0">
          <img 
            src={`https://ui-avatars.com/api/?name=${studentName}&background=165DFF&color=fff&size=80`} 
            alt="Profile" 
            className="w-16 h-16 rounded-2xl shadow-md" 
          />
          <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-primary to-primary text-foreground text-[9px] font-black px-2 py-0.5 rounded-lg shadow-md border-2 border-white">
            Lv.{levelInfo.level}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-lg text-foreground truncate">{studentName}</h3>
          <p className="text-xs text-secondary font-bold mb-3">{levelInfo.name} • {levelInfo.totalXP} XP</p>
          
          {/* XP Progress Bar */}
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary rounded-full transition-all duration-700 ease-out"
              style={{ width: `${levelInfo.xpProgress * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-secondary mt-1 font-medium">
            {levelInfo.totalXP} / {levelInfo.nextXP} XP ke Level {levelInfo.level + 1 <= 10 ? levelInfo.level + 1 : 'MAX'}
          </p>
        </div>
      </div>

      {/* Badge Grid */}
      <div className="mt-5 pt-5 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Trophy size={14} className="text-amber-500" /> Achievement Badges
          </h4>
          <span className="text-[10px] font-bold text-secondary bg-gray-100 px-2 py-0.5 rounded-full">
            {unlockedBadges.length}/{ALL_BADGE_IDS.length}
          </span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {ALL_BADGE_IDS.map(id => (
            <BadgeCard key={id} badge={BADGES[id]} unlocked={unlockedBadges.includes(id)} size="sm" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Achievement Wall (Main View)
export function AchievementWall({ unlockedBadges, levelInfo }) {
  return (
    <div className="space-y-8 pb-12">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow-sm border border-border border border-border rounded-3xl p-6 flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-600">
            <Trophy size={32} />
          </div>
          <div>
            <p className="text-secondary text-[10px] font-black uppercase tracking-widest">Total XP</p>
            <p className="text-2xl font-black text-foreground">{levelInfo.totalXP} XP</p>
          </div>
        </div>
        <div className="bg-white shadow-sm border border-border border border-border rounded-3xl p-6 flex items-center gap-4">
          <div className="w-14 h-14 bg-primary-light rounded-2xl flex items-center justify-center text-primary">
            <Crown size={32} />
          </div>
          <div>
            <p className="text-secondary text-[10px] font-black uppercase tracking-widest">Rank</p>
            <p className="text-2xl font-black text-foreground">{levelInfo.name}</p>
          </div>
        </div>
        <div className="bg-white shadow-sm border border-border border border-border rounded-3xl p-6 flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-600">
            <Award size={32} />
          </div>
          <div>
            <p className="text-secondary text-[10px] font-black uppercase tracking-widest">Badges</p>
            <p className="text-2xl font-black text-foreground">{unlockedBadges.length} / {ALL_BADGE_IDS.length}</p>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {ALL_BADGE_IDS.map(id => {
          const badge = BADGES[id];
          const isUnlocked = unlockedBadges.includes(id);
          const Icon = badge.icon;
          
          return (
            <div 
              key={id}
              className={`relative overflow-hidden rounded-3xl border transition-all duration-500 p-6 flex flex-col h-full
                ${isUnlocked 
                  ? 'bg-white shadow-sm border border-border border-border shadow-xl' 
                  : 'bg-white shadow-sm border border-border border-border grayscale opacity-60'
                }`}
            >
              {/* Background Glow */}
              {isUnlocked && (
                <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${badge.color} opacity-20 blur-3xl`}></div>
              )}

              <div className="flex items-start justify-between mb-6">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${isUnlocked ? badge.color : 'from-gray-700 to-gray-800'} flex items-center justify-center shadow-lg relative group-hover:scale-110 transition-transform duration-500`}>
                  <Icon size={32} className="text-foreground" />
                  {isUnlocked && <div className="absolute inset-0 bg-white shadow-sm border border-border rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>}
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider
                    ${isUnlocked ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30' : 'bg-white shadow-sm border border-border text-secondary border border-border'}`}>
                    {isUnlocked ? 'Unlocked' : 'Locked'}
                  </span>
                  <div className="mt-2 flex items-center justify-end gap-1">
                    <Zap size={10} className={isUnlocked ? 'text-amber-600' : 'text-secondary'} />
                    <p className={`text-xs font-black ${isUnlocked ? 'text-foreground' : 'text-secondary'}`}>{badge.xp} XP</p>
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <h3 className={`text-lg font-black mb-1 transition-colors ${isUnlocked ? 'text-foreground' : 'text-secondary'}`}>{badge.name}</h3>
                <p className={`text-sm leading-relaxed mb-4 transition-colors ${isUnlocked ? 'text-secondary' : 'text-secondary'}`}>{badge.desc}</p>
              </div>

              <div className="mt-auto pt-4 border-t border-border">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[10px] font-black text-secondary uppercase tracking-widest">Task Requirement</p>
                  <span className={`text-[9px] font-bold ${isUnlocked ? 'text-emerald-600' : 'text-secondary'}`}>
                    {isUnlocked ? '1 / 1' : '0 / 1'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${isUnlocked ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-600' : 'border-border text-secondary'}`}>
                    {isUnlocked ? <Check size={10} /> : <div className="w-1 h-1 bg-white shadow-sm border border-border rounded-full"></div>}
                  </div>
                  <p className={`text-xs font-medium transition-colors ${isUnlocked ? 'text-secondary' : 'text-secondary'}`}>
                    Selesaikan: {badge.desc}
                  </p>
                </div>
                {/* Progress Bar Mini */}
                {!isUnlocked && (
                  <div className="mt-3 w-full bg-white shadow-sm border border-border rounded-full h-1 overflow-hidden">
                    <div className="w-0 h-full bg-emerald-500/30 rounded-full" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Toast Notification
export function AchievementToast({ badge, onDismiss }) {
  if (!badge) return null;
  const Icon = badge.icon;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-[slideUp_0.5s_ease-out]">
      <div className="bg-white rounded-2xl shadow-2xl border border-border p-5 flex items-center gap-4 max-w-sm">
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${badge.color} flex items-center justify-center shrink-0 shadow-lg`}>
          <Icon size={24} className="text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1">
            <Sparkles size={12} /> Badge Unlocked!
          </p>
          <p className="font-black text-foreground text-sm">{badge.name}</p>
          <p className="text-[11px] text-secondary">{badge.desc} (+{badge.xp} XP)</p>
        </div>
        <button onClick={onDismiss} className="p-1 text-secondary hover:text-gray-600 transition shrink-0">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
