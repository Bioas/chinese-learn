#!/usr/bin/env node
/**
 * Reproducible HSK 2.0 source sync + vocabulary audit.
 *
 * Usage:
 *   npm run hsk:sync
 *   npm run hsk:audit
 *   npm run hsk:review
 *   npm run hsk:audit -- --fail-on-mismatch
 *
 * The browser bundle never imports this file. It is intentionally implemented
 * with Node built-ins only so the audit remains easy to run in CI/offline.
 */

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(SCRIPT_DIR, '..');
const MANIFEST_PATH = resolve(SCRIPT_DIR, 'hsk-source.json');
const SNAPSHOT_DIR = resolve(SCRIPT_DIR, 'data', 'hsk-2.0');
const REPORT_DIR = resolve(APP_ROOT, 'reports', 'hsk');
const LOCK_PATH = resolve(SNAPSHOT_DIR, 'source-lock.json');
const JSON_REPORT_PATH = resolve(REPORT_DIR, 'mismatch-report.json');
const MARKDOWN_REPORT_PATH = resolve(REPORT_DIR, 'mismatch-report.md');
const REVIEW_JSON_PATH = resolve(REPORT_DIR, 'review-queue-hsk1-3.json');
const REVIEW_MARKDOWN_PATH = resolve(REPORT_DIR, 'review-queue-hsk1-3.md');

const args = new Set(process.argv.slice(2));
const command = process.argv[2] || 'audit';
const failOnMismatch = args.has('--fail-on-mismatch');

const LEVELS = [1, 2, 3, 4, 5, 6];

function normalizeWord(value) {
  return String(value ?? '')
    .replace(/^\uFEFF/, '')
    .normalize('NFC')
    .trim();
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"' && field.length === 0) {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      if (row.some((value) => value.trim() !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/, ''));
    if (row.some((value) => value.trim() !== '')) rows.push(row);
  }
  return rows;
}

function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, 'zh-Hans'));
}

function displayList(values, limit = 12) {
  const shown = values.slice(0, limit);
  const suffix = values.length > limit ? ` … (+${values.length - limit})` : '';
  return shown.length ? `${shown.join('、')}${suffix}` : '—';
}

async function readManifest() {
  return JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
}

async function syncSources(manifest) {
  await mkdir(SNAPSHOT_DIR, { recursive: true });
  const files = [];

  for (const source of manifest.files) {
    const response = await fetch(source.url);
    if (!response.ok) {
      throw new Error(`Unable to download HSK ${source.level}: ${response.status} ${response.statusText}`);
    }
    const text = await response.text();
    const rows = parseCsv(text);
    const validRows = rows.filter((row) => normalizeWord(row[0]));
    if (validRows.length === 0) throw new Error(`HSK ${source.level} returned no rows`);

    const outputPath = resolve(SNAPSHOT_DIR, source.file);
    await writeFile(outputPath, text.replace(/^\uFEFF/, ''), 'utf8');
    files.push({
      level: source.level,
      file: source.file,
      url: source.url,
      sha256: sha256(text.replace(/^\uFEFF/, '')),
      rows: validRows.length,
    });
  }

  const lock = {
    standard: manifest.standard,
    edition: manifest.edition,
    sourceType: manifest.sourceType,
    repository: manifest.repository,
    syncedAt: new Date().toISOString(),
    files,
  };
  await writeFile(LOCK_PATH, `${JSON.stringify(lock, null, 2)}\n`, 'utf8');
  console.log(`Synced ${files.length} HSK source files to ${SNAPSHOT_DIR}`);
  for (const file of files) console.log(`  HSK ${file.level}: ${file.rows} rows, sha256 ${file.sha256.slice(0, 12)}…`);
}

async function readSnapshot(manifest) {
  if (!existsSync(LOCK_PATH)) {
    throw new Error('No HSK snapshot found. Run "npm run hsk:sync" first.');
  }
  const lock = JSON.parse(await readFile(LOCK_PATH, 'utf8'));
  const referenceRows = [];

  for (const source of manifest.files) {
    const path = resolve(SNAPSHOT_DIR, source.file);
    if (!existsSync(path)) throw new Error(`Snapshot file is missing: ${source.file}`);
    const text = await readFile(path, 'utf8');
    const lockFile = lock.files?.find((file) => file.level === source.level);
    if (!lockFile || lockFile.url !== source.url) {
      throw new Error(`Snapshot provenance changed for HSK ${source.level}. Run "npm run hsk:sync" to refresh it.`);
    }
    const actualHash = sha256(text);
    if (lockFile?.sha256 && lockFile.sha256 !== actualHash) {
      throw new Error(`Snapshot hash changed for HSK ${source.level}. Run "npm run hsk:sync" to refresh it.`);
    }

    for (const [rowIndex, row] of parseCsv(text).entries()) {
      referenceRows.push({
        level: source.level,
        row: rowIndex + 1,
        chinese: normalizeWord(row[0]),
        pinyin: normalizeWord(row[1]),
        meaning: normalizeWord(row.slice(2).join(',')),
      });
    }
  }
  return { lock, referenceRows };
}

