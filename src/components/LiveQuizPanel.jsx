import { useState, useEffect, useCallback } from 'react';
import { useToast } from './Toast';
import { Gamepad2, Plus, Trash2, Play, X, Trophy, Clock, Users, CheckCircle2, XCircle, ChevronRight, Loader2, BarChart2, Send, ArrowLeft } from 'lucide-react';

const PHASE = { SETUP: 'setup', LIVE: 'live', RESULTS: 'results' };

export default function LiveQuizPanel({ socket, isConnected, onlineCount, activeRoom, selectedTopic, token, apiUrl, onBack }) {
  const toast = useToast();
  const [phase, setPhase] = useState(PHASE.SETUP);

  // Setup state
  const [quizTitle, setQuizTitle] = useState(selectedTopic ? `Kuis Live: ${selectedTopic.title}` : '');
  const [questions, setQuestions] = useState([
    { question_text: '', options: ['', '', '', ''], correct_index: 0, duration_seconds: 20 }
  ]);

  // Live state
  const [sessionData, setSessionData] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(-1);
  const [answerCount, setAnswerCount] = useState(0);
  const [timerEnd, setTimerEnd] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [revealedAnswer, setRevealedAnswer] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (!timerEnd) return;
    const interval = setInterval(() => {
      const left = Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000));
      setTimeLeft(left);
      if (left <= 0) clearInterval(interval);
    }, 100);
    return () => clearInterval(interval);
  }, [timerEnd]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('quiz:question-ack', ({ endsAt }) => {
      setTimerEnd(endsAt);
    });

    return () => {
      socket.off('quiz:question-ack');
    };
  }, [socket]);

  // Poll for answer count during live
  useEffect(() => {
    if (phase !== PHASE.LIVE || !sessionData || currentQIndex < 0) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${apiUrl}/api/live-quiz/leaderboard/${sessionData.session.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setLeaderboard(data);
          // Count answers for current question
          setAnswerCount(data.reduce((sum, s) => sum + s.total_answers, 0));
        }
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [phase, sessionData, currentQIndex]);

  const addQuestion = () => {
    if (questions.length >= 10) return;
    setQuestions([...questions, { question_text: '', options: ['', '', '', ''], correct_index: 0, duration_seconds: 20 }]);
  };

  const removeQuestion = (idx) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx, field, value) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIdx, optIdx, value) => {
    const updated = [...questions];
    updated[qIdx].options[optIdx] = value;
    setQuestions(updated);
  };

  const startQuiz = async () => {
    if (!quizTitle.trim()) return toast.warning('Masukkan judul kuis');
    const valid = questions.every(q => q.question_text.trim() && q.options.every(o => o.trim()));
    if (!valid) return toast.warning('Lengkapi semua soal dan pilihan jawaban');

    setIsCreating(true);
    try {
      const res = await fetch(`${apiUrl}/api/live-quiz/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ room_id: activeRoom.id, title: quizTitle, questions })
      });
      if (!res.ok) return toast.error('Gagal membuat sesi kuis');
      
      const data = await res.json();
      setSessionData(data);
      setPhase(PHASE.LIVE);
      setCurrentQIndex(-1);

      // Broadcast quiz start to students
      socket.emit('quiz:start', {
        roomId: activeRoom.id,
        sessionId: data.session.id,
        title: quizTitle,
        totalQuestions: data.questions.length
      });
    } catch {
      toast.error('Kesalahan jaringan saat membuat kuis');
    } finally {
      setIsCreating(false);
    }
  };

  const sendNextQuestion = () => {
    if (!sessionData) return;
    const nextIdx = currentQIndex + 1;
    if (nextIdx >= sessionData.questions.length) return;

    const q = sessionData.questions[nextIdx];
    setCurrentQIndex(nextIdx);
    setAnswerCount(0);
    setRevealedAnswer(null);

    socket.emit('quiz:question', {
      roomId: activeRoom.id,
      sessionId: sessionData.session.id,
      questionId: q.id,
      questionIndex: nextIdx,
      totalQuestions: sessionData.questions.length,
      question_text: q.question_text,
      options: q.options,
      duration_seconds: q.duration_seconds,
      correct_index: q.correct_index
    });
  };

  const revealAnswer = () => {
    if (!sessionData || currentQIndex < 0) return;
    const q = sessionData.questions[currentQIndex];
    setRevealedAnswer(q.correct_index);

    socket.emit('quiz:reveal', {
      roomId: activeRoom.id,
      sessionId: sessionData.session.id,
      questionId: q.id,
      correct_index: q.correct_index,
      leaderboard: leaderboard.slice(0, 5)
    });
  };

  const endQuiz = async () => {
    if (!sessionData) return;
    socket.emit('quiz:end', {
      roomId: activeRoom.id,
      sessionId: sessionData.session.id,
      leaderboard
    });

    try {
      await fetch(`${apiUrl}/api/live-quiz/save-results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ session_id: sessionData.session.id, room_id: activeRoom.id })
      });
    } catch {}

    setPhase(PHASE.RESULTS);
  };

  const resetToSetup = () => {
    setPhase(PHASE.SETUP);
    setSessionData(null);
    setCurrentQIndex(-1);
    setLeaderboard([]);
    setQuizTitle('');
    setQuestions([{ question_text: '', options: ['', '', '', ''], correct_index: 0, duration_seconds: 20 }]);
  };



  const OPTION_COLORS = ['bg-rose-500', 'bg-blue-500', 'bg-amber-500', 'bg-emerald-500'];
  const OPTION_LABELS = ['A', 'B', 'C', 'D'];

  return (
    <div className="p-8 max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded-xl text-secondary transition" aria-label="ArrowLeft">
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
              <Gamepad2 className="text-purple-500" size={28} /> Kuis Live
            </h2>
            <p className="text-secondary text-sm mt-1">
              {phase === PHASE.SETUP ? 'Buat soal dan mulai kuis interaktif' : phase === PHASE.LIVE ? 'Sesi kuis sedang berlangsung' : 'Hasil kuis'}
            </p>
          </div>
        </div>
        {phase !== PHASE.SETUP && (
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-2xl text-indigo-700 text-xs font-black">
            <Users size={14} /> {onlineCount} Online
          </div>
        )}
      </div>

      {/* ===== SETUP PHASE ===== */}
      {phase === PHASE.SETUP && (
        <div className="space-y-6">
          {/* Quiz Title */}
          <div className="bg-[var(--bg-surface)] rounded-3xl border border-border shadow-sm p-6">
            <label className="block text-xs font-black text-secondary uppercase tracking-widest mb-2">Judul Kuis</label>
            <input
              type="text"
              value={quizTitle}
              onChange={e => setQuizTitle(e.target.value)}
              placeholder="Contoh: Kuis BAB 3 — Arsitektur CPU"
              className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#2467ce] focus:ring-1 focus:ring-[#2467ce]/20 outline-none transition text-sm"
            />
          </div>

          {/* Questions */}
          {questions.map((q, qIdx) => (
            <div key={qIdx} className="bg-[var(--bg-surface)] rounded-3xl border border-border shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-black text-secondary uppercase tracking-widest">Soal {qIdx + 1}/{questions.length}</h4>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-secondary font-bold">Timer:</label>
                  <select
                    value={q.duration_seconds}
                    onChange={e => updateQuestion(qIdx, 'duration_seconds', parseInt(e.target.value))}
                    className="bg-slate-50 dark:bg-slate-900 border border-border rounded-lg px-2 py-1 text-xs font-bold focus:outline-none"
                  >
                    {[10, 15, 20, 30, 45, 60].map(s => <option key={s} value={s}>{s}s</option>)}
                  </select>
                  {questions.length > 1 && (
                    <button onClick={() => removeQuestion(qIdx)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              <input
                type="text"
                value={q.question_text}
                onChange={e => updateQuestion(qIdx, 'question_text', e.target.value)}
                placeholder="Tulis pertanyaan..."
                className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#2467ce] focus:ring-1 focus:ring-[#2467ce]/20 outline-none transition text-sm mb-4"
              />

              <div className="grid grid-cols-2 gap-3">
                {q.options.map((opt, optIdx) => (
                  <div key={optIdx} className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuestion(qIdx, 'correct_index', optIdx)}
                      className={`w-8 h-8 rounded-lg text-xs font-black shrink-0 transition-all ${q.correct_index === optIdx ? `${OPTION_COLORS[optIdx]} text-white shadow-md` : 'bg-slate-100 dark:bg-slate-800 text-secondary hover:bg-slate-200 dark:bg-slate-700'}`}
                    >
                      {OPTION_LABELS[optIdx]}
                    </button>
                    <input
                      type="text"
                      value={opt}
                      onChange={e => updateOption(qIdx, optIdx, e.target.value)}
                      placeholder={`Pilihan ${OPTION_LABELS[optIdx]}`}
                      className="flex-1 px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-[#2467ce] transition"
                    />
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-secondary mt-2">Klik huruf untuk menandai jawaban benar</p>
            </div>
          ))}

          {/* Add Question + Start */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={addQuestion}
                disabled={questions.length >= 10}
                className="flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-surface)] border-2 border-dashed border-border dark:border-slate-700 text-secondary hover:text-[#2467ce] hover:border-[#2467ce] rounded-xl font-bold text-sm transition disabled:opacity-30"
              >
                <Plus size={16} /> Tambah Soal ({questions.length}/10)
              </button>
            <button
              onClick={startQuiz}
              disabled={!isConnected || isCreating}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20 active:scale-95 disabled:opacity-40"
            >
              {isCreating ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
              {isCreating ? 'Mempersiapkan...' : 'Mulai Kuis Live!'}
            </button>
            </div>
        </div>
      )}

      {/* ===== LIVE PHASE ===== */}
      {phase === PHASE.LIVE && sessionData && (
        <div className="space-y-6">
          {/* Current Question Control */}
          {currentQIndex < 0 ? (
            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-10 text-center text-white shadow-xl">
              <Gamepad2 size={48} className="mx-auto mb-4 opacity-80" />
              <h3 className="text-2xl font-black mb-2 text-white">Kuis Siap Dimulai!</h3>
              <p className="text-purple-100/80 mb-6">{sessionData.questions.length} soal | {onlineCount} mahasiswa online</p>
              <button
                onClick={sendNextQuestion}
                className="px-8 py-3 bg-[var(--bg-surface)] text-purple-700 rounded-xl font-black text-sm hover:bg-purple-50 transition-all shadow-lg active:scale-95"
              >
                Kirim Soal Pertama <ChevronRight size={16} className="inline" />
              </button>
            </div>
          ) : (
            <>
              {/* Question display */}
              <div className="bg-[var(--bg-surface)] rounded-3xl border border-border shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black text-secondary uppercase tracking-widest">
                    Soal {currentQIndex + 1}/{sessionData.questions.length}
                  </span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-secondary">
                      <Send size={12} /> {answerCount} jawaban masuk
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-sm ${timeLeft <= 5 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-foreground'}`}>
                      <Clock size={14} /> {timeLeft}s
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-foreground mb-4">
                  {sessionData.questions[currentQIndex].question_text}
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {sessionData.questions[currentQIndex].options.map((opt, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border-2 text-sm font-bold flex items-center gap-2 transition-all ${
                        revealedAnswer !== null
                          ? i === revealedAnswer ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-secondary'
                          : 'border-border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-foreground'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white ${OPTION_COLORS[i]}`}>
                        {OPTION_LABELS[i]}
                      </span>
                      {opt}
                      {revealedAnswer !== null && i === revealedAnswer && <CheckCircle2 size={16} className="ml-auto text-emerald-500" />}
                      {revealedAnswer !== null && i !== revealedAnswer && <XCircle size={16} className="ml-auto text-foreground" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                {revealedAnswer === null ? (
                  <button onClick={revealAnswer} className="px-6 py-3 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-all shadow-lg active:scale-95">
                    <CheckCircle2 size={16} className="inline mr-2" /> Reveal Jawaban
                  </button>
                ) : currentQIndex < sessionData.questions.length - 1 ? (
                  <button onClick={sendNextQuestion} className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition-all shadow-lg active:scale-95">
                    Soal Berikutnya <ChevronRight size={16} className="inline ml-1" />
                  </button>
                ) : (
                  <button onClick={endQuiz} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg active:scale-95" aria-label="Trophy">
                    <Trophy size={16} className="inline mr-2" /> Selesai & Lihat Hasil
                  </button>
                )}
              </div>

              {/* Live Leaderboard */}
              {leaderboard.length > 0 && (
                <div className="bg-[var(--bg-surface)] rounded-3xl border border-border shadow-sm p-6">
                  <h4 className="text-xs font-black text-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Trophy size={14} className="text-amber-500" /> Leaderboard Live
                  </h4>
                  <div className="space-y-2">
                    {leaderboard.slice(0, 5).map((entry, i) => (
                      <div key={entry.student_id} className={`flex items-center gap-3 p-3 rounded-xl ${i === 0 ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50 dark:bg-slate-900'}`}>
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-gray-400 text-white' : i === 2 ? 'bg-amber-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-secondary'}`}>
                          #{i + 1}
                        </span>
                        <span className="flex-1 font-bold text-sm text-foreground">{entry.student_name}</span>
                        <span className="font-black text-sm text-purple-700">{entry.total_score} pts</span>
                        <span className="text-xs text-secondary">{entry.correct_count}/{entry.total_answers} benar</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ===== RESULTS PHASE ===== */}
      {phase === PHASE.RESULTS && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-10 text-center text-white shadow-xl">
            <Trophy size={48} className="mx-auto mb-4" />
            <h3 className="text-2xl font-black mb-2 text-white">Kuis Selesai! 🎉</h3>
            <p className="text-emerald-100/90">Hasil dan koin sudah otomatis terdistribusi ke 3 besar</p>
          </div>

          {/* Final Leaderboard */}
          <div className="bg-[var(--bg-surface)] rounded-3xl border border-border shadow-sm p-6">
            <h4 className="text-xs font-black text-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
              <BarChart2 size={14} /> Hasil Akhir
            </h4>
            {leaderboard.length === 0 ? (
              <p className="text-center text-secondary py-4">Tidak ada jawaban yang masuk.</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, i) => (
                  <div key={entry.student_id} className={`flex items-center gap-3 p-4 rounded-xl border ${i < 3 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 dark:bg-slate-900 border-border dark:border-slate-800'}`}>
                    <span className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${i === 0 ? 'bg-amber-500 text-white text-lg' : i === 1 ? 'bg-gray-400 text-white' : i === 2 ? 'bg-amber-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-secondary text-sm'}`}>
                      {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}
                    </span>
                    <div className="flex-1">
                      <p className="font-bold text-foreground">{entry.student_name}</p>
                      <p className="text-xs text-secondary">{entry.correct_count}/{entry.total_answers} benar</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-purple-700">{entry.total_score} pts</p>
                      {i < 3 && <p className="text-[10px] text-amber-600 font-bold">+{[500, 300, 150][i]} 🪙</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={resetToSetup} className="w-full px-6 py-3 bg-[#2467ce] text-white rounded-xl font-bold text-sm hover:bg-[#1a4f9e] transition-all shadow-md">
            Buat Kuis Baru
          </button>
        </div>
      )}
    </div>
  );
}
