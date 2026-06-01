/**
 * SkeletonLoader — Professional loading placeholders for heavy components
 * 
 * Variants:
 * - 'dashboard': Analytics dashboard skeleton
 * - 'simulator': CPU Simulator / AR Lab skeleton
 * - 'quiz': Quiz game loading skeleton
 * - 'stat': Stat cards row
 * - 'list': List items
 * - 'card': Generic content card
 * 
 * Mengikuti prinsip: "Skeleton UI > Spinner" untuk UX profesional
 */
export default function SkeletonLoader({ variant = 'card', count = 3 }) {
  const pulseClass = 'animate-pulse';

  // Reusable skeleton bar
  const Bar = ({ w = 'w-full', h = 'h-4', className = '' }) => (
    <div className={`${h} ${w} bg-white/[0.06] rounded-lg ${className}`} />
  );

  // ============================================================
  // DASHBOARD VARIANT — For AnalyticsDashboard
  // ============================================================
  if (variant === 'dashboard') {
    return (
      <div className={`${pulseClass} space-y-6 p-6`}>
        {/* Stat Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <Bar w="w-20" h="h-3" className="mb-3" />
              <Bar w="w-16" h="h-8" className="mb-2" />
              <Bar w="w-24" h="h-2" />
            </div>
          ))}
        </div>
        {/* Chart Area */}
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <Bar w="w-40" h="h-4" className="mb-6" />
          <div className="h-48 flex items-end gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex-1 bg-white/[0.04] rounded-t-lg" 
                style={{ height: `${30 + Math.sin(i) * 40 + 30}%` }} />
            ))}
          </div>
        </div>
        {/* Table */}
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-3">
          <Bar w="w-48" h="h-4" className="mb-4" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-white/[0.06] shrink-0" />
              <Bar w="w-32" h="h-3" />
              <Bar w="w-20" h="h-3" className="ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ============================================================
  // SIMULATOR VARIANT — For CpuSimulator & ArLab
  // ============================================================
  if (variant === 'simulator') {
    return (
      <div className={`${pulseClass} p-6 space-y-4`}>
        {/* Header bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.06]" />
            <div className="space-y-2">
              <Bar w="w-36" h="h-4" />
              <Bar w="w-24" h="h-2" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-24 h-9 rounded-xl bg-white/[0.06]" />
            <div className="w-24 h-9 rounded-xl bg-white/[0.06]" />
          </div>
        </div>
        {/* Main viewport */}
        <div className="h-[400px] rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.06] mx-auto" />
            <Bar w="w-40" h="h-3" className="mx-auto" />
            <Bar w="w-28" h="h-2" className="mx-auto" />
          </div>
        </div>
        {/* Controls bar */}
        <div className="flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-1 h-10 rounded-xl bg-white/[0.06]" />
          ))}
        </div>
      </div>
    );
  }

  // ============================================================
  // QUIZ VARIANT — For QuizGame
  // ============================================================
  if (variant === 'quiz') {
    return (
      <div className={`${pulseClass} p-6 max-w-2xl mx-auto space-y-6`}>
        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <Bar w="w-full" h="h-2" />
          <Bar w="w-12" h="h-4" />
        </div>
        {/* Question card */}
        <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-4">
          <Bar w="w-20" h="h-3" />
          <Bar w="w-full" h="h-5" />
          <Bar w="w-3/4" h="h-5" />
        </div>
        {/* Answer options */}
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-white/[0.06] shrink-0" />
              <Bar w="w-3/4" h="h-4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ============================================================
  // STAT VARIANT
  // ============================================================
  if (variant === 'stat') {
    return (
      <div className={`${pulseClass} grid grid-cols-2 md:grid-cols-4 gap-4`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <Bar w="w-1/2" h="h-3" className="mb-3" />
            <Bar w="w-3/4" h="h-8" className="mb-2" />
            <Bar w="w-2/3" h="h-2" />
          </div>
        ))}
      </div>
    );
  }

  // ============================================================
  // LIST VARIANT
  // ============================================================
  if (variant === 'list') {
    return (
      <div className={`${pulseClass} space-y-3`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.06] shrink-0" />
            <div className="flex-1 space-y-2">
              <Bar w="w-3/4" h="h-4" />
              <Bar w="w-1/2" h="h-3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ============================================================
  // DEFAULT CARD VARIANT
  // ============================================================
  return (
    <div className={`${pulseClass} space-y-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.06] shrink-0" />
            <div className="flex-1 space-y-3">
              <Bar w="w-2/3" h="h-5" />
              <Bar w="w-full" h="h-3" />
              <Bar w="w-4/5" h="h-3" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Bar w="w-16" h="h-6" />
            <Bar w="w-20" h="h-6" />
          </div>
        </div>
      ))}
    </div>
  );
}
