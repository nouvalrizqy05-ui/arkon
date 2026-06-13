import React from 'react';
import { Lock, Check, Play, Trophy, Brain } from 'lucide-react';
import quizData from '../data/quizzes.json';
import ThetaProgressCard from './ThetaProgressCard';

const LEVEL_POSITIONS = [
  { id: 1, x: 18, y: 38 },
  { id: 2, x: 27, y: 23 },
  { id: 3, x: 38, y: 31 },
  { id: 4, x: 38, y: 15 },
  { id: 5, x: 40, y: 55 },
  { id: 6, x: 49, y: 38 },
  { id: 7, x: 59, y: 15 },
  { id: 8, x: 57, y: 65 },
  { id: 9, x: 60, y: 44 },
  { id: 10, x: 66, y: 37 },
  { id: 11, x: 66, y: 24 },
  { id: 12, x: 82, y: 34 },
  { id: 13, x: 70, y: 48 },
  { id: 14, x: 70, y: 80 }
];

/**
 * Recommend quiz levels based on IRT theta (ability estimate).
 * theta < -1: recommend easy levels (1-3)
 * theta -1 to 0: recommend medium levels (4-6)  
 * theta 0 to 1: recommend harder levels (7-10)
 * theta > 1: recommend advanced levels (11-14)
 */
function getRecommendedLevels(theta, completedLevels) {
  if (theta === null || theta === undefined) return [];
  const uncompleted = quizData.levels.filter(l => !completedLevels.includes(l.id));
  if (uncompleted.length === 0) return [];
  
  let targetRange;
  if (theta < -1) targetRange = [1, 3];
  else if (theta < 0) targetRange = [1, 6];
  else if (theta < 1) targetRange = [4, 10];
  else targetRange = [7, 14];
  
  const recommended = uncompleted
    .filter(l => l.id >= targetRange[0] && l.id <= targetRange[1])
    .slice(0, 3)
    .map(l => l.id);
  
  // If no levels in range, recommend next uncompleted
  if (recommended.length === 0 && uncompleted.length > 0) {
    return [uncompleted[0].id];
  }
  return recommended;
}

export default function QuizLevelMap({ completedLevels, onSelectLevel, studentTheta }) {
  const maxCompleted = completedLevels.length > 0 ? Math.max(...completedLevels) : 0;
  const recommendedLevels = getRecommendedLevels(studentTheta, completedLevels);

  return (
    <div className="relative flex-1 w-full h-full overflow-hidden bg-slate-50 dark:bg-slate-950 transition-all duration-500">
      {/* Background Image */}
      <img
        src="/models/map/thumbnail.jpg"
        className="absolute inset-0 w-full h-full object-cover bg-slate-100 dark:bg-slate-900"
        alt="Motherboard Map"
      />

      {/* SVG Path Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {LEVEL_POSITIONS.map((l, i) => {
          if (i === 0) return null;
          const prev = LEVEL_POSITIONS[i - 1];
          const isCompleted = completedLevels.includes(prev.id);
          const isUnlocked = l.id <= maxCompleted + 1;

          return (
            <line
              key={`line-${l.id}`}
              x1={`${prev.x}%`}
              y1={`${prev.y}%`}
              x2={`${l.x}%`}
              y2={`${l.y}%`}
              stroke={isCompleted ? '#059669' : isUnlocked ? '#059669' : '#e2e8f0'}
              strokeWidth="4"
              strokeDasharray={isUnlocked ? "0" : "8,8"}
              className="transition-all duration-500"
              filter={isUnlocked ? "url(#glow)" : ""}
              style={{ opacity: isUnlocked ? 0.8 : 0.2 }}
            />
          );
        })}
      </svg>

      {/* Level Nodes */}
      {LEVEL_POSITIONS.map((l) => {
        const isCompleted = completedLevels.includes(l.id);
        const isUnlocked = l.id === 1 || completedLevels.includes(l.id - 1);
        const isCurrent = l.id === maxCompleted + 1;
        const isRecommended = recommendedLevels.includes(l.id);
        const levelData = quizData.levels.find(lv => lv.id === l.id);

        return (
          <button
            key={`node-${l.id}`}
            onClick={() => isUnlocked && onSelectLevel(l.id)}
            disabled={!isUnlocked}
            title={levelData ? `${levelData.name}\n${levelData.chapter || ''} — ${levelData.chapterTitle || ''}` : ''}
            className={`absolute -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-4 transition-all duration-300 flex items-center justify-center z-10
              ${isCompleted
                ? 'bg-emerald-500 border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                : isRecommended && isUnlocked
                  ? 'bg-amber-500 border-amber-300 animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.6)]'
                  : isCurrent
                    ? 'bg-primary border-white animate-bounce shadow-emerald-md'
                    : isUnlocked
                      ? 'bg-primary/80 border-primary/40 hover:scale-110 shadow-emerald-sm'
                      : 'bg-slate-800 border-slate-700 opacity-100 cursor-not-allowed shadow-none'
              }`}
            style={{ left: `${l.x}%`, top: `${l.y}%` }}
          >
            <span className={`font-black text-sm ${!isUnlocked ? 'text-slate-500' : 'text-foreground'}`}>
              {l.id}
            </span>
          </button>
        );
      })}

      {/* Map Overlay Info (Bottom Left) */}
      <div className="absolute bottom-6 left-6 pointer-events-none">
        <h3 className="text-foreground font-black text-xl mb-1 flex items-center gap-2">
          <Play size={20} className="text-primary fill-indigo-400" />
          ARKON Quest Map
        </h3>
        <p className="text-secondary text-[10px] uppercase tracking-[0.2em] font-bold">Pilih Level untuk Memulai Kuis</p>
      </div>

      {/* Adaptive Mode Badge */}
      {studentTheta !== null && studentTheta !== undefined && (
        <div className="absolute top-6 left-6 max-w-[280px]">
          <ThetaProgressCard theta={studentTheta} compact />
        </div>
      )}

      {/* Progress Indicator (Bottom Right) */}
      <div className="absolute bottom-6 right-6 flex items-center gap-2 px-4 py-2 bg-primary-light dark:bg-indigo-900/40 border border-primary/30 dark:border-indigo-500/30 rounded-2xl backdrop-blur-md shadow-xl">
        <Trophy size={18} className="text-primary" />
        <span className="text-primary font-black text-base">{completedLevels.length}/14</span>
      </div>

      {/* Legend */}
      <div className="absolute top-6 right-6 flex flex-col gap-2 scale-75 origin-top-right bg-white/60 dark:bg-black/20 p-3 rounded-2xl backdrop-blur-sm border border-border dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,1)]" />
          <span className="text-secondary text-[10px] font-bold uppercase tracking-widest">Selesai</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary shadow-emerald-sm" />
          <span className="text-secondary text-[10px] font-bold uppercase tracking-widest">Rekomendasi</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary/60 shadow-emerald-sm" />
          <span className="text-secondary text-[10px] font-bold uppercase tracking-widest">Terbuka</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-800 border border-slate-700" />
          <span className="text-secondary text-[10px] font-bold uppercase tracking-widest">Terkunci</span>
        </div>
      </div>
    </div>
  );
}
