import { useState, useEffect, useRef } from 'react';
import { useToast } from './Toast';
import { useNavigate } from 'react-router-dom';
import { Download, Cpu, MemoryStick, MonitorPlay, HardDrive, Zap, Wind, User, Edit3, Lock, CheckCircle2, LogOut, Trash2, AlertTriangle } from 'lucide-react';
import { PROFILE_AVATARS, PROFILE_FRAMES } from '../data/profile-assets';
import ConfirmDialog from './ConfirmDialog';

// Icon Map
const iconComponents = {
  Cpu, MemoryStick, MonitorPlay, HardDrive, Zap, Wind
};

export default function ProfileCustomization({ studentId, token, apiUrl, unlockedBadges, levelInfo, onProfileUpdate }) {
  const toast = useToast();
  const [profile, setProfile] = useState({
    avatar_id: 'cpu_bot',
    frame_id: 'default',
    tagline: 'Arsitek Komputer Pemula',
    full_name: 'Mahasiswa',
    identifier_number: '',
    role: 'student'
  });
  
  const [isMaster, setIsMaster] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: null, danger: false });
  const cardRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
    checkMasterStatus();
  }, [studentId]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile({
          avatar_id: data.avatar_id || 'cpu_bot',
          frame_id: data.frame_id || 'default',
          tagline: data.tagline || 'Arsitek Komputer Pemula',
          full_name: data.full_name || 'Mahasiswa',
          identifier_number: data.identifier_number || '',
          role: data.role || 'student'
        });
      }
    } catch (err) {
      console.error("Gagal fetch profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkMasterStatus = async () => {
    try {
      // Check if user is in season_winners
      const res = await fetch(`${apiUrl}/api/leaderboard/main?category=coins`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        const me = json.leaderboard.find(p => p.id === studentId);
        if (me && me.is_master) setIsMaster(true);
      }
    } catch (err) {}
  };

  const saveProfile = async (updates) => {
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);
    setSaving(true);
    try {
      await fetch(`${apiUrl}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newProfile)
      });
      
      // Update session storage so on next reload it persists
      if (newProfile.full_name) {
        localStorage.setItem('user_name', newProfile.full_name);
      }
      
      // Notify parent component immediately
      if (onProfileUpdate) {
        onProfileUpdate(newProfile);
      }
    } catch (err) {
      console.error("Gagal save profile:", err);
    } finally {
      setTimeout(() => setSaving(false), 500);
    }
  };

  const isFrameUnlocked = (condition) => {
    if (condition === 'none') return true;
    if (condition === 'master') return isMaster;
    if (condition.startsWith('badge:')) {
      const badgeId = condition.split(':')[1];
      return unlockedBadges.includes(badgeId);
    }
    return false;
  };

  const exportAsPNG = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      // Dynamically import html2canvas to avoid crashing if user hasn't installed it yet
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2, // High resolution
        useCORS: true
      });
      
      const link = document.createElement('a');
      link.download = `ARKON_Profile_${profile.full_name.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Gagal export PNG:", err);
      toast.error('Gagal mengekspor kartu profil. Pastikan library html2canvas terinstall.');
    } finally {
      setExporting(false);
    }
  };

  const exportAsPDF = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const pdf = new jsPDF({
        orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
        unit: 'px',
        format: [imgWidth, imgHeight]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`ARKON_Profile_${profile.full_name.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Gagal export PDF:', err);
      toast.error('Gagal mengekspor sebagai PDF. Pastikan library jspdf & html2canvas terinstall.');
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    localStorage.removeItem('roomId');
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    setConfirmState({
      isOpen: true,
      title: 'Hapus Akun Permanen',
      message: 'PERINGATAN: Apakah Anda yakin ingin menghapus akun ini secara permanen? Semua koin, XP, dan progress Anda akan hilang dan tidak dapat dikembalikan!',
      danger: true,
      onConfirm: async () => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
        setIsDeleting(true);
        try {
          const res = await fetch(`${apiUrl}/api/users/me`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            toast.success('Akun berhasil dihapus.');
            handleLogout();
          } else {
            const err = await res.json();
            toast.error(`Gagal menghapus akun: ${err.error}`);
          }
        } catch (error) {
          console.error("Delete account error:", error);
          toast.error('Terjadi kesalahan sistem saat menghapus akun.');
        } finally {
          setIsDeleting(false);
        }
      }
    });
  };

  const currentAvatar = PROFILE_AVATARS.find(a => a.id === profile.avatar_id) || PROFILE_AVATARS[0];
  const currentFrame = PROFILE_FRAMES.find(f => f.id === profile.frame_id) || PROFILE_FRAMES[0];
  const AvatarIcon = iconComponents[currentAvatar.icon] || User;

  if (loading) {
    return <div className="h-full flex items-center justify-center text-foreground">Memuat Profil...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col md:flex-row gap-8 overflow-y-auto custom-scrollbar">
      
      {/* Left Column: Preview Card */}
      <div className="w-full md:w-80 shrink-0 flex flex-col items-center">
        
        {/* Profile Card Render Area */}
        <div 
          ref={cardRef}
          className="relative w-80 h-[450px] bg-[#0f172a] rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center p-8 border border-border"
          style={{ backgroundImage: 'radial-gradient(circle at top, rgba(99,102,241,0.15) 0%, rgba(15,23,42,1) 50%)' }}
        >
          {/* Tag / Header */}
          <div className="absolute top-4 left-0 right-0 text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-secondary">ARKON GAMER IDENTITY</span>
          </div>

          {/* Avatar Area */}
          <div className={`mt-8 w-32 h-32 rounded-3xl flex items-center justify-center relative transition-all duration-500 bg-gradient-to-br ${currentAvatar.color} ${currentFrame.style}`}>
            <AvatarIcon size={64} className="text-foreground drop-shadow-lg" />
            
            {/* Level Badge Overlay */}
            <div className="absolute -bottom-3 -right-3 bg-black text-foreground text-xs font-black px-3 py-1 rounded-xl border border-border shadow-lg">
              Lv.{levelInfo?.level || 1}
            </div>
          </div>

          {/* Info Area */}
          <div className="mt-8 text-center w-full">
            <h2 className="text-2xl font-black text-foreground line-clamp-1">{profile.full_name}</h2>
            <p className="text-sm font-bold text-primary mt-1 uppercase tracking-widest">{profile.tagline}</p>
          </div>

          {/* Stats Bar */}
          <div className="absolute bottom-8 left-8 right-8 bg-black/40 rounded-2xl p-4 flex justify-between items-center backdrop-blur-sm border border-border">
            <div className="text-center">
              <p className="text-[10px] text-secondary uppercase font-bold">Total XP</p>
              <p className="text-lg font-black text-emerald-600">{levelInfo?.totalXP || 0}</p>
            </div>
            <div className="w-px h-8 bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800"></div>
            <div className="text-center">
              <p className="text-[10px] text-secondary uppercase font-bold">Badges</p>
              <p className="text-lg font-black text-amber-600">{unlockedBadges?.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Download Buttons */}
        <div className="mt-6 flex flex-col gap-3 w-full">
          <button 
            onClick={exportAsPNG}
            disabled={exporting}
            className="w-full py-4 bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl text-foreground font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {exporting ? <div className="w-5 h-5 border-2 border-border border-t-white rounded-full animate-spin"></div> : <Download size={20} />}
            {exporting ? 'Merender...' : 'Download PNG Card'}
          </button>
          <button 
            onClick={exportAsPDF}
            disabled={exporting}
            className="w-full py-4 bg-primary hover:bg-primary-hover text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            {exporting ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Download size={20} />}
            {exporting ? 'Merender...' : 'Ekspor Profil PDF'}
          </button>
        </div>
      </div>

      {/* Right Column: Options */}
      <div className="flex-1 flex flex-col gap-8">
        
        {/* Identitas Pribadi */}
        <div className="bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
              <User size={16} className="text-primary" /> Identitas Pribadi
            </h3>
            <div className="bg-primary-light text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/50">
              Role: {profile.role}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-secondary font-bold uppercase mb-1 block">Nama Lengkap</label>
              <input 
                type="text" 
                value={profile.full_name}
                onChange={(e) => setProfile(p => ({ ...p, full_name: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-border dark:border-slate-800 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors font-bold text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] text-secondary font-bold uppercase mb-1 block">Nomor Induk / NIM</label>
              <input 
                type="text" 
                value={profile.identifier_number}
                onChange={(e) => setProfile(p => ({ ...p, identifier_number: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-border dark:border-slate-800 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors font-bold text-sm"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button 
              onClick={() => saveProfile({})}
              className="px-6 py-2.5 bg-primary hover:bg-indigo-700 rounded-xl font-bold text-white transition-all flex items-center gap-2 text-sm shadow-md shadow-indigo-500/20 active:scale-95"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : 'Simpan Identitas'}
            </button>
          </div>
        </div>

        {/* Tagline */}
        <div className="bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 p-6 rounded-3xl">
          <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2 mb-4">
            <Edit3 size={16} className="text-primary" /> Custom Tagline
          </h3>
          <div className="flex gap-2">
            <input 
              type="text" 
              maxLength={30}
              value={profile.tagline}
              onChange={(e) => setProfile(p => ({ ...p, tagline: e.target.value }))}
              className="flex-1 bg-slate-50 dark:bg-slate-900 border border-border dark:border-slate-800 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors font-bold"
            />
            <button 
              onClick={() => saveProfile({})}
              className="px-6 py-3 bg-primary hover:bg-indigo-700 rounded-xl font-bold text-white transition-all flex items-center gap-2 shadow-md shadow-indigo-500/20 active:scale-95"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : 'Simpan'}
            </button>
          </div>
          <p className="text-xs text-secondary mt-2">Maksimal 30 karakter. Tampil di bawah nama pada Profile Card.</p>
        </div>

        {/* Avatar Select */}
        <div className="bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 p-6 rounded-3xl">
          <h3 className="text-sm font-black text-foreground uppercase tracking-widest mb-4 flex items-center justify-between">
            <span>Pilih Avatar Hero</span>
            <span className="text-[10px] bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 px-2 py-1 rounded-md">{PROFILE_AVATARS.length} Tersedia</span>
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {PROFILE_AVATARS.map(avatar => {
              const Icon = iconComponents[avatar.icon] || User;
              const isSelected = profile.avatar_id === avatar.id;
              
              return (
                <button
                  key={avatar.id}
                  onClick={() => saveProfile({ avatar_id: avatar.id })}
                  className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${
                    isSelected 
                      ? 'bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 scale-105 shadow-xl' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent hover:border-border dark:hover:border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br ${avatar.color}`}>
                    <Icon size={24} className="text-foreground drop-shadow-md" />
                  </div>
                  <span className="text-[10px] font-bold text-foreground text-center leading-tight">{avatar.name}</span>
                  {isSelected && <CheckCircle2 size={14} className="absolute -top-1 -right-1 text-emerald-600 bg-black rounded-full" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Frame Select */}
        <div className="bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 p-6 rounded-3xl">
          <h3 className="text-sm font-black text-foreground uppercase tracking-widest mb-4 flex items-center justify-between">
            <span>Frame Eksklusif</span>
            <span className="text-[10px] bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 px-2 py-1 rounded-md">Buka dengan Badge</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {PROFILE_FRAMES.map(frame => {
              const unlocked = isFrameUnlocked(frame.condition);
              const isSelected = profile.frame_id === frame.id;
              
              return (
                <button
                  key={frame.id}
                  disabled={!unlocked}
                  onClick={() => saveProfile({ frame_id: frame.id })}
                  className={`relative p-4 rounded-2xl text-left transition-all overflow-hidden ${
                    !unlocked 
                      ? 'bg-slate-100 dark:bg-slate-800/40 border border-border dark:border-slate-700 opacity-50 cursor-not-allowed' 
                      : isSelected
                        ? 'bg-primary-light border border-primary shadow-lg scale-105'
                        : 'bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className={`w-12 h-12 mb-3 mx-auto rounded-2xl bg-[#0f172a] flex items-center justify-center ${frame.style}`}>
                    {unlocked ? <User size={20} className="text-secondary" /> : <Lock size={20} className="text-secondary" />}
                  </div>
                  <p className="text-xs font-bold text-center text-foreground truncate">{frame.name}</p>
                  
                  {!unlocked && (
                    <div className="absolute inset-0 backdrop-blur-[2px] flex items-center justify-center">
                      <div className="bg-black/80 px-2 py-1 rounded-md text-[9px] font-bold text-red-400 border border-red-500/30">
                        {frame.condition === 'master' ? 'Butuh Archi Master' : 'Terkunci'}
                      </div>
                    </div>
                  )}
                  {isSelected && unlocked && <CheckCircle2 size={16} className="absolute top-2 right-2 text-emerald-600" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Account Settings (Danger Zone) */}
        <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-3xl mt-4">
          <h3 className="text-sm font-black text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <AlertTriangle size={16} /> Danger Zone
          </h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={handleLogout}
              className="flex-1 py-3 bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-bold text-foreground transition-all flex items-center justify-center gap-2"
            >
              <LogOut size={18} /> Log Out
            </button>
            <button 
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-xl font-bold text-red-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Trash2 size={18} /> {isDeleting ? 'Menghapus...' : 'Hapus Akun'}
            </button>
          </div>
          <p className="text-xs text-secondary mt-3 text-center">Menghapus akun akan menghilangkan semua data progres, koin, dan badge secara permanen.</p>
        </div>

      </div>
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
