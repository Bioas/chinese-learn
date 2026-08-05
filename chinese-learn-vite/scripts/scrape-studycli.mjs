// Scrapes HSK 1–4 vocabulary from studycli.org and writes JS word files.
// Usage: node scripts/scrape-studycli.mjs [level...]
//   node scripts/scrape-studycli.mjs           → all 4 levels
//   node scripts/scrape-studycli.mjs 1 2       → only HSK 1 & 2

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '..', 'src', 'data', 'hsk3');
const RAW_DIR = resolve(__dirname, 'data');
const PAGES = {
  1: 'https://studycli.org/chinese-tools/hsk-1-vocabulary/',
  2: 'https://studycli.org/chinese-tools/hsk-2-vocabulary/',
  3: 'https://studycli.org/chinese-tools/hsk-3-vocabulary/',
  4: 'https://studycli.org/chinese-tools/hsk-4-vocabulary/',
};

// ── Helpers ──────────────────────────────────────────────────────
function tidyPinyin(py) {
  return py.replace(/\s+/g, ' ').replace(/[`´′‘’]/g, "'").trim();
}

function tidyMeaning(en) {
  return en.replace(/\s+/g, ' ').replace(/^[;,\s]+|[;,]+$/g, '').trim();
}

function jsStr(s) {
  return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

function stripTags(s) {
  return s.replace(/<[^>]+>/g, '').trim();
}

// ── Fetch ────────────────────────────────────────────────────────
async function fetchPage(url) {
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ChineseLearnBot/1.0)' },
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
  return resp.text();
}

// ── Parse a <tbody id="vocabBody"> block ─────────────────────────
function parseVocab(tbody) {
  // Extract all vocab-row <tr> blocks with their data attributes.
  // Each is: <tr ... data-hanzi="..." ...> ... </tr>
  const rowRegex = /<tr\b[^>]*\bclass="[^"]*\bvocab-row\b[^"]*"\s*([^>]*)>([\s\S]*?)<\/tr>/gi;
  const detailRegex = /<tr\b[^>]*\bclass="[^"]*\bvocab-detail-row\b[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;

  const rows = [...tbody.matchAll(rowRegex)];
  const details = [...tbody.matchAll(detailRegex)];

  function attr(str, name) {
    const m = str.match(new RegExp(`data-${name}="([^"]*)"`));
    return m ? m[1] : '';
  }

  const words = [];
  for (let i = 0; i < rows.length; i++) {
    const attrs = rows[i][1];       // attributes inside <tr ...>
    const rowInner = rows[i][2];    // content between <tr> and </tr>

    const hanzi = attr(attrs, 'hanzi');
    if (!hanzi) continue;

    const pinyin = tidyPinyin(attr(attrs, 'pinyin'));
    const english = tidyMeaning(attr(attrs, 'english'));
    const pos = attr(attrs, 'pos');
    const number = attr(attrs, 'number');

    let meaning = english;
    if (pos && ['particle', 'preposition', 'conjunction', 'measure word'].includes(pos.toLowerCase())) {
      meaning = `${english} (${pos})`;
    }

    // Extract examples from the matching detail row
    const examples = [];
    if (i < details.length) {
      const detailContent = details[i][1];
      const exCn = [...detailContent.matchAll(/<div\b[^>]*\bclass="[^"]*\binline-example-cn\b[^"]*"[^>]*>([\s\S]*?)<\/div>/gi)];
      const exPy = [...detailContent.matchAll(/<div\b[^>]*\bclass="[^"]*\binline-example-py\b[^"]*"[^>]*>([\s\S]*?)<\/div>/gi)];
      const exEn = [...detailContent.matchAll(/<div\b[^>]*\bclass="[^"]*\binline-example-en\b[^"]*"[^>]*>([\s\S]*?)<\/div>/gi)];

      for (let j = 0; j < Math.min(exCn.length, exPy.length, exEn.length, 3); j++) {
        const cn = stripTags(exCn[j][1]);
        const py = stripTags(exPy[j][1]);
        const en = stripTags(exEn[j][1]);
        if (cn && py) {
          examples.push({ chinese: cn, pinyin: py, meaning: en, meaningThai: '' });
        }
      }
    }

    words.push({ hanzi, pinyin, meaning, examples, number: parseInt(number, 10) });
  }
  return { words, details: details.length };
}

// ── Render ───────────────────────────────────────────────────────
function renderWordsJS(level, words) {
  const entries = words.map((w, i) => {
    const id = `hsk${level}-${String(i + 1).padStart(3, '0')}`;
    const exArr = w.examples.length
      ? w.examples.map(e =>
          `{"chinese":"${jsStr(e.chinese)}","pinyin":"${jsStr(e.pinyin)}","meaning":"${jsStr(e.meaning)}","meaningThai":""}`
        ).join(',')
      : '';

    return `  {"id":"${id}","chinese":"${jsStr(w.hanzi)}","pinyin":"${jsStr(w.pinyin)}","meaning":"${jsStr(w.meaning)}","meaningThai":"","category":"hsk","subcategory":"hsk${level}","hskLevel":${level},"status":"new","examples":[${exArr}]}`;
  }).join(',\n');

  return `// HSK 3.0 Level ${level} vocabulary
// Scraped from studycli.org (CLI New HSK vocabulary lists)
// Words in this level: ${words.length}

const HSK${level}_WORDS = [
${entries}
];

export default HSK${level}_WORDS;
`;
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2).map(Number).filter(n => n >= 1 && n <= 4);
  const levels = args.length ? args.sort((a, b) => a - b) : [1, 2, 3, 4];

  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(RAW_DIR, { recursive: true });

  const stats = [];

  for (const level of levels) {
    const url = PAGES[level];
    if (!url) { console.warn(`⚠  No URL for HSK ${level}`); continue; }

    console.log(`📥  Fetching HSK ${level} from ${url} ...`);
    const html = await fetchPage(url);

    const tbodyMatch = html.match(/<tbody\b[^>]*\bid="vocabBody"[^>]*>([\s\S]*?)<\/tbody>/i);
    if (!tbodyMatch) {
      console.error(`✗  Could not find vocabBody in HSK ${level} page`);
      continue;
    }

    const { words, details } = parseVocab(tbodyMatch[1]);
    const withExamples = words.filter(w => w.examples.length > 0).length;
    console.log(`✓  HSK ${level}: ${words.length} words, ${details} detail rows, ${withExamples} with examples`);

    const outPath = resolve(OUT_DIR, `hsk${level}-words.js`);
    writeFileSync(outPath, renderWordsJS(level, words), 'utf-8');
    stats.push({ level, words: words.length, examples: withExamples });
    console.log(`📝  Wrote ${outPath}`);
  }

  console.log('\n📊  Summary:');
  for (const s of stats) console.log(`    HSK ${s.level}: ${s.words} words, ${s.examples} with examples`);
  console.log('\n✅  Done!');
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
