// Quick status check: how many HSK 5/6 words have examples, and do those
// examples have Thai translations yet?
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const allSentences = [];
for (const lvl of [5, 6]) {
  const src = await readFile(`src/data/hsk3/hsk${lvl}-words.js`, 'utf8');
  const m = src.match(new RegExp(`const HSK${lvl}_WORDS = \\[([\\s\\S]*?)\\n\\];`));
  const entries = JSON.parse(`[${m[1].replace(/,\s*$/, '')}]`);

  const withZh = entries.filter((e) => Array.isArray(e.examples) && e.examples.length && e.examples[0].chinese);
  const withTh = withZh.filter((e) => e.examples.some((ex) => ex.meaningThai));
  const missingTh = withZh.filter((e) => !e.examples.some((ex) => ex.meaningThai));
  const noEx = entries.length - withZh.length;
  for (const e of withZh) for (const ex of e.examples) allSentences.push(ex.meaning.trim());

  console.log(`HSK${lvl}: total=${entries.length} withZh=${withZh.length} withTh=${withTh.length} missingTh=${missingTh.length} noEx=${noEx.length}`);
  console.log('  words missing Thai:', missingTh.slice(0, 10).map((e) => e.chinese).join(', '));
}

const unique = [...new Set(allSentences)];
console.log(`\nunique English sentences in HSK5/6: ${unique.length}`);
const cachePath = 'scripts/cache/thai-example-translations.json';
if (existsSync(cachePath)) {
  const cache = JSON.parse(await readFile(cachePath, 'utf8'));
  const cached = unique.filter((s) => cache[s]?.translation);
  console.log(`cached in HSK1-4 example cache: ${cached.length} (${(100 * cached.length / unique.length).toFixed(1)}%)`);
  console.log(`NEED translation: ${unique.length - cached.length}`);
} else {
  console.log('no cache file found');
}
