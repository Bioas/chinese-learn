#!/usr/bin/env node
/**
 * Merge HSK 5 & 6 from the new syllabus PDF (1,600 / 1,800 words) into the app.
 *
 * Strategy:
 *  - The PDF row list (scripts/data/pdf-rows.json) is the authoritative word set
 *    for HSK 5 (1600) and HSK 6 (1800), in PDF order.
 *  - For each PDF row, prefer the complete.json entry tagged `newest-N` (the
 *    updated HSK 3.0 list), falling back to any entry with the same simplified form.
 *    This gives pinyin + meanings + POS codes.
 *  - Reuse existing Thai translations + example sentences from the current
 *    VOCABULARY (keyed by chinese form) so we don't lose the enrich work.
 *  - Map PDF Chinese POS abbreviations (名/动/形/…) and complete.json POS codes
 *    (n/v/a/…) to the app's English POS vocabulary (partOfSpeech array).
 *
 * Usage:  node scripts/merge-pdf-hsk56.mjs
 */

import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(SCRIPT_DIR, '..');
const ROWS_PATH = resolve(SCRIPT_DIR, 'data', 'pdf-rows.json');
const COMPLETE_JSON = resolve(SCRIPT_DIR, 'data', 'hsk3', 'complete.json');
const OUT_DIR = resolve(APP_ROOT, 'src', 'data', 'hsk3');

// ── PDF Chinese POS abbreviation → app English POS ──
const PDF_POS_MAP = {
  '名': 'noun',
  '动': 'verb',
  '形': 'adjective',
  '副': 'adverb',
  '量': 'measure word',
  '连': 'conjunction',
  '代': 'pronoun',
  '助': 'particle',
  '数': 'numeral',
  '介': 'preposition',
  '叹': 'interjection',
  '前缀': 'prefix',
  '后缀': 'suffix',
  '数量': 'quantity expression',
  '拟声': 'other',
};
// Map a PDF 词性 cell like "动、名" / "名、（动）" / "副、形" → array of English POS.
// Parenthesised senses are secondary; we include them but the primary ones first.
function pdfPosToEnglish(cell) {
  if (!cell) return [];
  const out = [];
  const seen = new Set();
  const parts = cell.split(/[、,，]/).map(s => s.replace(/[（）()]/g, '').trim());
  for (const p of parts) {
    const en = PDF_POS_MAP[p];
    if (en && !seen.has(en)) { seen.add(en); out.push(en); }
  }
  return out;
}

// ── complete.json POS codes → app English POS ──
// Codes follow the CEDICT/CC-CEDICT scheme (n, v, a, d, vn, q, …).
const COMPLETE_POS_MAP = {
  n: 'noun',
  v: 'verb',
  a: 'adjective',
  d: 'adverb',
  vn: 'verb',
  an: 'adjective',
  ad: 'adjective',
  q: 'measure word',
  m: 'numeral',
  r: 'pronoun',
  p: 'preposition',
  c: 'conjunction',
  u: 'particle',
  e: 'interjection',
  o: 'other',
  y: 'particle',
  b: 'adjective',        // 区别词 attributive
  z: 'other',            // 状态词
  t: 'other',            // 时间词
  s: 'other',            // 处所词
  f: 'other',            // 方位词
  l: 'expression',       // 习用语/成语
  k: 'suffix',
  h: 'prefix',
  g: 'other',            // 语素
  nr: 'noun', ns: 'noun', nt: 'noun', nz: 'noun', // proper nouns → noun
  mq: 'quantity expression',
  qv: 'verb',            // 谓宾动词
  qt: 'verb',            // 体宾动词
  tg: 'noun',            // 时间名词
};
function completePosToEnglish(codes) {
  const out = [];
  const seen = new Set();
  for (const c of codes || []) {
    const en = COMPLETE_POS_MAP[c] || 'other';
    if (!seen.has(en)) { seen.add(en); out.push(en); }
  }
  return out;
}

// ── Load reference data ──
const rows = JSON.parse(await readFile(ROWS_PATH, 'utf-8'));
const completeRaw = JSON.parse(await readFile(COMPLETE_JSON, 'utf-8'));
const completeEntries = Object.values(completeRaw);

// Index complete.json by simplified form.
const completeByForm = new Map(); // form → array of entries
for (const e of completeEntries) {
  const form = (e.simplified || '').trim();
  if (!form) continue;
  if (!completeByForm.has(form)) completeByForm.set(form, []);
  completeByForm.get(form).push(e);
}

// Prefer the entry whose level includes newest-N for the target level.
function pickCompleteEntry(form, level) {
  const arr = completeByForm.get(form);
  if (!arr || arr.length === 0) return null;
  const newest = arr.find(e => (Array.isArray(e.level) ? e.level : [e.level]).includes(`newest-${level}`));
  return newest || arr[0];
}

