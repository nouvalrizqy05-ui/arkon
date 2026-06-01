/**
 * PC QUEST — Compatibility Rules Engine
 * Rule-based validation system untuk mengecek kompatibilitas antar komponen PC.
 * Menghasilkan errors (merah) dan warnings (kuning) dengan penjelasan edukatif.
 */

/**
 * Cek kompatibilitas seluruh build PC
 * @param {Object} selectedComponents - { motherboard: {...}, cpu: {...}, ram: {...}, ... }
 * @returns {{ errors: Array, warnings: Array, isCompatible: boolean }}
 */
export function checkCompatibility(selectedComponents) {
  const errors = [];
  const warnings = [];

  const mobo = selectedComponents.motherboard;
  const cpu = selectedComponents.cpu;
  const ram = selectedComponents.ram;
  const gpu = selectedComponents.gpu;
  const psu = selectedComponents.psu;
  const cooling = selectedComponents.cooling;
  const storage = selectedComponents.storage;

  // ============================================
  // RULE 1: CPU Socket ↔ Motherboard Socket
  // ============================================
  if (mobo && cpu) {
    if (mobo.specs.socket !== cpu.specs.socket) {
      errors.push({
        type: 'SOCKET_MISMATCH',
        icon: '🔴',
        title: 'CPU & Motherboard — Socket Tidak Cocok!',
        detail: `CPU "${cpu.name}" menggunakan socket **${cpu.specs.socket}**, tetapi motherboard "${mobo.name}" menggunakan socket **${mobo.specs.socket}**. Kedua socket ini berbeda secara fisik dan tidak bisa saling dipasang.`,
        learn: `Socket adalah konektor fisik CPU ke motherboard. Intel menggunakan LGA (Land Grid Array) seperti LGA1700, sedangkan AMD menggunakan AM4/AM5. Pin layout dan dimensi berbeda, sehingga mustahil dipasang paksa tanpa merusak komponen.`,
        components: ['cpu', 'motherboard'],
      });
    }
  }

  // ============================================
  // RULE 2: RAM DDR Generation ↔ Motherboard DDR
  // ============================================
  if (mobo && ram) {
    if (mobo.specs.ddr !== ram.specs.ddr) {
      errors.push({
        type: 'DDR_MISMATCH',
        icon: '🔴',
        title: 'RAM & Motherboard — Generasi DDR Berbeda!',
        detail: `RAM "${ram.name}" bertipe **${ram.specs.ddr}**, tetapi motherboard "${mobo.name}" hanya mendukung **${mobo.specs.ddr}**. Slot DDR berbeda secara fisik.`,
        learn: `DDR4 dan DDR5 memiliki posisi notch (lekukan) yang berbeda pada keping RAM. DDR5 memiliki 288 pin dengan notch di posisi tengah yang sedikit berbeda. Ini sengaja dirancang agar tidak bisa salah pasang, karena tegangan DDR5 (1.1V) lebih rendah dari DDR4 (1.2V).`,
        components: ['ram', 'motherboard'],
      });
    }
  }

  // ============================================
  // RULE 3: Total TDP vs PSU Wattage
  // ============================================
  if (psu) {
    let totalTdp = 0;
    if (cpu) totalTdp += cpu.specs.tdp || 0;
    if (gpu) totalTdp += gpu.specs.tdp || 0;
    // Tambahan ~100W untuk komponen lain (mobo, RAM, storage, fan)
    totalTdp += 100;

    const psuWattage = psu.specs.wattage || 0;
    const headroom = psuWattage - totalTdp;
    const ratio = totalTdp / psuWattage;

    if (totalTdp > psuWattage) {
      errors.push({
        type: 'PSU_UNDERPOWERED',
        icon: '🔴',
        title: 'PSU — Daya Tidak Cukup!',
        detail: `Estimasi total konsumsi daya build ini adalah **~${totalTdp}W**, tetapi PSU "${psu.name}" hanya menyediakan **${psuWattage}W**. PC akan mati mendadak atau tidak bisa booting.`,
        learn: `PSU harus memiliki headroom minimal 20% di atas total konsumsi daya. Ini karena: (1) Komponen bisa melebihi TDP saat boost/turbo, (2) Efisiensi PSU tidak 100% (80+ Gold = ~90%), (3) Aging PSU menurunkan kapasitas seiring waktu.`,
        components: ['psu'],
      });
    } else if (ratio > 0.8) {
      warnings.push({
        type: 'PSU_TIGHT',
        icon: '⚠️',
        title: 'PSU — Headroom Sempit',
        detail: `Build ini mengonsumsi ~${totalTdp}W dari ${psuWattage}W (${Math.round(ratio * 100)}%). Disarankan headroom minimal 20%.`,
        learn: `Best practice: pilih PSU dengan kapasitas 1.5x total TDP untuk keamanan dan umur panjang.`,
        components: ['psu'],
      });
    }
  }

  // ============================================
  // RULE 4: Cooling TDP vs CPU TDP
  // ============================================
  if (cooling && cpu) {
    if (cooling.specs.maxTdp < cpu.specs.tdp) {
      warnings.push({
        type: 'COOLING_INADEQUATE',
        icon: '⚠️',
        title: 'Cooler — Mungkin Kurang Dingin',
        detail: `Cooler "${cooling.name}" rated untuk **${cooling.specs.maxTdp}W TDP**, tetapi CPU "${cpu.name}" memiliki TDP **${cpu.specs.tdp}W**. CPU bisa thermal throttle.`,
        learn: `Thermal throttling terjadi ketika CPU terlalu panas dan menurunkan clock speed otomatis untuk mencegah kerusakan. Ini mengurangi performa secara signifikan. Pilih cooler dengan rating TDP ≥ TDP CPU.`,
        components: ['cooling', 'cpu'],
      });
    }
  }

  // ============================================
  // RULE 5: RAM Capacity vs Motherboard Max
  // ============================================
  if (mobo && ram) {
    if (ram.specs.capacity > mobo.specs.maxRam) {
      warnings.push({
        type: 'RAM_OVERCAPACITY',
        icon: '⚠️',
        title: 'RAM — Melebihi Kapasitas Mobo',
        detail: `RAM "${ram.name}" berkapasitas ${ram.specs.capacity}GB, tetapi motherboard "${mobo.name}" mendukung maksimal ${mobo.specs.maxRam}GB.`,
        learn: `Chipset motherboard memiliki batas kapasitas RAM yang didukung. Kelebihan kapasitas mungkin menyebabkan hanya sebagian yang terdeteksi BIOS.`,
        components: ['ram', 'motherboard'],
      });
    }
  }

  // ============================================
  // RULE 6: PCIe Generation Compatibility (Warning only)
  // ============================================
  if (mobo && gpu) {
    const moboPcie = parseInt(mobo.specs.pcie?.replace(/\D/g, '') || '0');
    const gpuPcie = parseInt(gpu.specs.pcie?.replace(/\D/g, '') || '0');
    
    if (gpuPcie > moboPcie && moboPcie > 0) {
      warnings.push({
        type: 'PCIE_DOWNGRADE',
        icon: '💡',
        title: 'PCIe — GPU akan berjalan di gen lebih rendah',
        detail: `GPU "${gpu.name}" mendukung **PCIe ${gpuPcie}.0**, tetapi motherboard hanya menyediakan **PCIe ${moboPcie}.0**. GPU tetap berjalan tapi di bandwidth lebih rendah.`,
        learn: `PCIe backward-compatible: GPU PCIe 5.0 bisa dipasang di slot PCIe 4.0, tapi bandwidth dibatasi oleh generasi terendah. Untuk GPU modern, perbedaan PCIe 3.0 vs 4.0 bisa menurunkan performa 2-5% di resolusi rendah.`,
        components: ['gpu', 'motherboard'],
      });
    }
  }

  return {
    errors,
    warnings,
    isCompatible: errors.length === 0,
    totalIssues: errors.length + warnings.length,
  };
}

/**
 * Format pesan compatibility menjadi teks singkat untuk tooltip
 */
export function getCompatibilitySummary(result) {
  if (result.errors.length === 0 && result.warnings.length === 0) {
    return { status: 'ok', text: '✅ Semua komponen kompatibel!', color: 'emerald' };
  }
  if (result.errors.length > 0) {
    return { status: 'error', text: `🔴 ${result.errors.length} masalah kompatibilitas!`, color: 'red' };
  }
  return { status: 'warning', text: `⚠️ ${result.warnings.length} peringatan`, color: 'amber' };
}
