import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useToast } from './Toast';
import { Bell, Menu, User, Cpu, MemoryStick, MonitorPlay, HardDrive, Zap, Wind, ChevronDown, Radio, BookOpen, X, ArrowLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import RoomSidebar from './RoomSidebar';
import RoomOverview from './RoomOverview';
import CoinDisplay from './CoinDisplay';
import ErrorBoundary from './ErrorBoundary';
import { useAchievements, AchievementToast, AchievementWall } from './AchievementSystem';
import { PROFILE_AVATARS } from '../data/profile-assets';
import useSocket from '../hooks/useSocket';

// Eager imports (components used directly)
import PcShop from './PcShop';
import QuizGame from './QuizGame';
import ComponentDetective from './ComponentDetective';
import PcShowroom from '../pages/PcShowroom';
import MainLeaderboard from './MainLeaderboard';
import ProfileCustomization from './ProfileCustomization';
import StudentInsight from './StudentInsight';
import StudyGroup from './StudyGroup';
import ClassTournament from './ClassTournament';
import LiveQuizStudent from './LiveQuizStudent';
import ConfirmDialog from './ConfirmDialog';
import DailyLoginModal from './DailyLoginModal';
import ActivityManager from './ActivityManager';
import ActivityList from './ActivityList';
import StudentWorkViewer from './StudentWorkViewer';
import RoomSettings from './RoomSettings';
import AnalyticsDashboard from './AnalyticsDashboard';
import OnboardingTour from './OnboardingTour';

// Dosen-only panels
import LiveBroadcastPanel from './LiveBroadcastPanel';
import LiveQuizPanel from './LiveQuizPanel';
import HeatMapPanel from './HeatMapPanel';
import GMPanel from './GMPanel';
import LecturerTournamentPanel from './LecturerTournamentPanel';

// Lazy-loaded heavy pages (kept separate for bundle size)
const PcAssembly = lazy(() => import('./PcAssembly'));
const LazyCpuSimulator = lazy(() => import('../pages/CpuSimulator'));
const LazyArLab = lazy(() => import('../pages/ArLab'));

function TabLoader() {
  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-secondary text-xs font-medium">Memuat modul...</p>
      </div>
    </div>
  );
}

const iconComponents = { Cpu, MemoryStick, MonitorPlay, HardDrive, Zap, Wind };

/**
 * RoomHub — Central hub component for a Room (Tinkercad-style).
 * All features (Assembly, Quiz, Shop, etc.) are rendered inside this hub.
 * Menu and permissions change based on userRole (dosen/mahasiswa).
 */
