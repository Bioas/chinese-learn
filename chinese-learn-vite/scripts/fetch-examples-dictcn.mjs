// Fetches example sentences for HSK 5/6 words that still have none, from
// dict.cn's public HTML dictionary page (primary). dict.cn renders example
// pairs as <li>中文<br/>English</li> inside an <ol>, so a tiny regex-based
// parser is enough. pinyin is generated locally with the `pinyin` npm package.
//
// Usage: node scripts/fetch-examples-dictcn.mjs [--limit=N]
//
// Safe to re-run: disk cache (scripts/cache/examples-dictcn-cache.json) is
// consulted first, and word files are rewritten atomically (tmp + rename).

import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pinyinFn = require('pinyin').default;

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', 'src', 'data', 'hsk3');
const CACHE_DIR = resolve(__dirname, 'cache');
const CACHE_FILE = resolve(CACHE_DIR, 'examples-dictcn-cache.json');

const DELAY_MS = 300; // polite throttle for the public endpoint
const MAX_PAIRS = 2;  // keep at most 2 examples per word
const MIN_ZH = 6;     // ignore too-short sentences (noise)
const MAX_ZH = 42;    // ignore very long sentences (hard to display)

const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? Number(limitArg.split('=')[1]) : Infinity;

// ── Cache ──────────────────────────────────────────────────────────
async function loadCache() {
  if (!existsSync(CACHE_FILE)) return {};
  try {
    return JSON.parse(await readFile(CACHE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

async function saveCache(cache) {
  await mkdir(CACHE_DIR, { recursive: true });
  const tmp = CACHE_FILE + '.tmp';
  await writeFile(tmp, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
  await rename(tmp, CACHE_FILE);
}

// ── dict.cn fetch ──────────────────────────────────────────────────
async function fetchDictCn(word) {
  const url = `https://dict.cn/${encodeURIComponent(word)}`;
  const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ChineseLearnDataBot/1.0)' } });
  if (!resp.ok) throw new Error(`dict.cn HTTP ${resp.status} for ${word}`);
  const html = await resp.text();
  const out = [];
  // Example pairs live in the first <ol> … </ol>; each <li> is 中文<br/>English.
  const ol = html.match(/<ol[^>]*>([\s\S]*?)<\/ol>/);
  if (!ol) return out;
  for (const li of ol[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)) {
    const inner = li[1]
      .replace(/<br\s*\/?\s*>/gi, '\n')   // <br> separates zh from en
      .replace(/<[^>]+>/g, '')            // strip any remaining tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&');
    const parts = inner.split('\n').map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
    if (!parts.length) continue;
    // First segment is Chinese, the rest is the English translation.
    const zh = parts[0];
    const en = parts.slice(1).join(' ').trim();
    const cjk = (zh.match(/[\u4e00-\u9fff]/g) || []).length;
    if (!zh || !en || cjk < MIN_ZH || cjk > MAX_ZH) continue;
    if (zh.includes('；')) continue; // skip fused two-clause entries
    if (!zh.includes(word)) continue; // sentence must contain the target word
    if (out.some((e) => e.chinese === zh)) continue;
    out.push({ chinese: zh, meaning: en });
    if (out.length >= MAX_PAIRS) break;
  }
  return out;
}

// ── iciba fallback (for words dict.cn has no sentence for) ────────
async function fetchIciba(word) {
  const url = `https://www.iciba.com/word?w=${encodeURIComponent(word)}`;
  const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ChineseLearnDataBot/1.0)' } });
  if (!resp.ok) throw new Error(`iciba HTTP ${resp.status} for ${word}`);
  const html = await resp.text();
  const out = [];
  // Each scene example is a block whose EN sentence is in NormalSentence_en__BKdCu
  // and the CN sentence in NormalSentence_cn__gyUtC (EN listed first, CN second).
  for (const block of html.split('NormalSentence_sentence__Jr9aj').slice(1)) {
    const enM = block.match(/NormalSentence_en__BKdCu"[^>]*>\s*<span>([\s\S]*?)<\/span>/);
    const cnM = block.match(/NormalSentence_cn__gyUtC"[^>]*>([\s\S]*?)<\/p>/);
    const zh = cnM ? cnM[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() : '';
    const en = enM ? enM[1].replace(/<[^>]+>/g, '').trim() : '';
    const cjk = (zh.match(/[\u4e00-\u9fff]/g) || []).length;
    if (!zh || !en || cjk < MIN_ZH || cjk > MAX_ZH) continue;
    if (zh.includes('；')) continue;
    if (!zh.includes(word)) continue; // sentence must contain the target word
    if (out.some((e) => e.chinese === zh)) continue;
    out.push({ chinese: zh, meaning: en });
    if (out.length >= MAX_PAIRS) break;
  }
  return out;
}

// ── pinyin ─────────────────────────────────────────────────────────
function makePinyin(chinese) {
  const tokens = pinyinFn(chinese, { style: 'TONE', heteronym: false }).map((x) => x[0]);
  const out = [];
  for (const t of tokens) {
    if (/[，。！？、；：,.!?]/.test(t) && out.length) out[out.length - 1] += t;
    else out.push(t);
  }
  if (out[0]) out[0] = out[0].charAt(0).toUpperCase() + out[0].slice(1);
  return out.join(' ');
}

// ── Word-file read/write (reuse the header-preserving pattern) ─────
function loadWords(level) {
  const src = readFileSync(resolve(DATA_DIR, `hsk${level}-words.js`), 'utf8');
  const m = src.match(new RegExp(`const HSK${level}_WORDS = \\[([\\s\\S]*?)\\n\\];`));
  if (!m) throw new Error(`Could not parse HSK${level}-words.js`);
  const entries = JSON.parse(`[${m[1].replace(/,\s*$/, '')}]`);
  const header = src.slice(0, m.index);
  const footer = src.slice(m.index + m[0].length); // everything after '];'
  return { header, footer, entries };
}

async function writeWords(level, header, footer, entries) {
  const body = entries.map((e) => `  ${JSON.stringify(e)}`).join(',\n');
  const filePath = resolve(DATA_DIR, `hsk${level}-words.js`);
  const tmp = filePath + '.tmp';
  await writeFile(tmp, `${header}const HSK${level}_WORDS = [\n${body}\n];${footer}`, 'utf8');
  await rename(tmp, filePath);
}

// ── Main ───────────────────────────────────────────────────────────
const cache = await loadCache();
const allTargets = [];
for (const level of [5, 6]) {
  const { header, footer, entries } = loadWords(level);
  const targets = entries.filter((e) => !e.examples || !e.examples.length);
  allTargets.push({ level, header, footer, entries, targets });
}

const total = allTargets.reduce((n, t) => n + t.targets.length, 0);
const targets = allTargets.flatMap((t) => t.targets.map((w) => ({ w, t })));
const run = targets.slice(0, LIMIT);
console.log(`HSK 5/6 words missing examples: ${total} | fetching ${run.length} via dict.cn`);

let fetched = 0, errors = 0;
for (const { w, t } of run) {
  // An empty array means a previous run found nothing; retry rather than skip.
  let pairs = (cache[w.chinese] || []).length ? cache[w.chinese] : null;
  if (!pairs) {
    try {
      pairs = await fetchDictCn(w.chinese);
      if (!pairs?.length) pairs = await fetchIciba(w.chinese);
      cache[w.chinese] = pairs;
    } catch (e) {
      errors++;
      console.warn(`  !! ${w.chinese}: ${e.message}`);
      await new Promise((r) => setTimeout(r, 2000));
      continue;
    }
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }
  if (pairs && pairs.length) {
    w.examples = pairs.map((p) => ({
      chinese: p.chinese,
      pinyin: makePinyin(p.chinese),
      meaning: p.meaning,
      meaningThai: '',
    }));
  }
  fetched++;
  if (fetched % 20 === 0 || fetched === run.length) {
    console.log(`  fetched ${fetched}/${run.length} (${Object.keys(cache).length} cached, ${errors} errors)`);
  }
}

await saveCache(cache);

for (const t of allTargets) {
  if (t.targets.length && t.targets.some((w) => w.examples?.length)) {
    await writeWords(t.level, t.header, t.footer, t.entries);
    const withEx = t.entries.filter((e) => e.examples?.length).length;
    console.log(`Updated HSK ${t.level}: ${t.entries.length} words (${withEx} with examples)`);
  } else if (LIMIT === Infinity && t.targets.length) {
    console.log(`HSK ${t.level}: no new examples (all cached/unchanged)`);
  }
}
console.log('Done.');
