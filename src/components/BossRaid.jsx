import React, { useState, useEffect, useRef } from 'react';
import { Zap, Timer, Trophy, AlertTriangle, ShieldCheck, Sword, Users, Flame, Minimize2, Maximize2, XCircle, CheckCircle } from 'lucide-react';

const CHALLENGES = [
  { 
    id: 'addition', 
    title: 'Operasi Dasar', 
    mission: 'Tambahkan angka 15 dan 25, simpan hasilnya di alamat RAM 8, lalu HALT.', 
    goal: 'Hasil 40 di RAM 8',
    validate: (code) => {
      const c = code.toUpperCase();
      return c.includes('LOAD #15') && c.includes('ADD #25') && c.includes('STORE 8') && c.includes('HALT');
    },
    errorHint: 'Pastikan Anda menggunakan LOAD #15, ADD #25, STORE 8, dan diakhiri dengan HALT.'
  },
  { 
    id: 'subtraction', 
    title: 'Pengurangan Memori', 
    mission: 'Muat nilai dari RAM 0, kurangi dengan angka 10, simpan di RAM 1, lalu HALT.', 
    goal: 'RAM 1 = RAM 0 - 10',
    validate: (code) => {
      const c = code.toUpperCase();
      return c.includes('LOAD 0') && c.includes('SUB #10') && c.includes('STORE 1') && c.includes('HALT');
    },
    errorHint: 'Gunakan LOAD 0 (tanpa # karena dari alamat), SUB #10, dan simpan di STORE 1.'
  },
  { 
    id: 'loop_init', 
    title: 'Inisialisasi Loop', 
    mission: 'Isi RAM alamat 0 sampai 2 dengan angka 0 menggunakan instruksi STORE.', 
    goal: 'RAM 0, 1, 2 = 0',
    validate: (code) => {
      const c = code.toUpperCase();
      return c.includes('LOAD #0') && c.includes('STORE 0') && c.includes('STORE 1') && c.includes('STORE 2');
    },
    errorHint: 'Muat angka 0 ke Akumulator dulu, lalu gunakan STORE tiga kali.'
  }
];

