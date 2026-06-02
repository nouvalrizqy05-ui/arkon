import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useToast } from '../components/Toast';
import {
  Layers, Plus, Users, ChevronRight, ChevronDown, Trash2, Loader2, User,
  Cpu, MemoryStick, MonitorPlay, HardDrive, Zap, Wind
} from 'lucide-react';

import RoomHub from '../components/RoomHub';
import CreateRoomModal from '../components/CreateRoomModal';
import ProfileCustomization from '../components/ProfileCustomization';
import ErrorBoundary from '../components/ErrorBoundary';
import ConfirmDialog from '../components/ConfirmDialog';
import SkeletonCard from '../components/SkeletonCard';
import { PROFILE_AVATARS } from '../data/profile-assets';
import quizData from '../data/quizzes.json';
import { AlertTriangle } from 'lucide-react';
import QuizBankManager from '../components/QuizBankManager';
import DosenOnboardingWizard from '../components/DosenOnboardingWizard';

const iconComponents = { Cpu, MemoryStick, MonitorPlay, HardDrive, Zap, Wind };

/**
 * LecturerDashboard — Rebuilt for Tinkercad-style Room architecture.
 * 
 * TWO STATES:
 * 1. 'rooms'   — Grid of created rooms + create button
 * 2. 'room'    — Full RoomHub experience (dosen perspective)
 * 3. 'profile' — Profile customization
 */
