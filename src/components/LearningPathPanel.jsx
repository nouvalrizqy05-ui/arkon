/**
 * ARKON Learning Path Panel — TASK-ALP-001 (F-016)
 * Visualisasi jalur belajar adaptif berdasarkan theta mahasiswa
 * Terintegrasi dengan prerequisite-graph.js dan /api/ai/learning-path
 */
import { useState, useEffect } from 'react';
import { Brain, Lock, CheckCircle, Circle, ArrowRight, Loader2, BookOpen, ChevronRight } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

const DIFFICULTY_COLORS = {
  beginner: 'from-green-400 to-emerald-500',
  intermediate: 'from-blue-400 to-indigo-500',
  advanced: 'from-purple-400 to-violet-500',
  expert: 'from-orange-400 to-red-500'
};

export default function LearningPathPanel({ studentId, token, activeRoomId, studentTheta = 0 }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [model, setModel] = useState('gemini');

  useEffect(() => {
    if (!token) return;
    fetchLearningPath();
  }, [studentTheta, token]);

  const fetchLearningPath = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/api/ai/learning-path`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ theta: studentTheta, room_id: activeRoomId })
      });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setRecommendations(data.data?.recommendations || []);
      setModel(data.model || 'gemini');
    } catch {
      setError('Gagal memuat jalur belajar. Coba lagi nanti.');
    }
    setLoading(false);
  };

  const thetaLabel = studentTheta < -1 ? 'Pemula' : studentTheta < 0 ? 'Berkembang' : studentTheta < 1 ? 'Kompeten' : studentTheta < 2 ? 'Mahir' : 'Master';
  const thetaColor = studentTheta < -1 ? 'text-red-500' : studentTheta < 0 ? 'text-orange-500' : studentTheta < 1 ? 'text-blue-500' : studentTheta < 2 ? 'text-green-500' : 'text-purple-500';

  return (
    <div className="bg-[var(--bg-surface)] dark:bg-gray-900 rounded-2xl border border-border dark:border-slate-800 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-border dark:border-slate-800 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-800/50 flex items-center justify-center">
              <Brain size={18} className="text-indigo-600 dark:text-indigo-300" />
            </div>
            <div>
              <h3 className="font-bold text-foreground dark:text-white text-sm">Jalur Belajar Adaptif</h3>
              <p className="text-xs text-secondary dark:text-gray-400">
                Level: <span className={`font-bold ${thetaColor}`}>{thetaLabel}</span>
                {' '}(θ = {studentTheta.toFixed(2)})
                {model === 'heuristic' && <span className="ml-2 text-amber-500 text-[10px]">mode heuristik</span>}
              </p>
            </div>
          </div>
          <button onClick={fetchLearningPath} disabled={loading}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50">
            {loading ? '...' : '↺ Perbarui'}
          </button>
        </div>
      </div>

      <div className="p-5">
        {loading && (
          <div className="flex items-center justify-center py-10 gap-3">
            <Loader2 size={20} className="animate-spin text-indigo-500" />
            <span className="text-sm text-secondary">AI sedang menyusun jalur belajar...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-secondary">
            <p className="text-sm">{error}</p>
            <button onClick={fetchLearningPath} className="mt-3 text-xs text-indigo-600 hover:underline">Coba lagi</button>
          </div>
        )}

        {!loading && !error && recommendations.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-secondary dark:text-gray-400 mb-4">
              Rekomendasi topik berdasarkan kemampuan dan riwayat belajarmu:
            </p>

            {recommendations.map((rec, i) => (
              <div key={i}
                onClick={() => setSelectedTopic(selectedTopic === i ? null : i)}
                className="border border-border dark:border-slate-800 dark:border-gray-700 rounded-xl overflow-hidden cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
                <div className="flex items-center gap-3 p-3">
                  {/* Step number */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm flex-shrink-0 bg-gradient-to-br ${
                    i === 0 ? DIFFICULTY_COLORS.beginner :
                    i === 1 ? DIFFICULTY_COLORS.intermediate :
                    DIFFICULTY_COLORS.advanced
                  }`}>
                    {i + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground dark:text-gray-200 truncate">{rec.topic}</p>
                    {selectedTopic === i && rec.reason && (
                      <p className="text-xs text-secondary dark:text-gray-400 mt-1 leading-relaxed">{rec.reason}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {i === 0 && <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-bold">Mulai sekarang</span>}
                    <ChevronRight size={14} className={`text-gray-400 transition-transform ${selectedTopic === i ? 'rotate-90' : ''}`} />
                  </div>
                </div>
              </div>
            ))}

            <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
              <div className="flex items-start gap-2">
                <BookOpen size={14} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                  Jalur ini diperbarui otomatis setelah kamu menyelesaikan quiz. Semakin banyak soal yang dijawab, semakin akurat rekomendasinya.
                </p>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && recommendations.length === 0 && (
          <div className="text-center py-10">
            <Brain size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-secondary">Selesaikan beberapa quiz dulu untuk mendapatkan rekomendasi jalur belajar.</p>
          </div>
        )}
      </div>
    </div>
  );
}
