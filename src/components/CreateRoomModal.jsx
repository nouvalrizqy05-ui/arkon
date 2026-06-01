import { useState } from 'react';
import { X, Loader2, Plus, Users, User, Lock, Globe, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ROOM_TYPES = [
  {
    id: 'classroom',
    label: 'Kelas / Classroom',
    desc: 'Buat ruang kelas untuk mahasiswa bergabung via kode',
    icon: Users,
    color: 'from-blue-500 to-primary',
    ring: 'ring-blue-500/20',
    roleRequired: 'dosen'
  },
  {
    id: 'personal',
    label: 'Belajar Mandiri',
    desc: 'Ruang pribadi untuk eksplorasi dan latihan sendiri',
    icon: User,
    color: 'from-emerald-500 to-teal-600',
    ring: 'ring-emerald-500/20',
    roleRequired: null // anyone
  },
  {
    id: 'collaborative',
    label: 'Kolaborasi Tim',
    desc: 'Ajak teman belajar bersama dalam satu ruang',
    icon: Globe,
    color: 'from-violet-500 to-purple-600',
    ring: 'ring-violet-500/20',
    roleRequired: null
  }
];

export default function CreateRoomModal({ isOpen, onClose, onRoomCreated, userRole, userId, token, apiUrl }) {
  const [step, setStep] = useState(1);
  const [roomType, setRoomType] = useState(null);
  const [roomName, setRoomName] = useState('');
  const [roomDesc, setRoomDesc] = useState('');
  const [collabMode, setCollabMode] = useState('isolation');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const availableTypes = ROOM_TYPES.filter(
    t => t.roleRequired === null || t.roleRequired === userRole
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!roomName.trim() || !roomType) return;

    setIsCreating(true);
    setError('');

    try {
      const response = await fetch(`${apiUrl}/api/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          owner_id: userId,
          course_name: roomName.trim(),
          description: roomDesc.trim(),
          room_type: roomType,
          collab_mode: roomType === 'collaborative' ? 'collaborative' : collabMode,
        })
      });

      const data = await response.json();

      if (response.ok) {
        onRoomCreated(data);
        handleReset();
        onClose();
      } else {
        setError(data.error || 'Gagal membuat room');
      }
    } catch {
      setError('Gagal terhubung ke server.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setRoomType(null);
    setRoomName('');
    setRoomDesc('');
    setCollabMode('isolation');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-black text-gray-900">Buat Room Baru</h3>
            <p className="text-xs text-gray-500 mt-1">
              {step === 1 ? 'Pilih tipe room' : 'Isi detail room'}
            </p>
          </div>
          <button
            onClick={() => { handleReset(); onClose(); }}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-8 pt-5">
          <div className="flex items-center gap-2">
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-gray-200'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
          </div>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-3"
              >
                {availableTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = roomType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setRoomType(type.id)}
                      className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left group
                        ${isSelected
                          ? `border-primary bg-primary-soft/50 ring-4 ${type.ring} shadow-md`
                          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center shadow-lg shrink-0`}>
                        <Icon size={22} className="text-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className={`font-bold text-sm ${isSelected ? 'text-indigo-700' : 'text-gray-800'}`}>
                          {type.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{type.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center shrink-0
                        ${isSelected ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                    </button>
                  );
                })}

                <button
                  onClick={() => roomType && setStep(2)}
                  disabled={!roomType}
                  className="w-full mt-4 py-3.5 bg-primary text-foreground rounded-xl font-bold hover:bg-primary-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
                >
                  Lanjut
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <form onSubmit={handleCreate} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Nama Room *
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      placeholder={roomType === 'classroom' ? 'Contoh: Arsitektur Komputer A' : 'Contoh: Latihan Rakit PC'}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Deskripsi <span className="text-secondary font-normal">(opsional)</span>
                    </label>
                    <textarea
                      value={roomDesc}
                      onChange={(e) => setRoomDesc(e.target.value)}
                      placeholder="Jelaskan tujuan room ini..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm resize-none"
                    />
                  </div>

                  {roomType === 'collaborative' && (
                    <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={16} className="text-violet-600" />
                        <p className="text-sm font-bold text-violet-800">Mode Kolaborasi</p>
                      </div>
                      <p className="text-xs text-violet-600 mb-3">
                        Setelah dibuat, Anda akan mendapat invite link untuk dikirm ke teman.
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setCollabMode('collaborative')}
                          className={`flex-1 flex items-center gap-2 justify-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            collabMode === 'collaborative'
                              ? 'bg-violet-600 text-foreground shadow-md'
                              : 'bg-white text-violet-700 border border-violet-200'
                          }`}
                        >
                          <Globe size={14} /> Terbuka
                        </button>
                        <button
                          type="button"
                          onClick={() => setCollabMode('isolation')}
                          className={`flex-1 flex items-center gap-2 justify-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            collabMode === 'isolation'
                              ? 'bg-violet-600 text-foreground shadow-md'
                              : 'bg-white text-violet-700 border border-violet-200'
                          }`}
                        >
                          <Lock size={14} /> Tertutup
                        </button>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-5 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                      Kembali
                    </button>
                    <button
                      type="submit"
                      disabled={isCreating || !roomName.trim()}
                      className="flex-1 py-3 bg-primary text-foreground rounded-xl font-bold hover:bg-primary-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                      {isCreating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                      {isCreating ? 'Membuat...' : 'Buat Room'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
