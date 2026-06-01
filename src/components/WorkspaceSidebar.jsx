import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Gamepad2, Trophy, Medal, ChevronDown, ChevronRight,
  Shield, Users, BarChart2, LayoutTemplate, User, Swords
} from 'lucide-react';

const MENU_ITEMS = [
  { id: 'classroom', label: 'Classroom', icon: BookOpen, color: 'text-blue-600', bgActive: 'bg-blue-500/10' },
  { 
    id: 'pc-quest', 
    label: 'PC Quest', 
    icon: Gamepad2, 
    color: 'text-rose-600', 
    bgActive: 'bg-rose-500/10',
    children: [
      { id: 'quiz', label: 'Quiz Map' },
      { id: 'shop', label: 'Hardware Shop' },
      { id: 'assembly', label: 'Assembly Lab' },
      { id: 'showroom', label: '🏆 Showroom' },
      { id: 'detective', label: '🔍 Component Detective' },
    ]
  },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, color: 'text-amber-600', bgActive: 'bg-amber-500/10' },
  { id: 'achievements', label: 'Achievements', icon: Medal, color: 'text-emerald-600', bgActive: 'bg-emerald-500/10' },
  { id: 'profile', label: 'My Profile', icon: User, color: 'text-indigo-600', bgActive: 'bg-indigo-500/10' },
];

export default function WorkspaceSidebar({ activeSection, onSectionChange, isCollapsed }) {
  const [pcQuestOpen, setPcQuestOpen] = useState(
    ['shop', 'assembly', 'quiz', 'showroom', 'detective'].includes(activeSection)
  );

  const isActive = (id) => {
    if (id === 'pc-quest') return ['shop', 'assembly', 'quiz', 'showroom', 'detective'].includes(activeSection);
    return activeSection === id;
  };

  const handleClick = (item) => {
    if (isCollapsed) return; 
    if (item.children) {
      setPcQuestOpen(!pcQuestOpen);
      if (!pcQuestOpen) onSectionChange(item.children[0].id);
    } else {
      onSectionChange(item.id);
    }
  };

  return (
    <aside 
      className={`${isCollapsed ? 'w-[80px]' : 'w-[220px]'} bg-[#0d1224] border-r border-border flex flex-col shrink-0 h-full transition-all duration-300 ease-in-out hidden md:flex`}
      role="navigation"
      aria-label="Menu navigasi utama"
    >
      {/* Logo */}
      <div className={`px-5 py-5 border-b border-border flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
        <Link to="/" className="flex items-center gap-3 no-underline group">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-shadow shrink-0">
            <span className="text-foreground font-black text-sm">A</span>
          </div>
          {!isCollapsed && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
              <h1 className="font-black text-foreground text-base leading-none tracking-tight">ARKON</h1>
              <p className="text-[9px] text-indigo-600 font-bold tracking-widest mt-0.5">WORKSPACE</p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar" aria-label="Menu workspace">
        {!isCollapsed && <p className="text-[10px] font-bold text-secondary uppercase tracking-widest px-3 mb-3 animate-in fade-in duration-300">Menu</p>}
        
        {MENU_ITEMS.map((item) => (
          <div key={item.id}>
            <button
              onClick={() => isCollapsed ? onSectionChange(item.children ? item.children[0].id : item.id) : handleClick(item)}
              title={isCollapsed ? item.label : ''}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all border border-transparent
                ${isActive(item.id)
                  ? `${item.bgActive} text-foreground border-border shadow-inner`
                  : 'text-secondary hover:text-secondary hover:bg-white shadow-sm border border-border'
                } ${isCollapsed ? 'justify-center' : ''}`}
              aria-current={isActive(item.id) ? 'page' : undefined}
              aria-expanded={item.children ? pcQuestOpen : undefined}
              aria-label={item.label}
            >
              <item.icon size={18} className={isActive(item.id) ? item.color : 'text-secondary'} aria-hidden="true" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left animate-in fade-in slide-in-from-left-2 duration-300">{item.label}</span>
                  {item.children && (
                    pcQuestOpen
                      ? <ChevronDown size={14} className="text-secondary" />
                      : <ChevronRight size={14} className="text-secondary" />
                  )}
                </>
              )}
            </button>
            
            {/* Sub-items */}
            {item.children && pcQuestOpen && !isCollapsed && (
              <div className="ml-5 pl-3 border-l border-border mt-1 space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-300" role="group" aria-label="Sub-menu PC Quest">
                {item.children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => onSectionChange(child.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all
                      ${activeSection === child.id 
                        ? 'text-rose-600 bg-rose-500/5' 
                        : 'text-secondary hover:text-secondary hover:bg-white shadow-sm border border-border'}`}
                    aria-current={activeSection === child.id ? 'page' : undefined}
                  >
                    {child.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Quick Links */}
      <div className={`px-3 py-4 border-t border-border space-y-1 ${isCollapsed ? 'flex flex-col items-center' : ''}`} role="navigation" aria-label="Quick links">
        <Link
          to="/ar-lab"
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-secondary hover:text-secondary hover:bg-white shadow-sm border border-border transition-all no-underline ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? "AR Hardware Lab" : ""}
        >
          <span className="text-base shrink-0">🔬</span>
          {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300">AR Hardware Lab</span>}
        </Link>
        <Link
          to="/cpu-simulator"
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-secondary hover:text-secondary hover:bg-white shadow-sm border border-border transition-all no-underline ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? "CPU Simulator" : ""}
        >
          <span className="text-base shrink-0">⚡</span>
          {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300">CPU Simulator</span>}
        </Link>
      </div>
    </aside>
  );
}
