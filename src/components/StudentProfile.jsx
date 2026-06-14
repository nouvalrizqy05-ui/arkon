import { useState, useEffect, useRef } from 'react';
import { useToast } from './Toast';
import { Download, Cpu, MemoryStick, MonitorPlay, HardDrive, Zap, Wind, User, Shield, Trophy, Award, Star, Flame, Edit3, Image as ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { PROFILE_AVATARS, PROFILE_FRAMES } from '../data/profile-assets';
import StudentInsight from './StudentInsight';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

const iconComponents = {
  Cpu, MemoryStick, MonitorPlay, HardDrive, Zap, Wind
};

export default function StudentProfile({ studentId, token, apiUrl, unlockedBadges, levelInfo, onProfileUpdate }) {
  const toast = useToast();
  const [profile, setProfile] = useState({
    avatar_id: 'cpu_bot',
    frame_id: 'default',
    tagline: 'Arsitek Komputer Pemula',
    full_name: 'Mahasiswa',
    identifier_number: '',
    role: 'student'
  });
  
  const [showInsight, setShowInsight] = useState(false);
  const [isMaster, setIsMaster] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const cardRef = useRef(null);
  const fileInputRef = useRef(null);
  const [customAvatar, setCustomAvatar] = useState(() => localStorage.getItem('arkon_custom_avatar') || '');

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
        if (data.avatar_id && (data.avatar_id.startsWith('data:image/') || data.avatar_id.startsWith('http'))) {
          setCustomAvatar(data.avatar_id);
          localStorage.setItem('arkon_custom_avatar', data.avatar_id);
        } else if (data.avatar_url) {
          setCustomAvatar(data.avatar_url);
          localStorage.setItem('arkon_custom_avatar', data.avatar_url);
        } else {
          const localAvatar = localStorage.getItem('arkon_custom_avatar');
          if (localAvatar) {
            setCustomAvatar(localAvatar);
          }
        }
      } else {
        const local = localStorage.getItem('user_name');
        if (local) setProfile(p => ({ ...p, full_name: local }));
      }
    } catch (err) {
      console.error("Gagal fetch profile:", err);
      const local = localStorage.getItem('user_name');
      if (local) setProfile(p => ({ ...p, full_name: local }));
    }
  };

  const checkMasterStatus = async () => {
    try {
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

  const saveProfile = async (updates = {}) => {
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
      
      if (newProfile.full_name) {
        localStorage.setItem('user_name', newProfile.full_name);
      }
      if (onProfileUpdate) onProfileUpdate(newProfile);
      toast.success('Profil berhasil diperbarui!');
    } catch (err) {
      console.error("Gagal save profile:", err);
      if (newProfile.full_name) localStorage.setItem('user_name', newProfile.full_name);
      toast.success('Profil disimpan secara lokal (Offline mode).');
    } finally {
      setTimeout(() => setSaving(false), 500);
    }
  };

  const isFrameUnlocked = (condition) => {
    if (condition === 'none') return true;
    if (condition === 'master') return isMaster;
    if (condition.startsWith('badge:')) {
      const badgeId = condition.split(':')[1];
      return unlockedBadges?.includes(badgeId);
    }
    return false;
  };

  const exportAsPNG = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true
      });
      
      const link = document.createElement('a');
      link.download = `ARKON_Profil_${profile.full_name.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Gagal export PNG:", err);
      toast.error('Gagal mengekspor PNG.');
    } finally {
      setExporting(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 10MB!');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar!');
      return;
    }

    if (!supabase) {
      toast.error('Sistem Supabase belum dikonfigurasi dengan benar.');
      return;
    }

    toast.info('Mengunggah foto ke server...');
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error } = await supabase.storage
        .from('avatar')
        .upload(fileName, file);

      if (error) {
        console.error('Upload err:', error);
        throw new Error('Gagal upload ke bucket');
      }

      const { data: publicUrlData } = supabase.storage
        .from('avatar')
        .getPublicUrl(fileName);

      const finalUrl = publicUrlData.publicUrl;

      setCustomAvatar(finalUrl);
      localStorage.setItem('arkon_custom_avatar', finalUrl);
      saveProfile({ avatar_id: finalUrl });
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengunggah gambar ke server.');
    }
  };

  const removeCustomAvatar = () => {
    setCustomAvatar('');
    localStorage.removeItem('arkon_custom_avatar');
    saveProfile({ avatar_id: 'cpu_bot' });
  };

  const activeAvatar = PROFILE_AVATARS.find(a => a.id === profile.avatar_id) || PROFILE_AVATARS[0];
  const AvatarIcon = iconComponents[activeAvatar.icon] || User;

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarUpload}
        className="hidden"
      />
      
      {/* Gamified Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-8 shadow-2xl relative overflow-hidden border border-indigo-500/20">
        {/* Background Decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8" ref={cardRef}>
          
          {/* Avatar Container */}
          <div className="relative group shrink-0">
            <div 
              className={`w-36 h-36 rounded-3xl ${customAvatar ? '' : `bg-gradient-to-br ${activeAvatar.color}`} flex items-center justify-center shadow-2xl border-4 border-white/10 transform transition-transform hover:scale-105 overflow-hidden cursor-pointer`}
              onClick={() => fileInputRef.current?.click()}
              title="Klik untuk upload foto profil"
            >
              {customAvatar ? (
                <img src={customAvatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <AvatarIcon size={72} className="text-white drop-shadow-lg" />
              )}
              {/* Upload overlay on hover */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-3xl">
                <div className="text-white text-center">
                  <ImageIcon size={24} className="mx-auto mb-1" />
                  <span className="text-[10px] font-bold">Upload Foto</span>
                </div>
              </div>
            </div>
            {customAvatar && (
              <button
                onClick={(e) => { e.stopPropagation(); removeCustomAvatar(); }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs font-bold flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                title="Hapus foto"
              >
                ✕
              </button>
            )}
            
            {/* Level Badge Overlapping Avatar */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1.5 rounded-full text-xs font-black shadow-lg shadow-orange-500/30 flex items-center gap-1.5 border-2 border-slate-900 whitespace-nowrap">
              <Star size={14} className="fill-white" /> LEVEL {levelInfo?.level || 1}
            </div>
          </div>
          
          {/* Main Info */}
          <div className="flex-1 text-center md:text-left w-full mt-2 md:mt-0">
            <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2 drop-shadow-md">
                  {profile.full_name}
                </h1>
                <p className="text-indigo-200 font-medium text-lg flex items-center justify-center md:justify-start gap-2 mb-1">
                  {profile.tagline}
                </p>
                {profile.identifier_number && (
                  <p className="text-slate-400 font-mono text-sm mb-4">
                    ID: {profile.identifier_number}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 shrink-0">
                <button 
                  onClick={exportAsPNG}
                  disabled={exporting}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all border border-white/10 hover:border-white/30 disabled:opacity-50 shadow-xl"
                >
                  {exporting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <ImageIcon size={16} />}
                  Share Profil Card
                </button>
              </div>
            </div>

            {/* Level Progress Bar */}
            <div className="mt-6 bg-slate-950/50 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Flame size={14} className="text-orange-400" /> XP Progress
                </span>
                <span className="text-sm font-black text-white">
                  {levelInfo?.totalXP || 0} <span className="text-slate-400 font-semibold text-xs">/ {levelInfo?.nextXP || 1000} XP</span>
                </span>
              </div>
              <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full relative"
                  style={{ width: `${Math.min(100, ((levelInfo?.totalXP || 0) / (levelInfo?.nextXP || 1000)) * 100)}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-2 text-right">
                {((levelInfo?.nextXP || 1000) - (levelInfo?.totalXP || 0))} XP menuju Level {(levelInfo?.level || 1) + 1}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Insight Toggle Button */}
      <div className="flex justify-center -mt-4 relative z-20">
         <button 
           onClick={() => setShowInsight(!showInsight)} 
           className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-all transform hover:-translate-y-1 border border-indigo-400/30"
         >
            {showInsight ? (
              <><ChevronUp size={18} /> Sembunyikan Insight AI</>
            ) : (
              <><ChevronDown size={18} /> Tampilkan Insight AI</>
            )}
         </button>
      </div>

      {/* Student Insight Section */}
      {showInsight && (
        <div className="animate-in slide-in-from-top-4 fade-in duration-300">
           <div className="bg-[var(--bg-surface)] rounded-3xl border border-indigo-500/20 shadow-xl overflow-hidden">
             <StudentInsight studentId={studentId} token={token} apiUrl={apiUrl} />
           </div>
        </div>
      )}

      {/* Badges Collection Area */}
      <div className="bg-[var(--bg-surface)] rounded-3xl p-6 shadow-sm border border-border dark:border-slate-800">
         <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2 mb-4">
          <Trophy size={16} className="text-yellow-500" /> Etalase Penghargaan
        </h3>
        {unlockedBadges && unlockedBadges.length > 0 ? (
          <div className="flex flex-wrap gap-3">
             {unlockedBadges.map((badgeId, i) => (
                <div key={i} className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/50 px-3 py-2 rounded-xl flex items-center gap-2">
                   <Award size={16} className="text-yellow-600 dark:text-yellow-500" />
                   <span className="text-xs font-bold text-yellow-700 dark:text-yellow-500 capitalize">{badgeId.replace('_', ' ')}</span>
                </div>
             ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-8">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
              <Award size={28} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-sm font-bold text-secondary mb-1">Belum Ada Lencana</p>
            <p className="text-xs text-slate-400">Kerjakan kuis dan lab untuk mendapatkan lencana!</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Col: Identitas Pribadi */}
        <div className="space-y-6">
          <div className="bg-[var(--bg-surface)] rounded-3xl p-6 shadow-sm border border-border dark:border-slate-800 h-full flex flex-col">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2 mb-6">
              <User size={16} className="text-primary" /> Pengaturan Identitas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="text-[11px] text-secondary font-bold uppercase mb-1.5 block">Nama Karakter / Lengkap</label>
                <input 
                  type="text" 
                  value={profile.full_name}
                  onChange={(e) => setProfile(p => ({ ...p, full_name: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-border dark:border-slate-800 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors font-semibold text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] text-secondary font-bold uppercase mb-1.5 block">NIM / ID Siswa</label>
                <input 
                  type="text" 
                  value={profile.identifier_number}
                  onChange={(e) => setProfile(p => ({ ...p, identifier_number: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-border dark:border-slate-800 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors font-semibold text-sm"
                />
              </div>
            </div>

            <div className="mb-6 flex-1">
              <label className="text-[11px] text-secondary font-bold uppercase mb-1.5 block">Custom Tagline</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  maxLength={40}
                  value={profile.tagline}
                  onChange={(e) => setProfile(p => ({ ...p, tagline: e.target.value }))}
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border border-border dark:border-slate-800 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors font-semibold text-sm"
                  placeholder="Arsitek Komputer Masa Depan"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border dark:border-slate-800 mt-auto">
              <button 
                onClick={() => saveProfile()}
                className="px-6 py-2.5 bg-primary hover:bg-indigo-700 rounded-xl font-bold text-white transition-all flex items-center gap-2 shadow-md shadow-primary/20 active:scale-95"
              >
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Edit3 size={16} />}
                Simpan Profil
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Avatar Selection */}
        <div className="bg-[var(--bg-surface)] rounded-3xl p-6 shadow-sm border border-border dark:border-slate-800 h-full">
          <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2 mb-4">
            <User size={16} className="text-primary" /> Avatar Karakter
          </h3>
          <p className="text-xs text-secondary mb-4 leading-relaxed">
            Pilih wujud digital yang merepresentasikan Anda di dalam workspace.
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {PROFILE_AVATARS.map(avatar => {
              const Icon = iconComponents[avatar.icon] || User;
              const isSelected = profile.avatar_id === avatar.id;
              return (
                <button
                  key={avatar.id}
                  onClick={() => {
                    setCustomAvatar('');
                    localStorage.removeItem('arkon_custom_avatar');
                    saveProfile({ avatar_id: avatar.id });
                  }}
                  className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all
                    ${isSelected 
                      ? `bg-gradient-to-br ${avatar.color} text-white shadow-lg shadow-${avatar.color.split('-')[1]}/30 scale-105 z-10` 
                      : 'bg-slate-50 dark:bg-slate-800 text-secondary hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-foreground'
                    }`}
                >
                  <Icon size={24} />
                  <span className="text-[9px] font-bold mt-1 max-w-[90%] text-center leading-tight">
                    {avatar.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
