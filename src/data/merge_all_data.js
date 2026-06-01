import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import script yang sudah ada secara berurutan agar dieksekusi otomatis
import './update_quizzes_l6_10.js';
import './update_quizzes.js';

console.log("===============================================================");
console.log("✅ SUKSES: Semua data dari l6_10 dan l11_14 telah disatukan!");
console.log("✅ File quizzes.json kini berisi kesatuan data bank soal keseluruhan.");
console.log("===============================================================");
