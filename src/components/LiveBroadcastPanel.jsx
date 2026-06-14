import { useState, useEffect } from 'react';
import {
  Radio, Send, ThumbsUp, ThumbsDown, Navigation,
  Search, Cpu, Gamepad2, ShoppingBag, X, Users,
  Clock, CheckCircle2, AlertCircle, Zap, BarChart2,
  MessageSquare
} from 'lucide-react';

const QUICK_ACTIONS = [
  { id: 'assembly',  label: 'Semua ke Assembly Lab',      icon: Cpu,        color: 'bg-emerald-500 hover:bg-emerald-600', shadow: 'shadow-emerald-500/20' },
  { id: 'quiz',      label: 'Semua ke Quiz Journey',          icon: Gamepad2,   color: 'bg-amber-500 hover:bg-amber-600',    shadow: 'shadow-amber-500/20' },
  { id: 'detective', label: 'Semua ke Component Detective', icon: Search,  color: 'bg-violet-500 hover:bg-violet-600',  shadow: 'shadow-violet-500/20' },
  { id: 'shop',      label: 'Semua ke Hardware Shop',     icon: ShoppingBag,color: 'bg-rose-500 hover:bg-rose-600',     shadow: 'shadow-rose-500/20' },
];

export default function LiveBroadcastPanel({ socket, isConnected, onlineCount, activeRoom }) {
  const [broadcastLog, setBroadcastLog] = useState([]);
  const [pollQuestion, setPollQuestion] = useState('');
  const [activePoll, setActivePoll] = useState(null);
  const [pollResults, setPollResults] = useState({ up: 0, down: 0, total: 0 });
  const [customMessage, setCustomMessage] = useState('');

  useEffect(() => {
    if (!socket) return;
    socket.on('poll:results', (data) => {
      setPollResults({ up: data.up, down: data.down, total: data.total });
    });
    return () => { socket.off('poll:results'); };
  }, [socket]);

  const addLog = (label, icon) => {
    setBroadcastLog(prev => [{
      id: Date.now(), label, icon,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    }, ...prev].slice(0, 20));
  };

  const sendBroadcast = (action) => {
    if (!socket || !activeRoom) return;
    socket.emit('lecturer-action', { roomId: activeRoom.id, type: 'navigate', action: action.section || action.id, label: action.label });
    addLog(action.label, '📢');
  };

  const sendCustomMessage = () => {
    if (!socket || !activeRoom || !customMessage.trim()) return;
    socket.emit('broadcast:start', { roomId: activeRoom.id, message: customMessage.trim() });
    addLog(`Pesan: "${customMessage.trim()}"`, '💬');
    setCustomMessage('');
  };

  const sendPoll = () => {
    if (!socket || !activeRoom || !pollQuestion.trim()) return;
    socket.emit('broadcast:poll', { roomId: activeRoom.id, question: pollQuestion.trim() });
    setActivePoll(pollQuestion.trim());
    setPollResults({ up: 0, down: 0, total: 0 });
    addLog(`Poll: "${pollQuestion.trim()}"`, '📊');
    setPollQuestion('');
  };

  const closePoll = () => {
    if (!socket || !activeRoom) return;
    socket.emit('broadcast:poll-close', { roomId: activeRoom.id });
    setActivePoll(null);
    setPollResults({ up: 0, down: 0, total: 0 });
  };

  const upPercent = pollResults.total > 0 ? Math.round((pollResults.up / pollResults.total) * 100) : 0;
  const downPercent = pollResults.total > 0 ? Math.round((pollResults.down / pollResults.total) * 100) : 0;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 max-w-4xl mx-auto pb-20 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center">
            <Radio size={20} className="text-rose-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Kendali Kelas</h2>
            <p className="text-xs text-secondary">Kirim aksi real-time ke semua layar mahasiswa</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${isConnected ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            {isConnected ? 'Terhubung' : 'Terputus'}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-soft border border-primary/20 text-primary text-xs font-semibold">
            <Users size={13} /> {onlineCount} Online
          </div>
        </div>
      </div>

      {/* Custom broadcast message */}
      <div className="bg-[var(--bg-surface)] rounded-2xl border border-border shadow-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare size={15} className="text-primary" />
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">Pesan Siaran</h3>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={customMessage}
            onChange={e => setCustomMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendCustomMessage()}
            placeholder="Tulis pesan notifikasi untuk semua mahasiswa..."
            className="flex-1 bg-slate-50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:bg-[var(--bg-surface)] transition-colors"
          />
          <button
            onClick={sendCustomMessage}
            disabled={!isConnected || !customMessage.trim()}
            className="px-4 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-emerald-sm"
          >
            <Send size={15} /> Kirim
          </button>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="bg-[var(--bg-surface)] rounded-2xl border border-border shadow-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Navigation size={15} className="text-secondary" />
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">Navigasi Cepat</h3>
          <span className="text-[10px] text-secondary ml-auto">Arahkan semua mahasiswa ke modul</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {QUICK_ACTIONS.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => sendBroadcast(action)}
                disabled={!isConnected}
                className={`flex items-center gap-3 p-3.5 rounded-xl ${action.color} text-white font-semibold text-sm transition-all hover:shadow-md active:scale-95 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100`}
              >
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                  <Icon size={16} />
                </div>
                <span className="flex-1 text-left">{action.label}</span>
                <Send size={13} className="opacity-60 shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Polling */}
      <div className="bg-[var(--bg-surface)] rounded-2xl border border-border shadow-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={15} className="text-secondary" />
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">Polling Cepat</h3>
        </div>

        {!activePoll ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={pollQuestion}
              onChange={e => setPollQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendPoll()}
              placeholder="Siapa yang sudah paham materi ini?"
              className="flex-1 bg-slate-50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:bg-[var(--bg-surface)] transition-colors"
            />
            <button
              onClick={sendPoll}
              disabled={!isConnected || !pollQuestion.trim()}
              className="px-4 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-emerald-sm"
            >
              <Zap size={15} /> Mulai
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Active poll banner */}
            <div className="flex items-start justify-between bg-primary-soft border border-primary/20 rounded-xl p-3.5">
              <div>
                <p className="text-[10px] font-semibold text-primary uppercase tracking-wide mb-0.5">Poll Aktif</p>
                <p className="text-sm font-medium text-foreground">{activePoll}</p>
              </div>
              <button onClick={closePoll} className="p-1.5 text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-3 shrink-0">
                <X size={16} />
              </button>
            </div>

            {/* Results */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <ThumbsUp size={22} className="mx-auto text-emerald-500 mb-2" />
                <p className="text-2xl font-bold text-emerald-700">{pollResults.up}</p>
                <p className="text-xs font-semibold text-emerald-600 mt-1">{upPercent}% Paham</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <ThumbsDown size={22} className="mx-auto text-red-400 mb-2" />
                <p className="text-2xl font-bold text-red-600">{pollResults.down}</p>
                <p className="text-xs font-semibold text-red-500 mt-1">{downPercent}% Belum</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                {pollResults.total > 0 && (
                  <>
                    <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${upPercent}%` }} />
                    <div className="bg-red-400 transition-all duration-500" style={{ width: `${downPercent}%` }} />
                  </>
                )}
              </div>
              <p className="text-center text-[11px] text-secondary font-medium">
                {pollResults.total} dari {onlineCount} mahasiswa sudah menjawab
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Broadcast Log */}
      <div className="bg-[var(--bg-surface)] rounded-2xl border border-border shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-secondary" />
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">Riwayat Sesi Ini</h3>
          </div>
          {broadcastLog.length > 0 && (
            <span className="text-[10px] bg-slate-100 text-secondary px-2 py-0.5 rounded-full font-semibold">{broadcastLog.length}</span>
          )}
        </div>

        {broadcastLog.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle size={24} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm text-secondary">Belum ada aksi yang dikirim</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {broadcastLog.map(log => (
              <div key={log.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <span className="text-base shrink-0">{log.icon}</span>
                <span className="text-sm text-foreground flex-1 truncate">{log.label}</span>
                <span className="text-[10px] text-secondary font-medium shrink-0">{log.time}</span>
                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
