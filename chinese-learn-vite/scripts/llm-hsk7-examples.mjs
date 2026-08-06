// Generates HSK 7–9 example sentences for words that still use
// `source: 'generated-gloss'` by merging LLM-produced batches.
//
// Pipeline (resumable, atomic):
//   1. extract   → scripts/cache/hsk7-llm-input.jsonl     (823 entries, one per line)
//   2. (you/LLM produce) scripts/cache/hsk7-llm-batches/batch-NNN.jsonl
//   3. merge     → validates (no CJK in EN/TH, target word in CN, pinyin tones) and merges
//
// Usage:
//   node scripts/llm-hsk7-examples.mjs extract
//   node scripts/llm-hsk7-examples.mjs merge           # merges all batches
//   node scripts/llm-hsk7-examples.mjs status          # shows pending / merged counters
//   node scripts/llm-hsk7-examples.mjs validate <batch-file>

import { readFile, writeFile, rename, mkdir, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { default as HSK7_WORDS } from '../src/data/hsk3/hsk7-words.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = resolve(__dirname, 'cache');
const INPUT_PATH = resolve(CACHE_DIR, 'hsk7-llm-input.jsonl');
const BATCH_DIR = resolve(CACHE_DIR, 'hsk7-llm-batches');
const HSK7_PATH = resolve(__dirname, '../src/data/hsk3/hsk7-words.js');

const CJK_RE = /[㐀-䶵一-鿿豈-﫿]/;
const TONED_PINYIN_RE = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙǕǗǙǛÜ]/;

// Lookup table for fast id→word resolution
const TARGET_LOOKUP = new Map(HSK7_WORDS.map((w) => [w.id, w]));

// ── extract ──────────────────────────────────────────────────────
async function extract() {
  await mkdir(CACHE_DIR, { recursive: true });
  const lines = HSK7_WORDS
    .filter((w) => (w.examples || []).some((e) => e.source === 'generated-gloss'))
    .map((w) => JSON.stringify({
      id: w.id, chinese: w.chinese, pinyin: w.pinyin,
      meaning: w.meaning, meaningThai: w.meaningThai,
    }));
  await writeFile(INPUT_PATH, lines.join('\n') + '\n', 'utf8');
  console.log(`✓ wrote ${lines.length} entries → ${INPUT_PATH}`);
  console.log(`  next: write LLM batches under ${BATCH_DIR}/`);
  console.log(`  format: each line = { id, examples:[{chinese,pinyin,meaning,meaningThai}] }`);
}

// ── batch I/O ────────────────────────────────────────────────────
async function listBatches() {
  try { await mkdir(BATCH_DIR, { recursive: true }); } catch {}
  const files = (await readdir(BATCH_DIR)).filter((f) => /^batch-\d+\.jsonl$/.test(f)).sort();
  return files.map((f) => resolve(BATCH_DIR, f));
}

function parseBatch(text) {
  return text
    .split('\n')
    .filter((l) => l.trim())
    .map((l, i) => {
      try { return { ok: true, idx: i, entry: JSON.parse(l) }; }
      catch (e) { return { ok: false, idx: i, error: e.message, raw: l.slice(0, 200) }; }
    });
}

// ── validate ─────────────────────────────────────────────────────
function validateEntry(id, word, examples) {
  const errors = [];
  if (!examples?.length) errors.push('no examples');
  for (const e of examples) {
    if (!e.chinese?.trim()) errors.push('empty chinese');
    else if (!e.chinese.includes(word.chinese))
      errors.push(`chinese "${e.chinese.slice(0, 60)}" missing target "${word.chinese}"`);

    if (CJK_RE.test(e.meaning || ''))
      errors.push(`CJK in meaning: ${(e.meaning || '').slice(0, 60)}`);

    if (CJK_RE.test(e.meaningThai || ''))
      errors.push(`CJK in meaningThai: ${(e.meaningThai || '').slice(0, 60)}`);

    const pinyinHasTones = TONED_PINYIN_RE.test(e.pinyin || '') || TONED_PINYIN_RE.test(word.pinyin || '');
    if (!pinyinHasTones)
      errors.push(`pinyin lacks diacritics: "${e.pinyin || word.pinyin || ''}"`);

    if (!e.meaning?.trim()) errors.push('empty meaning');
    if (!e.meaningThai?.trim()) errors.push('empty meaningThai');
  }
  return errors;
}