export default function RoomHub({ room, userRole, userId, userName, token, apiUrl, onBack, onRoomUpdated }) {
  const navigate = useNavigate();
  const toast = useToast();
  
  // Initialize activeTab from URL if present
  const getInitialTab = () => {
    const validTabs = ['overview', 'assembly', 'quiz', 'detective', 'simulator', 'ar', 'community', 'tasks', 'showroom', 'leaderboard', 'tournament', 'profile', 'about', 'group-chat', 'insight', 'analytics', 'heat-map', 'settings', 'live', 'live-quiz', 'gm-panel', 'admin-tourney', 'cpu-simulator', 'ar-lab', 'study-group', 'my-activities', 'heatmap', 'room-settings', 'broadcast', 'student-work', 'achievements', 'shop', 'manage-activities'];
    const pathParts = window.location.pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    return validTabs.includes(lastPart) ? lastPart : 'overview';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  // Fix #16: Reset to overview when entering/re-entering a room
  useEffect(() => {
    setActiveTab('overview');
  }, [room?.id]);

  // Gamification
  const [coins, setCoins] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [equippedComponents, setEquippedComponents] = useState({});
  const [completedLevels, setCompletedLevels] = useState([]);

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [activePoll, setActivePoll] = useState(null);
  const [liveQuizData, setLiveQuizData] = useState(null);

  // Confirm dialog
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: null, danger: false });

  // Onboarding
  const [showTour, setShowTour] = useState(false);

  // Room data
  const [memberCount, setMemberCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [pendingActivities, setPendingActivities] = useState(0);
  const [studentStats, setStudentStats] = useState({});
  const [activeActivity, setActiveActivity] = useState(null);
  // Live toggle state (mirrors room.is_live, controllable by dosen)
  const [isLive, setIsLive] = useState(room?.is_live || false);
  const [isTogglingLive, setIsTogglingLive] = useState(false);

  // Achievements
  const { unlockedBadges, unlockBadge, toastBadge, dismissToast, totalXP, levelInfo } = useAchievements(userId);

  // Socket
  const { socket, isConnected, onlineCount } = useSocket(apiUrl, room?.id);

  // Listen for cross-component navigation (e.g. ArLab → Quiz CTA)
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.tab) setActiveTab(e.detail.tab);
    };
    window.addEventListener('arkon-navigate', handler);
    return () => window.removeEventListener('arkon-navigate', handler);
  }, []);

  // Update URL sub-slash domain when activeTab changes (e.g. arkon.com/mahasiswa/overview)
  useEffect(() => {
    if (!room) return;
    
    // Construct base path dynamically
    let basePath = '';
    if (userRole === 'mahasiswa') {
      basePath = '/mahasiswa';
    } else if (userRole === 'dosen') {
      // Keep roomId in path for Dosen to support direct navigation
      basePath = `/dosen/room/${room.id}`;
    }

    const newUrl = `${basePath}/${activeTab}`;
    // Only push state if the URL is actually different, to avoid loop
    if (window.location.pathname !== newUrl) {
      window.history.replaceState(null, '', newUrl);
    }
  }, [activeTab, userRole, room]);

  // ─── FETCH DATA ─────────────────────────────
  const fetchCoins = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/coins/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setCoins(d.coins || 0); }
    } catch (e) { console.error('Fetch coins error:', e); }
  }, [apiUrl, userId, token]);

  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/pc-quest/inventory/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setInventory(await res.json());
    } catch (e) { console.error('Fetch inventory error:', e); }
  }, [apiUrl, userId, token]);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/users/me`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setUserProfile(await res.json());
    } catch (e) { console.error(e); }
  }, [apiUrl, token]);

  const fetchRoomStats = useCallback(async () => {
    if (!room?.id) return;
    try {
      // Fetch member count
      const membersRes = await fetch(`${apiUrl}/api/rooms/${room.id}/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (membersRes.ok) {
        const members = await membersRes.json();
        setMemberCount(Array.isArray(members) ? members.length : 0);
      }
    } catch (e) { console.error('Room stats error:', e); }
  }, [room?.id, apiUrl, token]);

  const syncProgressFromDB = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/progress/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const progress = await res.json();
        if (progress.completed_levels) {
          setCompletedLevels(progress.completed_levels);
        }
      }
    } catch (e) { console.warn('Progress sync failed:', e); }
  }, [apiUrl, userId, token]);

  const syncProgressToDB = async (key, value) => {
    try {
      const res = await fetch(`${apiUrl}/api/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ student_id: userId, key, value })
      });
      if (!res.ok) throw new Error('Sync failed');
    } catch (e) {
      console.warn(`Progress sync failed for ${key}:`, e);
      toast.error('Gagal sinkronisasi progres ke server (Tersimpan lokal)');
    }
  };

  // ─── INIT ─────────────────────────────
  useEffect(() => {
    fetchCoins();
    fetchInventory();
    fetchProfile();
    fetchRoomStats();
    syncProgressFromDB();

    if (userRole === 'mahasiswa' && !localStorage.getItem('arkon_tour_seen')) {
      setShowTour(true);
    }
  }, [fetchCoins, fetchInventory, fetchProfile, fetchRoomStats, syncProgressFromDB, userRole]);

  // ─── SOCKET EVENTS ─────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleAction = (data) => {
      if (data.type === 'navigate') setActiveTab(data.action);
      else if (data.type === 'poll') {
        setActivePoll({ question: data.question, roomId: data.roomId });
        setNotifications(prev => [{ id: Date.now(), type: 'poll', title: 'Polling Baru!', message: `Dosen memulai polling: ${data.question}`, time: new Date(), unread: true }, ...prev]);
      }
    };

    const handleQuiz = (data) => {
      setLiveQuizData(data);
      setNotifications(prev => [{ id: Date.now(), type: 'quiz', title: 'Kuis Live Dimulai!', message: `Dosen memulai kuis: ${data.title || 'Kuis Baru'}`, time: new Date(), unread: true }, ...prev]);
    };

    const handleBroadcast = (data) => {
      const msg = data.message || 'Dosen sedang melakukan siaran langsung.';
      setNotifications(prev => [{ id: Date.now(), type: 'broadcast', title: 'Live Broadcast!', message: msg, time: new Date(), unread: true }, ...prev]);
      // Flash toast otomatis ke mahasiswa
      if (userRole === 'mahasiswa') {
        toast.info(`📡 ${msg}`);
      }
    };

    const handleLiveStatus = (data) => {
      setIsLive(data.is_live);
      if (userRole === 'mahasiswa' && data.is_live) {
        toast.info('🔴 Dosen memulai sesi Live! Siapkan diri Anda.');
        setNotifications(prev => [{ id: Date.now(), type: 'live', title: 'Sesi Live Dimulai!', message: 'Dosen mengaktifkan siaran langsung.', time: new Date(), unread: true }, ...prev]);
      }
    };

    socket.on('student-receive-action', handleAction);
    socket.on('quiz:start', handleQuiz);
    socket.on('broadcast:start', handleBroadcast);
    socket.on('room-live-status', handleLiveStatus);
    socket.on('poll:closed', () => setActivePoll(null));

    return () => {
      socket.off('student-receive-action', handleAction);
      socket.off('quiz:start', handleQuiz);
      socket.off('broadcast:start', handleBroadcast);
      socket.off('room-live-status', handleLiveStatus);
      socket.off('poll:closed');
    };
  }, [socket, userRole, toast]);

  // ─── HANDLERS ─────────────────────────────
  const handleCoinUpdate = (newCoins) => { setCoins(newCoins); fetchInventory(); };

  // Toggle Live (Dosen only)
  const handleToggleLive = async () => {
    if (userRole !== 'dosen' || isTogglingLive) return;
    setIsTogglingLive(true);
    const newLiveState = !isLive;
    try {
      const res = await fetch(`${apiUrl}/api/rooms/${room.id}/toggle-live`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ is_live: newLiveState })
      });
      if (res.ok) {
        setIsLive(newLiveState);
        toast.success(newLiveState ? '🔴 Sesi Live dimulai! Mahasiswa telah diberi notifikasi.' : '⭕ Sesi Live diakhiri.');
      } else {
        toast.error('Gagal mengubah status live.');
      }
    } catch {
      toast.error('Gagal terhubung ke server.');
    } finally {
      setIsTogglingLive(false);
    }
  };

  const handleLevelComplete = (levelId) => {
    const updated = [...new Set([...completedLevels, levelId])];
    setCompletedLevels(updated);
    syncProgressToDB('completed_levels', updated);
  };

  const handlePollVote = (vote) => {
    if (!socket || !activePoll) return;
    socket.emit('broadcast:poll-vote', { roomId: activePoll.roomId, studentId: userId, vote });
    setActivePoll(null);
  };

  // ─── RENDER ACTIVE TAB ─────────────────────────────
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <RoomOverview
            room={room}
            userRole={userRole}
            memberCount={memberCount}
            recentActivity={recentActivity}
            pendingActivities={pendingActivities}
            onNavigate={setActiveTab}
            studentStats={studentStats}
            token={token}
            apiUrl={apiUrl}
          />
        );

      case 'assembly':
        return (
          <ErrorBoundary inline name="Assembly Lab">
            <Suspense fallback={<TabLoader />}>
              <PcAssembly
                inventory={inventory}
                equippedComponents={equippedComponents}
                setEquippedComponents={setEquippedComponents}
                studentId={userId}
                token={token}
                apiUrl={apiUrl}
                roomId={room?.id}
                isTestMode={userRole === 'dosen'}
                userRole={userRole}
                activeActivity={activeActivity}
                onActivityComplete={() => setActiveActivity(null)}
              />
            </Suspense>
          </ErrorBoundary>
        );

      case 'quiz':
        return (
          <ErrorBoundary inline name="Quiz Game">
            <QuizGame
              coins={coins}
              studentId={userId}
              token={token}
              apiUrl={apiUrl}
              onCoinsEarned={fetchCoins}
              completedLevels={completedLevels}
              onLevelComplete={handleLevelComplete}
              activeRoomId={room?.id}
              userRole={userRole}
              activeActivity={activeActivity}
              onActivityComplete={() => { setActiveActivity(null); setActiveTab('my-activities'); }}
            />
          </ErrorBoundary>
        );

      case 'shop':
        return (
          <ErrorBoundary inline name="PC Shop">
            <PcShop
              coins={coins}
              studentId={userId}
              token={token}
              apiUrl={apiUrl}
              userRole={userRole}
              inventory={inventory}
              onPurchase={handleCoinUpdate}
              completedLevels={completedLevels}
            />
          </ErrorBoundary>
        );

      case 'showroom':
        return (
          <ErrorBoundary inline name="Showroom">
            <PcShowroom embeddedMode studentId={userId} token={token} apiUrl={apiUrl} userRole={userRole} />
          </ErrorBoundary>
        );

      case 'detective':
        return (
          <ErrorBoundary inline name="Component Detective">
            <ComponentDetective
              studentId={userId}
              token={token}
              apiUrl={apiUrl}
              userRole={userRole}
              onCoinsEarned={fetchCoins}
              activeActivity={activeActivity}
              onActivityComplete={() => { setActiveActivity(null); setActiveTab('my-activities'); }}
            />
          </ErrorBoundary>
        );

      case 'leaderboard':
        return (
          <ErrorBoundary inline name="Leaderboard">
            <MainLeaderboard studentId={userId} token={token} apiUrl={apiUrl} roomId={room?.id} />
          </ErrorBoundary>
        );

      case 'tournament':
        return (
          <ErrorBoundary inline name="Tournament">
            {userRole === 'dosen' ? (
              <LecturerTournamentPanel roomId={room?.id} token={token} apiUrl={apiUrl} socket={socket} />
            ) : (
              <ClassTournament studentId={userId} token={token} apiUrl={apiUrl} roomId={room?.id} socket={socket} onBack={() => setActiveTab('overview')} />
            )}
          </ErrorBoundary>
        );

      case 'study-group':
        return (
          <ErrorBoundary inline name="Study Group">
            <StudyGroup
              roomId={room?.id}
              studentId={userId}
              studentName={userProfile?.full_name || userName}
              token={token}
              apiUrl={apiUrl}
              socket={socket}
              userRole={userRole}
              onOpenClassroomRoom={() => setActiveTab('overview')}
            />
          </ErrorBoundary>
        );

      // ─── STUDENT-ONLY TABS ─────────
      case 'my-activities':
        return (
          <ErrorBoundary inline name="Activities">
            <ActivityList
              roomId={room?.id}
              studentId={userId}
              token={token}
              apiUrl={apiUrl}
              onOpenActivity={(activity) => {
                setActiveActivity(activity);
                if (activity.activity_type === 'quiz_challenge') setActiveTab('quiz');
                else if (activity.activity_type === 'detective_mission') setActiveTab('detective');
                else setActiveTab('assembly');
              }}
            />
          </ErrorBoundary>
        );

      case 'achievements':
        return (
          <div className="h-full overflow-y-auto custom-scrollbar p-6">
            <AchievementWall unlockedBadges={unlockedBadges} levelInfo={levelInfo} />
          </div>
        );

      case 'profile':
        return (
          <div className="h-full overflow-y-auto custom-scrollbar p-6">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <ErrorBoundary inline name="Profile">
                <ProfileCustomization
                  studentId={userId}
                  token={token}
                  apiUrl={apiUrl}
                  unlockedBadges={unlockedBadges}
                  levelInfo={levelInfo}
                  onProfileUpdate={(p) => setUserProfile(p)}
                />
              </ErrorBoundary>
              <ErrorBoundary inline name="Student Insight">
                <StudentInsight studentId={userId} token={token} apiUrl={apiUrl} />
              </ErrorBoundary>
            </div>
          </div>
        );

      // ─── DOSEN-ONLY TABS ─────────
      case 'manage-activities':
        return userRole === 'dosen' ? (
          <ErrorBoundary inline name="Activity Manager">
            <ActivityManager roomId={room?.id} token={token} apiUrl={apiUrl} userId={userId} />
          </ErrorBoundary>
        ) : null;

      case 'student-work':
        return userRole === 'dosen' ? (
          <ErrorBoundary inline name="Student Work">
            <StudentWorkViewer
              roomId={room?.id}
              token={token}
              apiUrl={apiUrl}
              userId={userId}
              userName={userProfile?.full_name || userName}
              socket={socket}
            />
          </ErrorBoundary>
        ) : null;

      case 'analytics':
        return userRole === 'dosen' ? (
          <ErrorBoundary inline name="Analytics">
            <AnalyticsDashboard roomId={room?.id} token={token} apiUrl={apiUrl} />
          </ErrorBoundary>
        ) : null;

      case 'achievements':
        return (
          <ErrorBoundary inline name="Achievements">
            <AchievementWall />
          </ErrorBoundary>
        );

      case 'heatmap':
        return userRole === 'dosen' ? (
          <ErrorBoundary inline name="Heat Map">
            <HeatMapPanel activeRoom={room} token={token} apiUrl={apiUrl} />
          </ErrorBoundary>
        ) : null;

      case 'broadcast':
        return userRole === 'dosen' ? (
          <ErrorBoundary inline name="Live Broadcast">
            <LiveBroadcastPanel socket={socket} isConnected={isConnected} onlineCount={onlineCount} activeRoom={room} />
          </ErrorBoundary>
        ) : null;

      case 'gm-panel':
        return userRole === 'dosen' ? (
          <ErrorBoundary inline name="Manajemen Kelas">
            <GMPanel activeRoom={room} socket={socket} apiUrl={apiUrl} token={token} />
          </ErrorBoundary>
        ) : null;

      case 'room-settings':
        return userRole === 'dosen' ? (
          <ErrorBoundary inline name="Room Settings">
            <RoomSettings
              room={room}
              token={token}
              apiUrl={apiUrl}
              onRoomUpdated={(updated) => {
                toast.success('Pengaturan disimpan!');
                if (onRoomUpdated) onRoomUpdated(updated);
              }}
              onDeleteRoom={async (id) => {
                if (!confirm('PERINGATAN: Semua data di room ini akan terhapus permanen. Yakin?')) return;
                try {
                  const res = await fetch(`${apiUrl}/api/rooms/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  if (res.ok) {
                    toast.success('Room berhasil dihapus secara permanen.');
                    onBack(); // Kembali ke dashboard & trigger refresh
                  } else {
                    const data = await res.json();
                    toast.error(data.error || 'Gagal menghapus room');
                  }
                } catch (err) {
                  console.error(err);
                  toast.error('Kesalahan jaringan saat menghapus room');
                }
              }}
            />
          </ErrorBoundary>
        ) : null;

      // ─── CPU SIMULATOR (embedded) ─────────
      case 'cpu-simulator':
        return (
          <ErrorBoundary inline name="CPU Simulator">
            <Suspense fallback={<TabLoader />}>
              <LazyCpuSimulator embeddedMode onCoinsEarned={fetchCoins} userRole={userRole} />
            </Suspense>
          </ErrorBoundary>
        );

      // ─── AR LAB (embedded) ─────────
      case 'ar-lab':
        return (
          <ErrorBoundary inline name="AR Lab">
            <Suspense fallback={<TabLoader />}>
              <LazyArLab embeddedMode onCoinsEarned={fetchCoins} userRole={userRole} />
            </Suspense>
          </ErrorBoundary>
        );

      // ─── ABOUT ARKON ─────────
      case 'about':
        return (
          <div className="h-full overflow-y-auto custom-scrollbar p-6">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white/[0.03] border border-border rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <BookOpen size={24} className="text-foreground" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-foreground">Tentang ARKON v1.0</h2>
                    <p className="text-xs text-indigo-600 font-bold">Platform Edukasi Arsitektur Komputer</p>
                  </div>
                </div>
                <p className="text-secondary text-sm leading-relaxed mb-6">
                  ARKON adalah platform pembelajaran interaktif untuk mata kuliah <strong className="text-foreground">Arsitektur dan Organisasi Komputer (AOK)</strong> yang dikembangkan untuk LIDM Belmawa 2027. Seluruh materi quiz, detective, dan konten AR dikurasi berdasarkan buku referensi utama.
                </p>
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5 mb-6">
                  <h3 className="text-sm font-black text-indigo-600 mb-2">📚 Referensi Utama</h3>
                  <p className="text-secondary text-sm font-medium">Stallings, W. (2019). <em>Computer Organization and Architecture: Designing for Performance</em> (11th ed.). Pearson.</p>
                </div>
                <h3 className="text-sm font-black text-foreground mb-3">Chapter yang Tercakup</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
                  {[
                    { ch: 'Ch. 1', title: 'Pengantar Organisasi Komputer', levels: 'Level 1' },
                    { ch: 'Ch. 2', title: 'Evolusi & Performa Komputer', levels: 'Level 10, 14' },
                    { ch: 'Ch. 3', title: 'Fungsi & Interkoneksi Komputer', levels: 'Level 2, 8' },
                    { ch: 'Ch. 4', title: 'Cache Memory', levels: 'Level 7' },
                    { ch: 'Ch. 5', title: 'Internal Memory', levels: 'Level 2, 7' },
                    { ch: 'Ch. 7', title: 'Input/Output', levels: 'Level 4' },
                    { ch: 'Ch. 8', title: 'Operating System Support', levels: 'Level 6' },
                    { ch: 'Ch. 12-13', title: 'Instruction Sets', levels: 'Level 3' },
                    { ch: 'Ch. 14-16', title: 'Processor & Control Unit', levels: 'Level 9' },
                    { ch: 'Ch. 17-18', title: 'Parallel Processing', levels: 'Level 10, 14' },
                    { ch: 'Ch. 19', title: 'Multicore & Advanced', levels: 'Level 13' },
                    { ch: 'Ch. 9-10', title: 'Sistem Bilangan & Aritmatika', levels: 'Level 5' },
                    { ch: 'Lab', title: 'Praktikum Perakitan & Perawatan', levels: 'Level 11, 12' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white/[0.03] border border-border rounded-xl">
                      <div>
                        <span className="text-xs font-black text-indigo-600">{item.ch}</span>
                        <p className="text-[11px] text-secondary">{item.title}</p>
                      </div>
                      <span className="text-[9px] text-secondary font-bold">{item.levels}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                  <h3 className="text-xs font-black text-emerald-600 mb-2">🧠 Fitur Unggulan</h3>
                  <ul className="text-xs text-secondary space-y-1">
                    <li>• <strong className="text-secondary">IRT Rasch Model</strong> — Adaptive quiz berbasis Item Response Theory</li>
                    <li>• <strong className="text-secondary">CPU Visual Simulator</strong> — Fetch-Decode-Execute cycle real-time</li>
                    <li>• <strong className="text-secondary">AR Hardware Lab</strong> — 8 model 3D komponen + AR di mobile</li>
                    <li>• <strong className="text-secondary">Gemini AI</strong> — Feedback PC Assembly & hint adaptif</li>
                    <li>• <strong className="text-secondary">Live Quiz</strong> — Real-time quiz via Socket.io</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      // ─── TAB ALIASES (backward compat + URL navigation) ────
      // Redirect mismatched tab IDs to their correct names
      case 'simulator': {
        // Use useEffect-style redirect: set the correct tab ID
        setTimeout(() => setActiveTab('cpu-simulator'), 0);
        return null;
      }
      case 'ar': {
        setTimeout(() => setActiveTab('ar-lab'), 0);
        return null;
      }
      case 'live':
      case 'live-quiz':
        return liveQuizData ? (
          <LiveQuizStudent
            sessionId={liveQuizData.sessionId}
            title={liveQuizData.title}
            totalQuestions={liveQuizData.totalQuestions}
            questions={liveQuizData.questions}
            socket={socket}
            studentId={userId}
            token={token}
            apiUrl={apiUrl}
            onEnd={() => { setLiveQuizData(null); setActiveTab('overview'); }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-secondary">
            <div className="text-5xl">⏳</div>
            <p className="font-bold text-lg">Menunggu Live Quiz</p>
            <p className="text-sm">Dosen belum memulai kuis live. Tunggu notifikasi!</p>
          </div>
        );
      case 'group-chat':
      case 'community':
        setTimeout(() => setActiveTab('study-group'), 0);
        return null;
      case 'tasks':
        setTimeout(() => setActiveTab('my-activities'), 0);
        return null;
      case 'heat-map':
        setTimeout(() => setActiveTab('heatmap'), 0);
        return null;
      case 'settings':
        setTimeout(() => setActiveTab('room-settings'), 0);
        return null;
      case 'insight':
        setTimeout(() => setActiveTab('analytics'), 0);
        return null;
      case 'admin-tourney':
        return renderTab === undefined ? null : null; // placeholder

      default:
        return <RoomOverview room={room} userRole={userRole} memberCount={memberCount} onNavigate={setActiveTab} token={token} apiUrl={apiUrl} />;
    }
  };

  // ─── TAB TITLE ─────────────────────────────
  const tabTitles = {
    overview: 'Overview',
    assembly: 'Assembly Lab',
    quiz: 'Quiz Map',
    shop: 'Hardware Shop',
    showroom: 'Galeri PC',
    detective: 'Component Detective',
    leaderboard: 'Leaderboard',
    tournament: 'Tournament',
    'study-group': 'Group Chat',
    'my-activities': 'Tugas Saya',
    'manage-activities': 'Kelola Tugas',
    'student-work': 'Karya Mahasiswa',
    analytics: 'Analytics & IRT',
    heatmap: 'Heat Map',
    broadcast: 'Kendali Kelas',
    'gm-panel': 'Manajemen Kelas',
    'room-settings': 'Pengaturan Room',
    achievements: 'Achievement Wall',
    profile: 'My Profile',
    'cpu-simulator': 'CPU Simulator',
    'ar-lab': 'AR Hardware Lab',
    about: 'Tentang ARKON',
  };

  return (
    <div className="fixed inset-0 flex overflow-hidden font-sans" style={{background:"#f8fafc"}}>
      {/* Room Sidebar */}
      <RoomSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userRole={userRole}
        roomName={room?.course_name || 'Room'}
        roomCode={room?.room_code || ''}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onBack={onBack}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full min-h-0 min-w-0 overflow-hidden bg-slate-50 dark:bg-slate-950">
        {/* Header */}
        <header className="flex items-center justify-between w-full h-[56px] px-5 bg-white dark:bg-slate-900 border-b border-border dark:border-slate-800 shrink-0 z-40">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onBack}
              className="md:hidden p-2 text-secondary hover:text-primary hover:bg-slate-50 border border-slate-200 rounded-lg transition-all"
              title="Kembali ke Dashboard"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="md:hidden p-2 text-secondary hover:text-primary hover:bg-slate-50 border border-slate-200 rounded-lg transition-all"
              title="Toggle Menu Room"
            >
              <Menu size={16} />
            </button>
            <h2 className="font-bold text-sm text-secondary ml-1 truncate max-w-[120px] sm:max-w-xs">{tabTitles[activeTab] || 'Room'}</h2>
          </div>

          <div className="flex items-center gap-3">
            <CoinDisplay coins={coins} />

            {/* Live Toggle — Dosen Only */}
            {userRole === 'dosen' && (
              <button
                onClick={handleToggleLive}
                disabled={isTogglingLive}
                title={isLive ? 'Klik untuk mengakhiri sesi Live' : 'Klik untuk memulai sesi Live'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all border ${isLive
                    ? 'bg-rose-500 border-rose-400 text-white animate-pulse shadow-lg shadow-rose-500/30'
                    : 'bg-white shadow-sm border border-border border-border text-secondary hover:border-rose-400/50 hover:text-rose-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Radio size={13} />
                {isLive ? 'LIVE' : 'Offline'}
              </button>
            )}

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`relative p-2 rounded-full transition cursor-pointer ${isNotifOpen ? 'bg-white shadow-sm border border-border text-foreground' : 'text-secondary hover:bg-white shadow-sm border border-border'}`}
              >
                <Bell size={18} />
                {notifications.some(n => n.unread) && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-pulse">
                    {notifications.filter(n => n.unread).length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-72 bg-white border border-border rounded-2xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="p-3 border-b border-border bg-white shadow-sm border border-border flex justify-between items-center">
                      <span className="font-bold text-xs text-foreground">Notifikasi</span>
                      <button
                        onClick={() => setNotifications(n => n.map(x => ({ ...x, unread: false })))}
                        className="text-[10px] text-primary hover:underline font-medium"
                      >
                        Tandai dibaca
                      </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <p className="p-6 text-center text-xs text-secondary">Belum ada notifikasi.</p>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className={`p-3 border-b border-border hover:bg-white shadow-sm border border-border transition-colors ${n.unread ? 'bg-primary-soft' : ''}`}>
                            <p className="text-[10px] font-semibold text-primary uppercase tracking-widest">{n.title}</p>
                            <p className="text-xs text-secondary mt-0.5">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-5 w-px bg-white shadow-sm border border-border" />

            {/* User avatar */}
            <div onClick={() => navigate('/settings')} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded-xl transition-colors">
              {userProfile ? (() => {
                const av = PROFILE_AVATARS.find(a => a.id === userProfile.avatar_id) || PROFILE_AVATARS[0];
                const AvatarIcon = iconComponents[av.icon] || User;
                return (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br ${av.color} shadow-sm`}>
                    <AvatarIcon size={15} className="text-foreground" />
                  </div>
                );
              })() : (
                <img src={`https://ui-avatars.com/api/?name=${userName}&background=6366f1&color=fff`} alt="" className="w-8 h-8 rounded-full shadow-sm" />
              )}
              <div className="hidden md:block text-left">
                <p className="font-bold text-xs text-foreground leading-tight group-hover:text-primary transition-colors">{userProfile?.full_name || userName}</p>
                <p className="text-[9px] text-secondary font-medium capitalize">{userRole}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-hidden relative min-w-0 pb-14 md:pb-0" style={{background:"#f8fafc"}}>
          {renderContent()}
        </main>
      </div>

      {/* ─── OVERLAYS ─────────────────────────── */}

      {/* Poll Modal */}
      {activePoll && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-6">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Polling dari Dosen</h3>
            <p className="text-lg font-bold text-gray-900 mb-8">"{activePoll.question}"</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handlePollVote('up')} className="flex flex-col items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl hover:bg-emerald-100 transition-all">
                👍 <span className="font-bold text-sm">Paham</span>
              </button>
              <button onClick={() => handlePollVote('down')} className="flex flex-col items-center gap-2 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl hover:bg-red-100 transition-all">
                👎 <span className="font-bold text-sm">Belum</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Quiz Overlay */}
      {liveQuizData && (
        <LiveQuizStudent
          socket={socket}
          sessionId={liveQuizData.sessionId}
          title={liveQuizData.title}
          totalQuestions={liveQuizData.totalQuestions}
          studentId={userId}
          token={token}
          apiUrl={apiUrl}
          onQuizEnd={() => setLiveQuizData(null)}
        />
      )}

      {/* Achievement Toast */}
      <AchievementToast badge={toastBadge} onDismiss={dismissToast} />

      {/* Daily Login */}
      {userRole === 'mahasiswa' && userId && (
        <DailyLoginModal studentId={userId} token={token} apiUrl={apiUrl} onClaim={(total) => handleCoinUpdate(total)} />
      )}

      {/* Onboarding Tour */}
      <OnboardingTour
        isVisible={showTour}
        onClose={() => {
          setShowTour(false);
          localStorage.setItem('arkon_tour_seen', 'true');
        }}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        danger={confirmState.danger}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Mobile Bottom Nav — Mahasiswa only */}
      {userRole === 'mahasiswa' && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border flex items-center justify-around px-2 py-2 z-50" aria-label="Navigasi mobile">
          {[
            { id: 'overview', icon: '📊', label: 'Room' },
            { id: 'assembly', icon: '🖥️', label: 'Rakit' },
            { id: 'quiz', icon: '🎮', label: 'Quiz' },
            { id: 'leaderboard', icon: '🏆', label: 'Ranking' },
            { id: 'my-activities', icon: '📋', label: 'Tugas' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              aria-current={activeTab === item.id ? 'page' : undefined}
              aria-label={item.label}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${activeTab === item.id ? 'text-primary bg-primary-soft' : 'text-secondary'
                }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
