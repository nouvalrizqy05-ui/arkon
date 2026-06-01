import { useState, useEffect, useRef } from 'react';
import { Search, ChevronRight, CheckCircle2, AlertCircle, Coins, Clock, Trophy } from 'lucide-react';
import { DETECTIVE_LEVELS, DETECTIVE_OPTIONS } from '../data/detective-levels';

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function ComponentDetectiveAdmin() {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 bg-slate-50">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Search size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900">Manajemen Component Detective</h2>
            <p className="text-sm text-gray-500">Kelola kasus misteri, petunjuk, dan model 3D untuk mahasiswa.</p>
          </div>
        </div>
        <button className="bg-primary text-white font-bold py-2.5 px-5 rounded-xl hover:bg-primary-hover shadow-md flex items-center gap-2">
          + Tambah Kasus
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {DETECTIVE_LEVELS.map(level => (
          <div key={level.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 font-black text-[10px] rounded uppercase">Kasus {level.id}</span>
                  <h3 className="font-bold text-gray-900">{level.name}</h3>
                </div>
                <p className="text-xs text-gray-500">Kunci Jawaban: <strong className="text-emerald-600">{DETECTIVE_OPTIONS.find(o => o.id === level.componentId)?.label || level.componentId}</strong></p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Edit</button>
                <button className="px-3 py-1.5 text-xs font-bold bg-red-50 border border-red-200 rounded-lg text-red-600 hover:bg-red-100">Hapus</button>
              </div>
            </div>
            <div className="p-4 flex-1">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Daftar Petunjuk (Clues)</h4>
              <ul className="space-y-2 mb-4">
                {level.clues.map((clue, idx) => (
                  <li key={idx} className="text-xs text-gray-700 bg-gray-50 p-2 rounded-lg border border-gray-100 flex items-start gap-2">
                    <span className="font-bold text-indigo-400">#{idx + 1}</span> {clue}
                  </li>
                ))}
              </ul>

              <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-100">
                <div className="text-xs">
                  <span className="text-gray-500">Reward: </span>
                  <span className="font-bold text-amber-600">{level.rewards.join(' / ')} Koin</span>
                </div>
                <div className="text-xs">
                  <span className="text-gray-500">Kesulitan: </span>
                  <span className={`font-bold ${level.difficulty === 'advanced' ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {(level.difficulty || 'normal').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ComponentDetective({ studentId, token, apiUrl, onCoinsEarned, activeActivity, onActivityComplete, userRole }) {
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [openedClues, setOpenedClues] = useState(1); // 1, 2, or 3
  const [guess, setGuess] = useState('');
  const [status, setStatus] = useState('intro'); // intro, playing, correct, wrong, finished
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);

  const [shuffledLevels, setShuffledLevels] = useState([]);
  const [levelOptions, setLevelOptions] = useState([]);

  const timerRef = useRef(null);
  const level = shuffledLevels[currentLevelIdx];

  if (userRole === 'dosen') return <ComponentDetectiveAdmin />;

  // Timer per level
  useEffect(() => {
    if (status === 'playing' && currentLevelIdx < DETECTIVE_LEVELS.length) {
      timerRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [status, currentLevelIdx]);

  // Fetch Leaderboard and Shuffle on mount
  useEffect(() => {
    setShuffledLevels(shuffleArray(DETECTIVE_LEVELS));
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/detective/leaderboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        const lbData = Array.isArray(result) ? result : (result.data || []);
        setLeaderboard(lbData);
      }
    } catch (err) {
      console.error("Gagal mengambil leaderboard", err);
    }
  };

  const handleRevealClue = () => {
    if (openedClues < 3) setOpenedClues(openedClues + 1);
  };

  const handleGuess = async () => {
    if (!guess) return;
    if (guess === level.componentId) {
      // Benar
      setStatus('correct');
      const reward = level.rewards[openedClues - 1];
      setTotalScore(prev => prev + reward);
      setTotalTime(prev => prev + timeElapsed);

      // Update coins
      try {
        await fetch(`${apiUrl}/api/coins/earn`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ student_id: studentId, amount: reward, reason: `Detective Level ${level.id}` })
        });
        onCoinsEarned();
      } catch (err) {
        console.error("Gagal update coin:", err);
      }
    } else {
      // Salah
      setStatus('wrong');
      setTimeout(() => setStatus('playing'), 2000);
    }
  };

  const handleNextLevel = async () => {
    if (currentLevelIdx < DETECTIVE_LEVELS.length - 1) {
      setCurrentLevelIdx(currentLevelIdx + 1);
      setOpenedClues(1);
      setGuess('');
      setStatus('playing');
      setTimeElapsed(0);
    } else {
      setStatus('finished');
      // Submit score
      try {
        await fetch(`${apiUrl}/api/detective/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ total_score: totalScore, total_time: totalTime })
        });
        fetchLeaderboard();
      } catch (err) {
        console.error("Gagal submit skor:", err);
      }

      if (activeActivity) {
        try {
          await fetch(`${apiUrl}/api/student-work`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              activity_id: activeActivity.id,
              student_id: studentId,
              score: totalScore,
              work_data: { totalTime, earned: totalScore }
            })
          });
        } catch (err) {
          console.error('Failed to save activity score:', err);
        }
      }
    }
  };

  const renderBanner = () => {
    if (!activeActivity) return null;
    return (
      <div className="w-full mb-6 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between shrink-0">
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
        <button onClick={() => { setCurrentLevelIdx(0); onActivityComplete(); }} className="px-3 py-1.5 bg-white shadow-sm border border-border text-secondary rounded-lg text-[10px] font-bold hover:bg-white shadow-sm border border-border transition">Keluar Tugas</button>
      </div>
    );
  };

  if (status === 'intro') {
    return (
      <div className="p-8 max-w-4xl mx-auto h-full flex flex-col items-center justify-center overflow-y-auto custom-scrollbar">
        {renderBanner()}
        <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-indigo-500/30">
          <Search size={48} className="text-white" />
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4 text-center tracking-tight">
          Component <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Detective</span>
        </h2>
        <p className="text-secondary mb-10 text-center max-w-xl leading-relaxed md:text-lg">
          Uji pengetahuan Anda dalam mengidentifikasi komponen PC berdasarkan klue yang diberikan.
          Semakin cepat dan sedikit klue yang Anda gunakan, semakin besar hadiah koin yang Anda peroleh!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl mb-12">
          <div className="bg-white border border-border p-6 rounded-2xl text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-indigo-100">
              <Search size={24} className="text-indigo-600" />
            </div>
            <h3 className="font-black text-foreground mb-2 text-sm uppercase tracking-wider">Analisis Klue</h3>
            <p className="text-xs text-secondary leading-relaxed">Baca deskripsi teknis dan fungsi komponen dengan teliti untuk menemukan jawabannya.</p>
          </div>
          <div className="bg-white border border-border p-6 rounded-2xl text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <Coins size={24} className="text-emerald-600" />
            </div>
            <h3 className="font-black text-foreground mb-2 text-sm uppercase tracking-wider">Dapatkan Koin</h3>
            <p className="text-xs text-secondary leading-relaxed">Berhasil menebak di klue pertama akan memberikan Anda koin maksimal (Gold).</p>
          </div>
          <div className="bg-white border border-border p-6 rounded-2xl text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <Clock size={24} className="text-rose-600" />
            </div>
            <h3 className="font-black text-foreground mb-2 text-sm uppercase tracking-wider">Berlomba Waktu</h3>
            <p className="text-xs text-secondary leading-relaxed">Kecepatan Anda menyelesaikan semua kasus akan dicatat pada Leaderboard Mingguan.</p>
          </div>
        </div>

        <button
          onClick={() => {
            setStatus('playing');
            setTimeElapsed(0);
          }}
          className="px-10 py-4 bg-primary hover:bg-indigo-600 text-white font-black rounded-2xl transition-all shadow-xl shadow-primary/30 flex items-center gap-3 hover:scale-105 active:scale-95 text-lg"
        >
          Mulai Investigasi <ChevronRight size={24} />
        </button>
      </div>
    );
  }

  if (status === 'finished') {
    return (
      <div className="p-8 max-w-4xl mx-auto h-full flex flex-col items-center overflow-y-auto custom-scrollbar">
        {renderBanner()}
        <div className="w-24 h-24 bg-amber-500/15 rounded-full flex items-center justify-center mb-6">
          <Trophy size={48} className="text-amber-600" />
        </div>
        <h2 className="text-3xl font-black text-foreground mb-2">Kasus Ditutup!</h2>
        <p className="text-secondary mb-8">Anda telah menebak semua komponen dengan sukses.</p>

        <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-8">
          <div className="bg-white shadow-sm border border-border p-4 rounded-2xl border border-border text-center">
            <p className="text-xs text-secondary font-bold uppercase tracking-widest mb-1">Total Skor</p>
            <p className="text-3xl font-black text-emerald-600">{totalScore}</p>
          </div>
          <div className="bg-white shadow-sm border border-border p-4 rounded-2xl border border-border text-center">
            <p className="text-xs text-secondary font-bold uppercase tracking-widest mb-1">Total Waktu</p>
            <p className="text-3xl font-black text-rose-600">{totalTime}s</p>
          </div>
        </div>

        <button
          onClick={() => {
            setCurrentLevelIdx(0);
            setTotalScore(0);
            setTotalTime(0);
            setOpenedClues(1);
            setTimeElapsed(0);
            setShuffledLevels(shuffleArray(DETECTIVE_LEVELS));
            setStatus('playing');
          }}
          className="px-6 py-3 bg-primary hover:bg-primary text-foreground font-bold rounded-xl transition-all"
        >
          Main Lagi
        </button>
      </div>
    );
  }

  // Initialize options when level changes
  useEffect(() => {
    if (level && level.options) {
      setLevelOptions(shuffleArray(level.options));
    }
  }, [level]);

  if (!level) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto w-full h-full flex flex-col overflow-y-auto custom-scrollbar">
      {renderBanner()}
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <Search className="text-primary" />
            Component Detective
          </h1>
          <p className="text-secondary text-sm mt-1">Tebak komponen PC dari klue yang diberikan. Lebih sedikit klue = Lebih banyak koin!</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl">
            <Coins size={16} className="text-emerald-600" />
            <span className="text-emerald-600 font-bold">{totalScore} Koin</span>
          </div>
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-xl">
            <Clock size={16} className="text-rose-600" />
            <span className="text-rose-600 font-bold">{timeElapsed}s</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 flex-1 min-h-0">

        {/* Main Game Area */}
        <div className="flex flex-col gap-4">
          {/* Level Progress */}
          <div className="bg-white shadow-sm border border-border border border-border rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-primary text-foreground text-xs font-black px-2 py-1 rounded">LVL {level.id}</span>
              <span className="text-foreground font-bold">{level.name}</span>
              {level.difficulty === 'advanced' && (
                <span className="bg-amber-500/20 text-amber-600 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-500/30">⚡ ADVANCED</span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {level.stallingsRef && (
                <span className="text-[10px] text-primary/60 font-bold hidden lg:block" title={level.stallingsRef}>
                  📖 {level.stallingsRef}
                </span>
              )}
              <span className="text-xs text-secondary font-bold">{currentLevelIdx + 1}/{shuffledLevels.length}</span>
              <span className="text-xs text-secondary font-bold">
                Potensi Hadiah: <span className="text-amber-600">{level.rewards[openedClues - 1]} Koin</span>
              </span>
            </div>
          </div>

          {/* Flash Messages */}
          {status === 'wrong' && (
            <div className="p-4 bg-red-500/10 border-l-4 border-red-500 rounded-r-xl flex items-start gap-3 animate-in slide-in-from-top-2">
              <div className="bg-red-500/20 p-2 rounded-full mt-0.5">
                <AlertCircle size={18} className="text-red-500 animate-pulse" />
              </div>
              <div>
                <h4 className="text-red-500 font-bold text-sm">Investigasi Gagal!</h4>
                <p className="text-red-400/80 text-xs mt-0.5">Komponen yang Anda pilih kurang tepat. Analisis kembali klue yang ada dan coba lagi.</p>
              </div>
            </div>
          )}

          {status === 'correct' && (
            <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/30 rounded-2xl p-6 flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.1)] animate-in zoom-in-95">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 size={28} />
                </div>
                <div>
                  <h3 className="text-emerald-600 font-black text-lg mb-0.5">
                    Kasus Terpecahkan!
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600/80 text-xs font-medium">Bounty diperoleh:</span>
                    <span className="bg-amber-500/20 text-amber-600 text-xs font-black px-2 py-0.5 rounded-md border border-amber-500/30 flex items-center gap-1">
                       +{level.rewards[openedClues - 1]} KOIN
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={handleNextLevel}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0"
              >
                Lanjut Kasus <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* Clues */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex-1 flex flex-col">
            <h3 className="text-sm font-bold text-primary mb-4 uppercase tracking-widest flex items-center gap-2">
              <Search size={16} /> Berkas Investigasi
            </h3>

            <div className="space-y-4 flex-1">
              {level.clues.map((clue, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition-all duration-500 ${idx < openedClues
                      ? 'bg-white shadow-sm border border-border border-border text-foreground'
                      : 'bg-black/20 border-transparent text-transparent select-none blur-sm'
                    }`}
                >
                  <span className="text-xs font-bold text-indigo-700 mb-1 block">Klue #{idx + 1}</span>
                  {clue}
                </div>
              ))}
            </div>

            {openedClues < 3 && status === 'playing' && (
              <button
                onClick={handleRevealClue}
                className="mt-6 w-full py-3 bg-white shadow-sm border border-border hover:bg-white shadow-sm border border-border border border-border border-dashed text-secondary hover:text-foreground font-medium rounded-xl transition-all"
              >
                Buka Klue Berikutnya (Hadiah berkurang menjadi {level.rewards[openedClues]})
              </button>
            )}
          </div>

          {/* Guess Action */}
          {status !== 'correct' && (
            <div className="bg-white shadow-sm border border-border border border-border rounded-2xl p-6">
              <label className="block text-sm font-bold text-secondary mb-3">Tebakan Anda:</label>
              <div className="flex gap-3">
                <select
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  className="flex-1 bg-black/40 border border-border rounded-xl px-4 text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="" disabled>Pilih komponen...</option>
                  {levelOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
                <button
                  onClick={handleGuess}
                  disabled={!guess}
                  className="px-6 py-3 bg-primary hover:bg-primary disabled:opacity-50 text-foreground font-bold rounded-xl transition-all flex items-center gap-2"
                >
                  Jawab
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
