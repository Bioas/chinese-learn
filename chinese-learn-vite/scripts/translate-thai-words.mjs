#!/usr/bin/env node
/**
 * Translate missing Thai word-level meanings (meaningThai) for HSK 5/6 words
 * that came from the new-syllabus PDF (the 119 new words with no Thai gloss).
 *
 * Mirrors translate-thai-examples.mjs: Google Translate (batch + single) with
 * MyMemory fallback, a resumable disk cache, THAI_RE validation, and atomic
 * file writes with a post-write self-check.
 *
 * Usage:
 *   node scripts/translate-thai-words.mjs
 *   node scripts/translate-thai-words.mjs --limit 20 --delay 250
 */

import { readFile, rename, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(SCRIPT_DIR, '..');
const DATA_DIR = resolve(APP_ROOT, 'src', 'data', 'hsk3');
const CACHE_DIR = resolve(SCRIPT_DIR, 'cache');
const CACHE_PATH = resolve(CACHE_DIR, 'thai-word-translations.json');
const LEVELS = [5, 6];
const THAI_RE = /[\u0E00-\u0E7F]/;
const REQUEST_TIMEOUT_MS = 20_000;

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i];
  if (!arg.startsWith('--')) continue;
  const [key, inlineValue] = arg.slice(2).split('=', 2);
  args.set(key, inlineValue ?? process.argv[i + 1]);
  if (inlineValue == null && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')) i += 1;
}

const limit = args.has('limit') ? Math.max(0, Number(args.get('limit'))) : Infinity;
const delayMs = args.has('delay') ? Math.max(0, Number(args.get('delay'))) : 250;
// Default: translate EVERY HSK 5/6 word missing a Thai gloss. Pass --new-only
// to restrict to the new-syllabus PDF words (the zh-en cache keys).
const newOnly = args.has('new-only');

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

async function loadCache() {
  if (!existsSync(CACHE_PATH)) return {};
  return JSON.parse(await readFile(CACHE_PATH, 'utf8'));
}

