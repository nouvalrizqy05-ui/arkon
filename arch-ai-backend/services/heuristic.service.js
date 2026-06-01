const PC_COMPONENTS_DATA = {
  motherboard: {
    'mobo_amd_a520': { socket: 'AM4', ddr: 'DDR4', maxRam: 64 },
    'mobo_amd_x370': { socket: 'AM4', ddr: 'DDR4', maxRam: 64 },
    'mobo_amd_b550': { socket: 'AM4', ddr: 'DDR4', maxRam: 128 },
    'mobo_intel_z590': { socket: 'LGA1200', ddr: 'DDR4', maxRam: 128 }
  },
  cpu: {
    'cpu_intel_i5_10400': { socket: 'LGA1200', brand: 'Intel', tdp: 65, benchWeight: { gaming: 65, rendering: 60 } },
    'cpu_intel_i7_11700k': { socket: 'LGA1200', brand: 'Intel', tdp: 125, benchWeight: { gaming: 85, rendering: 88 } },
    'cpu_amd_r5_5600x': { socket: 'AM4', brand: 'AMD', tdp: 65, benchWeight: { gaming: 75, rendering: 70 } },
    'cpu_amd_r7_5800x': { socket: 'AM4', brand: 'AMD', tdp: 105, benchWeight: { gaming: 90, rendering: 88 } }
  },
  ram: {
    'ram_ddr4_8gb': { ddr: 'DDR4', capacity: 8 },
    'ram_ddr4_16gb': { ddr: 'DDR4', capacity: 16 },
    'ram_ddr5_16gb': { ddr: 'DDR5', capacity: 16 },
    'ram_ddr5_32gb': { ddr: 'DDR5', capacity: 32 }
  },
  gpu: {
    'gpu_gtx_1660s': { brand: 'NVIDIA', tdp: 160, benchWeight: { gaming: 55, rendering: 45 } },
    'gpu_rtx_3060': { brand: 'NVIDIA', tdp: 200, benchWeight: { gaming: 75, rendering: 68 } },
    'gpu_rtx_4070': { brand: 'NVIDIA', tdp: 450, benchWeight: { gaming: 98, rendering: 95 } },
    'gpu_rx_6700xt': { brand: 'AMD', tdp: 230, benchWeight: { gaming: 70, rendering: 60 } }
  },
  psu: {
    'psu_500w_bronze': { wattage: 500 },
    'psu_750w_gold': { wattage: 750 },
    'psu_1000w_platinum': { wattage: 1000 }
  }
};

/**
 * 1. ANALYZE PC WORK (HEURISTIC)
 */
