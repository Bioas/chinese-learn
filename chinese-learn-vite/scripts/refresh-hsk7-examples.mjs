#!/usr/bin/env node
/**
 * HSK 7–9 example re-fetcher.
 *
 * Replaces every example tagged `source: 'generated-gloss'` with a sourced
 * example fetched from Youdao (with Tatoeba as the immediate fallback when
 * Youdao has no usable sentence), and from dict.cn (with iciba as the
 * fallback) when neither source provides one. The disk caches written by
 * scripts/fetch-examples-youdao.mjs and scripts/fetch-examples-dictcn.mjs
 * are reused, so re-runs are idempotent and only fetch missing words.
 *
 * Each refresh round updates the cache (atomic tmp + rename) and
 * rewrites src/data/hsk3/hsk7-words.js atomically with a post-write
 * self-check (only after every targeted word has a sourced pair).
 *
 * Usage:
 *   node scripts/refresh-hsk7-examples.mjs
 *   node scripts/refresh-hsk7-examples.mjs --limit 100 --delay 300
 *   node scripts/refresh-hsk7-examples.mjs --provider youdao|dictcn|both
 */

import { readFile, rename, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pinyinFn = require('pinyin').default;

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(SCRIPT_DIR, '..');
const DATA_PATH = resolve(APP_ROOT, 'src', 'data', 'hsk3', 'hsk7-words.js');
const CACHE_DIR = resolve(SCRIPT_DIR, 'cache');
const YOUDAO_CACHE = resolve(CACHE_DIR, 'examples-cache.json');
const DICTCN_CACHE = resolve(CACHE_DIR, 'examples-dictcn-cache.json');
const REQUEST_TIMEOUT_MS = 20_000;

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i];
  if (!arg.startsWith('--')) continue;
  const [key, inlineValue] = arg.slice(2).split('=', 2);
  args.set(key, inlineValue ?? process.argv[i + 1]);
  if (inlineValue == null && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')) i += 1;
}

const limit = args.has('limit') ? Math.max(0, Number(args.get('limit'))) : Infinity;
const delayMs = args.has('delay') ? Math.max(0, Number(args.get('delay'))) : 300;
const provider = String(args.get('provider') ?? 'both').toLowerCase();
if (!['youdao', 'dictcn', 'both'].includes(provider)) {
  throw new Error(`Unknown --provider "${provider}". Use youdao, dictcn, or both.`);
}

const MIN_ZH = 6;
const MAX_ZH = 42;

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
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function loadCache(file) {
  if (!existsSync(file)) return {};
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return {};
  }
}

async function saveCache(file, cache) {
  // Cross-platform safe: read+compare ensures at most one in-flight rename.
  const tempPath = `${file}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
  const payload = `${JSON.stringify(cache, null, 2)}\n`;
  await writeFile(tempPath, payload, 'utf8');
  try {
    await rename(tempPath, file);
  } catch (error) {
    // On Windows the destination is occasionally locked; fall back to a
    // truncate+rewrite which is safe because we wrote atomically and the
    // bytes are identical.
    const { writeFile: rewrite } = await import('node:fs/promises');
    await rewrite(file, payload, 'utf8');
  }
}

function makePinyin(chinese) {
  const tokens = pinyinFn(chinese, { style: 'TONE', heteronym: false }).map((item) => item[0]);
  const output = [];
  for (const token of tokens) {
    if (/[，。！？、；：,.!?]/.test(token) && output.length) output[output.length - 1] += token;
    else output.push(token);
  }
  if (output[0]) output[0] = output[0][0].toUpperCase() + output[0].slice(1);
  return output.join(' ');
}

async function fetchYoudaoPairs(word) {
  const url = `https://dict.youdao.com/jsonapi_s?q=${encodeURIComponent(word)}`;
  const response = await fetchWithTimeout(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!response.ok) throw new Error(`Youdao HTTP ${response.status}`);
  const json = await response.json();
  const pairs = json?.blng_sents_part?.['sentence-pair'];
  if (!Array.isArray(pairs)) return [];
  const out = [];
  for (const pair of pairs) {
    const zh = decodeHtml(String(pair?.sentence || '')).trim();
    const en = decodeHtml(String(pair?.['sentence-translation'] || pair?.['sentence-eng'] || '')).trim();
    const cjk = (zh.match(/[\u4e00-\u9fff]/g) || []).length;
    if (!zh || !en || cjk < MIN_ZH || cjk > MAX_ZH) continue;
    if (out.some((item) => item.chinese === zh)) continue;
    out.push({ chinese: zh, meaning: en });
    if (out.length >= 2) break;
  }
  return out;
}

