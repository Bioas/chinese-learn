// Character-level metadata is intentionally separate from vocabulary entries.
// A character can appear in words from several HSK levels, so never infer a
// single character level from the level of a compound word.

export const CHARACTER_REFERENCE_SOURCE = 'HSK Academy character reference';

export const CHARACTERS = {
  中: {
    character: '中',
    pinyin: 'zhōng',
    characterHskEntryLevel: 1,
    characterHskLevels: [1, 3, 4, 5, 6],
    source: CHARACTER_REFERENCE_SOURCE,
    sourceUrl: 'https://hsk.academy/en/characters/%E4%B8%AD',
    note: 'The character appears across multiple word levels. This is not the word-list level for 中 as a standalone sense.',
  },
};

export function getCharacterMetadata(text = '') {
  return [...String(text)].map((character) => CHARACTERS[character]).filter(Boolean);
}

export function getCharacterHskLevels(text = '') {
  return [...new Set(getCharacterMetadata(text).flatMap((metadata) => metadata.characterHskLevels || []))].sort((a, b) => a - b);
}

export function getCharacterHskEntryLevel(text = '') {
  const levels = getCharacterHskLevels(text);
  return levels.length > 0 ? levels[0] : null;
}
