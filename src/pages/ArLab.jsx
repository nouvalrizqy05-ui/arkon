import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers, ArrowLeft, Cpu, HardDrive, CircuitBoard, MemoryStick,
  MonitorSpeaker, Fan, Zap, RotateCcw, Smartphone, X,
  View, Maximize2, PlayCircle, AlertCircle, CheckCircle, Award, Box
} from 'lucide-react';
import { useAchievements, AchievementToast } from '../components/AchievementSystem';
import SkeletonLoader from '../components/SkeletonLoader';
import ErrorBoundary from '../components/ErrorBoundary';

function ArLabAdmin() {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 bg-slate-50 dark:bg-slate-950">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Layers size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-foreground">Manajemen AR Laboratory</h2>
            <p className="text-sm text-secondary">Kelola koleksi aset 3D dan deskripsi materi komponen PC.</p>
          </div>
        </div>
        <button className="bg-primary text-white font-bold py-2.5 px-5 rounded-xl hover:bg-primary-hover shadow-md flex items-center gap-2">
          + Upload Aset 3D (.glb)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {COMPONENTS.map(comp => (
          <div key={comp.id} className="bg-[var(--bg-surface)] rounded-2xl border border-border dark:border-slate-800 shadow-sm overflow-hidden group">
            <div className={`h-32 bg-gradient-to-br ${comp.color} flex items-center justify-center relative`}>
              <comp.icon size={48} className="text-white opacity-20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="px-3 py-1 bg-black/30 backdrop-blur-md text-white text-xs font-bold rounded-full border border-white/20">
                  {MODEL_URLS[comp.id]?.src.split('/').pop()}
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <comp.icon size={16} className={`text-gradient-to-r ${comp.color.replace('from-', 'text-').split(' ')[0]}`} />
                <h3 className="font-bold text-foreground line-clamp-1">{comp.name}</h3>
              </div>
              <p className="text-xs text-secondary line-clamp-2 mb-4 h-8">{comp.description}</p>
              
              <div className="flex gap-2">
                <button className="flex-1 px-3 py-1.5 text-xs font-bold bg-[var(--bg-surface)] border border-border dark:border-slate-700 rounded-lg text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Edit Materi</button>
                <button className="flex-1 px-3 py-1.5 text-xs font-bold bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-lg text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors">Ganti 3D</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Semua GLB model dirender via /model-viewer.html?src=... (same-origin iframe)
function buildGlbViewerUrl(relativePath) {
  return `/model-viewer.html?src=${encodeURIComponent(relativePath)}`;
}

const MODEL_URLS = {
  motherboard: { type: 'glb', src: '/models/motherboard.glb' },
  cpu: { type: 'glb', src: '/models/intel_core_i3-3220_cpu.glb' },
  gpu: { type: 'glb', src: '/models/geforce_rtx_3080_graphics_card.glb' },
  ram: { type: 'glb', src: '/models/random_access_memory.glb' },
  storage: { type: 'glb', src: '/models/storage_ssd_hdd_m.2.glb' },
  psu: { type: 'glb', src: '/models/psu_power_supply_unit.glb' },
  cooling: { type: 'glb', src: '/models/pc_cooler_2.glb' },
  case: { type: 'glb', src: '/models/computer_case_based_off_of_nzxt_510b.glb' },
};

const COMPONENTS = [
  {
    id: 'motherboard',
    name: 'Motherboard',
    shortName: 'Motherboard',
    icon: CircuitBoard,
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-600',
    borderColor: 'border-purple-500/30',
    technicalName: "ATX Form Factor Motherboard with Bus Lines",
    referenceChapter: "Chapter 3",
    description: 'Bayangkan sebuah kota metropolis raksasa. Motherboard adalah aspal jalanan, lampu lalu lintas, dan jalan tol yang menghubungkan setiap gedung (komponen) agar bisa saling bertukar barang (data).',
    howItWorks: 'Terdapat "Jalan Tol" bernama PCIe untuk mengirim data berat ke GPU. Di tengahnya ada "Polisi Lalu Lintas" (Chipset) yang mengatur antrean data. Arus listrik liar dari PSU juga disaring di sini oleh komponen kecil (VRM) agar menjadi aliran listrik halus yang aman dimakan oleh CPU.',
    specs: [
      { label: 'Polisi Lalu Lintas', value: 'Chipset (PCH)' },
      { label: 'Jalan Tol Data', value: 'PCIe Lanes & FSB' },
      { label: 'Penyaring Listrik', value: 'VRM (Voltage Regulator)' },
    ],
    funFact: 'Di pojok motherboard terdapat baterai jam tangan (CMOS). Baterai inilah yang membuat PC Anda tetap ingat jam dan tanggal saat ini, meskipun kabel dicolokkan berbulan-bulan lamanya!',
  },
  {
    id: 'cpu',
    name: 'CPU (Central Processing Unit)',
    shortName: 'CPU',
    icon: Cpu,
    color: 'from-blue-500 to-primary',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-500/30',
    technicalName: "Intel Core i9 / AMD Ryzen Assembly",
    referenceChapter: "Chapter 14, 15, 16",
    description: 'Sang "Profesor Jenius". Ia mungkin tidak menyimpan banyak buku, tapi otaknya adalah yang paling cepat dalam menghitung matematika dan membuat keputusan logika di seluruh semesta komputer.',
    howItWorks: 'Profesor ini bekerja dengan ritme detak (Clock Speed) miliaran kali per detik (GHz). Setiap detiknya, ia Mengambil perintah (Fetch), Memahaminya (Decode), lalu Mengerjakannya (Execute). Ia dibantu oleh "Buku Catatan Kecil" di sakunya (Memory Cache L1/L2) agar tidak perlu capek berlari ke perpustakaan (RAM).',
    specs: [
      { label: 'Kecepatan Detak', value: 'Gigahertz (Miliar Detik)' },
      { label: 'Unit Logika Utama', value: 'ALU (Arithmetic Logic Unit)' },
      { label: 'Buku Catatan Saku', value: 'Memory Cache (L1, L2, L3)' },
    ],
    funFact: 'Di dalam sekeping logam kotak kecil ini, terdapat lebih dari 10 Miliar saklar mikroskopis bernama "Transistor". Ukuran satu saklar ini ribuan kali lebih kecil dari satu helai rambut manusia!',
  },
  {
    id: 'gpu',
    name: 'GPU (Graphics Processing Unit)',
    shortName: 'GPU',
    icon: MonitorSpeaker,
    color: 'from-rose-500 to-pink-600',
    bgColor: 'bg-rose-500/10',
    textColor: 'text-rose-600',
    borderColor: 'border-rose-500/30',
    technicalName: "Parallel Compute Unit / GPU Core",
    referenceChapter: "Chapter 17, 18",
    description: 'Jika CPU adalah 1 Profesor jenius, maka GPU adalah pabrik berisi Puluhan Ribu pekerja. Mereka mungkin tidak sejenius Profesor, tapi mereka bisa mewarnai jutaan piksel (titik cahaya) secara bersamaan!',
    howItWorks: 'Layar monitor membutuhkan 2 Juta warna baru setiap detiknya. Daripada CPU menggambar satu per satu, tugas berat ini dilempar ke GPU. Ribuan pekerja kecil (Cuda Cores) akan serentak menghitung efek cahaya, bayangan 3D, dan warna secara paralel di waktu yang sama persis.',
    specs: [
      { label: 'Pekerja Pabrik', value: 'Ribuan Cores Paralel' },
      { label: 'Meja Kerja Khusus', value: 'VRAM (Video RAM)' },
      { label: 'Tugas Utamanya', value: 'Kalkulasi Matriks & Grafis 3D' },
    ],
    funFact: 'Karena sangat hebat dalam mengerjakan ribuan tugas simpel sekaligus secara "keroyokan", GPU sekarang berevolusi menjadi otak utama untuk melatih Kecerdasan Buatan (AI) seperti ChatGPT!',
  },
  {
    id: 'ram',
    name: 'RAM (Random Access Memory)',
    shortName: 'RAM',
    icon: MemoryStick,
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-600',
    borderColor: 'border-emerald-500/30',
    technicalName: "DDR5 Dual-Channel SDRAM DIMM Module",
    referenceChapter: "Chapter 5",
    description: 'Ini adalah "Meja Kerja" komputer Anda. Semakin luas mejanya, semakin banyak tumpukan dokumen (Aplikasi/Game) yang bisa Anda buka sekaligus tanpa harus bolak-balik menyimpannya di laci lemari.',
    howItWorks: 'Meja kerja ini super cepat, tapi memiliki sifat "Lupa Ingatan" (Volatile). Data disimpan sebagai jebakan listrik halus di jutaan kapasitor kecil. Jika kabel listrik dicabut (PC mati), maka seluruh dokumen di atas meja akan menguap hilang terbawa angin.',
    specs: [
      { label: 'Jenis Meja', value: 'DRAM (Dynamic RAM)' },
      { label: 'Lalu Lintas Data', value: 'Ribuan Megahertz (MHz)' },
      { label: 'Sifat Memori', value: 'Volatile (Menguap Tanpa Daya)' },
    ],
    funFact: 'Coba perhatikan deretan gigi-gigi konektor di bagian bawah RAM. Itu sengaja dilapisi oleh emas murni asli! Emas adalah logam anti karat terbaik untuk menjaga aliran listrik tetap utuh.',
  },
  {
    id: 'storage',
    name: 'Storage (SSD / HDD)',
    shortName: 'Storage',
    icon: HardDrive,
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-600',
    borderColor: 'border-amber-500/30',
    technicalName: "Solid State Drive PCIe Gen 4 x4 Interface",
    referenceChapter: "Chapter 5 / External Storage",
    description: 'Ini adalah "Lemari Arsip Baja" komputer. Tempat di mana foto mantan, game berat, hingga sistem operasi Windows dikunci secara permanen, aman untuk selamanya walau listrik padam total.',
    howItWorks: 'Jika menggunakan Hardisk (HDD) model lama, data digurat di atas piringan kaset magnet yang berputar kencang. Tapi jika pakai SSD modern, tak ada bagian yang bergerak! SSD menjebak miliaran elektron ke dalam "Penjara Kaca Mikroskopis" (NAND Flash) untuk menyimpan wujud digital dari file Anda.',
    specs: [
      { label: 'Teknologi SSD', value: 'Chip NAND Flash (Senyap)' },
      { label: 'Teknologi HDD', value: 'Piringan Magnet & Jarum Motor' },
      { label: 'Sifat Memori', value: 'Non-Volatile (Awet Permanen)' },
    ],
    funFact: 'Di dalam HDD, jarum pembaca melayang di atas piringan dengan jarak hanya beberapa Nanometer. Sekecil apapun debu atau sehelai asap rokok masuk, jarum itu akan menabraknya seperti mobil sport menabrak tebing!',
  },
  {
    id: 'psu',
    name: 'PSU (Power Supply Unit)',
    shortName: 'PSU',
    icon: Zap,
    color: 'from-yellow-500 to-lime-600',
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-500/30',
    technicalName: "80+ Gold / Platinum Power Supply Unit",
    referenceChapter: "Hardware Maintenance",
    description: 'Jantung yang berdetak memompa darah komputer. Tanpa komponen kotak berat ini, sebuah rakitan PC gaming puluhan juta hanyalah seonggok besi rongsok tak bernyawa.',
    howItWorks: 'Listrik dari stopkontak dinding rumah Anda (AC 220V) sifatnya terlalu ganas dan bergelombang. PSU bertugas menyedotnya, "menjinakkannya", lalu mengubah arus tersebut menjadi aliran searah (DC) yang tenang di angka 12V dan 5V, lalu dipompa ke seluruh organ komputer.',
    specs: [
      { label: 'Tugas Utama', value: 'Ubah AC (Ganas) ke DC (Tenang)' },
      { label: 'Penampung Daya', value: 'Kapasitor Tabung Raksasa' },
      { label: 'Standar Mutu', value: 'Sertifikasi 80+ (Efisiensi)' },
    ],
    funFact: 'JANGAN pernah iseng membongkar kotak PSU! Kapasitor raksasa di dalamnya bertindak bagai baterai siluman, mampu menyimpan setruman tegangan tinggi yang sangat mematikan meski kabel sudah dicabut sebulan lalu.',
  },
  {
    id: 'cooling',
    name: 'Cooling System',
    shortName: 'Cooling',
    icon: Fan,
    color: 'from-cyan-500 to-sky-600',
    bgColor: 'bg-cyan-500/10',
    textColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    technicalName: "Liquid Cooling AIO / Tower Heatsink Fan",
    referenceChapter: "Thermal Management",
    description: 'Pemadam kebakaran pribadi komputer. Miliaran pergerakan elektron di CPU menghasilkan energi panas luar biasa. Sistem Pendingin bertugas menyerap dan membuang radiasi panas itu ke udara.',
    howItWorks: 'Mula-mula sebuah Gel Dingin (Thermal Paste) menjembatani CPU ke Logam Pendingin (Heatsink). Panas merambat ke atas melalui pipa-pipa logam, kemudian panas itu disebarkan ke ratusan lembaran pisau aluminium tipis agar langsung dihembus angin dari baling-baling Kipas Motor.',
    specs: [
      { label: 'Jembatan Suhu', value: 'Thermal Paste (Perak/Zinc)' },
      { label: 'Konduktor Panas', value: 'Pipa Tembaga & Sirip Aluminium' },
      { label: 'Pembuang Udara', value: 'Baling-Baling Kipas (Fan)' },
    ],
    funFact: 'Pipa tembaga pengantar panas (Heatpipe) itu ternyata KOSONG di tengahnya! Di dalamnya berisi sedikit cairan kimia khusus yang akan menguap saat kepanasan, lalu menetes kembali saat dingin—membentuk siklus hujan buatan tiada henti.',
  },
  {
    id: 'case',
    name: 'Casing (NZXT H510)',
    shortName: 'Casing',
    icon: Box,
    color: 'from-slate-500 to-gray-600',
    bgColor: 'bg-slate-500/10',
    textColor: 'text-slate-400',
    borderColor: 'border-slate-500/30',
    technicalName: "Mid-Tower ATX Case",
    referenceChapter: "Hardware Assembly",
    description: 'Rumah dari seluruh komponen komputer. Casing melindungi bagian dalam yang sensitif dari debu, benturan, dan memastikan aliran udara tetap lancar agar suhu tetap dingin.',
    howItWorks: 'Casing modern memiliki desain "Dual Chamber" atau manajemen kabel untuk merapikan aliran listrik. Ia juga bertindak sebagai "Terowongan Angin" (Wind Tunnel), di mana kipas depan menghisap udara dingin dan kipas belakang membuang udara panas.',
    specs: [
      { label: 'Material Utama', value: 'Baja SECC & Tempered Glass' },
      { label: 'Dukungan Motherboard', value: 'ATX, Micro-ATX, Mini-ITX' },
      { label: 'Manajemen Suhu', value: 'Airflow Optimization' },
    ],
    funFact: 'Panel samping casing modern biasanya terbuat dari "Tempered Glass". Kaca ini diproses dengan panas ekstrem agar 4x lebih kuat dari kaca biasa, namun jika pecah, ia akan hancur menjadi butiran tumpul yang aman.',
  },
];

// Mode Eksplorasi 3D Only
function ArLab({ embeddedMode = false, onCoinsEarned, userRole }) {
  const [selectedId, setSelectedId] = useState(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [useLodModels, setUseLodModels] = useState(false); // FR-3D-005: LOD for low-end devices
  const [webglSupported, setWebglSupported] = useState(true); // FR-3D-006: WebGL fallback

  // FR-3D-005/006: Device capability detection
  useEffect(() => {
    // Check WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) setWebglSupported(false);
    } catch { setWebglSupported(false); }

    // LOD detection: low-end devices get compressed models
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const isLowEnd = (
      (conn && ['slow-2g','2g'].includes(conn.effectiveType)) ||
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) ||
      (navigator.deviceMemory && navigator.deviceMemory <= 1)
    );
    if (isLowEnd) {
      setUseLodModels(true);
      console.info('[ArLab] Low-end device detected → LOD models active');
    }
  }, []);

  if (userRole === 'dosen') return <ArLabAdmin />;

  // FR-3D-006: Static fallback for unsupported browsers
  if (!webglSupported) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 p-8 text-center bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl">
        <div className="text-4xl mb-3">🖥️</div>
        <h3 className="font-bold text-amber-800 dark:text-amber-300 text-lg mb-2">Browser Tidak Mendukung AR/3D</h3>
        <p className="text-sm text-amber-700 dark:text-amber-400 max-w-sm leading-relaxed">
          Browser Anda tidak mendukung WebGL yang dibutuhkan untuk AR Lab.
          Gunakan Chrome 90+ atau Firefox 88+ untuk pengalaman terbaik.
        </p>
        <div className="mt-4 p-4 bg-[var(--bg-surface)] dark:bg-gray-800 rounded-xl border border-amber-200 dark:border-amber-700">
          <p className="text-xs font-semibold text-secondary dark:text-gray-400 mb-2">Komponen PC yang tersedia:</p>
          <div className="grid grid-cols-3 gap-2 text-xs text-secondary dark:text-gray-400">
            {['CPU', 'GPU', 'RAM', 'Motherboard', 'PSU', 'Storage'].map(c => (
              <span key={c} className="bg-slate-100 dark:bg-slate-800 dark:bg-gray-700 px-2 py-1 rounded-lg text-center">{c}</span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const selected = COMPONENTS.find(c => c.id === selectedId);
  const currentModel = selected ? MODEL_URLS[selected.id] : null;

  const iframeSrc = useMemo(() => {
    if (!currentModel) return null;
    if (currentModel.type === 'sketchfab') return currentModel.src;
    // Pass relative path langsung — model-viewer.html di-serve dari origin yang sama
    return buildGlbViewerUrl(currentModel.src);
  }, [currentModel]);

  const studentId = localStorage.getItem('user_id');
  const token = localStorage.getItem('auth_token');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const { unlockBadge, toastBadge, dismissToast } = useAchievements(studentId);
  const [viewedComponents, setViewedComponents] = useState(() => {
    try { return JSON.parse(localStorage.getItem('arkon_ar_viewed') || '[]'); } catch { return []; }
  });

  // Sync ar_viewed from DB on mount
  useEffect(() => {
    if (!studentId || !token) return;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/progress/${studentId}/ar_viewed`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.value && Array.isArray(data.value)) {
            setViewedComponents(data.value);
            localStorage.setItem('arkon_ar_viewed', JSON.stringify(data.value));
          }
        }
      } catch (e) {
        console.warn('AR viewed sync from DB failed:', e);
      }
    })();
  }, [studentId]);

  function handleSelectComponent(id) {
    setIsModelLoading(true);
    setSelectedId(id);

    // Track this component as viewed
    setViewedComponents(prev => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      localStorage.setItem('arkon_ar_viewed', JSON.stringify(updated));
      // Sync to DB
      if (studentId && token) {
        fetch(`${API_URL}/api/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ student_id: studentId, key: 'ar_viewed', value: updated })
        }).catch(e => console.warn('AR viewed sync to DB failed:', e));
      }
      // Check if all components have been viewed
      if (updated.length >= COMPONENTS.length && studentId) {
        unlockBadge('ar_explorer');
      }
      return updated;
    });
  }

  function handleClose() {
    setSelectedId(null);
    setIsModelLoading(false);
  }

  return (
    <div className={`${embeddedMode ? 'h-full overflow-y-auto' : 'min-h-screen'} bg-slate-50 dark:bg-[#0a0e1a] text-foreground font-sans overflow-x-hidden`}>
      {/* Header — hidden in embedded mode */}
      {!embeddedMode && (
        <div className="max-w-7xl mx-auto flex items-center justify-between h-20 px-6">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3 no-underline text-foreground hover:opacity-80 transition">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/30">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-none">ARKON</h1>
                <p className="text-[10px] text-primary font-bold tracking-wide">AR LABORATORY</p>
              </div>
            </Link>
            <div className="h-8 w-px bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 hidden md:block" />
            <Link to="/" className="hidden md:flex items-center gap-2 text-secondary hover:text-foreground transition-colors font-semibold text-sm no-underline">
              <ArrowLeft size={16} /> Kembali
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 rounded-xl text-xs font-bold text-secondary">
              <RotateCcw className="w-3.5 h-3.5" /> Putar 3D dengan drag
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <Smartphone className="w-3.5 h-3.5" /> AR pada Mobile
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`${embeddedMode ? 'pt-4' : 'pt-28'} pb-16 px-6`}>
        <div className="max-w-7xl mx-auto">

          {/* Video Anatomi Komputer */}
          <div className="max-w-3xl mx-auto mb-16">
            <div className="relative rounded-[2rem] overflow-hidden border border-border dark:border-slate-800 bg-white/50 dark:bg-white/[0.02] shadow-2xl p-2 md:p-3 backdrop-blur-sm">
              <div className="aspect-video w-full rounded-[1.5rem] overflow-hidden bg-[#050505] relative border border-border dark:border-slate-800 group shadow-inner">
                <video
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.01]"
                  controls
                  loop
                  playsInline
                >
                  <source src="/Anatomi_Komputer.mp4" type="video/mp4" />
                  Browser Anda tidak mendukung pemutaran video.
                </video>
              </div>

              <div className="mt-8 px-4 md:px-8 pb-6 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs font-bold mb-4 shadow-sm shadow-primary/20">
                  <PlayCircle className="w-3.5 h-3.5" /> Pengantar Anatomi Hardware
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-foreground mb-4 tracking-tight">
                  Eksplorasi & Dekonstruksi Komputer
                </h3>
                <p className="text-secondary text-sm md:text-base leading-relaxed max-w-3xl mx-auto font-medium">
                  Saksikan perjalanan membedah anatomi komputer komponen demi komponen. Video ini akan menyingkap
                  rahasia di balik arsitektur perangkat keras dan bagaimana mereka saling terhubung. Pelajari anatomi
                  penyusunnya sebelum Anda mengeksplorasinya secara interaktif dalam bentuk 3D di bawah.
                </p>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400">
                AR Computer Lab
              </span>
            </h2>
            <p className="text-secondary text-lg max-w-2xl mx-auto font-medium">
              Mode Eksplorasi untuk membedah komponen 3D dan melihat detail arsitekturnya.
            </p>
          </div>

          <div>
              {/* Instruction Banner */}
              <div className="max-w-3xl mx-auto mb-10 p-4 bg-gradient-to-r from-primary/20 to-primary/20 border border-primary/30 rounded-2xl flex items-start gap-4">
                <View className="w-8 h-8 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-foreground font-bold text-sm mb-1">Cara Menggunakan AR</h4>
                  <p className="text-secondary text-xs leading-relaxed">
                    1. Klik komponen di bawah untuk membuka 3D Viewer &nbsp;→&nbsp;
                    2. Putar model 3D dengan mouse/touch &nbsp;→&nbsp;
                    3. Di <strong className="text-primary">smartphone</strong>, klik tombol <strong className="text-primary">AR</strong> (ikon kubus) untuk menempatkan komponen di dunia nyata.
                  </p>
                </div>
              </div>

              {/* Component Selector Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-10">
                {COMPONENTS.map((comp) => (
                  <button
                    key={comp.id}
                    id={`comp-btn-${comp.id}`}
                    onClick={() => handleSelectComponent(comp.id)}
                    className={`group relative p-4 rounded-2xl border transition-all duration-300 cursor-pointer text-center flex flex-col items-center gap-3
                  ${selectedId === comp.id
                        ? `bg-gradient-to-br ${comp.color} border-transparent shadow-xl scale-[1.05]`
                        : 'bg-[var(--bg-surface)] dark:bg-white/[0.04] border-border hover:border-border dark:border-slate-800 dark:hover:bg-white/[0.08] shadow-sm'
                      }`}
                  >
                    <comp.icon className={`w-7 h-7 ${selectedId === comp.id ? 'text-foreground' : comp.textColor}`} />
                    <span className={`text-[10px] sm:text-xs font-bold leading-tight ${selectedId === comp.id ? 'text-foreground' : 'text-secondary'}`}>
                      {comp.shortName}
                    </span>
                  </button>
                ))}
              </div>

              {/* 3D Viewer + Info Panel */}
              {selected ? (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                  {/* 3D Model Viewer (3 cols) */}
                  <div className="lg:col-span-3 relative">
                    <div className={`rounded-[2rem] overflow-hidden border ${selected.borderColor} bg-[var(--bg-surface)] dark:bg-gradient-to-br dark:from-white/[0.03] dark:to-white/[0.01] shadow-2xl`}>

                      {/* Header Bar */}
                      <div className={`px-6 py-4 border-b border-border dark:border-slate-800 bg-gradient-to-r ${selected.color} flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                          <selected.icon className="w-5 h-5 text-white" />
                          <h3 className="font-black text-white">{selected.name}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-white/20 backdrop-blur-sm shadow-sm rounded-full text-[10px] font-bold text-white">3D Model</span>
                          <button
                            id="close-model-viewer"
                            onClick={handleClose}
                            title="Tutup viewer"
                            className="w-8 h-8 bg-white/20 backdrop-blur-sm shadow-sm hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </div>

                      {/* Model Viewer Container */}
                      <div className="relative bg-slate-100 dark:bg-[#050505] w-full h-[400px] md:h-[500px] lg:h-[650px] overflow-hidden">

                        {/* React-side Loading Skeleton */}
                        {isModelLoading && (
                          <div className="absolute inset-0 bg-[var(--bg-surface)] z-10">
                            <SkeletonLoader variant="simulator" />
                          </div>
                        )}

                        {iframeSrc && (
                          /* Fix #4: aria fallback untuk model-viewer 3D (NFR-A11Y-004) */
                          <div
                            role="img"
                            aria-label={`3D Model interaktif: ${selected?.name || 'Komponen PC'}`}
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                          >
                            <span className="sr-only">
                              Model 3D interaktif untuk komponen {selected?.name || 'PC'}.
                              {selected?.description ? ` ${selected.description}` : ''}
                              Gunakan mouse atau sentuhan untuk memutar dan memperbesar tampilan 3D.
                            </span>
                            <iframe
                              key={selected.id}
                              id={`model-iframe-${selected.id}`}
                              title={`3D Model interaktif: ${selected.name}`}
                              src={iframeSrc}
                              allow="autoplay, fullscreen, xr-spatial-tracking"
                              sandbox="allow-same-origin allow-scripts"
                              onLoad={() => setIsModelLoading(false)}
                              onError={() => {
                                console.error(`Failed to load model iframe for ${selected.id}`);
                                setIsModelLoading(false);
                              }}
                              className="absolute inset-0 w-full h-full outline-none"
                              style={{ width: '100%', height: '100%', border: 'none' }}
                              aria-hidden="true"
                            />
                          </div>
                        )}
                      </div>

                      {/* Bottom bar */}
                      <div className="px-6 py-3 border-t border-border dark:border-slate-800 bg-[var(--bg-surface)] dark:bg-white/[0.02] flex items-center justify-between">
                        <p className="text-secondary text-xs font-medium">Drag untuk memutar • Scroll untuk zoom • Pinch di mobile</p>
                        <div className="flex items-center gap-2 text-secondary text-xs">
                          <Maximize2 className="w-3.5 h-3.5" /> 3D Interactive
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info Panel (2 cols) */}
                  <div className="lg:col-span-2 space-y-5">

                    {/* Description */}
                    <div className={`p-6 rounded-2xl border ${selected.borderColor} bg-[var(--bg-surface)] dark:bg-white/[0.03] relative overflow-hidden shadow-sm`}>
                      <div className="flex flex-col mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-black text-xl ${selected.textColor}`}>{selected.shortName}</h4>
                          {selected.referenceChapter && (
                            <span className="px-2 py-0.5 bg-[var(--bg-surface)] shadow-sm text-secondary text-[9px] font-bold uppercase rounded-md border border-border dark:border-slate-700">
                              {selected.referenceChapter}
                            </span>
                          )}
                        </div>
                        {selected.technicalName && (
                          <span className="text-secondary text-[10px] font-mono uppercase tracking-widest font-bold">
                            {selected.technicalName}
                          </span>
                        )}
                      </div>
                      <p className="text-secondary text-sm leading-relaxed font-medium">{selected.description}</p>
                    </div>

                    {/* How it Works */}
                    <div className={`p-6 rounded-2xl border ${selected.borderColor} bg-gradient-to-br ${selected.bgColor}`}>
                      <h4 className="font-black text-sm text-foreground mb-2">⚙️ Cara Kerja</h4>
                      <p className="text-secondary text-xs leading-relaxed">{selected.howItWorks}</p>
                    </div>

                    {/* Specs */}
                    <div className="space-y-2">
                      {selected.specs.map((spec, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-[var(--bg-surface)] dark:bg-white/[0.03] border border-border dark:border-slate-800 rounded-xl shadow-sm">
                          <span className="text-secondary text-xs font-bold">{spec.label}</span>
                          <span className="text-foreground font-bold text-xs">{spec.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Fun Fact */}
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                      <p className="text-amber-600 font-black text-xs mb-1">💡 Tahukah Kamu?</p>
                      <p className="text-amber-200/80 text-xs">{selected.funFact}</p>
                    </div>

                    {/* AR Mobile CTA */}
                    <div className="p-5 bg-gradient-to-r from-purple-500/20 to-primary/20 border border-purple-500/30 rounded-2xl text-center">
                      <Smartphone className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <h4 className="text-foreground font-black text-sm mb-1">Lihat dalam AR</h4>
                      <p className="text-secondary text-[11px] font-medium">
                        Buka halaman ini di smartphone → klik tombol &quot;View in AR&quot; pada model 3D di atas.
                      </p>
                    </div>

                    {/* Quiz CTA — connect ArLab → Quiz */}
                    <div className="p-5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-2xl text-center">
                      <h4 className="text-foreground font-black text-sm mb-1">🎮 Uji Pemahamanmu!</h4>
                      <p className="text-secondary text-[11px] font-medium mb-3">
                        Sudah eksplorasi {selected.shortName}? Coba jawab quiz tentang komponen ini.
                      </p>
                      {embeddedMode ? (
                        <button
                          onClick={() => window.dispatchEvent(new CustomEvent('arkon-navigate', { detail: { tab: 'quiz' } }))}
                          className="px-5 py-2 bg-emerald-500 text-foreground rounded-xl text-xs font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/30"
                        >
                          Mulai Quiz →
                        </button>
                      ) : (
                        <a
                          href="/workspace"
                          className="inline-block px-5 py-2 bg-emerald-500 text-foreground rounded-xl text-xs font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/30 no-underline"
                        >
                          Buka Quiz di Workspace →
                        </a>
                      )}
                    </div>

                    {/* Close button (mobile-friendly) */}
                    <button
                      id="close-panel-btn"
                      onClick={handleClose}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--bg-surface)] dark:bg-white/[0.04] border border-border dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-white/[0.08] rounded-2xl text-secondary hover:text-foreground text-sm font-bold transition-all duration-200"
                    >
                      <X className="w-4 h-4" /> Tutup Panel
                    </button>
                  </div>
                </div>
              ) : (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-20 bg-[var(--bg-surface)] dark:bg-white/[0.02] border border-border dark:border-slate-800 border-dashed rounded-[2rem]">
                  <CircuitBoard className="w-16 h-16 text-secondary mb-6" />
                  <h3 className="text-xl font-black text-secondary mb-2">Pilih Komponen</h3>
                  <p className="text-secondary text-sm font-medium">Klik salah satu komponen di atas untuk melihat model 3D dan detail arsitekturnya.</p>
                </div>
              )}
            </div>

        </div>
      </main>

      <AchievementToast badge={toastBadge} onDismiss={dismissToast} />
    </div>
  );
}

export default function ArLabWithErrorBoundary(props) {
  return (
    <ErrorBoundary name="AR Laboratory">
      <ArLab {...props} />
    </ErrorBoundary>
  );
}
