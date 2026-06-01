/**
 * PC QUEST — Benchmark Score Calculator
 * Menghitung skor benchmark berdasarkan kombinasi komponen yang dirakit.
 * Tiga kategori: Gaming, Rendering, dan Server.
 * Juga mendeteksi bottleneck dan balance sistem.
 */

const TIER_THRESHOLDS = [
  { min: 90, tier: 'S', label: 'Legendary', color: 'from-amber-400 to-yellow-500', textColor: 'text-amber-400' },
  { min: 75, tier: 'A', label: 'Excellent', color: 'from-emerald-400 to-teal-500', textColor: 'text-emerald-400' },
  { min: 60, tier: 'B', label: 'Great', color: 'from-blue-400 to-indigo-500', textColor: 'text-blue-400' },
  { min: 40, tier: 'C', label: 'Decent', color: 'from-violet-400 to-purple-500', textColor: 'text-violet-400' },
  { min: 20, tier: 'D', label: 'Budget', color: 'from-orange-400 to-amber-500', textColor: 'text-orange-400' },
  { min: 0,  tier: 'F', label: 'Minimum', color: 'from-red-400 to-rose-500', textColor: 'text-red-400' },
];

const SCORE_LABELS = {
  gaming: [
    { min: 90, label: 'Ultra 4K Gaming Beast' },
    { min: 75, label: '1440p High Settings' },
    { min: 60, label: '1080p Smooth Gaming' },
    { min: 40, label: '1080p Medium/Low' },
    { min: 20, label: 'E-Sports Only' },
    { min: 0,  label: 'Basic Browsing' },
  ],
  rendering: [
    { min: 90, label: 'Pro Studio Workstation' },
    { min: 75, label: 'Video Editing Pro' },
    { min: 60, label: '3D Modeling Ready' },
    { min: 40, label: 'Light Photo Editing' },
    { min: 20, label: 'Document Processing' },
    { min: 0,  label: 'Minimal Tasks' },
  ],
  server: [
    { min: 90, label: 'Enterprise Server' },
    { min: 75, label: 'Multi-Service Host' },
    { min: 60, label: 'Development Server' },
    { min: 40, label: 'Light NAS/File Server' },
    { min: 20, label: 'Home Automation' },
    { min: 0,  label: 'Not Recommended' },
  ],
};

/**
 * Dapatkan tier berdasarkan skor
 */
function getTier(score) {
  for (const t of TIER_THRESHOLDS) {
    if (score >= t.min) return t;
  }
  return TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1];
}

/**
 * Dapatkan label berdasarkan skor dan kategori
 */
function getLabel(score, category) {
  const labels = SCORE_LABELS[category] || [];
  for (const l of labels) {
    if (score >= l.min) return l.label;
  }
  return 'Unknown';
}

/**
 * Hitung skor benchmark satu komponen
 */
function getComponentScore(component, category) {
  if (!component || !component.specs?.benchWeight) return 0;
  return component.specs.benchWeight[category] || 0;
}

/**
 * Hitung skor benchmark keseluruhan build
 * @param {Object} components - { motherboard, cpu, ram, gpu, storage, psu, cooling, case }
 * @returns {Object} Benchmark result
 */
export function calculateBenchmark(components) {
  const { cpu, gpu, ram, storage, psu, cooling, case: pcCase } = components;

  // --- GAMING SCORE ---
  // GPU dominan (40%), CPU (25%), RAM (15%), Storage (10%), Cooling (5%), PSU (5%)
  const gamingRaw = (
    getComponentScore(gpu, 'gaming') * 0.40 +
    getComponentScore(cpu, 'gaming') * 0.25 +
    getComponentScore(ram, 'gaming') * 0.15 +
    getComponentScore(storage, 'gaming') * 0.10 +
    getComponentScore(cooling, 'gaming') * 0.05 +
    getComponentScore(psu, 'gaming') * 0.05
  );

  // --- RENDERING SCORE ---
  // CPU dominan (40%), RAM (25%), GPU (20%), Storage (10%), Cooling (5%)
  const renderingRaw = (
    getComponentScore(cpu, 'rendering') * 0.40 +
    getComponentScore(ram, 'rendering') * 0.25 +
    getComponentScore(gpu, 'rendering') * 0.20 +
    getComponentScore(storage, 'rendering') * 0.10 +
    getComponentScore(cooling, 'rendering') * 0.05
  );

  // --- SERVER SCORE ---
  // RAM dominan (30%), Storage (25%), CPU (25%), PSU (10%), Cooling (10%)
  const serverRaw = (
    getComponentScore(ram, 'server') * 0.30 +
    getComponentScore(storage, 'server') * 0.25 +
    getComponentScore(cpu, 'server') * 0.25 +
    getComponentScore(psu, 'server') * 0.10 +
    getComponentScore(cooling, 'server') * 0.10
  );

  // Normalize ke 0-100 scale
  const gaming = Math.min(Math.round(gamingRaw), 100);
  const rendering = Math.min(Math.round(renderingRaw), 100);
  const server = Math.min(Math.round(serverRaw), 100);

  const gamingTier = getTier(gaming);
  const renderingTier = getTier(rendering);
  const serverTier = getTier(server);

  // Overall score (rata-rata berbobot)
  const overall = Math.round((gaming * 0.4 + rendering * 0.3 + server * 0.3));
  const overallTier = getTier(overall);

  // --- BOTTLENECK DETECTION ---
  const bottleneck = detectBottleneck(components, { gaming, rendering, server });

  return {
    gaming: {
      score: gaming,
      tier: gamingTier.tier,
      tierLabel: gamingTier.label,
      tierColor: gamingTier.color,
      tierTextColor: gamingTier.textColor,
      label: getLabel(gaming, 'gaming'),
    },
    rendering: {
      score: rendering,
      tier: renderingTier.tier,
      tierLabel: renderingTier.label,
      tierColor: renderingTier.color,
      tierTextColor: renderingTier.textColor,
      label: getLabel(rendering, 'rendering'),
    },
    server: {
      score: server,
      tier: serverTier.tier,
      tierLabel: serverTier.label,
      tierColor: serverTier.color,
      tierTextColor: serverTier.textColor,
      label: getLabel(server, 'server'),
    },
    overall: {
      score: overall,
      tier: overallTier.tier,
      tierLabel: overallTier.label,
      tierColor: overallTier.color,
      tierTextColor: overallTier.textColor,
    },
    bottleneck,
  };
}