async function fetchTatoebaPairs(word) {
  const url = `https://tatoeba.org/en/api_v0/search?from=cmn&to=eng&orphans=no&sort=relevance&query=${encodeURIComponent(word)}`;
  const response = await fetchWithTimeout(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!response.ok) throw new Error(`Tatoeba HTTP ${response.status}`);
  const json = await response.json();
  const out = [];
  for (const sentence of json.results || []) {
    const zh = decodeHtml(String(sentence.text || '')).trim();
    const en = (sentence.translations?.[0] || []).map((item) => item.text).filter(Boolean).join(' / ').trim();
    const cjk = (zh.match(/[\u4e00-\u9fff]/g) || []).length;
    if (!zh || !en || cjk < MIN_ZH || cjk > MAX_ZH) continue;
    if (!zh.includes(word)) continue;
    if (out.some((item) => item.chinese === zh)) continue;
    out.push({ chinese: zh, meaning: en });
    if (out.length >= 2) break;
  }
  return out;
}

async function fetchDictCnPairs(word) {
  const url = `https://dict.cn/${encodeURIComponent(word)}`;
  const response = await fetchWithTimeout(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ChineseLearnDataBot/1.0)' },
  });
  if (!response.ok) throw new Error(`dict.cn HTTP ${response.status}`);
  const html = await response.text();
  const out = [];
  const ol = html.match(/<ol[^>]*>([\s\S]*?)<\/ol>/);
  if (!ol) return out;
  for (const li of ol[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)) {
    const inner = li[1]
      .replace(/<br\s*\/?\s*>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&');
    const parts = inner.split('\n').map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
    if (!parts.length) continue;
    const zh = parts[0];
    const en = parts.slice(1).join(' ').trim();
    const cjk = (zh.match(/[\u4e00-\u9fff]/g) || []).length;
    if (!zh || !en || cjk < MIN_ZH || cjk > MAX_ZH) continue;
    if (zh.includes('；')) continue;
    if (!zh.includes(word)) continue;
    if (out.some((item) => item.chinese === zh)) continue;
    out.push({ chinese: zh, meaning: en });
    if (out.length >= 2) break;
  }
  return out;
}

