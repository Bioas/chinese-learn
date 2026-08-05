// QC pass over HSK 1-6 example translations. Flags suspicious (zh/en/th)
// triples using cheap heuristics so a human can review and fix them:
//   - TH containing Latin/ASCII letters (machine artifacts like "alack")
//   - EN containing CJK characters (translation failed / swapped)
//   - digits present in ZH but missing or different in EN/TH
//   - length ratio ZH→EN or ZH→TH way out of band (too short / too long)
//   - TH identical to EN (not translated)
//   - TH missing (empty)
//   - EN/TH with suspiciously many words vs ZH chars (word-by-word MT)
//
// Output: JSON + human-readable report to reports/hsk/qc-examples.*
//   node scripts/qc-examples.mjs

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(SCRIPT_DIR, '..');
const DATA_DIR = resolve(APP_ROOT, 'src', 'data', 'hsk3');
const REPORT_DIR = resolve(APP_ROOT, 'reports', 'hsk');

const THAI_RE = /[\u0E00-\u0E7F]/;
const CJK_RE = /[\u4e00-\u9fff]/g;
const DIGIT_RE = /\d+/g;
const THAI_DIGIT_MAP = { '๐': 0, '๑': 1, '๒': 2, '๓': 3, '๔': 4, '๕': 5, '๖': 6, '๗': 7, '๘': 8, '๙': 9 };
const LEVELS = [1, 2, 3, 4, 5, 6];

async function loadLevel(level) {
  const src = await readFile(resolve(DATA_DIR, `hsk${level}-words.js`), 'utf8');
  const m = src.match(new RegExp(`const HSK${level}_WORDS = \\[([\\s\\S]*?)\\n\\];`));
  const entries = JSON.parse(`[${m[1].replace(/,\s*$/, '')}]`);
  return entries;
}

function ratio(zh, tr) {
  if (!tr) return 0;
  const zhCjk = (zh.match(CJK_RE) || []).length;
  if (!zhCjk) return 0;
  return tr.length / zhCjk;
}

function flagEntry(level, word, ex, flags) {
  return { level, id: word.id, chinese: word.chinese, zh: ex.chinese, pinyin: ex.pinyin, en: ex.meaning, th: ex.meaningThai, flags };
}

const all = [];
for (const level of LEVELS) {
  const entries = await loadLevel(level);
  for (const word of entries) {
    for (const ex of word.examples || []) {
      const zh = (ex.chinese || '').trim();
      const en = (ex.meaning || '').trim();
      const th = (ex.meaningThai || '').trim();
      const flags = [];

      if (!th) flags.push('TH_EMPTY');
      else if (!THAI_RE.test(th)) flags.push('TH_NO_THAI');

      // Latin / ASCII letters inside Thai translation = MT artifact
      if (th && /[A-Za-z]{2,}/.test(th)) flags.push('TH_HAS_LATIN');

      // English translation containing CJK = swapped/failed
      if (CJK_RE.test(en)) flags.push('EN_HAS_CJK');

      // digits mismatch (Arabic + Thai numerals)
      const toNum = (s) => String(s).replace(/[๐-๙]/g, (c) => THAI_DIGIT_MAP[c]);
      const zhD = (zh.match(DIGIT_RE) || []).map(Number).sort((a, b) => a - b);
      const enD = (en.match(DIGIT_RE) || []).map(Number).sort((a, b) => a - b);
      const thD = (toNum(th).match(DIGIT_RE) || []).map(Number).sort((a, b) => a - b);
      if (zhD.length) {
        if (!enD.length) flags.push('EN_NO_DIGITS');
        else if (JSON.stringify(zhD) !== JSON.stringify(enD)) flags.push('EN_DIGITS_MISMATCH');
        if (!thD.length) flags.push('TH_NO_DIGITS');
        else if (JSON.stringify(zhD) !== JSON.stringify(thD)) flags.push('TH_DIGITS_MISMATCH');
      }

      // length ratios: ~3 Latin/Thai chars per Chinese char is typical,
      // so normalize by zhCjk*3 and flag only extreme outliers.
      const enR = ratio(zh, en) / 3;
      const thR = ratio(zh, th) / 3;
      if (enR && enR > 2.2) flags.push('EN_RATIO_HI');
      if (thR && thR > 2.2) flags.push('TH_RATIO_HI');
      // very short translations for multi-char sentences
      const zhCjk = (zh.match(CJK_RE) || []).length;
      if (zhCjk >= 6 && en && en.length < 10) flags.push('EN_TOO_SHORT');
      if (zhCjk >= 6 && th && th.length < 10) flags.push('TH_TOO_SHORT');

      // TH identical to EN (not translated at all)
      if (th && en && th.toLowerCase() === en.toLowerCase()) flags.push('TH_EQUALS_EN');

      if (flags.length) all.push(flagEntry(level, word, ex, flags));
    }
  }
}

await mkdir(REPORT_DIR, { recursive: true });
const jsonPath = resolve(REPORT_DIR, 'qc-examples.json');
await writeFile(jsonPath, `${JSON.stringify(all, null, 2)}\n`, 'utf8');

// grouped human report
const lines = [`# QC report: HSK 1-6 example translations`, ``, `Flagged ${all.length} example(s). See qc-examples.json for machine-readable data.`, ``];
for (const f of all) {
  lines.push(`- [${f.level}] ${f.chinese} (${f.id}) — ${f.flags.join(', ')}`);
  lines.push(`  ZH: ${f.zh}`);
  lines.push(`  EN: ${f.en}`);
  lines.push(`  TH: ${f.th}`);
  lines.push(``);
}
const mdPath = resolve(REPORT_DIR, 'qc-examples.md');
await writeFile(mdPath, lines.join('\n'), 'utf8');

// summary by flag
const byFlag = {};
for (const f of all) for (const fl of f.flags) byFlag[fl] = (byFlag[fl] || 0) + 1;
console.log(`Flagged ${all.length} examples.`);
console.log('By flag:', byFlag);
console.log('Report: reports/hsk/qc-examples.json + .md');
