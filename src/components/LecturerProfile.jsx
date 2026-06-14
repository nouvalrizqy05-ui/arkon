import { useState, useEffect, useRef } from 'react';
import { useToast } from './Toast';
import { Download, Cpu, MemoryStick, MonitorPlay, HardDrive, Zap, Wind, User, Shield, BookOpen, Layers, Edit3, Briefcase, GraduationCap } from 'lucide-react';
import { PROFILE_AVATARS, PROFILE_FRAMES } from '../data/profile-assets';

const iconComponents = {
  Cpu, MemoryStick, MonitorPlay, HardDrive, Zap, Wind
};

export default function LecturerProfile({ userId, token, apiUrl, onProfileUpdate }) {
  const toast = useToast();
  const [profile, setProfile] = useState({
    avatar_id: 'cpu_bot',
    frame_id: 'default',
    tagline: 'Dosen Pengampu AOK',
    full_name: 'Dosen',
    identifier_number: '',
    role: 'dosen'
  });
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

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
          tagline: data.tagline || 'Dosen Pengampu AOK',
          full_name: data.full_name || 'Dosen',
          identifier_number: data.identifier_number || '',
          role: data.role || 'dosen'
        });
      } else {
        // Local fallback
        const local = localStorage.getItem('user_name');
        if (local) setProfile(p => ({ ...p, full_name: local }));
      }
    } catch (err) {
      console.error("Gagal fetch profile:", err);
      const local = localStorage.getItem('user_name');
      if (local) setProfile(p => ({ ...p, full_name: local }));
    }
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
      // Fallback
      if (newProfile.full_name) localStorage.setItem('user_name', newProfile.full_name);
      toast.success('Profil disimpan secara lokal (Offline mode).');
    } finally {
      setTimeout(() => setSaving(false), 500);
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
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
      pdf.save(`Profil_Dosen_${profile.full_name.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error("Gagal export PDF:", err);
      toast.error('Gagal mengekspor profil.');
    } finally {
      setExporting(false);
    }
  };

  const activeAvatar = PROFILE_AVATARS.find(a => a.id === profile.avatar_id) || PROFILE_AVATARS[0];
  const AvatarIcon = iconComponents[activeAvatar.icon] || User;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Header / Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="relative" ref={cardRef}>
            <div className={`w-32 h-32 rounded-3xl bg-gradient-to-br ${activeAvatar.color} flex items-center justify-center shadow-xl border-4 border-white/20`}>
              <AvatarIcon size={64} className="text-white drop-shadow-md" />
            </div>
            <div className="absolute -bottom-3 -right-3 bg-white text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-black shadow-lg flex items-center gap-1 border border-indigo-100">
              <Shield size={14} className="text-indigo-600" /> Dosen
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-black mb-2 tracking-tight">{profile.full_name}</h1>
            <p className="text-blue-100 font-medium text-lg flex items-center justify-center md:justify-start gap-2 mb-4">
              <Briefcase size={18} /> {profile.tagline || 'Dosen Pengampu AOK'}
            </p>
            <div className="flex gap-4 justify-center md:justify-start">
              <button 
                onClick={exportAsPDF}
                disabled={exporting}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {exporting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Download size={16} />}
                Export CV / Profil
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Identitas & Setelan */}
        <div className="col-span-2 space-y-6">
          <div className="bg-[var(--bg-surface)] rounded-3xl p-6 shadow-sm border border-border dark:border-slate-800">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2 mb-6">
              <User size={16} className="text-primary" /> Identitas Dosen
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="text-[11px] text-secondary font-bold uppercase mb-1.5 block">Nama Lengkap & Gelar</label>
                <input 
                  type="text" 
                  value={profile.full_name}
                  onChange={(e) => setProfile(p => ({ ...p, full_name: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-border dark:border-slate-800 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors font-semibold text-sm"
                  placeholder="Contoh: Dr. Budi Santoso, M.Kom"
                />
              </div>
              <div>
                <label className="text-[11px] text-secondary font-bold uppercase mb-1.5 block">NIDN / NIP</label>
                <input 
                  type="text" 
                  value={profile.identifier_number}
                  onChange={(e) => setProfile(p => ({ ...p, identifier_number: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-border dark:border-slate-800 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors font-semibold text-sm"
                  placeholder="Masukkan Nomor Induk Dosen"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="text-[11px] text-secondary font-bold uppercase mb-1.5 block">Jabatan / Tagline Pengajar</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  maxLength={40}
                  value={profile.tagline}
                  onChange={(e) => setProfile(p => ({ ...p, tagline: e.target.value }))}
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border border-border dark:border-slate-800 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors font-semibold text-sm"
                  placeholder="Dosen Sistem Komputer"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border dark:border-slate-800">
              <button 
                onClick={() => saveProfile()}
                className="px-6 py-2.5 bg-primary hover:bg-indigo-700 rounded-xl font-bold text-white transition-all flex items-center gap-2 shadow-md shadow-primary/20 active:scale-95"
              >
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Edit3 size={16} />}
                Simpan Perubahan
              </button>
            </div>
          </div>

          <div className="bg-[var(--bg-surface)] rounded-3xl p-6 shadow-sm border border-border dark:border-slate-800">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2 mb-4">
              <Layers size={16} className="text-primary" /> Statistik Mengajar
            </h3>
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                 <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-2">
                   <BookOpen size={20} />
                 </div>
                 <p className="text-2xl font-black text-foreground">Aktif</p>
                 <p className="text-xs text-secondary font-medium">Pengelolaan Room</p>
               </div>
               <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                 <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-2">
                   <GraduationCap size={20} />
                 </div>
                 <p className="text-2xl font-black text-foreground">Tersinkron</p>
                 <p className="text-xs text-secondary font-medium">Peserta Didik</p>
               </div>
            </div>
          </div>
        </div>

        {/* Right Col: Avatar Selection */}
        <div className="bg-[var(--bg-surface)] rounded-3xl p-6 shadow-sm border border-border dark:border-slate-800 h-fit">
          <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2 mb-4">
            <User size={16} className="text-primary" /> Pilih Avatar
          </h3>
          <p className="text-xs text-secondary mb-4 leading-relaxed">
            Pilih avatar representatif yang akan ditampilkan pada mahasiswa di Classroom Workspace.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {PROFILE_AVATARS.map(avatar => {
              const Icon = iconComponents[avatar.icon] || User;
              const isSelected = profile.avatar_id === avatar.id;
              return (
                <button
                  key={avatar.id}
                  onClick={() => saveProfile({ avatar_id: avatar.id })}
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
