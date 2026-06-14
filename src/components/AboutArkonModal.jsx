import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, BookOpen, BarChart2, Rocket, GraduationCap, BrainCircuit,
  Monitor, Gamepad2, Settings, TrendingUp, Users, Server,
  ChevronRight, ExternalLink, Shield, Wifi, Globe, Cpu,
  Award, Target, Layers, ArrowUpRight, CheckCircle2
} from 'lucide-react';
import {
  RESEARCH_SUMMARY, PEDAGOGICAL_THEORIES, ROADMAP_PHASES,
  DEPLOYMENT_ARCHITECTURE, PILOT_STUDY
} from '../data/research-data';

const ICON_MAP = {
  gamepad: Gamepad2, brain: BrainCircuit, monitor: Monitor,
  'bar-chart': BarChart2, settings: Settings
};

// ============================================================
// TAB DEFINITIONS
// ============================================================
const TABS = [
  { id: 'theory', label: 'Landasan Teori', icon: BookOpen },
  { id: 'research', label: 'Hasil Penelitian', icon: BarChart2 },
  { id: 'roadmap', label: 'Roadmap', icon: Rocket },
];

// ============================================================
// STAT CARD
// ============================================================
function StatCard({ value, label, sub, color = '#6366f1' }) {
  return (
    <div className="relative p-5 rounded-2xl bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 backdrop-blur-sm overflow-hidden group hover:border-border transition-all">
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20" style={{ background: color }} />
      <p className="text-3xl font-black mb-1" style={{ color }}>{value}</p>
      <p className="text-secondary text-sm font-bold">{label}</p>
      {sub && <p className="text-secondary text-[11px] mt-1">{sub}</p>}
    </div>
  );
}