function indexReference(rows) {
  const byWord = new Map();
  const invalidRows = [];
  const malformedRows = [];
  const duplicateRows = [];
  const seen = new Set();

  for (const entry of rows) {
    if (!entry.chinese || !LEVELS.includes(entry.level)) {
      invalidRows.push(entry);
      continue;
    }
    if (!entry.pinyin || !entry.meaning) {
      malformedRows.push(entry);
      continue;
    }
    const key = `${entry.level}:${entry.chinese}`;
    if (seen.has(key)) duplicateRows.push(entry);
    seen.add(key);
    if (!byWord.has(entry.chinese)) byWord.set(entry.chinese, new Set());
    byWord.get(entry.chinese).add(entry.level);
  }

  return { byWord, invalidRows, malformedRows, duplicateRows };
}

function indexAppWords(words) {
  const byWord = new Map();
  const duplicateEntries = [];
  const hskWords = words.filter((word) => word.category === 'hsk');

  for (const word of hskWords) {
    const chinese = normalizeWord(word.chinese);
    const level = word.vocabularyHskLevel ?? word.hskLevel;
    if (!byWord.has(chinese)) byWord.set(chinese, new Set());
    const levels = byWord.get(chinese);
    if (levels.has(level)) duplicateEntries.push({ id: word.id, chinese, level });
    levels.add(level);
  }
  return { byWord, duplicateEntries, totalRows: hskWords.length };
}

