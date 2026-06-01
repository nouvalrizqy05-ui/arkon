import { useState, useEffect, useCallback } from 'react';
import { useToast } from './Toast';
import { Trophy, Swords, Crown, Users, Play, Clock, CheckCircle, XCircle, Loader2, Shield, Zap, Medal, ArrowLeft } from 'lucide-react';

export default function ClassTournament({ studentId, token, apiUrl, roomId, socket, onBack }) {
  const toast = useToast();
  const [tournaments, setTournaments] = useState([]);
  const [activeTournament, setActiveTournament] = useState(null);
  const [bracketData, setBracketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [duelState, setDuelState] = useState(null); // { match_id, questions, currentQ, scores, timeLeft }

  const fetchTournaments = useCallback(async () => {
    if (!roomId) return;
    try {
      const res = await fetch(`${apiUrl}/api/tournaments/room/${roomId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setTournaments(await res.json());
    } catch (err) { console.error('Tournament fetch error:', err); }
    finally { setLoading(false); }
  }, [roomId]);

  const fetchBracket = async (tournamentId) => {
    try {
      const res = await fetch(`${apiUrl}/api/tournaments/${tournamentId}/bracket`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBracketData(data);
        setActiveTournament(data.tournament);
      }
    } catch (err) { console.error('Bracket fetch error:', err); }
  };

  const joinTournament = async (tournamentId) => {
    try {
      const res = await fetch(`${apiUrl}/api/tournaments/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ tournament_id: tournamentId })
      });
      const data = await res.json();
      if (res.ok) {
        fetchTournaments();
        if (activeTournament?.id === tournamentId) fetchBracket(tournamentId);
      } else {
        toast.error(data.error || 'Gagal bergabung ke turnamen');
      }
    } catch (err) { toast.error('Gagal terhubung ke server'); }
  };

  // Socket listeners
  useEffect(() => {
    if (!socket) return;
    
    socket.on('tournament:update', (data) => {
      fetchTournaments();
      if (activeTournament?.id === data.tournament_id) fetchBracket(data.tournament_id);
    });

    socket.on('tournament:duel-start', (data) => {
      if (data.player1_id === studentId || data.player2_id === studentId) {
        setDuelState({
          match_id: data.match_id,
          questions: data.questions,
          currentQ: 0,
          myScore: 0,
          startTime: Date.now(),
          answered: false
        });
      }
    });

    return () => {
      socket.off('tournament:update');
      socket.off('tournament:duel-start');
    };
  }, [socket, activeTournament]);

  useEffect(() => { fetchTournaments(); }, [fetchTournaments]);

  // Duel answer handler
  const submitDuelAnswer = async (selectedIndex) => {
    if (!duelState || duelState.answered) return;
    const answerTime = Date.now() - duelState.startTime;
    
    setDuelState(prev => ({ ...prev, answered: true }));

    try {
      const res = await fetch(`${apiUrl}/api/tournaments/match/${duelState.match_id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ question_index: duelState.currentQ, selected_index: selectedIndex, answer_time_ms: answerTime })
      });
      const data = await res.json();
      
      setTimeout(() => {
        const nextQ = duelState.currentQ + 1;
        if (nextQ < duelState.questions.length) {
          setDuelState(prev => ({ ...prev, currentQ: nextQ, myScore: prev.myScore + data.score, startTime: Date.now(), answered: false }));
        } else {
          // Duel finished
          setDuelState(prev => ({ ...prev, finished: true, myScore: prev.myScore + data.score }));
          // End match
          fetch(`${apiUrl}/api/tournaments/match/${duelState.match_id}/end`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
          }).then(() => {
            if (activeTournament) fetchBracket(activeTournament.id);
          });
        }
      }, 1500);
    } catch (err) { console.error('Duel answer error:', err); }
  };

  // === DUEL SCREEN ===
  if (duelState && !duelState.finished) {
    const q = duelState.questions[duelState.currentQ];
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0f1e] via-[#1a1040] to-[#0a0f1e] p-8">
        <div className="max-w-2xl w-full">
          {/* Duel Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-500/20 rounded-xl flex items-center justify-center">
                <Swords size={20} className="text-rose-600" />
              </div>
              <div>
                <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest">⚔️ DUEL MODE</p>
                <p className="text-foreground font-bold text-sm">Soal {duelState.currentQ + 1} / {duelState.questions.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white shadow-sm border border-border border border-border px-4 py-2 rounded-xl">
              <Zap size={14} className="text-amber-600" />
              <span className="text-amber-600 font-black text-sm">{duelState.myScore}</span>
            </div>
          </div>

          {/* Question */}
          <div className="bg-white shadow-sm border border-border border border-border rounded-3xl p-8 backdrop-blur-sm mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={14} className="text-secondary" />
              <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">{q.time} detik</span>
            </div>
            <h2 className="text-2xl font-black text-foreground leading-relaxed">{q.question}</h2>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-3">
            {q.options.map((opt, i) => (
              <button
                key={i}
                disabled={duelState.answered}
                onClick={() => submitDuelAnswer(i)}
                className={`w-full text-left p-5 rounded-2xl border-2 transition-all font-bold text-sm ${
                  duelState.answered
                    ? i === q.correct
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                      : 'border-border bg-white shadow-sm border border-border text-secondary'
                    : 'border-border bg-white shadow-sm border border-border text-foreground hover:border-rose-500 hover:bg-rose-500/10 hover:text-rose-300'
                }`}
              >
                <span className="mr-3 text-secondary font-black">{String.fromCharCode(65 + i)}.</span>
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // === DUEL RESULT ===
  if (duelState?.finished) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0f1e] to-[#1a1040] p-8">
        <div className="w-24 h-24 bg-amber-500/20 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl border border-amber-500/30">
          <Trophy size={48} className="text-amber-600" />
        </div>
        <h2 className="text-3xl font-black text-foreground mb-2">Duel Selesai!</h2>
        <p className="text-secondary text-sm mb-6">Skor Anda: <span className="text-amber-600 font-black text-xl">{duelState.myScore}</span></p>
        <button 
          onClick={() => { setDuelState(null); if (activeTournament) fetchBracket(activeTournament.id); }}
          className="px-8 py-3 bg-primary text-foreground rounded-2xl font-bold hover:bg-primary-hover transition shadow-lg shadow-primary/20"
        >
          Kembali ke Bracket
        </button>
      </div>
    );
  }

  // === BRACKET VIEW ===
  if (bracketData) {
    const { tournament, participants, matches } = bracketData;
    const rounds = {};
    matches.forEach(m => {
      if (!rounds[m.round]) rounds[m.round] = [];
      rounds[m.round].push(m);
    });
    const roundKeys = Object.keys(rounds).map(Number).sort((a, b) => a - b);
    const roundNames = { 1: 'Round 1', 2: 'Quarter Final', 3: 'Semi Final', 4: 'Final' };

    return (
      <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => { setBracketData(null); setActiveTournament(null); }} className="p-2 bg-white shadow-sm border border-border hover:bg-white shadow-sm border border-border rounded-xl transition text-secondary hover:text-foreground" aria-label="XCircle">
              <XCircle size={20} />
            </button>
            <div>
              <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                <Trophy size={20} className="text-amber-600" /> {tournament.title}
              </h2>
              <p className="text-xs text-secondary">{participants.length} pemain • {tournament.status === 'completed' ? '✅ Selesai' : tournament.status === 'in_progress' ? '🔴 Berlangsung' : '📋 Pendaftaran'}</p>
            </div>
          </div>
          {tournament.status === 'registration' && (
            <button onClick={() => joinTournament(tournament.id)} className="px-6 py-2.5 bg-emerald-600 text-foreground rounded-xl font-bold text-sm hover:bg-emerald-700 transition shadow-lg shadow-emerald-500/20">
              Daftar Turnamen
            </button>
          )}
        </div>

        {/* Bracket */}
        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar p-8">
          {roundKeys.length > 0 ? (
            <div className="flex gap-8 items-start min-w-max">
              {roundKeys.map(roundNum => (
                <div key={roundNum} className="flex flex-col gap-4 min-w-[280px]">
                  <div className="text-center mb-2">
                    <span className="text-[10px] font-black text-secondary uppercase tracking-widest">
                      {roundNames[roundNum] || `Round ${roundNum}`}
                    </span>
                  </div>
                  {rounds[roundNum].map((match, mi) => (
                    <div key={mi} className={`bg-white shadow-sm border border-border border rounded-2xl overflow-hidden transition-all ${
                      match.status === 'active' ? 'border-rose-500/50 shadow-lg shadow-rose-500/10 animate-pulse' : 
                      match.status === 'completed' ? 'border-emerald-500/30' : 'border-border'
                    }`}>
                      {/* Player 1 */}
                      <div className={`flex items-center gap-3 px-4 py-3 border-b border-border ${match.winner_id === match.player1_id ? 'bg-emerald-500/10' : ''}`}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black ${
                          match.winner_id === match.player1_id ? 'bg-emerald-500 text-foreground' : 'bg-white shadow-sm border border-border text-secondary'
                        }`}>
                          {match.winner_id === match.player1_id ? <Crown size={12} /> : '1'}
                        </div>
                        <span className={`text-sm font-bold flex-1 truncate ${match.player1_name ? 'text-foreground' : 'text-secondary'}`}>
                          {match.player1_name || 'TBD'}
                        </span>
                        <span className="text-xs font-black text-secondary">{match.player1_score || 0}</span>
                      </div>
                      {/* Player 2 */}
                      <div className={`flex items-center gap-3 px-4 py-3 ${match.winner_id === match.player2_id ? 'bg-emerald-500/10' : ''}`}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black ${
                          match.winner_id === match.player2_id ? 'bg-emerald-500 text-foreground' : 'bg-white shadow-sm border border-border text-secondary'
                        }`}>
                          {match.winner_id === match.player2_id ? <Crown size={12} /> : '2'}
                        </div>
                        <span className={`text-sm font-bold flex-1 truncate ${match.player2_name ? 'text-foreground' : 'text-secondary'}`}>
                          {match.player2_name || 'TBD'}
                        </span>
                        <span className="text-xs font-black text-secondary">{match.player2_score || 0}</span>
                      </div>
                      {/* Match Status */}
                      <div className={`px-4 py-2 text-center text-[9px] font-black uppercase tracking-widest ${
                        match.status === 'active' ? 'bg-rose-500/20 text-rose-600' :
                        match.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' :
                        'bg-white shadow-sm border border-border text-secondary'
                      }`}>
                        {match.status === 'active' ? '⚔️ LIVE DUEL' : match.status === 'completed' ? '✅ Selesai' : '⏳ Menunggu'}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Shield size={48} className="text-secondary mb-4" />
              <p className="text-secondary font-bold">Bracket belum tersedia</p>
              <p className="text-secondary text-xs mt-1">Dosen perlu memulai turnamen untuk melihat bracket</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // === TOURNAMENT LIST ===
  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  );

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-8 bg-slate-50">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Trophy size={24} className="text-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground">Class Tournament</h2>
              <p className="text-secondary text-xs">Turnamen kompetitif antar mahasiswa — Single Elimination</p>
            </div>
          </div>
          <button 
            onClick={onBack}
            className="px-4 py-2 bg-white shadow-sm border border-border hover:bg-white shadow-sm border border-border text-secondary hover:text-foreground rounded-xl text-xs font-bold transition flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Kembali ke Kelas
          </button>
        </div>

        {tournaments.length === 0 ? (
          <div className="text-center py-16 bg-white shadow-sm border border-border border border-border rounded-3xl">
            <Trophy size={48} className="text-secondary mx-auto mb-4" />
            <p className="font-bold text-secondary">Belum ada turnamen di kelas ini</p>
            <p className="text-secondary text-xs mt-1">Dosen akan membuat turnamen saat waktunya tiba</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tournaments.map(t => (
              <div key={t.id} className="bg-white shadow-sm border border-border border border-border rounded-2xl p-6 hover:border-border transition-all group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      t.status === 'completed' ? 'bg-emerald-500/20' : t.status === 'in_progress' ? 'bg-rose-500/20' : 'bg-primary-light'
                    }`}>
                      {t.status === 'completed' ? <CheckCircle size={24} className="text-emerald-600" /> :
                       t.status === 'in_progress' ? <Swords size={24} className="text-rose-600" /> :
                       <Users size={24} className="text-primary" />}
                    </div>
                    <div>
                      <h3 className="font-black text-foreground text-lg">{t.title}</h3>
                      <p className="text-secondary text-xs mt-0.5">
                        {t.player_count}/{t.max_players} pemain • oleh {t.dosen_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      t.status === 'completed' ? 'bg-emerald-500/20 text-emerald-600' :
                      t.status === 'in_progress' ? 'bg-rose-500/20 text-rose-600' :
                      'bg-primary-light text-primary'
                    }`}>
                      {t.status === 'completed' ? 'Selesai' : t.status === 'in_progress' ? 'Berlangsung' : 'Pendaftaran'}
                    </span>
                    <button 
                      onClick={() => fetchBracket(t.id)}
                      className="px-4 py-2 bg-white shadow-sm border border-border border border-border text-secondary hover:text-foreground hover:border-border rounded-xl text-xs font-bold transition"
                    >
                      {t.status === 'registration' ? 'Daftar & Lihat' : 'Lihat Bracket'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
