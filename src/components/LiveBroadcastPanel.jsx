import { useState, useEffect } from 'react';
import { Radio, Send, ThumbsUp, ThumbsDown, Navigation, Search, Cpu, Gamepad2, ShoppingBag, X, Users, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const QUICK_ACTIONS = [
  { id: 'assembly', label: 'Semua ke Assembly Lab', icon: Cpu, section: 'assembly', color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20' },
  { id: 'quiz', label: 'Semua ke Quiz Map', icon: Gamepad2, section: 'quiz', color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20' },
  { id: 'detective', label: 'Semua ke Component Detective', icon: Search, section: 'detective', color: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/20' },
  { id: 'shop', label: 'Semua ke Hardware Shop', icon: ShoppingBag, section: 'shop', color: 'from-rose-500 to-pink-600', shadow: 'shadow-rose-500/20' },
];

export default function LiveBroadcastPanel({ socket, isConnected, onlineCount, activeRoom }) {
  const [broadcastLog, setBroadcastLog] = useState([]);
  const [pollQuestion, setPollQuestion] = useState('');
  const [activePoll, setActivePoll] = useState(null);
  const [pollResults, setPollResults] = useState({ up: 0, down: 0, total: 0 });

  useEffect(() => {
    if (!socket) return;

    socket.on('poll:results', (data) => {
      setPollResults({ up: data.up, down: data.down, total: data.total });
    });

    return () => {
      socket.off('poll:results');
    };
  }, [socket]);

  const sendBroadcast = (action) => {
    if (!socket || !activeRoom) return;
    socket.emit('lecturer-action', {
      roomId: activeRoom.id,
      type: 'navigate',
      action: action.section,
      label: action.label,
    });
    setBroadcastLog(prev => [{ 
      id: Date.now(), 
      label: action.label, 
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      icon: '📢'
    }, ...prev].slice(0, 20));
  };

  const sendPoll = () => {
    if (!socket || !activeRoom || !pollQuestion.trim()) return;
    socket.emit('broadcast:poll', { roomId: activeRoom.id, question: pollQuestion.trim() });
    setActivePoll(pollQuestion.trim());
    setPollResults({ up: 0, down: 0, total: 0 });
    setBroadcastLog(prev => [{ id: Date.now(), label: `Poll: "${pollQuestion.trim()}"`, time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), icon: '📊' }, ...prev].slice(0, 20));
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
    <div className="h-full overflow-y-auto custom-scrollbar p-8 max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
            <Radio className="text-rose-500" size={28} /> Kendali Kelas
          </h2>
          <p className="text-secondary text-sm mt-1">Kirim aksi real-time ke semua layar mahasiswa</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-black uppercase tracking-wider ${isConnected ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            {isConnected ? 'Terhubung' : 'Terputus'}
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-black">
            <Users size={14} />
            {onlineCount} Online
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-3xl border border-border shadow-sm p-6 mb-6">
        <h3 className="text-xs font-black text-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
          <Navigation size={14} /> Navigasi Cepat
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {QUICK_ACTIONS.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => sendBroadcast(action)}
                disabled={!isConnected}
                className={`flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r ${action.color} text-foreground font-bold text-sm transition-all hover:scale-[1.02] active:scale-95 shadow-lg ${action.shadow} disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100`}
              >
                <Icon size={20} />
                {action.label}
                <Send size={14} className="ml-auto opacity-60" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Polling */}
      <div className="bg-white rounded-3xl border border-border shadow-sm p-6 mb-6">
        <h3 className="text-xs font-black text-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
          <ThumbsUp size={14} /> Polling Cepat
        </h3>

        {!activePoll ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={pollQuestion}
              onChange={e => setPollQuestion(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && sendPoll()}
              placeholder="Siapa yang sudah paham materi ini?"
              className="flex-1 bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2467ce] focus:ring-1 focus:ring-[#2467ce]/20 transition"
            />
            <button
              onClick={sendPoll}
              disabled={!isConnected || !pollQuestion.trim()}
              className="px-5 py-3 bg-[#2467ce] text-foreground rounded-xl font-bold text-sm hover:bg-[#1a4f9e] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
            >
              <Send size={16} /> Kirim
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
              <div>
                <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-1">Poll Aktif</p>
                <p className="text-sm font-bold text-indigo-900">{activePoll}</p>
              </div>
              <button onClick={closePoll} className="p-2 text-indigo-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                <X size={18} />
              </button>
            </div>

            {/* Results */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                <ThumbsUp className="mx-auto text-emerald-500 mb-2" size={28} />
                <p className="text-3xl font-black text-emerald-700">{pollResults.up}</p>
                <p className="text-xs font-bold text-emerald-600 mt-1">{upPercent}% Paham</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                <ThumbsDown className="mx-auto text-red-500 mb-2" size={28} />
                <p className="text-3xl font-black text-red-700">{pollResults.down}</p>
                <p className="text-xs font-bold text-red-600 mt-1">{downPercent}% Belum</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
              {pollResults.total > 0 && (
                <>
                  <div className="bg-emerald-500 transition-all duration-500 rounded-l-full" style={{ width: `${upPercent}%` }} />
                  <div className="bg-red-500 transition-all duration-500 rounded-r-full" style={{ width: `${downPercent}%` }} />
                </>
              )}
            </div>
            <p className="text-center text-xs text-secondary font-bold">{pollResults.total} dari {onlineCount} mahasiswa sudah menjawab</p>
          </div>
        )}
      </div>

      {/* Broadcast Log */}
      <div className="bg-white rounded-3xl border border-border shadow-sm p-6">
        <h3 className="text-xs font-black text-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
          <Clock size={14} /> Riwayat Broadcast
        </h3>
        {broadcastLog.length === 0 ? (
          <div className="text-center py-8 text-secondary text-sm">
            <AlertCircle className="mx-auto mb-2 text-foreground" size={24} />
            Belum ada aksi yang dikirim dalam sesi ini.
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
            {broadcastLog.map(log => (
              <div key={log.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="text-lg">{log.icon}</span>
                <span className="text-sm font-medium text-foreground flex-1">{log.label}</span>
                <span className="text-xs text-secondary font-bold">{log.time}</span>
                <CheckCircle2 size={14} className="text-emerald-500" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
