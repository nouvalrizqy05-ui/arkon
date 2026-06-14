import { useRef, useState, useEffect } from 'react';
import { TerminalSquare, BookOpen, Info, Zap, ChevronLeft, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BossRaid from '../components/BossRaid';
import ErrorBoundary from '../components/ErrorBoundary';

function CpuSimulatorAdmin() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const token = localStorage.getItem('auth_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      try {
        const res = await fetch(`${API_URL}/api/simulator/logs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch (err) {
        console.error('Failed to fetch simulator logs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 bg-slate-50 dark:bg-slate-950">
      <header className="h-[70px] bg-slate-50 dark:bg-slate-950 flex items-center justify-between px-8 border-b border-border dark:border-slate-800 shrink-0">
        <div>
          <h1 className="text-xl font-black text-foreground">Manajemen Modul CPU</h1>
          <p className="text-secondary text-xs">Kelola materi arsitektur CPU dan set instruksi.</p>
        </div>
        <button className="bg-primary text-white font-bold py-2.5 px-5 rounded-xl hover:bg-primary-hover shadow-md flex items-center gap-2">
          + Tambah Modul Instruksi
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 mt-6">
        <div className="bg-[var(--bg-surface)] rounded-2xl border border-border dark:border-slate-800 shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-foreground">Total Eksekusi Sukses</h3>
            <Zap size={20} className="text-emerald-500" />
          </div>
          <p className="text-3xl font-black text-emerald-600">342</p>
        </div>
        <div className="bg-[var(--bg-surface)] rounded-2xl border border-border dark:border-slate-800 shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-foreground">Modul ISA Aktif</h3>
            <BookOpen size={20} className="text-indigo-500" />
          </div>
          <p className="text-3xl font-black text-indigo-600">3 <span className="text-sm font-medium text-secondary">Kategori</span></p>
        </div>
        <div className="bg-[var(--bg-surface)] rounded-2xl border border-border dark:border-slate-800 shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-foreground">Rata-rata Waktu</h3>
            <TerminalSquare size={20} className="text-amber-500" />
          </div>
          <p className="text-3xl font-black text-amber-500">4.5m</p>
        </div>
      </div>

      <h3 className="text-lg font-black text-foreground mb-4">Log Eksekusi Mahasiswa Terbaru</h3>
      <div className="bg-[var(--bg-surface)] rounded-2xl border border-border dark:border-slate-800 shadow-sm overflow-hidden mb-8">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-border dark:border-slate-800">
              <th className="p-4 text-xs font-bold text-secondary uppercase">Mahasiswa</th>
              <th className="p-4 text-xs font-bold text-secondary uppercase">Program/Skenario</th>
              <th className="p-4 text-xs font-bold text-secondary uppercase">Status</th>
              <th className="p-4 text-xs font-bold text-secondary uppercase">Cycle Count</th>
              <th className="p-4 text-xs font-bold text-secondary uppercase text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-secondary">Memuat log...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-secondary">Belum ada log eksekusi.</td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} className="border-b border-border dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 font-bold text-foreground text-sm">{log.student_name}</td>
                  <td className="p-4 text-secondary text-sm font-mono">{log.program_name || 'Custom Code'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-full ${log.status === 'HALTED' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="p-4 text-foreground font-bold">{log.cycle_count}</td>
                  <td className="p-4 text-center">
                    <button className="px-3 py-1 bg-[var(--bg-surface)] border border-border dark:border-slate-700 rounded-lg text-xs font-bold text-foreground hover:bg-slate-50 dark:hover:bg-slate-800">Lihat Dump</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CpuSimulator({ embeddedMode = false, onCoinsEarned, userRole }) {
  const simulatorRef = useRef(null);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [coins, setCoins] = useState(0);
  const [isRaidOpen, setIsRaidOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('isa');
  const [rewardToast, setRewardToast] = useState(null);
  const executionCountRef = useRef(0);
  const MAX_REWARDED_EXECUTIONS = 5;
  const REWARD_PER_EXECUTION = 50;

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const fetchCoins = async (userId, userToken) => {
    try {
      const res = await fetch(`${API_URL}/api/coins/${userId}`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      const data = await res.json();
      if (data.coins !== undefined) setCoins(data.coins);
    } catch (err) {
      console.error('Fetch coins error:', err);
    }
  };

  const handleSimulatorReward = async () => {
    const uid = localStorage.getItem('user_id');
    const utoken = localStorage.getItem('auth_token');
    if (!uid || !utoken) return;

    executionCountRef.current += 1;
    if (executionCountRef.current > MAX_REWARDED_EXECUTIONS) {
      setRewardToast({ msg: 'Batas reward sesi tercapai (5x). Tetap semangat berlatih!', type: 'info' });
      setTimeout(() => setRewardToast(null), 3000);
      return;
    }

    try {
      const earnRes = await fetch(`${API_URL}/api/coins/earn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${utoken}` },
        body: JSON.stringify({ amount: REWARD_PER_EXECUTION, reason: `CPU Simulator — Execution #${executionCountRef.current}` })
      });
      if (!earnRes.ok) {
        const errData = await earnRes.json().catch(() => ({}));
        setRewardToast({ msg: `Gagal klaim koin: ${errData.error || earnRes.status}`, type: 'info' });
        setTimeout(() => setRewardToast(null), 3000);
        return;
      }
      const earnData = await earnRes.json();
      if (earnData.coins !== undefined) setCoins(earnData.coins);
      if (onCoinsEarned) onCoinsEarned();
      window.dispatchEvent(new Event('coinUpdate'));
      setRewardToast({ msg: `+${REWARD_PER_EXECUTION} Koin! Total: ${earnData.coins?.toLocaleString() ?? ''}  (${executionCountRef.current}/${MAX_REWARDED_EXECUTIONS} sesi ini)`, type: 'success' });
      setTimeout(() => setRewardToast(null), 3500);
    } catch (err) {
      console.error('Reward coin error:', err);
    }
  };

  useEffect(() => {
    const userRole = localStorage.getItem('user_role');
    const userId = localStorage.getItem('user_id');
    const storedToken = localStorage.getItem('auth_token');

    if (userRole && userId && storedToken) {
      const userData = { id: userId, role: userRole };
      setUser(userData);
      setToken(storedToken);
      fetchCoins(userId, storedToken);
    }

    const handleUpdate = () => {
      const uid = localStorage.getItem('user_id');
      const utoken = localStorage.getItem('auth_token');
      if (uid && utoken) fetchCoins(uid, utoken);
    };
    window.addEventListener('coinUpdate', handleUpdate);

    const handleMessage = (event) => {
      if (event.data && event.data.type === 'ARKON_SIMULATION_RESULT') {
        const payload = event.data.payload || {};
        const uid = localStorage.getItem('user_id');
        const utoken = localStorage.getItem('auth_token');
        if (uid && utoken) {
          fetch(`${API_URL}/api/simulator/logs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${utoken}` },
            body: JSON.stringify({
              student_id: uid,
              program_name: payload.programName || 'Custom Program',
              status: payload.status || 'UNKNOWN',
              cycle_count: payload.cycleCount || 0,
              memory_dump: payload.memoryDump || null
            })
          }).catch(console.error);
        }

        if (payload.status === 'HALTED') {
          handleSimulatorReward();
        }
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('coinUpdate', handleUpdate);
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const INSTRUCTION_GROUPS = [
    {
      category: "Control Flow",
      items: [
        { cmd: "NOP", desc: "No Operation, lanjut ke instruksi berikutnya.", bin: "00000000" },
        { cmd: "HLT", desc: "Hentikan eksekusi program.", bin: "00000001" },
        { cmd: "JMP X", desc: "Lompat (Unconditional jump) ke lokasi X.", bin: "00000010" },
        { cmd: "JZ X", desc: "Jump on Zero: jika Flag Z set, lompat ke X.", bin: "00000011" },
        { cmd: "JNZ X", desc: "Jump on Not Zero: jika Flag Z clear, lompat ke X.", bin: "00000100" },
        { cmd: "JN X", desc: "Jump on Negative: jika Flag N set, lompat ke X.", bin: "00000101" },
        { cmd: "JNN X", desc: "Jump on Not Negative: jika Flag N clear, lompat ke X.", bin: "00000110" },
      ]
    },
    {
      category: "Data Flow",
      items: [
        { cmd: "LOD X / #X", desc: "Muat nilai dari lokasi X (atau angka #X) ke Akumulator.", bin: "00000111" },
        { cmd: "STO X", desc: "Simpan nilai Akumulator ke lokasi memori X.", bin: "00001000" },
      ]
    },
    {
      category: "Arithmetic-Logic",
      items: [
        { cmd: "ADD X / #X", desc: "Tambah nilai X / #X ke Akumulator. Flag diperbarui.", bin: "00001001" },
        { cmd: "SUB X / #X", desc: "Kurangi Akumulator dengan X / #X. Flag diperbarui.", bin: "00001010" },
        { cmd: "MUL X / #X", desc: "Kali Akumulator dengan X / #X. Flag diperbarui.", bin: "00001011" },
        { cmd: "DIV X / #X", desc: "Bagi Akumulator dengan X / #X. Flag diperbarui.", bin: "00001100" },
        { cmd: "AND X / #X", desc: "Operasi Bitwise AND antara Akumulator dan X / #X.", bin: "00001101" },
        { cmd: "CMP X / #X", desc: "Kurangi Akumulator dengan X / #X untuk update Flag saja.", bin: "00001110" },
        { cmd: "NOT X / #X", desc: "Bitwise NOT dari X / #X. Hasil masuk ke Akumulator.", bin: "00001111" },
      ]
    }
  ];

  if (userRole === 'dosen') return <CpuSimulatorAdmin />;

  return (
    <div className={`flex flex-col ${embeddedMode ? 'h-full' : 'h-screen'} overflow-hidden bg-slate-50 dark:bg-slate-950`}>
      {!embeddedMode && <Navbar subtext="CPU SIMULATOR" hideDarkMode={true} hideAuth={true} />}

      {user && user.role === 'mahasiswa' && (
        <BossRaid
          isOpen={isRaidOpen}
          studentId={user.id}
          token={token}
          apiUrl={API_URL}
          onComplete={() => { window.dispatchEvent(new Event('coinUpdate')); }}
          onClose={() => setIsRaidOpen(false)}
        />
      )}

      <div className={`flex flex-col md:flex-row flex-1 overflow-hidden p-6 ${embeddedMode ? 'pt-2' : 'pt-[90px]'} pb-6 gap-6 max-w-[1600px] mx-auto w-full relative z-0`}>
        <div className="flex-[2] bg-[#020617] rounded-3xl shadow-2xl border border-border dark:border-slate-800 overflow-hidden flex flex-col relative h-full">
          <div className="h-14 bg-[var(--bg-surface)] shadow-sm border-b border-border dark:border-slate-800 flex items-center justify-between px-6 gap-2 shrink-0 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <Link to="/workspace" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm border border-border dark:border-slate-700 rounded-xl transition-all text-secondary hover:text-foreground">
                <ChevronLeft size={20} />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/30">
                  <Cpu className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-black text-sm text-foreground block leading-none">System Engine v1.0</span>
                  <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Active & Debugging</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-700 rounded-xl">
                <span className="text-xs font-black text-amber-600">🪙 {coins.toLocaleString()}</span>
              </div>
              {user && user.role === 'mahasiswa' && !isRaidOpen && (
                <button
                  onClick={() => setIsRaidOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-black rounded-xl hover:scale-105 transition-all shadow-lg shadow-red-600/40 flex items-center gap-2 group border border-red-500/50"
                >
                  <Zap className="w-4 h-4 group-hover:animate-pulse" />
                  <span className="text-[10px] tracking-tight">BOSS RAID</span>
                </button>
              )}
            </div>
          </div>

          <iframe
            ref={simulatorRef}
            src="/simulator/index.html"
            className="w-full h-full border-none flex-1"
            title="CPU Visual Simulator"
          />

          {rewardToast && (
            <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-10 px-5 py-3 rounded-2xl font-bold text-sm shadow-2xl backdrop-blur-md transition-all animate-bounce ${rewardToast.type === 'success'
                ? 'bg-emerald-500/90 text-white shadow-emerald-500/40'
                : 'bg-amber-500/90 text-white shadow-amber-500/40'
              }`}>
              {rewardToast.type === 'success' ? '🪙' : 'ℹ️'} {rewardToast.msg}
            </div>
          )}
        </div>

        <div className="w-full md:w-[420px] bg-[var(--bg-surface)] rounded-3xl shadow-2xl border border-border dark:border-slate-800 flex flex-col overflow-hidden shrink-0">
          <div className="h-14 bg-slate-50 dark:bg-slate-900 border-b border-border dark:border-slate-800 flex p-1.5 gap-1 shrink-0">
            <button
              onClick={() => setActiveTab('isa')}
              className={`flex-1 rounded-2xl flex items-center justify-center gap-2 transition-all font-black text-[10px] uppercase tracking-widest ${activeTab === 'isa' ? 'bg-[var(--bg-surface)] shadow-sm text-primary border border-border dark:border-slate-700' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <BookOpen size={16} />
              Instruction Set
            </button>
            <button
              onClick={() => setActiveTab('debugger')}
              className={`flex-1 rounded-2xl flex items-center justify-center gap-2 transition-all font-black text-[10px] uppercase tracking-widest ${activeTab === 'debugger' ? 'bg-[#080C1A] shadow-lg text-emerald-600' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <TerminalSquare size={16} />
              Visual Debugger
            </button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            {activeTab === 'debugger' ? (
              <div className="flex-1 flex flex-col bg-[#080C1A] overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar font-mono text-[11px] space-y-6">
                  <div>
                    <h4 className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                      CPU Registers
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'PC', val: '0x004A', desc: 'Program Counter' },
                        { label: 'ACC', val: '0x00FF', desc: 'Accumulator' },
                        { label: 'MAR', val: '0x00E2', desc: 'Memory Addr' },
                        { label: 'MDR', val: '0x1011', desc: 'Memory Data' },
                        { label: 'IR', val: '0x07', desc: 'Instruction' },
                        { label: 'SP', val: '0x01FF', desc: 'Stack Pointer' }
                      ].map((reg, i) => (
                        <div key={i} className="bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-700 p-3 rounded-xl group hover:border-emerald-500/30 transition-colors">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-emerald-600 font-black">{reg.label}</span>
                            <span className="text-foreground font-bold">{reg.val}</span>
                          </div>
                          <p className="text-[8px] text-secondary uppercase font-black">{reg.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] mb-4">ALU Flags</h4>
                    <div className="flex gap-2">
                      {['Z (Zero)', 'N (Neg)', 'C (Carry)', 'V (Ovf)'].map((f, i) => (
                        <div key={i} className={`flex-1 py-2 rounded-lg border text-center font-black text-[9px] transition-all ${i === 0 ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.15)]' : 'bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-700 text-secondary'}`}>
                          {f.charAt(0)}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-[9px] font-black text-secondary uppercase tracking-[0.2em]">Memory Dump</h4>
                      <span className="text-[9px] text-emerald-600/60 font-black">0x0000 - 0x00FF</span>
                    </div>
                    <div className="bg-black/40 border border-border dark:border-slate-800 rounded-2xl p-4 space-y-1.5">
                      {[
                        { addr: '0000', hex: '07 00 0A 02 0F FF 12 00' },
                        { addr: '0008', hex: '00 00 00 00 00 00 00 00' },
                        { addr: '0010', hex: '41 52 4B 4F 4E 20 41 49' },
                        { addr: '0018', hex: '00 00 00 00 FF FF FF FF' }
                      ].map((row, i) => (
                        <div key={i} className="flex gap-4">
                          <span className="text-secondary font-bold">{row.addr}</span>
                          <span className="text-secondary tracking-wider hover:text-emerald-600 transition-colors cursor-default">{row.hex}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4">
                    <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-2">Cycle Analysis</p>
                    <p className="text-secondary leading-relaxed italic">"CPU sedang memuat instruksi 0x07 (LOD) dari alamat 0x0000 ke Akumulator..."</p>
                  </div>
                </div>
                <div className="p-4 border-t border-border dark:border-slate-800 flex items-center justify-between bg-black/20">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[9px] font-black text-secondary uppercase">Ilustrasi Register — lihat iframe ↑</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-surface)]">
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  <div className="bg-indigo-50 dark:bg-indigo-950/20 rounded-2xl p-4 mb-6 border border-indigo-100 dark:border-indigo-900/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-primary" />
                      <h4 className="font-black text-xs text-indigo-900 dark:text-indigo-200 uppercase">Addressing Modes</h4>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-wider mb-1">Immediate (#X)</p>
                        <p className="text-[10px] text-indigo-700 dark:text-indigo-400 leading-tight">Gunakan simbol # untuk nilai langsung (-128 s/d 127).</p>
                      </div>
                      <div className="pt-1 border-t border-indigo-100 dark:border-indigo-900/50">
                        <p className="text-[10px] font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-wider mb-1">Direct (X)</p>
                        <p className="text-[10px] text-indigo-700 dark:text-indigo-400 leading-tight">Tanpa # merujuk ke alamat RAM (0-254).</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {INSTRUCTION_GROUPS.map((group, gIdx) => (
                      <div key={gIdx}>
                        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <span className="w-1 h-3 bg-primary rounded-full"></span>
                          {group.category}
                        </h4>
                        <div className="space-y-4">
                          {group.items.map((item, idx) => (
                            <div key={idx} className="group">
                              <div className="flex items-center justify-between mb-1">
                                <code className="text-xs font-black bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-primary group-hover:bg-primary group-hover:text-white transition-colors">{item.cmd}</code>
                                <span className="text-[9px] font-mono text-slate-300">{item.bin}</span>
                              </div>
                              <p className="text-[11px] text-secondary leading-tight">{item.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <div className="flex items-center gap-2 mb-4">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <h4 className="font-black text-xs text-foreground uppercase">Instruction Cycle</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {["Fetch", "Decode", "Execute"].map((step, i) => (
                        <div key={i} className="bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-border dark:border-slate-800 text-center">
                          <p className="text-[9px] font-black text-foreground uppercase">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-border">
                  <p className="text-[9px] text-center text-slate-400 font-black uppercase tracking-widest">ARKON System v1.0</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function CpuSimulatorWithErrorBoundary(props) {
  return (
    <ErrorBoundary name="CPU Simulator">
      <CpuSimulator {...props} />
    </ErrorBoundary>
  );
}