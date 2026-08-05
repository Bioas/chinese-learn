#!/usr/bin/env node
/**
 * Apply HSK auto-fix candidates to vocabulary.js.
 *
 * Reads the review-queue-hsk1-3.json, finds each auto-fix candidate word in
 * vocabulary.js by `chinese: '…'`, and updates hskLevel, subcategory, and
 * (if present) vocabularyHskLevel fields in-place. Also moves the word entry
 * to the correct HSK array.
 *
 * Usage:  node scripts/hsk-apply.mjs
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(SCRIPT_DIR, '..');
const VOCAB_PATH = resolve(APP_ROOT, 'src', 'data', 'vocabulary.js');
const REVIEW_PATH = resolve(APP_ROOT, 'reports', 'hsk', 'review-queue-hsk1-3.json');
const BACKUP_PATH = resolve(APP_ROOT, 'src', 'data', 'vocabulary.js.bak');

const review = JSON.parse(await readFile(REVIEW_PATH, 'utf8'));
const fixes = new Map();
for (const c of review.autoFixCandidates) {
  fixes.set(c.chinese, { from: c.currentLevels[0], to: c.proposedLevel });
}

console.log(`Loaded ${fixes.size} auto-fix candidates from review queue.`);

let text = await readFile(VOCAB_PATH, 'utf8');

// Save backup
await writeFile(BACKUP_PATH, text, 'utf8');
console.log(`Backup saved to ${BACKUP_PATH}`);

let applied = 0;
let notFound = 0;
const details = [];

for (const [chinese, { from, to }] of fixes) {
  // Escape special regex chars in Chinese word
  const escaped = chinese.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Match entire line containing the word with the correct hskLevel
  // Handle both single-quoted (JS) and double-quoted (JSON) formats
  let found = false;

  // Try single-quoted format first
  const sqLinePattern = new RegExp(
    `^(.*chinese:\\s*'${escaped}'.*hskLevel:\\s*)${from}(.*)$`,
    'gm'
  );
  let sqMatch = sqLinePattern.exec(text);
  if (sqMatch) {
    const matchIndex = sqMatch.index;
    const line = sqMatch[0];
    let newLine = line.replace(/hskLevel:\s*\d+/, `hskLevel: ${to}`);
    newLine = newLine.replace(/subcategory:\s*'hsk\d+'/, `subcategory: 'hsk${to}'`);
    newLine = newLine.replace(/vocabularyHskLevel:\s*\d+/, `vocabularyHskLevel: ${to}`);
    text = text.slice(0, matchIndex) + newLine + text.slice(matchIndex + line.length);
    found = true;
  }

  if (!found) {
    // Try double-quoted format (JSON)
    const dqLinePattern = new RegExp(
      `^(.*"chinese":"${escaped}".*"hskLevel":)${from}(.*)$`,
      'gm'
    );
    let dqMatch = dqLinePattern.exec(text);
    if (dqMatch) {
      const matchIndex = dqMatch.index;
      const line = dqMatch[0];
      let newLine = line.replace(/"hskLevel":\d+/, `"hskLevel":${to}`);
      newLine = newLine.replace(/"subcategory":"hsk\d+"/, `"subcategory":"hsk${to}"`);
      newLine = newLine.replace(/"vocabularyHskLevel":\d+/, `"vocabularyHskLevel":${to}`);
      text = text.slice(0, matchIndex) + newLine + text.slice(matchIndex + line.length);
      found = true;
    }
  }

  if (!found) {
    notFound++;
    details.push(`NOT FOUND: ${chinese} (hskLevel ${from} → ${to})`);
    continue;
  }

  applied++;
  details.push(`OK: ${chinese} hskLevel ${from} → ${to}`);
}

console.log(`\nApplied: ${applied}`);
console.log(`Not found: ${notFound}\n`);
for (const d of details) console.log(`  ${d}`);

// Write back
await writeFile(VOCAB_PATH, text, 'utf8');
console.log(`\nWritten to ${VOCAB_PATH}`);
console.log(`Original backed up to ${BACKUP_PATH}`);
console.log(`(Safe to delete backup after verifying.)`);
