// Rebuild scripts/data/pdf-rows.json from pdf-extracted.txt.
//
// PDF layout:  序号 \t 等级 \t 词语 \t 拼音 [\t 词性...]
// Problem rows: 词语 with multi-syllable pinyin print as "bú \t kèqi"
// so the pinyin cell splits across tab columns and the POS shifts right.
// Fix: after 序号/等级/词语, treat columns 4..(n-1) as pinyin fragments and
// the LAST column as 词性 ONLY when the last column is a known POS marker.
// Otherwise (POS absent) all remaining columns are pinyin fragments.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const text = readFileSync(resolve('scripts/data/pdf-extracted.txt'), 'utf-8');

// Known Chinese POS tokens (also handles 名、（动） style with parens).
const POS_TOKEN = /^[\u4e00-\u9fff、,，（）()]+$/;
const NON_POS_TOKEN = /^[a-zāáǎàēéěèīíǐìōóǒòūúǔùüǖǘǚǜ0-9'-]+$/i;

const lines = text.split('\n');
const rows = [];
let skipped = 0;

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed) continue;
  if (/^--\s*\d+\s+of\s+\d+\s*--$/.test(trimmed)) continue;
  if (/^-+\s*$/.test(trimmed)) continue;
  if (trimmed.includes('词汇大纲')) continue;
  const parts = trimmed.split('\t').map(s => s.trim());
  if (parts.length < 3) continue;
  const seq = parseInt(parts[0], 10);
  if (isNaN(seq)) continue;

  const level = parts[1];
  const chinese = parts[2];

  // Everything after the word: collect pinyin fragments + optional POS.
  const rest = parts.slice(3);
  const pinyinFrags = [];
  let pos = '';
  for (let i = rest.length - 1; i >= 0; i--) {
    const cell = rest[i];
    if (!cell) continue;
    if (i === rest.length - 1 && POS_TOKEN.test(cell) && !NON_POS_TOKEN.test(cell)) {
      pos = cell;
      continue;
    }
    if (!pinyinFrags.includes(cell)) pinyinFrags.unshift(cell);
  }
  const pinyin = pinyinFrags.join(' ');

  // Sanity: pinyin should not contain CJK; pos should not contain latin.
  if (/[\u4e00-\u9fff]/.test(pinyin)) { skipped++; continue; }

  rows.push([String(seq), level, chinese, pinyin, pos]);
}

writeFileSync(resolve('scripts/data/pdf-rows.json'), JSON.stringify(rows), 'utf-8');
console.log(`Rebuilt pdf-rows.json: ${rows.length} rows (skipped ${skipped})`);

// Report quality
const bad = rows.filter(r => /^[a-zāáǎà]/i.test(r[4] || ''));
console.log(`rows with latin in POS cell: ${bad.length}`);
for (const r of bad.slice(0, 10)) console.log(`  [${r[1]}] ${r[2]} pos=${JSON.stringify(r[4])} py=${JSON.stringify(r[3])}`);

// Level counts
const byLevel = {};
for (const r of rows) {
  const m = /^(\d+)/.exec(r[1]);
  const lvl = m ? m[1] : '?';
  byLevel[lvl] = (byLevel[lvl] || 0) + 1;
}
console.log('\nLevel counts:', JSON.stringify(byLevel));
