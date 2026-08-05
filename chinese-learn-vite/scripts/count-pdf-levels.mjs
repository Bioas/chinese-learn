// Count words per 等级 (level) in the extracted PDF text
// Input: scripts/data/pdf-extracted.txt (from analyze-pdf.mjs)
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const text = readFileSync(resolve('scripts/data/pdf-extracted.txt'), 'utf-8');

// Rows look like:  序号 \t 等级 \t 词语 \t 拼音 \t 词性
// 等级 may be e.g. "1", "1（4）", "5", "6（9）" etc. (level + cross-ref levels in parens)
// Split into lines, drop page markers like "-- 5 of 263 --", headers "序号 等级 词语 拼音 词性"
const lines = text.split('\n');
const rows = [];
for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed) continue;
  if (/^--\s*\d+\s+of\s+\d+\s*--$/.test(trimmed)) continue;         // page marker
  if (/^-+\s*$/.test(trimmed)) continue;                              // dashes
  if (trimmed.includes('词汇大纲')) continue;                          // cover text
  if (/^序号\s*$/.test(trimmed)) continue;                            // header (may be split)
  if (/^等级\s*$/.test(trimmed)) continue;
  if (/^词语\s*$/.test(trimmed)) continue;
  if (/^拼音\s*$/.test(trimmed)) continue;
  if (/^词性\s*$/.test(trimmed)) continue;
  const parts = trimmed.split('\t').map(s => s.trim());
  if (parts.length < 3) continue;
  const seq = parseInt(parts[0], 10);
  if (isNaN(seq)) continue; // not a data row
  rows.push(parts);
}

console.log(`Parsed ${rows.length} rows`);

// Count by primary level (the number before any paren)
const byLevel = {};
const levelMarks = {};
for (const r of rows) {
  const levelStr = r[1];
  const m = levelStr.match(/^(\d+)/);
  const primary = m ? m[1] : '?';
  byLevel[primary] = (byLevel[primary] || 0) + 1;
  levelMarks[levelStr] = (levelMarks[levelStr] || 0) + 1;
}

console.log('\n── Words per primary level ──');
for (const lvl of Object.keys(byLevel).sort((a, b) => a - b)) {
  console.log(`PDF HSK ${lvl}: ${byLevel[lvl]} words`);
}

console.log('\n── Level mark distribution (incl. cross-refs) ──');
for (const [mark, n] of Object.entries(levelMarks).sort((a, b) => a[1] - b[1]).reverse().slice(0, 20)) {
  console.log(`  "${mark}": ${n}`);
}

// Show unique level marks
console.log('\n── Unique level marks ──');
console.log(Object.keys(levelMarks).join(' | '));

// Word-level sanity: check that chinese column contains CJK
const nonCjk = rows.filter(r => !/[\u4e00-\u9fff]/.test(r[2]));
console.log(`\nRows whose 词语 has no CJK: ${nonCjk.length}`);
if (nonCjk.length) console.log(nonCjk.slice(0, 10).map(r => r.join(' | ')).join('\n'));

// Save parsed rows as JSON for further analysis
writeFileSync(
  resolve('scripts/data/pdf-rows.json'),
  JSON.stringify(rows, null, 1),
  'utf-8'
);
console.log('\nSaved scripts/data/pdf-rows.json');