// ── merge ────────────────────────────────────────────────────────
async function merge() {
  await mkdir(BATCH_DIR, { recursive: true });
  const batches = await listBatches();
  if (!batches.length) { console.log('no batches yet'); return; }

  const mergedById = new Map();
  const errors = [];

  for (const path of batches) {
    const text = await readFile(path, 'utf8');
    for (const r of parseBatch(text)) {
      if (!r.ok) { errors.push({ path, idx: r.idx, error: r.error }); continue; }
      const { id, examples } = r.entry;
      if (!id || !examples?.length) continue;
      if (mergedById.has(id)) continue; // first batch wins (resumable; safe to re-merge)
      const word = TARGET_LOOKUP.get(id);
      if (!word) { errors.push({ id, error: 'unknown id' }); continue; }
      const errs = validateEntry(id, word, examples);
      if (errs.length) { errors.push({ id, file: path, errors: errs }); continue; }
      mergedById.set(id, { id, examples });
    }
  }

  // Idempotency check: only block if entries would overwrite a "real sourced" example
  // (youdao/tatoeba/dictcn/iciba). Re-writing 'llm-generated' or 'generated-gloss'
  // is allowed and useful for re-running the pipeline.
  const REAL_SOURCES = new Set(['youdao', 'tatoeba', 'dictcn', 'iciba', 'source-cache', 'source-cache-youdao', 'source-cache-dictcn']);
  for (const [id] of mergedById) {
    const word = HSK7_WORDS.find((w) => w.id === id);
    const sources = (word?.examples || []).map((e) => e.source).filter(Boolean);
    const hasReal = sources.some((s) => REAL_SOURCES.has(s));
    if (hasReal) errors.push({ id, error: 'would overwrite real sourced example (skip)' });
  }

  console.log(`✓ per-entry validation: ${mergedById.size} valid, ${errors.length} errors`);
  if (errors.length) {
    for (const e of errors.slice(0, 20)) console.log('  ⚠', JSON.stringify(e));
    if (errors.length > 20) console.log(`  …and ${errors.length - 20} more`);
    const fatal = errors.filter((e) => !e.errors?.length);
    if (fatal.length) { console.log(`fatal errors: ${fatal.length}, aborting`); return; }
  }

  if (!mergedById.size) { console.log('nothing to merge'); return; }

  // ── self-check on JUST the entries being merged (don't re-check unrelated pre-existing data) ──
  const cjkHits = [];
  for (const [id, m] of mergedById) {
    for (const e of m.examples) {
      if (CJK_RE.test(e.meaning || ''))
        cjkHits.push({ id, meaning: e.meaning.slice(0, 80) });
      if (CJK_RE.test(e.meaningThai || ''))
        cjkHits.push({ id, meaningThai: e.meaningThai.slice(0, 80) });
    }
  }
  if (cjkHits.length) {
    console.log(`✗ CJK leaked in ${cjkHits.length} NEW entries, aborting`);
    for (const h of cjkHits.slice(0, 5)) console.log(' ', JSON.stringify(h));
    return;
  }

  // Build new vocabulary. Replace generated-gloss examples with merged set.
  const newWords = HSK7_WORDS.map((w) => {
    const merge = mergedById.get(w.id);
    if (!merge) return w;
    return {
      ...w,
      examples: merge.examples.map((e) => ({
        chinese: e.chinese,
        pinyin: e.pinyin || w.pinyin,
        meaning: e.meaning,
        meaningThai: e.meaningThai,
        source: e.source || 'llm-generated',
      })),
    };
  });

  console.log(`  result: ${newWords.length} words, ${newWords.reduce((n, w) => n + (w.examples?.length || 0), 0)} total examples`);

  // ── atomic write: backup + tmp + rename ────────────────────────
  const backupPath = HSK7_PATH + '.bak';
  await writeFile(backupPath, await readFile(HSK7_PATH, 'utf8'), 'utf8');
  const tmp = HSK7_PATH + '.tmp';
  const content = `const HSK7_WORDS = [\n${newWords.map((w) => '  ' + JSON.stringify(w)).join(',\n')},\n];\n\nexport default HSK7_WORDS;\n`;
  await writeFile(tmp, content, 'utf8');
  await rename(tmp, HSK7_PATH);
  console.log(`✓ atomic-written ${mergedById.size} entries → ${HSK7_PATH}`);
  console.log(`  backup: ${backupPath}`);
}

// ── status ───────────────────────────────────────────────────────
async function status() {
  let input = 0;
  try { input = (await readFile(INPUT_PATH, 'utf8')).split('\n').filter(Boolean).length; } catch {}

  const batches = await listBatches();
  let entriesInBatches = 0;
  const uniqueIds = new Set();
  for (const path of batches) {
    const text = await readFile(path, 'utf8');
    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      entriesInBatches++;
      try { uniqueIds.add(JSON.parse(line).id); } catch {}
    }
  }

  // After a fresh extract, idsMerged reflects what's been written.
  let stillGloss = 0;
  for (const w of HSK7_WORDS) {
    if ((w.examples || []).some((e) => e.source === 'generated-gloss')) stillGloss++;
  }

  console.log(JSON.stringify({
    inputEntries: input,
    batches: batches.length,
    entriesInBatches,
    uniqueIdsInBatches: uniqueIds.size,
    wordsStillGloss: stillGloss,
    pendingToFill: input - uniqueIds.size,
    coverageProgress: `${input ? Math.round(100 * (input - stillGloss) / input) : 0}%`,
  }, null, 2));
}

// ── entry ────────────────────────────────────────────────────────
const cmd = process.argv[2];
if (cmd === 'extract') await extract();
else if (cmd === 'merge') await merge();
else if (cmd === 'status') await status();
else if (cmd === 'validate') {
  const path = process.argv[3];
  if (!path) { console.log('usage: validate <batch-file>'); process.exit(1); }
  const text = await readFile(path, 'utf8');
  let bad = 0, good = 0;
  for (const r of parseBatch(text)) {
    if (!r.ok) { bad++; console.log('parse-err', r.raw); continue; }
    const word = TARGET_LOOKUP.get(r.entry.id);
    if (!word) { bad++; console.log(`unknown id ${r.entry.id}`); continue; }
    const errs = validateEntry(r.entry.id, word, r.entry.examples);
    if (errs.length) { bad++; console.log(`✗ ${r.entry.id} (${word.chinese})`, errs); }
    else { good++; console.log(`✓ ${r.entry.id} (${word.chinese})`); }
  }
  console.log(`validated: ${good} good, ${bad} bad`);
}
else console.log('usage: extract | merge | status | validate <batch-file>');