async function saveCache(cache) {
  const tempPath = `${CACHE_PATH}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
  await rename(tempPath, CACHE_PATH);
}

async function requestGoogleBatch(texts) {
  const url = new URL('https://translate.google.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', 'zh-CN');
  url.searchParams.set('tl', 'th');
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', texts.join('\n'));
  const response = await fetchWithTimeout(url, {
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; ChineseLearnThaiDataBot/1.0)' },
  });
  if (!response.ok) throw new Error(`Google Translate HTTP ${response.status}`);
  const data = await response.json();
  const segments = Array.isArray(data?.[0]) ? data[0] : [];
  const translated = segments.map((part) => String(part?.[0] || '').replace(/\n/g, '').trim());
  if (translated.length !== texts.length || translated.some((text) => !THAI_RE.test(text))) {
    throw new Error(`Google returned ${translated.length}/${texts.length} valid Thai segments`);
  }
  return translated;
}

async function requestGoogleSingle(text) {
  const url = new URL('https://translate.google.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', 'zh-CN');
  url.searchParams.set('tl', 'th');
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', text);
  const response = await fetchWithTimeout(url, {
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; ChineseLearnThaiDataBot/1.0)' },
  });
  if (!response.ok) throw new Error(`Google Translate HTTP ${response.status}`);
  const data = await response.json();
  const translated = Array.isArray(data?.[0])
    ? data[0].map((part) => part?.[0] || '').join('').replace(/\n/g, '').trim()
    : '';
  if (!THAI_RE.test(translated)) throw new Error('Google returned no Thai translation');
  return translated;
}

async function requestMyMemory(text) {
  const url = new URL('https://api.mymemory.translated.net/get');
  url.searchParams.set('q', text);
  url.searchParams.set('langpair', 'zh-CN|th');
  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error(`MyMemory HTTP ${response.status}`);
  const data = await response.json();
  const translated = String(data?.responseData?.translatedText || '').trim();
  if (!THAI_RE.test(translated)) throw new Error('MyMemory returned no Thai translation');
  return translated;
}

async function translateBatch(texts, cache) {
  const cleanTexts = texts.map((text) => text.trim());
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const translated = await requestGoogleBatch(cleanTexts);
      const now = new Date().toISOString();
      cleanTexts.forEach((text, index) => {
        cache[text] = { translation: translated[index], provider: 'google-translate-web', translatedAt: now };
      });
      return;
    } catch (error) {
      lastError = error;
      await sleep(1000 * (attempt + 1));
    }
  }

  for (const text of cleanTexts) {
    try {
      const translated = await requestGoogleSingle(text);
      cache[text] = { translation: translated, provider: 'google-translate-web', translatedAt: new Date().toISOString() };
      await sleep(delayMs);
    } catch (error) {
      lastError = error;
      break;
    }
  }
  if (!lastError || cleanTexts.every((text) => cache[text]?.translation)) return;

  for (const text of cleanTexts) {
    if (cache[text]?.translation) continue;
    try {
      const translated = await requestMyMemory(text);
      cache[text] = { translation: translated, provider: 'mymemory', translatedAt: new Date().toISOString() };
      await sleep(delayMs);
    } catch (error) {
      lastError = error;
      break;
    }
  }
  if (lastError && cleanTexts.some((text) => !cache[text]?.translation)) throw lastError;
}

async function loadWords(level) {
  const module = await import(`../src/data/hsk3/hsk${level}-words.js?thai=${Date.now()}`);
  const words = Object.values(module).find((value) => Array.isArray(value));
  if (!words) throw new Error(`Could not load HSK ${level} word array`);
  return words;
}

await import('node:fs/promises').then(({ mkdir }) => mkdir(CACHE_DIR, { recursive: true }));
const cache = await loadCache();

// Only words that were freshly merged from the PDF (present in the zh-en cache)
// and still have no Thai gloss are translated this run.
const zhEnCachePath = resolve(CACHE_DIR, 'zh-en-meaning-cache.json');
const zhEnKeys = existsSync(zhEnCachePath) ? new Set(Object.keys(JSON.parse(await readFile(zhEnCachePath, 'utf8')))) : new Set();

const allWords = [];
for (const level of LEVELS) {
  const words = await loadWords(level);
  allWords.push(...words.map((word) => ({ level, word })));
}

const isTarget = ({ word }) =>
  !word.meaningThai || !THAI_RE.test(word.meaningThai)
    ? newOnly
      ? zhEnKeys.has(word.chinese)
      : true
    : false;
const targets = allWords.filter(isTarget);
console.log(`Targets without Thai: ${targets.length}${newOnly ? ' (new PDF words only)' : ' (all HSK 5/6 words)'}`);

const pending = targets.filter(({ word }) => !cache[word.chinese]?.translation);
const toTranslate = pending.slice(0, limit);
const BATCH_SIZE = 8;
console.log(`Cached Thai: ${targets.length - pending.length}`);
console.log(`Requests this run: ${toTranslate.length} words in batches of ${BATCH_SIZE}`);

for (let index = 0; index < toTranslate.length; index += BATCH_SIZE) {
  const batch = toTranslate.slice(index, index + BATCH_SIZE);
  const texts = batch.map(({ word }) => word.chinese);
  try {
    await translateBatch(texts, cache);
    await saveCache(cache);
    console.log(`Translated ${Math.min(index + batch.length, toTranslate.length)}/${toTranslate.length}`);
  } catch (error) {
    await saveCache(cache);
    throw new Error(`Failed translating batch starting at ${index + 1}: ${error.message}`);
  }
  if (index + BATCH_SIZE < toTranslate.length) await sleep(delayMs);
}
await saveCache(cache);

if (pending.length > toTranslate.length) {
  console.log(`Cache is incomplete: ${pending.length - toTranslate.length} words remain. Run the command again to resume.`);
  process.exitCode = 2;
} else {
  // ── Publish: rewrite each file's words with meaningThai filled in ──
  for (const level of LEVELS) {
    const words = allWords.filter(({ level: l }) => l === level).map(({ word }) => {
      const translation = cache[word.chinese]?.translation;
      if (!translation || !THAI_RE.test(translation)) return word;
      return { ...word, meaningThai: translation };
    });

    const path = resolve(DATA_DIR, `hsk${level}-words.js`);
    const src = await readFile(path, 'utf8');
    // Preserve the header/comments; rebuild only the word entries.
    const headerEnd = src.indexOf('const HSK');
    if (headerEnd < 0) throw new Error(`HSK ${level}: could not locate the word array marker — aborting publish`);
    const header = src.slice(0, headerEnd).trimEnd();
    // Same entry format as merge-pdf-hsk56.mjs — keep in sync with that script.
    const lines = [
      header,
      '',
      `const HSK${level}_WORDS = [`,
      ...words.map((word) => `  ${JSON.stringify(word)},`),
      '];',
      '',
      `export default HSK${level}_WORDS;`,
      '',
    ].join('\n');

    // Self-check: entry count preserved AND every target word has Thai.
    if (words.length !== allWords.filter(({ level: l }) => l === level).length) {
      throw new Error(`HSK ${level}: entry count changed (${words.length}) — aborting publish`);
    }
    const missingAfter = words.filter((w) => isTarget({ word: w }) && !THAI_RE.test(w.meaningThai || '')).length;
    if (missingAfter > 0) throw new Error(`HSK ${level}: ${missingAfter} target words still lack Thai — aborting publish`);

    const tempPath = `${path}.tmp`;
    await writeFile(tempPath, lines, 'utf8');
    await rename(tempPath, path);
    console.log(`Updated HSK ${level}: ${words.length} words`);
  }
  console.log('All HSK 5/6 word translations updated atomically.');
}