function buildReviewQueue({ reference, app, levelMismatches, missingInApp, missingInReference }) {
  const reviewLevels = [1, 2, 3];
  const autoFixCandidates = [];
  const needsReview = [];
  const ignored = [];
  const appDuplicateWords = new Set(app.duplicateEntries.map((entry) => entry.chinese));

  for (const entry of levelMismatches) {
    const inScope = entry.referenceLevels.some((level) => reviewLevels.includes(level))
      || entry.appLevels.some((level) => reviewLevels.includes(level));
    if (!inScope) continue;

    const isUnambiguous = entry.referenceLevels.length === 1
      && entry.appLevels.length === 1
      && !appDuplicateWords.has(entry.chinese);
    const candidate = {
      chinese: entry.chinese,
      currentLevels: entry.appLevels,
      referenceLevels: entry.referenceLevels,
      proposedLevel: entry.referenceLevels.length === 1 ? entry.referenceLevels[0] : null,
      confidence: isUnambiguous ? 'high' : 'low',
      reason: isUnambiguous
        ? 'One reference level and one app level; no duplicate app entry at that level.'
        : 'Multiple levels or duplicate app records require human review before changing metadata.',
    };
    (isUnambiguous ? autoFixCandidates : needsReview).push({ ...candidate, action: 'review-before-apply' });
  }

  for (const entry of missingInApp) {
    if (entry.referenceLevels.some((level) => reviewLevels.includes(level))) {
      needsReview.push({
        chinese: entry.chinese,
        currentLevels: [],
        referenceLevels: entry.referenceLevels,
        proposedLevel: null,
        confidence: 'low',
        action: 'review-before-add',
        reason: 'Reference word is absent from the app; this queue does not add vocabulary automatically.',
      });
    }
  }

  for (const entry of missingInReference) {
    if (entry.appLevels.some((level) => reviewLevels.includes(level))) {
      ignored.push({
        chinese: entry.chinese,
        currentLevels: entry.appLevels,
        referenceLevels: [],
        action: 'ignore-unless-source-expands',
        reason: 'App word is not present in this third-party snapshot; it may be topical, a variant, or a source omission.',
      });
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    scope: 'HSK 1-3',
    policy: {
      autoFixCandidate: 'Exact one-to-one level mismatch with no duplicate app record. Review is still required; no file is changed automatically.',
      needsReview: 'Ambiguous level, duplicate app record, or missing reference/app word.',
      ignored: 'App-only words in the selected source snapshot; retained for traceability and not treated as errors.',
    },
    summary: {
      autoFixCandidates: autoFixCandidates.length,
      needsReview: needsReview.length,
      ignored: ignored.length,
      total: autoFixCandidates.length + needsReview.length + ignored.length,
    },
    autoFixCandidates,
    needsReview,
    ignored,
    note: 'This queue proposes review actions only. It never mutates src/data/vocabulary.js.',
  };
}

function buildAudit({ manifest, lock, referenceRows, words }) {
  const reference = indexReference(referenceRows);
  const app = indexAppWords(words);
  const allWords = uniqueSorted([...reference.byWord.keys(), ...app.byWord.keys()]);
  const missingInApp = [];
  const missingInReference = [];
  const levelMismatches = [];
  const matched = [];

  for (const chinese of allWords) {
    const referenceLevels = [...(reference.byWord.get(chinese) || [])].sort();
    const appLevels = [...(app.byWord.get(chinese) || [])].sort();
    if (!app.byWord.has(chinese)) {
      missingInApp.push({ chinese, referenceLevels });
    } else if (!reference.byWord.has(chinese)) {
      missingInReference.push({ chinese, appLevels });
    } else if (referenceLevels.join(',') !== appLevels.join(',')) {
      levelMismatches.push({ chinese, referenceLevels, appLevels });
    } else {
      matched.push(chinese);
    }
  }

  const reviewQueue = buildReviewQueue({
    reference,
    app,
    levelMismatches,
    missingInApp,
    missingInReference,
  });
  const mismatchCount = missingInApp.length + missingInReference.length + levelMismatches.length;
  const issueCount = mismatchCount
    + reference.duplicateRows.length
    + reference.invalidRows.length
    + reference.malformedRows.length
    + app.duplicateEntries.length;
  return {
    generatedAt: new Date().toISOString(),
    standard: manifest.standard,
    edition: manifest.edition,
    source: {
      repository: manifest.repository,
      sourceType: manifest.sourceType,
      caveat: manifest.caveat,
      files: lock.files,
      syncedAt: lock.syncedAt,
    },
    app: {
      source: 'src/data/vocabulary.js',
      hskRows: app.totalRows,
      uniqueWords: app.byWord.size,
    },
    summary: {
      referenceRows: referenceRows.length,
      referenceUniqueWords: reference.byWord.size,
      matched: matched.length,
      missingInApp: missingInApp.length,
      missingInReference: missingInReference.length,
      levelMismatches: levelMismatches.length,
      duplicateReferenceRows: reference.duplicateRows.length,
      invalidReferenceRows: reference.invalidRows.length,
      malformedReferenceRows: reference.malformedRows.length,
      duplicateAppEntries: app.duplicateEntries.length,
      mismatchCount,
      issueCount,
    },
    missingInApp,
    missingInReference,
    levelMismatches,
    duplicateReferenceRows: reference.duplicateRows,
    invalidReferenceRows: reference.invalidRows,
    malformedReferenceRows: reference.malformedRows,
    duplicateAppEntries: app.duplicateEntries,
    reviewQueue,
    note: 'This is an automated comparison against a third-party transcription of legacy HSK 2.0. A mismatch is a review queue, not proof that either side is authoritative.',
  };
}

function markdownReport(report) {
  const { summary, source } = report;
  const lines = [
    '# HSK 2.0 vocabulary audit',
    '',
    `Generated: ${report.generatedAt}`,
    `Source snapshot: ${source.syncedAt}`,
    `Repository: ${source.repository}`,
    `Standard: ${report.standard} · ${report.edition}`,
    '',
    '> This report compares the app with a third-party transcription of the legacy HSK 2.0 list. It creates a review queue; it does not certify that either dataset is authoritative.',
    '',
    '## Summary',
    '',
    '| Metric | Count |',
    '|---|---:|',
    `| Reference rows | ${summary.referenceRows} |`,
    `| Reference unique words | ${summary.referenceUniqueWords} |`,
    `| App HSK rows | ${report.app.hskRows} |`,
    `| Matched words | ${summary.matched} |`,
    `| Missing from app | ${summary.missingInApp} |`,
    `| Missing from reference | ${summary.missingInReference} |`,
    `| Level mismatches | ${summary.levelMismatches} |`,
    `| Duplicate reference rows | ${summary.duplicateReferenceRows} |`,
    `| Invalid reference rows | ${summary.invalidReferenceRows} |`,
    `| Malformed reference rows | ${summary.malformedReferenceRows} |`,
    `| Duplicate app entries | ${summary.duplicateAppEntries} |`,
    '',
    '## HSK 1–3 review queue',
    '',
    `| Auto-fix candidates (review first) | ${report.reviewQueue.summary.autoFixCandidates} |`,
    `| Needs review | ${report.reviewQueue.summary.needsReview} |`,
    `| Ignored app-only words | ${report.reviewQueue.summary.ignored} |`,
    '',
    'The auto-fix list is only a proposal. No source file is changed automatically.',
    '',
    '### Auto-fix candidates',
    '',
    '| Word | Current | Proposed | Confidence |',
    '|---|---:|---:|---|',
    ...report.reviewQueue.autoFixCandidates.slice(0, 250).map((entry) => `| ${entry.chinese} | ${entry.currentLevels.join(', ')} | ${entry.proposedLevel} | ${entry.confidence} |`),
    report.reviewQueue.autoFixCandidates.length > 250 ? `| … | ${report.reviewQueue.autoFixCandidates.length - 250} more | | |` : '',
    '',
    '## Review queues',
    '',
    `### Missing from app (${summary.missingInApp})`,
    '',
    displayList(report.missingInApp.map((entry) => `${entry.chinese} [HSK ${entry.referenceLevels.join(', ')}]`), 80),
    '',
    `### Missing from reference (${summary.missingInReference})`,
    '',
    displayList(report.missingInReference.map((entry) => `${entry.chinese} [app HSK ${entry.appLevels.join(', ')}]`), 80),
    '',
    `### Level mismatches (${summary.levelMismatches})`,
    '',
    '| Word | Reference | App |',
    '|---|---:|---:|',
    ...report.levelMismatches.slice(0, 250).map((entry) => `| ${entry.chinese} | ${entry.referenceLevels.join(', ')} | ${entry.appLevels.join(', ')} |`),
    summary.levelMismatches > 250 ? `| … | ${summary.levelMismatches - 250} more | |` : '',
    '',
    '## Source hashes',
    '',
    '| Level | File | SHA-256 |',
    '|---:|---|---|',
    ...source.files.map((file) => `| ${file.level} | ${file.file} | \`${file.sha256}\` |`),
    '',
  ].filter(Boolean);
  return `${lines.join('\n')}\n`;
}

function markdownReviewQueue(queue) {
  const lines = [
    '# HSK 1–3 review queue',
    '',
    `Generated: ${queue.generatedAt}`,
    '',
    '> This is a proposal for human review. It never changes vocabulary data automatically.',
    '',
    '## Summary',
    '',
    `- Auto-fix candidates: **${queue.summary.autoFixCandidates}**`,
    `- Needs review: **${queue.summary.needsReview}**`,
    `- Ignored app-only words: **${queue.summary.ignored}**`,
    '',
    '## Auto-fix candidates (review before applying)',
    '',
    '| Word | Current level | Reference level | Confidence |',
    '|---|---:|---:|---|',
    ...queue.autoFixCandidates.map((entry) => `| ${entry.chinese} | ${entry.currentLevels.join(', ')} | ${entry.proposedLevel} | ${entry.confidence} |`),
    '',
    '## Needs review',
    '',
    '| Word | Current level | Reference level | Action | Reason |',
    '|---|---:|---:|---|---|',
    ...queue.needsReview.slice(0, 500).map((entry) => `| ${entry.chinese} | ${entry.currentLevels.join(', ') || '—'} | ${entry.referenceLevels.join(', ') || '—'} | ${entry.action} | ${entry.reason} |`),
    queue.needsReview.length > 500 ? `| … | ${queue.needsReview.length - 500} more | | | |` : '',
    '',
    '## Ignored app-only words',
    '',
    displayList(queue.ignored.map((entry) => entry.chinese), 200),
    '',
  ].filter(Boolean);
  return `${lines.join('\n')}\n`;
}

async function loadVocabulary() {
  const module = await import('../src/data/vocabulary.js');
  return module.VOCABULARY;
}

async function audit() {
  const manifest = await readManifest();
  const snapshot = await readSnapshot(manifest);
  const words = await loadVocabulary();
  const report = buildAudit({ ...snapshot, manifest, words });
  await mkdir(REPORT_DIR, { recursive: true });
  await writeFile(JSON_REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  await writeFile(MARKDOWN_REPORT_PATH, markdownReport(report), 'utf8');
  await writeFile(REVIEW_JSON_PATH, `${JSON.stringify(report.reviewQueue, null, 2)}\n`, 'utf8');
  await writeFile(REVIEW_MARKDOWN_PATH, markdownReviewQueue(report.reviewQueue), 'utf8');

  console.log(`HSK audit written to ${JSON_REPORT_PATH}`);
  console.log(`HSK 1–3 review queue written to ${REVIEW_JSON_PATH}`);
  console.log(JSON.stringify(report.summary, null, 2));
  if (failOnMismatch && report.summary.issueCount > 0) {
    process.exitCode = 2;
  }
}

try {
  const manifest = await readManifest();
  if (command === 'sync') {
    await syncSources(manifest);
  } else if (command === 'audit' || command === 'review') {
    await audit();
  } else if (command === 'sync-and-audit') {
    await syncSources(manifest);
    await audit();
  } else {
    throw new Error(`Unknown command "${command}". Use sync, audit/review, or sync-and-audit.`);
  }
} catch (error) {
  console.error(`HSK audit failed: ${error.message}`);
  process.exitCode = 1;
}
