#!/usr/bin/env node
/**
 * Build new vocabulary.js from parts: HSK 3.0 imports + old non-HSK arrays + exports.
 * Run after hsk3-generate.mjs.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(SCRIPT_DIR, '..');
const PARTS_DIR = resolve(SCRIPT_DIR, 'data', 'vocab-parts');
const OUT_PATH = resolve(APP_ROOT, 'src', 'data', 'vocabulary.js');

const header = `// Word data only. Import CATEGORIES + getSubcategoryIcon from './categories' directly.
import { getCharacterHskEntryLevel, getCharacterHskLevels } from './characters.js';
import HSK1_WORDS from './hsk3/hsk1-words.js';
import HSK2_WORDS from './hsk3/hsk2-words.js';
import HSK3_WORDS from './hsk3/hsk3-words.js';
import HSK4_WORDS from './hsk3/hsk4-words.js';
import HSK5_WORDS from './hsk3/hsk5-words.js';
import HSK6_WORDS from './hsk3/hsk6-words.js';
import HSK7_WORDS from './hsk3/hsk7-words.js';

export const HSK_WORD_STANDARD = 'HSK 3.0';

// ── Non-HSK topical word arrays ──
`;

const midArrays = [
  'greetings', 'food', 'shopping', 'travel',
  'weather', 'timeArr', 'family', 'colors', 'numbers',
  'health', 'education', 'technology', 'business', 'nature',
];

const footerExport = `
// Build VOCABULARY from all word lists
const VOCABULARY_DATA = [...HSK1_WORDS, ...HSK2_WORDS, ...HSK3_WORDS, ...HSK4_WORDS, ...HSK5_WORDS, ...HSK6_WORDS, ...HSK7_WORDS, ...GREETINGS_WORDS, ...FOOD_WORDS, ...SHOPPING_WORDS, ...TRAVEL_WORDS, ...WEATHER_WORDS, ...TIME_WORDS, ...FAMILY_WORDS, ...COLORS_WORDS, ...NUMBERS_WORDS, ...HEALTH_WORDS, ...EDUCATION_WORDS, ...TECHNOLOGY_WORDS, ...BUSINESS_WORDS, ...NATURE_WORDS];

export const VOCABULARY = VOCABULARY_DATA.map(word => ({
  ...word,
  vocabularyHskLevel: word.category === 'hsk' && word.hskLevel > 0 ? word.hskLevel : null,
  hskVersion: word.category === 'hsk' && word.hskLevel > 0 ? HSK_WORD_STANDARD : null,
  hskLevelType: word.category === 'hsk' ? 'word' : null,
  characterHskLevel: getCharacterHskEntryLevel(word.chinese),
  characterHskLevels: getCharacterHskLevels(word.chinese),
}));

// Helper: get word by ID
export function getWordById(id) {
  return VOCABULARY.find(w => w.id === id);
}

// Helper: get words by category
export function getWordsByCategory(categoryId) {
  return VOCABULARY.filter(w => w.category === categoryId);
}

// Helper: get words by subcategory
export function getWordsBySubcategory(subId) {
  return VOCABULARY.filter(w => w.subcategory === subId);
}
`;

// ── Assemble ──
let output = header;

for (const name of midArrays) {
  const part = await readFile(resolve(PARTS_DIR, name + '.txt'), 'utf8');
  output += part + '\n\n';
}

output += footerExport;

await writeFile(OUT_PATH, output, 'utf8');

const sizeKB = (Buffer.byteLength(output) / 1024).toFixed(1);
console.log(`Written: ${OUT_PATH} (${sizeKB} KB)`);
console.log(`HSK levels: 1-7 imported from src/data/hsk3/`);
console.log(`Non-HSK arrays: ${midArrays.length} preserved`);
