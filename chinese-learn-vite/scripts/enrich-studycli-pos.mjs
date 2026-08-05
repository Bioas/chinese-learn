#!/usr/bin/env node
/**
 * Enrich existing HSK 1–4 word files with StudyCLI part-of-speech labels.
 *
 * Unlike scrape-studycli.mjs, this script never rebuilds vocabulary fields:
 * it only adds `partOfSpeech` and preserves Thai translations/examples.
 *
 * Usage: node scripts/enrich-studycli-pos.mjs [level...]
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(SCRIPT_DIR, '..');
const WORD_DIR = resolve(APP_ROOT, 'src', 'data', 'hsk3');
const PAGES = {
  1: 'https://studycli.org/chinese-tools/hsk-1-vocabulary/',
  2: 'https://studycli.org/chinese-tools/hsk-2-vocabulary/',
  3: 'https://studycli.org/chinese-tools/hsk-3-vocabulary/',
  4: 'https://studycli.org/chinese-tools/hsk-4-vocabulary/',
};

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function attr(attributes, name) {
  const match = attributes.match(new RegExp(`data-${name}=(?:"([^"]*)"|'([^']*)')`, 'i'));
  return decodeHtml(match ? (match[1] ?? match[2] ?? '') : '');
}

function normalizePartOfSpeech(raw) {
  return raw
    .split(/\s+/)
    .filter(Boolean)
    .map((value) => value.replace(/-/g, ' '));
}

function parseStudyCliRows(html) {
  const rowRegex = /<tr\b[^>]*\bclass="[^"]*\bvocab-row\b[^"]*"\s*([^>]*)>/gi;
  return [...html.matchAll(rowRegex)].map((match) => {
    const attributes = match[1];
    return {
      chinese: attr(attributes, 'hanzi'),
      pinyin: attr(attributes, 'pinyin').replace(/\s+/g, ' ').trim(),
      meaning: attr(attributes, 'english').replace(/\s+/g, ' ').trim(),
      partOfSpeech: normalizePartOfSpeech(attr(attributes, 'pos')),
    };
  }).filter((row) => row.chinese && row.partOfSpeech.length > 0);
}

async function fetchPage(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ChineseLearnBot/1.0)' },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.text();
}

async function loadWords(level) {
  const module = await import(`../src/data/hsk3/hsk${level}-words.js?pos=${Date.now()}`);
  const words = Object.values(module).find((value) => Array.isArray(value));
  if (!words) throw new Error(`Could not load HSK ${level} word array`);
  return words;
}

function normalizeMeaning(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function mergePartOfSpeech(words, sourceRows, level) {
  const sourceByKey = new Map();
  for (const row of sourceRows) {
    const key = `${row.chinese}\u0000${row.pinyin}`;
    const entries = sourceByKey.get(key) || [];
    entries.push(row);
    sourceByKey.set(key, entries);
  }

  const usedSource = new Set();
  let matched = 0;
  const unmatched = [];
  const enriched = words.map((word) => {
    const key = `${word.chinese}\u0000${word.pinyin}`;
    const sourceEntries = sourceByKey.get(key) || [];
    const available = sourceEntries.filter((source) => !usedSource.has(source));
    const wordMeaning = normalizeMeaning(word.meaning);
    const exact = available.filter((source) => normalizeMeaning(source.meaning) === wordMeaning);
    const source = exact.length === 1 ? exact[0] : available.length === 1 ? available[0] : null;

    if (!source) {
      unmatched.push({
        id: word.id,
        chinese: word.chinese,
        pinyin: word.pinyin,
        reason: available.length > 1 ? 'ambiguous duplicate; no exact meaning match' : 'no source match',
      });
      return word;
    }

    usedSource.add(source);
    matched += 1;
    return { ...word, partOfSpeech: source.partOfSpeech };
  });

  const unusedSourceRows = sourceRows
    .filter((row) => !usedSource.has(row))
    .map((row) => ({ chinese: row.chinese, pinyin: row.pinyin, meaning: row.meaning }));

  if (unmatched.length || unusedSourceRows.length || matched !== words.length) {
    throw new Error(
      `HSK ${level} matching failed: ${matched}/${words.length} matched, `
      + `${unmatched.length} app rows unmatched, ${unusedSourceRows.length} source rows unused. `
      + `First unmatched app row: ${JSON.stringify(unmatched[0] || null)}`
    );
  }

  return enriched;
}

function render(level, words) {
  const header = [
    `// HSK 3.0 Level ${level} vocabulary`,
    '// Scraped from studycli.org (CLI New HSK vocabulary lists)',
    `// Words in this level: ${words.length}`,
    '',
    `const HSK${level}_WORDS = [`,
  ];
  const body = words.map((word) => `  ${JSON.stringify(word)},`);
  return `${[...header, ...body, '];', '', `export default HSK${level}_WORDS;`, ''].join('\n')}`;
}

const requested = process.argv.slice(2).map(Number).filter((level) => PAGES[level]);
const levels = requested.length ? [...new Set(requested)].sort((a, b) => a - b) : [1, 2, 3, 4];
const prepared = [];

for (const level of levels) {
  const path = resolve(WORD_DIR, `hsk${level}-words.js`);
  const before = await loadWords(level);
  const html = await fetchPage(PAGES[level]);
  const sourceRows = parseStudyCliRows(html);
  const enriched = mergePartOfSpeech(before, sourceRows, level);
  const beforePreserved = before.map((word) => {
    const { partOfSpeech, ...rest } = word;
    return JSON.stringify(rest);
  });
  const afterPreserved = enriched.map((word) => {
    const { partOfSpeech, ...rest } = word;
    return JSON.stringify(rest);
  });

  if (JSON.stringify(beforePreserved) !== JSON.stringify(afterPreserved)) {
    throw new Error(`HSK ${level} preservation check failed: fields other than partOfSpeech changed`);
  }

  prepared.push({ level, path, before, enriched });
}

// Fetch, match, and validate all levels before writing any file. This avoids
// leaving HSK 1–3 updated if a later level fails its source match.
for (const { level, path, enriched } of prepared) {
  await writeFile(path, render(level, enriched), 'utf8');
  console.log(`HSK ${level}: added partOfSpeech to ${enriched.length} entries from ${PAGES[level]}`);
}

console.log(`Done. Enriched HSK ${levels.join(', ')} without changing existing translations/examples.`);
