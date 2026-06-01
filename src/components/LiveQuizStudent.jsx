import { useState, useEffect, useRef } from 'react';
import { Trophy, Clock, CheckCircle2, XCircle, Gamepad2, Loader2, Zap } from 'lucide-react';

const OPTION_COLORS = [
  'from-rose-500 to-rose-600', 'from-blue-500 to-blue-600',
  'from-amber-500 to-amber-600', 'from-emerald-500 to-emerald-600'
];
const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function LiveQuizStudent({ socket, sessionId, title, totalQuestions, studentId, token, apiUrl, onQuizEnd }) {
  const [phase, setPhase] = useState('waiting'); // waiting, question, revealed, ended
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [myScore, setMyScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerEnd, setTimerEnd] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correctIndex, setCorrectIndex] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const answerTimeRef = useRef(null);

  // Timer
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

    socket.on('quiz:question', (data) => {
      setCurrentQuestion(data);
      setQuestionIndex(data.questionIndex);
      setTimerEnd(data.endsAt);
      setSelectedIndex(null);
      setIsCorrect(null);
      setMyScore(0);
      setCorrectIndex(null);
      setHasAnswered(false);
      answerTimeRef.current = Date.now();
      setPhase('question');
    });

    socket.on('quiz:reveal', (data) => {
      setCorrectIndex(data.correct_index);
      if (data.leaderboard) setLeaderboard(data.leaderboard);
      setPhase('revealed');
    });

    socket.on('quiz:end', (data) => {
      if (data.leaderboard) setLeaderboard(data.leaderboard);
      setPhase('ended');
    });

    return () => {
      socket.off('quiz:question');
      socket.off('quiz:reveal');
      socket.off('quiz:end');
    };
  }, [socket]);

  const submitAnswer = async (optIdx) => {
    if (hasAnswered || !currentQuestion) return;
    setSelectedIndex(optIdx);
    setHasAnswered(true);

    const answerTimeMs = Date.now() - answerTimeRef.current;

    try {
      const res = await fetch(`${apiUrl}/api/live-quiz/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          session_id: sessionId,
          question_id: currentQuestion.questionId,
          student_id: studentId,
          selected_index: optIdx,
          correct_index: currentQuestion.correct_index,
          answer_time_ms: answerTimeMs,
          duration_seconds: currentQuestion.duration_seconds
        })
      });
      if (res.ok) {
        const data = await res.json();
        setIsCorrect(data.is_correct);
        setMyScore(data.score);
        if (data.is_correct) setTotalScore(prev => prev + data.score);
      }
    } catch {
      console.error('Failed to submit answer');
    }
  };

  const timerPercent = currentQuestion ? Math.max(0, (timeLeft / currentQuestion.duration_seconds) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-muted flex flex-col items-center justify-center overflow-hidden">
      {/* Animated BG */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-64 h-64 bg-purple-500/10 rounded-full blur-3xl top-10 left-10 animate-pulse" />
        <div className="absolute w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl bottom-10 right-10 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-2xl px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Gamepad2 size={20} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-foreground font-black text-sm">{title}</h2>
              <p className="text-secondary text-xs">{phase === 'waiting' ? 'Menunggu soal...' : `Soal ${questionIndex + 1}/${totalQuestions}`}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white shadow-sm border border-border rounded-xl">
            <Zap size={14} className="text-amber-600" />
            <span className="text-foreground font-black text-sm">{totalScore} pts</span>
          </div>
        </div>

        {/* ===== WAITING ===== */}
        {phase === 'waiting' && (
          <div className="text-center py-20">
            <Loader2 size={48} className="mx-auto text-purple-600 animate-spin mb-6" />
            <h3 className="text-2xl font-black text-foreground mb-2">Bersiap-siap!</h3>
            <p className="text-secondary">Dosen sedang mempersiapkan soal pertama...</p>
          </div>
        )}

        {/* ===== QUESTION ===== */}
        {phase === 'question' && currentQuestion && (
          <>
            {/* Timer bar */}
            <div className="mb-6">
              {/* aria-live: screen readers announce when <= 5s remaining */}
              <div
                aria-live="polite"
                aria-atomic="true"
                aria-label={`Sisa waktu: ${timeLeft} detik`}
                className="sr-only"
              >
                {timeLeft <= 5 && timeLeft > 0 ? `Perhatian: sisa ${timeLeft} detik!` : null}
              </div>
              <div className="flex items-center justify-between mb-2" role="timer" aria-label={`Timer: ${timeLeft} detik tersisa`}>
                <Clock size={14} className={`${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-secondary'}`} aria-hidden="true" />
                <span className={`text-2xl font-black ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-foreground'}`} aria-hidden="true">{timeLeft}s</span>
              </div>
              <div className="h-2 bg-white shadow-sm border border-border rounded-full overflow-hidden" role="progressbar" aria-valuenow={timerPercent} aria-valuemin={0} aria-valuemax={100} aria-label="Timer progress">
                <div
                  className={`h-full rounded-full transition-all duration-200 ${timeLeft <= 5 ? 'bg-red-500' : 'bg-purple-500'}`}
                  style={{ width: `${timerPercent}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <div className="bg-white shadow-sm border border-border backdrop-blur-xl border border-border rounded-3xl p-6 mb-6">
              <h3 className="text-xl font-black text-foreground text-center leading-relaxed">
                {currentQuestion.question_text}
              </h3>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentQuestion.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => submitAnswer(i)}
                  disabled={hasAnswered}
                  className={`p-4 min-h-[64px] rounded-2xl text-foreground font-bold text-sm text-left flex items-center gap-3 transition-all ${
                    hasAnswered
                      ? selectedIndex === i
                        ? isCorrect === true ? 'bg-emerald-500 scale-105 shadow-lg shadow-emerald-500/30' 
                        : isCorrect === false ? 'bg-red-500 scale-95 opacity-70' 
                        : `bg-gradient-to-r ${OPTION_COLORS[i]} opacity-50`
                      : `bg-gradient-to-r ${OPTION_COLORS[i]} opacity-50`
                    : `bg-gradient-to-r ${OPTION_COLORS[i]} hover:scale-105 active:scale-95 shadow-lg cursor-pointer`
                  }`}
                >
                  <span className="w-8 h-8 bg-white shadow-sm border border-border rounded-lg flex items-center justify-center font-black text-sm shrink-0">
                    {OPTION_LABELS[i]}
                  </span>
                  <span className="flex-1">{opt}</span>
                  {hasAnswered && selectedIndex === i && (
                    isCorrect ? <CheckCircle2 size={20} /> : <XCircle size={20} />
                  )}
                </button>
              ))}
            </div>

            {/* Score feedback */}
            {hasAnswered && isCorrect !== null && (
              <div className={`mt-4 text-center py-3 rounded-2xl font-black ${isCorrect ? 'bg-emerald-500/20 text-emerald-600' : 'bg-red-500/20 text-red-400'}`}>
                {isCorrect ? `Benar! +${myScore} pts 🎉` : 'Salah! 0 pts'}
              </div>
            )}
          </>
        )}

        {/* ===== REVEALED ===== */}
        {phase === 'revealed' && currentQuestion && (
          <div className="space-y-6">
            <div className="bg-white shadow-sm border border-border backdrop-blur-xl border border-border rounded-3xl p-6 text-center">
              <h3 className="text-lg font-black text-foreground mb-3">{currentQuestion.question_text}</h3>
              <p className="text-emerald-600 font-bold">
                Jawaban benar: <span className="text-lg">{OPTION_LABELS[correctIndex]}</span> — {currentQuestion.options[correctIndex]}
              </p>
            </div>

            {leaderboard.length > 0 && (
              <div className="bg-white shadow-sm border border-border rounded-3xl border border-border p-6">
                <h4 className="text-xs font-black text-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Trophy size={12} className="text-amber-600" /> Top 5
                </h4>
                {leaderboard.slice(0, 5).map((entry, i) => (
                  <div key={entry.student_id} className={`flex items-center gap-3 p-2 rounded-xl ${entry.student_id === studentId ? 'bg-purple-500/20' : ''}`}>
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${i === 0 ? 'bg-amber-500 text-foreground' : i === 1 ? 'bg-gray-400 text-foreground' : i === 2 ? 'bg-amber-700 text-foreground' : 'bg-white shadow-sm border border-border text-secondary'}`}>
                      {i + 1}
                    </span>
                    <span className={`flex-1 text-sm font-bold ${entry.student_id === studentId ? 'text-purple-300' : 'text-secondary'}`}>
                      {entry.student_name} {entry.student_id === studentId && '(You)'}
                    </span>
                    <span className="text-foreground font-black text-sm">{entry.total_score}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="text-center text-secondary text-sm animate-pulse">Menunggu soal berikutnya...</div>
          </div>
        )}

        {/* ===== ENDED ===== */}
        {phase === 'ended' && (
          <div className="space-y-6 text-center">
            <div className="py-10">
              <Trophy size={64} className="mx-auto text-amber-600 mb-4" />
              <h3 className="text-3xl font-black text-foreground mb-2">Kuis Selesai! 🎉</h3>
              <p className="text-secondary mb-4">Skor akhir kamu</p>
              <p className="text-5xl font-black text-purple-600">{totalScore}</p>
            </div>

            {leaderboard.length > 0 && (
              <div className="bg-white shadow-sm border border-border rounded-3xl border border-border p-6 text-left">
                <h4 className="text-xs font-black text-secondary uppercase tracking-widest mb-3 text-center">Hasil Akhir</h4>
                {leaderboard.map((entry, i) => (
                  <div key={entry.student_id} className={`flex items-center gap-3 p-3 rounded-xl mb-1 ${entry.student_id === studentId ? 'bg-purple-500/20 border border-purple-500/30' : ''}`}>
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${i === 0 ? 'bg-amber-500 text-foreground' : i === 1 ? 'bg-gray-400 text-foreground' : i === 2 ? 'bg-amber-700 text-foreground' : 'bg-white shadow-sm border border-border text-secondary'}`}>
                      {i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}`}
                    </span>
                    <span className={`flex-1 font-bold text-sm ${entry.student_id === studentId ? 'text-purple-300' : 'text-secondary'}`}>
                      {entry.student_name}
                    </span>
                    <span className="text-foreground font-black">{entry.total_score} pts</span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={onQuizEnd}
              className="w-full px-6 py-3 bg-purple-600 text-foreground rounded-xl font-bold hover:bg-purple-700 transition-all active:scale-95"
            >
              Kembali ke Kelas
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
