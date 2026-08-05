// Verify merged HSK 5/6 files: counts, empty fields, sample no-complete words
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

for (const lvl of [5, 6]) {
  const src = readFileSync(resolve('src/data/hsk3', `hsk${lvl}-words.js`), 'utf-8');
  const ids = [...src.matchAll(new RegExp(`"id":"hsk${lvl}-(\\d+)"`, 'g'))].length;
  const noMeaning = [...src.matchAll(/\{"id":"hsk\d-\d+","chinese":"([^"]+)","pinyin":"([^"]*)","meaning":""/g)].map(m => m[1]);
  const noPinyin = [...src.matchAll(/\{"id":"hsk\d-\d+","chinese":"([^"]+)","pinyin":""/g)].map(m => m[1]);
  const noPos = [...src.matchAll(/\{"id":"hsk\d-\d+","chinese":"([^"]+)"[^}]*?\}(?![\s\S]*?\})/g)].map(m => m[1]).filter(f => !/partOfSpeech/.test(f));
  console.log(`HSK ${lvl}: ${ids} entries | no-meaning: ${noMeaning.length} | no-pinyin: ${noPinyin.length}`);
  console.log(`  Sample no-meaning (up to 12): ${noMeaning.slice(0, 12).join(', ')}`);
  // Verify POS is present in most entries
  const posCount = [...src.matchAll(/partOfSpeech/g)].length;
  console.log(`  partOfSpeech occurrences: ${posCount}`);
  console.log('');
}
