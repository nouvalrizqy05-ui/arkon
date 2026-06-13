import { useState, useEffect } from 'react';
import { useToast } from './Toast';
import { Shield, Coins, Cpu, Activity, Gift, Loader2, AlertCircle, ChevronRight, X, Sparkles, ToggleLeft, ToggleRight } from 'lucide-react';

const SUB_TABS = [
  { id: 'coins', label: 'Reward Manager', icon: Coins },
  { id: 'builds', label: 'Pantau Build', icon: Cpu },
  { id: 'activity', label: 'Log Aktivitas', icon: Activity },
];

export default function GMPanel({ activeRoom, token, apiUrl }) {
  const toast = useToast();
  const [subTab, setSubTab] = useState('coins');
  const [students, setStudents] = useState([]);
  const [builds, setBuilds] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [bonusModal, setBonusModal] = useState(null); // { student }
  const [bonusAmount, setBonusAmount] = useState('');
  const [bonusReason, setBonusReason] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [doubleCoins, setDoubleCoins] = useState(false);

  useEffect(() => {
    if (activeRoom) {
      fetchStudents();
      fetchBuilds();
      fetchActivity();
      setDoubleCoins(activeRoom.double_coins_active || false);
    }
  }, [activeRoom]);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/gm/students/${activeRoom.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setStudents(await res.json());
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const fetchBuilds = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/gm/builds/${activeRoom.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setBuilds(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchActivity = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/gm/activity/${activeRoom.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setActivityFeed(await res.json());
    } catch (err) { console.error(err); }
  };

  const sendBonus = async () => {
    if (!bonusModal || !bonusAmount || !bonusReason.trim()) return;
    const amount = parseInt(bonusAmount);
    if (isNaN(amount) || amount <= 0 || amount > 1000) return toast.warning('Jumlah harus antara 1 - 1000');
    
    setIsSending(true);
    try {
      const res = await fetch(`${apiUrl}/api/gm/bonus-coins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ student_id: bonusModal.student.id, amount, reason: bonusReason.trim(), room_id: activeRoom.id })
      });
      if (res.ok) {
        setBonusModal(null);
        setBonusAmount('');
        setBonusReason('');
        fetchStudents();
        fetchActivity();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Gagal memberi bonus');
      }
    } catch { toast.error('Koneksi ke server gagal'); }
    finally { setIsSending(false); }
  };

  const toggleDoubleCoins = async () => {
    const newVal = !doubleCoins;
    try {
      const res = await fetch(`${apiUrl}/api/rooms/${activeRoom.id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ double_coins_active: newVal })
      });
      if (res.ok) setDoubleCoins(newVal);
    } catch { toast.error('Gagal memperbarui pengaturan'); }
  };

  const parseComponents = (raw) => {
    try { return typeof raw === 'string' ? JSON.parse(raw) : raw; }
    catch { return {}; }
  };

  const parseBenchmark = (raw) => {
    try { return typeof raw === 'string' ? JSON.parse(raw) : raw; }
    catch { return {}; }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-8 max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
            <Shield className="text-yellow-500" size={28} /> Manajemen Kelas
          </h2>
          <p className="text-secondary text-sm mt-1">Pantau progress belajar dan kelola reward kelas</p>
        </div>

        {/* Double Coins Toggle */}
        <button
          onClick={toggleDoubleCoins}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border font-bold text-xs uppercase tracking-wider transition-all ${doubleCoins ? 'bg-amber-50 dark:bg-amber-500/20 border-amber-300 dark:border-amber-500/50 text-amber-700 dark:text-amber-400 shadow-md shadow-amber-200/50' : 'bg-slate-50 dark:bg-slate-900 border-border dark:border-slate-800 text-secondary hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          {doubleCoins ? <ToggleRight size={18} className="text-amber-500" /> : <ToggleLeft size={18} />}
          {doubleCoins ? (
            <span className="flex items-center gap-1"><Sparkles size={12} /> 2× Koin Aktif!</span>
          ) : '2× Koin Event'}
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 bg-[var(--bg-surface)] p-1.5 rounded-2xl border border-border dark:border-slate-800 shadow-sm mb-6 w-fit">
        {SUB_TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${subTab === tab.id ? 'bg-primary text-white shadow-md' : 'text-secondary hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Sub-tab: Koin Manager */}
      {subTab === 'coins' && (
        <div className="bg-[var(--bg-surface)] rounded-3xl border border-border dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-foreground">Saldo Koin Mahasiswa</h3>
            <span className="text-[10px] ml-auto bg-slate-200 dark:bg-slate-800 text-secondary px-2 py-1 rounded-full font-bold">{students.length} mahasiswa</span>
          </div>
          
          {isLoading ? (
            <div className="p-10 flex items-center justify-center text-secondary"><Loader2 className="animate-spin mr-2" size={20} /> Memuat...</div>
          ) : students.length === 0 ? (
            <div className="p-10 text-center text-secondary">
              <AlertCircle className="mx-auto mb-2 text-foreground" size={24} />
              Belum ada mahasiswa di kelas ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 text-secondary text-xs uppercase tracking-wider">
                    <th className="p-4 border-b border-border dark:border-slate-800 font-semibold">Nama</th>
                    <th className="p-4 border-b border-border dark:border-slate-800 font-semibold">NIM</th>
                    <th className="p-4 border-b border-border dark:border-slate-800 font-semibold text-center">Koin</th>
                    <th className="p-4 border-b border-border dark:border-slate-800 font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id} className="hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors">
                      <td className="p-4 border-b border-border dark:border-slate-800 font-medium text-foreground">{s.full_name}</td>
                      <td className="p-4 border-b border-border dark:border-slate-800 text-secondary text-sm font-mono">{s.nim}</td>
                      <td className="p-4 border-b border-border dark:border-slate-800 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 font-black text-sm">
                          🪙 {s.coins}
                        </span>
                      </td>
                      <td className="p-4 border-b border-border dark:border-slate-800 text-center">
                        <button
                          onClick={() => setBonusModal({ student: s })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all active:scale-95"
                        >
                          <Gift size={12} /> Beri Bonus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Sub-tab: Student Builds */}
      {subTab === 'builds' && (
        <div className="space-y-4">
          {builds.length === 0 ? (
            <div className="bg-[var(--bg-surface)] rounded-3xl border border-dashed border-border dark:border-slate-700 p-16 text-center">
              <Cpu className="mx-auto text-foreground mb-3" size={32} />
              <h3 className="font-bold text-foreground mb-1">Belum Ada Build</h3>
              <p className="text-secondary text-sm">Mahasiswa belum mempublikasikan build PC ke Showroom.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {builds.map(build => {
                const components = parseComponents(build.components);
                const benchmark = parseBenchmark(build.benchmark_scores);
                return (
                  <div key={build.id} className="bg-[var(--bg-surface)] rounded-2xl border border-border dark:border-slate-800 shadow-sm p-5 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-foreground">{build.build_name}</h4>
                        <p className="text-xs text-secondary font-medium">oleh {build.builder_name}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${build.is_compatible ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'}`}>
                        {build.is_compatible ? '✓ Compatible' : '✗ Incompatible'}
                      </span>
                    </div>
                    
                    {/* Component List */}
                    <div className="space-y-1 mb-3">
                      {Object.entries(components).filter(([, v]) => v).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-2 text-xs">
                          <span className="w-16 text-secondary font-medium uppercase">{key}:</span>
                          <span className="text-foreground font-medium truncate">{typeof val === 'object' ? val.name || val.id : val}</span>
                        </div>
                      ))}
                    </div>

                    {/* Benchmark */}
                    {benchmark && Object.keys(benchmark).length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {Object.entries(benchmark).map(([key, val]) => (
                          <span key={key} className="px-2 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 rounded-lg text-[10px] font-bold uppercase">
                            {key}: {val}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-[10px] text-secondary mt-3">
                      {new Date(build.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Sub-tab: Activity Feed */}
      {subTab === 'activity' && (
        <div className="bg-[var(--bg-surface)] rounded-3xl border border-border dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-600" />
            <h3 className="font-bold text-foreground">Aktivitas Gamifikasi Terbaru</h3>
          </div>

          {activityFeed.length === 0 ? (
            <div className="p-10 text-center text-secondary">
              <AlertCircle className="mx-auto mb-2 text-foreground" size={24} />
              Belum ada aktivitas koin di kelas ini.
            </div>
          ) : (
            <div className="divide-y divide-border dark:divide-slate-800 max-h-[500px] overflow-y-auto custom-scrollbar">
              {activityFeed.map((item, i) => (
                <div key={i} className="px-6 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${item.amount > 0 ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400'}`}>
                    {item.amount > 0 ? '+' : ''}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      <span className="font-bold">{item.student_name}</span> — {item.reason}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-sm font-black ${item.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {item.amount > 0 ? '+' : ''}{item.amount} 🪙
                    </span>
                    <p className="text-[10px] text-secondary">
                      {new Date(item.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bonus Modal */}
      {bonusModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-surface)] rounded-3xl shadow-2xl p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                <Gift className="text-emerald-500" size={20} /> Beri Koin Bonus
              </h3>
              <button onClick={() => setBonusModal(null)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-secondary transition">
                <X size={16} />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 mb-4">
              <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">Mahasiswa</p>
              <p className="font-bold text-foreground">{bonusModal.student.full_name}</p>
              <p className="text-xs text-secondary">Saldo saat ini: 🪙 {bonusModal.student.coins}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-foreground mb-1">Jumlah Koin (max 1000)</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={bonusAmount}
                  onChange={e => setBonusAmount(e.target.value)}
                  placeholder="100"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-[var(--bg-surface)] text-foreground focus:border-[#2467ce] focus:ring-1 focus:ring-[#2467ce]/20 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-foreground mb-1">Alasan</label>
                <input
                  type="text"
                  value={bonusReason}
                  onChange={e => setBonusReason(e.target.value)}
                  placeholder="Partisipasi aktif di kelas"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-[var(--bg-surface)] text-foreground focus:border-[#2467ce] focus:ring-1 focus:ring-[#2467ce]/20 outline-none transition"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setBonusModal(null)} className="px-5 py-2.5 rounded-xl font-bold text-secondary hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                Batal
              </button>
              <button
                onClick={sendBonus}
                disabled={isSending || !bonusAmount || !bonusReason.trim()}
                className="px-5 py-2.5 rounded-xl font-bold bg-emerald-600 text-foreground hover:bg-emerald-700 transition disabled:opacity-40 flex items-center gap-2"
              >
                {isSending ? <Loader2 className="animate-spin" size={16} /> : <Gift size={16} />}
                {isSending ? 'Mengirim...' : 'Kirim Bonus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
