import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from './Toast';
import { Coins, Timer, Trophy, Star, Zap, ArrowRight, AlertCircle, Flame, Sparkles, Lightbulb, Loader2, RotateCcw, ChevronRight, Share2, Users, Brain } from 'lucide-react';
import quizData from '../data/quizzes.json';
import QuizLevelMap from './QuizLevelMap';
import ErrorBoundary from './ErrorBoundary';
import ThetaProgressCard from './ThetaProgressCard';
import AiTutorPanel from './AiTutorPanel';
import LearningPathPanel from './LearningPathPanel';

const LEVEL_COLORS = {
  emerald: { bg: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/30', text: 'text-emerald-600', badge: 'bg-emerald-500/20 text-emerald-600' },
  amber: { bg: 'from-amber-500/20 to-yellow-500/20', border: 'border-amber-500/30', text: 'text-amber-600', badge: 'bg-amber-500/20 text-amber-600' },
  red: { bg: 'from-red-500/20 to-rose-500/20', border: 'border-red-500/30', text: 'text-red-400', badge: 'bg-red-500/20 text-red-400' },
  blue: { bg: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/30', text: 'text-blue-600', badge: 'bg-blue-500/20 text-blue-600' },
  purple: { bg: 'from-purple-500/20 to-fuchsia-500/20', border: 'border-purple-500/30', text: 'text-purple-600', badge: 'bg-purple-500/20 text-purple-600' },
  rose: { bg: 'from-rose-500/20 to-pink-500/20', border: 'border-rose-500/30', text: 'text-rose-600', badge: 'bg-rose-500/20 text-rose-600' },
  indigo: { bg: 'from-primary-soft to-primary/5', border: 'border-primary/20', text: 'text-primary', badge: 'bg-primary-soft text-primary' },
  violet: { bg: 'from-violet-500/20 to-purple-100', border: 'border-violet-500/30', text: 'text-violet-400', badge: 'bg-violet-500/20 text-violet-400' },
};

function QuizMapAdmin() {
  const [selectedLevel, setSelectedLevel] = useState(null);
  
  if (selectedLevel) {
    return (
      <div className="h-full overflow-y-auto custom-scrollbar p-6 bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setSelectedLevel(null)} className="p-2 bg-white dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg text-secondary hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-foreground dark:hover:text-white transition-colors" aria-label="ArrowRight">
            <ArrowRight size={18} className="rotate-180" />
          </button>
          <div>
            <h2 className="text-xl font-black text-foreground">Kelola Soal: {selectedLevel.name}</h2>
            <p className="text-sm text-secondary">Edit, tambah, atau hapus bank soal untuk level ini.</p>
          </div>
        </div>

        <div className="bg-[var(--bg-surface)] rounded-2xl border border-border dark:border-slate-800 shadow-sm overflow-hidden mb-6">
          <div className="p-4 border-b border-border dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
            <span className="font-bold text-foreground text-sm">Daftar Soal ({selectedLevel.questions.length})</span>
            <button className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-hover shadow-sm">
              + Tambah Soal
            </button>
          </div>
          <div className="divide-y divide-border dark:divide-slate-800">
            {selectedLevel.questions.map((q, i) => (
              <div key={i} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex justify-between items-start gap-4 mb-3">
                  <h4 className="font-bold text-foreground text-sm flex-1 leading-relaxed">{q.question}</h4>
                  <div className="flex gap-2 shrink-0">
                    <button className="px-3 py-1.5 text-xs font-bold bg-[var(--bg-surface)] border border-border dark:border-slate-700 rounded-lg text-foreground hover:bg-slate-50 dark:hover:bg-slate-800">Edit</button>
                    <button className="px-3 py-1.5 text-xs font-bold bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20">Hapus</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {q.options.map((opt, optIdx) => (
                    <div key={optIdx} className={`p-2 rounded-lg text-xs border ${optIdx === q.answer ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-medium' : 'bg-[var(--bg-surface)] border-border dark:border-slate-700 text-secondary'}`}>
                      <span className="font-bold mr-2">{String.fromCharCode(65 + optIdx)}.</span> {opt}
                    </div>
                  ))}
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-lg p-3 text-xs text-indigo-800 dark:text-indigo-300">
                  <span className="font-bold uppercase tracking-widest text-[10px] text-indigo-500 mb-1 block">Penjelasan Jawaban (Feedback):</span>
                  {q.explanation}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 bg-slate-50 dark:bg-slate-950">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Star size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-foreground">Manajemen Bank Soal</h2>
            <p className="text-sm text-secondary">Kelola kurikulum dan data soal (CRUD) untuk mode adaptif mahasiswa.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {quizData.levels.map(level => {
          const colors = LEVEL_COLORS[level.color] || LEVEL_COLORS['emerald'];
          return (
            <div key={level.id} className="bg-[var(--bg-surface)] border border-border dark:border-slate-800 rounded-2xl p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedLevel(level)}>
              <div className="flex justify-between items-start mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${colors.bg} ${colors.text} shadow-sm border ${colors.border}`}>
                  {level.emoji || '📝'}
                </div>
                <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-secondary text-[10px] font-black rounded-lg uppercase tracking-wider">Level {level.id}</span>
              </div>
              <h3 className="font-bold text-foreground mb-1">{level.name}</h3>
              <p className="text-xs text-secondary mb-4 h-8 overflow-hidden">{level.desc}</p>
              
              <div className="flex items-center justify-between mt-auto">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-secondary uppercase">Total Soal</span>
                  <span className="text-sm font-black text-primary">{level.questions.length} Butir</span>
                </div>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors">
                  Kelola Soal <ChevronRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuizGame({ coins, studentId, token, apiUrl, onCoinsEarned, completedLevels, onLevelComplete, activeRoomId, activeActivity, onActivityComplete, userRole }) {
  const toast = useToast();
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [myGroups, setMyGroups] = useState([]);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [streak, setStreak] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [earnedInSession, setEarnedInSession] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [fastAnswers, setFastAnswers] = useState(0);
  const [studentTheta, setStudentTheta] = useState(null);
  const [classThetas, setClassThetas] = useState([]);
  const [bankHealthWarning, setBankHealthWarning] = useState(null); // Fix #3
  const [hintText, setHintText] = useState('');
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [wrongAnswersForHint, setWrongAnswersForHint] = useState([]);
  const [hintUsedThisQ, setHintUsedThisQ] = useState(false);
  const [sessionSEM, setSessionSEM] = useState(1.0);
  const [showAiTutor, setShowAiTutor] = useState(false);
  const [thetaHistory, setThetaHistory] = useState([]);
  const timerRef = useRef(null);

  const [dbQuestionsCache, setDbQuestionsCache] = useState({}); // cache per levelId
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const levels = quizData.levels;

  if (userRole === 'dosen') return <QuizMapAdmin />;

  // Fetch IRT theta on mount + class thetas for percentile (Fix #2)
  useEffect(() => {
    if (!studentId || !token || !apiUrl) return;
    (async () => {
      try {
        const res = await fetch(`${apiUrl}/api/irt/student/${studentId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStudentTheta(data.global_theta ?? 0);
        }
      } catch (e) { console.warn('IRT fetch failed:', e); }

      // Fetch class thetas from room summary when activeRoomId is available
      if (activeRoomId) {
        try {
          const roomRes = await fetch(`${apiUrl}/api/irt/room/${activeRoomId}/summary`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (roomRes.ok) {
            const roomData = await roomRes.json();
            const thetas = roomData.map(m => m.theta).filter(t => typeof t === 'number');
            if (thetas.length > 1) setClassThetas(thetas);
          }
        } catch (e) { console.warn('Class thetas fetch failed:', e); }
      }

      // Fix #3: Fetch bank health warning (FR-IRT-006)
      try {
        const healthRes = await fetch(`${apiUrl}/api/irt/bank/health`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (healthRes.ok) {
          const healthData = await healthRes.json();
          if (!healthData.is_sufficient && healthData.warnings?.length > 0) {
            setBankHealthWarning('⚠️ Bank soal terbatas — soal mungkin berulang');
          }
        }
      } catch (e) { console.warn('Bank health fetch failed:', e); }
    })();
  }, [studentId, token, apiUrl, activeRoomId]);

  // Timer logic
  useEffect(() => {
    if (selectedLevel && !quizFinished && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            handleAnswer(-1); // Time's up
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [selectedLevel, currentQ, quizFinished, timeLeft]);

  // ─── IRT-Driven DB Question Fetch (FR-IRT-007 integration) ──────
  // Tries DB questions first (dosen-managed bank), falls back to static JSON
  const fetchQuestionsForLevel = async (level) => {
    if (!activeRoomId || !token) return null;

    // Check cache first
    if (dbQuestionsCache[level.id]) return dbQuestionsCache[level.id];

    try {
      // Map level difficulty range
      const difficultyMap = {
        1: 1, 2: 1, 3: 2, 4: 2, 5: 2,
        6: 2, 7: 2, 8: 3, 9: 3, 10: 3, 11: 3, 12: 3, 13: 3, 14: 3
      };
      const diff = difficultyMap[level.id] || 2;
      const topic = level.chapterTitle || level.name || '';

      const params = new URLSearchParams({ limit: 30, difficulty: diff });
      if (topic) params.append('topic', topic.split(' ')[0]); // first word as topic filter

      const res = await fetch(`${apiUrl}/api/irt/bank/${activeRoomId}?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.questions && data.questions.length >= 5) {
          // Normalize DB question format to match static JSON format
          const normalized = data.questions.map(q => ({
            id: q.id,
            question: q.question_text,
            options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
            answer: q.correct_index,
            difficulty: q.difficulty,
            explanation: q.explanation || '',
            fromDB: true
          }));
          setDbQuestionsCache(prev => ({ ...prev, [level.id]: normalized }));
          return normalized;
        }
      }
    } catch (e) {
      console.warn('[QuizGame] DB questions unavailable, using static JSON:', e.message);
    }
    return null;
  };

  const startLevel = async (levelId) => {
    const level = levels.find(l => l.id === levelId);
    if (!level) return;

    setIsLoadingQuestions(true);

    // Try DB questions first, fallback to static JSON
    let questionPool = await fetchQuestionsForLevel(level);
    if (!questionPool || questionPool.length < 5) {
      // Fallback: static JSON questions
      questionPool = level.questions.map(q => ({
        ...q,
        question: q.question || q.question_text,
        answer: q.answer !== undefined ? q.answer : q.correct_index,
        fromDB: false
      }));
    }

    // IRT-aware selection: pick questions near student theta (max info point)
    const theta = studentTheta !== null ? studentTheta : 0;
    const sortedByInfo = [...questionPool].sort((a, b) => {
      // Information function: p*(1-p), max when difficulty ≈ theta
      const diffA = a.difficulty || 2;
      const diffB = b.difficulty || 2;
      const pA = 1 / (1 + Math.exp(-(theta - (diffA - 2)))); // map 1-3 -> -1,0,1
      const pB = 1 / (1 + Math.exp(-(theta - (diffB - 2))));
      const infoA = pA * (1 - pA);
      const infoB = pB * (1 - pB);
      return infoB - infoA; // descending info
    });

    // Pick top 15 by info, then randomize among those, pick 10
    const topPool = sortedByInfo.slice(0, Math.min(15, sortedByInfo.length));
    const shuffled = [...topPool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 10).map(q => {
      const options = [...(q.options || [])];
      const correctAnswer = options[q.answer !== undefined ? q.answer : q.correct_index];
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }
      return { ...q, options, answer: options.indexOf(correctAnswer) };
    });

    setIsLoadingQuestions(false);
    setSelectedLevel(level);
    setCurrentQuestions(selected);
    setCurrentQ(0);
    setAnswers({});
    setStreak(0);
    setMaxStreak(0);
    setFastAnswers(0);
    setEarnedInSession(0);
    setQuizFinished(false);
    setSelectedOption(null);
    setShowResult(false);
    setThetaHistory([]);
    setSessionSEM(1.0);

    setTimeLeft(level.timer_seconds);
  };

  const handleAnswer = useCallback((optionIdx) => {
    if (showResult || !selectedLevel) return;
    clearInterval(timerRef.current);

    const question = currentQuestions[currentQ];
    const isCorrect = optionIdx === question.answer;
    const timeSpent = selectedLevel.timer_seconds - timeLeft;
    const isFast = timeSpent <= 5;

    setSelectedOption(optionIdx);
    setShowResult(true);
    setAnswers(prev => ({ ...prev, [currentQ]: { selected: optionIdx, correct: isCorrect, isFast: isFast && isCorrect } }));

    // IRT Calcs
    const baseDifficulty = question.difficulty || 0.5; // 0.5 sebagai titik netral IRT logistik (kontinu)
    const currentTheta = studentTheta !== null ? studentTheta : 0;
    const pSuccess = 1.0 / (1.0 + Math.exp(-(currentTheta - baseDifficulty)));
    const observation = isCorrect ? 1.0 : 0.0;
    const K = 1.2 / (1.0 + currentQ * 0.15);
    const newTheta = Math.max(-3.0, Math.min(3.0, currentTheta + K * (observation - pSuccess)));

    const newHistoryItem = { qIndex: currentQ + 1, prevTheta: currentTheta, difficulty: baseDifficulty, isCorrect };
    const updatedHistory = [...thetaHistory, newHistoryItem];
    setThetaHistory(updatedHistory);

    let sumInfo = 0.02; // prior
    updatedHistory.forEach(h => {
      const p = 1.0 / (1.0 + Math.exp(-(h.prevTheta - h.difficulty)));
      sumInfo += p * (1 - p);
    });
    setSessionSEM(Math.min(1.5, Math.max(0.1, 1.0 / Math.sqrt(sumInfo))));
    // NOTE: This local theta is a provisional EAP estimate for real-time display only.
    // The authoritative theta is computed server-side via Newton-Raphson MLE in finishQuiz()
    // and will overwrite this value (see setStudentTheta(irtData.theta) in finishQuiz).
    setStudentTheta(newTheta);

    if (isCorrect) {
      setStreak(prev => {
        const next = prev + 1;
        if (next > maxStreak) setMaxStreak(next);
        return next;
      });
      if (isFast) setFastAnswers(prev => prev + 1);
      
      // Auto-advance after 1.5s only if correct
      setTimeout(() => {
        handleNextQuestion();
      }, 1500);
    } else {
      setStreak(0);
      setShowAiTutor(true); // Show AI tutor on wrong answer
      // Track wrong answer for AI hint context
      const wrongOpt = question.options[optionIdx];
      if (wrongOpt) setWrongAnswersForHint(prev => [...prev, wrongOpt].slice(-5));
      // Wait for manual advance for wrong answers
    }
  }, [selectedLevel, currentQuestions, currentQ, showResult]);

  const handleNextQuestion = () => {
    setShowAiTutor(false); // Hide AI tutor on next question
    if (currentQ < currentQuestions.length - 1) {
      setCurrentQ(prev => prev + 1);
      setSelectedOption(null);
      setShowResult(false);
      setHintText('');
      setHintUsedThisQ(false);

      setTimeLeft(selectedLevel.timer_seconds);
    } else {
      finishQuiz();
    }
  };



  const finishQuiz = async () => {
    setQuizFinished(true);
    clearInterval(timerRef.current);

    const totalCorrect = Object.values(answers).filter(a => a.correct).length;
    const scorePercent = (totalCorrect / currentQuestions.length) * 100;
    const passed = scorePercent >= 80;

    if (passed) {
      // Logic Koin: Level-based reward + Bonuses
      const isFirstTime = !completedLevels.includes(selectedLevel.id);
      const baseReward = isFirstTime ? selectedLevel.base_reward : Math.floor(selectedLevel.base_reward * 0.25);

      // 1. Streak Multiplier (3+ -> 1.5x, 5+ -> 2x)
      let streakMultiplier = 1;
      if (maxStreak >= 5) streakMultiplier = 2;
      else if (maxStreak >= 3) streakMultiplier = 1.5;

      // 2. Speed Bonus (30% per fast answer)
      const speedBonus = Math.floor((fastAnswers / currentQuestions.length) * 0.3 * baseReward);

      const totalReward = Math.floor(baseReward * streakMultiplier) + speedBonus;

      setEarnedInSession(totalReward);

      try {
        await fetch(`${apiUrl}/api/coins/earn`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            student_id: studentId,
            amount: totalReward,
            reason: `Level ${selectedLevel.id} (S:${maxStreak}, F:${fastAnswers})`
          }),
        });
        if (onCoinsEarned) onCoinsEarned(totalReward);
      } catch (err) {
        console.error('Failed to save coins:', err);
      }

      if (activeActivity) {
        try {
          await fetch(`${apiUrl}/api/student-work`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              activity_id: activeActivity.id,
              student_id: studentId,
              score: Math.round(scorePercent),
              work_data: { maxStreak, fastAnswers, earned: totalReward }
            })
          });
        } catch (err) {
          console.error('Failed to save activity score:', err);
        }
      }
    }

    // --- INTEGRASI IRT: Update ability estimate (theta) ---
    try {
      const irtResponses = currentQuestions.map((q, idx) => ({
        correct: answers[idx]?.correct || false,
        difficulty: q.difficulty || 2 // Default ke 2 (medium) agar validasi backend [1,2,3] lolos
      }));

      const irtResult = await fetch(`${apiUrl}/api/irt/update-theta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          student_id: studentId,
          room_id: activeRoomId,
          responses: irtResponses
        }),
      });
      console.log('✅ IRT Ability Estimate Updated');
      // Update local theta for adaptive recommendations
      if (irtResult.ok) {
        const irtData = await irtResult.json();
        setStudentTheta(irtData.theta);
      }
    } catch (err) {
      console.error('Failed to update IRT theta:', err);
    }

    // Mark level as completed
    if (onLevelComplete && passed && !completedLevels.includes(selectedLevel.id)) {
      onLevelComplete(selectedLevel.id);
    }
  };

  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (quizFinished && activeRoomId) {
      fetch(`${apiUrl}/api/study-groups/room/${activeRoomId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        setMyGroups(data.filter(g => g.is_member));
      })
      .catch(err => console.error('Failed to fetch groups for sharing:', err));
    }
  }, [quizFinished, activeRoomId, apiUrl, token]);

  const shareToGroup = async (groupId) => {
    const totalCorrect = Object.values(answers).filter(a => a.correct).length;
    const totalQuestions = currentQuestions.length;
    const percentage = Math.round((totalCorrect / totalQuestions) * 100);
    
    const content = `📊 Hasil Kuis: ${selectedLevel.name}\nSkor: ${percentage}%\nKoin: 🪙${earnedInSession}\n${percentage >= 80 ? 'Lulus! 🎉' : 'Belum Lulus ⚠️'}`;

    try {
      const res = await fetch(`${apiUrl}/api/study-groups/${groupId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content, message_type: 'chat' }) // We use 'chat' type for simplicity or can use a new type
      });
      if (res.ok) {
        toast.success('Hasil kuis berhasil dibagikan ke grup!');
        setShowShareOptions(false);
      }
    } catch (err) {
      console.error('Failed to share quiz result:', err);
    }
  };

  const renderBanner = () => {
    if (!activeActivity) return null;
    return (
      <div className="mx-6 mt-4 mb-0 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center text-lg">📋</div>
          <div>
            <p className="text-sm font-black text-amber-600">Mode Tugas: {activeActivity.title}</p>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-[10px] font-bold text-amber-300">
                Deadline: {new Date(activeActivity.due_date || activeActivity.deadline).toLocaleDateString('id-ID')}
              </span>
            </div>
          </div>
        </div>
        <button onClick={() => { setSelectedLevel(null); onActivityComplete(); }} className="px-3 py-1.5 bg-white dark:bg-slate-800 shadow-sm border border-border dark:border-slate-700 text-secondary hover:text-foreground dark:hover:text-white rounded-lg text-[10px] font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition">Keluar Tugas</button>
      </div>
    );
  };

  // 1. Level Map Screen
  if (!selectedLevel) {
    // ... (rest of the map screen)
    return (
      <div className="h-full flex flex-col overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-950">
        {renderBanner()}
        {/* Fix #3: Bank Health Warning Banner (FR-IRT-006) */}
        {bankHealthWarning && (
          <div
            role="alert"
            aria-live="polite"
            className="mx-4 mt-3 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2"
            style={{
              background: 'rgba(234, 179, 8, 0.12)',
              border: '1px solid rgba(234, 179, 8, 0.35)',
              color: '#a16207',
            }}
          >
            <span aria-hidden="true">⚠️</span>
            {bankHealthWarning}
          </div>
        )}
        <div className="flex-1 relative">
          {isLoadingQuestions ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 size={40} className="text-primary animate-spin" />
              <p className="text-sm text-secondary font-semibold">Memuat soal adaptif...</p>
            </div>
          ) : (
            <QuizLevelMap completedLevels={completedLevels} onSelectLevel={startLevel} studentTheta={studentTheta} />
          )}
        </div>
      </div>
    );
  }

  // 2. Quiz Finished Screen
  if (quizFinished) {
    // ... (rest of finished screen)
    const totalCorrect = Object.values(answers).filter(a => a.correct).length;
    const totalQuestions = currentQuestions.length;
    const percentage = Math.round((totalCorrect / totalQuestions) * 100);
    const passed = percentage >= 80;

    // TASK-ALP-002: Personalized Insight Heuristic
    const weakestTopicCount = Object.entries(answers).reduce((acc, [idx, a]) => {
      if (!a.correct) {
         const q = currentQuestions[idx];
         if (q && q.topic) {
           acc[q.topic] = (acc[q.topic] || 0) + 1;
         }
      }
      return acc;
    }, {});
    const weakestTopic = Object.keys(weakestTopicCount).sort((a,b) => weakestTopicCount[b] - weakestTopicCount[a])[0];
    const insightText = weakestTopic 
      ? `Sistem AI mendeteksi kamu sedikit kesulitan di topik "${weakestTopic}". Saran: Fokus ulang pada materi ini sebelum ujian sesungguhnya.`
      : `Luar biasa! Pemahamanmu sangat solid di seluruh topik pada level ini.`;

    return (
      <div className="h-full flex flex-col overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-950">
        {renderBanner()}
        <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-[var(--bg-surface)] border border-border dark:border-slate-800 rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden">
          {passed && <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />}

          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg ${passed ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-500/30' : 'bg-gradient-to-br from-red-400 to-rose-500 shadow-red-500/30'
            }`}>
            {passed ? <Trophy size={40} className="text-foreground" /> : <AlertCircle size={40} className="text-foreground" />}
          </div>

          <h2 className="text-2xl font-black text-foreground mb-2">
            {passed ? 'Level Selesai! 🎉' : 'Gagal (KKM 80%) ⚠️'}
          </h2>
          <p className="text-secondary text-sm mb-4">Level {selectedLevel.id}: {selectedLevel.name}</p>

          {passed && (
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-1.5">
                <Flame size={12} className="text-amber-500" />
                <span className="text-[10px] font-black text-amber-500 uppercase">Streak: {maxStreak}</span>
              </div>
              <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-1.5">
                <Zap size={12} className="text-blue-600" />
                <span className="text-[10px] font-black text-blue-600 uppercase">Fast: {fastAnswers}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 rounded-xl p-4">
              <p className={`text-3xl font-black ${passed ? 'text-emerald-600' : 'text-red-400'}`}>{percentage}%</p>
              <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">Skor Akhir</p>
            </div>
            <div className="bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 rounded-xl p-4">
              <p className="text-3xl font-black text-amber-600">🪙 {earnedInSession}</p>
              <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">Koin Didapat</p>
            </div>
          </div>

          {!passed && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-xs text-red-400 font-bold">
              Skor Anda di bawah 80%. Silakan ulangi level ini untuk melanjutkan ke level berikutnya.
            </div>
          )}

          {/* Learning Path Recommendations (FR-ALP-001) */}
          <div className="mb-4">
            <LearningPathPanel
              studentId={studentId}
              token={token}
              activeRoomId={activeRoomId}
              studentTheta={studentTheta || 0}
            />
          </div>

          {/* AI Insight Card (TASK-ALP-002) */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6 flex items-start gap-3 text-left">
            <div className="w-8 h-8 rounded-full bg-primary-soft flex items-center justify-center shrink-0">
              <Brain size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-wider mb-1">💡 AI Insight (Alpha)</p>
              <p className="text-xs text-secondary leading-relaxed">{insightText}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => startLevel(selectedLevel.id)} className="flex-1 py-3 bg-white dark:bg-slate-800 shadow-sm border border-border dark:border-slate-700 text-foreground dark:text-white font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm flex items-center justify-center gap-2" aria-label="RotateCcw">
              <RotateCcw size={14} /> {passed ? 'Main Lagi' : 'Ulangi'}
            </button>
            <button onClick={() => setSelectedLevel(null)} className="flex-1 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover transition text-sm flex items-center justify-center gap-2">
              Peta Level <ChevronRight size={14} />
            </button>
          </div>

          {myGroups.length > 0 && (
            <div className="mt-4 relative">
              <button 
                onClick={() => setShowShareOptions(!showShareOptions)}
                className="w-full py-2.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold rounded-xl hover:bg-cyan-500/20 transition text-xs flex items-center justify-center gap-2"
              >
                <Share2 size={14} /> Bagikan ke Study Group
              </button>
              
              {showShareOptions && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#1a1f2e] border border-border rounded-xl shadow-2xl z-50 py-2 max-h-40 overflow-y-auto custom-scrollbar">
                  <p className="text-[10px] text-secondary px-3 py-1 uppercase font-bold tracking-widest">Pilih Grup:</p>
                  {myGroups.map(g => (
                    <button 
                      key={g.id}
                      onClick={() => shareToGroup(g.id)}
                      className="w-full text-left px-4 py-2 text-xs text-secondary hover:bg-slate-800 shadow-sm border-border dark:border-slate-700 hover:text-cyan-400 transition-colors flex items-center justify-between"
                    >
                      <span className="truncate">{g.name}</span>
                      <Users size={12} className="shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      </div>
    );
  }

  // 3. Quiz In-Progress Screen
  const question = currentQuestions[currentQ];
  const colors = LEVEL_COLORS[selectedLevel.color] || LEVEL_COLORS['emerald'];
  const progress = ((currentQ) / currentQuestions.length) * 100;

  return (
    <div className="h-full flex flex-col overflow-y-auto custom-scrollbar p-6 relative bg-slate-50 dark:bg-slate-950">
      {renderBanner()}
      {/* Exit Confirmation Modal */}
      {isExiting && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-50/85 dark:bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[var(--bg-surface)] border border-border dark:border-slate-800 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-500">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-black text-foreground mb-2">Berhenti Sekarang?</h3>
            <p className="text-secondary text-sm mb-6 leading-relaxed">
              Jika Anda keluar sekarang, seluruh koin yang didapat di sesi ini akan <span className="text-red-400 font-bold italic underline">HANGUS</span>. Yakin ingin berhenti?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsExiting(false)}
                className="flex-1 py-3 bg-white dark:bg-slate-800 shadow-sm border border-border dark:border-slate-700 text-foreground font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm"
              >
                Lanjutkan
              </button>
              <button
                onClick={() => { setSelectedLevel(null); setIsExiting(false); }}
                className="flex-1 py-3 bg-red-500 text-foreground font-bold rounded-xl hover:bg-red-400 transition text-sm"
              >
                Yakin, Berhenti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExiting(true)}
            className="p-2 bg-white dark:bg-slate-800 shadow-sm border border-border dark:border-slate-700 text-secondary hover:text-foreground dark:hover:text-white hover:bg-red-500/20 hover:border-red-500/30 rounded-xl transition-all"
            title="Keluar Kuis"
          >
            <ArrowRight size={18} className="rotate-180" />
          </button>
          <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${colors.badge}`}>
            Level {selectedLevel.id}
          </div>
          <h3 className="text-foreground font-bold text-sm hidden md:block">{selectedLevel.name}</h3>
        </div>
        <div className="flex items-center gap-4">
          {streak >= 2 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg animate-bounce">
              <Flame size={14} className="text-rose-500" />
              <span className="text-rose-500 text-xs font-black">{streak} STREAK</span>
            </div>
          )}
          
          {/* IRT Metrics Mini Display */}
          <div className="hidden lg:block transform scale-75 origin-right">
            <ThetaProgressCard theta={studentTheta || 0} classThetas={classThetas} compact />
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <Coins size={14} className="text-amber-600" />
            <span className="text-amber-600 text-xs font-black">+{selectedLevel.base_reward}</span>
          </div>
        </div>
      </div>

      {/* Progress & Timer */}
      <div className="flex items-center gap-4 mb-8 shrink-0">
        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 shadow-sm rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center gap-2 min-w-[60px]" role="timer" aria-label={`Sisa waktu: ${timeLeft} detik`}>
          {/* sr-only: announces urgency to screen readers */}
          <span aria-live="polite" aria-atomic="true" className="sr-only">
            {timeLeft <= 5 && timeLeft > 0 ? `Sisa ${timeLeft} detik!` : ''}
          </span>
          <Timer size={14} className={timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-secondary'} aria-hidden="true" />
          <span aria-hidden="true" className={`text-xs font-black tabular-nums ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-secondary'}`}>
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* Question Card */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
        <div className="w-full bg-[var(--bg-surface)] border border-border dark:border-slate-800 shadow-sm rounded-3xl p-8 relative">
          <div className="absolute -top-4 left-8 px-4 py-1 bg-indigo-500 rounded-full text-[10px] font-black text-white uppercase tracking-widest">
            Pertanyaan {currentQ + 1}
          </div>

          <h2 className="text-xl font-bold text-foreground mb-8 leading-relaxed mt-2">{question.question}</h2>

          {/* AI Hint Button & Display */}
          {!showResult && !hintUsedThisQ && (
            <button
              onClick={async () => {
                setIsHintLoading(true);
                setHintUsedThisQ(true);
                try {
                  const res = await fetch(`${apiUrl}/api/ai/adaptive-hint`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                      question: question.question,
                      options: question.options,
                      wrongAnswers: wrongAnswersForHint,
                      levelName: selectedLevel.name
                    })
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setHintText(data.hint || 'Tidak ada hint tersedia.');
                  } else {
                    setHintText('Hint tidak tersedia saat ini.');
                  }
                } catch { setHintText('Gagal memuat hint.'); }
                setIsHintLoading(false);
              }}
              disabled={isHintLoading}
              className="mb-4 flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-xl text-xs font-bold hover:bg-amber-500/20 transition-all"
            >
              {isHintLoading ? <Loader2 size={14} className="animate-spin" /> : <Lightbulb size={14} />}
              {isHintLoading ? 'Memuat hint...' : '💡 Minta Hint AI'}
            </button>
          )}
          {hintText && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
              <p className="text-amber-600 text-[10px] font-black mb-1">💡 HINT AI</p>
              <p className="text-secondary text-xs leading-relaxed">{hintText}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            {question.options.map((opt, i) => {
              let optClass = 'border-border dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-secondary hover:text-foreground';
              if (showResult) {
                if (i === question.answer) optClass = 'border-emerald-500/50 bg-emerald-500/20 text-emerald-600';
                else if (i === selectedOption && !answers[currentQ]?.correct) optClass = 'border-red-500/50 bg-red-500/20 text-red-400';
                else optClass = 'opacity-30 border-border text-secondary';
              } else if (i === selectedOption) {
                optClass = 'border-indigo-500/50 bg-indigo-100 text-indigo-600';
              }

              return (
                <button
                  key={i}
                  onClick={() => !showResult && handleAnswer(i)}
                  disabled={showResult}
                  className={`w-full text-left p-5 rounded-2xl border-2 transition-all group flex items-center gap-4 ${optClass}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black border-2 transition-all ${showResult && i === question.answer ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-white dark:bg-slate-800 shadow-sm border-border dark:border-slate-700 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 group-hover:border-indigo-200 dark:group-hover:border-indigo-800 group-hover:text-indigo-600 dark:group-hover:text-indigo-300'
                    }`}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span className="text-sm font-medium">{opt}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback Message */}
        <div className="w-full mt-4 flex flex-col gap-3">
          {showResult && (
            <div className={`p-4 rounded-2xl border flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${answers[currentQ]?.correct ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'
              }`}>
              <div className="mt-0.5">
                {answers[currentQ]?.correct ? <Zap size={16} className="text-emerald-600" /> : <AlertCircle size={16} className="text-red-400" />}
              </div>
              <div className="flex-1">
                <p className={`text-xs font-black mb-1 ${answers[currentQ]?.correct ? 'text-emerald-600' : 'text-red-400'}`}>
                  {answers[currentQ]?.correct ? (answers[currentQ]?.isFast ? 'TEPAT & CEPAT! ⚡' : 'JAWABAN TEPAT!') : 'KURANG TEPAT'}
                </p>
                <p className="text-[10px] text-secondary leading-relaxed italic mb-2">{question.explanation}</p>
                
                {!answers[currentQ]?.correct && (
                  <div className="mt-2 space-y-3">
                    {/* AI Tutor — context-aware explanation for wrong answers */}
                    {showAiTutor && question && (
                      <AiTutorPanel
                        questionText={question.question || question.question_text}
                        wrongAnswer={question.options?.[selectedOption]}
                        correctAnswer={question.options?.[question.answer]}
                        topic={question.topic || selectedLevel?.chapterTitle}
                        explanation={question.explanation}
                        token={token}
                        onDismiss={() => setShowAiTutor(false)}
                      />
                    )}
                    <button 
                      onClick={handleNextQuestion}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-foreground rounded-xl text-xs font-bold transition"
                    >
                      Lanjut <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QuizGameWithErrorBoundary(props) {
  return (
    <ErrorBoundary inline name="Quiz Game">
      <QuizGame {...props} />
    </ErrorBoundary>
  );
}
