/**
 * SkeletonCard — Komponen loading skeleton untuk data-heavy sections
 * Memberikan visual feedback saat data sedang dimuat dari server
 */
export default function SkeletonCard({ count = 3, variant = 'card' }) {
  if (variant === 'list') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className=" bg-[var(--bg-surface)] dark:bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 rounded-2xl p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl skeleton dark:bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 skeleton dark:bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 rounded-full w-3/4" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800 dark:bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 rounded-full w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'stat') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className=" bg-[var(--bg-surface)] dark:bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 rounded-2xl p-5 border border-border">
            <div className="h-3 skeleton dark:bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 rounded-full w-1/2 mb-3" />
            <div className="h-8 skeleton dark:bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 rounded-xl w-3/4 mb-2" />
            <div className="h-2 bg-slate-100 dark:bg-slate-800 dark:bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 rounded-full w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  // Default: card variant
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className=" bg-[var(--bg-surface)] dark:bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 rounded-2xl p-6 border border-border shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl skeleton dark:bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-5 skeleton dark:bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 rounded-full w-2/3" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 dark:bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 rounded-full w-full" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 dark:bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 rounded-full w-4/5" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <div className="h-6 skeleton dark:bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 rounded-full w-16" />
            <div className="h-6 skeleton dark:bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 rounded-full w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
