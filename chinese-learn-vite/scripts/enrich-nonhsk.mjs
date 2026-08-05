// Enrich non-HSK vocabulary entries (daily/topics/health/education/technology/business/nature):
//  1. partOfSpeech — borrow from HSK entries sharing the same Chinese form, else rule-based classify
//     from the English meaning, with a small manual override map.
//  2. Example pinyin — add tone marks to example sentences whose pinyin lacks them, using a
//     char→reading map derived from the app's own tone-marked data (word pinyin + HSK example
//     pinyin), falling back to the `pinyin` npm package for the rare unresolved character.
//
// Only rewrites the 14 inline non-HSK arrays in src/data/vocabulary.js; HSK data and every other
// field are preserved byte-for-byte (the file is backed up first).
import { readFile, writeFile, rename, copyFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pinyinFn = require('pinyin').default;
const { VOCABULARY } = await import('../src/data/vocabulary.js');

const FILE = new URL('../src/data/vocabulary.js', import.meta.url);
const BACKUP = new URL('../src/data/vocabulary.js.bak', import.meta.url);

const ENRICHED_FIELDS = ['vocabularyHskLevel', 'hskVersion', 'hskLevelType', 'characterHskLevel', 'characterHskLevels'];

// ── char → tone-marked readings map (from the app's own tone-marked data) ──
const charMap = new Map();
const addPair = (chars, syllables) => {
  if (chars.length !== syllables.length) return;
  chars.forEach((c, i) => {
    if (!/[\u4e00-\u9fff]/.test(c)) return;
    if (!charMap.has(c)) charMap.set(c, new Set());
    charMap.get(c).add(syllables[i]);
  });
};
for (const w of VOCABULARY) addPair([...w.chinese], String(w.pinyin || '').trim().split(/\s+/));
for (const w of VOCABULARY) {
  if (w.category !== 'hsk') continue;
  for (const ex of w.examples || []) addPair([...ex.chinese], String(ex.pinyin || '').trim().split(/\s+/));
}

// ── pinyin helpers ──
const hasTone = (s) => /[\u0300-\u036f]/.test(String(s).normalize('NFD'));
const stripTone = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const cleanBase = (s) =>
  stripTone(String(s).replace(/[.,;:!?，。！？、；：'"“”‘’·\s]/g, ''))
    .toLowerCase()
    .replace(/v/g, 'ü');

// Characters whose neutral (tone-less) reading should win when falling back to
// per-character conversion with a tone-less source syllable — noun suffixes (子/头),
// particles (的/了/吗) and common neutral-tone words.
const NEUTRAL_FIRST = new Set([
  '的', '了', '着', '过', '吗', '吧', '呢', '啊', '呀', '啦', '嘛', '哩', '喽', '么', '们',
  '子', '头', '亮', '识', '西', '思', '服', '生', '实', '气', '事', '处', '面', '候', '息',
  '楚', '腾', '睛', '袋', '溜', '璃', '膀', '膊', '盖', '鼓', '鞋', '味', '彩', '边', '娘',
]);

// Build a word dictionary (multi-char words → tone-marked pinyin syllables) from the
// app's own vocabulary so neutral tones and polyphones come from authoritative data
// (我们 wǒmen, 电子邮件 diàn zǐ yóu jiàn …).
const wordDict = new Map();
for (const w of VOCABULARY) {
  const syls = String(w.pinyin || '').trim().split(/\s+/);
  const chars = [...w.chinese];
  if (chars.length >= 2 && chars.length === syls.length && hasTone(w.pinyin)) {
    wordDict.set(w.chinese, syls);
  }
}

function convertPinyin(chinese, oldPinyin) {
  const chars = [...chinese].filter((c) => /[\u4e00-\u9fff]/.test(c));
  const syls = String(oldPinyin || '').trim().split(/\s+/).filter(Boolean);
  const punctOf = (i) => syls[i].replace(/[a-zA-Z\u00C0-\u024F]+/g, '');
  if (chars.length === syls.length) {
    // Maximal-munch segmentation over the app's word dictionary.
    const parts = [];
    for (let i = 0; i < chars.length;) {
      let hit = null;
      for (let len = Math.min(8, chars.length - i); len >= 2; len--) {
        const cand = chars.slice(i, i + len).join('');
        if (wordDict.has(cand)) { hit = { len, pinyin: wordDict.get(cand) }; break; }
      }
      parts.push(hit ? { len: hit.len, pinyin: hit.pinyin } : { len: 1, pinyin: null });
      i += hit ? hit.len : 1;
    }
    const out = [];
    let srcIdx = 0;
    for (const part of parts) {
      if (part.pinyin) {
        for (let k = 0; k < part.len; k++) {
          out.push(part.pinyin[k] + punctOf(srcIdx));
          srcIdx++;
        }
      } else {
        const c = chars[srcIdx];
        const syl = syls[srcIdx];
        const base = cleanBase(syl);
        let best = null;
        const readings = charMap.get(c);
        if (readings) {
          const cands = [...readings].filter((r) => cleanBase(r) === base);
          const toned = cands.filter((r) => hasTone(r));
          const neutral = cands.filter((r) => !hasTone(r));
          const doubled = srcIdx > 0 && c === chars[srcIdx - 1];
          best = hasTone(syl)
            ? (toned[0] || cands[0])
            : ((NEUTRAL_FIRST.has(c) || doubled) ? (neutral[0] || cands[0]) : (toned[0] || cands[0]));
        }
        if (!best) best = pinyinFn(c, { style: 'TONE', heteronym: false })?.[0]?.[0] || null;
        out.push((best || syl) + punctOf(srcIdx));
        srcIdx++;
      }
    }
    if (out[0]) out[0] = out[0].charAt(0).toUpperCase() + out[0].slice(1);
    return out.join(' ');
  }
  // Mixed content (latin/numbers, ~14 examples): convert via pinyin lib, attach
  // punctuation, keep latin tokens. Note: the lib emits citation tones, so a rare
  // polysyllable may not match the neutral reading (e.g. 大量 → dà liáng).
  const tokens = pinyinFn(chinese, { style: 'TONE', heteronym: false }).map((x) => x[0]);
  const out = [];
  for (const t of tokens) {
    if (/[，。！？、；：,.!?]/.test(t) && out.length) out[out.length - 1] += t;
    else out.push(t);
  }
  if (out[0] && /^[\u00C0-\u024Fa-zA-Z]/.test(out[0])) out[0] = out[0].charAt(0).toUpperCase() + out[0].slice(1);
  return out.join(' ');
}

// ── part-of-speech classifier ──
const ADJ = new Set([
  'sour', 'sweet', 'bitter', 'spicy', 'hot', 'cold', 'warm', 'cool', 'wet', 'dry',
  'sunny', 'rainy', 'snowy', 'windy', 'cloudy', 'foggy', 'stormy',
  'tasty', 'delicious', 'fresh', 'stale', 'raw', 'ripe', 'tender', 'crispy', 'bland', 'salty', 'fragrant', 'smelly', 'oily', 'greasy',
  'big', 'small', 'tall', 'short', 'long', 'wide', 'narrow', 'thick', 'thin', 'fat', 'deep', 'shallow', 'high', 'low',
  'fast', 'slow', 'quick', 'easy', 'difficult', 'hard', 'simple', 'cheap', 'expensive', 'new', 'old', 'young',
  'beautiful', 'ugly', 'pretty', 'handsome', 'clean', 'dirty', 'bright', 'dark', 'quiet', 'noisy', 'loud',
  'happy', 'sad', 'angry', 'tired', 'sleepy', 'hungry', 'thirsty', 'sick', 'healthy', 'strong', 'weak',
  'soft', 'smooth', 'rough', 'sticky', 'empty', 'full', 'safe', 'dangerous', 'busy', 'free', 'rich', 'poor',
  'early', 'late', 'close', 'far', 'near', 'allergic',
  'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'black', 'white', 'brown', 'gray', 'grey', 'gold', 'silver',
]);

const OVERRIDES = {
  秒: ['measure word'],
  刻钟: ['measure word'],
  双: ['measure word'],
  一半: ['numeral'],
  半: ['numeral'],
  几: ['numeral'],
  许多: ['adjective'],
  干杯: ['expression'],
  加油: ['expression'],
  作文: ['noun'],
  导游: ['noun'],
  签证: ['noun'],
  笔试: ['noun'],
  值机: ['verb'],
  骑自行车: ['verb'],
  划算: ['adjective'],
};

function classifyPOS(w) {
  if (OVERRIDES[w.chinese]) return OVERRIDES[w.chinese];
  const m = String(w.meaning || '').trim();
  if (w.subcategory === 'greetings') return ['expression'];
  if (w.subcategory === 'numbers') return ['numeral'];
  if (/^to\s/i.test(m)) {
    const rest = m.split(';').map((s) => s.trim()).slice(1);
    return rest.some((p) => !/^to\s/i.test(p)) ? ['verb', 'noun'] : ['verb'];
  }
  const words = m.split(';').map((s) => s.trim());
  if (words.every((p) => ADJ.has(p.toLowerCase()))) return ['adjective'];
  if (words.some((p) => ADJ.has(p.toLowerCase())) && words.some((p) => !ADJ.has(p.toLowerCase()))) return ['noun', 'adjective'];
  return ['noun'];
}

// Borrow POS + collect HSK levels for words sharing the same Chinese form.
const hskPosByChar = {};
const hskLevelsByChar = {};
for (const w of VOCABULARY) {
  if (w.category !== 'hsk') continue;
  if (w.partOfSpeech) {
    const list = Array.isArray(w.partOfSpeech) ? w.partOfSpeech : [w.partOfSpeech];
    (hskPosByChar[w.chinese] = hskPosByChar[w.chinese] || new Set());
    list.forEach((p) => hskPosByChar[w.chinese].add(p));
  }
  if (w.hskLevel > 0) (hskLevelsByChar[w.chinese] = hskLevelsByChar[w.chinese] || new Set()).add(w.hskLevel);
}

const ARRAY_BY_PREFIX = {
  greetings: 'GREETINGS_WORDS', food: 'FOOD_WORDS', shopping: 'SHOPPING_WORDS', travel: 'TRAVEL_WORDS',
  weather: 'WEATHER_WORDS', time: 'TIME_WORDS', family: 'FAMILY_WORDS', colors: 'COLORS_WORDS', numbers: 'NUMBERS_WORDS',
  health: 'HEALTH_WORDS', education: 'EDUCATION_WORDS', technology: 'TECHNOLOGY_WORDS',
  business: 'BUSINESS_WORDS', nature: 'NATURE_WORDS',
};

// ── build enriched non-HSK entries ──
const nonHsk = VOCABULARY.filter((w) => w.category !== 'hsk');
const groups = new Map(); // const name → [entries]
let borrowed = 0, classified = 0, pinyinFixed = 0, pinyinSkipped = 0;
for (const w of nonHsk) {
  const clean = { ...w };
  for (const f of ENRICHED_FIELDS) delete clean[f];

  // partOfSpeech
  const override = OVERRIDES[w.chinese];
  const borrowedPos = hskPosByChar[w.chinese];
  if (override) {
    clean.partOfSpeech = override;
    classified++;
  } else if (borrowedPos && borrowedPos.size) {
    clean.partOfSpeech = [...borrowedPos];
    borrowed++;
  } else {
    clean.partOfSpeech = classifyPOS(w);
    classified++;
  }

  // hskMatchLevels — HSK levels where the same Chinese form appears, so the popup
  // can show an HSK badge on topical words that also exist in the HSK word lists.
  const matchLevels = hskLevelsByChar[w.chinese];
  if (matchLevels && matchLevels.size) {
    clean.hskMatchLevels = [...matchLevels].sort((a, b) => a - b);
  }

  // example pinyin tone marks
  clean.examples = (clean.examples || []).map((ex) => {
    if (!ex.pinyin || hasTone(ex.pinyin)) {
      pinyinSkipped++;
      return ex;
    }
    pinyinFixed++;
    return { ...ex, pinyin: convertPinyin(ex.chinese, ex.pinyin) };
  });

  const prefix = String(w.id).split('-')[0];
  const arrName = ARRAY_BY_PREFIX[prefix];
  if (!arrName) throw new Error('Unknown array for id: ' + w.id);
  if (!groups.has(arrName)) groups.set(arrName, []);
  groups.get(arrName).push(clean);
}

// ── rewrite vocabulary.js ──
// Replace the whole non-HSK section (from `const GREETINGS_WORDS` to the line
// before `const VOCABULARY_DATA`) so we never depend on array terminators that
// differ across the file (`]` vs `];`, compact vs pretty-printed entries).
const src = await readFile(FILE, 'utf8');
await copyFile(FILE, BACKUP);
const startMarker = 'const GREETINGS_WORDS = [';
const endMarker = '\nconst VOCABULARY_DATA = ';
const si = src.indexOf(startMarker);
const ei = src.indexOf(endMarker);
if (si < 0 || ei < 0) throw new Error('Section markers not found in vocabulary.js');
const ARRAY_ORDER = ['GREETINGS_WORDS', 'FOOD_WORDS', 'SHOPPING_WORDS', 'TRAVEL_WORDS', 'WEATHER_WORDS', 'TIME_WORDS',
  'FAMILY_WORDS', 'COLORS_WORDS', 'NUMBERS_WORDS', 'HEALTH_WORDS', 'EDUCATION_WORDS', 'TECHNOLOGY_WORDS',
  'BUSINESS_WORDS', 'NATURE_WORDS'];
const section = ARRAY_ORDER.map((name) => {
  const entries = groups.get(name) || [];
  return `const ${name} = [\r\n\r\n${entries.map((e) => JSON.stringify(e)).join(',\r\n')}\r\n];`;
}).join('\r\n\r\n');
const out = src.slice(0, si) + section + '\r\n\r\n' + src.slice(ei);
// Atomic write: write a temp file first, then rename over the target so a crash
// mid-write can never leave vocabulary.js truncated or half-written.
const tmp = new URL('../src/data/vocabulary.js.tmp', import.meta.url);
await writeFile(tmp, out, 'utf8');
await rename(tmp, FILE);

// Post-write self-check: re-import the freshly written module and fail loudly on
// any sign of corruption (wrong word count, missing POS, untoned example pinyin).
const check = await import(`../src/data/vocabulary.js?t=${Date.now()}`);
const checkWords = check.VOCABULARY;
if (checkWords.length !== 10643) throw new Error('Self-check failed: expected 10643 words, got ' + checkWords.length);
const nonHskCheck = checkWords.filter((w) => w.category !== 'hsk');
if (nonHskCheck.some((w) => !w.partOfSpeech || !w.partOfSpeech.length)) throw new Error('Self-check failed: some non-HSK words lack partOfSpeech');
if (nonHskCheck.some((w) => (w.examples || []).some((e) => e.pinyin && !hasTone(e.pinyin)))) throw new Error('Self-check failed: some example pinyin still lacks tone marks');
console.log('self-check OK');

console.log(JSON.stringify({
  total: nonHsk.length,
  posBorrowed: borrowed,
  posClassified: classified,
  pinyinFixed,
  pinyinAlreadyToned: pinyinSkipped,
}, null, 2));
