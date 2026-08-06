#!/usr/bin/env node
/**
 * Translate HSK 5–6 example meanings from English to Thai.
 *
 * Mirror of scripts/translate-thai-examples.mjs but scoped to HSK 5/6 (the
 * examples fetched from Youdao/Tatoeba in fetch-examples-youdao.mjs). It
 * reuses the SAME cache (thai-example-translations.json) so sentences that
 * already have a Thai translation (from HSK 1–4 or previous runs) are
 * skipped, and interrupted runs stay resumable.
 *
 * Usage:
 *   node scripts/translate-thai-examples-hsk56.mjs
 *   node scripts/translate-thai-examples-hsk56.mjs --limit 20 --delay 250
 */

import { readFile, rename, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(SCRIPT_DIR, '..');
const DATA_DIR = resolve(APP_ROOT, 'src', 'data', 'hsk3');
const CACHE_DIR = resolve(SCRIPT_DIR, 'cache');
const CACHE_PATH = resolve(CACHE_DIR, 'thai-example-translations.json');
const DEFAULT_LEVELS = [5, 6];
const THAI_RE = /[\u0E00-\u0E7F]/;
const CJK_RE = /[一-龯㐀-䶵]/;
const isValidThai = (value) => THAI_RE.test(String(value || '')) && !CJK_RE.test(String(value || ''));
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
const requestedLevels = String(args.get('levels') ?? DEFAULT_LEVELS.join(','))
  .split(',')
  .map((value) => Number(value.trim()))
  .filter((level) => Number.isInteger(level) && level >= 1 && level <= 7);
const LEVELS = [...new Set(requestedLevels)];
if (LEVELS.length === 0) throw new Error('No valid levels. Use --levels 5,6 or --levels 7.');

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
  const tempPath = `${CACHE_PATH}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
  await rename(tempPath, CACHE_PATH);
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

/** Load words + keep the original file header (PDF-merge style). */
async function loadWords(level) {
  const src = await readFile(resolve(DATA_DIR, `hsk${level}-words.js`), 'utf8');
  const m = src.match(new RegExp(`const HSK${level}_WORDS = \\[([\\s\\S]*?)\\n\\];`));
  if (!m) throw new Error(`Could not find HSK${level}_WORDS array`);
  const entries = JSON.parse(`[${m[1].replace(/,\s*$/, '')}]`);
  const headerEnd = src.indexOf(`const HSK${level}_WORDS`);
  if (headerEnd < 0) throw new Error(`Could not locate header for HSK${level}`);
  return { header: src.slice(0, headerEnd), entries };
}

function render(header, level, words) {
  return [
    header.trimEnd(),
    '',
    `const HSK${level}_WORDS = [`,
    ...words.map((word) => `  ${JSON.stringify(word)},`),
    '];',
    '',
    `export default HSK${level}_WORDS;`,
    '',
  ].join('\n');
}

await import('node:fs/promises').then(({ mkdir }) => mkdir(CACHE_DIR, { recursive: true }));
const cache = await loadCache();
const allWords = [];
for (const level of LEVELS) {
  const { header, entries } = await loadWords(level);
  allWords.push({ level, header, words: entries });
}

const uniqueEnglish = [...new Set(
  allWords.flatMap(({ words }) => words.flatMap((word) => (word.examples || [])
    .filter((example) => !isValidThai(example.meaningThai))
    .map((example) => decodeHtml(example.meaning).trim())
    .filter(Boolean)))
)];
const pending = uniqueEnglish.filter((text) => !cache[text]?.translation || !isValidThai(cache[text].translation));
const toTranslate = pending.slice(0, limit);
const BATCH_SIZE = 8;
console.log(`HSK${LEVELS.join('/')} examples: ${allWords.reduce((sum, item) => sum + item.words.reduce((s, w) => s + (w.examples?.length || 0), 0), 0)}`);
console.log(`Unique English sentences: ${uniqueEnglish.length}`);
console.log(`Cached Thai translations: ${uniqueEnglish.length - pending.length}`);
console.log(`Requests this run: ${toTranslate.length} sentences in batches of ${BATCH_SIZE}`);

for (let index = 0; index < toTranslate.length; index += BATCH_SIZE) {
  const batch = toTranslate.slice(index, index + BATCH_SIZE);
  try {
    await translateBatch(batch, cache);
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
  console.log(`Cache is incomplete: ${pending.length - toTranslate.length} sentences remain. Run the command again to resume.`);
  process.exitCode = 2;
} else {
  const translatedWords = new Map();
  for (const { level, words } of allWords) {
    const mapped = words.map((word) => {
      const examples = (word.examples || []).map((example) => {
        const text = decodeHtml(example.meaning).trim();
        const translation = cache[text]?.translation;
        if (isValidThai(example.meaningThai)) return example;
        if (!translation || !isValidThai(translation)) {
          throw new Error(`Missing Thai translation for ${word.id}: ${JSON.stringify(text)}`);
        }
        return { ...example, meaningThai: translation };
      });
      return { ...word, examples };
    });
    translatedWords.set(level, mapped);
  }

  for (const level of LEVELS) {
    const { header } = allWords.find((item) => item.level === level);
    const path = resolve(DATA_DIR, `hsk${level}-words.js`);
    const tempPath = `${path}.tmp`;
    await writeFile(tempPath, render(header, level, translatedWords.get(level)), 'utf8');
    await rename(tempPath, path);
    console.log(`Updated HSK ${level}: ${translatedWords.get(level).length} words`);
  }
  console.log(`All HSK ${LEVELS.join('/')} example translations updated atomically.`);
}
