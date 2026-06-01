import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit3, ClipboardList, Loader2, Calendar, Cpu, Gamepad2, Search, Target, DollarSign, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ACTIVITY_TYPES = [
  { id: 'free_build', label: 'Free Build', icon: '🖥️', desc: 'Mahasiswa bebas merakit PC dari komponen yang tersedia', color: 'bg-rose-100 text-rose-700' },
  { id: 'guided_build', label: 'Guided Build', icon: '📋', desc: 'Perakitan dengan panduan langkah demi langkah', color: 'bg-blue-100 text-blue-700' },
  { id: 'budget_challenge', label: 'Budget Challenge', icon: '💰', desc: 'Rakit PC terbaik dalam anggaran tertentu', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'quiz_challenge', label: 'Quiz Challenge', icon: '🎮', desc: 'Tantangan quiz dengan target skor minimum', color: 'bg-amber-100 text-amber-700' },
  { id: 'detective_mission', label: 'Detective Mission', icon: '🔍', desc: 'Misi identifikasi dan troubleshooting komponen', color: 'bg-violet-100 text-violet-700' },
];

const TARGET_USES = [
  { id: 'gaming', label: 'Gaming', icon: '🎮' },
  { id: 'office', label: 'Office', icon: '💼' },
  { id: 'editing', label: 'Video Editing', icon: '🎬' },
  { id: 'programming', label: 'Programming', icon: '💻' },
  { id: 'any', label: 'Bebas', icon: '🌐' },
];

export default function ActivityManager({ roomId, token, apiUrl, userId }) {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    activity_type: 'free_build',
    budget_limit: '',
    target_use: 'any',
    time_limit: '',
    due_date: '',
  });

  const fetchActivities = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/activities/room/${roomId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setActivities(await res.json());
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }, [roomId, apiUrl, token]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    setIsCreating(true);
    try {
      const config = {};
      if (form.budget_limit) config.budget_limit = parseInt(form.budget_limit);
      if (form.target_use !== 'any') config.target_use = form.target_use;
      if (form.time_limit) config.time_limit_minutes = parseInt(form.time_limit);

      const res = await fetch(`${apiUrl}/api/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          room_id: roomId,
          created_by: userId,
          title: form.title.trim(),
          description: form.description.trim(),
          activity_type: form.activity_type,
          config,
          due_date: form.due_date || null,
        })
      });

      if (res.ok) {
        const newActivity = await res.json();
        setActivities(prev => [newActivity, ...prev]);
        setShowCreate(false);
        setForm({ title: '', description: '', activity_type: 'free_build', budget_limit: '', target_use: 'any', time_limit: '', due_date: '' });
      }
    } catch (e) { console.error(e); }
    finally { setIsCreating(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus aktivitas ini?')) return;
    try {
      const res = await fetch(`${apiUrl}/api/activities/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setActivities(prev => prev.filter(a => a.id !== id));
    } catch (e) { console.error(e); }
  };

  const selectedType = ACTIVITY_TYPES.find(t => t.id === form.activity_type);

  return (
    <div className="h-full overflow-y-auto bg-gray-50 custom-scrollbar">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
              <ClipboardList className="text-amber-500" size={28} /> Kelola Tugas
            </h2>
            <p className="text-sm text-gray-500 mt-1">Buat dan kelola aktivitas pembelajaran untuk mahasiswa di room ini.</p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 bg-primary text-foreground px-5 py-2.5 rounded-xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus size={18} /> Buat Tugas
          </button>
        </div>

        {/* Create Form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-8"
            >
              <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Buat Tugas Baru</h3>

                {/* Activity Type Selector */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-700 mb-3">Tipe Aktivitas</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                    {ACTIVITY_TYPES.map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, activity_type: type.id }))}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center
                          ${form.activity_type === type.id
                            ? 'border-primary bg-primary-soft ring-2 ring-primary/20'
                            : 'border-gray-100 hover:border-gray-200'
                          }`}
                      >
                        <span className="text-2xl">{type.icon}</span>
                        <span className="text-[10px] font-bold text-gray-700">{type.label}</span>
                      </button>
                    ))}
                  </div>
                  {selectedType && (
                    <p className="text-xs text-gray-500 mt-2 italic">{selectedType.desc}</p>
                  )}
                </div>

                {/* Title & Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Judul Tugas *</label>
                    <input
                      type="text"
                      required
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="Contoh: Rakit PC Gaming Rp 10 Juta"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Deadline <span className="text-secondary font-normal">(opsional)</span></label>
                    <input
                      type="datetime-local"
                      value={form.due_date}
                      onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Deskripsi</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Jelaskan instruksi tugas..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm resize-none"
                  />
                </div>

                {/* Config: Budget & Target Use (for build types) */}
                {['free_build', 'guided_build', 'budget_challenge'].includes(form.activity_type) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5 flex items-center gap-1">
                        <DollarSign size={12} /> Budget (Rp)
                      </label>
                      <input
                        type="number"
                        value={form.budget_limit}
                        onChange={e => setForm(f => ({ ...f, budget_limit: e.target.value }))}
                        placeholder="10000000"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5 flex items-center gap-1">
                        <Target size={12} /> Target Penggunaan
                      </label>
                      <select
                        value={form.target_use}
                        onChange={e => setForm(f => ({ ...f, target_use: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary outline-none"
                      >
                        {TARGET_USES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5 flex items-center gap-1">
                        <Clock size={12} /> Batas Waktu (menit)
                      </label>
                      <input
                        type="number"
                        value={form.time_limit}
                        onChange={e => setForm(f => ({ ...f, time_limit: e.target.value }))}
                        placeholder="30"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setShowCreate(false)} className="px-5 py-2.5 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition">Batal</button>
                  <button type="submit" disabled={isCreating} className="px-6 py-2.5 bg-primary text-foreground rounded-xl font-bold hover:bg-primary-hover transition disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-500/20">
                    {isCreating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    {isCreating ? 'Membuat...' : 'Buat Tugas'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Activity List */}
        {isLoading ? (
          <div className="text-center py-16 text-secondary">Memuat tugas...</div>
        ) : activities.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <ClipboardList size={48} className="mx-auto text-foreground mb-4" />
            <h3 className="text-lg font-bold text-gray-700 mb-2">Belum Ada Tugas</h3>
            <p className="text-sm text-secondary mb-6">Buat tugas pertama untuk mahasiswa di room ini.</p>
            <button onClick={() => setShowCreate(true)} className="px-6 py-3 bg-primary text-foreground rounded-xl font-bold hover:bg-primary-hover transition shadow-lg shadow-emerald-500/20" aria-label="Tambah">
              <Plus size={16} className="inline mr-2" /> Buat Tugas Pertama
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, i) => {
              const type = ACTIVITY_TYPES.find(t => t.id === activity.activity_type) || ACTIVITY_TYPES[0];
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${type.color}`}>
                        {type.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{activity.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">{activity.description || 'Tidak ada deskripsi'}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${type.color}`}>{type.label}</span>
                          {activity.due_date && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-secondary">
                              <Calendar size={10} />
                              {new Date(activity.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                          {activity.config?.budget_limit && (
                            <span className="text-[10px] font-bold text-emerald-600">
                              Budget: Rp {activity.config.budget_limit.toLocaleString('id-ID')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(activity.id)}
                      className="p-2 text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                      title="Hapus Tugas"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
