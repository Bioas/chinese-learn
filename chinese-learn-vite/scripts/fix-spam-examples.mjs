#!/usr/bin/env node
/**
 * QC fix pass: repair HSK 1-6 example sentences whose Thai translation was
 * contaminated by the MyMemory spam incident ("เราเป็นโจรสลัด / ข้อมูลเหล่านี้
 * ถูกขโมย..." suffix) or the "alack" machine artifact.
 *
 * The EN translation is fine (it came from the dictionary source); only the
 * Thai was corrupted. We re-translate zh → th directly with Google, cache per
 * Chinese sentence (thai-spam-fix-cache.json), then rewrite both word files
 * atomically. A read-back self-check verifies the write actually landed.
 *
 * Usage: node scripts/fix-spam-examples.mjs [--limit=N]
 */

import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(SCRIPT_DIR, '..');
const DATA_DIR = resolve(APP_ROOT, 'src', 'data', 'hsk3');
const CACHE_DIR = resolve(SCRIPT_DIR, 'cache');
const CACHE_FILE = resolve(CACHE_DIR, 'thai-spam-fix-cache.json');

const THAI_RE = /[\u0E00-\u0E7F]/;
const SUSPECT_RE = /โจรสลัด|alack|ถูกขโมยไปจาก|ข้อมูลเหล่านี้/i;
const LEVELS = [1, 2, 3, 4, 5, 6];
const TEST_MARKER = /^FIXED_TEST_/; // leftover from a debugging script
const REQUEST_TIMEOUT_MS = 20_000;
const DELAY_MS = 250;
const BATCH_SIZE = 8;

const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? Number(limitArg.split('=')[1]) : Infinity;

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

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
  const tmp = CACHE_FILE + '.tmp2';
  await writeFile(tmp, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
  await rename(tmp, CACHE_FILE);
}

async function translateZhToTh(text) {
  const url = new URL('https://translate.google.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', 'zh-CN');
  url.searchParams.set('tl', 'th');
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', text);
  const resp = await fetchWithTimeout(url, {
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; ChineseLearnThaiDataBot/1.0)' },
  });
  if (!resp.ok) throw new Error(`Google HTTP ${resp.status}`);
  const data = await resp.json();
  const th = Array.isArray(data?.[0])
    ? data[0].map((part) => part?.[0] || '').join('').replace(/\n/g, '').trim()
    : '';
  if (!THAI_RE.test(th)) throw new Error('Google returned no Thai');
  if (SUSPECT_RE.test(th)) throw new Error('translation still looks contaminated');
  return th;
}

async function translateBatch(texts, cache) {
  const translated = [];
  for (const text of texts) {
    if (cache[text]) {
      translated.push(cache[text]);
      continue;
    }
    let ok = false;
    for (let attempt = 0; attempt < 3 && !ok; attempt += 1) {
      try {
        const th = await translateZhToTh(text);
        cache[text] = th;
        translated.push(th);
        ok = true;
      } catch (e) {
        if (attempt === 2) throw new Error(`${text}: ${e.message}`);
        await sleep(1200 * (attempt + 1));
      }
    }
    await sleep(DELAY_MS);
  }
  return translated;
}

function loadLevel(level) {
  const src = readFileSync(resolve(DATA_DIR, `hsk${level}-words.js`), 'utf8');
  const m = src.match(new RegExp(`const HSK${level}_WORDS = \\[([\\s\\S]*?)\\n\\];`));
  if (!m) throw new Error(`Could not parse HSK${level}-words.js`);
  const entries = JSON.parse(`[${m[1].replace(/,\s*$/, '')}]`);
  return { level, src, header: src.slice(0, m.index), footer: src.slice(m.index + m[0].length), entries };
}

async function writeLevel(level, header, footer, entries) {
  const body = entries.map((e) => `  ${JSON.stringify(e)}`).join(',\n');
  const path = resolve(DATA_DIR, `hsk${level}-words.js`);
  const tmp = path + `.qcfix${process.pid}`; // unique tmp so Windows rename always works
  await writeFile(tmp, `${header}const HSK${level}_WORDS = [\n${body}\n];${footer}`, 'utf8');
  await rename(tmp, path);
  // read-back self-check
  const after = readFileSync(path, 'utf8');
  const am = after.match(new RegExp(`const HSK${level}_WORDS = \\[([\\s\\S]*?)\\n\\];`));
  const afterEntries = JSON.parse(`[${am[1].replace(/,\s*$/, '')}]`);
  if (afterEntries.length !== entries.length) {
    throw new Error(`Write self-check failed for HSK${level}: ${afterEntries.length} != ${entries.length}`);
  }
  return afterEntries;
}

// ── Collect contaminated examples ──────────────────────────────────
const levels = LEVELS.map((level) => loadLevel(level));
const targets = [];
for (const { level, entries } of levels) {
  for (const word of entries) {
    for (const ex of word.examples || []) {
      const th = ex.meaningThai || '';
      if ((th && SUSPECT_RE.test(th)) || TEST_MARKER.test(th)) {
        targets.push({ level, word, ex });
      }
    }
  }
}
const toFix = targets.slice(0, LIMIT);
console.log(`Contaminated/broken Thai examples found: ${targets.length} | fixing ${toFix.length}`);

if (!toFix.length) {
  console.log('Nothing to fix.');
  process.exit(0);
}

// ── Translate + apply ──────────────────────────────────────────────
const cache = await loadCache();
const uniqueZh = [...new Set(toFix.map((t) => t.ex.chinese.trim()))];
console.log(`Unique Chinese sentences to translate/fix: ${uniqueZh.length}`);

for (let i = 0; i < uniqueZh.length; i += BATCH_SIZE) {
  const batch = uniqueZh.slice(i, i + BATCH_SIZE);
  try {
    await translateBatch(batch, cache);
  } catch (error) {
    await saveCache(cache); // persist partial progress before failing
    throw new Error(`Failed translating batch ${i + 1}: ${error.message}`);
  }
  await saveCache(cache);
  console.log(`  translated ${Math.min(i + batch.length, uniqueZh.length)}/${uniqueZh.length}`);
}

let applied = 0;
for (const t of toFix) {
  const key = t.ex.chinese.trim();
  const th = cache[key];
  if (!th) throw new Error(`Missing cached translation for ${t.ex.chinese}`);
  if (SUSPECT_RE.test(th)) throw new Error(`Still contaminated: ${t.ex.chinese}`);
  t.ex.meaningThai = th;
  applied++;
}

for (const { level, header, footer, entries } of levels) {
  const after = await writeLevel(level, header, footer, entries);
  // verify contamination actually gone from the written file — hard fail, not a log
  const leftover = after.filter((w) =>
    (w.examples || []).some((ex) => SUSPECT_RE.test(ex.meaningThai || '') || TEST_MARKER.test(ex.meaningThai || ''))
  ).length;
  if (leftover > 0) {
    throw new Error(`Write self-check FAILED for HSK${level}: ${leftover} broken examples still in file`);
  }
  console.log(`HSK${level}: wrote ${after.length} words, leftover broken: ${leftover}`);
}
console.log(`Applied ${applied} fixes (HSK 1-6).`);
console.log('Done.');
