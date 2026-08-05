#!/usr/bin/env node
/**
 * HSK 3.0 vocabulary generator.
 *
 * Reads scripts/data/hsk3/complete.json (from drkameleon/complete-hsk-vocabulary),
 * imports existing VOCABULARY to reuse Thai translations and examples,
 * and generates src/data/hsk3/hskN-words.js for levels 1–7.
 *
 * Usage:  node scripts/hsk3-generate.mjs
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(SCRIPT_DIR, '..');
const COMPLETE_JSON = resolve(SCRIPT_DIR, 'data', 'hsk3', 'complete.json');
const OUT_DIR = resolve(APP_ROOT, 'src', 'data', 'hsk3');

// ── Level mapping: complete.json "new-N" → numeric level ──
const LEVEL_MAP = {
  'new-1': 1,
  'new-2': 2,
  'new-3': 3,
  'new-4': 4,
  'new-5': 5,
  'new-6': 6,
  'new-7': 7, // HSK 7-9
};

function extractLevel(entry) {
  const levels = Array.isArray(entry.level) ? entry.level : [entry.level];
  for (const l of levels) {
    const mapped = LEVEL_MAP[l];
    if (mapped) return mapped;
  }
  return null;
}

// ── Load reference data ──
const completeRaw = JSON.parse(await readFile(COMPLETE_JSON, 'utf8'));
const entries = Object.values(completeRaw);

console.log(`Loaded ${entries.length} entries from complete.json`);

// ── Extract and group by level ──
const byLevel = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };
let skipped = 0;

for (const entry of entries) {
  const level = extractLevel(entry);
  if (!level || level < 1 || level > 7) {
    skipped++;
    continue;
  }
  const simplified = (entry.simplified || '').trim();
  if (!simplified) { skipped++; continue; }

  const form = (entry.forms && entry.forms[0]) || {};
  const pinyin = (form.transcriptions && form.transcriptions.pinyin) || '';
  const meaning = (form.meanings && form.meanings.length)
    ? form.meanings.join(', ')
    : '';

  byLevel[level].push({ chinese: simplified, pinyin, meaning });
}

for (const [level, words] of Object.entries(byLevel)) {
  console.log(`  HSK ${level}: ${words.length} words`);
}
console.log(`  Skipped: ${skipped} (no level or empty)`);

// ── Build reuse lookup from existing VOCABULARY ──
let oldThaiLookup = new Map();
let oldExampleLookup = new Map();
try {
  const { VOCABULARY } = await import('../src/data/vocabulary.js');
  for (const word of VOCABULARY) {
    const key = word.chinese;
    if (!oldThaiLookup.has(key) && word.meaningThai) {
      oldThaiLookup.set(key, word.meaningThai);
    }
    if (!oldExampleLookup.has(key) && word.examples && word.examples.length) {
      oldExampleLookup.set(key, word.examples);
    }
  }
  console.log(`Reuse lookup: ${oldThaiLookup.size} Thai translations, ${oldExampleLookup.size} examples`);
} catch (e) {
  console.warn('Could not import existing VOCABULARY — Thai/examples will be empty:', e.message);
}

// ── Generate per-level files ──
await mkdir(OUT_DIR, { recursive: true });

for (let level = 1; level <= 7; level++) {
  const words = byLevel[level];
  const subcat = `hsk${level}`;
  const lines = [];

  lines.push(`// HSK 3.0 Level ${level} vocabulary`);
  lines.push(`// Auto-generated from drkameleon/complete-hsk-vocabulary`);
  lines.push(`// Words in this level: ${words.length}`);
  lines.push('');
  lines.push(`const HSK${level}_WORDS = [`);

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const id = `${subcat}-${String(i + 1).padStart(3, '0')}`;
    const thai = oldThaiLookup.get(w.chinese) || '';
    const examples = oldExampleLookup.get(w.chinese) || [];
    const obj = {
      id,
      chinese: w.chinese,
      pinyin: w.pinyin,
      meaning: w.meaning,
      meaningThai: thai,
      category: 'hsk',
      subcategory: subcat,
      hskLevel: level,
      status: 'new',
      examples,
    };

    lines.push(`  ${JSON.stringify(obj)},`);
  }

  lines.push('];');
  lines.push('');

  if (level < 7) {
    lines.push(`export default HSK${level}_WORDS;`);
  } else {
    lines.push(`export default HSK7_WORDS;`);
  }
  lines.push('');

  const filePath = resolve(OUT_DIR, `${subcat}-words.js`);
  await writeFile(filePath, lines.join('\n'), 'utf8');
  console.log(`  Written: ${filePath} (${words.length} words, ${Buffer.byteLength(lines.join('\n')).toLocaleString()} bytes)`);
}

console.log('\nDone! Generated 7 HSK 3.0 vocabulary files.');