// ============================================================
// THEORY TAB
// ============================================================
function TheoryTab() {
  const [expanded, setExpanded] = useState(null);
  return (
    <div className="space-y-6">
      {/* Target Persona */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-900/50 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <Target size={20} className="text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-100 mb-1">Target Sasaran</p>
            <p className="text-slate-300 text-xs leading-relaxed font-medium">
              Mahasiswa S1 <strong className="text-indigo-400 font-bold">Teknik Informatika / Ilmu Komputer</strong> semester 3–4
              yang mengambil mata kuliah <strong className="text-indigo-400 font-bold">Arsitektur dan Organisasi Komputer</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Theory Cards */}
      <div className="space-y-3">
        {PEDAGOGICAL_THEORIES.map((theory, idx) => {
          const IconComp = ICON_MAP[theory.icon] || BookOpen;
          const isOpen = expanded === idx;
          return (
            <motion.div key={theory.id} layout
              className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/40 hover:bg-slate-900/60 transition-colors">
              <button onClick={() => setExpanded(isOpen ? null : idx)}
                className="w-full text-left p-4 flex items-start gap-3 cursor-pointer">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: `${theory.color}20`, border: `1px solid ${theory.color}30` }}>
                  <IconComp size={18} style={{ color: theory.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-slate-100 truncate">{theory.name}</p>
                    <ChevronRight size={14} className={`text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                  </div>
                  <p className="text-[11px] font-bold text-slate-400">{theory.author}</p>
                </div>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-4 pb-4 space-y-3">
                      <p className="text-xs text-slate-300 leading-relaxed font-medium">{theory.description}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {theory.arkonFeatures.map(f => (
                          <span key={f} className="px-2.5 py-1 rounded-lg text-[10px] font-bold border"
                            style={{ color: theory.color, borderColor: `${theory.color}30`, background: `${theory.color}10` }}>
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Theory-Feature Mapping Diagram */}
      <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800">
        <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 font-bold">Pemetaan Teori → Fitur ARKON</p>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          {[
            { theory: 'SDT', feature: 'Gamifikasi & Coins', arrow: '→' },
            { theory: 'IRT/Rasch', feature: 'Adaptive Quiz', arrow: '→' },
            { theory: 'Mayer', feature: 'Simulator & AR', arrow: '→' },
            { theory: 'Formative', feature: 'N-Gain & Heatmap', arrow: '→' },
            { theory: 'Adaptive', feature: 'θ-based Difficulty', arrow: '→' },
            { theory: 'Room-Based', feature: 'Collaborative Learning', arrow: '→' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-indigo-400 font-black">{item.theory}</span>
              <span className="text-slate-400">{item.arrow}</span>
              <span className="text-slate-300 font-bold">{item.feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// RESEARCH TAB
// ============================================================
function ResearchTab() {
  const { nGain, sus, engagement, metadata } = RESEARCH_SUMMARY;
  return (
    <div className="space-y-6">
      {/* Metadata Badge */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
        <p className="text-[11px] font-black text-emerald-500 uppercase tracking-wider mb-2 font-bold">Pilot Study</p>
        <p className="text-xs text-slate-300 leading-relaxed font-medium">
          {metadata.method} — <strong className="text-emerald-400 font-bold">{metadata.participants} mahasiswa</strong> {metadata.course},{' '}
          {metadata.semester}. Durasi: {metadata.duration}.
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard value={nGain.classAverage} label="N-Gain Rata-rata" sub={`Kategori: ${nGain.classCategory} (Hake, 1999)`} color="#10b981" />
        <StatCard value={sus.averageScore} label="SUS Score" sub={`Grade ${sus.grade}: ${sus.adjective}`} color="#6366f1" />
        <StatCard value={`${engagement.engagementIncreasePercent}%`} label="Peningkatan Engagement" sub="vs. pembelajaran konvensional" color="#f59e0b" />
        <StatCard value={`${engagement.completionRate}%`} label="Completion Rate" sub={`${metadata.participants} mahasiswa aktif`} color="#ef4444" />
      </div>

      {/* N-Gain Distribution */}
      <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800">
        <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 font-bold">Distribusi N-Gain (N={nGain.totalStudents})</p>
        <div className="space-y-2">
          {[
            { label: 'Tinggi (≥0.7)', count: nGain.distribution.high, color: '#10b981', max: nGain.totalStudents },
            { label: 'Sedang (0.3–0.7)', count: nGain.distribution.medium, color: '#f59e0b', max: nGain.totalStudents },
            { label: 'Rendah (<0.3)', count: nGain.distribution.low, color: '#ef4444', max: nGain.totalStudents },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-[11px] text-slate-400 w-28 shrink-0 font-bold">{item.label}</span>
              <div className="flex-1 h-6 bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 rounded-lg overflow-hidden relative">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(item.count / item.max) * 100}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full rounded-lg" style={{ background: item.color }} />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-700">
                  {item.count} mahasiswa ({((item.count / item.max) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800">
        <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 font-bold">Metrik Engagement Platform</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
          {[
            { label: 'Rata-rata Durasi Sesi', value: engagement.avgSessionDuration },
            { label: 'Sesi per Minggu', value: engagement.avgSessionsPerWeek },
            { label: 'Total Quiz Attempts', value: engagement.totalQuizAttempts.toLocaleString() },
            { label: 'Avg Quiz/Mahasiswa', value: engagement.avgQuizPerStudent },
            { label: 'AR Lab Usage', value: `${engagement.arLabUsageRate}%` },
            { label: 'CPU Simulator Usage', value: `${engagement.cpuSimUsageRate}%` },
          ].map(m => (
            <div key={m.label} className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400 font-bold">{m.label}</span>
              <span className="text-slate-200 font-black">{m.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ROADMAP TAB
// ============================================================
function RoadmapTab() {
  const arch = DEPLOYMENT_ARCHITECTURE;
  return (
    <div className="space-y-6">
      {/* Timeline */}
      <div className="space-y-4">
        {ROADMAP_PHASES.map((phase, idx) => (
          <div key={phase.phase} className="relative pl-8">
            {/* Timeline line */}
            {idx < ROADMAP_PHASES.length - 1 && (
              <div className="absolute left-[14px] top-10 bottom-0 w-0.5 border border-slate-800" />
            )}
            {/* Timeline dot */}
            <div className="absolute left-0 top-3 w-7 h-7 rounded-full flex items-center justify-center border-2"
              style={{
                borderColor: phase.color,
                background: phase.status === 'active' ? phase.color : 'transparent'
              }}>
              {phase.status === 'active' ? (
                <CheckCircle2 size={14} className="text-slate-900" />
              ) : (
                <span className="text-[10px] font-black" style={{ color: phase.color }}>{phase.phase}</span>
              )}
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 hover:bg-slate-900/60 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-black text-slate-100">{phase.title}</p>
                {phase.status === 'active' && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    AKTIF
                  </span>
                )}
              </div>
              <p className="text-[11px] font-bold text-slate-400 mb-2">{phase.period}</p>
              <p className="text-xs text-slate-300 mb-3">{phase.description}</p>
              <ul className="space-y-1">
                {phase.items.map((item, i) => (
                  <li key={i} className="text-[11px] text-slate-400 flex items-start gap-1.5 font-medium">
                    <ChevronRight size={10} className="mt-0.5 shrink-0" style={{ color: phase.color }} />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-[10px] font-black mt-2" style={{ color: phase.color }}>
                {phase.cost}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Deployment Architecture */}
      <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800">
        <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 font-bold">Arsitektur Deployment</p>
        <div className="space-y-2">
          {Object.entries(arch).filter(([k]) => !['totalMonthlyCost', 'note'].includes(k)).map(([key, val]) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <Server size={12} className="text-indigo-400" />
                <span className="text-slate-300 font-bold capitalize">{key}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-200 font-black">{val.service}</span>
                <span className="text-slate-400 ml-2">({val.cost})</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-[11px] text-emerald-400 font-black">
            Total: {arch.totalMonthlyCost}/bulan
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">{arch.note}</p>
        </div>
      </div>

      {/* Digital Divide Mitigation */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
        <div className="flex items-start gap-3">
          <Wifi size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-slate-100 mb-1">Mitigasi Digital Divide</p>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              ARKON dirancang untuk berjalan di <strong className="text-amber-400 font-bold">koneksi 3G</strong>. Fitur AR bersifat opsional
              dengan fallback ke viewer statis 3D. PWA memungkinkan akses offline untuk quiz dan materi.
              Seluruh aset di-cache secara progresif untuk penggunaan tanpa internet stabil.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN MODAL COMPONENT
// ============================================================
export default function AboutArkonModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('theory');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={onClose}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-2xl max-h-[85vh] rounded-3xl overflow-hidden border border-slate-800"
            style={{ background: 'linear-gradient(145deg, #0f1629 0%, #080c1a 100%)' }}>

            {/* Header */}
            <div className="sticky top-0 z-10 px-6 pt-6 pb-4 border-b border-slate-800"
              style={{ background: 'linear-gradient(180deg, #0f1629 0%, #0f1629dd 100%)', backdropFilter: 'blur(20px)' }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                      <Layers size={16} className="text-white" />
                    </div>
                    <h2 className="text-xl font-black text-white">Tentang ARKON</h2>
                  </div>
                  <p className="text-xs text-slate-400 font-bold">
                    Adaptive Resource Komputer Architecture Education Platform
                  </p>
                </div>
                <button onClick={onClose} aria-label="Tutup modal"
                  className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
                {TABS.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-slate-800 text-white shadow-lg border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}>
                    <tab.icon size={14} />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-6 custom-scrollbar" style={{ maxHeight: 'calc(85vh - 140px)' }}>
              <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}>
                  {activeTab === 'theory' && <TheoryTab />}
                  {activeTab === 'research' && <ResearchTab />}
                  {activeTab === 'roadmap' && <RoadmapTab />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 px-6 py-3 border-t border-slate-800 bg-[#080c1a]/95 backdrop-blur-xl">
              <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                ARKON v1.0 • LIDM 2027 • Kelompok 10
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
