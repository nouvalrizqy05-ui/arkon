export const DETECTIVE_LEVELS = [
  {
    id: 1,
    name: "Sang Otak Komputer",
    componentId: "cpu",
    modelSrc: "/models/intel_core_i3-3220_cpu.glb",
    clues: [
      "Saya adalah otak dari seluruh operasi di dalam komputer.",
      "Saya bekerja dengan ritme detak (Clock Speed) dalam satuan Gigahertz.",
      "Di dalam tubuh saya terdapat miliaran transistor mikroskopis dan saya dipasang pada soket khusus."
    ],
    rewards: [50, 30, 10],
    options: [
      { id: 'cpu', label: 'CPU (Processor)' },
      { id: 'gpu', label: 'GPU (Kartu Grafis Utama)' },
      { id: 'ram', label: 'RAM (Memory)' },
      { id: 'storage', label: 'SSD (Solid State Drive)' }
    ]
  },
  {
    id: 2,
    name: "Kota Metropolis",
    componentId: "motherboard",
    modelSrc: "/models/motherboard.glb",
    clues: [
      "Saya adalah papan sirkuit utama yang menghubungkan semua komponen.",
      "Saya memiliki jalan tol data bernama PCIe dan soket khusus untuk sang Profesor.",
      "Tanpa saya, tidak ada satupun komponen yang bisa saling berkomunikasi."
    ],
    rewards: [60, 35, 15],
    options: [
      { id: 'motherboard', label: 'Motherboard' },
      { id: 'gpu_alt', label: 'GPU (Kartu Grafis Alternatif)' },
      { id: 'psu', label: 'PSU (Power Supply)' },
      { id: 'case_fan', label: 'Case Fan RGB' }
    ]
  },
  {
    id: 3,
    name: "Pabrik Pekerja Piksel",
    componentId: "gpu",
    modelSrc: "/models/geforce_rtx_3080_graphics_card.glb",
    clues: [
      "Saya ditugaskan untuk menghitung efek cahaya, bayangan, dan grafis 3D.",
      "Berbeda dengan CPU yang punya sedikit inti cerdas, saya punya ribuan inti pekerja (Cuda Cores).",
      "Gamer sangat memuja saya untuk mendapatkan FPS tinggi."
    ],
    rewards: [70, 40, 20],
    options: [
      { id: 'gpu', label: 'GPU (Kartu Grafis Utama)' },
      { id: 'gpu_alt', label: 'GPU (Kartu Grafis Alternatif)' },
      { id: 'cpu', label: 'CPU (Processor)' },
      { id: 'motherboard', label: 'Motherboard' }
    ]
  },
  {
    id: 4,
    name: "Meja Kerja Lupa Ingatan",
    componentId: "ram",
    modelSrc: "/models/random_access_memory.glb",
    clues: [
      "Saya adalah 'Meja Kerja' tempat aplikasi sementara dibuka.",
      "Kecepatan saya diukur dalam MHz, dan saya memiliki sifat Volatile.",
      "Jika listrik mati, seluruh memori saya akan langsung menguap hilang."
    ],
    rewards: [80, 45, 20],
    options: [
      { id: 'ram', label: 'RAM (Memory)' },
      { id: 'storage', label: 'SSD (Solid State Drive)' },
      { id: 'cpu', label: 'CPU (Processor)' },
      { id: 'gpu', label: 'GPU (Kartu Grafis Utama)' }
    ]
  },
  {
    id: 5,
    name: "Penjara Kaca Mikroskopis",
    componentId: "storage",
    modelSrc: "/models/storage_ssd_hdd_m.2.glb",
    clues: [
      "Saya adalah tempat penyimpanan data yang awet dan permanen.",
      "Berbeda dengan HDD, saya tidak punya bagian mekanik atau piringan berputar.",
      "Saya menjebak elektron dalam chip NAND Flash untuk menyimpan file Anda."
    ],
    rewards: [90, 50, 25],
    options: [
      { id: 'storage', label: 'SSD (Solid State Drive)' },
      { id: 'ram', label: 'RAM (Memory)' },
      { id: 'cpu', label: 'CPU (Processor)' },
      { id: 'motherboard', label: 'Motherboard' }
    ]
  },
  {
    id: 6,
    name: "Jantung Bertenaga Ganas",
    componentId: "psu",
    modelSrc: "/models/psu_power_supply_unit.glb",
    clues: [
      "Saya bertugas mengubah listrik dinding (AC) menjadi aliran searah (DC).",
      "Saya mengalirkan daya 12V, 5V, dan 3.3V ke seluruh komponen komputer.",
      "Saya memiliki sertifikasi efisiensi daya seperti 80+ Bronze atau Gold."
    ],
    rewards: [100, 60, 30],
    options: [
      { id: 'psu', label: 'PSU (Power Supply)' },
      { id: 'cooling', label: 'CPU Air Cooler' },
      { id: 'case_fan', label: 'Case Fan RGB' },
      { id: 'storage', label: 'SSD (Solid State Drive)' }
    ]
  },
  {
    id: 7,
    name: "Pemadam Kebakaran Udara",
    componentId: "cooling",
    modelSrc: "/models/pc_cooler_2.glb",
    clues: [
      "Saya mencegah CPU Anda mengalami 'Thermal Throttling' atau kepanasan.",
      "Saya memiliki pipa tembaga (heatpipe) dan sirip-sirip aluminium tipis.",
      "Saya menghembuskan udara panas keluar dengan bantuan baling-baling."
    ],
    rewards: [110, 65, 30],
    options: [
      { id: 'cooling', label: 'CPU Air Cooler' },
      { id: 'case_fan', label: 'Case Fan RGB' },
      { id: 'cpu', label: 'CPU (Processor)' },
      { id: 'gpu', label: 'GPU (Kartu Grafis Utama)' }
    ]
  },
  {
    id: 8,
    name: "Kipas RGB Kekinian",
    componentId: "case_fan",
    modelSrc: "/models/lian_li_uni_fan_sl120_rgb_white.glb",
    clues: [
      "Saya ditugaskan untuk menjaga sirkulasi udara di dalam casing tetap optimal.",
      "Saya sering dilengkapi dengan lampu RGB yang bisa diatur warnanya.",
      "Saya diletakkan di panel depan, atas, atau belakang casing komputer."
    ],
    rewards: [120, 70, 35],
    options: [
      { id: 'case_fan', label: 'Case Fan RGB' },
      { id: 'cooling', label: 'CPU Air Cooler' },
      { id: 'psu', label: 'PSU (Power Supply)' },
      { id: 'ram', label: 'RAM (Memory)' }
    ]
  },
  {
    id: 9,
    name: "Pengolah Grafis Alternatif",
    componentId: "gpu_alt",
    modelSrc: "/models/gpu_amd_rx_6700_xt.glb",
    clues: [
      "Seperti rekan saya yang lain, saya juga bertugas mengolah grafis dan game 3D.",
      "Saya memiliki arsitektur yang berbeda namun memiliki tujuan yang sama, yaitu memberikan FPS tinggi.",
      "Saya dilengkapi dengan kipas pendingin ganda dan logo ciri khas yang menyala."
    ],
    rewards: [130, 80, 40],
    options: [
      { id: 'gpu_alt', label: 'GPU (Kartu Grafis Alternatif)' },
      { id: 'gpu', label: 'GPU (Kartu Grafis Utama)' },
      { id: 'motherboard', label: 'Motherboard' },
      { id: 'psu', label: 'PSU (Power Supply)' }
    ]
  },
  {
    id: 10,
    name: "PC Perkantoran",
    componentId: "office_pc",
    modelSrc: "/models/office_pc.glb",
    clues: [
      "Saya bukan sekadar satu komponen, melainkan sebuah rakitan utuh.",
      "Saya biasa ditemukan di atas meja kantor atau sekolah.",
      "Saya tidak memiliki lampu RGB mencolok, melainkan desain yang kalem dan fungsional."
    ],
    rewards: [150, 100, 50],
    options: [
      { id: 'office_pc', label: 'PC Built-Up / Office PC' },
      { id: 'motherboard', label: 'Motherboard' },
      { id: 'psu', label: 'PSU (Power Supply)' },
      { id: 'case_fan', label: 'Case Fan RGB' }
    ]
  },
  // ═══════════════════════════════════════════════════
  // DETECTIVE ADVANCED LEVELS (Phase 4 — Stallings AOK)
  // ═══════════════════════════════════════════════════
  {
    id: 11,
    name: "Kalkulator Ajaib Biner",
    componentId: "alu",
    difficulty: "advanced",
    stallingsRef: "Ch. 9-10 — Computer Arithmetic & ALU",
    modelSrc: "/models/intel_core_i3-3220_cpu.glb",
    clues: [
      "Saya hidup di dalam CPU, bertugas melakukan semua operasi aritmatika dan logika.",
      "Saya memproses penjumlahan, pengurangan, AND, OR, XOR, dan perbandingan dalam satu siklus clock.",
      "Hasil kerja saya menghasilkan flag status: Zero (Z), Negative (N), Carry (C), dan Overflow (V)."
    ],
    rewards: [160, 100, 50],
    options: [
      { id: 'alu', label: 'ALU (Arithmetic Logic Unit)' },
      { id: 'cpu', label: 'CPU (Processor)' },
      { id: 'ram', label: 'RAM (Memory)' },
      { id: 'gpu', label: 'GPU (Kartu Grafis Utama)' }
    ]
  },
  {
    id: 12,
    name: "Gudang Kilat Tersembunyi",
    componentId: "cache",
    difficulty: "advanced",
    stallingsRef: "Ch. 4 — Cache Memory",
    modelSrc: "/models/intel_core_i3-3220_cpu.glb",
    clues: [
      "Saya adalah memori super cepat yang tersembunyi di dalam atau sangat dekat dengan CPU.",
      "Saya menyimpan salinan data yang sering diakses agar CPU tidak perlu menunggu RAM yang lambat.",
      "Saya memiliki hierarki berlapis: L1 paling cepat tapi kecil, L2 sedang, dan L3 paling besar."
    ],
    rewards: [170, 110, 55],
    options: [
      { id: 'ram', label: 'RAM (Memory)' },
      { id: 'cache', label: 'Cache Memory (L1/L2/L3)' },
      { id: 'storage', label: 'SSD (Solid State Drive)' },
      { id: 'cpu', label: 'CPU (Processor)' }
    ]
  },
  {
    id: 13,
    name: "Jalan Tol Data Raya",
    componentId: "system_bus",
    difficulty: "advanced",
    stallingsRef: "Ch. 3 — System Buses & Interconnection",
    modelSrc: "/models/motherboard.glb",
    clues: [
      "Saya adalah jalur komunikasi yang menghubungkan CPU, memori, dan perangkat I/O.",
      "Saya terdiri dari tiga jalur: Address Bus (alamat), Data Bus (isi data), dan Control Bus (sinyal kontrol).",
      "Bandwidth saya menentukan seberapa cepat data mengalir. PCIe dan QPI adalah versi modern saya."
    ],
    rewards: [180, 120, 60],
    options: [
      { id: 'motherboard', label: 'Motherboard' },
      { id: 'system_bus', label: 'System Bus (Address/Data/Control)' },
      { id: 'psu', label: 'PSU (Power Supply)' },
      { id: 'cpu', label: 'CPU (Processor)' }
    ]
  },
  {
    id: 14,
    name: "Pabrik Instruksi Bertingkat",
    componentId: "pipeline",
    difficulty: "advanced",
    stallingsRef: "Ch. 14-16 — Instruction Pipeline & Superscalar",
    modelSrc: "/models/intel_core_i3-3220_cpu.glb",
    clues: [
      "Saya adalah teknik di dalam CPU yang membagi eksekusi instruksi menjadi tahap-tahap berurutan.",
      "Tahap saya klasiknya lima: Fetch, Decode, Execute, Memory Access, dan Write Back.",
      "Berkat saya, CPU bisa memproses beberapa instruksi secara overlap — seperti ban berjalan di pabrik."
    ],
    rewards: [190, 130, 65],
    options: [
      { id: 'cpu', label: 'CPU (Processor)' },
      { id: 'alu', label: 'ALU (Arithmetic Logic Unit)' },
      { id: 'pipeline', label: 'Instruction Pipeline (Fetch-Decode-Execute)' },
      { id: 'cache', label: 'Cache Memory (L1/L2/L3)' }
    ]
  },
  {
    id: 15,
    name: "Piramida Kecepatan Memori",
    componentId: "mem_hierarchy",
    difficulty: "advanced",
    stallingsRef: "Ch. 4 — Memory Hierarchy",
    modelSrc: "/models/random_access_memory.glb",
    clues: [
      "Saya bukan satu komponen fisik, melainkan sebuah konsep arsitektur berbentuk piramida.",
      "Di puncak saya ada Register (tercepat, terkecil), lalu Cache, RAM, dan di dasar ada Storage (terbesar, terlambat).",
      "Prinsip saya memanfaatkan Locality of Reference: data yang baru diakses kemungkinan besar akan diakses lagi."
    ],
    rewards: [200, 140, 70],
    options: [
      { id: 'ram', label: 'RAM (Memory)' },
      { id: 'storage', label: 'SSD (Solid State Drive)' },
      { id: 'cache', label: 'Cache Memory (L1/L2/L3)' },
      { id: 'mem_hierarchy', label: 'Memory Hierarchy (Register→Cache→RAM→Disk)' }
    ]
  }
];

export const DETECTIVE_OPTIONS = [
  { id: 'cpu', label: 'CPU (Processor)' },
  { id: 'motherboard', label: 'Motherboard' },
  { id: 'gpu', label: 'GPU (Kartu Grafis Utama)' },
  { id: 'ram', label: 'RAM (Memory)' },
  { id: 'storage', label: 'SSD (Solid State Drive)' },
  { id: 'psu', label: 'PSU (Power Supply)' },
  { id: 'cooling', label: 'CPU Air Cooler' },
  { id: 'case_fan', label: 'Case Fan RGB' },
  { id: 'gpu_alt', label: 'GPU (Kartu Grafis Alternatif)' },
  { id: 'office_pc', label: 'PC Built-Up / Office PC' },
  // Advanced components (Phase 4)
  { id: 'alu', label: 'ALU (Arithmetic Logic Unit)' },
  { id: 'cache', label: 'Cache Memory (L1/L2/L3)' },
  { id: 'system_bus', label: 'System Bus (Address/Data/Control)' },
  { id: 'pipeline', label: 'Instruction Pipeline (Fetch-Decode-Execute)' },
  { id: 'mem_hierarchy', label: 'Memory Hierarchy (Register→Cache→RAM→Disk)' }
];