function analyzePcBuild(components) {
  let mobo = null, cpu = null, ram = [], gpu = null, psu = null, storage = null;
  
  // Identify components
  components.forEach(comp => {
    if (PC_COMPONENTS_DATA.motherboard[comp.id]) mobo = PC_COMPONENTS_DATA.motherboard[comp.id];
    if (PC_COMPONENTS_DATA.cpu[comp.id]) cpu = PC_COMPONENTS_DATA.cpu[comp.id];
    if (PC_COMPONENTS_DATA.ram[comp.id]) ram.push(PC_COMPONENTS_DATA.ram[comp.id]);
    if (PC_COMPONENTS_DATA.gpu[comp.id]) gpu = PC_COMPONENTS_DATA.gpu[comp.id];
    if (PC_COMPONENTS_DATA.psu[comp.id]) psu = PC_COMPONENTS_DATA.psu[comp.id];
    if (comp.id.startsWith('storage')) storage = comp;
  });

  // Missing critical parts
  if (!mobo || !cpu || ram.length === 0 || !psu) {
    return "⚠️ Ada komponen utama yang hilang! Pastikan CPU, Motherboard, RAM, dan Power Supply terpasang sebelum menyalakan PC.";
  }

  // Socket Mismatch
  if (mobo.socket !== cpu.socket) {
    return `⚠️ Fatal Error: Socket tidak cocok! Prosesor ${cpu.brand} (${cpu.socket}) tidak bisa dipasang pada Motherboard dengan socket ${mobo.socket}. Pin prosesor bisa patah jika dipaksakan.`;
  }

  // RAM Mismatch
  for (let r of ram) {
    if (mobo.ddr !== r.ddr) {
      return `⚠️ Fatal Error: Slot RAM tidak cocok! Motherboard ini dirancang untuk ${mobo.ddr}, tetapi Anda memasang RAM bertipe ${r.ddr}.`;
    }
  }

  // Wattage check
  const cpuTdp = cpu.tdp || 65;
  const gpuTdp = gpu ? (gpu.tdp || 150) : 0;
  const totalTdp = cpuTdp + gpuTdp + 50; // +50 for mobo/ram/storage
  
  if (psu.wattage < totalTdp) {
    return `⚠️ Peringatan Daya: Total kebutuhan sistem (${totalTdp}W) melampaui kapasitas Power Supply (${psu.wattage}W). PC berisiko mati mendadak saat full-load.`;
  }

  // Bottleneck check
  if (gpu) {
    const cpuScore = cpu.benchWeight.gaming;
    const gpuScore = gpu.benchWeight.gaming;
    const ratio = cpuScore / gpuScore;
    
    if (ratio < 0.6) {
      return `💡 Tips Bottleneck: GPU yang Anda pilih terlalu kuat untuk CPU ini. CPU akan mengalami bottleneck parah (kinerja CPU mentok 100% sementara GPU tidak maksimal). Pertimbangkan upgrade CPU.`;
    }
    if (ratio > 1.8) {
      return `💡 Tips Bottleneck: CPU Anda sangat kencang, tapi GPU-nya kurang bertenaga. Untuk performa gaming seimbang, Anda bisa menabung untuk upgrade VGA ke depannya.`;
    }
  }

  // Storage missing
  if (!storage) {
    return "⚠️ Peringatan: Kamu lupa memasang Storage (HDD/SSD). PC bisa menyala ke BIOS, tapi tidak bisa menginstal Sistem Operasi Windows.";
  }

  // Perfect build
  const praises = [
    "✅ Perakitan PC yang sangat sempurna! Kompatibilitas terjaga dengan keseimbangan daya yang aman. Kerja bagus!",
    "✅ Pemilihan komponen yang cerdas. Socket dan tipe RAM cocok, dan Power Supply sangat memadai.",
    "✅ Excellent Build! Keseimbangan antara prosesor, memori, dan daya sangat presisi. Rakitan ini stabil untuk beban kerja berat."
  ];
  return praises[Math.floor(Math.random() * praises.length)];
}

/**
 * 2. ADAPTIVE HINT (HEURISTIC)
 */
function extractHintKeyword(questionText) {
  const lower = questionText.toLowerCase();
  if (lower.includes('cpu') || lower.includes('prosesor')) return 'Fungsi Utama CPU';
  if (lower.includes('ram') || lower.includes('ddr')) return 'Memori RAM Utama';
  if (lower.includes('gpu') || lower.includes('vga')) return 'Pengolah Grafis (GPU)';
  if (lower.includes('motherboard') || lower.includes('mainboard')) return 'Papan Utama (Motherboard)';
  if (lower.includes('ssd') || lower.includes('hdd') || lower.includes('storage') || lower.includes('sata') || lower.includes('nvme')) return 'Media Penyimpanan Non-Volatile';
  if (lower.includes('psu') || lower.includes('listrik') || lower.includes('daya') || lower.includes('watt')) return 'Sistem Kelistrikan PC';
  if (lower.includes('cache')) return 'SRAM Cache pada CPU';
  if (lower.includes('pipeline') || lower.includes('pipelining')) return 'Pipelining Instruksi';
  if (lower.includes('bus')) return 'Saluran Komunikasi (System Bus)';
  if (lower.includes('interrupt')) return 'Mekanisme Interupsi (Interrupt)';
  if (lower.includes('dma')) return 'Direct Memory Access (DMA)';
  if (lower.includes('register') || lower.includes('pc ') || lower.includes('ir ') || lower.includes('mar ') || lower.includes('mbr ')) return 'Register Internal CPU';
  if (lower.includes('moore')) return 'Konsep Hukum Moore';
  if (lower.includes('von neumann')) return 'Arsitektur Komputer Klasik';
  if (lower.includes('clock') || lower.includes('hz')) return 'Kecepatan Sinyal Clock';
  if (lower.includes('bios') || lower.includes('uefi') || lower.includes('cmos')) return 'Sistem Booting Dasar (BIOS/UEFI)';
  if (lower.includes('os ') || lower.includes('sistem operasi')) return 'Fungsi Sistem Operasi';
  if (lower.includes('bottleneck')) return 'Kemacetan Performa (Bottleneck)';
  
  return 'Konsep Dasar Arsitektur';
}