export default function LecturerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  // URL-based view checks
  const isProfile = location.pathname.includes('/profile');
  const isRoomView = location.pathname.includes('/room/');

  // Core state
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showArchived, setShowArchived] = useState(false); // TASK-FEAT-003

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: null, danger: false });

  // Auth
  const dosenId = localStorage.getItem('user_id');
  const dosenName = localStorage.getItem('user_name') || 'Dosen Pengampu';
  const token = localStorage.getItem('auth_token');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // ─── FETCH DATA ─────────────────────────────
  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/rooms/dosen/${dosenId}?t=${Date.now()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRooms(data);
        
        // Pulihkan room aktif dari database jika berada di URL root
        if (!location.pathname.includes('/profile') && !location.pathname.includes('/room/')) {
          try {
            const meRes = await fetch(`${API_URL}/api/users/me`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (meRes.ok) {
              const meData = await meRes.json();
              if (meData.last_active_room_id) {
                const savedRoom = data.find(r => r.id === meData.last_active_room_id);
                if (savedRoom) {
                  setActiveRoom(savedRoom);
                  navigate(`/lecturer-dashboard/room/${savedRoom.id}`, { replace: true });
                }
              }
            }
          } catch (e) { console.error('Failed to restore active room:', e); }
        }
      }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }, [dosenId, API_URL, token]);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/me`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setUserProfile(await res.json());
    } catch (e) { console.error(e); }
  }, [API_URL, token]);

  useEffect(() => {
    if (!dosenId) { navigate('/login'); return; }
    fetchRooms();
    fetchProfile();
  }, [dosenId, navigate, fetchRooms, fetchProfile]);

  // ─── ARCHIVE ROOM (TASK-FEAT-003) ─────────────────────────────
  const handleArchiveRoom = (e, roomId) => {
    e.stopPropagation();
    setConfirmState({
      isOpen: true,
      title: 'Arsipkan Room',
      message: 'Room yang diarsipkan tidak akan muncul di daftar utama, namun data analitiknya tetap tersimpan.',
      danger: false,
      onConfirm: async () => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`${API_URL}/api/rooms/${roomId}/archive`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            await fetchRooms();
            toast.success('Room berhasil diarsipkan.');
          } else {
            const data = await res.json();
            toast.error(data.error || 'Gagal mengarsipkan room.');
          }
        } catch { toast.error('Gagal terhubung ke server.'); }
      }
    });
  };

  // ─── DELETE ROOM ─────────────────────────────
  const handleDeleteRoom = (e, roomId) => {
    e.stopPropagation();
    setConfirmState({
      isOpen: true,
      title: 'Hapus Room Permanen',
      message: 'Yakin ingin menghapus room ini? Semua data, tugas, dan progress mahasiswa akan hilang!',
      danger: true,
      onConfirm: async () => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`${API_URL}/api/rooms/${roomId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            await fetchRooms();
            toast.success('Room berhasil dihapus.');
          } else {
            const data = await res.json();
            toast.error(data.error || 'Gagal menghapus room.');
          }
        } catch { toast.error('Gagal terhubung ke server.'); }
      }
    });
  };

  // ─── OPEN ROOM ─────────────────────────────
  const openRoom = async (room) => {
    setActiveRoom(room);
    navigate(`/lecturer-dashboard/room/${room.id}`);
    // Simpan active room ke database
    try {
      await fetch(`${API_URL}/api/users/active-room`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ room_id: room.id })
      });
    } catch (e) { console.error('Failed to save active room:', e); }
  };

  // ─── ROOM CREATED ─────────────────────────────
  const handleRoomCreated = async (newRoom) => {
    await fetchRooms();
    toast.success(`Room "${newRoom.course_name}" berhasil dibuat! Kode: ${newRoom.room_code}`);
  };

  // ═══════════════════════════════════
  // STATE: ROOM — Full RoomHub (Dosen perspective)
  // ═══════════════════════════════════
  if (isRoomView) {
    const roomIdInUrl = location.pathname.split('/room/')[1];
    const roomToRender = activeRoom || rooms.find(r => r.id === roomIdInUrl || r.id === parseInt(roomIdInUrl));
    
    if (roomToRender) {
      return (
        <ErrorBoundary inline name="Room Hub (Dosen)">
          <RoomHub
            room={roomToRender}
            userRole="dosen"
            userId={dosenId}
            userName={dosenName}
            token={token}
            apiUrl={API_URL}
            onBack={async () => {
              // Hapus active room dari database
              try {
                await fetch(`${API_URL}/api/users/active-room`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify({ room_id: null })
                });
              } catch (e) { console.error(e); }
              fetchRooms();
              setActiveRoom(null);
              navigate('/lecturer-dashboard');
            }}
          />
        </ErrorBoundary>
      );
    }
  }

  // ═══════════════════════════════════
  // STATE: DASHBOARD — Room grid + Profile
  // ═══════════════════════════════════
  return (
    <div className="fixed inset-0 flex overflow-hidden font-sans text-foreground" style={{background:"#f8fafc"}}>
      {/* ─── SIDEBAR ─── */}
      <aside className="hidden lg:flex flex-col w-[260px] h-full bg-white border-r border-gray-200 shrink-0 z-40">
        <div className="flex items-center gap-3 h-[70px] px-6 border-b border-gray-100 shrink-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-emerald-sm" style={{background:"linear-gradient(135deg,#059669,#047857)"}}>
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none text-gray-900">ARKON</h1>
            <p className="text-[10px] text-[#2467ce] font-bold tracking-wide">LECTURER PANEL</p>
          </div>
        </div>

        <div className="flex flex-col p-4 gap-1 flex-1 overflow-y-auto">
          <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-2 mt-2 px-2">Manajemen</p>
          <button
            onClick={() => { navigate('/lecturer-dashboard'); setActiveRoom(null); }}
            className={`flex items-center rounded-xl p-3 gap-3 transition-all ${
              !isProfile && !isRoomView
                ? 'bg-primary-soft border-l-4 border-primary text-primary font-semibold'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className="font-bold text-sm">Daftar Room</span>
          </button>
          <button
            onClick={() => navigate('/lecturer-dashboard/bank-soal')}
            className={`flex items-center rounded-xl p-3 gap-3 transition-all ${
              location.pathname.includes('bank-soal')
                ? 'bg-primary-soft border-l-4 border-primary text-primary font-semibold'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
            <span className="font-bold text-sm">Bank Soal</span>
          </button>
          <button
            onClick={() => navigate('/lecturer-dashboard/profile')}
            className={`flex items-center rounded-xl p-3 gap-3 transition-all ${
              isProfile
                ? 'bg-primary-soft border-l-4 border-primary text-primary font-semibold'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="font-bold text-sm">Profil Saya</span>
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 flex flex-col h-full min-w-0 min-h-0 relative" style={{background:"#f8fafc"}}>
        {/* Header */}
        <header className="flex items-center justify-between w-full h-[70px] px-6 bg-white shadow-sm border border-border backdrop-blur-xl border-b border-border shrink-0 z-30">
          <h2 className="font-bold text-lg text-foreground">Dashboard Dosen</h2>
          <div className="flex items-center gap-3">
            {userProfile ? (() => {
              const av = PROFILE_AVATARS.find(a => a.id === userProfile.avatar_id) || PROFILE_AVATARS[0];
              const AvatarIcon = iconComponents[av.icon] || User;
              return (
                <div className={`w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br ${av.color} shadow-sm`}>
                  <AvatarIcon size={18} className="text-white" />
                </div>
              );
            })() : (
              <img src={`https://ui-avatars.com/api/?name=${dosenName}&background=080C1A&color=fff`} alt="" className="w-9 h-9 rounded-full shadow-sm" />
            )}
            <div className="hidden md:block text-left">
              <p className="font-bold text-sm leading-tight text-foreground">{userProfile?.full_name || dosenName}</p>
              <p className="text-[10px] text-secondary font-medium">Dosen Pengampu</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar" style={{background:"#f8fafc"}}>
          <Routes>
            <Route path="bank-soal" element={
              <div className="p-8 max-w-6xl mx-auto">
                {activeRoom || rooms.length > 0 ? (
                  <QuizBankManager
                    roomId={activeRoom?.id || rooms[0]?.id}
                    token={token}
                  />
                ) : (
                  <div className="text-center py-16 text-gray-500">
                    <p className="text-4xl mb-3">🏫</p>
                    <p className="font-semibold">Buat room terlebih dahulu untuk mengelola bank soal.</p>
                  </div>
                )}
                {rooms.length > 1 && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-sm text-blue-700 font-semibold">💡 Tips: Bank soal ditampilkan untuk room pertama Anda.</p>
                    <p className="text-xs text-blue-600 mt-1">Masuk ke dalam room untuk mengelola bank soal room spesifik.</p>
                  </div>
                )}
              </div>
            } />
            <Route path="profile" element={
              <div className="p-8 max-w-6xl mx-auto">
                <ProfileCustomization 
                  userProfile={userProfile} 
                  token={token} 
                  apiUrl={API_URL} 
                  onProfileUpdate={fetchProfile}
                />
              </div>
            } />
            <Route path="/" element={
              <div className="p-8 max-w-6xl mx-auto">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">
                    {showArchived ? 'Room Diarsipkan' : 'Daftar Room Anda'}
                  </h2>
                  <p className="text-gray-500 text-sm">Kelola room dan pantau progres mahasiswa.</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowArchived(!showArchived)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition"
                  >
                    {showArchived ? 'Lihat Room Aktif' : 'Lihat Arsip'}
                  </button>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="btn-primary px-5 py-2.5"
                  >
                    <Plus size={18} /> Buat Room Baru
                  </button>
                </div>
              </div>

              {/* TASK-ONBOARD-001: Dosen Onboarding Wizard — shown to new dosen */}
              {rooms.length === 0 && (
                <DosenOnboardingWizard
                  token={token}
                  onComplete={() => console.log('Onboarding complete')}
                />
              )}

              {/* TASK-IRT-006: Bank Soal Threshold Warning */}
              {(() => {
                const allQuestions = Array.isArray(quizData) ? quizData : (quizData.levels ? quizData.levels.flatMap(l => l.questions.map(q => ({...q, topic: l.chapterTitle || l.name}))) : []);
                const topicCounts = allQuestions.reduce((acc, q) => {
                  const t = q.topic || 'General';
                  acc[t] = (acc[t] || 0) + 1;
                  return acc;
                }, {});
                const lowTopics = Object.entries(topicCounts).filter(([_, count]) => count < 20);
                if (lowTopics.length > 0) {
                  return (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 items-start">
                      <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                      <div>
                        <h4 className="text-sm font-bold text-amber-800">Peringatan Validitas IRT (Kurang Soal)</h4>
                        <p className="text-xs text-amber-700 mt-1">
                          Model IRT membutuhkan minimal 20 soal per topik untuk estimasi theta yang reliable. 
                          Topik berikut belum memenuhi standar: {lowTopics.map(t => `${t[0]} (${t[1]}/20)`).join(', ')}.
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
                </div>
              ) : rooms.filter(r => (showArchived ? r.status === 'archived' : r.status !== 'archived')).length === 0 ? (
                <div className="w-full flex flex-col items-center justify-center py-20 bg-white border border-dashed border-gray-300 rounded-3xl">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Layers size={32} className="text-secondary" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-700 mb-2">Belum Ada Room {showArchived ? 'Diarsipkan' : ''}</h3>
                  {!showArchived && (
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="btn-primary px-6 py-3 mt-4"
                    >
                      <Plus size={18} /> Buat Room Sekarang
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rooms.filter(r => (showArchived ? r.status === 'archived' : r.status !== 'archived')).map(room => (
                    <div
                      key={room.id}
                      onClick={() => openRoom(room)}
                      className="card p-6 cursor-pointer group hover:-translate-y-0.5 transition-all flex flex-col h-full overflow-hidden relative"
                    >
                      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-primary-soft text-primary rounded-xl flex items-center justify-center">
                          <Users size={24} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-gray-100 text-gray-700 text-[10px] font-black px-3 py-1.5 rounded-lg border border-gray-200 uppercase tracking-wider">
                            {room.room_code}
                          </span>
                          {!showArchived && (
                            <button
                              onClick={(e) => handleArchiveRoom(e, room.id)}
                              className="p-1.5 text-secondary hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                              title="Arsipkan Room"
                            >
                              <Layers size={16} />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDeleteRoom(e, room.id)}
                            className="p-1.5 text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Hapus Room"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-[#2467ce] transition-colors">
                        {room.course_name}
                      </h3>
                      <p className="text-xs text-secondary mb-3">
                        {room.room_type === 'classroom' ? '📚 Kelas' : room.room_type === 'personal' ? '🔒 Pribadi' : '🌐 Kolaborasi'}
                        {' · '}{room.description || 'Tidak ada deskripsi'}
                      </p>

                      {/* Live Badge */}
                      {room.is_live && (
                        <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-600 text-[10px] font-black px-2.5 py-1 rounded-full border border-rose-200 mb-3 animate-pulse">
                          🔴 SEDANG LIVE
                        </span>
                      )}

                      <div className="mt-auto border-t border-gray-100 pt-4 flex justify-between items-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); openRoom(room); }}
                          className="btn-primary px-4 py-2 text-sm"
                        >
                          Buka Room Hub <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                          {room.room_code}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            } />
          </Routes>
        </div>
      </main>

      {/* ─── MODALS ─── */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onRoomCreated={handleRoomCreated}
        userRole="dosen"
        userId={dosenId}
        token={token}
        apiUrl={API_URL}
      />

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        danger={confirmState.danger}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}