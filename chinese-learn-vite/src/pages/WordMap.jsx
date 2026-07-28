import React, { useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import SpeakButton from '../components/SpeakButton';
import Icon from '../components/Icon';
import InkParticles from '../components/InkParticles';
import useTranslation from '../hooks/useTranslation';
import useWordMap from '../hooks/useWordMap';
import { CATEGORIES, VOCABULARY, getSubcategoryIcon } from '../data/vocabulary';

const WORDMAP_INK_CHARS = ['網', '絡', '連', '繫', '字', '詞', '關', '聯', '圖', '譜'];

const CATEGORY_COLORS = {
  hsk: '#f97316', daily: '#e11d48', topics: '#8b5cf6',
  health: '#f43f5e', education: '#8b5cf6', technology: '#06b6d4',
  business: '#eab308', nature: '#22c55e',
};

function getCatColor(cat) {
  return CATEGORY_COLORS[cat] || '#a89488';
}

export default function WordMap() {
  const { t, meaning } = useTranslation();
  const { state, toggleSavedWord } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [popupWord, setPopupWord] = useState(null);

  const currentCategory = useMemo(
    () => CATEGORIES.find(c => c.id === selectedCategory),
    [selectedCategory]
  );

  const { clusters, totalCount } = useWordMap({
    searchTerm,
    selectedCategory,
    selectedSubcategories,
  });

  const closePopup = useCallback(() => setPopupWord(null), []);

  // Escape to close popup
  React.useEffect(() => {
    if (!popupWord) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') closePopup(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [popupWord, closePopup]);

  return (
    <div className="space-y-6 relative">
      <InkParticles chars={WORDMAP_INK_CHARS} />

      {/* Title */}
      <div className="animate-slide-up relative z-10">
        <h1 className="text-3xl lg:text-4xl font-bold">
          <span className="gradient-text"><Icon name="wordmap" /> {t('wordmap.title')}</span>
        </h1>
        <p className="text-secondary mt-1">{t('wordmap.subtitle')}</p>
      </div>

      {/* Search + Filters */}
      <div className="glass-card p-4 animate-slide-up relative z-10">
        <div className="relative mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('wordmap.searchPlaceholder')}
            className="input-field pl-10"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">
            <Icon name="search" />
          </span>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors text-sm"
            >
              <Icon name="xmark" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-2">
          <button
            onClick={() => { setSelectedCategory('all'); setSelectedSubcategories([]); }}
            className={`chip text-xs ${selectedCategory === 'all' && selectedSubcategories.length === 0 && !searchTerm ? 'active' : ''}`}
          >
            {t('wordmap.allCategories')}
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id); setSelectedSubcategories([]); }}
              className={`chip text-xs ${selectedCategory === cat.id && selectedSubcategories.length === 0 ? 'active' : ''}`}
            >
              <Icon name={cat.icon} className="text-[10px] mr-1" />
              {state.language === 'th' ? cat.nameThai : cat.name}
            </button>
          ))}
        </div>

        {selectedCategory !== 'all' && currentCategory && (
          <div className="flex flex-wrap gap-1.5">
            {currentCategory.subcategories.map(sub => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubcategories(prev =>
                  prev.includes(sub.id) ? prev.filter(id => id !== sub.id) : [sub.id]
                )}
                className={`chip text-xs ${selectedSubcategories.includes(sub.id) ? 'active' : ''}`}
              >
                <Icon name={sub.icon} className="text-[10px] mr-1" />
                {state.language === 'th' ? sub.nameThai : sub.name}
              </button>
            ))}
          </div>
        )}

        <div className="mt-3 text-[10px] text-muted tracking-wider text-right">
          {totalCount > 0
            ? t('wordmap.wordCount', { n: totalCount, shown: clusters.length })
            : t('wordmap.noMatches')}
        </div>
      </div>

      {/* Word Cluster Cards */}
      {clusters.length === 0 ? (
        <div className="glass-card p-12 text-center animate-fade-in relative z-10">
          <p className="text-4xl mb-3 text-secondary"><Icon name="wordmap" /></p>
          <p className="text-secondary">{t('wordmap.noMatches')}</p>
          <p className="text-xs text-muted mt-1">{t('wordmap.adjustFilters')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in relative z-10">
          {clusters.map(({ word, clusters: wordClusters }) => {
            const catColor = getCatColor(word.category);
            return (
              <div
                key={word.id}
                className="glass-card glass-card-hover overflow-hidden flex flex-col group"
              >
                {/* Colored stripe */}
                <div className="h-0.5 w-full flex-shrink-0" style={{ background: `linear-gradient(90deg, ${catColor}, color-mix(in srgb, ${catColor} 40%, transparent))` }} />

                <div className="p-4 flex flex-col gap-4 flex-1">
                  {/* Word header */}
                  <div className="flex items-start justify-between">
                    <button
                      onClick={() => setPopupWord(word)}
                      className="text-left group/word"
                    >
                      <span
                        className="font-bold tracking-wide transition-all duration-200 group-hover/word:scale-105 inline-block"
                        style={{ fontSize: '1.5rem', lineHeight: 1.2, color: 'var(--text-primary)' }}
                      >
                        {word.chinese}
                      </span>
                      {state.showPinyin && (
                        <p className="text-xs text-secondary/70 italic mt-0.5">{word.pinyin}</p>
                      )}
                      <p className="text-sm text-primary/80 mt-0.5 font-medium">{meaning(word)}</p>
                    </button>

                    {/* Save button */}
                    <button
                      onClick={() => toggleSavedWord(word.id)}
                      className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-200 hover:scale-110 ${
                        state.savedWordIds.includes(word.id) ? 'opacity-100' : 'opacity-50 md:opacity-0 md:group-hover:opacity-100'
                      }`}
                      style={{
                        background: state.savedWordIds.includes(word.id) ? 'color-mix(in srgb, var(--accent-from) 15%, transparent)' : 'transparent',
                      }}
                    >
                      <Icon
                        name="bookmark"
                        className="text-sm"
                        style={{ color: state.savedWordIds.includes(word.id) ? 'var(--accent-from)' : 'var(--text-muted)' }}
                      />
                    </button>
                  </div>

                  {/* Category badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: `color-mix(in srgb, ${catColor} 15%, transparent)`, color: catColor }}>
                      <Icon name={getSubcategoryIcon(word.subcategory)} className="text-[8px] mr-1" />
                      {word.hskLevel > 0 ? `HSK ${word.hskLevel}` : word.subcategory}
                    </span>
                  </div>

                  {/* Connected words grouped by shared character */}
                  {wordClusters.length > 0 ? (
                    <div className="space-y-3 flex-1">
                      <p className="text-[10px] font-semibold tracking-wider uppercase text-muted">
                        {t('wordmap.connectedBy')}
                      </p>
                      {wordClusters.map(({ char, related }) => (
                        <div key={char}>
                          <p className="text-[11px] text-secondary mb-1.5 flex items-center gap-1.5">
                            <span className="font-bold text-sm" style={{ fontFamily: "'Noto Sans SC', serif", color: 'var(--text-primary)' }}>{char}</span>
                            <span className="text-muted">·</span>
                            <span className="text-muted">{related.length} {t('wordmap.words')}</span>
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {related.slice(0, 3).map(v => (
                              <button
                                key={v.id}
                                onClick={() => setPopupWord(v)}
                                className="chip text-[11px] flex items-center gap-1 py-1 px-2"
                                title={`${v.chinese} - ${meaning(v)}`}
                              >
                                <span className="font-medium">{v.chinese}</span>
                                <span className="text-[9px] text-muted">({v.pinyin})</span>
                              </button>
                            ))}
                            {related.length > 3 && (
                              <span className="text-[10px] text-muted self-center">+{related.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-[11px] text-muted/50 italic">{t('wordmap.noConnections')}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Word Detail Popup */}
      {popupWord && createPortal(
        <>
          <div
            className="fixed bg-black/40 backdrop-blur-lg popup-overlay-enter"
            style={{ top: '-100px', left: '-100px', right: '-100px', bottom: '-100px', zIndex: 100 }}
            onClick={closePopup}
          />
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
            <div
              key={popupWord.id}
              className="relative w-full max-w-lg max-h-[90vh] rounded-2xl border border-white/[0.06] overflow-hidden flex flex-col pointer-events-auto popup-enter"
              style={{
                background: 'linear-gradient(160deg, color-mix(in srgb, var(--bg-card) 95%, var(--accent-from)), var(--bg-primary) 80%)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.35), 0 0 0 1px var(--border-color), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-16 h-16 pointer-events-none" style={{ background: 'linear-gradient(135deg, var(--accent-from) 0%, transparent 60%)', opacity: 0.15, borderRadius: '16px 0 0 0' }} />
              <div className="absolute bottom-0 right-0 w-16 h-16 pointer-events-none" style={{ background: 'linear-gradient(315deg, var(--accent-from) 0%, transparent 60%)', opacity: 0.15, borderRadius: '0 0 16px 0' }} />

              <button
                onClick={closePopup}
                className="absolute top-4 right-5 z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors text-muted hover:text-primary"
              >
                <Icon name="xmark" className="text-lg" />
              </button>

              <div className="flex-1 min-h-0 overflow-y-auto p-6 sm:p-8">
                <div className="text-center mb-6">
                  <div className="relative inline-flex items-center justify-center">
                    <span className="font-bold tracking-wide"
                      style={{ fontSize: '3.5rem', lineHeight: 1.1, color: 'var(--text-primary)', textShadow: '0 0 40px var(--accent-glow)' }}
                    >
                      {popupWord.chinese}
                    </span>
                    <div className="absolute -right-11 top-1/2 -translate-y-1/2">
                      <SpeakButton text={popupWord.chinese} variant="icon" size="md" />
                    </div>
                  </div>
                  {state.showPinyin && (
                    <p className="text-sm text-secondary/80 italic tracking-wide mt-2">{popupWord.pinyin}</p>
                  )}
                  <p className="text-base text-primary/90 mt-2 font-medium">{meaning(popupWord)}</p>

                  <div className="flex items-center justify-center gap-2 mt-3">
                    <span className="text-[11px] px-3 py-1 rounded-full" style={{ background: 'color-mix(in srgb, var(--accent-from) 15%, transparent)', color: 'var(--accent-from)' }}>
                      <Icon name={getSubcategoryIcon(popupWord.subcategory)} className="text-[9px] mr-1" />
                      {popupWord.hskLevel > 0 ? `HSK ${popupWord.hskLevel}` : popupWord.subcategory}
                    </span>
                    <button
                      onClick={() => toggleSavedWord(popupWord.id)}
                      className="text-[11px] px-3 py-1 rounded-full flex items-center gap-1 transition-colors"
                      style={{
                        background: state.savedWordIds.includes(popupWord.id)
                          ? 'color-mix(in srgb, var(--accent-from) 15%, transparent)'
                          : 'color-mix(in srgb, var(--text-muted) 15%, transparent)',
                        color: state.savedWordIds.includes(popupWord.id) ? 'var(--accent-from)' : 'var(--text-muted)',
                      }}
                    >
                      <Icon name="bookmark" className="text-[9px]" /> {t('wordmap.save')}
                    </button>
                  </div>
                </div>

                {/* Connected words */}
                {popupWord.chinese.split('').filter(ch => ch.match(/[\u4e00-\u9fff]/)).map(ch => {
                  const related = VOCABULARY
                    .filter(v => v.id !== popupWord.id && v.chinese.includes(ch))
                    .slice(0, 10);
                  if (related.length === 0) return null;
                  return (
                    <div key={ch} className="mb-4">
                      <p className="text-[11px] font-semibold tracking-wider uppercase text-muted mb-2 flex items-center gap-2">
                        <span className="w-4 h-px" style={{ background: 'var(--accent-from)' }} />
                        {t('wordmap.shared')} <span className="text-lg font-normal text-primary" style={{ fontFamily: "'Noto Sans SC', serif" }}>{ch}</span>
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {related.map(v => (
                          <button
                            key={v.id}
                            onClick={() => setPopupWord(v)}
                            className="chip text-xs flex items-center gap-1"
                          >
                            <span>{v.chinese}</span>
                            <span className="text-[9px] text-muted">({v.pinyin})</span>
                            {meaning(v) && <span className="text-[9px] text-secondary ml-0.5">— {meaning(v)}</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
