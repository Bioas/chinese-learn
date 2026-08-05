#!/usr/bin/env node
/**
 * QC fix pass for non-HSK topical vocabulary (src/data/vocabulary.js):
 * re-translates example sentences AND word-level meaningThai fields whose Thai
 * translation still contains leftover Chinese characters (e.g. "ครอบครัวของเขา
 * 移民ไปแคนาดา", "meaningThai":"ร้าน专卖").
 *
 * These came from an earlier partial dictionary-based pass; the fix re-translates
 * zh → th with Google (cached in thai-spam-fix-cache.json, same cache as the
 * HSK spam fix), then patches only those example objects / word meaningThai
 * fields in vocabulary.js via exact JSON-string replacement, preserving every
 * other byte of the file.
 *
 * Usage: node scripts/fix-nonhsk-cjk.mjs
 */
import { readFile, writeFile, rename, mkdir, copyFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(SCRIPT_DIR, '..');
const FILE = resolve(APP_ROOT, 'src', 'data', 'vocabulary.js');
const BACKUP = FILE + '.bak';
const CACHE_DIR = resolve(SCRIPT_DIR, 'cache');
const CACHE_FILE = resolve(CACHE_DIR, 'thai-spam-fix-cache.json');

const THAI_RE = /[\u0E00-\u0E7F]/;
const CJK_RE = /[\u4e00-\u9fff]/;
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
  const tmp = CACHE_FILE + '.tmp4';
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
  let th = '';
  for (let attempt = 0; attempt < 5 && !th; attempt += 1) {
    const resp = await fetchWithTimeout(url, {
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; ChineseLearnThaiDataBot/1.0)' },
    });
    if (resp.status === 429) {
      await new Promise((r) => setTimeout(r, 15000 * (attempt + 1)));
      continue;
    }
    if (!resp.ok) throw new Error(`Google HTTP ${resp.status}`);
    const data = await resp.json();
    th = Array.isArray(data?.[0])
      ? data[0].map((part) => part?.[0] || '').join('').replace(/\n/g, '').trim()
      : '';
    if (!THAI_RE.test(th)) th = '';
  }
  if (!th) throw new Error('no Thai after retries');
  if (CJK_RE.test(th)) throw new Error(`translation still has CJK: ${th}`);
  return th;
}

// ── collect targets ────────────────────────────────────────────────
const { VOCABULARY } = await import('../src/data/vocabulary.js');
const targets = []; // { word, ex?, field: 'example' | 'wordMeaning' }
for (const w of VOCABULARY) {
  if (w.category === 'hsk') continue;
  for (const ex of w.examples || []) {
    const th = ex.meaningThai || '';
    if (CJK_RE.test(th)) targets.push({ word: w, ex, field: 'example' });
  }
  const mt = w.meaningThai || '';
  if (CJK_RE.test(mt)) targets.push({ word: w, field: 'wordMeaning' });
}
console.log(`non-HSK entries with leftover CJK in Thai: ${targets.length} (${targets.filter((t) => t.field === 'example').length} examples, ${targets.filter((t) => t.field === 'wordMeaning').length} word meanings)`);
if (!targets.length) {
  console.log('Nothing to fix.');
  process.exit(0);
}

// ── translate unique sentences/words ───────────────────────────────
const cache = await loadCache();
const uniqueZh = [...new Set(targets.map((t) => (t.field === 'example' ? t.ex.chinese.trim() : t.word.chinese.trim())))];
console.log(`Unique Chinese texts to translate: ${uniqueZh.length}`);
for (let i = 0; i < uniqueZh.length; i++) {
  const text = uniqueZh[i];
  let th = cache[text];
  if (!th) {
    th = await translateZhToTh(text);
    cache[text] = th;
    await saveCache(cache);
  }
  if (CJK_RE.test(th)) throw new Error(`cached translation still has CJK: ${text} -> ${th}`);
  console.log(`  ${i + 1}/${uniqueZh.length}: ${text} -> ${th}`);
  await new Promise((r) => setTimeout(r, 1000));
}

// ── patch vocabulary.js with exact JSON-string replacement ─────────
const src = await readFile(FILE, 'utf8');
await copyFile(FILE, BACKUP);
let patched = 0;
let changed = src;
for (const t of targets) {
  if (t.field === 'example') {
    // Example objects live inside a single-line word entry; the object string
    // (chinese,pinyin,meaning,meaningThai order) is unique in the file.
    const oldEx = { chinese: t.ex.chinese, pinyin: t.ex.pinyin, meaning: t.ex.meaning, meaningThai: t.ex.meaningThai };
    const newEx = { ...oldEx, meaningThai: cache[t.ex.chinese.trim()] };
    const oldStr = JSON.stringify(oldEx);
    const newStr = JSON.stringify(newEx);
    const count = changed.split(oldStr).length - 1;
    if (count !== 1) throw new Error(`Expected exactly 1 occurrence of example ${t.ex.chinese}, found ${count}`);
    changed = changed.replace(oldStr, newStr);
    patched++;
  } else {
    // Word-level: patch only the meaningThai field of the entry identified by
    // id. The entry starts `{"id":"…"` and its word-level meaningThai is the
    // first such field (comes right after "meaning", before examples), so we
    // can anchor a regex on the id without depending on field order, computed
    // fields, or line endings.
    const id = t.word.id;
    const newThai = cache[t.word.chinese.trim()];
    const escId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`\{\"id\":\"${escId}\"[^}]*?\"meaningThai\":\"((?:[^"\\\\]|\\\\.)*)\"`);
    const m = changed.match(re);
    if (!m) throw new Error(`No meaningThai after id ${id}`);
    const oldVal = m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    if (!CJK_RE.test(oldVal)) throw new Error(`MeaningThai for ${id} has no CJK: ${oldVal}`);
    const oldField = `"meaningThai":"${m[1]}"`;
    const newField = `"meaningThai":"${newThai.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    const occurrences = changed.split(oldField).length - 1;
    if (occurrences !== 1) throw new Error(`Expected 1 occurrence of meaningThai for ${id}, found ${occurrences}`);
    changed = changed.replace(oldField, newField);
    patched++;
  }
}
if (patched !== targets.length) throw new Error(`Patched ${patched} != targets ${targets.length}`);

const tmp = FILE + `.fix${process.pid}`;
await writeFile(tmp, changed, 'utf8');
await rename(tmp, FILE);

// ── post-write self-check ──────────────────────────────────────────
const check = await import(`../src/data/vocabulary.js?t=${Date.now()}`);
const checkWords = check.VOCABULARY;
if (checkWords.length !== VOCABULARY.length) {
  throw new Error(`Self-check failed: word count ${checkWords.length} != ${VOCABULARY.length}`);
}
let remaining = 0;
for (const w of checkWords) {
  if (w.category === 'hsk') continue;
  if (CJK_RE.test(w.meaningThai || '')) {
    remaining++;
    console.log('  word still has CJK:', w.chinese, '|', w.meaningThai);
  }
  for (const ex of w.examples || []) {
    if (CJK_RE.test(ex.meaningThai || '')) {
      remaining++;
      console.log('  example still has CJK:', w.chinese, '|', ex.meaningThai);
    }
  }
}
if (remaining > 0) throw new Error(`Self-check failed: ${remaining} entries still have CJK`);
console.log(`Patched ${patched} entries. Self-check OK (${checkWords.length} words, 0 CJK in Thai).`);