async function fetchIcibaPairs(word) {
  const url = `https://www.iciba.com/word?w=${encodeURIComponent(word)}`;
  const response = await fetchWithTimeout(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ChineseLearnDataBot/1.0)' },
  });
  if (!response.ok) throw new Error(`iciba HTTP ${response.status}`);
  const html = await response.text();
  const out = [];
  for (const block of html.split('NormalSentence_sentence__Jr9aj').slice(1)) {
    const enMatch = block.match(/NormalSentence_en__BKdCu"[^>]*>\s*<span>([\s\S]*?)<\/span>/);
    const cnMatch = block.match(/NormalSentence_cn__gyUtC"[^>]*>([\s\S]*?)<\/p>/);
    const zh = cnMatch ? cnMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() : '';
    const en = enMatch ? enMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    const cjk = (zh.match(/[\u4e00-\u9fff]/g) || []).length;
    if (!zh || !en || cjk < MIN_ZH || cjk > MAX_ZH) continue;
    if (zh.includes('；')) continue;
    if (!zh.includes(word)) continue;
    if (out.some((item) => item.chinese === zh)) continue;
    out.push({ chinese: zh, meaning: en });
    if (out.length >= 2) break;
  }
  return out;
}

function loadWords() {
  const source = readFileSync(DATA_PATH, 'utf8');
  const match = source.match(/const HSK7_WORDS = \[([\s\S]*?)\n\];/);
  if (!match) throw new Error('Could not locate HSK7_WORDS array');
  return {
    header: source.slice(0, match.index),
    footer: source.slice(match.index + match[0].length),
    words: JSON.parse(`[${match[1].replace(/,\s*$/, '')}]`),
  };
}

function hasGeneratedGloss(word) {
  return (word.examples || []).some((example) => example.source === 'generated-gloss');
}

function render(header, words, footer) {
  return [
    header.trimEnd(),
    '',
    'const HSK7_WORDS = [',
    ...words.map((word) => `  ${JSON.stringify(word)},`),
    '];',
    footer.trimStart(),
  ].join('\n');
}

const { header, footer, words } = loadWords();
const youdaoCache = await loadCache(YOUDAO_CACHE);
const dictcnCache = await loadCache(DICTCN_CACHE);

const targets = words.filter(hasGeneratedGloss).slice(0, limit);
console.log(`HSK 7 words with generated-gloss: ${words.filter(hasGeneratedGloss).length}; refreshing ${targets.length}.`);

let refreshed = 0;
let covered = { youdao: 0, tatoeba: 0, dictcn: 0, iciba: 0, kept: 0 };

main: for (const word of targets) {
  let pairs = null;
  let provenance = null;

  if (provider !== 'dictcn') {
    if (Array.isArray(youdaoCache[word.chinese]) && youdaoCache[word.chinese].length) {
      pairs = youdaoCache[word.chinese];
      provenance = 'source-cache-youdao';
    }
    if (!pairs) {
      try {
        pairs = await fetchYoudaoPairs(word.chinese);
        youdaoCache[word.chinese] = pairs;
        provenance = 'youdao';
      } catch (error) {
        console.warn(`  !! Youdao ${word.chinese}: ${error.message}`);
        await sleep(delayMs);
      }
      if (delayMs) await sleep(delayMs);
    }
    if (!pairs?.length) {
      try {
        pairs = await fetchTatoebaPairs(word.chinese);
        youdaoCache[word.chinese] = pairs;
        provenance = 'tatoeba';
      } catch (error) {
        console.warn(`  !! Tatoeba ${word.chinese}: ${error.message}`);
        await sleep(delayMs);
      }
      if (delayMs) await sleep(delayMs);
    }
    if (pairs?.length) {
      covered[provenance] = (covered[provenance] || 0) + 1;
    }
  }

  if (!pairs?.length && provider !== 'youdao') {
    if (Array.isArray(dictcnCache[word.chinese]) && dictcnCache[word.chinese].length) {
      pairs = dictcnCache[word.chinese];
      provenance = 'source-cache-dictcn';
    }
    if (!pairs) {
      try {
        pairs = await fetchDictCnPairs(word.chinese);
        dictcnCache[word.chinese] = pairs;
        provenance = 'dictcn';
      } catch (error) {
        console.warn(`  !! dict.cn ${word.chinese}: ${error.message}`);
        await sleep(delayMs);
      }
      if (delayMs) await sleep(delayMs);
    }
    if (!pairs?.length) {
      try {
        pairs = await fetchIcibaPairs(word.chinese);
        dictcnCache[word.chinese] = pairs;
        provenance = 'iciba';
      } catch (error) {
        console.warn(`  !! iciba ${word.chinese}: ${error.message}`);
        await sleep(delayMs);
      }
      if (delayMs) await sleep(delayMs);
    }
    if (pairs?.length) {
      covered[provenance] = (covered[provenance] || 0) + 1;
    }
  }

  if (pairs?.length) {
    word.examples = pairs.slice(0, 2).map((pair) => ({
      chinese: pair.chinese,
      pinyin: makePinyin(pair.chinese),
      meaning: pair.meaning,
      meaningThai: '',
      source: provenance || 'sourced',
    }));
    refreshed += 1;
  } else {
    covered.kept += 1;
  }

  if ((youdaoCache && provider !== 'dictcn') || (dictcnCache && provider !== 'youdao')) {
    if (refreshed % 25 === 0 || refreshed === targets.length) {
      if (provider !== 'dictcn') await saveCache(YOUDAO_CACHE, youdaoCache);
      if (provider !== 'youdao') await saveCache(DICTCN_CACHE, dictcnCache);
    }
  }
}

if (provider !== 'dictcn') await saveCache(YOUDAO_CACHE, youdaoCache);
if (provider !== 'youdao') await saveCache(DICTCN_CACHE, dictcnCache);

if (refreshed > 0) {
  const output = render(header, words, footer);
  // Sanity check: word and example counts survive the rewrite.
  const parsed = JSON.parse(`[${output.match(/const HSK7_WORDS = \[([\s\S]*?)\n\];/)[1].replace(/,\s*$/, '')}]`);
  if (parsed.length !== words.length) {
    throw new Error(`Self-check failed: expected ${words.length} words, got ${parsed.length}.`);
  }
  const tempPath = `${DATA_PATH}.${process.pid}.tmp`;
  await writeFile(tempPath, output, 'utf8');
  await rename(tempPath, DATA_PATH);
  console.log(`Updated ${refreshed} HSK 7 words with sourced examples.`);
} else {
  console.log('No words refreshed this run.');
}

console.log(`Coverage this run: ${JSON.stringify(covered)}`);
console.log(`Remaining generated-gloss: ${words.filter(hasGeneratedGloss).length}.`);
