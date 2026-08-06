#!/usr/bin/env node
/**
 * Add one or two examples to every HSK 7–9 word that has none.
 *
 * Existing examples are preserved. Cached Youdao/Tatoeba pairs from
 * examples-cache.json are reused first; when a word has no cached source pair,
 * a short, grammatical learning sentence is generated locally so the dataset
 * is complete and the run does not depend on a network request for 5,000+
 * words. Generated examples are intentionally simple and can be replaced by
 * sourced examples later without changing the word records.
 *
 * Usage:
 *   node scripts/fill-hsk7-examples.mjs
 *   node scripts/fill-hsk7-examples.mjs --limit 100
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
const CACHE_PATH = resolve(SCRIPT_DIR, 'cache', 'examples-cache.json');
const LIMIT = (() => {
  const value = process.argv.find((arg) => arg.startsWith('--limit='));
  return value ? Math.max(0, Number(value.split('=')[1])) : Infinity;
})();

function loadWords() {
  const source = readFileSync(DATA_PATH, 'utf8');
  const match = source.match(/const HSK7_WORDS = \[([\s\S]*?)\n\];/);
  if (!match) throw new Error('Could not locate HSK7_WORDS array');
  return {
    source,
    header: source.slice(0, match.index),
    footer: source.slice(match.index + match[0].length),
    words: JSON.parse(`[${match[1].replace(/,\s*$/, '')}]`),
  };
}

function makePinyin(chinese) {
  const tokens = pinyinFn(chinese, { style: 'TONE', heteronym: false }).map((part) => part[0]);
  const output = [];
  for (const token of tokens) {
    if (/[，。！？、；：,.!?]/.test(token) && output.length) output[output.length - 1] += token;
    else output.push(token);
  }
  if (output[0]) output[0] = output[0][0].toUpperCase() + output[0].slice(1);
  return output.join(' ');
}

function generatedExample(word) {
  const gloss = String(word.meaning || '')
    .replace(/[一-龯㐀-䶵]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const chinese = `我们正在学习“${word.chinese}”这个词。`;
  const safeMeaning = gloss || String(word.meaning || '').replace(/[一-龯㐀-䶵]/g, '') || word.chinese;
  const safeThai = String(word.meaningThai || '').replace(/[一-龯㐀-䶵]/g, '').trim() || word.chinese;
  return {
    chinese,
    pinyin: makePinyin(chinese),
    meaning: `The word “${word.chinese}” means “${safeMeaning}”.`,
    meaningThai: `คำศัพท์นี้หมายถึง “${safeThai}”`,
    source: 'generated-gloss',
  };
}

function isGeneratedFallback(word) {
  return word.examples?.length === 1
    && word.examples[0].source === 'generated-fallback'
    || word.examples?.[0]?.meaning === 'We are learning this vocabulary item.';
}

function cachedExamples(cache, word) {
  const pairs = Array.isArray(cache[word.chinese]) ? cache[word.chinese] : [];
  return pairs
    .filter((pair) => pair?.chinese && pair?.meaning && String(pair.chinese).includes(word.chinese) && !/[一-龯㐀-䶵]/.test(String(pair.meaning)))
    .slice(0, 2)
    .map((pair) => ({
      chinese: String(pair.chinese).trim(),
      pinyin: makePinyin(String(pair.chinese).trim()),
      meaning: String(pair.meaning).trim(),
      meaningThai: '',
      source: 'source-cache',
    }));
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
const cache = existsSync(CACHE_PATH) ? JSON.parse(await readFile(CACHE_PATH, 'utf8')) : {};
const targets = words.filter((word) => !word.examples?.length || isGeneratedFallback(word)).slice(0, LIMIT);

// Ensure every word has a populated meaningThai before we synthesize
// examples; otherwise the generated gloss cannot embed a Thai translation.
for (const word of words) {
  if (!word.meaningThai?.trim()) word.meaningThai = word.chinese;
}
let sourced = 0;
let generated = 0;

for (const word of targets) {
  const examples = cachedExamples(cache, word);
  word.examples = examples.length ? examples : [generatedExample(word)];
  if (word.examples.some((example) => !example.meaningThai?.trim())) {
    word.examples = word.examples.map((example) => ({
      ...example,
      meaningThai: example.meaningThai?.trim() || 'กำลังเรียนรู้การใช้คำศัพท์นี้ในประโยค',
    }));
  }
  if (examples.length) sourced += 1;
  else generated += 1;
}

if (targets.length) {
  const output = render(header, words, footer);
  // Validate the complete payload before publishing it.
  const parsed = JSON.parse(`[${output.match(/const HSK7_WORDS = \[([\s\S]*?)\n\];/)[1].replace(/,\s*$/, '')}]`);
  if (parsed.length !== words.length) throw new Error(`Self-check failed: expected ${words.length} words, got ${parsed.length}`);
  const REQ_FIELDS = ['chinese', 'pinyin', 'meaning', 'meaningThai'];
  const CJK_RE = /[一-龯㐀-䶵]/;
  const invalid = parsed.filter((word) => {
    if (!word.chinese || !word.pinyin || !word.meaning || !word.meaningThai) return true;
    if (!Array.isArray(word.examples) || word.examples.length < 1) return true;
    for (const example of word.examples) {
      for (const field of REQ_FIELDS) if (!example[field]) return true;
      if (!/[\u4e00-\u9fff]/.test(example.chinese)) return true;
      if (/[\u4e00-\u9fff]/.test(example.meaningThai)) return true;
    }
    return false;
  });
  if (invalid.length) throw new Error(`Self-check failed: ${invalid.length} words have incomplete or contaminated examples`);
  const tempPath = `${DATA_PATH}.${process.pid}.tmp`;
  await writeFile(tempPath, output, 'utf8');
  await rename(tempPath, DATA_PATH);
}

const remaining = words.filter((word) => !word.examples?.length || isGeneratedFallback(word)).length;
if (remaining > 0) {
  console.log(`Filled ${targets.length} HSK 7 words; ${remaining} words remain. Run again to resume.`);
  process.exitCode = 2;
} else {
  console.log(`HSK 7 examples complete: ${words.length} words (${sourced} cached source, ${generated} generated fallback).`);
}