/**
 * Deteksi bottleneck di build
 */
function detectBottleneck(components, scores) {
  const { cpu, gpu, ram, storage, cooling } = components;
  const bottlenecks = [];

  // CPU vs GPU balance check
  if (cpu && gpu) {
    const cpuScore = cpu.specs.benchWeight?.gaming || 0;
    const gpuScore = gpu.specs.benchWeight?.gaming || 0;
    const diff = Math.abs(cpuScore - gpuScore);

    if (diff > 30) {
      if (cpuScore < gpuScore) {
        bottlenecks.push({
          component: 'CPU',
          icon: '🧠',
          severity: diff > 50 ? 'high' : 'medium',
          reason: `CPU "${cpu.name}" (skor: ${cpuScore}) jauh di bawah GPU "${gpu.name}" (skor: ${gpuScore}). CPU akan menjadi bottleneck, terutama di game CPU-intensive dan resolusi rendah.`,
          suggestion: 'Pertimbangkan upgrade CPU dengan core/thread lebih banyak dan clock speed lebih tinggi.',
        });
      } else {
        bottlenecks.push({
          component: 'GPU',
          icon: '🎮',
          severity: diff > 50 ? 'high' : 'medium',
          reason: `GPU "${gpu.name}" (skor: ${gpuScore}) jauh di bawah CPU "${cpu.name}" (skor: ${cpuScore}). GPU akan menjadi bottleneck di game dan rendering grafis.`,
          suggestion: 'Pertimbangkan upgrade GPU dengan VRAM lebih besar dan CUDA/stream processor lebih banyak.',
        });
      }
    }
  }

  // RAM bottleneck
  if (ram && cpu) {
    const ramScore = ram.specs.benchWeight?.rendering || 0;
    const cpuScore = cpu.specs.benchWeight?.rendering || 0;
    if (cpuScore > 70 && ramScore < 40) {
      bottlenecks.push({
        component: 'RAM',
        icon: '💾',
        severity: 'medium',
        reason: `RAM "${ram.name}" (${ram.specs.capacity}GB, ${ram.specs.speed}MHz) membatasi potensi CPU "${cpu.name}". Untuk rendering dan multitasking, RAM lebih besar dan lebih cepat akan sangat membantu.`,
        suggestion: 'Upgrade ke RAM dengan kapasitas ≥16GB dan kecepatan ≥3200MHz untuk Ryzen, atau ≥3600MHz untuk best performance.',
      });
    }
  }

  // Storage bottleneck for server
  if (storage && scores?.server > 50) {
    if (storage.specs.type === 'HDD') {
      bottlenecks.push({
        component: 'Storage',
        icon: '💿',
        severity: 'medium',
        reason: `HDD "${storage.name}" sangat lambat (${storage.specs.readSpeed}MB/s) dibandingkan SSD/NVMe. Ini akan menjadi bottleneck besar untuk server dan loading game.`,
        suggestion: 'Upgrade ke SSD SATA (560MB/s) atau NVMe (3500-7000MB/s) untuk peningkatan responsivitas yang sangat signifikan.',
      });
    }
  }

  // Cooling bottleneck
  if (cooling && cpu) {
    if (cooling.specs.maxTdp < cpu.specs.tdp) {
      bottlenecks.push({
        component: 'Cooling',
        icon: '❄️',
        severity: 'high',
        reason: `Cooler "${cooling.name}" (max ${cooling.specs.maxTdp}W) tidak cukup untuk CPU "${cpu.name}" (TDP ${cpu.specs.tdp}W). CPU akan thermal throttle dan menurunkan performa.`,
        suggestion: 'Upgrade ke cooler dengan rating TDP minimal sama dengan TDP CPU. AIO liquid cooler direkomendasikan untuk CPU ≥100W.',
      });
    }
  }

  return bottlenecks;
}

/**
 * Format benchmark result ke summary text
 */
export function getBenchmarkSummary(result) {
  return `🎮 Gaming: ${result.gaming.score}/100 (${result.gaming.tier}) | 🎬 Rendering: ${result.rendering.score}/100 (${result.rendering.tier}) | 🖥️ Server: ${result.server.score}/100 (${result.server.tier})`;
}
