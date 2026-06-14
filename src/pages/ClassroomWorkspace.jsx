import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { useToast } from '../components/Toast';
import {
  Plus, Users, DoorOpen, ChevronRight, TrendingUp,
  Search, Loader2, ClipboardList, BookOpen, Trophy, LogOut, Hash, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import RoomHub from '../components/RoomHub';
import MobileBottomNav from '../components/MobileBottomNav';
import CreateRoomModal from '../components/CreateRoomModal';
import ErrorBoundary from '../components/ErrorBoundary';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAchievements } from '../components/AchievementSystem';
import StudentProfile from '../components/StudentProfile';

export default function ClassroomWorkspace() {
  const navigate = useNavigate();
  const toast = useToast();

  const [viewState, setViewState]           = useState('dashboard');
  const [activeRoom, setActiveRoom]         = useState(null);
  const [joinedRooms, setJoinedRooms]       = useState([]);
  const [isLoading, setIsLoading]           = useState(false);
  const [roomCodeInput, setRoomCodeInput]   = useState('');
  const [searchTerm, setSearchTerm]         = useState('');
  const [pendingTaskCount, setPendingTaskCount] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [confirmState, setConfirmState]     = useState({ isOpen:false, title:'', message:'', onConfirm:null, danger:false });

  const studentId   = localStorage.getItem('user_id');
  const studentName = localStorage.getItem('user_name') || 'Mahasiswa';
  const token       = localStorage.getItem('auth_token');
  const API_URL     = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const { unlockedBadges, unlockBadge, levelInfo } = useAchievements(studentId);

  /* ─── Data fetching ─────────────────────── */
  const fetchJoinedRooms = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/rooms/student/${studentId}?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) { const rooms = await res.json(); setJoinedRooms(rooms); return rooms; }
    } catch (e) { console.error(e); }
    return [];
  }, [studentId, API_URL, token]);

  const restoreActiveRoom = useCallback(async (rooms) => {
    if (!rooms?.length) return;
    try {
      const res = await fetch(`${API_URL}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const d = await res.json();
        if (d.last_active_room_id) {
          const room = rooms.find(r => r.id === d.last_active_room_id);
          if (room) { setActiveRoom(room); setViewState('room'); }
        }
      }
    } catch (e) { console.error(e); }
  }, [API_URL, token]);

  const fetchPendingTasks = useCallback(async () => {
    if (!joinedRooms.length) return;
    try {
      const results = await Promise.all(
        joinedRooms.map(r =>
          fetch(`${API_URL}/api/activities/room/${r.id}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(x => x.ok ? x.json() : []).catch(() => [])
        )
      );
      const total = results.reduce((s, acts) =>
        s + acts.filter(a => a.is_active && (!a.due_date || new Date(a.due_date) > new Date())).length, 0);
      setPendingTaskCount(total);
    } catch (e) { console.error(e); }
  }, [joinedRooms, API_URL, token]);

  useEffect(() => {
    if (!studentId) { navigate('/login'); return; }
    fetchJoinedRooms().then(r => restoreActiveRoom(r));
  }, []);

  useEffect(() => { fetchPendingTasks(); }, [joinedRooms]);

  /* ─── Actions ───────────────────────────── */
  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/rooms/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ room_code: roomCodeInput.toUpperCase(), student_id: studentId })
      });
      const data = await res.json();
      if (res.ok) {
        setRoomCodeInput('');
        if (data.room) setJoinedRooms(p => [data.room, ...p.filter(r => r.id !== data.room.id)]);
        unlockBadge('first_step');
        toast.success(`Berhasil bergabung ke ${data.course_name}!`);
      } else toast.error(data.error || 'Gagal bergabung ke kelas.');
    } catch { toast.error('Gagal terhubung ke server.'); }
    finally { setIsLoading(false); }
  };

  const handleLeaveRoom = (e, roomId) => {
    e.stopPropagation();
    setConfirmState({
      isOpen: true, title: 'Keluar Room', danger: true,
      message: 'Yakin ingin keluar dari room ini?',
      onConfirm: async () => {
        setConfirmState(p => ({ ...p, isOpen: false }));
        try {
          const res = await fetch(`${API_URL}/api/rooms/leave`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ room_id: roomId, student_id: studentId })
          });
          if (res.ok) { await fetchJoinedRooms(); toast.success('Berhasil keluar dari room.'); }
        } catch { toast.error('Gagal keluar dari room.'); }
      }
    });
  };

  const openRoom = async (room) => {
    setActiveRoom(room); setViewState('room');
    try {
      await fetch(`${API_URL}/api/users/active-room`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ room_id: room.id })
      });
    } catch (e) { console.error(e); }
  };

  const handleRoomCreated = (newRoom) => {
    if (newRoom.room_type !== 'classroom') {
      setActiveRoom(newRoom); setViewState('room');
      fetch(`${API_URL}/api/users/active-room`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ room_id: newRoom.id })
      }).catch(() => {});
    }
    fetchJoinedRooms();
    toast.success('Room berhasil dibuat!');
  };

  const filteredRooms = joinedRooms.filter(r =>
    r.status !== 'archived' && (
    r.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.room_code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const ROOM_TYPE_META = {
    personal:      { label: 'Room Pribadi',   bg: 'bg-violet-50',  border: 'border-violet-200', text: 'text-violet-700', dot: 'bg-violet-400' },
    collaborative: { label: 'Kolaborasi',      bg: 'bg-sky-50',     border: 'border-sky-200',    text: 'text-sky-700',    dot: 'bg-sky-400' },
    classroom:     { label: 'Kelas',           bg: 'bg-primary-soft',border: 'border-primary/20',text: 'text-primary',    dot: 'bg-primary' },
  };

  /* ─── ROOM VIEW ─────────────────────────── */
  if (viewState === 'room' && activeRoom) {
    return (
      <ErrorBoundary inline name="Room Hub">
        <RoomHub
          room={activeRoom} userRole="mahasiswa"
          userId={studentId} userName={studentName}
          token={token} apiUrl={API_URL}
          onBack={async () => {
            try {
              await fetch(`${API_URL}/api/users/active-room`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ room_id: null })
              });
            } catch (e) { console.error(e); }
            setViewState('dashboard'); setActiveRoom(null);
          }}
        />
      </ErrorBoundary>
    );
  }

  /* ─── DASHBOARD VIEW ────────────────────── */
  return (
    <div className="fixed inset-0 flex overflow-hidden bg-slate-50 dark:bg-slate-950">

      {/* ── Sidebar ───────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-[240px] h-full bg-[var(--bg-surface)] dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 h-16 px-5 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-emerald-sm"
            style={{ background: 'linear-gradient(135deg,#059669,#047857)' }}>
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-foreground">
              AR<span className="text-gradient-em">KON</span>
            </span>
            <p className="text-[9px] text-secondary font-medium uppercase tracking-widest -mt-0.5">Workspace</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-primary-soft text-primary border border-primary/15 cursor-pointer">
            <DoorOpen size={16} />
            <span className="font-semibold text-sm">Room Saya</span>
          </div>
          <button onClick={() => navigate('/settings')} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-secondary hover:text-foreground dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer">
            <Settings size={16} />
            <span className="font-semibold text-sm">Pengaturan</span>
          </button>
        </nav>

        {/* Stats */}
        <div className="p-3 border-t border-slate-100">
          <div className="rounded-xl p-3 space-y-2 bg-slate-50 dark:bg-slate-800/50">
            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Statistik</p>
            {[
              { icon: DoorOpen,       label: 'Room Aktif',     val: joinedRooms.length,       color: 'text-primary' },
              { icon: Trophy,         label: 'Badge',          val: unlockedBadges.length,    color: 'text-amber-500' },
              { icon: ClipboardList,  label: 'Tugas Pending',  val: pendingTaskCount ?? '—',  color: 'text-rose-500' },
            ].map(({ icon: Icon, label, val, color }) => (
              <div key={label} className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <Icon size={13} className={color} />
                  <span className="text-xs text-secondary">{label}</span>
                </div>
                <span className={`text-xs font-bold ${color}`}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────── */}
      <main className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
        <Routes>
          <Route path="profile" element={
            <div className="max-w-6xl mx-auto px-6 py-8">
              <StudentProfile 
                studentId={studentId}
                token={token}
                apiUrl={API_URL}
                unlockedBadges={unlockedBadges}
                levelInfo={levelInfo}
                onProfileUpdate={() => {}}
              />
            </div>
          } />
          <Route path="*" element={
            <div className="max-w-5xl mx-auto px-6 py-8">

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Selamat datang, <span className="text-primary">{studentName}</span> 👋
              </h1>
              <p className="text-sm text-secondary mt-0.5">
                Pilih room untuk mulai belajar atau buat room pribadi.
              </p>
            </div>
            <button onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary shrink-0">
              <Plus size={16} /> Buat Room
            </button>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Room Aktif',    val: joinedRooms.length,    color: 'text-primary',  bg: 'bg-primary-soft', border: 'border-primary/15',  Icon: DoorOpen },
              { label: 'Badge',         val: unlockedBadges.length, color: 'text-amber-600',bg: 'bg-amber-50 dark:bg-amber-500/10',     border: 'border-amber-200 dark:border-amber-500/20',   Icon: Trophy },
              { label: 'Tugas Pending', val: pendingTaskCount ?? '—', color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-500/10',  border: 'border-rose-200 dark:border-rose-500/20',    Icon: ClipboardList },
            ].map(({ label, val, color, bg, border, Icon }) => (
              <div key={label} className={`card p-4 border ${border} ${bg} dark:bg-[var(--bg-surface)] flex items-center gap-3`}>
                <div className={`w-9 h-9 rounded-lg ${bg} border ${border} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={18} className={color} />
                </div>
                <div>
                  <p className={`text-xl font-bold ${color}`}>{val}</p>
                  <p className="text-xs text-secondary">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Join + Search */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <form onSubmit={handleJoinRoom} className="flex gap-2 flex-1">
              <div className="relative flex-1">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                <input type="text" value={roomCodeInput}
                  onChange={e => setRoomCodeInput(e.target.value)}
                  placeholder="Masukkan kode room (AOK-2027...)"
                  className="input-field pl-10 uppercase w-full" />
              </div>
              <button type="submit" disabled={isLoading}
                className="btn-primary px-5 shrink-0 disabled:opacity-60">
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Gabung'}
              </button>
            </form>
            {joinedRooms.length > 3 && (
              <div className="relative mb-6 w-full sm:w-52">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Cari room..."
                  className="input-field pl-10 w-full" />
              </div>
            )}
          </div>

          {/* Room grid */}
          <AnimatePresence mode="wait">
            {filteredRooms.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 bg-[var(--bg-surface)] dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                <div className="w-16 h-16 rounded-2xl bg-primary-soft border border-primary/15 flex items-center justify-center mb-5">
                  <DoorOpen size={28} className="text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">
                  {searchTerm ? 'Tidak ada room yang cocok' : 'Belum ada room'}
                </h3>
                <p className="text-sm text-secondary text-center max-w-xs mb-5">
                  {searchTerm
                    ? 'Coba kata kunci lain.'
                    : 'Masukkan kode room dari dosen atau buat room pribadi untuk mulai belajar.'}
                </p>
                {!searchTerm && (
                  <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary" aria-label="Tambah">
                    <Plus size={16} /> Buat Room Pribadi
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div key="grid"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRooms.map((room, i) => {
                  const meta = ROOM_TYPE_META[room.room_type] || ROOM_TYPE_META.classroom;
                  return (
                    <motion.div key={room.id}
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => openRoom(room)}
                      className="card p-5 cursor-pointer group hover:-translate-y-0.5 transition-all flex flex-col">

                      {/* Type badge + code */}
                      <div className="flex justify-between items-center mb-4">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${meta.bg} ${meta.border} ${meta.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-secondary bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-2 py-1 rounded-md">
                          {room.room_code}
                        </span>
                      </div>

                      {/* Room name */}
                      <h3 className="font-semibold text-sm text-foreground mb-0.5 group-hover:text-primary transition-colors line-clamp-2 flex-1">
                        {room.course_name}
                      </h3>

                      {/* Footer */}
                      <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
                        <button
                          onClick={e => handleLeaveRoom(e, room.id)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-secondary hover:text-rose-600 transition-colors">
                          <LogOut size={12} /> Keluar
                        </button>
                        <span className="text-xs font-semibold text-primary flex items-center gap-0.5">
                          Masuk <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
          } />
        </Routes>
      </main>

      {/* Modals */}
      <CreateRoomModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}
        onRoomCreated={handleRoomCreated} userRole="mahasiswa"
        userId={studentId} token={token} apiUrl={API_URL} />
      <ConfirmDialog isOpen={confirmState.isOpen} title={confirmState.title}
        message={confirmState.message} danger={confirmState.danger}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(p => ({ ...p, isOpen: false }))} />

      {/* F-014: Mobile Bottom Navigation */}
      <MobileBottomNav
        activeTab="rooms"
        onTabChange={(tab) => {
          // Dispatch to RoomHub if inside a room
          window.dispatchEvent(new CustomEvent('arkon-navigate', { detail: { tab } }));
        }}
        coinCount={null}
      />
    </div>
  );
}
