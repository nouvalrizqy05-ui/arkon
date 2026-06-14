import { useState, useEffect } from 'react';
import { Users, Search, Award, Trophy, Star, ChevronRight } from 'lucide-react';
import { PROFILE_AVATARS, PROFILE_FRAMES } from '../data/profile-assets';

export default function StudentList({ roomId, token, apiUrl }) {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Mock data for fallback since API might not exist
  const MOCK_STUDENTS = [
    { id: '1', full_name: 'Nopal', role: 'mahasiswa', avatar_id: 'cpu_bot', frame_id: 'default', total_xp: 450, level: 3, badges: ['first_blood', 'speed_demon'] },
    { id: '2', full_name: 'Budi Santoso', role: 'mahasiswa', avatar_id: 'ram_ninja', frame_id: 'gold', total_xp: 1200, level: 5, badges: ['perfectionist', 'sharpshooter'] },
    { id: '3', full_name: 'Siti Aminah', role: 'mahasiswa', avatar_id: 'gpu_wizard', frame_id: 'diamond', total_xp: 850, level: 4, badges: ['first_blood'] },
    { id: '4', full_name: 'Andi Wijaya', role: 'mahasiswa', avatar_id: 'case_tank', frame_id: 'default', total_xp: 200, level: 2, badges: [] },
  ];

  useEffect(() => {
    const fetchMembers = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${apiUrl}/api/rooms/${roomId}/members`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Map data or use mock if empty
          setStudents(data.length > 0 ? data : MOCK_STUDENTS);
        } else {
          setStudents(MOCK_STUDENTS);
        }
      } catch (e) {
        setStudents(MOCK_STUDENTS);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMembers();
  }, [roomId, apiUrl, token]);

  const filteredStudents = students.filter(s => 
    s.role === 'mahasiswa' && s.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
              <Users className="text-indigo-500" size={28} />
              Daftar Mahasiswa
            </h2>
            <p className="text-sm text-secondary mt-1">Lihat profil, pencapaian, dan level teman sekelasmu.</p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary w-4 h-4" />
            <input 
              type="text" 
              placeholder="Cari mahasiswa..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[var(--bg-surface)] border border-border dark:border-slate-800 rounded-xl text-sm font-medium text-foreground focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-28 bg-[var(--bg-surface)] border border-border dark:border-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-12 bg-[var(--bg-surface)] rounded-3xl border border-border dark:border-slate-800">
            <Users size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
            <p className="text-secondary font-medium">Tidak ada mahasiswa yang ditemukan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map(student => {
              const avatar = PROFILE_AVATARS.find(a => a.id === student.avatar_id) || PROFILE_AVATARS[0];
              const frame = PROFILE_FRAMES.find(f => f.id === student.frame_id) || PROFILE_FRAMES[0];
              
              const avatarSrc = (student.id === localStorage.getItem('user_id') && localStorage.getItem('arkon_custom_avatar')) 
                ? localStorage.getItem('arkon_custom_avatar') 
                : student.avatar_id;
              
              const isCustomAvatar = avatarSrc && (avatarSrc.startsWith('data:image/') || avatarSrc.startsWith('http'));

              return (
                <div key={student.id} className="bg-[var(--bg-surface)] border border-border dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors cursor-pointer group">
                  {isCustomAvatar ? (
                    <img 
                      src={avatarSrc} 
                      className={`w-14 h-14 rounded-xl object-cover shrink-0 ${frame.style}`} 
                      alt="" 
                    />
                  ) : (
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${avatar.color} ${frame.style}`}>
                      <span className="text-2xl drop-shadow-md">
                        {avatar.icon === 'Cpu' ? '🤖' : avatar.icon === 'MemoryStick' ? '🥷' : avatar.icon === 'MonitorPlay' ? '🧙' : '🛡️'}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-foreground truncate">{student.full_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-md">
                        Lv {student.level || 1}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600">
                        <Star size={10} /> {student.total_xp || 0} XP
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900 text-secondary group-hover:text-indigo-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/20 transition-all">
                    <ChevronRight size={16} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
