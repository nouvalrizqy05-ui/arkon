import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Wrench, CheckCircle2, AlertTriangle, AlertCircle, Share2, RotateCcw, ChevronDown, ChevronUp, Flame, Lightbulb, Gauge, Server, Monitor, Gamepad2, Maximize2, Minimize2, Shield, HardDrive, Target, Users } from 'lucide-react';
import { PC_COMPONENTS, ASSEMBLY_CATEGORIES, CATEGORY_LABELS, CATEGORY_EMOJIS, findComponentById, getCategoryById } from '../data/pc-components';
import { checkCompatibility, getCompatibilitySummary } from '../data/compatibility-rules';
import { calculateBenchmark } from '../data/benchmark-calculator';

function PcAssemblyAdmin() {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 bg-slate-50">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Wrench size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900">Manajemen Perakitan PC</h2>
            <p className="text-sm text-gray-500">Buat skenario perakitan, atur budget, dan evaluasi hasil rakitan mahasiswa.</p>
          </div>
        </div>
        <button className="bg-primary text-white font-bold py-2.5 px-5 rounded-xl hover:bg-primary-hover shadow-md flex items-center gap-2">
          + Buat Skenario Tugas
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2"><Target size={16} className="text-amber-500"/> Skenario Aktif</h3>
          <p className="text-3xl font-black text-primary my-2">3 <span className="text-sm font-medium text-gray-500">Tugas</span></p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2"><Users size={16} className="text-emerald-500"/> Total Pengumpulan</h3>
          <p className="text-3xl font-black text-emerald-600 my-2">124 <span className="text-sm font-medium text-gray-500">Mahasiswa</span></p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2"><AlertTriangle size={16} className="text-red-500"/> Bottleneck Rata-rata</h3>
          <p className="text-3xl font-black text-red-500 my-2">15% <span className="text-sm font-medium text-gray-500">Kasus</span></p>
        </div>
      </div>

      <h3 className="text-lg font-black text-gray-900 mb-4">Daftar Skenario Tugas Perakitan</h3>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Judul Skenario</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Target (Kebutuhan)</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Limit Budget</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="p-4">
                <p className="font-bold text-gray-900">PC Gaming Budget (Esports)</p>
                <p className="text-xs text-gray-500">Rakitan PC untuk game kompetitif (CS2, Valorant) stabil 144fps.</p>
              </td>
              <td className="p-4"><span className="px-2 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded">Gaming</span></td>
              <td className="p-4 font-bold text-gray-700">Rp 8.000.000</td>
              <td className="p-4"><span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider rounded-full">Aktif</span></td>
              <td className="p-4 text-center">
                <button className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Kelola</button>
              </td>
            </tr>
            <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="p-4">
                <p className="font-bold text-gray-900">Workstation Rendering 3D</p>
                <p className="text-xs text-gray-500">Rakitan PC untuk Blender & Premiere Pro.</p>
              </td>
              <td className="p-4"><span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded">Rendering</span></td>
              <td className="p-4 font-bold text-gray-700">Rp 25.000.000</td>
              <td className="p-4"><span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider rounded-full">Aktif</span></td>
              <td className="p-4 text-center">
                <button className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Kelola</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PcAssembly({ inventory, equippedComponents, setEquippedComponents, studentId, token, apiUrl, onShareBuild, roomId, isTestMode, activeActivity, onActivityComplete, userRole }) {
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [expandedIssue, setExpandedIssue] = useState(null);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [buildName, setBuildName] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [gudangFilter, setGudangFilter] = useState('all');
  const [isLearningMode, setIsLearningMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState(null); // null | 'saving' | 'saved'
  const [tourStep, setTourStep] = useState(() => {
    return localStorage.getItem('arkon_assembly_tour_done') ? 0 : 1;
  });
  const [use2DFallback, setUse2DFallback] = useState(false); // FR-3D-006: WebGL Fallback

  if (userRole === 'dosen') return <PcAssemblyAdmin />;

  const completeTour = () => {
    setTourStep(0);
    localStorage.setItem('arkon_assembly_tour_done', 'true');
  };

  // ─── DEBOUNCED AUTO-SAVE (3s after last change) ─────────
  const autoSave = useCallback(async (components) => {
    if (!roomId || !studentId || isTestMode) return;
    const componentCount = Object.keys(components).length;
    if (componentCount === 0) return;

    setAutoSaveStatus('saving');
    try {
      // Delta: only send component IDs + categories, not full objects
      const workData = {};
      Object.entries(components).forEach(([cat, comp]) => {
        workData[cat] = { id: comp.id, name: comp.name, category: comp.category };
      });

      await fetch(`${apiUrl}/api/student-work`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          room_id: roomId,
          student_id: studentId,
          work_type: 'assembly',
          work_data: workData,
          score: isComplete && benchmark ? benchmark.overall.score : null,
          score_breakdown: isComplete && benchmark ? {
            gaming: benchmark.gaming.score,
            rendering: benchmark.rendering.score,
            server: benchmark.server.score,
            compatibility: compatibility.isCompatible ? 100 : 0,
          } : {},
          activity_id: activeActivity?.id || null,
        })
      });
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus(null), 2000);
    } catch (e) {
      console.error('Auto-save failed:', e);
      setAutoSaveStatus(null);
    }
  }, [roomId, studentId, isTestMode, apiUrl, token]);

  useEffect(() => {
    if (Object.keys(equippedComponents).length === 0) return;
    clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      autoSave(equippedComponents);
    }, 3000); // 3 second debounce
    return () => clearTimeout(autoSaveTimerRef.current);
  }, [equippedComponents, autoSave]);

  // Default Components for Learning Mode
  const DEFAULT_COMPONENTS = useMemo(() => [
    { id: 'def_mobo', name: 'Learning Motherboard', category: 'motherboard', emoji: '🖥️', modelSrc: '/models/motherboard.glb', specs: { socket: 'Universal', ddr: 'Universal' }, desc: 'Komponen standar untuk belajar merakit.' },
    { id: 'def_cpu', name: 'Learning CPU', category: 'cpu', emoji: '🧠', modelSrc: '/models/cpu/amd_ryzen_5_5600x_processor/scene_compressed.glb', specs: { socket: 'Universal' }, desc: 'Komponen standar untuk belajar merakit.' },
    { id: 'def_gpu', name: 'Learning GPU', category: 'gpu', emoji: '🎮', modelSrc: '/models/geforce_rtx_3080_graphics_card.glb', specs: { pcie: 'Universal' }, desc: 'Komponen standar untuk belajar merakit.' },
    { id: 'def_ram', name: 'Learning RAM', category: 'ram', emoji: '💾', modelSrc: '/models/random_access_memory.glb', specs: { ddr: 'Universal' }, desc: 'Komponen standar untuk belajar merakit.' },
    { id: 'def_storage', name: 'Learning Storage', category: 'storage', emoji: '💿', modelSrc: '/models/storage_ssd_hdd_m.2.glb', specs: { type: 'Universal' }, desc: 'Komponen standar untuk belajar merakit.' },
    { id: 'def_psu', name: 'Learning PSU', category: 'psu', emoji: '⚡', modelSrc: '/models/psu_power_supply_unit.glb', specs: { wattage: 500 }, desc: 'Komponen standar untuk belajar merakit.' },
    { id: 'def_cooling', name: 'Learning Cooler', category: 'cooling', emoji: '❄️', modelSrc: '/models/cooler/corsair_h150i_elitie_cpu_liquid_cooler/scene_compressed.glb', specs: { type: 'Universal' }, desc: 'Komponen standar untuk belajar merakit.' },
    { id: 'def_case', name: 'Learning Case (NZXT 510B)', category: 'case', emoji: '🗄️', modelSrc: '/models/case/cabinet/scene_compressed.glb', specs: { formFactor: 'Universal' }, desc: 'Komponen standar untuk belajar merakit.' },
  ], []);

  // Toggle equip component
  const toggleEquip = (comp) => {
    setEquippedComponents(prev => {
      const isEquipped = prev[comp.category]?.id === comp.id;
      if (isEquipped) {
        const next = { ...prev };
        delete next[comp.category];
        return next;
      }

      // Validasi Urutan Perakitan
      if (comp.category !== 'case') {
        const strictOrder = ASSEMBLY_CATEGORIES.filter(c => c !== 'case');
        const catIndex = strictOrder.indexOf(comp.category);

        for (let i = 0; i < catIndex; i++) {
          const reqCat = strictOrder[i];
          if (!prev[reqCat]) {
            setToastMessage(`Kamu harus memasang ${CATEGORY_LABELS[reqCat]} terlebih dahulu!`);
            setTimeout(() => setToastMessage(null), 3000);
            return prev;
          }
        }
      }

      return { ...prev, [comp.category]: comp };
    });
  };

  // Convert inventory to resolved component objects for Gudang
  const inventoryItems = useMemo(() => {
    if (isLearningMode) return DEFAULT_COMPONENTS;
    return inventory.map(inv => findComponentById(inv.component_id)).filter(Boolean);
  }, [inventory, isLearningMode, DEFAULT_COMPONENTS]);

  // Build the assembled list for iframe
  const assembledCategories = Object.keys(equippedComponents);

  // Compatibility check - Bypass if in learning mode or using default components
  const compatibility = useMemo(() => {
    if (isLearningMode) return { errors: [], warnings: [], isCompatible: true };
    return checkCompatibility(equippedComponents);
  }, [equippedComponents, isLearningMode]);

  const compatSummary = getCompatibilitySummary(compatibility);

  // Benchmark (only when all 8 categories filled)
  const isComplete = ASSEMBLY_CATEGORIES.every(cat => equippedComponents[cat]);
  const benchmark = useMemo(() => {
    if (!isComplete) return null;
    return calculateBenchmark(equippedComponents);
  }, [equippedComponents, isComplete]);

  // Notify iframe about assembled components
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      const modelSrcs = {};
      assembledCategories.forEach(cat => {
        if (equippedComponents[cat]) {
          modelSrcs[cat] = equippedComponents[cat].modelSrc;
        }
      });
      // Map category names to match three-assembly.html expectations
      iframeRef.current.contentWindow.postMessage({
        type: 'UPDATE_ASSEMBLY',
        assembled: assembledCategories,
        modelSrcs: modelSrcs
      }, '*');
    }
  }, [assembledCategories, equippedComponents]);

  const handleIframeLoad = () => {
    if (iframeRef.current?.contentWindow) {
      const modelSrcs = {};
      assembledCategories.forEach(cat => {
        if (equippedComponents[cat]) {
          modelSrcs[cat] = equippedComponents[cat].modelSrc;
        }
      });
      iframeRef.current.contentWindow.postMessage({
        type: 'UPDATE_ASSEMBLY',
        assembled: assembledCategories,
        modelSrcs: modelSrcs
      }, '*');
    }
  };

  // Share to showroom
  const handleShare = async () => {
    if (!buildName.trim() || !benchmark) return;
    try {
      const res = await fetch(`${apiUrl}/api/showroom/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          student_id: studentId,
          build_name: buildName.trim(),
          components: equippedComponents,
          benchmark_scores: {
            gaming: benchmark.gaming.score,
            rendering: benchmark.rendering.score,
            server: benchmark.server.score,
            overall: benchmark.overall.score,
          },
          is_compatible: compatibility.isCompatible,
        }),
      });
      if (res.ok) {
        setShareSuccess(true);
        setShowShareModal(false);
        setTimeout(() => setShareSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  return (
    <div className="h-full w-full max-w-full flex flex-col overflow-y-auto overflow-x-hidden px-6 box-border min-w-0 custom-scrollbar" style={{ maxWidth: '100%' }}>
      {/* Task Mode Banner */}
      {activeActivity && (
        <div className="mx-6 mt-4 mb-0 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center text-lg">📋</div>
            <div>
              <p className="text-sm font-black text-amber-600">Mode Tugas: {activeActivity.title}</p>
              <div className="flex items-center gap-3 mt-0.5">
                {activeActivity.config?.budget_limit && (
                  <span className="text-[10px] font-bold text-amber-300">💰 Budget: Rp {activeActivity.config.budget_limit.toLocaleString('id-ID')}</span>
                )}
                {activeActivity.config?.target_use && activeActivity.config.target_use !== 'any' && (
                  <span className="text-[10px] font-bold text-amber-300">🎯 Target: {activeActivity.config.target_use}</span>
                )}
                {activeActivity.config?.time_limit_minutes && (
                  <span className="text-[10px] font-bold text-amber-300">⏱️ {activeActivity.config.time_limit_minutes} menit</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onActivityComplete}
            className="px-3 py-1.5 bg-white shadow-sm border border-border text-secondary rounded-lg text-[10px] font-bold hover:bg-white shadow-sm border border-border transition"
          >Keluar Tugas</button>
        </div>
      )}

      {/* Header */}
      <div className="pt-4 pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
              <Wrench size={20} className="text-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground">Assembly Lab</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${isLearningMode ? 'bg-emerald-500/20 text-emerald-600' : 'bg-primary-light text-primary'}`}>
                  {isLearningMode ? 'Mode Belajar' : 'Mode Karir'}
                </span>
                <span className="text-secondary text-[9px] font-bold">{assembledCategories.length}/{ASSEMBLY_CATEGORIES.length} terpasang</span>
                {autoSaveStatus === 'saving' && <span className="text-[8px] text-amber-600 font-bold animate-pulse">💾 Saving...</span>}
                {autoSaveStatus === 'saved' && <span className="text-[8px] text-emerald-600 font-bold">✅ Saved</span>}
                {isTestMode && <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-600">TEST MODE</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-border mr-2">
               <button 
                onClick={() => { setIsLearningMode(false); setEquippedComponents({}); }}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${!isLearningMode ? 'bg-primary text-white shadow-md' : 'text-secondary hover:text-foreground'}`}
              >
                Gudang Saya
              </button>
              <button 
                onClick={() => { setIsLearningMode(true); setEquippedComponents({}); }}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${isLearningMode ? 'bg-emerald-500 text-white shadow-md' : 'text-secondary hover:text-foreground'}`}
              >
                Belajar Merakit
              </button>
            </div>
            {isComplete && benchmark && (
              <button
                onClick={() => setShowBenchmark(!showBenchmark)}
                className="px-3 py-1.5 text-xs font-bold bg-primary-light border border-primary/30 text-primary rounded-lg hover:bg-primary/30 transition flex items-center gap-1.5"
              >
                <Gauge size={14} /> Benchmark
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Gudang Komponen (Inventory) - Fix horizontal overflow */}
      <div className="pb-2 shrink-0 z-20 w-full overflow-hidden min-w-0">
        <div className="bg-white border border-border rounded-xl p-2.5 w-full overflow-hidden flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <span className="text-lg">📦</span> Gudang Komponen
            </h3>
            {/* Category Filter Tabs - Force respect parent width */}
            <div className="flex gap-1 overflow-x-auto custom-scrollbar w-0 min-w-full">
              <button
                onClick={() => setGudangFilter('all')}
                className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${gudangFilter === 'all'
                    ? 'bg-white shadow-sm border border-border border-border text-foreground'
                    : 'bg-white shadow-sm border border-border border-border text-secondary hover:text-secondary'
                  }`}
              >
                Semua
              </button>
              {ASSEMBLY_CATEGORIES.filter(cat => inventoryItems.some(i => i.category === cat)).map(cat => {
                const isActive = gudangFilter === cat;
                const hasEquipped = equippedComponents[cat] !== undefined;
                return (
                  <button
                    key={cat}
                    onClick={() => setGudangFilter(cat)}
                    className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 ${isActive
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                        : 'bg-white border-border text-secondary hover:text-foreground'
                      }`}
                  >
                    {CATEGORY_EMOJIS[cat]}
                    {hasEquipped && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />}
                  </button>
                );
              })}
            </div>
          </div>
          {inventoryItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-6 border border-dashed border-border rounded-2xl bg-white/[0.02]">
              <AlertTriangle className="text-secondary mb-3" size={24} />
              <p className="text-xs text-secondary text-center font-medium">
                {isLearningMode ? 'Memuat komponen belajar...' : 'Gudang kosong. Beli komponen di PC Shop terlebih dahulu!'}
              </p>
              {!isLearningMode && (
                <button 
                  onClick={() => setIsLearningMode(true)}
                  className="mt-4 text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-300 transition-colors"
                >
                  Gunakan Mode Belajar →
                </button>
              )}
            </div>
          ) : (
            <div className="flex gap-2.5 overflow-x-auto custom-scrollbar pb-1.5 w-full min-w-0">
              {/* Cards Container - Force respect parent width */}
              {inventoryItems
                .filter(item => gudangFilter === 'all' || item.category === gudangFilter)
                .map((item, idx) => {
                  const isEquipped = equippedComponents[item.category]?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleEquip(item)}
                      className={`shrink-0 w-28 p-2 rounded-lg border text-left transition-all relative overflow-hidden ${isEquipped
                          ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-200'
                          : 'bg-white border-border hover:border-indigo-300 hover:bg-primary-soft'
                        }`}
                    >
                      <div className="text-2xl mb-2">{item.emoji}</div>
                      <p className="text-[10px] font-bold text-foreground leading-tight mb-1 truncate">{item.name}</p>
                      <p className="text-[9px] text-secondary uppercase font-black tracking-widest">{CATEGORY_LABELS[item.category]}</p>
                      {isEquipped && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                          <CheckCircle2 size={10} className="text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Assembly Error Toast */}
      {toastMessage && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 backdrop-blur-md border border-red-500/50 p-3 rounded-xl shadow-2xl shadow-red-500/30 animate-in slide-in-from-top-4 fade-in duration-300 flex items-center gap-2">
          <AlertCircle size={16} className="text-white" />
          <span className="text-xs font-bold text-white">{toastMessage}</span>
        </div>
      )}

      {/* Compatibility Alerts */}
      {(compatibility.errors.length > 0 || compatibility.warnings.length > 0) && (
        <div className="pb-2 shrink-0 space-y-1.5 max-h-[150px] overflow-y-auto custom-scrollbar">
          {compatibility.errors.map((err, i) => (
            <div key={`err-${i}`} className="bg-red-500/10 border border-red-500/20 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedIssue(expandedIssue === `err-${i}` ? null : `err-${i}`)}
                className="w-full flex items-center gap-3 p-3 text-left"
              >
                <AlertCircle size={16} className="text-red-400 shrink-0" />
                <span className="flex-1 text-xs font-bold text-red-400">{err.title}</span>
                {expandedIssue === `err-${i}` ? <ChevronUp size={14} className="text-red-400/50" /> : <ChevronDown size={14} className="text-red-400/50" />}
              </button>
              {expandedIssue === `err-${i}` && (
                <div className="px-3 pb-3 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <p className="text-[11px] text-red-300/80 leading-relaxed">{err.detail}</p>
                  <div className="bg-red-500/10 border border-red-500/10 rounded-lg p-2.5 flex items-start gap-2">
                    <Lightbulb size={12} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-300/70 leading-relaxed italic">{err.learn}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
          {compatibility.warnings.map((warn, i) => (
            <div key={`warn-${i}`} className="bg-amber-500/10 border border-amber-500/20 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedIssue(expandedIssue === `warn-${i}` ? null : `warn-${i}`)}
                className="w-full flex items-center gap-3 p-3 text-left"
              >
                <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                <span className="flex-1 text-xs font-bold text-amber-600">{warn.title}</span>
                {expandedIssue === `warn-${i}` ? <ChevronUp size={14} className="text-amber-600/50" /> : <ChevronDown size={14} className="text-amber-600/50" />}
              </button>
              {expandedIssue === `warn-${i}` && (
                <div className="px-3 pb-3 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <p className="text-[11px] text-amber-300/80 leading-relaxed">{warn.detail}</p>
                  <div className="bg-amber-500/10 border border-amber-500/10 rounded-lg p-2.5 flex items-start gap-2">
                    <Lightbulb size={12} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-300/70 leading-relaxed italic">{warn.learn}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Benchmark Result Card */}
      {showBenchmark && benchmark && (
        <div className="pb-2 shrink-0 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-white border border-border shadow-sm rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Gauge size={16} className="text-primary" /> PC Benchmark Score
              </h3>
              <div className={`px-3 py-1 rounded-lg text-xs font-black bg-gradient-to-r ${benchmark.overall.tierColor} text-foreground`}>
                {benchmark.overall.tier} — {benchmark.overall.tierLabel}
              </div>
            </div>

            {/* Score Bars */}
            <div className="space-y-3 mb-4">
              {[
                { key: 'gaming', icon: <Gamepad2 size={14} />, label: 'Gaming', data: benchmark.gaming, barColor: 'bg-rose-500' },
                { key: 'rendering', icon: <Monitor size={14} />, label: 'Rendering', data: benchmark.rendering, barColor: 'bg-blue-500' },
                { key: 'server', icon: <Server size={14} />, label: 'Server', data: benchmark.server, barColor: 'bg-emerald-500' },
              ].map(({ key, icon, label, data, barColor }) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-secondary flex items-center gap-1.5">{icon} {label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-secondary italic">{data.label}</span>
                      <span className={`text-xs font-black ${data.tierTextColor.replace('400', '600')}`}>{data.score}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{ width: `${data.score}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Bottlenecks */}
            {benchmark.bottleneck.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-[10px] font-black text-secondary uppercase tracking-widest">⚡ Bottleneck Detected</p>
                {benchmark.bottleneck.map((b, i) => (
                  <div key={i} className={`p-2.5 rounded-lg border text-[10px] leading-relaxed ${b.severity === 'high' ? 'bg-red-500/10 border-red-500/20 text-red-300/80' : 'bg-amber-500/10 border-amber-500/20 text-amber-300/80'
                    }`}>
                    <span className="font-bold">{b.icon} {b.component}:</span> {b.reason}
                  </div>
                ))}
              </div>
            )}

            {/* Share Button */}
            {compatibility.isCompatible && (
              <button
                onClick={() => setShowShareModal(true)}
                className="w-full py-2.5 bg-gradient-to-r from-primary to-purple-600 text-white font-bold rounded-xl text-xs hover:from-indigo-400 hover:to-purple-500 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                <Share2 size={14} /> Share ke Showroom 🚀
              </button>
            )}
          </div>
        </div>
      )}

      {/* Share Success Toast */}
      {shareSuccess && (
        <div className="pb-2 shrink-0 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-3">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span className="text-xs font-bold text-emerald-600">Build berhasil di-share ke Showroom! 🎉</span>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-lg font-black text-foreground mb-2">Share Build ke Showroom</h3>
            <p className="text-secondary text-xs mb-4">Beri nama build PC kamu dan share ke seluruh kelas!</p>
            <input
              type="text"
              value={buildName}
              onChange={(e) => setBuildName(e.target.value)}
              placeholder="Contoh: Budget Gaming Beast"
              className="w-full bg-white shadow-sm border border-border border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-white/20 focus:outline-none focus:border-primary/50 mb-4"
              maxLength={50}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowShareModal(false)}
                className="flex-1 py-2.5 bg-white shadow-sm border border-border border border-border text-secondary font-bold rounded-xl text-xs hover:bg-white shadow-sm border border-border transition"
              >
                Batal
              </button>
              <button
                onClick={handleShare}
                disabled={!buildName.trim()}
                className="flex-1 py-2.5 bg-primary text-foreground font-bold rounded-xl text-xs hover:bg-indigo-400 transition shadow-md shadow-primary/20 disabled:opacity-50"
              >
                Share 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3D View - Main Assembly Area (Expanded) */}
      <div className={`${isFullscreen ? 'fixed inset-0 z-[100] m-0 rounded-0' : 'w-full h-[500px] md:h-[700px] lg:h-[800px] relative mb-8 rounded-2xl border border-border'} overflow-hidden bg-slate-50 shadow-lg transition-all duration-300`}>
        {/* Fullscreen Toggle Button - Moved to Left to avoid overlapping with Transform Config */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="absolute top-4 left-4 z-30 p-2.5 bg-white shadow-sm border border-border backdrop-blur-md border border-border text-foreground rounded-xl hover:bg-white transition-all active:scale-95 group shadow-sm"
          title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
        >
          {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>

        {/* Complete Badge */}
        {isComplete && compatibility.isCompatible && (
          <div className="absolute bottom-4 right-4 z-20 bg-white shadow-sm border border-border backdrop-blur-md border border-emerald-200 p-4 rounded-2xl shadow-xl animate-in slide-in-from-right-4 fade-in duration-500 max-w-[240px]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-md shadow-emerald-500/30">
                <CheckCircle2 size={18} className="text-white" />
              </div>
              <h2 className="text-sm font-black text-gray-900">PC Nyala! 🎉</h2>
            </div>
            <p className="text-[10px] text-emerald-600 font-bold leading-tight">
              Semua komponen kompatibel dan terpasang sempurna.
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[9px] text-secondary font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              System Online
            </div>
          </div>
        )}

        {/* Incompatible Warning */}
        {isComplete && !compatibility.isCompatible && (
          <div className="absolute bottom-4 right-4 z-20 bg-slate-50/80 backdrop-blur-md border border-red-500/30 p-4 rounded-2xl shadow-2xl shadow-red-500/20 animate-in slide-in-from-right-4 fade-in duration-500 max-w-[240px]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/30">
                <AlertCircle size={18} className="text-white" />
              </div>
              <h2 className="text-sm font-black text-gray-900">Error! 💥</h2>
            </div>
            <p className="text-[10px] text-red-400 font-bold leading-tight">
              {compatibility.errors.length} masalah kompatibilitas. PC tidak bisa booting.
            </p>
          </div>
        )}

        {/* Fallback Toggle Button */}
        <button
          onClick={() => setUse2DFallback(!use2DFallback)}
          className="absolute top-4 right-4 z-30 px-3 py-1.5 bg-white shadow-sm border border-border backdrop-blur-md text-secondary rounded-lg text-[10px] font-bold hover:bg-slate-50 transition-all flex items-center gap-1.5"
        >
          {use2DFallback ? <Monitor size={14} /> : <HardDrive size={14} />}
          {use2DFallback ? 'Gunakan 3D View' : 'Mode 2D (Low-end)'}
        </button>

        {/* 3D View Iframe or 2D Fallback */}
        {use2DFallback ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100/50 p-8">
            <div className="w-48 h-48 border-4 border-dashed border-slate-300 rounded-3xl flex items-center justify-center bg-white mb-6 shadow-sm">
              <span className="text-4xl">🖥️</span>
            </div>
            <h3 className="text-lg font-black text-slate-700 mb-2">Mode 2D Sederhana Aktif</h3>
            <p className="text-xs text-slate-500 mb-6 text-center max-w-sm leading-relaxed">
              Ini adalah tampilan fallback statis untuk perangkat yang tidak mendukung WebGL. Komponen yang Anda lengkapi di panel bawah akan tercatat secara logis.
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {assembledCategories.length === 0 ? (
                <span className="text-xs text-slate-400 font-bold italic">Belum ada komponen terpasang</span>
              ) : (
                assembledCategories.map(cat => (
                  <div key={cat} className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5">
                    <CheckCircle2 size={12} />
                    {CATEGORY_LABELS[cat] || cat}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Fix #4: aria fallback untuk 3D canvas (NFR-A11Y-004) */
          <div
            role="img"
            aria-label="3D PC Assembly Canvas — area interaktif untuk merakit komponen PC secara visual"
            className="w-full h-full"
          >
            {/* sr-only: deskripsi lengkap untuk pengguna low-vision */}
            <span className="sr-only">
              Area 3D interaktif perakitan PC. Komponen yang tersedia untuk dipasang meliputi:
              motherboard, CPU, GPU, RAM, storage, PSU, cooling, dan case.
              Seret komponen dari panel kiri ke slot yang tersedia di kanvas 3D ini.
              Gunakan mouse untuk memutar tampilan dan scroll untuk zoom.
            </span>
            <iframe
              ref={iframeRef}
              src="/three-assembly.html"
              className="w-full h-full border-0"
              title="PC Assembly 3D — Kanvas Interaktif Perakitan PC"
              onLoad={handleIframeLoad}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
              aria-hidden="true"
            />
          </div>
        )}
      </div>


      {/* ONBOARDING TOUR MODAL */}
      {tourStep > 0 && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="absolute top-0 left-0 w-full h-2 flex">
              <div className={`h-full transition-all duration-300 ${tourStep >= 1 ? 'bg-primary flex-1' : 'bg-gray-100 flex-1'}`}></div>
              <div className={`h-full transition-all duration-300 ${tourStep >= 2 ? 'bg-primary flex-1' : 'bg-gray-100 flex-1'}`}></div>
              <div className={`h-full transition-all duration-300 ${tourStep >= 3 ? 'bg-primary flex-1' : 'bg-gray-100 flex-1'}`}></div>
            </div>
            
            {tourStep === 1 && (
              <>
                <div className="w-16 h-16 bg-primary-light text-primary rounded-2xl flex items-center justify-center mb-6 shadow-inner mx-auto">
                  <Wrench size={32} />
                </div>
                <h3 className="text-2xl font-black text-center mb-3 text-gray-900">Selamat Datang di Assembly Lab!</h3>
                <p className="text-center text-gray-600 mb-8 leading-relaxed">
                  Di sini kamu bisa merakit PC dari komponen yang kamu dapatkan atau beli di Shop.
                </p>
                <div className="flex justify-between items-center">
                  <button onClick={completeTour} className="text-sm font-bold text-secondary hover:text-gray-600 transition">Lewati</button>
                  <button onClick={() => setTourStep(2)} className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition">Lanjut</button>
                </div>
              </>
            )}

            {tourStep === 2 && (
              <>
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner mx-auto">
                  <Monitor size={32} />
                </div>
                <h3 className="text-2xl font-black text-center mb-3 text-gray-900">Perhatikan Urutan!</h3>
                <p className="text-center text-gray-600 mb-8 leading-relaxed">
                  Kamu harus memasang komponen secara berurutan: <br/> <b>Motherboard → CPU → GPU → RAM → Storage → PSU → Cooler → Case</b>.
                </p>
                <div className="flex justify-between items-center">
                  <button onClick={() => setTourStep(1)} className="text-sm font-bold text-secondary hover:text-gray-600 transition">Kembali</button>
                  <button onClick={() => setTourStep(3)} className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition">Lanjut</button>
                </div>
              </>
            )}

            {tourStep === 3 && (
              <>
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner mx-auto">
                  <Shield size={32} />
                </div>
                <h3 className="text-2xl font-black text-center mb-3 text-gray-900">Kecocokan & Benchmark</h3>
                <p className="text-center text-gray-600 mb-8 leading-relaxed">
                  Pastikan indikator <b>Compatibility</b> menunjukkan hijau (cocok). Saat semua 8 komponen terpasang, kamu bisa melihat skor Benchmark PC-mu!
                </p>
                <div className="flex justify-between items-center">
                  <button onClick={() => setTourStep(2)} className="text-sm font-bold text-secondary hover:text-gray-600 transition">Kembali</button>
                  <button onClick={completeTour} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition">Mulai Merakit!</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
