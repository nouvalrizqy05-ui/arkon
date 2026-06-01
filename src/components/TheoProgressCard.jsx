import React from 'react';
import { BrainCircuit, TrendingUp } from 'lucide-react';

export default function TheoProgressCard({ theta, percentile }) {
  // Safe defaults
  const validTheta = typeof theta === 'number' ? theta : 0;
  
  // Mapping theta -> level name
  let levelName = '';
  let levelColor = '';
  let ringColor = '';
  let percentage = 50;

  if (validTheta <= -2) {
    levelName = 'Pemula';
    levelColor = 'text-slate-500';
    ringColor = 'text-slate-200';
    percentage = 10;
  } else if (validTheta <= -1) {
    levelName = 'Dasar';
    levelColor = 'text-amber-500';
    ringColor = 'text-amber-200';
    percentage = 30;
  } else if (validTheta <= 0) {
    levelName = 'Berkembang';
    levelColor = 'text-emerald-500';
    ringColor = 'text-emerald-200';
    percentage = 50;
  } else if (validTheta <= 1) {
    levelName = 'Kompeten';
    levelColor = 'text-blue-500';
    ringColor = 'text-blue-200';
    percentage = 70;
  } else if (validTheta <= 2) {
    levelName = 'Mahir';
    levelColor = 'text-purple-500';
    ringColor = 'text-purple-200';
    percentage = 90;
  } else {
    levelName = 'Master';
    levelColor = 'text-rose-500';
    ringColor = 'text-rose-200';
    percentage = 100;
  }

  // Calculate SVG circle properties
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white border border-border shadow-sm rounded-2xl p-4 flex items-center gap-4">
      {/* Circular Ring */}
      <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r={radius}
            className="stroke-slate-100"
            strokeWidth="6"
            fill="transparent"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            className={`stroke-current ${levelColor} transition-all duration-1000 ease-out`}
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center ${levelColor}`}>
          <BrainCircuit size={20} />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-xs font-black text-secondary uppercase tracking-widest">Level Kemampuan</h4>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md bg-opacity-10 bg-current ${levelColor}`}>
            {validTheta.toFixed(2)} θ
          </span>
        </div>
        <p className={`text-lg font-black leading-tight truncate ${levelColor}`}>
          {levelName}
        </p>
        {percentile !== undefined && percentile !== null && (
          <p className="text-[10px] text-secondary mt-1 flex items-center gap-1">
            <TrendingUp size={12} className="text-emerald-500" />
            Lebih baik dari <strong className="text-foreground">{percentile}%</strong> mahasiswa
          </p>
        )}
      </div>
    </div>
  );
}
