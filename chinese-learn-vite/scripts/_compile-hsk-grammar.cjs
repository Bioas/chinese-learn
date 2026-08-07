#!/usr/bin/env node
/**
 * Compile studycli.com "10 High-Value HSK N Grammar Patterns" (already fetched
 * + translated) into a JS export that we splice into src/data/hskGrammar.js.
 *
 * Output format per pattern matches the existing schema so HskGrammar.jsx
 * keeps working:
 *   {
 *     rank: 1,
 *     structure: 'Comparisons with 比 (bǐ)',
 *     pinyin: 'b\u01d0',
 *     english: 'Use 比 to compare two things.',
 *     thai: '\u0e43\u0e0a\u0e49 \u6bd4 ...',
 *     example_zh: '...',
 *     example_py: '...',
 *     example_en: '...',
 *     example_th: '...',
 *     more_examples: [{zh, py, en, th}, ...],
 *     source_url: 'https://studycli.org/...',
 *   }
 *
 * First example from studycli goes into the legacy fields so the card
 * renders without changes; the surplus goes into more_examples.
 */
const fs = require('node:fs');
const path = require('node:path');

const compiledPath = path.join(
  __dirname, 'cache', 'studycli', 'studycli-grammar-compiled.json'
);
const compiled = JSON.parse(fs.readFileSync(compiledPath, 'utf-8'));

function escape(str) {
  // Escape characters that would break a single-quoted JS string literal.
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

const levelMeta = {
  1: { title: 'HSK 1 \u2014 Foundations', subtitle: 'Word order, identification, possession, time' },
  2: { title: 'HSK 2 \u2014 Comparisons & completion', subtitle: 'Comparisons, degrees, direction, cause-effect' },
  3: { title: 'HSK 3 \u2014 Constructions & linking', subtitle: '\u628a, \u88ab, conditional, parallel, motion' },
  4: { title: 'HSK 4 \u2014 Compound clauses', subtitle: 'Foregrounding, concession, condition, range' },
};

const out = [];
for (const lvl of compiled) {
  const meta = levelMeta[lvl.level] || { title: `HSK ${lvl.level}`, subtitle: '' };
  const patternsJs = lvl.patterns.map((p) => {
    const ex0 = p.examples[0] || {};
    const more = p.examples.slice(1).map((ex) => ({
      zh: ex.zh, py: ex.py, en: ex.en, th: ex.th,
    }));
    return `      {
        rank: ${p.rank},
        structure: '${escape(p.title)}',
        pinyin: '${escape(extractPinyin(p.title) || '')}',
        english: '${escape(p.description)}',
        thai: '${escape(p.description_th || p.description)}',
        example_zh: '${escape(ex0.zh || '')}',
        example_py: '${escape(ex0.py || '')}',
        example_en: '${escape(ex0.en || '')}',
        example_th: '${escape(ex0.th || '')}',
        more_examples: [${more
          .map((m) => `\n          { zh: '${escape(m.zh)}', py: '${escape(m.py)}', en: '${escape(m.en)}', th: '${escape(m.th)}' }`)
          .join(',')}],
        source_url: '${escape(lvl.source_url)}',
      },`;
  }).join('\n');
  out.push(`    {
    level: ${lvl.level},
    title: '${escape(meta.title)}',
    subtitle: '${escape(meta.subtitle)}',
    source_url: '${escape(lvl.source_url)}',
    patterns: [
${patternsJs}
    ],
  },`);
}

fs.writeFileSync(path.join(__dirname, 'cache', 'studycli', 'hsk-1-4-block.js'), out.join('\n'), 'utf-8');
console.log(`HSK 1-4 patterns: ${compiled.reduce((n, l) => n + l.patterns.length, 0)}`);
console.log(`Wrote: scripts/cache/studycli/hsk-1-4-block.js (${fs.statSync(path.join(__dirname, 'cache', 'studycli', 'hsk-1-4-block.js')).size} bytes)`);

function extractPinyin(title) {
  // Pull pinyin out of "(b\u01d0)" or "(y\u012bng\u012bg\u0101i)" etc.
  const m = title.match(/\(([^()]+)\)/);
  if (!m) return '';
  const inside = m[1].trim();
  // Skip words containing Chinese characters
  if (/[\u4e00-\u9fff]/.test(inside)) return '';
  return inside;
}
