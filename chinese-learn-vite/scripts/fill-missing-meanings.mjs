#!/usr/bin/env node
/**
 * Fill missing English `meaning` fields for HSK 5/6 words that the PDF
 * (and complete.json) did not carry — brand-new syllabus words like
 * 安全带, 橙子, 电商. Uses Google Translate zh→en with a disk cache,
 * mirroring translate-thai-examples.mjs.
 *
 * Usage:  node scripts/fill-missing-meanings.mjs
 */

import { readFile, writeFile, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(SCRIPT_DIR, '..');
const CACHE_PATH = resolve(SCRIPT_DIR, 'cache', 'zh-en-meaning-cache.json');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function loadCache() {
  if (!existsSync(CACHE_PATH)) return {};
  try {
    return JSON.parse(await readFile(CACHE_PATH, 'utf8'));
  } catch {
    return {};
  }
}

async function saveCache(cache) {
  const tempPath = `${CACHE_PATH}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
  await rename(tempPath, CACHE_PATH);
}

async function translateZhGoogle(text) {
  const url = new URL('https://translate.google.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', 'zh-CN');
  url.searchParams.set('tl', 'en');
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', text);
  const response = await fetch(url, {
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; ChineseLearnDataBot/1.0)' },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return Array.isArray(data?.[0])
    ? data[0].map((part) => part?.[0] || '').join('').replace(/\n/g, '').trim()
    : '';
}

async function translateZhMyMemory(text) {
  const url = new URL('https://api.mymemory.translated.net/get');
  url.searchParams.set('q', text);
  url.searchParams.set('langpair', 'zh-CN|en');
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  const out = String(data?.responseData?.translatedText || '').trim();
  return out && out !== text ? out : '';
}

async function translateZh(text) {
  try {
    const en = await translateZhGoogle(text);
    if (en) return en;
  } catch { /* fall through */ }
  return translateZhMyMemory(text);
}

// ── Gather missing-meaning HSK 5/6 words ──
const missing = [];
for (const lvl of [5, 6]) {
  const src = await readFile(resolve(APP_ROOT, 'src/data/hsk3', `hsk${lvl}-words.js`), 'utf8');
  const re = new RegExp(String.raw`{"id":"hsk${lvl}-\d+","chinese":"([^"]+)","pinyin":"([^"]*)","meaning":""`, 'g');
  for (const m of src.matchAll(re)) missing.push({ chinese: m[1], pinyin: m[2], lvl });
}
console.log(`Missing meanings: ${missing.length}`);
if (missing.length === 0) {
  console.log('Nothing to do.');
  process.exit(0);
}

const cache = await loadCache();
let updated = 0;

// ── Translate each (sequential, throttled) ──
for (const w of missing) {
  if (cache[w.chinese]) continue;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const en = await translateZh(w.chinese);
      if (en) {
        cache[w.chinese] = en;
        updated++;
        break;
      }
    } catch (e) {
      if (attempt === 2) console.warn(`  FAIL ${w.chinese}: ${e.message}`);
      await sleep(1500 * (attempt + 1));
    }
  }
  await saveCache(cache);
  await sleep(350); // polite throttle
}

console.log(`Cached translations: ${Object.keys(cache).length} (new: ${updated})`);

// ── Apply to files (atomic: tmp + rename + post-write self-check) ──
for (const lvl of [5, 6]) {
  const filePath = resolve(APP_ROOT, 'src/data/hsk3', `hsk${lvl}-words.js`);
  const src = await readFile(filePath, 'utf8');
  const re = new RegExp(String.raw`{"id":"hsk${lvl}-\d+","chinese":"([^"]+)","pinyin":"([^"]*)","meaning":""`, 'g');
  let replaced = 0;
  const out = src.replace(re, (full, chinese) => {
    const meaning = cache[chinese];
    if (!meaning) return full;
    const safe = meaning.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    replaced++;
    const idMatch = full.match(/"id":"hsk\d-(\d+)"/);
    const pyMatch = full.match(/"pinyin":"([^"]*)"/);
    return `{"id":"hsk${lvl}-${idMatch[1]}","chinese":"${chinese}","pinyin":"${pyMatch[1]}","meaning":"${safe}"`;
  });

  const tmpPath = `${filePath}.tmp`;
  await writeFile(tmpPath, out, 'utf8');
  await rename(tmpPath, filePath);

  // Self-check: no empty meaning should remain.
  const after = await readFile(filePath, 'utf8');
  const emptyRemaining = [...after.matchAll(re)].length;
  if (emptyRemaining > 0) {
    throw new Error(`hsk${lvl}-words.js still has ${emptyRemaining} empty meanings — aborting`);
  }
  console.log(`Applied meanings to hsk${lvl}-words.js (${replaced} replaced, ${emptyRemaining} empty left)`);
}

console.log('✅  Done!');
