import { useState, useEffect } from 'react';
import { useToast } from './Toast';
import { Trophy, Users, Shield, Play, Loader2, CheckCircle, Crown, Swords, MonitorPlay, Maximize2, Minimize2, X } from 'lucide-react';

export default function LecturerTournamentPanel({ roomId, token, apiUrl, socket }) {
  const toast = useToast();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [bracketData, setBracketData] = useState(null);
  const [activeTournament, setActiveTournament] = useState(null);
  const [isProjectorMode, setIsProjectorMode] = useState(false);

  const fetchTournaments = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/tournaments/room/${roomId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setTournaments(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchBracket = async (tId) => {
    try {
      const res = await fetch(`${apiUrl}/api/tournaments/${tId}/bracket`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBracketData(data);
        setActiveTournament(data.tournament);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchTournaments();
    if (socket) {
      socket.on('tournament:update', (data) => {
        fetchTournaments();
        if (activeTournament?.id === data.tournament_id) fetchBracket(data.tournament_id);
      });
      return () => socket.off('tournament:update');
    }
  }, [roomId, socket, activeTournament]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${apiUrl}/api/tournaments/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ room_id: roomId, title: newTitle, max_players: 16 })
      });
      if (res.ok) {
        setNewTitle('');
        fetchTournaments();
      } else {
        const errData = await res.json();
        toast.error(`Gagal membuat turnamen: ${errData.error || 'Server Error'}`);
      }
    } catch (err) { toast.error('Gagal terhubung ke server'); }
    finally { setCreating(false); }
  };

  const handleStartTournament = async (tId) => {
    if (!confirm('Mulai turnamen sekarang? Bracket akan di-generate.')) return;
    try {
      const res = await fetch(`${apiUrl}/api/tournaments/${tId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        fetchBracket(tId);
      } else {
        toast.error(data.error || 'Gagal memulai turnamen');
      }
    } catch (err) { toast.error('Gagal terhubung ke server'); }
  };

  const handleStartMatch = async (matchId) => {
    if (!confirm('Mulai duel ini?')) return;
    try {
      const res = await fetch(`${apiUrl}/api/tournaments/match/${matchId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) toast.error('Gagal memulai duel');
    } catch (err) { toast.error('Gagal terhubung ke server'); }
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin inline mr-2"/> Memuat...</div>;

  // === PROJECTOR MODE UI ===
  if (isProjectorMode && activeTournament && bracketData) {
    return (
      <div className="fixed inset-0 z-[9999] bg-muted text-foreground flex flex-col p-10 overflow-hidden animate-in fade-in duration-500">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-rose-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-rose-600/20">
              <Trophy size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight">{activeTournament.title}</h1>
              <p className="text-rose-600 font-black uppercase tracking-[0.2em] text-sm mt-1">Tournament Bracket — Single Elimination</p>
            </div>
          </div>
          <button 
            onClick={() => setIsProjectorMode(false)}
            className="p-4 bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all border border-border"
          >
            <Minimize2 size={24} className="text-secondary" />
          </button>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar flex items-center justify-center">
          <div className="flex gap-20 items-start min-w-max p-10">
            {(() => {
              const rounds = {};
              bracketData.matches.forEach(m => {
                if (!rounds[m.round]) rounds[m.round] = [];
                rounds[m.round].push(m);
              });
              const roundNames = { 1: 'Round 1', 2: 'Quarter Finals', 3: 'Semi Finals', 4: 'Grand Final' };
              return Object.keys(rounds).sort((a,b)=>a-b).map(roundNum => (
                <div key={roundNum} className="flex flex-col gap-10 min-w-[320px]">
                  <div className="text-center font-black text-sm text-secondary uppercase tracking-[0.3em]">{roundNames[roundNum] || `Round ${roundNum}`}</div>
                  {rounds[roundNum].map((match, mi) => (
                    <div key={mi} className={`bg-[var(--bg-surface)] border-2 rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-500 ${match.status === 'active' ? 'border-rose-500 scale-105 ring-8 ring-rose-500/10' : 'border-border'}`}>
                      <div className={`flex items-center gap-4 p-5 border-b border-border ${match.winner_id === match.player1_id ? 'bg-emerald-500/10' : ''}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${match.winner_id === match.player1_id ? 'bg-emerald-500 text-foreground' : 'bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 text-secondary'}`}>
                          {match.winner_id === match.player1_id ? <Crown size={20} /> : '1'}
                        </div>
                        <span className={`font-black text-lg flex-1 truncate ${match.player1_name ? 'text-foreground' : 'text-secondary'}`}>{match.player1_name || 'TBD'}</span>
                        <span className="font-black text-xl text-rose-500">{match.player1_score || 0}</span>
                      </div>
                      <div className={`flex items-center gap-4 p-5 ${match.winner_id === match.player2_id ? 'bg-emerald-500/10' : ''}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${match.winner_id === match.player2_id ? 'bg-emerald-500 text-foreground' : 'bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 text-secondary'}`}>
                          {match.winner_id === match.player2_id ? <Crown size={20} /> : '2'}
                        </div>
                        <span className={`font-black text-lg flex-1 truncate ${match.player2_name ? 'text-foreground' : 'text-secondary'}`}>{match.player2_name || 'TBD'}</span>
                        <span className="font-black text-xl text-rose-500">{match.player2_score || 0}</span>
                      </div>
                      {match.status === 'active' && (
                        <div className="bg-rose-600 p-2 text-center text-xs font-black uppercase tracking-widest animate-pulse">Live Duel</div>
                      )}
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center">
            <Trophy size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-foreground">Manajemen Turnamen</h2>
            <p className="text-secondary text-sm">Buat dan kelola turnamen kompetitif (Single Elimination)</p>
          </div>
        </div>
        {activeTournament && bracketData && (
          <button 
            onClick={() => setIsProjectorMode(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition"
          >
            <MonitorPlay size={18} /> Projector Mode
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CREATE & LIST */}
        <div className="space-y-6">
          <div className="bg-[var(--bg-surface)] rounded-3xl p-6 border border-border shadow-sm">
            <h3 className="font-bold mb-4">Buat Turnamen Baru</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <input 
                type="text" 
                placeholder="Nama Turnamen (Misi: UAS Battle)" 
                value={newTitle} 
                onChange={e => setNewTitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-border rounded-xl text-sm outline-none focus:border-rose-500 transition"
              />
              <button disabled={creating || !newTitle} className="w-full py-3 bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-500/20 disabled:opacity-50 flex justify-center items-center gap-2">
                {creating ? <Loader2 size={16} className="animate-spin" /> : <Trophy size={16} />}
                Create Tournament
              </button>
            </form>
          </div>

          <div className="bg-[var(--bg-surface)] rounded-3xl p-6 border border-border shadow-sm h-[400px] overflow-y-auto custom-scrollbar">
            <h3 className="font-bold mb-4">Daftar Turnamen</h3>
            <div className="space-y-3">
              {tournaments.map(t => (
                <div key={t.id} 
                  onClick={() => fetchBracket(t.id)}
                  className={`p-4 border rounded-xl cursor-pointer transition ${activeTournament?.id === t.id ? 'border-rose-500 bg-rose-50' : 'border-border hover:border-border dark:border-slate-700'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm truncate pr-2">{t.title}</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${t.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : t.status === 'in_progress' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                      {t.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-secondary">
                    <span className="flex items-center gap-1"><Users size={12}/> {t.player_count}/{t.max_players}</span>
                  </div>
                </div>
              ))}
              {tournaments.length === 0 && <p className="text-center text-sm text-secondary italic">Belum ada turnamen</p>}
            </div>
          </div>
        </div>

        {/* BRACKET VIEW */}
        <div className="lg:col-span-2">
          <div className="bg-[var(--bg-surface)] rounded-3xl border border-border shadow-sm h-full min-h-[600px] flex flex-col overflow-hidden">
            {!activeTournament ? (
              <div className="flex-1 flex flex-col items-center justify-center text-secondary p-8 text-center">
                <Shield size={48} className="text-gray-200 mb-4" />
                <p className="font-bold">Pilih turnamen untuk melihat bracket</p>
              </div>
            ) : (
              <>
                <div className="p-6 border-b border-border flex items-center justify-between bg-slate-50 dark:bg-slate-900 shrink-0">
                  <div>
                    <h3 className="font-black text-lg">{activeTournament.title}</h3>
                    <p className="text-xs text-secondary">{bracketData.participants.length} pemain terdaftar</p>
                  </div>
                  {activeTournament.status === 'registration' && (
                    <button onClick={() => handleStartTournament(activeTournament.id)} className="px-6 py-2 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition">
                      Tutup Pendaftaran & Generate Bracket
                    </button>
                  )}
                </div>
                
                <div className="flex-1 overflow-auto p-8 bg-[#f8fafc] custom-scrollbar">
                  {activeTournament.status === 'registration' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {bracketData.participants.map(p => (
                        <div key={p.id} className="bg-[var(--bg-surface)] border border-border p-4 rounded-xl flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center font-black text-secondary text-xs">{p.seed}</div>
                          <span className="font-bold text-sm truncate">{p.player_name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex gap-12 items-start min-w-max">
                      {(() => {
                        const rounds = {};
                        bracketData.matches.forEach(m => {
                          if (!rounds[m.round]) rounds[m.round] = [];
                          rounds[m.round].push(m);
                        });
                        return Object.keys(rounds).sort((a,b)=>a-b).map(roundNum => (
                          <div key={roundNum} className="flex flex-col gap-6 min-w-[260px]">
                            <div className="text-center font-black text-xs text-secondary uppercase tracking-widest">Round {roundNum}</div>
                            {rounds[roundNum].map((match, mi) => (
                              <div key={mi} className={`bg-[var(--bg-surface)] border rounded-2xl overflow-hidden shadow-sm ${match.status === 'active' ? 'border-rose-400 ring-4 ring-rose-500/10' : 'border-border'}`}>
                                <div className={`flex items-center gap-3 p-3 border-b border-gray-50 ${match.winner_id === match.player1_id ? 'bg-emerald-50' : ''}`}>
                                  <span className="font-bold text-sm truncate flex-1">{match.player1_name || 'TBD'}</span>
                                  <span className="font-black text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{match.player1_score || 0}</span>
                                </div>
                                <div className={`flex items-center gap-3 p-3 ${match.winner_id === match.player2_id ? 'bg-emerald-50' : ''}`}>
                                  <span className="font-bold text-sm truncate flex-1">{match.player2_name || 'TBD'}</span>
                                  <span className="font-black text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{match.player2_score || 0}</span>
                                </div>
                                
                                {match.status === 'pending' && match.player1_id && match.player2_id && (
                                  <div className="p-2 bg-slate-50 dark:bg-slate-900 border-t border-border">
                                    <button onClick={() => handleStartMatch(match.id)} className="w-full py-2 bg-indigo-500 text-white rounded-lg text-xs font-bold hover:bg-indigo-600 transition flex items-center justify-center gap-2" aria-label="Swords">
                                      <Swords size={14} /> Start Duel
                                    </button>
                                  </div>
                                )}
                                {match.status === 'active' && (
                                  <div className="p-2 bg-rose-50 text-rose-600 text-center text-[10px] font-black uppercase">Live Duel!</div>
                                )}
                              </div>
                            ))}
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
