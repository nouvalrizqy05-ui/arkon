import { useState, useEffect } from 'react';
import { Trophy, Coins, Zap, Cpu, Sparkles, Clock, Crown } from 'lucide-react';

const CATEGORIES = [
  { id: 'coins', label: 'Sultan Koin (Most Coins)', icon: Coins, color: 'text-amber-600', bg: 'bg-amber-400/20' },
  { id: 'xp', label: 'Archi Scholar (Most XP)', icon: Sparkles, color: 'text-primary', bg: 'bg-indigo-400/20' },
  { id: 'quizzes', label: 'Master Kuis (Most Quizzes)', icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-400/20' },
  { id: 'coder', label: 'Ahli Rakit (Best Builder)', icon: Cpu, color: 'text-rose-600', bg: 'bg-rose-400/20' }
];

export default function MainLeaderboard({ studentId, token, apiUrl, roomId }) {
  const [activeCategory, setActiveCategory] = useState('coins');
  const [scope, setScope] = useState(roomId ? 'room' : 'global');
  const [data, setData] = useState([]);
  const [season, setSeason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeftStr, setTimeLeftStr] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, [activeCategory, scope]);

  useEffect(() => {
    if (!season) return;
    
    const interval = setInterval(() => {
      const end = new Date(season.end).getTime();
      const now = new Date().getTime();
      const distance = end - now;

      if (distance < 0) {
        setTimeLeftStr("Season Berakhir");
        clearInterval(interval);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setTimeLeftStr(`${days} Hari ${hours} Jam tersisa`);
    }, 1000);

    return () => clearInterval(interval);
  }, [season]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/leaderboard/main?category=${activeCategory}&room_id=${scope === 'room' ? roomId : 'global'}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json.leaderboard);
        setSeason(json.season);
      } else {
        if (res.status === 404) {
          console.error("Backend endpoint tidak ditemukan. Tolong restart server (npm run dev).");
        } else {
          console.error("Fetch failed with status:", res.status);
        }
      }
    } catch (err) {
      console.error("Gagal mengambil main leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const currentCategoryObj = CATEGORIES.find(c => c.id === activeCategory);
  const Icon = currentCategoryObj.icon;

  return (
    <div className="p-8 max-w-4xl mx-auto h-full flex flex-col min-h-0">
      
      {/* Header & Season Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
            <Trophy className="text-amber-600" size={32} />
            Leaderboard Utama
          </h1>
          <p className="text-secondary text-sm mt-1">Peringkat akan di-reset setiap 3 bulan. Pemuncak akhir season akan mendapat gelar Archi Master.</p>
          {roomId && (
            <div className="flex bg-white shadow-sm border border-border border border-border p-1 rounded-xl w-fit mt-4">
              <button 
                onClick={() => setScope('room')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${scope === 'room' ? 'bg-primary text-foreground' : 'text-secondary hover:text-secondary'}`}
              >
                Kelas Ini
              </button>
              <button 
                onClick={() => setScope('global')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${scope === 'global' ? 'bg-primary text-foreground' : 'text-secondary hover:text-secondary'}`}
              >
                Global
              </button>
            </div>
          )}
        </div>
        
        {season && (
          <div className="bg-white shadow-sm border border-border border border-border rounded-2xl p-4 flex flex-col items-end">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-primary uppercase tracking-widest">{season.name}</span>
            </div>
            <div className="flex items-center gap-2 text-secondary text-sm">
              <Clock size={14} />
              <span className="font-bold">{timeLeftStr}</span>
            </div>
          </div>
        )}
      </div>

      {/* Category Tabs / Dropdown */}
      <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 mb-6 shrink-0">
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.id;
          const CatIcon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold whitespace-nowrap transition-all duration-300 ${
                isActive 
                  ? `${cat.bg} ${cat.color} border border-${cat.color.split('-')[1]}-500/50 shadow-lg`
                  : 'bg-white shadow-sm border border-border text-secondary hover:bg-white shadow-sm border border-border hover:text-foreground border border-transparent'
              }`}
            >
              <CatIcon size={18} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Leaderboard Table */}
      <div className="flex-1 bg-white shadow-sm border border-border border border-border rounded-3xl overflow-hidden flex flex-col min-h-0">
        <div className="flex items-center px-6 py-4 border-b border-border bg-black/20 text-xs font-bold text-secondary uppercase tracking-widest">
          <div className="w-16">Rank</div>
          <div className="flex-1">Mahasiswa</div>
          <div className="w-32 text-right">Skor / Poin</div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="w-8 h-8 border-4 border-primary/20 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-full text-secondary p-8 text-center">
              <Icon size={48} className="mb-4 opacity-50" />
              <p className="font-bold text-lg">Belum ada data di Season ini.</p>
              <p className="text-sm mt-1">Jadilah yang pertama untuk menduduki peringkat!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.map((player) => (
                <div 
                  key={player.id}
                  className={`flex items-center px-4 py-3 rounded-2xl transition-all ${
                    player.id === studentId 
                      ? 'bg-primary-light border border-primary/50' 
                      : 'hover:bg-white shadow-sm border border-border border border-transparent'
                  }`}
                >
                  <div className="w-16 font-black text-xl">
                    {player.rank === 1 ? <span className="text-amber-600 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">#1</span> : 
                     player.rank === 2 ? <span className="text-slate-300">#2</span> : 
                     player.rank === 3 ? <span className="text-orange-400">#3</span> : 
                     <span className="text-secondary">#{player.rank}</span>}
                  </div>
                  
                  <div className="flex-1 flex items-center gap-4 min-w-0">
                    <img 
                      src={`https://ui-avatars.com/api/?name=${player.full_name}&background=165DFF&color=fff&size=40`} 
                      className="w-10 h-10 rounded-xl"
                      alt={player.full_name}
                    />
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold truncate ${player.id === studentId ? 'text-indigo-700' : 'text-secondary'}`}>
                          {player.full_name}
                        </span>
                        {player.is_master && (
                          <div className="flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 rounded-md" title={`Archi Master - ${player.master_season}`}>
                            <Crown size={12} className="text-black" />
                            <span className="text-[9px] font-black text-black uppercase tracking-widest">Master</span>
                          </div>
                        )}
                      </div>
                      {player.id === studentId && <p className="text-[10px] text-primary font-bold">Anda</p>}
                    </div>
                  </div>

                  <div className="w-32 text-right">
                    <span className={`text-xl font-black ${currentCategoryObj.color}`}>
                      {player.score.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-secondary block uppercase tracking-widest mt-0.5">
                      {activeCategory === 'quizzes' ? 'Kuis' : 
                       activeCategory === 'coder' ? 'Build' : 
                       activeCategory === 'xp' ? 'XP' : 'Koin'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
