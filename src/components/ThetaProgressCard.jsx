import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { getAbilityLevel, getLevelProgress, getPercentileRank, getOverallProgress, ABILITY_LEVELS } from '../utils/theta';

/**
 * ThetaProgressCard — TASK-FEAT-002
 *
 * Replaces raw theta display with meaningful visualization:
 * - Circular progress ring with animated fill
 * - Human-readable level name (Pemula → Master)
 * - Percentile rank within class
 * - Level progress indicator
 * - Theta history chart (UX §5.3) when showHistory=true + apiUrl/studentId/token provided
 *
 * Satisfies: FR-IRT-005, UX §5.3
 */
export default function ThetaProgressCard({
  theta = 0,
  classThetas = [],
  compact = false,
  showHistory = false,
  // Props for history chart — optional, only needed when showHistory=true
  studentId = null,
  token = null,
  apiUrl = null,
}) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [historyData, setHistoryData] = useState([]);
  const [historyMsg, setHistoryMsg] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const level = useMemo(() => getAbilityLevel(theta), [theta]);
  const levelProgress = useMemo(() => getLevelProgress(theta), [theta]);
  const percentile = useMemo(() => getPercentileRank(theta, classThetas), [theta, classThetas]);
  const overallProgress = useMemo(() => getOverallProgress(theta), [theta]);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(overallProgress), 100);
    return () => clearTimeout(timer);
  }, [overallProgress]);

  // UX §5.3: Fetch theta history when showHistory=true
  useEffect(() => {
    if (!showHistory || !studentId || !token || !apiUrl) return;
    let cancelled = false;
    setHistoryLoading(true);
    (async () => {
      try {
        const res = await fetch(`${apiUrl}/api/irt/student/${studentId}/history?weeks=8`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('fetch failed');
        const json = await res.json();
        if (!cancelled) {
          setHistoryData(json.data_points || []);
          setHistoryMsg(json.message || null);
        }
      } catch {
        if (!cancelled) setHistoryMsg('Gagal memuat riwayat perkembangan.');
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [showHistory, studentId, token, apiUrl]);

  // SVG circular progress ring dimensions
  const size = compact ? 80 : 120;
  const strokeWidth = compact ? 6 : 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="theta-card-compact"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 16px',
          borderRadius: '12px',
          background: level.bgColor,
          border: `1px solid ${level.color}33`,
        }}
      >
        <div style={{ position: 'relative', width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} />
            <motion.circle
              cx={size/2} cy={size/2} r={radius} fill="none"
              stroke={level.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px',
          }}>
            {level.emoji}
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 700, color: level.color, fontSize: '14px' }}>
            {level.name}
          </div>
          <div style={{ fontSize: '11px', opacity: 0.7 }}>
            Top {100 - percentile}% kelas
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="theta-progress-card"
      style={{
        background: 'var(--card-bg, rgba(255,255,255,0.05))',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px',
        padding: '24px',
        textAlign: 'center',
        minWidth: '260px',
      }}
    >
      {/* Circular Progress Ring */}
      <div style={{ position: 'relative', width: size, height: size, margin: '0 auto 16px' }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background track */}
          <circle
            cx={size/2} cy={size/2} r={radius}
            fill="none" stroke="rgba(255,255,255,0.08)"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <motion.circle
            cx={size/2} cy={size/2} r={radius}
            fill="none" stroke={level.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '28px' }}>{level.emoji}</span>
        </div>
      </div>

      {/* Level Name */}
      <AnimatePresence mode="wait">
        <motion.h3
          key={level.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          style={{
            fontSize: '22px',
            fontWeight: 800,
            color: level.color,
            margin: '0 0 4px 0',
            letterSpacing: '-0.01em',
          }}
        >
          {level.name}
        </motion.h3>
      </AnimatePresence>

      {/* Percentile Rank */}
      {classThetas.length > 0 && (
        <p style={{
          fontSize: '13px',
          margin: '0 0 16px 0',
          opacity: 0.7,
        }}>
          Kamu lebih baik dari <strong style={{ color: level.color }}>{percentile}%</strong> mahasiswa di kelas ini
        </p>
      )}

      {/* Level Progress Bar */}
      <div style={{ marginTop: '12px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '11px',
          opacity: 0.5,
          marginBottom: '6px',
        }}>
          <span>{level.name}</span>
          <span>{Math.round(levelProgress)}%</span>
        </div>
        <div style={{
          width: '100%',
          height: '6px',
          borderRadius: '3px',
          background: 'rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${levelProgress}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            style={{
              height: '100%',
              borderRadius: '3px',
              background: `linear-gradient(90deg, ${level.color}, ${level.color}cc)`,
            }}
          />
        </div>
      </div>

      {/* All Levels Overview */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '4px',
        marginTop: '16px',
      }}>
        {ABILITY_LEVELS.map((l) => (
          <motion.div
            key={l.id}
            title={l.name}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              background: l.id === level.id ? l.bgColor : 'rgba(255,255,255,0.04)',
              border: l.id === level.id ? `2px solid ${l.color}` : '1px solid rgba(255,255,255,0.06)',
              opacity: ABILITY_LEVELS.indexOf(l) <= ABILITY_LEVELS.indexOf(level) ? 1 : 0.3,
              cursor: 'default',
            }}
            whileHover={{ scale: 1.15 }}
          >
            {l.emoji}
          </motion.div>
        ))}
      </div>

      {/* Theta debug info (only in development) */}
      {import.meta.env.DEV && (
        <div style={{
          marginTop: '12px',
          fontSize: '10px',
          opacity: 0.3,
          fontFamily: 'monospace',
        }}>
          θ = {typeof theta === 'number' ? theta.toFixed(3) : '0.000'}
        </div>
      )}

      {/* UX §5.3 — Theta History Chart */}
      {showHistory && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ marginTop: '20px', width: '100%' }}
        >
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            opacity: 0.5,
            marginBottom: '10px',
            textAlign: 'left',
          }}>
            📈 Perkembangan Kemampuan (8 Minggu)
          </div>

          {historyLoading && (
            <div style={{ textAlign: 'center', padding: '20px 0', opacity: 0.4, fontSize: '12px' }}>
              Memuat riwayat…
            </div>
          )}

          {!historyLoading && historyMsg && historyData.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '14px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.04)',
              fontSize: '12px',
              opacity: 0.55,
              lineHeight: 1.5,
            }}>
              {historyMsg}
            </div>
          )}

          {!historyLoading && historyData.length > 0 && (
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={historyData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id={`thetaGrad-${level.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={level.color} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={level.color} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.35)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[-3, 3]}
                  tickCount={4}
                  tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(20,20,30,0.9)',
                    border: `1px solid ${level.color}55`,
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                  formatter={(val) => [val.toFixed(2), 'θ']}
                  labelFormatter={(label) => label}
                />
                {/* Reference line at theta=0 (baseline) */}
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="theta"
                  stroke={level.color}
                  strokeWidth={2}
                  fill={`url(#thetaGrad-${level.id})`}
                  dot={{ r: 3, fill: level.color, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: level.color }}
                  isAnimationActive
                  animationDuration={900}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
