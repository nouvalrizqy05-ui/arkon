import { useState } from 'react';
import { ShoppingCart, Lock, Check, ArrowLeftRight, ChevronRight, Cpu, HardDrive, MemoryStick, Gauge, Zap, Fan, Box, Monitor } from 'lucide-react';
import { PC_COMPONENTS, ASSEMBLY_CATEGORIES, CATEGORY_LABELS, CATEGORY_EMOJIS, findComponentById } from '../data/pc-components';

const CATEGORY_ICONS = {
  motherboard: Monitor,
  cpu: Cpu,
  ram: MemoryStick,
  gpu: Gauge,
  storage: HardDrive,
  psu: Zap,
  cooling: Fan,
  case: Box,
};

const CATEGORY_COLORS = {
  motherboard: { active: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30', hover: 'hover:bg-emerald-500/10 hover:text-emerald-600' },
  cpu: { active: 'bg-blue-500/20 text-blue-600 border-blue-500/30', hover: 'hover:bg-blue-500/10 hover:text-blue-600' },
  ram: { active: 'bg-violet-500/20 text-violet-400 border-violet-500/30', hover: 'hover:bg-violet-500/10 hover:text-violet-400' },
  gpu: { active: 'bg-rose-500/20 text-rose-600 border-rose-500/30', hover: 'hover:bg-rose-500/10 hover:text-rose-600' },
  storage: { active: 'bg-amber-500/20 text-amber-600 border-amber-500/30', hover: 'hover:bg-amber-500/10 hover:text-amber-600' },
  psu: { active: 'bg-orange-500/20 text-orange-400 border-orange-500/30', hover: 'hover:bg-orange-500/10 hover:text-orange-400' },
  cooling: { active: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', hover: 'hover:bg-cyan-500/10 hover:text-cyan-400' },
  case: { active: 'bg-indigo-100 text-indigo-600 border-indigo-500/30', hover: 'hover:bg-indigo-500/10 hover:text-indigo-600' },
};

/** Render spesifikasi ringkas per kategori */
function SpecBadges({ item }) {
  const s = item.specs;
  const badges = [];

  switch (item.category) {
    case 'motherboard':
      badges.push(s.socket, s.ddr, s.chipset, s.formFactor);
      break;
    case 'cpu':
      badges.push(`${s.cores}C/${s.threads}T`, `${s.boostClock}GHz`, `${s.tdp}W`, s.socket);
      break;
    case 'ram':
      badges.push(s.ddr, `${s.capacity}GB`, `${s.speed}MHz`, s.latency);
      break;
    case 'gpu':
      badges.push(`${s.vram}GB ${s.vramType}`, `${s.tdp}W`, s.pcie, s.brand);
      break;
    case 'storage':
      badges.push(s.type, `${s.capacity >= 1000 ? (s.capacity/1000)+'TB' : s.capacity+'GB'}`, `${s.readSpeed}MB/s R`);
      break;
    case 'psu':
      badges.push(`${s.wattage}W`, s.efficiency, s.modular ? 'Modular' : 'Non-Modular');
      break;
    case 'cooling':
      badges.push(s.type, `≤${s.maxTdp}W TDP`, `${s.noise}dB`);
      break;
    case 'case':
      badges.push(s.formFactor, `${s.fans} Fan`, s.tempered_glass ? 'TG' : 'Acrylic');
      break;
  }

  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {badges.filter(Boolean).map((b, i) => (
        <span key={i} className="px-1.5 py-0.5 bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-700 rounded text-[9px] font-bold text-secondary">
          {b}
        </span>
      ))}
    </div>
  );
}

function PcShopAdmin() {
  const [activeCategory, setActiveCategory] = useState('motherboard');
  
  const categoryItems = PC_COMPONENTS[activeCategory] || [];
  const CatIcon = CATEGORY_ICONS[activeCategory];
  const colors = CATEGORY_COLORS[activeCategory];

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 bg-slate-50 dark:bg-slate-950">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <ShoppingCart size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-foreground">Manajemen Hardware (PC Shop)</h2>
            <p className="text-sm text-secondary">Kelola ketersediaan komponen, harga koin, dan syarat level untuk mahasiswa.</p>
          </div>
        </div>
        <button className="bg-primary text-white font-bold py-2.5 px-5 rounded-xl hover:bg-primary-hover shadow-md flex items-center gap-2">
          + Tambah Komponen
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
        {ASSEMBLY_CATEGORIES.map(cat => {
          const Icon = CATEGORY_ICONS[cat];
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border shrink-0 ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400'
                  : 'bg-[var(--bg-surface)] border-border dark:border-slate-800 text-secondary hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon size={16} /> {CATEGORY_LABELS[cat]}
            </button>
          );
        })}
      </div>

      <div className="bg-[var(--bg-surface)] rounded-2xl border border-border dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-border dark:border-slate-800">
              <th className="p-4 text-xs font-bold text-secondary uppercase">Item</th>
              <th className="p-4 text-xs font-bold text-secondary uppercase">Spesifikasi</th>
              <th className="p-4 text-xs font-bold text-secondary uppercase">Harga (Koin)</th>
              <th className="p-4 text-xs font-bold text-secondary uppercase">Min Level</th>
              <th className="p-4 text-xs font-bold text-secondary uppercase text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {categoryItems.map(item => (
              <tr key={item.id} className="border-b border-border dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-900 rounded-lg flex items-center justify-center text-xl border border-slate-200 dark:border-slate-700">
                      {item.emoji}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{item.name}</p>
                      <p className="text-[10px] text-secondary truncate max-w-[200px]">{item.desc}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <SpecBadges item={item} />
                </td>
                <td className="p-4 font-bold text-amber-600">🪙 {item.price.toLocaleString('id-ID')}</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-md text-xs font-bold border border-indigo-100 dark:border-indigo-500/20">
                    Lv. {item.minLevel}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <div className="flex justify-center gap-2">
                    <button className="px-3 py-1.5 text-xs font-bold bg-[var(--bg-surface)] border border-border dark:border-slate-700 rounded-lg text-secondary hover:bg-slate-50 dark:hover:bg-slate-800">Edit</button>
                    <button className="px-3 py-1.5 text-xs font-bold bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20">Hapus</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categoryItems.length === 0 && (
          <div className="p-8 text-center text-secondary text-sm">Tidak ada komponen dalam kategori ini.</div>
        )}
      </div>
    </div>
  );
}

