export const PROFILE_AVATARS = [
  { id: 'cpu_bot', name: 'CPU Bot', color: 'from-blue-400 to-indigo-500', icon: 'Cpu' },
  { id: 'ram_ghost', name: 'RAM Ghost', color: 'from-emerald-400 to-teal-500', icon: 'MemoryStick' },
  { id: 'gpu_dragon', name: 'GPU Dragon', color: 'from-rose-400 to-red-500', icon: 'MonitorPlay' },
  { id: 'ssd_ninja', name: 'SSD Ninja', color: 'from-amber-400 to-orange-500', icon: 'HardDrive' },
  { id: 'psu_titan', name: 'PSU Titan', color: 'from-purple-400 to-violet-500', icon: 'Zap' },
  { id: 'fan_breeze', name: 'Fan Breeze', color: 'from-cyan-400 to-blue-500', icon: 'Wind' },
];

export const PROFILE_FRAMES = [
  { 
    id: 'default', 
    name: 'Standard Frame', 
    condition: 'none', 
    style: 'border-2 border-white/20' 
  },
  { 
    id: 'quiz_warrior', 
    name: 'Quiz Warrior', 
    condition: 'badge:quiz_warrior', 
    style: 'border-2 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]' 
  },
  { 
    id: 'perfect_score', 
    name: 'Perfect Scholar', 
    condition: 'badge:perfect_score', 
    style: 'border-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)]' 
  },
  { 
    id: 'pipeline_master', 
    name: 'Assembly Hacker', 
    condition: 'badge:pipeline_master', 
    style: 'border-2 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.7)]' 
  },
  { 
    id: 'master_season', 
    name: 'Archi Master', 
    condition: 'master', 
    style: 'border-4 border-transparent bg-clip-border bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.8)] animate-pulse' 
  }
];
