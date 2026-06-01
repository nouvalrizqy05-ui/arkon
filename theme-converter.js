import fs from 'fs';
import path from 'path';

const directory = './src';

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;

      // 1. Convert Dark Backgrounds to Slate/White
      content = content.replace(/bg-\[#0a0f1e\](?:\/\d+)?/g, 'bg-slate-50');
      content = content.replace(/bg-\[#0d1224\](?:\/\d+)?/g, 'bg-slate-50');
      content = content.replace(/bg-\[#111827\](?:\/\d+)?/g, 'bg-white shadow-sm border border-slate-200');
      content = content.replace(/bg-gray-900/g, 'bg-slate-50');
      content = content.replace(/bg-gray-800/g, 'bg-white shadow-sm border border-slate-200');
      
      // Semi-transparent backgrounds
      content = content.replace(/bg-white\/(5|10|20)/g, 'bg-white shadow-sm border border-slate-200');
      content = content.replace(/bg-black\/(50|60|70|80)/g, 'bg-slate-900/40 backdrop-blur-sm');

      // 2. Fix Texts and Borders
      content = content.replace(/border-white\/(10|20|30)/g, 'border-slate-200');
      content = content.replace(/text-white\/(30|40|50|60)/g, 'text-slate-500');
      content = content.replace(/text-gray-400/g, 'text-slate-500');
      content = content.replace(/text-gray-300/g, 'text-slate-600');
      content = content.replace(/text-white/g, 'text-slate-800');

      // 3. Unify All Accent Colors to Emerald
      const accents = ['indigo', 'blue', 'purple', 'sky', 'cyan', 'teal'];
      accents.forEach(color => {
        content = content.replace(new RegExp(`bg-${color}-`, 'g'), 'bg-emerald-');
        content = content.replace(new RegExp(`text-${color}-`, 'g'), 'text-emerald-');
        content = content.replace(new RegExp(`border-${color}-`, 'g'), 'border-emerald-');
        content = content.replace(new RegExp(`ring-${color}-`, 'g'), 'ring-emerald-');
        content = content.replace(new RegExp(`from-${color}-`, 'g'), 'from-emerald-');
        content = content.replace(new RegExp(`to-${color}-`, 'g'), 'to-emerald-');
        content = content.replace(new RegExp(`shadow-${color}-`, 'g'), 'shadow-emerald-');
      });

      // 4. Fix Contrast for Light Mode Visibility
      content = content.replace(/text-emerald-400/g, 'text-emerald-700');
      content = content.replace(/text-emerald-300/g, 'text-emerald-600');
      content = content.replace(/bg-emerald-500\/20/g, 'bg-emerald-100');
      content = content.replace(/bg-emerald-500\/10/g, 'bg-emerald-50');

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Converted: ${fullPath}`);
      }
    }
  }
}

processDirectory(directory);
console.log('🎉 Theme conversion complete! You now have a unified Emerald + Slate theme.');