export default function BossRaid({ isOpen, studentId, token, apiUrl, onComplete, onClose }) {
  const [challenge, setChallenge] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 menit
  const [status, setStatus] = useState('idle'); // idle, active, validating, success, failed
  const [feedback, setFeedback] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    if (isOpen && status === 'idle') {
      const randomChallenge = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
      setChallenge(randomChallenge);
      setStatus('active');
      setTimeLeft(600);
    }
  }, [isOpen, status]);

  useEffect(() => {
    if (status === 'active' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
      return () => clearInterval(timerRef.current);
    } else if (timeLeft === 0 && status === 'active') {
      setStatus('failed');
      setFeedback('Waktu habis! Boss Raid gagal.');
    }
  }, [status, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const validateCode = async (userCode) => {
    if (!userCode) return;
    setStatus('validating');
    
    // Simulate thinking delay
    setTimeout(async () => {
      const isCorrect = challenge.validate(userCode);
      
      if (isCorrect) {
        setStatus('success');
        setFeedback('Sempurna! Algoritma Anda memenuhi standar Arsitektur Komputer.');
        try {
          // Grant rewards
          await fetch(`${apiUrl}/api/coins/earn`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ student_id: studentId, amount: 2000, reason: 'BOSS RAID Victory: ' + challenge.title })
          });
          if (onComplete) onComplete();
        } catch (err) {
          console.error('Reward error:', err);
        }
      } else {
        setStatus('failed');
        setFeedback(challenge.errorHint || 'Kode Anda belum memenuhi kriteria misi. Periksa kembali urutan instruksinya!');
      }
    }, 1500);
  };

  const closeRaid = () => {
    setStatus('idle');
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-[99999] bg-red-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 cursor-pointer hover:scale-105 transition-all animate-bounce" onClick={() => setIsMinimized(false)}>
        <Zap className="w-5 h-5" />
        <div>
           <p className="text-[10px] font-black uppercase opacity-60">Raid Active</p>
           <p className="text-sm font-black">{formatTime(timeLeft)}</p>
        </div>
        <Maximize2 size={18} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className={`relative w-[550px] max-w-full bg-[var(--bg-surface)] border-2 rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-500 max-h-[90vh] flex flex-col ${
        status === 'success' ? 'border-emerald-500 shadow-emerald-500/20' : 
        status === 'failed' ? 'border-red-500 shadow-red-500/20' : 'border-red-500/30'
      }`}>
        
        {/* Header Decor */}
        <div className={`h-2 w-full shrink-0 flex items-center justify-end px-4 ${
          status === 'success' ? 'bg-emerald-500' : 
          status === 'failed' ? 'bg-red-500' : 'bg-gradient-to-r from-red-600 via-rose-600 to-red-600 animate-pulse'
        }`}>
          {status === 'active' && (
             <button onClick={() => setIsMinimized(true)} className="text-secondary hover:text-foreground transition mt-4">
                <Minimize2 size={16} />
             </button>
          )}
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                status === 'success' ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-red-500 shadow-red-500/30'
              }`}>
                {status === 'success' ? <Trophy size={24} className="text-white" /> : <ShieldCheck size={24} className="text-white" />}
              </div>
              <div>
                <h2 className="text-2xl font-black text-foreground leading-tight">BOSS RAID</h2>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">Assembly Challenge</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-black tabular-nums ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-foreground'}`}>
                {formatTime(timeLeft)}
              </div>
              <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">Time Remaining</p>
            </div>
          </div>

          <div className="bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 rounded-3xl p-6 mb-6">
            <h3 className="text-sm font-black text-red-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Sword size={16} /> MISSION: {challenge?.title}
            </h3>
            <p className="text-secondary text-sm leading-relaxed italic">
              "{challenge?.mission}"
            </p>
          </div>

          {status === 'validating' ? (
            <div className="py-10 text-center">
              <div className="w-12 h-12 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="font-bold text-foreground">AI Sedang Memvalidasi Algoritma Anda...</p>
            </div>
          ) : status === 'success' ? (
            <div className="text-center py-6 animate-in zoom-in duration-500">
               <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-6">
                  <p className="text-emerald-600 text-sm font-medium leading-relaxed">{feedback}</p>
               </div>
               <div className="flex items-center justify-center gap-2 mb-8">
                  <div className="px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-xl">
                    <span className="text-amber-600 font-black">🪙 +2.000 KOIN</span>
                  </div>
                  <div className="px-4 py-2 bg-indigo-100 border border-indigo-500/30 rounded-xl">
                    <span className="text-indigo-600 font-black">🛡️ BOSS SLAYER</span>
                  </div>
               </div>
               <button onClick={closeRaid} className="w-full py-4 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/30">
                 KLAIM HADIAH & SELESAI
               </button>
            </div>
          ) : status === 'failed' ? (
            <div className="text-center py-6">
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6 text-red-400 text-sm font-medium">
                {feedback}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStatus('active')} className="flex-1 py-4 bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 text-foreground font-bold rounded-2xl hover:bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 transition">
                  COBA LAGI
                </button>
                <button onClick={closeRaid} className="flex-1 py-4 bg-red-500 text-white font-black rounded-2xl hover:bg-red-400 transition shadow-lg shadow-red-500/20">
                  MENYERAH
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-start gap-3 mb-2">
                <AlertTriangle size={20} className="text-indigo-600 shrink-0 mt-1" />
                <p className="text-xs text-indigo-200 leading-relaxed">
                  Tulis kode Anda di simulator, lalu <b>tempelkan (paste)</b> kodenya di bawah ini untuk divalidasi oleh AI Archi.
                </p>
              </div>

              <textarea 
                id="bossRaidCode"
                placeholder="Tempel kode Assembly Anda di sini..."
                className="w-full h-32 bg-black/40 border border-border rounded-2xl p-4 text-xs font-mono text-emerald-600 outline-none focus:border-red-500/50 transition-all resize-none"
              ></textarea>

              <div className="flex gap-3">
                <button 
                  onClick={closeRaid}
                  className="flex-1 py-4 bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 text-foreground font-bold rounded-2xl hover:bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 transition"
                >
                  BATALKAN
                </button>
                <button 
                  onClick={() => validateCode(document.getElementById('bossRaidCode')?.value)}
                  className="flex-[2] py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-500 transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2"
                >
                  <Zap size={18} /> VALIDATE & SUBMIT
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-border flex items-center justify-between opacity-40">
             <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span className="text-[10px] font-bold">Secure Validator Active</span>
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest italic">ARKON BOSS RAID v1.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
