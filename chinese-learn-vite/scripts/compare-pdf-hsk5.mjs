// Compare HSK 5 words between the new-syllabus PDF and current app data.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ── Load PDF rows (level mark starts with "5" or "5（..." ) ──
const rows = JSON.parse(readFileSync(resolve('scripts/data/pdf-rows.json'), 'utf-8'));
const pdfHsk5 = rows.filter(r => /^5/.test(r[1]));
console.log(`PDF HSK 5 rows: ${pdfHsk5.length}`);

// ── Load app HSK5 words ──
const src = readFileSync(resolve('src/data/hsk3/hsk5-words.js'), 'utf-8');
const appEntries = [...src.matchAll(/\{"id":"hsk5-\d+","chinese":"([^"]+)","pinyin":"([^"]*)","meaning":"([^"]*)"/g)]
  .map(m => ({ chinese: m[1], pinyin: m[2], meaning: m[3] }));
console.log(`APP HSK 5 entries: ${appEntries.length}`);

// ── Compare by chinese form ──
const pdfForms = new Set(pdfHsk5.map(r => r[2]));
const appForms = new Set(appEntries.map(e => e.chinese));

const inPdfOnly = pdfHsk5.filter(r => !appForms.has(r[2]));
const inAppOnly = appEntries.filter(e => !pdfForms.has(e.chinese));
const inBoth = [...appForms].filter(f => pdfForms.has(f));

console.log(`\nIn PDF only (missing from app): ${inPdfOnly.length}`);
console.log(`In app only (not in PDF HSK5): ${inAppOnly.length}`);
console.log(`In both: ${inBoth.length}`);

// ── Show some samples ──
console.log('\n── 20 sample PDF-only words (missing from app) ──');
for (const r of inPdfOnly.slice(0, 20)) {
  console.log(`  ${r[2]}  ${r[3]}  ${r[4]}`);
}

console.log('\n── 20 sample app-only words (in app HSK5 but not in PDF HSK5) ──');
for (const e of inAppOnly.slice(0, 20)) {
  console.log(`  ${e.chinese}  ${e.pinyin}  ${e.meaning.slice(0, 50)}`);
}

// ── Where do the missing words actually live in the PDF? Check the app-only words' levels ──
const appOnlyLevels = {};
for (const e of inAppOnly) {
  const found = rows.find(r => r[2] === e.chinese);
  if (found) appOnlyLevels[found[1]] = (appOnlyLevels[found[1]] || 0) + 1;
  else appOnlyLevels['(not in PDF at all)'] = (appOnlyLevels['(not in PDF at all)'] || 0) + 1;
}
console.log('\n── Level distribution of app-HSK5 words missing from PDF-HSK5 ──');
for (const [lvl, n] of Object.entries(appOnlyLevels).sort((a,b)=>a[1]-b[1]).reverse()) {
  console.log(`  ${lvl}: ${n}`);
}

// ── The PDF-only words: which level do they carry in app (if any) or PDF? ──
const pdfOnlyLevels = {};
for (const r of inPdfOnly) {
  pdfOnlyLevels[r[1]] = (pdfOnlyLevels[r[1]] || 0) + 1;
}
console.log('\n── Level marks of PDF-HSK5 words missing from app ──');
for (const [lvl, n] of Object.entries(pdfOnlyLevels).sort((a,b)=>a[1]-b[1]).reverse()) {
  console.log(`  ${lvl}: ${n}`);
}
