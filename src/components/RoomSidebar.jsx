import { useState } from 'react';
import {
  LayoutDashboard, Gamepad2, ShoppingBag, Trophy,
  Users, Swords, MessageSquare, ClipboardList, Eye, BarChart2,
  Radio, Settings, ChevronDown, ChevronRight, Flame, Shield,
  ArrowLeft, BookOpen, Layers
} from 'lucide-react';

const STUDENT_MENU = [
  { id: 'overview',   label: 'Overview',    icon: LayoutDashboard, color: 'text-primary',   bgActive: 'bg-primary-soft' },
  {
    id: 'belajar-group', label: 'Belajar', icon: BookOpen,
    color: 'text-primary', bgActive: 'bg-primary-soft',
    children: [
      { id: 'assembly',       label: '🖥️ Assembly Lab' },
      { id: 'quiz',           label: '🎮 Quiz Map' },
      { id: 'detective',      label: '🔍 Component Detective' },
      { id: 'cpu-simulator',  label: '⚡ CPU Simulator' },
      { id: 'ar-lab',         label: '🔬 AR Hardware Lab' },
    ]
  },
  {
    id: 'komunitas-group', label: 'Komunitas', icon: Users,
    color: 'text-sky-600', bgActive: 'bg-sky-50',
    children: [
      { id: 'shop',      label: '🛒 Hardware Shop' },
      { id: 'showroom',  label: '🖼️ Showroom' },
    ]
  },
  { id: 'my-activities', label: 'Tugas',       icon: ClipboardList, color: 'text-amber-600', bgActive: 'bg-amber-50' },
  { id: 'leaderboard',   label: 'Leaderboard', icon: Trophy,         color: 'text-yellow-600',bgActive: 'bg-yellow-50' },
  { id: 'tournament',    label: 'Tournament',  icon: Swords,          color: 'text-orange-600',bgActive: 'bg-orange-50' },
  { id: 'study-group',   label: 'Group Chat',  icon: MessageSquare,  color: 'text-sky-600',  bgActive: 'bg-sky-50' },
];

const DOSEN_MENU = [
  { id: 'overview',   label: 'Overview',    icon: LayoutDashboard, color: 'text-primary',   bgActive: 'bg-primary-soft' },
  {
    id: 'belajar-group', label: 'Belajar', icon: BookOpen,
    color: 'text-primary', bgActive: 'bg-primary-soft',
    children: [
      { id: 'assembly',      label: '🖥️ Assembly Lab' },
      { id: 'quiz',          label: '🎮 Quiz Map' },
      { id: 'detective',     label: '🔍 Component Detective' },
      { id: 'cpu-simulator', label: '⚡ CPU Simulator' },
      { id: 'ar-lab',        label: '🔬 AR Hardware Lab' },
    ]
  },
  {
    id: 'komunitas-group', label: 'Komunitas', icon: Users,
    color: 'text-sky-600', bgActive: 'bg-sky-50',
    children: [
      { id: 'shop',     label: '🛒 Hardware Shop' },
      { id: 'showroom', label: '🖼️ Showroom' },
    ]
  },
  { id: 'manage-activities', label: 'Kelola Tugas',    icon: ClipboardList, color: 'text-amber-600',  bgActive: 'bg-amber-50' },
  { id: 'student-work',      label: 'Karya Mahasiswa', icon: Eye,            color: 'text-primary',    bgActive: 'bg-primary-soft' },
  { id: 'leaderboard',       label: 'Leaderboard',     icon: Trophy,          color: 'text-yellow-600',bgActive: 'bg-yellow-50' },
  { id: 'tournament',        label: 'Tournament',      icon: Swords,           color: 'text-orange-600',bgActive: 'bg-orange-50' },
  { id: 'study-group',       label: 'Group Chat',      icon: MessageSquare,   color: 'text-sky-600',   bgActive: 'bg-sky-50' },
];

const DOSEN_TOOLS = [
  { id: 'analytics',    label: 'Analytics & IRT',icon: BarChart2,   color: 'text-primary',   bgActive: 'bg-primary-soft' },
  { id: 'heatmap',      label: 'Heat Map',        icon: Flame,       color: 'text-rose-600',  bgActive: 'bg-rose-50' },
  { id: 'broadcast',    label: 'Kendali Kelas',   icon: Radio,       color: 'text-violet-600',bgActive: 'bg-violet-50' },
  { id: 'gm-panel',     label: 'Panel Dosen',     icon: Shield,      color: 'text-primary',   bgActive: 'bg-primary-soft' },
  { id: 'room-settings',label: 'Pengaturan',      icon: Settings,    color: 'text-secondary', bgActive: 'bg-slate-100' },
];

const BELAJAR_IDS  = ['assembly','quiz','detective','cpu-simulator','ar-lab'];
const KOMUNITAS_IDS = ['shop','showroom'];

