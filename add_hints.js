const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/data/quizzes.json');
let quizzes = [];
try {
  quizzes = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
} catch (e) {
  console.error("Could not read quizzes.json", e);
  process.exit(1);
}

// Very simple keyword extractor
function extractKeyword(text) {
  const lower = text.toLowerCase();
  if (lower.includes('cpu') || lower.includes('prosesor')) return 'CPU (Central Processing Unit)';
  if (lower.includes('ram') || lower.includes('ddr')) return 'RAM (Random Access Memory)';
  if (lower.includes('gpu') || lower.includes('vga')) return 'GPU / Pengolah Grafis';
  if (lower.includes('motherboard') || lower.includes('mainboard')) return 'Motherboard';
  if (lower.includes('ssd') || lower.includes('hdd') || lower.includes('storage') || lower.includes('sata') || lower.includes('nvme')) return 'Media Penyimpanan (Storage)';
  if (lower.includes('psu') || lower.includes('listrik') || lower.includes('daya') || lower.includes('watt')) return 'Power Supply (PSU)';
  if (lower.includes('cache')) return 'Cache Memory';
  if (lower.includes('pipeline') || lower.includes('pipelining')) return 'Pipelining';
  if (lower.includes('bus')) return 'System Bus';
  if (lower.includes('interrupt')) return 'Interrupt (Interupsi)';
  if (lower.includes('dma')) return 'Direct Memory Access (DMA)';
  if (lower.includes('register') || lower.includes('pc ') || lower.includes('ir ') || lower.includes('mar ') || lower.includes('mbr ')) return 'Register (Penyimpanan Internal CPU)';
  if (lower.includes('moore')) return 'Hukum Moore';
  if (lower.includes('von neumann')) return 'Arsitektur Von Neumann';
  if (lower.includes('clock') || lower.includes('hz')) return 'Clock Speed';
  if (lower.includes('bios') || lower.includes('uefi') || lower.includes('cmos')) return 'BIOS/UEFI/CMOS';
  if (lower.includes('os ') || lower.includes('sistem operasi')) return 'Sistem Operasi (OS)';
  if (lower.includes('bottleneck')) return 'Bottleneck (Leher Botol Performa)';
  if (lower.includes('firmware')) return 'Firmware';
  if (lower.includes('multicore') || lower.includes('core')) return 'Multicore Processing';
  if (lower.includes('throughput')) return 'Throughput Komputer';
  if (lower.includes('stallings')) return 'Arsitektur menurut Stallings';
  
  // Default keywords if none match
  return 'Konsep Dasar Arsitektur Komputer';
}

let modified = false;
quizzes.forEach(quiz => {
  if (quiz.questions) {
    quiz.questions.forEach(q => {
      if (!q.hintKeyword) {
        q.hintKeyword = extractKeyword(q.question);
        modified = true;
      }
    });
  }
});

if (modified) {
  fs.writeFileSync(filePath, JSON.stringify(quizzes, null, 2), 'utf-8');
  console.log('Successfully updated quizzes.json with hintKeywords.');
} else {
  console.log('No modifications needed.');
}
