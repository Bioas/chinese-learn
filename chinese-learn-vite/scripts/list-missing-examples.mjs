// List HSK 5/6 words that have no examples at all.
import { readFile } from 'node:fs/promises';

for (const lvl of [5, 6]) {
  const src = await readFile(`src/data/hsk3/hsk${lvl}-words.js`, 'utf8');
  const re = new RegExp(`const HSK${lvl}_WORDS = \\[([\\s\\S]*?)\\n\\];`);
  const m = src.match(re);
  const entries = JSON.parse(`[${m[1].replace(/,\s*$/, '')}]`);
  const noEx = entries.filter((e) => !(Array.isArray(e.examples) && e.examples.length));
  console.log(`HSK${lvl}: no examples = ${noEx.length}`);
  console.log(noEx.map((e) => `${e.chinese}(${e.pinyin})`).join(', '));
  console.log('');
}