export default function PcShop({ coins, studentId, token, apiUrl, inventory, onPurchase, completedLevels = [], userRole }) {
  const [activeCategory, setActiveCategory] = useState('motherboard');
  const [buying, setBuying] = useState(null);
  const [selling, setSelling] = useState(null);
  const [message, setMessage] = useState(null);

  if (userRole === 'dosen') return <PcShopAdmin />;

  const maxCompletedLevel = completedLevels.length > 0 ? Math.max(...completedLevels) : 0;

  const isUnlocked = (item) => {
    if (item.unlocked) return true;
    return item.minLevel ? maxCompletedLevel >= item.minLevel : true;
  };

  const isOwned = (itemId) => inventory.some(inv => inv.component_id === itemId);

  const ownedInCategory = (category) => {
    const items = PC_COMPONENTS[category] || [];
    return items.some(item => isOwned(item.id));
  };

  const handleBuy = async (item) => {
    if (coins < item.price) {
      setMessage({ type: 'error', text: 'Koin tidak cukup! Selesaikan lebih banyak kuis.' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    setBuying(item.id);
    try {
      const res = await fetch(`${apiUrl}/api/pc-quest/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ student_id: studentId, component_id: item.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `🎉 ${item.name} berhasil dibeli!` });
        if (onPurchase) onPurchase(data.coins);
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch {
      setMessage({ type: 'error', text: 'Gagal terhubung ke server.' });
    } finally {
      setBuying(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleSell = async (item) => {
    setSelling(item.id);
    try {
      const res = await fetch(`${apiUrl}/api/pc-quest/sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ student_id: studentId, component_id: item.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `${item.name} dijual! +${Math.floor(item.price * 0.7)} koin` });
        if (onPurchase) onPurchase(data.coins);
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch {
      setMessage({ type: 'error', text: 'Gagal terhubung ke server.' });
    } finally {
      setSelling(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const categoryItems = PC_COMPONENTS[activeCategory] || [];
  const colors = CATEGORY_COLORS[activeCategory];
  const CatIcon = CATEGORY_ICONS[activeCategory];

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
            <ShoppingCart size={20} className="text-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground">PC Hardware Shop</h2>
            <p className="text-secondary text-xs">Pilih komponen terbaik — Unlock by Knowledge Level</p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 p-3 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-top-2 ${
          message.type === 'success' ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'
        }`}>
          {message.text}
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto custom-scrollbar pb-2">
        {ASSEMBLY_CATEGORIES.map(cat => {
          const Icon = CATEGORY_ICONS[cat];
          const catColors = CATEGORY_COLORS[cat];
          const isActive = activeCategory === cat;
          const owned = ownedInCategory(cat);

          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                isActive
                  ? catColors.active
                  : `bg-[var(--bg-surface)] shadow-sm border-border dark:border-slate-800 text-secondary ${catColors.hover}`
              }`}
            >
              <Icon size={14} />
              <span className="hidden lg:inline">{CATEGORY_LABELS[cat]}</span>
              <span className="lg:hidden">{CATEGORY_EMOJIS[cat]}</span>
              {owned && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Shop Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {categoryItems.map(item => {
          const unlocked = isUnlocked(item);
          const owned = isOwned(item.id);

          return (
            <div
              key={item.id}
              className={`relative bg-white/[0.03] border rounded-2xl overflow-hidden transition-all ${
                owned
                  ? 'border-emerald-500/30 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                  : unlocked
                    ? 'border-border hover:border-border hover:bg-white/[0.05]'
                    : 'border-border opacity-40'
              }`}
            >
              {/* Emoji Preview */}
              <div className="h-24 bg-[#080c1a] border-b border-border flex items-center justify-center relative overflow-hidden">
                {!unlocked && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10">
                    <Lock size={20} className="text-secondary mb-1" />
                    <span className="text-[9px] text-secondary font-bold">Level {item.minLevel}</span>
                  </div>
                )}
                {owned && (
                  <div className="absolute top-2 right-2 z-10 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <Check size={14} className="text-foreground" />
                  </div>
                )}
                <span className="text-4xl">{item.emoji}</span>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-bold text-sm text-foreground mb-0.5 leading-tight">{item.name}</h3>
                <p className="text-[10px] text-secondary leading-relaxed mb-2">{item.desc}</p>

                {/* Spec Badges */}
                <SpecBadges item={item} />

                {/* Price */}
                <div className="flex items-center gap-1 mt-3 mb-3">
                  <span className="text-amber-600 font-black text-sm">🪙 {item.price.toLocaleString('id-ID')}</span>
                </div>

                {/* Actions */}
                {!unlocked ? (
                  <p className="text-[10px] text-secondary font-medium">🔒 Selesaikan Quiz Lv.{item.minLevel}</p>
                ) : owned ? (
                  <button
                    onClick={() => handleSell(item)}
                    disabled={selling === item.id}
                    className="w-full py-2 text-xs font-bold bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-700 text-secondary rounded-lg hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 transition-all flex items-center justify-center gap-1"
                  >
                    <ArrowLeftRight size={12} /> Jual (70% refund)
                  </button>
                ) : (
                  <button
                    onClick={() => handleBuy(item)}
                    disabled={buying === item.id || coins < item.price}
                    className={`w-full py-2 text-xs font-bold rounded-lg transition-all ${
                      coins >= item.price
                        ? 'bg-indigo-500 text-foreground hover:bg-indigo-400 shadow-md shadow-indigo-500/20'
                        : 'bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 text-secondary cursor-not-allowed'
                    }`}
                  >
                    {buying === item.id ? 'Membeli...' : coins >= item.price ? 'Beli' : 'Koin Kurang'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { PC_COMPONENTS };
