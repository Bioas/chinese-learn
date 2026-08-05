// Inspect: PDF POS codes, complete.json pos codes, duplicates in PDF, entry structures
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const rows = JSON.parse(readFileSync(resolve('scripts/data/pdf-rows.json'), 'utf-8'));
const completeRaw = JSON.parse(readFileSync(resolve('scripts/data/hsk3/complete.json'), 'utf-8'));
const entries = Object.values(completeRaw);

// ── PDF POS codes (Chinese abbreviations) ──
const pdfPos = {};
for (const r of rows) {
  const pos = r[4] || '';
  pdfPos[pos] = (pdfPos[pos] || 0) + 1;
}
console.log('── PDF POS codes (词性) distribution ──');
console.log(Object.entries(pdfPos).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${JSON.stringify(k)}: ${v}`).join('\n'));

// ── complete.json pos codes ──
const cPos = {};
for (const e of entries) {
  for (const p of e.pos || []) cPos[p] = (cPos[p] || 0) + 1;
}
console.log('\n── complete.json pos codes distribution ──');
console.log(Object.entries(cPos).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${JSON.stringify(k)}: ${v}`).join('\n'));

// ── Duplicate forms within PDF HSK 5 and 6 ──
for (const lvl of ['5', '6']) {
  const lvlRows = rows.filter(r => /^5/.test(r[1]) === (lvl === '5') && (lvl === '5' ? /^5/.test(r[1]) : /^6/.test(r[1])));
  const formCount = {};
  for (const r of lvlRows) formCount[r[2]] = (formCount[r[2]] || 0) + 1;
  const dups = Object.entries(formCount).filter(([, n]) => n > 1);
  console.log(`\n── PDF HSK ${lvl}: ${lvlRows.length} rows, ${Object.keys(formCount).length} unique forms, ${dups.length} duplicate forms ──`);
  for (const [f, n] of dups.slice(0, 10)) {
    const all = lvlRows.filter(r => r[2] === f).map(r => `${r[1]} ${r[3]} ${r[4]}`).join(' | ');
    console.log(`  ${f} (x${n}): ${all}`);
  }
}

// ── Sample a PDF-only HSK5 row and its complete.json lookup ──
const pdf5 = rows.filter(r => /^5/.test(r[1]));
const completeByForm = new Map();
for (const e of entries) completeByForm.set(e.simplified, e);
console.log('\n── Sample: 唉 哎 爱护 哎呀 暗 安 (PDF HSK5 missing from app) lookup in complete.json ──');
for (const f of ['唉', '哎', '爱护', '哎呀', '暗', '安']) {
  const e = completeByForm.get(f);
  if (e) {
    const form = e.forms?.[0] || {};
    console.log(`  ${f}: levels=${JSON.stringify(e.level)} pos=${JSON.stringify(e.pos)} pinyin=${form.transcriptions?.pinyin} meanings=${JSON.stringify(form.meanings?.slice(0, 2))}`);
  } else {
    console.log(`  ${f}: NOT in complete.json`);
  }
}