function generateAdaptiveHint(questionText, theta, wrongCount) {
  const keyword = extractHintKeyword(questionText);
  
  // Dictionary of professional contextual nudges
  const contextDict = {
    'Fungsi Utama CPU': 'CPU bertindak sebagai otak sistem. Pikirkan perannya dalam mengeksekusi siklus fetch-decode-execute secara berurutan.',
    'Memori RAM Utama': 'RAM bersifat volatile dan bekerja sebagai ruang kerja sementara. Bedakan kecepatannya dibandingkan storage permanen.',
    'Pengolah Grafis (GPU)': 'GPU unggul dalam pemrosesan paralel masif, berbeda dengan CPU yang optimal untuk eksekusi serial yang kompleks.',
    'Papan Utama (Motherboard)': 'Motherboard adalah jalur tulang punggung komunikasi. Pertimbangkan komponen mana yang menjembatani CPU dan RAM.',
    'Media Penyimpanan Non-Volatile': 'Fokus pada kata kunci "Non-Volatile" yang berarti data tetap tersimpan meskipun tidak ada aliran listrik.',
    'Sistem Kelistrikan PC': 'Efisiensi daya dan stabilitas tegangan adalah fungsi utama komponen ini untuk mencegah malfungsi hardware.',
    'SRAM Cache pada CPU': 'Cache dirancang untuk mengatasi kesenjangan kecepatan antara prosesor super cepat dan memori utama yang lebih lambat.',
    'Pipelining Instruksi': 'Pipelining tidak mengurangi waktu eksekusi satu instruksi tunggal, melainkan meningkatkan throughput (jumlah instruksi per satuan waktu).',
    'Saluran Komunikasi (System Bus)': 'System Bus memfasilitasi transfer data. Ingat pembagiannya menjadi Data Bus, Address Bus, dan Control Bus.',
    'Mekanisme Interupsi (Interrupt)': 'Interupsi memungkinkan CPU menghentikan sementara tugas utamanya untuk merespons kejadian asinkron dari perangkat eksternal.',
    'Direct Memory Access (DMA)': 'DMA membebaskan CPU dari tugas transfer data I/O dengan mengizinkan controller DMA mengakses memori secara langsung.',
    'Register Internal CPU': 'Register adalah puncak hierarki memori. Ini adalah ruang penyimpanan terkecil namun paling cepat yang ada langsung di dalam inti CPU.',
    'Konsep Hukum Moore': 'Hukum Moore berkaitan dengan tren historis peningkatan eksponensial jumlah transistor dalam sirkuit terpadu setiap dua tahun.',
    'Arsitektur Komputer Klasik': 'Dalam model Von Neumann, instruksi program dan data disimpan dalam ruang memori fisik yang sama secara terpadu.',
    'Kecepatan Sinyal Clock': 'Siklus clock menentukan detak sinkronisasi operasi CPU. Namun, clock yang tinggi tidak selalu menjamin IPC (Instructions Per Clock) yang besar.',
    'Sistem Booting Dasar (BIOS/UEFI)': 'BIOS atau UEFI melakukan inisialisasi hardware (POST) sebelum menyerahkan kendali kepada Sistem Operasi.',
    'Fungsi Sistem Operasi': 'Sistem Operasi adalah resource allocator. Ia menengahi komunikasi antara perangkat keras fisik dengan perangkat lunak aplikasi tingkat tinggi.',
    'Kemacetan Performa (Bottleneck)': 'Bottleneck terjadi ketika komponen paling lambat dalam sistem membatasi potensi maksimal dari komponen lain yang lebih cepat.',
    'Konsep Dasar Arsitektur': 'Evaluasi kembali hubungan fungsional dari komponen yang ditanyakan dalam hierarki sistem komputer secara keseluruhan.'
  };

  const specificContext = contextDict[keyword] || contextDict['Konsep Dasar Arsitektur'];
  
  if (wrongCount === 1) {
    return `Coba tinjau kembali pemahaman Anda terkait ${keyword}. Secara fundamental, ${specificContext}`;
  } 
  else if (wrongCount === 2) {
    if (theta < 0) {
      return `Mari kita urai konsep ini. Dalam arsitektur Stallings, ${keyword} memiliki peran spesifik: ${specificContext}. Singkirkan opsi jawaban yang melenceng dari prinsip ini.`;
    } else {
      return `Sebagai mahasiswa yang terbiasa berpikir analitis, ingat bahwa ${keyword} beroperasi dengan prinsip berikut: ${specificContext}. Evaluasi setiap opsi berdasarkan logika tersebut.`;
    }
  } 
  else {
    return `Tampaknya Anda mengalami kesulitan pada materi ${keyword}. Ingatlah prinsip kunci ini: ${specificContext}. Pikirkan opsi mana yang paling merepresentasikan fungsi arsitektural tersebut tanpa merujuk langsung ke jawaban.`;
  }
}