export default function RoomSidebar({ activeTab, onTabChange, userRole, roomName, roomCode, isCollapsed, onBack }) {
  const [openGroup, setOpenGroup] = useState(() => {
    if (BELAJAR_IDS.includes(activeTab))   return 'belajar-group';
    if (KOMUNITAS_IDS.includes(activeTab)) return 'komunitas-group';
    return null;
  });

  const menuItems = userRole === 'dosen' ? DOSEN_MENU : STUDENT_MENU;

  const isActive = (id) => {
    if (id === 'belajar-group')   return BELAJAR_IDS.includes(activeTab);
    if (id === 'komunitas-group') return KOMUNITAS_IDS.includes(activeTab);
    return activeTab === id;
  };

  const handleClick = (item) => {
    if (isCollapsed) {
      onTabChange(item.children ? item.children[0].id : item.id); return;
    }
    if (item.children) {
      setOpenGroup(openGroup === item.id ? null : item.id);
      if (openGroup !== item.id) onTabChange(item.children[0].id);
    } else {
      onTabChange(item.id);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" 
          onClick={() => onTabChange(activeTab)} 
        />
      )}
      <aside
        className={`${isCollapsed ? 'hidden md:flex w-[64px]' : 'flex w-[260px] md:w-[220px] fixed md:static inset-y-0 left-0 z-50'} bg-white border-r border-slate-200 flex-col shrink-0 h-full transition-transform duration-300 ease-in-out ${isCollapsed ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}
        role="navigation" aria-label="Room navigation">

      {/* Room header */}
      <div className={`px-3 py-3 border-b border-slate-100 ${isCollapsed ? 'items-center' : ''}`}>
        <button onClick={onBack}
          className={`flex items-center gap-1.5 text-secondary hover:text-primary transition-colors mb-2 text-xs font-medium ${isCollapsed ? 'justify-center w-full' : ''}`}
          title="Kembali ke Dashboard">
          <ArrowLeft size={13} />
          {!isCollapsed && <span>Dashboard</span>}
        </button>
        {!isCollapsed ? (
          <div>
            <h2 className="font-bold text-foreground text-sm leading-tight truncate" title={roomName}>
              {roomName}
            </h2>
            <p className="text-[9px] text-primary font-semibold tracking-widest mt-0.5 uppercase">{roomCode}</p>
          </div>
        ) : (
          <div className="w-8 h-8 bg-primary-soft border border-primary/20 rounded-lg flex items-center justify-center mx-auto">
            <Layers size={14} className="text-primary" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto custom-scrollbar" aria-label="Room menu">
        {!isCollapsed && (
          <p className="text-[9px] font-semibold text-secondary uppercase tracking-widest px-2 mb-2 mt-1">Menu</p>
        )}

        {menuItems.map(item => (
          <div key={item.id}>
            <button
              onClick={() => handleClick(item)}
              title={isCollapsed ? item.label : ''}
              aria-current={isActive(item.id) ? 'page' : undefined}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all
                ${isActive(item.id)
                  ? `${item.bgActive} ${item.color} font-semibold`
                  : 'text-secondary hover:text-foreground hover:bg-slate-50'
                } ${isCollapsed ? 'justify-center' : ''}`}>
              <item.icon size={16} className={isActive(item.id) ? item.color : 'text-secondary'} />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {item.children && (
                    openGroup === item.id
                      ? <ChevronDown size={12} className="text-secondary" />
                      : <ChevronRight size={12} className="text-secondary" />
                  )}
                </>
              )}
            </button>

            {/* Children */}
            {item.children && openGroup === item.id && !isCollapsed && (
              <div className="ml-4 pl-3 border-l border-slate-200 mt-0.5 space-y-0.5">
                {item.children.map(child => (
                  <button key={child.id} onClick={() => onTabChange(child.id)}
                    aria-current={activeTab === child.id ? 'page' : undefined}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all
                      ${activeTab === child.id
                        ? 'bg-primary-soft text-primary font-semibold'
                        : 'text-secondary hover:text-foreground hover:bg-slate-50'
                      }`}>
                    {child.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Dosen tools */}
        {userRole === 'dosen' && (
          <>
            {!isCollapsed && (
              <p className="text-[9px] font-semibold text-secondary uppercase tracking-widest px-2 mb-2 mt-4">
                Dosen Tools
              </p>
            )}
            {DOSEN_TOOLS.map(item => (
              <button key={item.id} onClick={() => onTabChange(item.id)}
                title={isCollapsed ? item.label : ''}
                aria-current={activeTab === item.id ? 'page' : undefined}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all
                  ${activeTab === item.id
                    ? `${item.bgActive} ${item.color} font-semibold`
                    : 'text-secondary hover:text-foreground hover:bg-slate-50'
                  } ${isCollapsed ? 'justify-center' : ''}`}>
                <item.icon size={16} className={activeTab === item.id ? item.color : 'text-secondary'} />
                {!isCollapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
              </button>
            ))}
          </>
        )}
      </nav>

      {/* Tentang ARKON */}
      <div className={`px-2 py-2 border-t border-slate-100 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <button onClick={() => onTabChange('about')}
          title={isCollapsed ? 'Tentang ARKON' : ''}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-secondary hover:text-primary hover:bg-primary-soft transition-all">
          <span className="text-sm shrink-0">📖</span>
          {!isCollapsed && <span>Tentang ARKON</span>}
        </button>
      </div>
    </aside>
    </>
  );
}
