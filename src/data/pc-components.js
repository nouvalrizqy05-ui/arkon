/**
 * PC QUEST — Katalog Komponen PC
 * Setiap komponen memiliki spesifikasi teknis untuk:
 * 1. Compatibility Check (socket, DDR, PCIe)
 * 2. Benchmark Score (cores, clock, vram, capacity)
 * 3. Shop display (price, emoji, unlockLevel)
 *
 * CATATAN: modelSrc sementara menggunakan model yang sama per kategori.
 * Update path saat model 3D baru tersedia.
 */

export const ASSEMBLY_CATEGORIES = ['motherboard', 'cpu', 'ram', 'storage', 'cooling', 'gpu', 'psu', 'case'];

export const CATEGORY_LABELS = {
  motherboard: 'Motherboard',
  cpu: 'CPU',
  ram: 'RAM',
  gpu: 'GPU',
  storage: 'Storage',
  psu: 'Power Supply',
  cooling: 'Cooling',
  case: 'Casing',
};

export const CATEGORY_EMOJIS = {
  motherboard: '🖥️',
  cpu: '🧠',
  ram: '💾',
  gpu: '🎮',
  storage: '💿',
  psu: '⚡',
  cooling: '❄️',
  case: '🗄️',
};

export const PC_COMPONENTS = {
  // ============================================
  // MOTHERBOARD — 4 varian (sesuai model 3D tersedia)
  // ============================================
  motherboard: [
    {
      id: 'mobo_amd_a520',
      name: 'ASUS TUF GAMING A520M-PLUS',
      emoji: '🖥️',
      price: 400,
      category: 'motherboard',
      modelSrc: '/models/motherboard/asus_TUF A520M-PLUS_.blend.glb',
      specs: {
        socket: 'AM4',
        chipset: 'AMD A520',
        ddr: 'DDR4',
        pcie: 'PCIe 3.0',
        formFactor: 'Micro-ATX',
        maxRam: 64,
        ramSlots: 2,
      },
      desc: 'Budget AMD. Socket AM4, DDR4, Micro-ATX. Cocok untuk build hemat.',
      unlocked: true,
      minLevel: 0,
    },
    {
      id: 'mobo_amd_x370',
      name: 'ROG Strix X370-F Gaming',
      emoji: '🖥️',
      price: 700,
      category: 'motherboard',
      modelSrc: '/models/motherboard/rog_strix_x370-f_motherboard.glb',
      specs: {
        socket: 'AM4',
        chipset: 'AMD X370',
        ddr: 'DDR4',
        pcie: 'PCIe 3.0',
        formFactor: 'ATX',
        maxRam: 64,
        ramSlots: 4,
      },
      desc: 'Legacy AMD flagship. Socket AM4, DDR4, RGB, overclock-ready.',
      minLevel: 1,
    },
    {
      id: 'mobo_amd_b550',
      name: 'MSI B550 GAMING PLUS',
      emoji: '🖥️',
      price: 900,
      category: 'motherboard',
      modelSrc: '/models/motherboard/msi_b550_gaming_plus.glb',
      specs: {
        socket: 'AM4',
        chipset: 'AMD B550',
        ddr: 'DDR4',
        pcie: 'PCIe 4.0',
        formFactor: 'ATX',
        maxRam: 128,
        ramSlots: 4,
      },
      desc: 'Mid-range AMD. Socket AM4, DDR4, PCIe 4.0. Sweet spot.',
      minLevel: 1,
    },
    {
      id: 'mobo_intel_z590',
      name: 'MSI MEG Z590 ACE Gold Edition',
      emoji: '🖥️',
      price: 2000,
      category: 'motherboard',
      modelSrc: '/models/motherboard/msi_meg_z590_ace_gold_edition.glb',
      specs: {
        socket: 'LGA1200',
        chipset: 'Intel Z590',
        ddr: 'DDR4',
        pcie: 'PCIe 4.0',
        formFactor: 'ATX',
        maxRam: 128,
        ramSlots: 4,
      },
      desc: 'Flagship Intel. Socket LGA1200, DDR4, PCIe 4.0, WiFi 6E.',
      minLevel: 3,
    },
  ],

  // ============================================
  // CPU — 4 varian (2 Intel, 2 AMD)
  // Socket AM4: kompatibel dengan A520/X370/B550
  // Socket LGA1200: kompatibel dengan Z590
  // Socket LGA1700: TIDAK kompatibel (jebakan edukasi)
  // Socket AM5: TIDAK kompatibel (jebakan edukasi)
  // ============================================
  cpu: [
    {
      id: 'cpu_intel_i5_10400',
      name: 'Intel Core i5-13600K',
      emoji: '🧠',
      price: 1000,
      category: 'cpu',
      modelSrc: '/models/cpu/intel_coretm_i5-13600k/scene.gltf',
      specs: {
        socket: 'LGA1200',
        brand: 'Intel',
        cores: 6,
        threads: 12,
        baseClock: 2.9,
        boostClock: 4.3,
        tdp: 65,
        cache: 12,
        architecture: 'Comet Lake',
        benchWeight: { gaming: 65, rendering: 60, server: 50 },
      },
      desc: '14C/20T Intel LGA1700 (Simulated). Performa gaming sangat tinggi.',
      minLevel: 1,
    },
    {
      id: 'cpu_intel_i7_11700k',
      name: 'Intel Core i7-12700K',
      emoji: '🧠',
      price: 2500,
      category: 'cpu',
      modelSrc: '/models/cpu/intel_coretm_i7-12700k/scene.gltf',
      specs: {
        socket: 'LGA1200',
        brand: 'Intel',
        cores: 8,
        threads: 16,
        baseClock: 3.6,
        boostClock: 5.0,
        tdp: 125,
        cache: 16,
        architecture: 'Rocket Lake',
        benchWeight: { gaming: 85, rendering: 88, server: 75 },
      },
      desc: '12C/20T high-end Intel LGA1700 (Simulated). Overclock-ready.',
      minLevel: 2,
    },
    {
      id: 'cpu_amd_r5_5600x',
      name: 'AMD Ryzen 5 5600X',
      emoji: '🧠',
      price: 1500,
      category: 'cpu',
      modelSrc: '/models/cpu/amd_ryzen_5_5600x_processor/scene.gltf',
      specs: {
        socket: 'AM4',
        brand: 'AMD',
        cores: 6,
        threads: 12,
        baseClock: 3.7,
        boostClock: 4.6,
        tdp: 65,
        cache: 32,
        architecture: 'Zen 3',
        benchWeight: { gaming: 75, rendering: 70, server: 60 },
      },
      desc: '6C/12T mid-range AMD AM4. Efisiensi tinggi, kompatibel B550/X370/A520.',
      minLevel: 1,
    },
    {
      id: 'cpu_amd_r7_5800x',
      name: 'AMD Ryzen 7 5700X3D',
      emoji: '🧠',
      price: 2800,
      category: 'cpu',
      modelSrc: '/models/cpu/amd_ryzen_7_5700x3d.glb',
      specs: {
        socket: 'AM4',
        brand: 'AMD',
        cores: 8,
        threads: 16,
        baseClock: 3.8,
        boostClock: 4.7,
        tdp: 105,
        cache: 32,
        architecture: 'Zen 3',
        benchWeight: { gaming: 90, rendering: 88, server: 75 },
      },
      desc: '8C/16T AMD AM4 dengan 3D V-Cache. Raja gaming AM4, kompatibel B550/X370/A520.',
      minLevel: 3,
    },
  ],

  // ============================================
  // RAM — 4 varian
  // ============================================
  ram: [
    {
      id: 'ram_ddr4_8gb',
      name: 'Kingston HyperX Fury Black RAM DDR4',
      emoji: '💾',
      price: 400,
      category: 'ram',
      modelSrc: '/models/ram/kingston_hyperx_fury_black_ram_module.glb',
      specs: {
        ddr: 'DDR4',
        capacity: 8,
        speed: 2666,
        channels: 1,
        latency: 'CL16',
        benchWeight: { gaming: 30, rendering: 35, server: 40 },
      },
      desc: '8GB DDR4 basic. Cukup untuk tugas ringan.',
      unlocked: true,
      minLevel: 0,
    },
    {
      id: 'ram_ddr4_16gb',
      name: 'G.Skill Trident Z RGB DDR4',
      emoji: '💾',
      price: 800,
      category: 'ram',
      modelSrc: '/models/ram/ram_ddr4_g.skill_trident_z_rgb.glb',
      specs: {
        ddr: 'DDR4',
        capacity: 16,
        speed: 3200,
        channels: 2,
        latency: 'CL16',
        benchWeight: { gaming: 55, rendering: 60, server: 65 },
      },
      desc: '16GB DDR4 dual-channel. Sweet spot untuk gaming.',
      minLevel: 1,
    },
    {
      id: 'ram_ddr5_16gb',
      name: 'Kingston FURY DDR5 Low Poly',
      emoji: '💾',
      price: 1200,
      category: 'ram',
      modelSrc: '/models/ram/kingston_fury_ddr5_low_poly.glb',
      specs: {
        ddr: 'DDR5',
        capacity: 16,
        speed: 5200,
        channels: 2,
        latency: 'CL40',
        benchWeight: { gaming: 65, rendering: 70, server: 72 },
      },
      desc: '16GB DDR5 next-gen. Bandwidth tinggi.',
      minLevel: 2,
    },
    {
      id: 'ram_ddr5_32gb',
      name: 'Corsair VENGEANCE RGB DDR5 Low Poly',
      emoji: '💾',
      price: 2200,
      category: 'ram',
      modelSrc: '/models/ram/corsair_vengeance_rgb_ddr5_ram_-_low_poly.glb',
      specs: {
        ddr: 'DDR5',
        capacity: 32,
        speed: 6000,
        channels: 2,
        latency: 'CL36',
        benchWeight: { gaming: 78, rendering: 90, server: 92 },
      },
      desc: '32GB DDR5 flagship. Untuk workstation dan server.',
      minLevel: 3,
    },
  ],

  // ============================================
  // GPU — 4 varian (2 NVIDIA, 2 AMD)
  // ============================================
  gpu: [
    {
      id: 'gpu_gtx_1660s',
      name: 'NVIDIA RTX 2060 Founders Edition',
      emoji: '🎮',
      price: 1500,
      category: 'gpu',
      modelSrc: '/models/gpu/geforce_rtx_2060_founders_edition.glb',
      specs: {
        brand: 'NVIDIA',
        vram: 6,
        vramType: 'GDDR6',
        pcie: 'PCIe 3.0',
        tdp: 160,
        cudaCores: 1920,
        boostClock: 1680,
        benchWeight: { gaming: 55, rendering: 45, server: 25 },
      },
      desc: '6GB GDDR6 RTX entry-level. Ray tracing support.',
      minLevel: 1,
    },
    {
      id: 'gpu_rtx_3060',
      name: 'NVIDIA RTX 3060 Ti Founders Edition',
      emoji: '🎮',
      price: 3000,
      category: 'gpu',
      modelSrc: '/models/gpu/geforce_rtx_3060_ti_founders_edition.glb',
      specs: {
        brand: 'NVIDIA',
        vram: 8,
        vramType: 'GDDR6',
        pcie: 'PCIe 4.0',
        tdp: 200,
        cudaCores: 4864,
        boostClock: 1665,
        benchWeight: { gaming: 75, rendering: 68, server: 38 },
      },
      desc: '8GB RTX 3060 Ti. Ray tracing, DLSS, sangat pas untuk 1440p.',
      minLevel: 2,
    },
    {
      id: 'gpu_rtx_4070',
      name: 'Gigabyte AERO RTX 4090 24GB',
      emoji: '🎮',
      price: 5000,
      category: 'gpu',
      modelSrc: '/models/gpu/gigabyte_aero_rtx_4090.glb',
      specs: {
        brand: 'NVIDIA',
        vram: 24,
        vramType: 'GDDR6X',
        pcie: 'PCIe 4.0',
        tdp: 450,
        cudaCores: 16384,
        boostClock: 2520,
        benchWeight: { gaming: 98, rendering: 95, server: 65 },
      },
      desc: '24GB GDDR6X. Flagship ultimate GPU, 4K/8K gaming ready.',
      minLevel: 3,
    },
    {
      id: 'gpu_rx_6700xt',
      name: 'AMD RX 6700 XT 12GB',
      emoji: '🎮',
      price: 2800,
      category: 'gpu',
      modelSrc: '/models/gpu/gpu_amd_rx_6700_xt (1).glb',
      specs: {
        brand: 'AMD',
        vram: 12,
        vramType: 'GDDR6',
        pcie: 'PCIe 4.0',
        tdp: 230,
        streamProcessors: 2560,
        boostClock: 2581,
        benchWeight: { gaming: 70, rendering: 60, server: 30 },
      },
      desc: '12GB AMD. 1440p gaming, FSR support.',
      minLevel: 2,
    },
  ],

  // ============================================
  // STORAGE — 3 varian
  // ============================================
  storage: [
    {
      id: 'storage_hdd_1tb',
      name: 'Seagate Barracuda 1TB HDD',
      emoji: '💿',
      price: 400,
      category: 'storage',
      modelSrc: '/models/hdd ssd/hdd.glb',
      specs: {
        type: 'HDD',
        capacity: 1000,
        interface: 'SATA III',
        readSpeed: 150,
        writeSpeed: 140,
        benchWeight: { gaming: 15, rendering: 20, server: 40 },
      },
      desc: '1TB HDD 7200RPM. Kapasitas besar, harga murah.',
      unlocked: true,
      minLevel: 0,
    },
    {
      id: 'storage_ssd_500gb',
      name: 'Samsung 870 EVO 500GB SSD',
      emoji: '💿',
      price: 700,
      category: 'storage',
      modelSrc: '/models/hdd ssd/ssd evo.glb',
      specs: {
        type: 'SATA SSD',
        capacity: 500,
        interface: 'SATA III',
        readSpeed: 560,
        writeSpeed: 530,
        benchWeight: { gaming: 40, rendering: 45, server: 55 },
      },
      desc: '500GB SATA SSD. 4x lebih cepat dari HDD.',
      minLevel: 1,
    },
    {
      id: 'storage_nvme_1tb',
      name: 'Samsung 980 PRO 1TB NVMe',
      emoji: '💿',
      price: 1500,
      category: 'storage',
      modelSrc: '/models/hdd ssd/samsung_980_pro_nvme_1tb.glb',
      specs: {
        type: 'NVMe SSD',
        capacity: 1000,
        interface: 'PCIe 4.0 x4',
        readSpeed: 7000,
        writeSpeed: 5100,
        benchWeight: { gaming: 70, rendering: 75, server: 85 },
      },
      desc: '1TB NVMe Gen4. Kecepatan baca 7000MB/s.',
      minLevel: 2,
    },
  ],

  // ============================================
  // PSU — 3 varian
  // ============================================
  psu: [
    {
      id: 'psu_500w_bronze',
      name: 'Aerocool KCAS PLUS GOLD 500W',
      emoji: '⚡',
      price: 500,
      category: 'psu',
      modelSrc: '/models/psu/power_supply_aerocool_kcas_500w_atx.glb',
      specs: {
        wattage: 500,
        efficiency: '80+ Bronze',
        modular: false,
        benchWeight: { gaming: 20, rendering: 20, server: 30 },
      },
      desc: '500W budget PSU. Efisiensi Bronze.',
      unlocked: true,
      minLevel: 0,
    },
    {
      id: 'psu_750w_gold',
      name: 'Generic 750W Gold PSU',
      emoji: '⚡',
      price: 1200,
      category: 'psu',
      modelSrc: '/models/psu/psu_power_supply_unit.glb',
      specs: {
        wattage: 750,
        efficiency: '80+ Gold',
        modular: true,
        benchWeight: { gaming: 35, rendering: 35, server: 50 },
      },
      desc: '750W Gold modular. Sweet spot untuk gaming PC.',
      minLevel: 1,
    },
    {
      id: 'psu_1000w_platinum',
      name: 'M1000 Inspired by Corsair HX1000',
      emoji: '⚡',
      price: 2500,
      category: 'psu',
      modelSrc: '/models/psu/m1000_inspired_by_corsair_hx1000_free.glb',
      specs: {
        wattage: 1000,
        efficiency: '80+ Platinum',
        modular: true,
        benchWeight: { gaming: 45, rendering: 45, server: 70 },
      },
      desc: '1000W Platinum. Untuk build high-end multi-GPU.',
      minLevel: 3,
    },
  ],

  // ============================================
  // COOLING — 3 varian
  // ============================================
  cooling: [
    {
      id: 'cool_stock',
      name: 'AMD Wraith Stealth CPU Cooler',
      emoji: '❄️',
      price: 200,
      category: 'cooling',
      modelSrc: '/models/cooler/amd_wraith_stealth_cpu_cooler.glb',
      specs: {
        type: 'Air (Stock)',
        maxTdp: 65,
        noise: 35,
        benchWeight: { gaming: 15, rendering: 15, server: 20 },
      },
      desc: 'Cooler bawaan. Cukup untuk CPU ≤65W TDP.',
      unlocked: true,
      minLevel: 0,
    },
    {
      id: 'cool_tower_air',
      name: 'Noctua NH-D15 Tower Cooler',
      emoji: '❄️',
      price: 800,
      category: 'cooling',
      modelSrc: '/models/cooler/noctua_nh-d15_cpu_cooler.glb',
      specs: {
        type: 'Air (Tower)',
        maxTdp: 250,
        noise: 24,
        benchWeight: { gaming: 40, rendering: 50, server: 55 },
      },
      desc: 'Tower cooler premium. Sangat senyap, TDP tinggi.',
      minLevel: 1,
    },
    {
      id: 'cool_aio_240',
      name: 'Corsair iCUE H150i ELITE Liquid Cooler',
      emoji: '❄️',
      price: 1800,
      category: 'cooling',
      modelSrc: '/models/cooler/corsair_h150i_elitie_cpu_liquid_cooler/scene.gltf',
      specs: {
        type: 'Liquid (AIO)',
        maxTdp: 300,
        noise: 21,
        benchWeight: { gaming: 55, rendering: 65, server: 70 },
      },
      desc: 'Liquid cooling premium dari Corsair. RGB, performa tinggi untuk overclocking.',
      minLevel: 2,
    },
  ],

  // ============================================
  // CASE — 3 varian
  // ============================================
  case: [
    {
      id: 'case_budget',
      name: 'Standard ATX Cabinet',
      emoji: '🗄️',
      price: 400,
      category: 'case',
      modelSrc: '/models/case/cabinet/scene.gltf',
      specs: {
        formFactor: 'ATX',
        fans: 1,
        tempered_glass: true,
        benchWeight: { gaming: 10, rendering: 10, server: 15 },
      },
      desc: 'Budget ATX case. Tempered glass, 1 fan bawaan.',
      unlocked: true,
      minLevel: 0,
    },
    {
      id: 'case_mid_nzxt',
      name: 'NZXT H510 Flow',
      emoji: '🗄️',
      price: 900,
      category: 'case',
      modelSrc: '/models/case/computer_case_based_off_of_nzxt_510b.glb',
      specs: {
        formFactor: 'ATX',
        fans: 2,
        tempered_glass: true,
        benchWeight: { gaming: 25, rendering: 20, server: 25 },
      },
      desc: 'Mid-range ATX. Airflow mesh, 2 fan, premium build quality.',
      minLevel: 2,
    },
    {
      id: 'case_full_tower',
      name: 'Gaming PC EVO (Lian Li O11)',
      emoji: '🗄️',
      price: 1800,
      category: 'case',
      modelSrc: '/models/case/gaming pc evo.glb',
      specs: {
        formFactor: 'E-ATX',
        fans: 3,
        tempered_glass: true,
        benchWeight: { gaming: 40, rendering: 35, server: 40 },
      },
      desc: 'Full tower flagship. E-ATX, triple fan mount, showcase build.',
      minLevel: 3,
    },
  ],
};

/**
 * Helper: Cari komponen berdasarkan ID dari semua kategori
 */
export function findComponentById(id) {
  for (const category of Object.values(PC_COMPONENTS)) {
    const found = category.find(c => c.id === id);
    if (found) return found;
  }
  return null;
}

/**
 * Helper: Cari kategori komponen berdasarkan ID
 */
export function getCategoryById(id) {
  for (const [cat, items] of Object.entries(PC_COMPONENTS)) {
    if (items.find(c => c.id === id)) return cat;
  }
  return null;
}

/**
 * Helper: Ambil semua komponen sebagai flat array
 */
export function getAllComponents() {
  return Object.values(PC_COMPONENTS).flat();
}
