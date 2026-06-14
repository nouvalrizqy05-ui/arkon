/**
 * ARKON AI Personalized Tutor Panel
 * Phase 3 Feature — Context-aware explanation setelah jawaban salah
 * Integrates with /api/ai/personalized-tutor
 */
import { useState } from 'react';
import { Brain, Lightbulb, HelpCircle, BookOpen, Loader2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function AiTutorPanel({ questionText, wrongAnswer, correctAnswer, topic, explanation, token, onDismiss }) {
  const [tutorData, setTutorData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const [flashcards, setFlashcards] = useState(null);
  const [flashLoading, setFlashLoading] = useState(false);

  const fetchTutor = async () => {
    if (tutorData) return; // already fetched
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/api/ai/personalized-tutor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question_text: questionText, wrong_answer: wrongAnswer, correct_answer: correctAnswer, topic, explanation })
      });
      if (!res.ok) throw new Error('AI unavailable');
      const data = await res.json();
      setTutorData(data.data);
    } catch (e) {
      setError('AI Tutor sedang tidak tersedia. Lihat penjelasan di bawah.');
    }
    setLoading(false);
  };

  const fetchFlashcards = async () => {
    if (!topic || flashcards) return;
    setFlashLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ai/generate-flashcards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ topic, count: 5 })
      });
      if (res.ok) {
        const data = await res.json();
        setFlashcards(data.data?.flashcards || []);
      }
    } catch { /* silent */ }
    setFlashLoading(false);
  };

  return (
    <div className="mt-3 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-700 rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => { setExpanded(!expanded); if (!tutorData && !loading) fetchTutor(); }}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-indigo-100/50 dark:hover:bg-indigo-800/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-800/50 flex items-center justify-center">
            <Brain size={15} className="text-indigo-600 dark:text-indigo-300" />
          </div>
          <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">AI Tutor Personalisasi</span>
          <span className="text-[10px] bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full font-semibold">Gemini</span>
        </div>
        {expanded ? <ChevronUp size={16} className="text-indigo-500" /> : <ChevronDown size={16} className="text-indigo-500" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Original explanation if available */}
          {explanation && (
            <div className="text-xs text-indigo-800 dark:text-indigo-200 bg-indigo-100/60 dark:bg-indigo-800/30 px-3 py-2 rounded-xl">
              💡 {explanation}
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 py-2">
              <Loader2 size={16} className="text-indigo-500 animate-spin" />
              <span className="text-xs text-indigo-600 dark:text-indigo-400">AI sedang menganalisis kesalahanmu...</span>
            </div>
          )}

          {error && (
            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-xl">{error}</p>
          )}

          {tutorData && (
            <div className="space-y-3">
              {/* Explanation */}
              <div className="flex gap-2">
                <Lightbulb size={15} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-secondary dark:text-gray-400 mb-1">Penjelasan</p>
                  <p className="text-xs text-foreground dark:text-gray-200 leading-relaxed">{tutorData.explanation}</p>
                </div>
              </div>

              {/* Analogy */}
              {tutorData.analogy && (
                <div className="flex gap-2">
                  <Sparkles size={15} className="text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[11px] font-bold text-secondary dark:text-gray-400 mb-1">Analogi</p>
                    <p className="text-xs text-foreground dark:text-gray-200 leading-relaxed">{tutorData.analogy}</p>
                  </div>
                </div>
              )}

              {/* Reflection */}
              {tutorData.reflection_question && (
                <div className="flex gap-2">
                  <HelpCircle size={15} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[11px] font-bold text-secondary dark:text-gray-400 mb-1">Refleksi</p>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300 italic leading-relaxed">"{tutorData.reflection_question}"</p>
                  </div>
                </div>
              )}

              {/* Encouragement */}
              {tutorData.encouragement && (
                <p className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-xl">
                  🌟 {tutorData.encouragement}
                </p>
              )}

              {/* Flashcard button */}
              {topic && (
                <button
                  onClick={fetchFlashcards}
                  disabled={flashLoading}
                  className="w-full mt-1 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-800/30 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {flashLoading ? <Loader2 size={12} className="animate-spin" /> : <BookOpen size={12} />}
                  Generate Flashcard untuk "{topic}"
                </button>
              )}
            </div>
          )}

          {/* Flashcards */}
          {flashcards && flashcards.length > 0 && (
            <div className="space-y-2 mt-2">
              <p className="text-[11px] font-bold text-secondary dark:text-gray-400">📇 Flashcard Studi:</p>
              {flashcards.map((fc, i) => (
                <div key={i} className="bg-[var(--bg-surface)] dark:bg-gray-800 border border-border dark:border-slate-800 dark:border-gray-700 rounded-xl px-3 py-2">
                  <p className="text-xs font-semibold text-foreground dark:text-gray-200">Q: {fc.front}</p>
                  <p className="text-xs text-secondary dark:text-gray-400 mt-1">A: {fc.back}</p>
                </div>
              ))}
            </div>
          )}

          {/* Dismiss */}
          {onDismiss && (
            <button onClick={onDismiss} className="text-xs text-gray-400 hover:text-secondary dark:hover:text-gray-300 transition-colors">
              Tutup tutor
            </button>
          )}
        </div>
      )}
    </div>
  );
}
