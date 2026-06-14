import { useState, useEffect, useCallback } from 'react';
import { Settings, Shield, Users, Lock, Globe, Save, Loader2, Trash2, Copy, Check } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

/**
 * RoomSettings — Dosen panel for configuring room behavior.
 * Safe Mode, Collab Mode, member management, room deletion.
 */
export default function RoomSettings({ room, token, apiUrl, onRoomUpdated, onDeleteRoom }) {
  const [settings, setSettings] = useState({
    is_safe_mode: room?.is_safe_mode || false,
    collab_mode: room?.collab_mode || 'isolation',
    max_members: room?.max_members || 50,
    description: room?.description || '',
  });
  const [members, setMembers] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const fetchMembers = useCallback(async () => {
    if (!room?.id) return;
    try {
      const res = await fetch(`${apiUrl}/api/rooms/${room.id}/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setMembers(await res.json());
    } catch (e) { console.error(e); }
  }, [room?.id, apiUrl, token]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage as fallback
      const localKey = `arkon_room_settings_${room.id}`;
      localStorage.setItem(localKey, JSON.stringify(settings));

      // Attempt API save
      try {
        const res = await fetch(`${apiUrl}/api/rooms/${room.id}/settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(settings)
        });
        if (res.ok) {
          const updated = await res.json();
          onRoomUpdated?.(updated);
        }
      } catch (apiErr) {
        console.warn('API save failed, settings saved locally:', apiErr);
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (e) { console.error(e); }
    finally { setIsSaving(false); }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(room?.room_code || '');
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleRemoveMember = async (studentId) => {
    try {
      await fetch(`${apiUrl}/api/rooms/leave`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ room_id: room.id, student_id: studentId })
      });
      fetchMembers();
    } catch (e) { console.error(e); }
  };

  const confirmRemoveMember = (studentId) => {
    setConfirmConfig({
      title: 'Keluarkan Mahasiswa',
      message: 'Apakah Anda yakin ingin mengeluarkan mahasiswa ini dari room?',
      danger: true,
      onConfirm: () => {
        handleRemoveMember(studentId);
        setConfirmConfig(null);
      }
    });
  };

  const confirmDeleteRoom = () => {
    setConfirmConfig({
      title: 'Hapus Room Permanen',
      message: 'Semua data, tugas, dan progress mahasiswa di room ini akan dihapus permanen. Lanjutkan?',
      danger: true,
      onConfirm: () => {
        onDeleteRoom?.(room.id);
        setConfirmConfig(null);
      }
    });
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-900 custom-scrollbar">
      <div className="max-w-3xl mx-auto p-8">
        <h2 className="text-2xl font-black text-foreground flex items-center gap-3 mb-8">
          <Settings className="text-secondary" size={28} /> Pengaturan Room
        </h2>

        {/* Room Info */}
        <div className="bg-[var(--bg-surface)] rounded-2xl border border-border dark:border-slate-800 p-6 mb-6">
          <h3 className="text-sm font-black text-foreground uppercase tracking-wider mb-4">Informasi Room</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[10px] font-bold text-secondary uppercase">Nama</label>
              <p className="font-bold text-foreground mt-1">{room?.course_name}</p>
            </div>
            <div>
              <label className="text-[10px] font-bold text-secondary uppercase">Kode Room</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="font-mono font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg text-sm">{room?.room_code}</code>
                <button onClick={copyCode} className="p-1.5 hover:bg-slate-100 dark:bg-slate-800 rounded-lg transition" title="Copy">
                  {codeCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-secondary" />}
                </button>
              </div>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-secondary uppercase mb-1.5 block">Deskripsi</label>
            <textarea
              value={settings.description}
              onChange={e => setSettings(s => ({ ...s, description: e.target.value }))}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-slate-800 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none resize-none"
            />
          </div>
        </div>

        {/* Safe Mode & Collab */}
        <div className="bg-[var(--bg-surface)] rounded-2xl border border-border dark:border-slate-800 p-6 mb-6">
          <h3 className="text-sm font-black text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <Shield size={16} className="text-indigo-500" /> Mode & Keamanan
          </h3>

          {/* Safe Mode Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl mb-3">
            <div>
              <p className="text-sm font-bold text-foreground">Safe Mode</p>
              <p className="text-[10px] text-secondary mt-0.5">Batasi akses mahasiswa ke galeri publik & konten eksternal</p>
            </div>
            <button
              onClick={() => setSettings(s => ({ ...s, is_safe_mode: !s.is_safe_mode }))}
              className={`w-12 h-7 rounded-full transition-all flex items-center px-1 ${
                settings.is_safe_mode ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <div className={`w-5 h-5 bg-[var(--bg-surface)] rounded-full shadow-md transition-transform ${
                settings.is_safe_mode ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Collab Mode */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl mb-3">
            <p className="text-sm font-bold text-foreground mb-2">Mode Kolaborasi</p>
            <div className="flex gap-2">
              <button
                onClick={() => setSettings(s => ({ ...s, collab_mode: 'isolation' }))}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  settings.collab_mode === 'isolation'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-[var(--bg-surface)] text-secondary border border-border dark:border-slate-800'
                }`}
              >
                <Lock size={14} /> Isolation
              </button>
              <button
                onClick={() => setSettings(s => ({ ...s, collab_mode: 'collaborative' }))}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  settings.collab_mode === 'collaborative'
                    ? 'bg-indigo-600 text-foreground shadow-md'
                    : 'bg-[var(--bg-surface)] text-secondary border border-border dark:border-slate-800'
                }`}
              >
                <Globe size={14} /> Collaborative
              </button>
            </div>
          </div>

          {/* Max Members */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
            <label className="text-sm font-bold text-foreground mb-2 block">Maks. Anggota</label>
            <input
              type="number"
              value={settings.max_members}
              onChange={e => setSettings(s => ({ ...s, max_members: parseInt(e.target.value) || 50 }))}
              className="w-24 px-3 py-2 rounded-lg border border-border dark:border-slate-800 text-sm font-bold text-center focus:border-indigo-500 outline-none"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full mt-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : isSaved ? <Check size={16} /> : <Save size={16} />}
            {isSaving ? 'Menyimpan...' : isSaved ? 'Tersimpan!' : 'Simpan Pengaturan'}
          </button>
        </div>

        {/* Members */}
        <div className="bg-[var(--bg-surface)] rounded-2xl border border-border dark:border-slate-800 p-6 mb-6">
          <h3 className="text-sm font-black text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <Users size={16} className="text-emerald-500" /> Anggota ({members.length})
          </h3>
          {members.length === 0 ? (
            <p className="text-sm text-secondary text-center py-6">Belum ada anggota.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              {members.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-black">
                      {(m.full_name || '?')[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{m.full_name}</p>
                      <p className="text-[10px] text-secondary font-mono">{m.nim}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => confirmRemoveMember(m.id)}
                    className="p-1.5 text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                    title="Keluarkan"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
          <h3 className="text-sm font-black text-red-700 uppercase tracking-wider mb-2">Zona Berbahaya</h3>
          <p className="text-xs text-red-600 mb-4">Menghapus room akan menghapus semua data, tugas, dan progress mahasiswa secara permanen.</p>
          <button
            onClick={confirmDeleteRoom}
            className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition shadow-md"
          >
            <Trash2 size={14} className="inline mr-2" /> Hapus Room Permanen
          </button>
        </div>
      </div>
      
      <ConfirmDialog
        isOpen={!!confirmConfig}
        title={confirmConfig?.title}
        message={confirmConfig?.message}
        danger={confirmConfig?.danger}
        onConfirm={confirmConfig?.onConfirm}
        onCancel={() => setConfirmConfig(null)}
      />
    </div>
  );
}
