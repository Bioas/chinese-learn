// Compare complete.json "newest-*" levels against PDF 等级 levels.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const raw = JSON.parse(readFileSync(resolve('scripts/data/hsk3/complete.json'), 'utf-8'));
const entries = Object.values(raw);

// Group by "newest-N" level (use first matching level)
const newest = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };
for (const e of entries) {
  const levels = Array.isArray(e.level) ? e.level : [e.level];
  for (const l of levels) {
    const m = /^newest-(\d)$/.exec(l);
    if (m) { newest[m[1]].push((e.simplified || '').trim()); break; }
  }
}

// PDF rows
const rows = JSON.parse(readFileSync(resolve('scripts/data/pdf-rows.json'), 'utf-8'));
const pdfByLevel = {};
for (const r of rows) {
  const m = /^(\d)/.exec(r[1]);
  if (m) {
    const lvl = m[1];
    (pdfByLevel[lvl] ||= []).push(r[2]);
  }
}

for (let lvl = 1; lvl <= 7; lvl++) {
  const nw = new Set(newest[lvl]);
  const pdfSet = new Set(pdfByLevel[lvl] || []);
  console.log(`\n== Level ${lvl} ==`);
  console.log(`  newest-${lvl}: ${nw.size} words | PDF: ${pdfSet.size} words`);
  const overlap = [...nw].filter(w => pdfSet.has(w)).length;
  console.log(`  overlap: ${overlap} (${((overlap / Math.max(nw.size, 1)) * 100).toFixed(1)}% of newest)`);
  const pdfOnly = [...pdfSet].filter(w => !nw.has(w)).length;
  const nwOnly = [...nw].filter(w => !pdfSet.has(w)).length;
  console.log(`  in PDF only: ${pdfOnly} | in newest only: ${nwOnly}`);
}