/**
 * 3. LEARNING PATH (HEURISTIC)
 */
function generateLearningPath(theta) {
  const roadmaps = {
    critical: {
      title: "Roadmap: Restrukturisasi Fondasi Arsitektur",
      overview: "Berdasarkan analisis pemahaman Anda, diperlukan penguatan komprehensif pada konsep-konsep paling fundamental sebelum beralih ke desain sistem yang lebih rumit.",
      topics: [
        { topic: 'Phase 1: Pengenalan Arsitektur vs Organisasi Komputer', reason: 'Anda wajib menguasai perbedaan konseptual antara atribut yang terlihat oleh programmer (arsitektur) dan detail operasional (organisasi).' },
        { topic: 'Phase 2: Struktur Toplevel (CPU, Memori, I/O)', reason: 'Langkah berikutnya adalah memetakan bagaimana tiga komponen utama ini berinteraksi melalui system bus.' },
        { topic: 'Phase 3: Representasi Data Biner dan Gerbang Logika', reason: 'Pemahaman tingkat bit sangat krusial agar Anda mengerti bagaimana data dieksekusi di level hardware terdalam.' }
      ]
    },
    low: {
      title: "Roadmap: Eksplorasi Operasi Internal Komputer",
      overview: "Anda sudah memiliki gambaran dasar yang baik. Kini saatnya membedah bagaimana instruksi berpindah dan dieksekusi di dalam inti prosesor.",
      topics: [
        { topic: 'Phase 1: Struktur Internal ALU (Arithmetic Logic Unit)', reason: 'Pahami bagaimana sirkuit logika boolean digunakan untuk merealisasikan operasi matematika di dalam prosesor.' },
        { topic: 'Phase 2: Siklus Fetch-Decode-Execute', reason: 'Ini adalah jantung arsitektur komputer. Anda perlu menguasai alur register PC, MAR, MBR, dan IR secara detail.' },
        { topic: 'Phase 3: Hierarki Memori (RAM vs Storage)', reason: 'Eksplorasi mengapa sistem komputer membutuhkan tingkatan memori yang berbeda dalam hal kecepatan, kapasitas, dan biaya.' }
      ]
    },
    average: {
      title: "Roadmap: Peningkatan Kinerja dan Efisiensi I/O",
      overview: "Kapasitas pemahaman Anda berada pada tahap menengah. Fokus selanjutnya adalah mempelajari teknik-teknik optimasi untuk mengatasi batasan performa dasar.",
      topics: [
        { topic: 'Phase 1: Mekanisme Interupsi (Interrupt-driven I/O)', reason: 'Pelajari bagaimana CPU menghindari pemborosan siklus tunggu (polling) dengan beralih ke model eksekusi berbasis interupsi.' },
        { topic: 'Phase 2: Direct Memory Access (DMA)', reason: 'Tingkatkan pemahaman efisiensi bus dengan mempelajari pendelegasian wewenang transfer I/O masif ke kontroler eksternal.' },
        { topic: 'Phase 3: Pipelining Dasar', reason: 'Pahami teknik paralelisme instruksi pertama, membagi eksekusi menjadi beberapa tahap agar throughput CPU meningkat tajam.' }
      ]
    },
    high: {
      title: "Roadmap: Desain Arsitektur Modern",
      overview: "Analisis IRT menunjukkan kemampuan analitik yang sangat solid. Anda siap untuk menyelami arsitektur tingkat lanjut yang dipakai di industri saat ini.",
      topics: [
        { topic: 'Phase 1: RISC vs CISC Architecture', reason: 'Kaji secara kritis dua filosofi perancangan set instruksi (Instruction Set Architecture) yang membentuk sejarah mikroprosesor dunia.' },
        { topic: 'Phase 2: Superscalar Execution & Branch Prediction', reason: 'Pelajari teknik prediksi percabangan dan peluncuran instruksi ganda per siklus clock untuk memaksimalkan utilitas pipeline.' },
        { topic: 'Phase 3: Cache Mapping dan Prinsip Lokalitas', reason: 'Dalam era big data, teknik Direct, Associative, dan Set-Associative Mapping sangat penting untuk menjaga CPU tidak kelaparan data.' }
      ]
    },
    genius: {
      title: "Roadmap: Komputasi Kinerja Tinggi (HPC) & Server",
      overview: "Luar biasa! Kapasitas kognitif Anda melampaui kurikulum standar. Berikut adalah roadmap penelitian mandiri untuk level Advanced Computer Architecture.",
      topics: [
        { topic: 'Phase 1: Cache Coherence pada Multi-core Processing', reason: 'Teliti protokol MESI/MOESI yang mencegah anomali data saat berbagai core saling berbagi memori dalam satu silikon.' },
        { topic: 'Phase 2: Symmetric Multiprocessing (SMP) & NUMA', reason: 'Pahami arsitektur server perusahaan raksasa yang menggunakan puluhan CPU fisik secara terpadu.' },
        { topic: 'Phase 3: GPU Compute & Arsitektur Non-Silicon (Quantum)', reason: 'Eksplorasi perbedaan drastis antara komputasi CPU serial masif dengan GPU paralel masif, hingga visi arsitektur Quantum.' }
      ]
    }
  };

  let poolName = 'average';
  if (theta < -2.0) poolName = 'critical';
  else if (theta < -0.5) poolName = 'low';
  else if (theta > 2.5) poolName = 'genius';
  else if (theta >= 1.0) poolName = 'high';

  const roadmap = roadmaps[poolName];
  
  // Format the output to merge the overview into a comprehensive professional roadmap
  const recommendations = roadmap.topics.map(t => ({
    topic: t.topic,
    reason: t.reason
  }));
  
  // Inject the overview into the first recommendation's reason to make it a continuous narrative if needed,
  // or add a special index 0 item acting as the Roadmap Title.
  recommendations.unshift({
    topic: roadmap.title,
    reason: roadmap.overview
  });

  return recommendations;
}

