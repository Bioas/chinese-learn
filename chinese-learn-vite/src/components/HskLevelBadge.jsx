import React from 'react';
import useTranslation from '../hooks/useTranslation';

export default function HskLevelBadge({ word, language = 'en', className = '', compact = false }) {
  const { t } = useTranslation();
  const wordLevel = word?.vocabularyHskLevel ?? (word?.category === 'hsk' ? word?.hskLevel : null);
  const displayLevel = wordLevel === 7 ? '7-9' : wordLevel;
  const characterLevel = word?.characterHskLevel;
  const characterLevels = word?.characterHskLevels?.length > 0
    ? word.characterHskLevels
    : characterLevel ? [characterLevel] : [];
  // HSK levels where the same Chinese form also appears in the HSK word lists
  // (topical words that exist in HSK too) — shown as a green badge on non-HSK words.
  const matchLevels = Array.isArray(word?.hskMatchLevels)
    ? word.hskMatchLevels.map((lv) => (lv === 7 ? '7-9' : lv))
    : [];
  const isThai = language === 'th';

  if (!wordLevel && characterLevels.length === 0 && matchLevels.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center justify-center gap-1.5 ${className}`}>
      {wordLevel > 0 && (
        <span
          className="text-[10px] px-2.5 py-1 rounded-full"
          style={{
            background: 'color-mix(in srgb, var(--accent-from) 15%, transparent)',
            color: 'var(--accent-from)',
          }}
          title={isThai ? 'ระดับคำศัพท์ตาม HSK 3.0' : 'Word level in HSK 3.0'}
        >
          {t(compact ? 'vocab.hskLevel' : 'vocab.wordLevel', { n: displayLevel })}
        </span>
      )}
      {characterLevels.length > 0 && (
        <span
          className="text-[10px] px-2.5 py-1 rounded-full"
          style={{
            background: 'color-mix(in srgb, #64748b 14%, transparent)',
            color: 'var(--text-secondary)',
          }}
          title={isThai ? 'ระดับอ้างอิงของตัวอักษร ไม่ใช่ระดับคำศัพท์ทั้งคำ' : 'Character reference levels, not the level of the whole word'}
        >
          {t('vocab.characterLevel', { n: characterLevels.join(' · ') })}
        </span>
      )}
      {matchLevels.length > 0 && (
        <span
          className="text-[10px] px-2.5 py-1 rounded-full"
          style={{
            background: 'color-mix(in srgb, var(--accent-from) 15%, transparent)',
            color: 'var(--accent-from)',
          }}
          title={t('vocab.hskMatchTitle', { n: matchLevels.join(' · ') })}
        >
          {t('vocab.hskMatch', { n: matchLevels.join(' · ') })}
        </span>
      )}
    </div>
  );
}
