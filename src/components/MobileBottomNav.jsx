/**
 * ARKON Mobile Bottom Navigation
 * F-014: Mobile-first redesign
 * Shown only on screens < 768px
 */
import { Home, BookOpen, Cpu, Wrench, User } from 'lucide-react';
import { useIsMobile } from '../hooks/useIsMobile';

const NAV_ITEMS = [
  { id: 'dashboard', icon: Home,    label: 'Home' },
  { id: 'quiz',      icon: BookOpen, label: 'Quiz' },
  { id: 'simulator', icon: Cpu,      label: 'Simulator' },
  { id: 'builder',   icon: Wrench,   label: 'PC Build' },
  { id: 'profile',   icon: User,     label: 'Profil' },
];

export default function MobileBottomNav({ activeTab, onTabChange, coinCount }) {
  const isMobile = useIsMobile(768);
  if (!isMobile) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 safe-area-bottom"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around px-2 pt-1 pb-1.5">
        {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all active:scale-95
                ${isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-500'
                }`}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className={`relative p-1 rounded-lg transition-colors ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                {id === 'profile' && coinCount != null && (
                  <span className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {coinCount > 99 ? '99+' : coinCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-semibold leading-none ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