/**
 * 4. ANALYTICS SUMMARY FOR LECTURERS (HEURISTIC)
 */
function generateAnalyticsSummary(classData, roomName) {
  const { totalStudents, avgTheta, atRisk, avgNGain } = classData;
  
  if (totalStudents === 0) {
    return `Kelas ${roomName} saat ini belum memiliki mahasiswa terdaftar atau belum ada data aktivitas yang tercatat.`;
  }

  let text = `📊 Berdasarkan data dari ${totalStudents} mahasiswa di kelas ${roomName}, `;

  if (avgTheta > 1.0) {
    text += `kapasitas kognitif kelas secara umum sangat baik (Rata-rata Theta: ${avgTheta.toFixed(2)}). `;
  } else if (avgTheta >= -0.5) {
    text += `performa kelas berada pada tingkat rata-rata normal (Rata-rata Theta: ${avgTheta.toFixed(2)}). `;
  } else {
    text += `terdapat indikasi kesulitan pemahaman materi secara menyeluruh (Rata-rata Theta: ${avgTheta.toFixed(2)}). `;
  }

  if (avgNGain > 0.7) {
    text += `Efektivitas pembelajaran tergolong TINGGI dengan peningkatan N-Gain ${avgNGain.toFixed(2)}. `;
  } else if (avgNGain >= 0.3) {
    text += `Peningkatan pemahaman (N-Gain) tergolong SEDANG. `;
  } else if (avgNGain > 0) {
    text += `Sayangnya, peningkatan N-Gain sangat RENDAH (${avgNGain.toFixed(2)}). `;
  }

  if (atRisk > 0) {
    text += `🎯 Perhatian Khusus: Ada ${atRisk} mahasiswa dalam kategori risiko tinggi (Theta < -1) yang membutuhkan intervensi pedagogik secepatnya. `;
  } else {
    text += `🏆 Highlight: Tidak ada mahasiswa yang berada dalam kategori risiko kritis saat ini. `;
  }

  // Recommendations
  if (avgTheta < 0) {
    text += `💡 Rekomendasi: Kurangi laju pengajaran dan perbanyak repetisi pada konsep-konsep dasar (seperti Organisasi Memori dan ALU).`;
  } else if (atRisk > totalStudents * 0.2) {
    text += `💡 Rekomendasi: Fokuskan strategi pengajaran pada sesi remedial atau diskusi kelompok untuk mahasiswa berisiko tinggi.`;
  } else {
    text += `💡 Rekomendasi: Anda dapat mulai memberikan materi yang lebih menantang seperti Pipeline dan Multicore Processing untuk menjaga stimulasi kognitif mahasiswa.`;
  }

  return text;
}

module.exports = {
  analyzePcBuild,
  generateAdaptiveHint,
  generateLearningPath,
  generateAnalyticsSummary
};
