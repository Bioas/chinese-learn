import { VOCABULARY, HSK_WORD_STANDARD } from './vocabulary.js';

export const HSK_LEVELS = [1, 2, 3, 4, 5, 6, 7];

/**
 * Build a lightweight, read-only audit of the app's HSK word metadata.
 * This validates the internal structure; it does not claim that every level
 * matches an external syllabus until each entry is checked against a cited
 * source. Character-level metadata is deliberately excluded from this report.
 */
export function auditHskVocabulary(words = VOCABULARY) {
  const hskWords = words.filter((word) => word.category === 'hsk');
  const levels = Object.fromEntries(
    HSK_LEVELS.map((level) => {
      const entries = hskWords.filter((word) => word.vocabularyHskLevel === level);
      return [level, {
        count: entries.length,
        status: 'pending-source-verification',
        ids: entries.map((word) => word.id),
      }];
    })
  );

  const metadataErrors = hskWords.flatMap((word) => {
    const errors = [];
    if (word.vocabularyHskLevel !== word.hskLevel) errors.push('vocabularyHskLevel');
    if (word.subcategory !== `hsk${word.hskLevel}`) errors.push('subcategory');
    if (word.hskVersion !== HSK_WORD_STANDARD) errors.push('hskVersion');
    if (word.hskLevelType !== 'word') errors.push('hskLevelType');
    return errors.length > 0 ? [{ id: word.id, errors }] : [];
  });

  return {
    standard: HSK_WORD_STANDARD,
    levels,
    totalHskWords: hskWords.length,
    metadataErrors,
    sourceVerification: 'pending',
    note: 'Internal consistency is checked here; external syllabus verification must be completed per word and sense.',
  };
}

export const HSK_AUDIT_REPORT = auditHskVocabulary();
