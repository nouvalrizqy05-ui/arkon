import { useState, useEffect } from 'react';
import { Users, Cpu, Gamepad2, Trophy, ClipboardList, TrendingUp, Clock, Activity, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const QUICK_ACTIONS = [
  { id: 'assembly', label: 'Assembly Lab', icon: '🖥️', desc: 'Rakit PC virtual', color: 'from-rose-500 to-pink-600' },
  { id: 'quiz', label: 'Quiz Map', icon: '🎮', desc: 'Uji pengetahuan', color: 'from-amber-500 to-orange-600' },
  { id: 'detective', label: 'Detective', icon: '🔍', desc: 'Identifikasi komponen', color: 'from-violet-500 to-purple-600' },
  { id: 'shop', label: 'Hardware Shop', icon: '🛒', desc: 'Beli komponen', color: 'from-emerald-500 to-teal-600' },
  { id: 'showroom', label: 'Showroom', icon: '🖼️', desc: 'Pameran karya', color: 'from-blue-500 to-indigo-600' },
  { id: 'study-group', label: 'Group Chat', icon: '💬', desc: 'Diskusi bersama', color: 'from-cyan-500 to-sky-600' },
];

export default function RoomOverview({ room, userRole, memberCount, recentActivity, pendingActivities, onNavigate, studentStats, token, apiUrl }) {
  const stats = studentStats || {};
  const [dosenStats, setDosenStats] = useState(null);
  const [dosenLoading, setDosenLoading] = useState(false);

  useEffect(() => {
    if (userRole !== 'dosen' || !room?.id || !apiUrl) return;
    const fetchDosenStats = async () => {
      setDosenLoading(true);
      try {
        const [actRes, workRes] = await Promise.all([
          fetch(`${apiUrl}/api/activities/room/${room.id}`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${apiUrl}/api/student-work/room/${room.id}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        ]);
        const activities = actRes.ok ? await actRes.json() : [];
        const works = workRes.ok ? await workRes.json() : [];

        const activeActivities = activities.filter(a => !a.is_archived);
        const submittedWork = works.filter(w => w.is_submitted);
        const pendingCount = Math.max(0, (activeActivities.length * Math.max(memberCount, 1)) - submittedWork.length);

        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const recentStudentIds = new Set(works.filter(w => new Date(w.updated_at) > threeDaysAgo).map(w => w.student_id));
        const inactiveCount = Math.max(0, memberCount - recentStudentIds.size);

        setDosenStats({
          pendingSubmissions: pendingCount,
          activeActivities: activeActivities.length,
          inactiveStudents: inactiveCount,
        });
      } catch (e) {
        console.error('Failed to fetch dosen overview stats:', e);
        setDosenStats({ pendingSubmissions: null, activeActivities: null, inactiveStudents: null });
      } finally {
        setDosenLoading(false);
      }
    };
    fetchDosenStats();
  }, [room?.id, userRole, apiUrl, token, memberCount]);

  return (
    <div className="w-full h-full overflow-y-auto bg-gray-50 custom-scrollbar">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-[#0B2F6D] via-[#1a3a7a] to-[#0d1f4d] text-foreground pt-10 pb-20 px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-10 w-64 h-64 bg-white rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-20 w-48 h-48 bg-indigo-400 rounded-full blur-[80px]" />
        </div>
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <span className="bg-white shadow-sm border border-border px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase backdrop-blur-sm">
              {room?.room_type === 'personal' ? 'PERSONAL ROOM' : room?.room_type === 'collaborative' ? 'KOLABORASI' : 'CLASSROOM'}
            </span>
            {room?.is_live && (
              <span className="bg-rose-500 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase animate-pulse flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-white rounded-full" /> LIVE
              </span>
            )}
          </div>
          <h1 className="text-3xl font-black mt-3 tracking-tight">{room?.course_name || 'Room'}</h1>
          {room?.description && (
            <p className="text-blue-200 text-sm mt-2 max-w-lg">{room.description}</p>
          )}
          <div className="flex items-center gap-6 mt-5">
            <div className="flex items-center gap-2 text-blue-200 text-sm">
              <Users size={16} />
              <span className="font-bold">{memberCount || 0} member</span>
            </div>
            <div className="flex items-center gap-2 text-blue-200 text-sm">
              <span className="font-mono font-bold text-secondary">ID: {room?.room_code}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-12 relative z-20 pb-12">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Tugas', value: pendingActivities || 0, icon: ClipboardList, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
            { label: 'Skor Tertinggi', value: stats.highScore || '-', icon: Trophy, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
            { label: 'Assembly', value: stats.assemblyCount || 0, icon: Cpu, color: 'text-primary', bg: 'bg-indigo-50', border: 'border-indigo-100' },
            { label: 'Quiz Selesai', value: stats.quizCount || 0, icon: Gamepad2, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`${stat.bg} border ${stat.border} rounded-2xl p-5 shadow-sm`}
            >
              <div className="flex items-center justify-between mb-3">
                <stat.icon size={20} className={stat.color} />
              </div>
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
              <p className={`text-[10px] font-bold ${stat.color} uppercase tracking-wider mt-1 opacity-70`}>{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity size={16} className="text-indigo-500" />
            Mulai Aktivitas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                onClick={() => onNavigate(action.id)}
                className="group flex flex-col items-center gap-3 p-5 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 transition-all bg-white hover:-translate-y-1"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${action.color} rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                  {action.icon}
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-800">{action.label}</p>
                  <p className="text-[10px] text-secondary mt-0.5">{action.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Pending Activities (from Dosen) */}
        {userRole === 'mahasiswa' && pendingActivities > 0 && (
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 mb-6">
            <h3 className="text-sm font-black text-amber-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ClipboardList size={16} className="text-amber-600" />
              Tugas Pending ({pendingActivities})
            </h3>
            <button
              onClick={() => onNavigate('my-activities')}
              className="w-full py-3 bg-amber-500 text-foreground rounded-xl font-bold hover:bg-amber-600 transition-all shadow-md shadow-amber-500/20"
            >
              Lihat Semua Tugas
            </button>
          </div>
        )}

        {/* Recent Activity Feed */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Clock size={16} className="text-secondary" />
            Aktivitas Terbaru
          </h3>
          {(!recentActivity || recentActivity.length === 0) ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Activity size={24} className="text-foreground" />
              </div>
              <p className="text-sm text-secondary font-medium">Belum ada aktivitas di room ini.</p>
              <p className="text-xs text-foreground mt-1">Mulai dengan mencoba Assembly Lab atau Quiz!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.slice(0, 8).map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${
                    item.type === 'assembly' ? 'bg-rose-100' :
                    item.type === 'quiz' ? 'bg-amber-100' :
                    'bg-indigo-100'
                  }`}>
                    {item.type === 'assembly' ? '🖥️' : item.type === 'quiz' ? '🎮' : '📝'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.description}</p>
                    <p className="text-[10px] text-secondary">{item.student_name} • {new Date(item.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  {item.score !== undefined && (
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${
                      item.score >= 80 ? 'bg-emerald-100 text-emerald-700' :
                      item.score >= 60 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {item.score}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dosen: Adaptive Learning Insight */}
        {userRole === 'dosen' && (
          <div className="mt-6 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500" /> Perhatian Pengajar
              </h3>
              {dosenLoading ? (
                <div className="flex items-center justify-center gap-2 py-4 text-secondary">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-xs">Memuat data kelas...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-xs font-bold text-amber-800 mb-1">Tugas Belum Terkumpul</p>
                    <p className="text-2xl font-black text-amber-600">
                      {dosenStats?.pendingSubmissions ?? '—'}
                    </p>
                    <p className="text-[10px] text-amber-600/70 mt-1">
                      {dosenStats?.activeActivities != null
                        ? `Dari ${dosenStats.activeActivities} assignment aktif`
                        : 'Data tidak tersedia'}
                    </p>
                  </div>
                  <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                    <p className="text-xs font-bold text-rose-800 mb-1">Mahasiswa Inaktif</p>
                    <p className="text-2xl font-black text-rose-600">
                      {dosenStats?.inactiveStudents ?? '—'}
                    </p>
                    <p className="text-[10px] text-rose-600/70 mt-1">Tidak aktif &gt; 3 hari</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl border border-indigo-200 p-6">
              <h3 className="text-sm font-black text-indigo-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                <TrendingUp size={16} className="text-primary" />
                Insight Adaptive Learning
              </h3>
              <p className="text-xs text-primary leading-relaxed">
                Data N-Gain & IRT dari kuis digunakan untuk analisis kebutuhan belajar mahasiswa secara real-time.
                Buka <button onClick={() => onNavigate('analytics')} className="underline font-bold hover:text-indigo-800">Analytics & IRT</button> untuk distribusi skor dan rekomendasi individu.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
