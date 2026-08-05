// Fetches example sentences for HSK 5/6 words that have none, from Youdao's
// public dict JSON API (primary) and Tatoeba (fallback for words Youdao has no
// usable Chinese sentence for). Each pair gives Chinese + English; pinyin is
// generated locally with the `pinyin` npm package (style 'TONE').
//
// Usage: node scripts/fetch-examples-youdao.mjs [--limit N]
//   (no flag → all HSK 5/6 words with empty examples)
//
// Safe to re-run: disk cache (scripts/cache/examples-cache.json) is consulted
// first, and the word files are rewritten atomically (tmp + rename) only after
// the whole batch has been fetched. A .bak copy of each file is kept.
//
// Note: Tatoeba sentences are CC-BY 2.0; attributions could be added later if
// this data is ever redistributed outside the app.

import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pinyinFn = require('pinyin').default;

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', 'src', 'data', 'hsk3');
const CACHE_DIR = resolve(__dirname, 'cache');
const CACHE_FILE = resolve(CACHE_DIR, 'examples-cache.json');

const DELAY_MS = 250; // polite throttle for the public endpoint
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

// ── Youdao fetch ───────────────────────────────────────────────────
async function fetchExamples(word) {
  const url = `https://dict.youdao.com/jsonapi_s?q=${encodeURIComponent(word)}`;
  const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${word}`);
  const j = await resp.json();
  const pairs = j?.blng_sents_part?.['sentence-pair'];
  if (!Array.isArray(pairs)) return [];
  const out = [];
  for (const p of pairs) {
    const zh = String(p?.sentence || '').trim();
    const en = String(p?.['sentence-translation'] || p?.['sentence-eng'] || '').trim();
    const cjk = (zh.match(/[\u4e00-\u9fff]/g) || []).length;
    if (!zh || !en || cjk < MIN_ZH || cjk > MAX_ZH) continue;
    if (out.some((e) => e.chinese === zh)) continue;
    out.push({ chinese: zh, meaning: en });
    if (out.length >= MAX_PAIRS) break;
  }
  return out;
}

async function fetchTatoeba(word) {
  const url = `https://tatoeba.org/en/api_v0/search?from=cmn&to=eng&orphans=no&sort=relevance&query=${encodeURIComponent(word)}`;
  const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!resp.ok) throw new Error(`Tatoeba HTTP ${resp.status} for ${word}`);
  const j = await resp.json();
  const out = [];
  for (const s of j.results || []) {
    const zh = String(s.text || '').trim();
    const en = ((s.translations?.[0] || []).map((t) => t.text).filter(Boolean).join(' / ')).trim();
    const cjk = (zh.match(/[\u4e00-\u9fff]/g) || []).length;
    if (!zh || !en || cjk < MIN_ZH || cjk > MAX_ZH) continue;
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
  const src = readFileSyncFile(resolve(DATA_DIR, `hsk${level}-words.js`));
  const m = src.match(new RegExp(`const HSK${level}_WORDS = \\[([\\s\\S]*?)\\n\\];`));
  const raw = m[1].replace(/,\s*$/, ''); // strip trailing comma before closing bracket
  const entries = JSON.parse(`[${raw}]`);
  const header = src.slice(0, m.index);
  const footer = src.slice(m.index + m[0].length); // everything after '];'
  return { header, footer, entries };
}

function readFileSyncFile(p) {
  // sync read is fine here; avoids top-level await ordering issues
  const { readFileSync } = require('node:fs');
  return readFileSync(p, 'utf8');
}

async function writeWords(level, header, footer, entries) {
  const body = entries
    .map((e) => `  ${JSON.stringify(e)}`)
    .join(',\n');
  const filePath = resolve(DATA_DIR, `hsk${level}-words.js`);
  const bakPath = filePath + '.bak';
  await writeFile(bakPath, readFileSyncFile(filePath), 'utf8');
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
console.log(`HSK 5/6 words missing examples: ${total} | fetching ${run.length}`);

let fetched = 0, errors = 0;
for (const { w, t } of run) {
  const cached = cache[w.chinese];
  // An empty array means a previous run found nothing via Youdao; retry with
  // Tatoeba fallback rather than skipping the word entirely.
  let pairs = cached && cached.length ? cached : null;
  if (!pairs) {
    try {
      pairs = await fetchExamples(w.chinese);
      if (!pairs?.length) pairs = await fetchTatoeba(w.chinese);
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
  if (fetched % 25 === 0 || fetched === run.length) {
    console.log(`  fetched ${fetched}/${run.length} (${Object.keys(cache).length} cached, ${errors} errors)`);
  }
}

await saveCache(cache);

// Write files only if we processed at least one word from each level that has targets
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