// ── Reuse lookup from current VOCABULARY (Thai + examples) ──
// Keyed by the stripped form (trailing homograph digits removed) so 本2 / 本
// reuse the same data.
let oldLookup = new Map();
try {
  const { VOCABULARY } = await import('../src/data/vocabulary.js');
  for (const w of VOCABULARY) {
    const key = w.chinese.replace(/\d$/, '');
    if (!oldLookup.has(key)) oldLookup.set(key, w);
  }
  console.log(`Reuse lookup: ${oldLookup.size} existing entries`);
} catch (e) {
  console.warn('Could not import existing VOCABULARY — Thai/examples will be empty:', e.message);
}

function renderWord(obj) {
  return `  ${JSON.stringify(obj)},`;
}

// ── Build per-level word lists ──
const stats = [];
for (const level of [5, 6]) {
  const levelRows = rows.filter(r => /^\d+/.test(r[1]) && parseInt(r[1], 10) === level);
  console.log(`\nPDF HSK ${level}: ${levelRows.length} rows`);

  let words = [];
  let missingComplete = 0;
  let missingMeaning = 0;

  for (let i = 0; i < levelRows.length; i++) {
    const row = levelRows[i];
    // PDF writes homograph sense markers like 本2 / 称1; strip them for the
    // display form so the UI shows 本, not 本2. Duplicate rows that collapse
    // to the same (chinese, pinyin) are deduped below.
    const chinese = (row[2] || '').replace(/\d$/, '');
    const pdfPinyin = (row[3] || '').replace(/\s+/g, ' ').trim();
    const pdfPosCell = row[4] || '';
    const id = `hsk${level}-${String(i + 1).padStart(3, '0')}`;
    void i; // ids are sequential row indices; no other use of i needed

    const complete = pickCompleteEntry(chinese, level);
    // PDF pinyin already carries tone marks; prefer it over complete.json
    // (which may list a different reading for homographs, e.g. 处 chǔ vs chù).
    const pinyin = pdfPinyin;
    let meaning = '';
    let partOfSpeech = [];

    if (complete) {
      const form0 = complete.forms && complete.forms[0] || {};
      meaning = (form0.meanings && form0.meanings.length)
        ? form0.meanings.join('; ')
        : '';
      partOfSpeech = completePosToEnglish(complete.pos);
    } else {
      missingComplete++;
      // Fall back to the PDF row itself: Chinese POS → English.
      partOfSpeech = pdfPosToEnglish(pdfPosCell);
    }
    // If the complete.json lookup produced no POS, use the PDF POS as a fallback.
    if (partOfSpeech.length === 0 && pdfPosCell) {
      partOfSpeech = pdfPosToEnglish(pdfPosCell);
    }
    if (!meaning) missingMeaning++;

    // Reuse Thai + examples from the existing app data (stripped-form key).
    const old = oldLookup.get(chinese);
    const meaningThai = old?.meaningThai || '';
    const examples = old?.examples || [];

    words.push({
      id,
      chinese,
      pinyin,
      meaning,
      meaningThai,
      category: 'hsk',
      subcategory: `hsk${level}`,
      hskLevel: level,
      status: 'new',
      examples,
      ...(partOfSpeech.length ? { partOfSpeech } : {}),
    });
  }

  // Dedupe: same (chinese, pinyin) from homograph sense markers (本2 vs 本)
  // or the same form printed twice. Keep the first occurrence, prefer the
  // entry that has a meaning.
  const seen = new Map();
  const deduped = [];
  for (const w of words) {
    const key = `${w.chinese}\u0000${w.pinyin}`;
    const prev = seen.get(key);
    if (!prev) {
      seen.set(key, w);
      deduped.push(w);
    } else if (!prev.meaning && w.meaning) {
      // Replace the placeholder with the richer entry.
      Object.assign(prev, w);
    }
  }
  words = deduped;

  stats.push({
    level,
    rows: levelRows.length,
    words: words.length,
    missingComplete,
    missingMeaning,
    withPos: words.filter(w => w.partOfSpeech?.length).length,
    withThai: words.filter(w => w.meaningThai).length,
    withExamples: words.filter(w => w.examples?.length).length,
  });

  // ── Write file (atomic: tmp + rename) ──
  const header = [
    `// HSK 3.0 Level ${level} vocabulary (new syllabus)`,
    `// Merged from the official 新版HSK考试大纲词汇 PDF + complete-hsk-vocabulary (newest-*)`,
    `// Words in this level: ${words.length}`,
    '',
    `const HSK${level}_WORDS = [`,
  ];
  const body = words.map(renderWord);
  const footer = [
    '];',
    '',
    `export default HSK${level}_WORDS;`,
    '',
  ];
  const out = [...header, ...body, ...footer].join('\n');

  const filePath = resolve(OUT_DIR, `hsk${level}-words.js`);
  const tmpPath = `${filePath}.tmp`;
  await writeFile(tmpPath, out, 'utf8');
  await rename(tmpPath, filePath);
  console.log(`  Written: ${filePath} (${words.length} words)`);
}

console.log('\n📊  Summary:');
for (const s of stats) {
  console.log(
    `  HSK ${s.level}: ${s.words} words (PDF rows ${s.rows}) | no-complete ${s.missingComplete} | no-meaning ${s.missingMeaning} | POS ${s.withPos} | Thai ${s.withThai} | examples ${s.withExamples}`
  );
}
console.log('\n✅  Done!');
