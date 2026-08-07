#!/usr/bin/env node
/**
 * Translate HSK 7–9 example meanings from English to Thai.
 *
 * Mirror of scripts/translate-thai-examples-hsk56.mjs but scoped to HSK 7
 * (the hsk7-words.js dataset). It reuses the SAME cache
 * (thai-example-translations.json) so sentences that already have a Thai
 * translation (from HSK 1–6 or previous runs) are skipped, and interrupted
 * runs stay resumable.
 *
 * Usage:
 *   node scripts/translate-thai-examples-hsk7.mjs
 *   node scripts/translate-thai-examples-hsk7.mjs --limit 200 --delay 350
 */

import { readFile, rename, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(SCRIPT_DIR, '..');
const DATA_DIR = resolve(APP_ROOT, 'src', 'data', 'hsk3');
const CACHE_DIR = resolve(SCRIPT_DIR, 'cache');
const CACHE_PATH = resolve(CACHE_DIR, 'thai-example-translations.json');
const LEVELS = [7];
const THAI_RE = /[\u0E00-\u0E7F]/;
const CJK_RE = /[\u4E00-\u9FFF\u3400-\u4DBF]/;
// Translations that look like Thai but are actually meta/placeholder text
// leaked from earlier pipelines. The translate-thai-examples-hsk7 script
// (and any QC that uses isValidThai) should treat these as INVALID so they
// get re-fetched from the real en->th provider.
const BAD_THAI_PHRASES = Object.freeze([
  String.raw`กำลังเรียนรู้การใช้คำศัพท์นี้ในประโยค`,
]);
const isBadThai = (text) => BAD_THAI_PHRASES.some((phrase) => text.includes(phrase));
const isValidThai = (value) => {
  const text = String(value || '').trim();
  if (!text) return false;
  if (isBadThai(text)) return false;
  return THAI_RE.test(text) && !CJK_RE.test(text);
};
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
const delayMs = args.has('delay') ? Math.max(0, Number(args.get('delay'))) : 350;
const flushOnly = args.has('flush-only');
const flushEach = args.has('flush-each');
const flushEvery = args.has('flush-every')
  ? Math.max(1, Number(args.get('flush-every')))
  : 6;

/**
 * Merge cache translations into entries WITHOUT making any network calls.
 * Returns the (possibly mutated) entries. Caller decides whether to
 * persist to disk.
 */
function mergeCacheIntoLevels(allWords, cache) {
  return allWords.map(({ level, words }) => {
    const mapped = words.map((word) => {
      const examples = (word.examples || []).map((example) => {
        if (isValidThai(example.meaningThai)) return example;
        const text = decodeHtml(example.meaning).trim();
        const translation = cache[text]?.translation;
        if (!translation || !isValidThai(translation)) return example;
        return { ...example, meaningThai: translation };
      });
      return { ...word, examples };
    });
    return { level, words: mapped };
  });
}

function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x2F;|&#47;/g, '/');
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

async function loadCache() {
  if (!existsSync(CACHE_PATH)) return {};
  return JSON.parse(await readFile(CACHE_PATH, 'utf8'));
}

async function saveCache(cache) {
  const { mkdir } = await import('node:fs/promises');
  await mkdir(CACHE_DIR, { recursive: true }).catch(() => {});
  const tempPath = `${CACHE_PATH}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
  // Windows often returns EPERM transiently when AV or another reader holds
  // the file; retry the rename with a tiny jittered back-off before giving
  // up. Up to ~6 attempts (~3s window) is more than enough on this workstation.
  let lastErr;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      await rename(tempPath, CACHE_PATH);
      return;
    } catch (err) {
      lastErr = err;
      const code = err && err.code;
      if (code === 'ENOENT') {
        return;
      }
      if (attempt === 5) break;
      const waitMs = 200 + attempt * 150 + Math.floor(Math.random() * 100);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  throw lastErr;
}

async function requestGoogleBatch(texts) {
  const url = new URL('https://translate.google.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', 'en');
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
  if (translated.length !== texts.length || translated.some((text) => !isValidThai(text))) {
    throw new Error(`Google returned ${translated.length}/${texts.length} valid Thai segments`);
  }
  return translated;
}

async function requestGoogleSingle(text) {
  const url = new URL('https://translate.google.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', 'en');
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
  if (!isValidThai(translated)) throw new Error('Google returned no clean Thai translation');
  return translated;
}

async function requestMyMemory(text) {
  const url = new URL('https://api.mymemory.translated.net/get');
  url.searchParams.set('q', text);
  url.searchParams.set('langpair', 'en|th');
  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error(`MyMemory HTTP ${response.status}`);
  const data = await response.json();
  const translated = String(data?.responseData?.translatedText || '').trim();
  if (!isValidThai(translated)) throw new Error('MyMemory returned no clean Thai translation');
  return translated;
}

async function translateBatch(texts, cache) {
  const cleanTexts = texts.map((text) => decodeHtml(text).trim());
  // 1. Try Google Translate (single batch call for efficiency)
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const translated = await requestGoogleBatch(cleanTexts);
      const now = new Date().toISOString();
      cleanTexts.forEach((text, index) => {
        cache[text] = { translation: translated[index], provider: 'google-translate-web', translatedAt: now };
      });
      return;
    } catch (error) {
      await sleep(1000 * (attempt + 1));
    }
  }

  // 2. Fallback: per-sentence Google. Skip failing sentences so a single
  // rate-limited call does not erase work already paid for.
  for (const text of cleanTexts) {
    if (cache[text]?.translation) continue;
    try {
      const translated = await requestGoogleSingle(text);
      cache[text] = { translation: translated, provider: 'google-translate-web', translatedAt: new Date().toISOString() };
      await sleep(delayMs);
    } catch (error) {
      await sleep(delayMs);
    }
  }
  if (cleanTexts.every((text) => cache[text]?.translation)) return;

  // 3. MyMemory as last-resort fallback. Same skip-on-failure policy.
  for (const text of cleanTexts) {
    if (cache[text]?.translation) continue;
    try {
      const translation = await requestMyMemory(text);
      cache[text] = { translation: translated, provider: 'mymemory', translatedAt: new Date().toISOString() };
      await sleep(delayMs);
    } catch (error) {
      await sleep(delayMs);
    }
  }
  // Outstanding sentences are simply skipped for this run. The cache keeps
  // what we DID manage and the next run will retry the gaps.
}

async function loadWords(level) {
  // The hsk7 dataset is huge; read the actual default export instead of the
  // raw text so we don't depend on the const variable name in the bundle.
  // Use pathToFileURL so the import() call works on Windows where plain
  // absolute paths are rejected as `d:` URLs by the ESM loader.
  const fileUrl = pathToFileURL(resolve(DATA_DIR, `hsk${level}-words.js`));
  fileUrl.searchParams.set('t', String(Date.now()));
  const mod = await import(fileUrl.href);
  const entries = Array.isArray(mod.default) ? mod.default : mod.HSK7_WORDS;
  if (!Array.isArray(entries)) throw new Error(`HSK ${level} did not export an array`);
  return { entries };
}

async function writeWords(level, entries) {
  const path = resolve(DATA_DIR, `hsk${level}-words.js`);
  const backupPath = `${path}.bak`;
  const tempPath = `${path}.tmp`;
  // Read existing file and replace only the trailing default export block —
  // preserves any leading header / comments above the array literal.
  const original = await readFile(path, 'utf8');
  const match = original.match(/const HSK7_WORDS = \[[\s\S]*?\n\];/);
  if (!match) throw new Error(`Could not locate HSK7_WORDS array literal in ${path}`);
  const start = match.index;
  const end = start + match[0].length;
  const newBlock = `const HSK7_WORDS = [\n${entries.map((word) => `  ${JSON.stringify(word)},`).join('\n')}\n];`;
  const next = `${original.slice(0, start)}${newBlock}${original.slice(end)}`;
  // Atomic write: stage to .tmp, fsync via rename, keep last good copy as .bak.
  // Windows AV / file indexer occasionally throws EPERM mid-rename; back off
  // and retry up to ~6 times before bubbling the error up.
  await rename(path, backupPath).catch(() => {});
  await writeFile(tempPath, next, 'utf8');
  let lastErr;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      await rename(tempPath, path);
      return;
    } catch (err) {
      lastErr = err;
      const code = err && err.code;
      if (code === 'ENOENT') return;
      if (attempt === 5) break;
      const waitMs = 250 + attempt * 200 + Math.floor(Math.random() * 150);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  throw lastErr;
}

await import('node:fs/promises')
  .then(({ mkdir }) => mkdir(CACHE_DIR, { recursive: true }))
  .catch(() => {});

const cache = await loadCache();
const allWords = [];
let totalExamples = 0;
for (const level of LEVELS) {
  const { entries } = await loadWords(level);
  for (const w of entries) totalExamples += (w.examples || []).length;
  allWords.push({ level, words: entries });
}

const uniqueEnglish = [...new Set(
  allWords.flatMap(({ words }) => words.flatMap((word) => (word.examples || [])
    .filter((example) => !isValidThai(example.meaningThai))
    .map((example) => decodeHtml(example.meaning).trim())
    .filter(Boolean)))
)];
const pending = uniqueEnglish.filter((text) => !cache[text]?.translation || !isValidThai(cache[text].translation));
const toTranslate = pending.slice(0, limit);
const BATCH_SIZE = 6;

console.log(`HSK ${LEVELS.join('/')} words: ${allWords.reduce((sum, item) => sum + item.words.length, 0)}`);
console.log(`HSK ${LEVELS.join('/')} total examples: ${totalExamples}`);
console.log(`Unique English sentences missing Thai: ${uniqueEnglish.length}`);
console.log(`Already cached: ${uniqueEnglish.length - pending.length}`);
console.log(`Requests this run: ${toTranslate.length} sentences in batches of ${BATCH_SIZE}`);

// `--flush-only` short-circuit: merge everything cache already has into the
// vocabulary file and exit. Use this after a previous interrupted run to
// commit progress without paying the translate cost again.
if (flushOnly) {
  const merged = mergeCacheIntoLevels(allWords, cache);
  let flushedNow = 0;
  let stillEmpty = 0;
  for (const { level, words } of merged) {
    await writeWords(level, words);
    for (const w of words) {
      for (const ex of (w.examples || [])) {
        if (isValidThai(ex.meaningThai)) flushedNow++;
        else stillEmpty++;
      }
    }
    console.log(`Flushed HSK ${level}: ${words.length} words`);
  }
  console.log(`--flush-only done: ${flushedNow} examples now have Thai, ${stillEmpty} still empty (will need translate).`);
  process.exit(0);
}

for (let index = 0; index < toTranslate.length; index += BATCH_SIZE) {
  const batch = toTranslate.slice(index, index + BATCH_SIZE);
  try {
    await translateBatch(batch, cache);
    await saveCache(cache);
    const batchIndex = Math.floor(index / BATCH_SIZE);
    if (flushEach && batchIndex % flushEvery === 0) {
      // Commit progress to hsk7-words.js every flushEvery batches so an
      // interruption (timeout, Ctrl+C, EPERM storm) never erases work
      // already paid for. Default is every 6 batches (36 sentences) which
      // gives a good safety/coverage tradeoff without melting Windows AV.
      const merged = mergeCacheIntoLevels(allWords, cache);
      for (const { level, words } of merged) {
        await writeWords(level, words);
      }
    }
    console.log(`Translated ${Math.min(index + batch.length, toTranslate.length)}/${toTranslate.length}`);
  } catch (error) {
    await saveCache(cache);
    throw new Error(`Failed translating batch starting at ${index + 1}: ${error.message}`);
  }
  if (index + BATCH_SIZE < toTranslate.length) await sleep(delayMs);
}
await saveCache(cache);

if (pending.length > toTranslate.length) {
  console.log(`Cache is incomplete: ${pending.length - toTranslate.length} sentences remain. Run the command again to resume.`);
  process.exitCode = 2;
} else {
  const translatedWords = mergeCacheIntoLevels(allWords, cache);

  for (const { level, words } of translatedWords) {
    let missingForWord = 0;
    for (const w of words) {
      for (const ex of (w.examples || [])) {
        if (!isValidThai(ex.meaningThai)) missingForWord++;
      }
    }
    if (missingForWord > 0) {
      throw new Error(`Missing Thai translation for ${missingForWord} example(s) in HSK ${level}`);
    }
    await writeWords(level, words);
    console.log(`Updated HSK ${level}: ${words.length} words`);
  }
  console.log(`All HSK ${LEVELS.join('/')} example translations updated atomically.`);
}
