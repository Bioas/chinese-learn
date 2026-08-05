import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', 'src', 'data', 'hsk3');

const missing = new Set();

for (const level of [1, 2, 3, 4]) {
  const content = readFileSync(resolve(DATA_DIR, `hsk${level}-words.js`), 'utf-8');
  
  // Find word-level entries with empty meaningThai
  // Pattern: "meaning":"...","meaningThai":"","category":"hsk"
  const regex = /"meaning":"([^"]+)","meaningThai":"","category":"hsk"/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    missing.add(m[1]);
  }
}

console.log(`Total unique missing: ${missing.size}`);
const arr = [...missing].sort();
for (const m of arr) console.log(m);
