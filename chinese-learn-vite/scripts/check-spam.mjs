import { readFile } from 'node:fs/promises';

const SUSPECT_RE = /โจรสลัด|alack|ถูกขโมยไปจาก|ข้อมูลเหล่านี้/i;
let n = 0;
for (const lvl of [5, 6]) {
  const src = await readFile(`src/data/hsk3/hsk${lvl}-words.js`, 'utf8');
  const m = src.match(new RegExp(`const HSK${lvl}_WORDS = \\[([\\s\\S]*?)\\n\\];`));
  const entries = JSON.parse(`[${m[1].replace(/,\s*$/, '')}]`);
  for (const w of entries) {
    for (const ex of w.examples || []) {
      if (ex.meaningThai && SUSPECT_RE.test(ex.meaningThai)) {
        n++;
        console.log(`[${lvl}] ${w.chinese} | ${ex.meaningThai.slice(0, 60)}`);
      }
    }
  }
}
console.log('total contaminated in files:', n);
