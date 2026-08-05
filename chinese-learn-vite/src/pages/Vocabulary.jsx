import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import SpeakButton from '../components/SpeakButton';
import Icon from '../components/Icon';
import StrokeOrder from '../components/StrokeOrder';
import useTranslation from '../hooks/useTranslation';
import InkParticles from '../components/InkParticles';
import { VOCABULARY } from '../data/vocabulary';
import { CATEGORIES, getSubcategoryIcon, getCategoryColor } from '../data/categories';
import HskLevelBadge from '../components/HskLevelBadge';

const VOCAB_INK_CHARS = ['詞', '字', '典', '学', '習', '句', '文', '義', '读', '書'];

/* ── Reusable scrollable chip row with fade hints ── */
function ScrollFadeRow({ children, className = '' }) {
  const ref = useRef(null);
  const [scrolled, setScrolled] = useState({ left: false, right: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setScrolled({
      left: el.scrollLeft > 8,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 8,
    });
  }, []);

  useEffect(() => {
    update();
    const onResize = () => update();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [update]);

  return (
    <div className="relative min-w-0">
      <div
        ref={ref}
        onScroll={update}
        className={`flex gap-2 overflow-x-auto scrollbar-none snap-x snap-proximity ${className}`}
      >
        {children}
      </div>
      <div
        className={`absolute left-0 top-0 bottom-0 w-12 pointer-events-none bg-gradient-to-r from-[var(--bg-primary)] to-transparent transition-opacity duration-300 ${
          scrolled.left ? 'opacity-100' : 'opacity-0'
        } md:hidden`}
      />
      <div
        className={`absolute right-0 top-0 bottom-0 w-12 pointer-events-none bg-gradient-to-l from-[var(--bg-primary)] to-transparent transition-opacity duration-300 ${
          scrolled.right ? 'opacity-100' : 'opacity-0'
        } md:hidden`}
      />
    </div>
  );
}

// Fisher–Yates shuffle — pure, returns new array; used to randomize vocab order per category/filter change.
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Per-status accent colors — same palette as the Dashboard analytics & word-card status buttons.
const STATUS_META = [
  { id: 'new', color: '#64748b' },
  { id: 'learning', color: '#eab308' },
  { id: 'reviewing', color: '#ef4444' },
  { id: 'mastered', color: '#22c55e' },
];


// Localized subcategory label e.g. "Food & Drink" (en) / "อาหารและเครื่องดื่ม" (th).
// Falls back to the raw subcategory id (e.g. "hsk5") if the subcategory is unknown.
function getSubcategoryLabel(word, language) {
  const cat = CATEGORIES.find((c) => c.id === word?.category);
  const sub = cat?.subcategories.find((s) => s.id === word?.subcategory);
  return sub ? (language === 'th' ? sub.nameThai : sub.name) : word?.subcategory || '';
}

// Per-part-of-speech accent colors — popup badges echo the HSK badge style with a distinct hue each.
const POS_META = {
  noun: '#f97316',
  verb: '#22c55e',
  adjective: '#8b5cf6',
  adverb: '#06b6d4',
  particle: '#64748b',
  'measure word': '#eab308',
  numeral: '#ec4899',
  pronoun: '#6366f1',
  preposition: '#14b8a6',
  conjunction: '#f43f5e',
  expression: '#f59e0b',
  interjection: '#ef4444',
  prefix: '#0ea5e9',
  suffix: '#84cc16',
  'quantity expression': '#a855f7',
  other: '#94a3b8',
};

export default function Vocabulary() {
  const { t, meaning } = useTranslation();
  const formatPartOfSpeech = useCallback((part) => {
    const rawPart = String(part ?? '').trim();
    const key = `vocab.pos.${rawPart.toLowerCase()}`;
    const translated = t(key);
    return translated === key ? rawPart : translated;
  }, [t]);
  const { state, dispatch, togglePinned, studyWord, toggleSavedWord } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [popupWord, setPopupWord] = useState(null);
  const [showAllExamples, setShowAllExamples] = useState(false);
  const [page, setPage] = useState(1);
  // Responsive pagination: 20 cards on mobile (< 768px), 60 cards on desktop
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  );
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  const ITEMS_PER_PAGE = isMobile ? 20 : 60;

  useEffect(() => {
    setShowAllExamples(false);
  }, [popupWord?.id]);

  useEffect(() => {
    if (!popupWord) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setPopupWord(null); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [popupWord]);

  useEffect(() => { setPage(1); }, [selectedCategory, selectedSubcategories, selectedStatuses, searchTerm, showSaved, isMobile]);

  // Scroll back to the top whenever the page changes, so the user doesn't stay at the bottom
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  const currentCategory = useMemo(
    () => CATEGORIES.find(c => c.id === selectedCategory),
    [selectedCategory]
  );

  // Layer 1: filter by *intent only* (category + subcategory + dedupe) — no state-driven filters here
  // so bookmark/status toggles won't re-shuffle the deck below.
  const intentWords = useMemo(() => {
    let words = VOCABULARY;
    if (searchTerm) {
      const query = searchTerm.trim().toLowerCase();
      if (query) {
        words = words.filter(w =>
          (w.chinese && w.chinese.includes(query)) ||
          (w.pinyin && w.pinyin.toLowerCase().includes(query)) ||
          (w.meaning && w.meaning.toLowerCase().includes(query)) ||
          (w.meaningThai && w.meaningThai.toLowerCase().includes(query))
        );
      }
    }
    if (!showSaved && selectedSubcategories.length === 0 && currentCategory) {
      // No subcategory selected → show ALL words from the current category
      const subIds = currentCategory.subcategories.map(s => s.id);
      words = words.filter(w => currentCategory.id === 'hsk'
        ? subIds.includes(`hsk${w.vocabularyHskLevel ?? w.hskLevel}`)
        : subIds.includes(w.subcategory));
    }
    if (selectedSubcategories.length > 0) {
      words = words.filter(w => currentCategory?.id === 'hsk'
        ? selectedSubcategories.includes(`hsk${w.vocabularyHskLevel ?? w.hskLevel}`)
        : selectedSubcategories.includes(w.subcategory));
    }
    // Deduplicate identical vocabulary entries, not Chinese characters alone.
    // A single character can represent different words/senses, e.g. HSK 2
    // has 过 (guò, verb) and 过 (guo, particle), plus 花 (verb/noun).
    // Keep those cards separate while still collapsing the same entry repeated
    // across HSK levels (e.g. 可能 with the same pinyin, meaning, and POS).
    const seenVocabEntries = new Set();
    words = words.filter(w => {
      const partOfSpeech = Array.isArray(w.partOfSpeech)
        ? w.partOfSpeech.join('|')
        : (w.partOfSpeech || '');
      const entryKey = [w.chinese, w.pinyin, w.meaning, partOfSpeech].join('\\u0000');
      if (seenVocabEntries.has(entryKey)) return false;
      seenVocabEntries.add(entryKey);
      return true;
    });
    return words;
  }, [searchTerm, showSaved, selectedSubcategories, currentCategory]);

  // Layer 2: shuffle — re-shuffles ONLY when filter-intent (category/subcategory/showSaved flag) changes.
  // Bookmark + status toggles do NOT re-shuffle.
  const shuffledIntent = useMemo(() => {
    return shuffleArray(intentWords);
  }, [intentWords]);

  // Layer 3: apply state-dependent filters ON TOP of the stable shuffled order (showSaved + status).
  // Base view = shuffled intent with saved-filtering applied (status not yet) —
  // used both for the per-status counts and the final filtered list.
  const savedFilteredWords = useMemo(() => {
    if (!showSaved) return shuffledIntent;
    return shuffledIntent.filter(w => state.savedWordIds.includes(w.id));
  }, [shuffledIntent, showSaved, state.savedWordIds]);

  // Per-status word counts within the current view (category/search/saved applied, status not yet).
  const statusCounts = useMemo(() => {
    const counts = { new: 0, learning: 0, reviewing: 0, mastered: 0 };
    for (const w of savedFilteredWords) {
      const s = state.wordStatuses[w.id] || 'new';
      counts[s] = (counts[s] || 0) + 1;
    }
    return counts;
  }, [savedFilteredWords, state.wordStatuses]);

  const filteredWords = useMemo(() => {
    let words = savedFilteredWords;
    if (selectedStatuses.length > 0) {
      words = words.filter(w => {
        const status = state.wordStatuses[w.id] || 'new';
        return selectedStatuses.includes(status);
      });
    }
    return words;
  }, [savedFilteredWords, selectedStatuses, state.wordStatuses]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredWords.length / ITEMS_PER_PAGE)), [filteredWords, ITEMS_PER_PAGE]);
  const paginatedWords = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredWords.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredWords, page, ITEMS_PER_PAGE]);

  const toggleSubcategory = (subId) => {
    setSelectedSubcategories(prev =>
      prev.includes(subId) ? prev.filter(id => id !== subId) : [...prev, subId]
    );
  };

  const toggleStatus = (status) => {
    setSelectedStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  return (
    <div className="space-y-6 relative">
      <InkParticles chars={VOCAB_INK_CHARS} />

      <div className="animate-slide-up relative z-10">
        <h1 className="text-3xl lg:text-4xl font-bold">
          <span className="gradient-text"><Icon name="vocabulary" /> {t('vocab.title')}</span>
        </h1>
        <p className="text-secondary mt-1">{t('vocab.subtitle')}</p>
      </div>

      {state.pinnedSubcategories.length > 0 && (
        <div className="glass-card p-4 animate-slide-up relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-blue-400"><Icon name="pin" /></span>
            <h3 className="font-medium text-sm text-primary">{t('vocab.pinnedShortcuts')}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {state.pinnedSubcategories.map(subId => {
              const icon = getSubcategoryIcon(subId);
              return (
                <button
                  key={subId}
                  onClick={() => {
                    setSelectedSubcategories([subId]);
                    togglePinned(subId);
                  }}
                  className="chip pinned flex items-center gap-1.5"
                >
                  <Icon name={icon} />
                  <span>{subId}</span>
                  <Icon name="xmark" className="text-muted ml-1" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search + category filters — mirror the Word Map filter treatment. */}
      <div className="glass-card p-4 animate-slide-up relative z-10">
        <div className="relative mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('vocab.searchPlaceholder')}
            className="input-field pl-10"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">
            <Icon name="search" />
          </span>
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors text-sm"
              aria-label={t('vocab.clearSearch')}
            >
              <Icon name="xmark" />
            </button>
          )}
        </div>

        <div className="relative min-w-0 mb-2">
          <ScrollFadeRow className="md:flex-wrap md:overflow-visible">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSelectedSubcategories([]);
                setShowSaved(false);
              }}
              className={`chip text-xs snap-start shrink-0 ${selectedCategory === 'all' && selectedSubcategories.length === 0 && !searchTerm && !showSaved ? 'active' : ''}`}
            >
              {t('vocab.allCategories')}
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSelectedSubcategories([]);
                  setShowSaved(false);
                }}
                className={`chip text-xs snap-start shrink-0 ${selectedCategory === cat.id && !showSaved ? 'active' : ''}`}
              >
                <Icon name={cat.icon} className="text-[10px] mr-1" />
                {state.language === 'th' ? cat.nameThai : cat.name}
              </button>
            ))}
            <button
              onClick={() => {
                setShowSaved(true);
                setSelectedSubcategories([]);
              }}
              className={`chip text-xs snap-start shrink-0 ${showSaved ? 'active' : ''}`}
            >
              <Icon name="bookmark" className="text-[10px] mr-1" />
              {t('vocab.saved')}
            </button>
          </ScrollFadeRow>
        </div>

        {/* Keep this row at a stable height so switching All/HSK never moves the content below. */}
        <div className="relative min-w-0 mt-2 h-8">
          <ScrollFadeRow className="h-8 overflow-x-auto">
            {!showSaved && currentCategory?.subcategories.map(sub => {
              const isPinned = state.pinnedSubcategories.includes(sub.id);
              return (
                <button
                  key={sub.id}
                  onClick={() => toggleSubcategory(sub.id)}
                  onDoubleClick={() => togglePinned(sub.id)}
                  className={`chip text-xs snap-start shrink-0 ${
                    selectedSubcategories.includes(sub.id) ? 'active' : ''
                  } ${isPinned ? 'pinned' : ''}`}
                  title={isPinned ? t('vocab.doubleClickUnpin') : t('vocab.doubleClickPin')}
                >
                  <Icon name={sub.icon} className="text-[10px] mr-1" />
                  {state.language === 'th' ? sub.nameThai : sub.name}
                  {isPinned && <Icon name="pin" className="text-[10px] text-pink-400 ml-1" />}
                </button>
              );
            })}
          </ScrollFadeRow>
        </div>
      </div>

      <div className="glass-card p-4 animate-fade-in relative z-10">
        <div className="relative min-w-0">
          <ScrollFadeRow className="md:flex-wrap md:overflow-visible">
          {/* All — clears every status filter */}
          <button
            type="button"
            onClick={() => setSelectedStatuses([])}
            aria-pressed={selectedStatuses.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 active:scale-95 snap-start shrink-0"
            style={{
              background: selectedStatuses.length === 0 ? 'var(--accent-gradient)' : 'color-mix(in srgb, var(--bg-card) 70%, transparent)',
              border: `1px solid ${selectedStatuses.length === 0 ? 'transparent' : 'var(--border-color)'}`,
              color: selectedStatuses.length === 0 ? '#fff' : 'var(--text-secondary)',
              boxShadow: selectedStatuses.length === 0 ? '0 2px 10px var(--accent-glow)' : 'none',
            }}
          >
            <span>{t('vocab.allStatuses')}</span>
            <span
              className="text-[10px] font-semibold tabular-nums px-1.5 py-px rounded-full"
              style={{
                background: selectedStatuses.length === 0 ? 'rgba(255,255,255,0.22)' : 'color-mix(in srgb, var(--text-muted) 12%, transparent)',
                color: selectedStatuses.length === 0 ? '#fff' : 'var(--text-muted)',
              }}
            >
              {savedFilteredWords.length}
            </span>
          </button>

          {STATUS_META.map(({ id, color }) => {
            const active = selectedStatuses.includes(id);
            const textColor = active ? `color-mix(in srgb, ${color} 60%, var(--text-primary))` : 'var(--text-secondary)';
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleStatus(id)}
                aria-pressed={active}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 active:scale-95 snap-start shrink-0"
                style={{
                  background: active ? `color-mix(in srgb, ${color} 15%, transparent)` : 'color-mix(in srgb, var(--bg-card) 70%, transparent)',
                  border: `1px solid ${active ? `color-mix(in srgb, ${color} 45%, transparent)` : 'var(--border-color)'}`,
                  color: textColor,
                  boxShadow: active ? `0 0 0 3px color-mix(in srgb, ${color} 12%, transparent)` : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.borderColor = `color-mix(in srgb, ${color} 45%, transparent)`;
                    e.currentTarget.style.background = `color-mix(in srgb, ${color} 8%, transparent)`;
                    e.currentTarget.style.color = `color-mix(in srgb, ${color} 65%, var(--text-primary))`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.background = 'color-mix(in srgb, var(--bg-card) 70%, transparent)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                <span>{t('status.' + id)}</span>
                <span
                  className="text-[10px] font-semibold tabular-nums px-1.5 py-px rounded-full"
                  style={{
                    background: active ? `color-mix(in srgb, ${color} 22%, transparent)` : 'color-mix(in srgb, var(--text-muted) 12%, transparent)',
                    color: active ? textColor : 'var(--text-muted)',
                  }}
                >
                  {statusCounts[id]}
                </span>
              </button>
            );
          })}
          </ScrollFadeRow>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in relative z-10">
        {paginatedWords.length === 0 ? (
          <div className="glass-card p-8 text-center col-span-full">
            <p className="text-4xl mb-3 text-secondary">
              <Icon name={showSaved ? 'bookmark' : 'searchAlt'} />
            </p>
            <p className="text-secondary">
              {showSaved ? t('vocab.noSaved') : t('vocab.noResults')}
            </p>
            <p className="text-xs text-muted mt-1">
              {showSaved
                ? t('vocab.noSavedHint')
                : t('vocab.noResultsHint')
              }
            </p>
          </div>
        ) : (
          paginatedWords.map((word, index) => {
            const s = state.wordStatuses[word.id] || 'new';
            const catColor = getCategoryColor(word.category);
            return (
              <div
                key={word.id}
                className="relative glass-card glass-card-hover overflow-hidden animate-slide-up flex flex-col group"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {/* bookmark button */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSavedWord(word.id); }}
                  className={`absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-200 hover:scale-110 ${
                    state.savedWordIds.includes(word.id) ? 'opacity-100' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
                  }`}
                  style={{
                    background: state.savedWordIds.includes(word.id) ? 'color-mix(in srgb, var(--accent-from) 15%, transparent)' : 'transparent',
                  }}
                >
                  <Icon
                    name="bookmark"
                    className="text-sm"
                    style={{
                      color: state.savedWordIds.includes(word.id) ? 'var(--accent-from)' : 'var(--text-muted)',
                    }}
                  />
                </button>

                {/* category stripe */}
                <div className="h-0.5 w-full flex-shrink-0" style={{background: `linear-gradient(90deg, ${catColor}, color-mix(in srgb, ${catColor} 40%, transparent))`}} />

                <div className="flex-1 flex flex-col p-3.5">
                  {/* category label */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-medium tracking-wider uppercase" style={{color: `color-mix(in srgb, ${catColor} 70%, var(--text-secondary))`}}>
                      <Icon name={getSubcategoryIcon(word.subcategory)} className="text-[9px] mr-1" />
                      {getSubcategoryLabel(word, state.language)}
                    </span>
                  </div>

                  {/* character */}
                  <button
                    onClick={() => setPopupWord(word)}
                    className="flex-1 flex items-center justify-center py-2 group"
                  >
                    <span
                      className="font-bold tracking-wide transition-all duration-200 group-hover:scale-105"
                      style={{
                        fontSize: '2rem',
                        lineHeight: 1.2,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {word.chinese}
                    </span>
                  </button>

                  {/* status buttons */}
                  <div className="flex gap-1 mt-auto pt-2.5 border-t border-white/[0.04]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch({ type: 'UPDATE_WORD_STATUS', wordId: word.id, status: s === 'mastered' ? 'new' : 'mastered' });
                      }}
                      className={`flex-1 text-[10px] py-1.5 rounded-md font-medium transition-all duration-200 ${
                        s === 'mastered'
                          ? 'bg-green-100 text-green-800 ring-1 ring-green-400 shadow-sm shadow-green-500/20 dark:bg-green-500/20 dark:text-green-300 dark:ring-green-500/30 dark:shadow-green-500/10'
                          : 'bg-white/[0.03] text-muted hover:bg-green-500/10 hover:text-green-400 hover:ring-1 hover:ring-green-500/20'
                      }`}
                    >
                      {t('vocab.remembered')}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch({ type: 'UPDATE_WORD_STATUS', wordId: word.id, status: s === 'learning' ? 'new' : 'learning' });
                      }}
                      className={`flex-1 text-[10px] py-1.5 rounded-md font-medium transition-all duration-200 ${
                        s === 'learning'
                          ? 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-400 shadow-sm shadow-yellow-500/20 dark:bg-yellow-500/20 dark:text-yellow-300 dark:ring-yellow-500/30 dark:shadow-yellow-500/10'
                          : 'bg-white/[0.03] text-muted hover:bg-yellow-500/10 hover:text-yellow-400 hover:ring-1 hover:ring-yellow-500/20'
                      }`}
                    >
                      {t('vocab.learning')}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch({ type: 'UPDATE_WORD_STATUS', wordId: word.id, status: s === 'reviewing' ? 'new' : 'reviewing' });
                      }}
                      className={`flex-1 text-[10px] py-1.5 rounded-md font-medium transition-all duration-200 ${
                        s === 'reviewing'
                          ? 'bg-red-100 text-red-800 ring-1 ring-red-400 shadow-sm shadow-red-500/20 dark:bg-red-500/20 dark:text-red-300 dark:ring-red-500/30 dark:shadow-red-500/10'
                          : 'bg-white/[0.03] text-muted hover:bg-red-500/10 hover:text-red-400 hover:ring-1 hover:ring-red-500/20'
                      }`}
                    >
                      {t('vocab.reviewing')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {totalPages > 1 && (() => {
        const getPageNumbers = () => {
          if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
          const pages = [1];
          let start = Math.max(2, page - 2);
          let end = Math.min(totalPages - 1, page + 2);
          if (end - start < 4) {
            if (page < totalPages / 2) end = Math.min(totalPages - 1, start + 4);
            else start = Math.max(2, end - 4);
          }
          if (start > 2) pages.push('...');
          for (let i = start; i <= end; i++) pages.push(i);
          if (end < totalPages - 1) pages.push('...');
          pages.push(totalPages);
          return pages;
        };
        const pageNumbers = getPageNumbers();
        const canGoPrev = page > 1;
        const canGoNext = page < totalPages;
        return (
          <div className="glass-card animate-fade-in mt-6 relative z-10 overflow-hidden">
            {/* Desktop: full pagination */}
            <div className="hidden sm:flex items-center justify-between px-3 py-2.5 gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!canGoPrev}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-20 disabled:cursor-default hover:bg-card-hover/50 active:scale-95"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Icon name="chevronLeft" className="text-sm" />
                <span className="hidden md:inline">{t('vocab.pagination.prev')}</span>
              </button>

              <div className="flex items-center gap-0.5">
                {pageNumbers.map((p, i) =>
                  p === '...' ? (
                    <span key={`e-${i}`} className="w-6 h-7 flex items-center justify-center text-xs text-muted select-none tracking-wider">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className="w-7 h-7 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 active:scale-90"
                      style={{
                        background: p === page ? 'var(--accent-gradient)' : 'transparent',
                        color: p === page ? '#fff' : 'var(--text-secondary)',
                        border: p === page ? 'none' : '1px solid var(--border-color)',
                      }}
                      onMouseEnter={(e) => {
                        if (p !== page) {
                          e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent-from) 35%, transparent)';
                          e.currentTarget.style.background = 'color-mix(in srgb, var(--accent-from) 6%, transparent)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (p !== page) {
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={!canGoNext}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-20 disabled:cursor-default hover:bg-card-hover/50 active:scale-95"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span className="hidden md:inline">{t('vocab.pagination.next')}</span>
                <Icon name="chevronRight" className="text-sm" />
              </button>
            </div>

            {/* Mobile: compact slider */}
            <div className="flex sm:hidden items-center justify-center gap-2.5 px-3 py-2.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!canGoPrev}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-20 disabled:cursor-default hover:bg-card-hover/50 active:scale-90"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Icon name="chevronLeft" className="text-lg" />
              </button>

              <div className="flex flex-col items-center gap-1.5 min-w-0">
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-bold tabular-nums" style={{ color: 'var(--accent-from)' }}>{page}</span>
                  <span className="text-xs text-muted/60 mx-0.5">/</span>
                  <span className="text-xs text-muted tabular-nums">{totalPages}</span>
                </div>
                <div className="w-full max-w-[100px] h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-300 ease-out"
                    style={{
                      width: `${(page / totalPages) * 100}%`,
                      background: 'var(--accent-gradient)',
                    }}
                  />
                </div>
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={!canGoNext}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-20 disabled:cursor-default hover:bg-card-hover/50 active:scale-90"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Icon name="chevronRight" className="text-lg" />
              </button>
            </div>

            {/* Info bar */}
            <div className="px-3 pb-2 text-center text-[10px] text-muted/60 tracking-wider">
              {t('vocab.pagination.info', { page, total: totalPages, n: ITEMS_PER_PAGE })}
            </div>
          </div>
        );
      })()}

      {popupWord && createPortal(
        <>
          <div className="fixed bg-black/40 backdrop-blur-lg popup-overlay-enter" style={{top: '-100px', left: '-100px', right: '-100px', bottom: '-100px', zIndex: 100, willChange: 'transform'}} onClick={() => setPopupWord(null)} />
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none"
          >
          <div
            key={popupWord.id}
            className="relative w-full max-w-2xl max-h-[min(85vh,720px)] rounded-2xl border border-white/[0.06] overflow-hidden flex flex-col pointer-events-auto popup-enter"
            style={{
              background: 'linear-gradient(160deg, color-mix(in srgb, var(--bg-card) 95%, var(--accent-from)), var(--bg-primary) 80%)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.35), 0 0 0 1px var(--border-color), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* decorative corner accents */}
            <div className="absolute top-0 left-0 w-16 h-16 pointer-events-none" style={{background: 'linear-gradient(135deg, var(--accent-from) 0%, transparent 60%)', opacity: 0.15, borderRadius: '16px 0 0 0'}} />
            <div className="absolute bottom-0 right-0 w-16 h-16 pointer-events-none" style={{background: 'linear-gradient(315deg, var(--accent-from) 0%, transparent 60%)', opacity: 0.15, borderRadius: '0 0 16px 0'}} />

            {/* close button */}
            <button
              onClick={() => setPopupWord(null)}
              className="absolute top-4 right-5 z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors text-muted hover:text-primary"
            >
              <Icon name="xmark" className="text-lg" />
            </button>

            <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth">
            {/* hero: character centered */}
            <div className="px-8 pt-10 pb-6 text-center">
              <div className="relative inline-flex items-center justify-center">
                <span
                  className="font-bold tracking-wide whitespace-nowrap"
                  style={{
                    fontSize: 'clamp(2rem, 8vw, 4rem)',
                    lineHeight: 1.1,
                    color: 'var(--text-primary)',
                    textShadow: '0 0 50px var(--accent-glow)',
                  }}
                >
                  {popupWord.chinese}
                </span>
                <div className="absolute -right-11 top-1/2 -translate-y-1/2">
                  <SpeakButton text={popupWord.chinese} variant="icon" size="md" />
                </div>
              </div>
              {state.showPinyin && (
                <p className="text-[11px] sm:text-sm text-secondary/80 italic tracking-wide mt-2 whitespace-nowrap">
                  {popupWord.pinyin}
                </p>
              )}
              <p className="text-xs sm:text-base text-primary/90 mt-2 font-medium whitespace-nowrap">
                {meaning(popupWord)}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                {popupWord.category !== 'hsk' && (() => {
                  const subLabel = getSubcategoryLabel(popupWord, state.language);
                  const catColor = getCategoryColor(popupWord.category);
                  return (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap"
                      style={{
                        background: `color-mix(in srgb, ${catColor} 14%, transparent)`,
                        color: `color-mix(in srgb, ${catColor} 70%, var(--text-primary))`,
                        border: `1px solid color-mix(in srgb, ${catColor} 26%, transparent)`,
                      }}
                      title={(() => {
                        const cat = CATEGORIES.find((c) => c.id === popupWord.category);
                        return cat ? (state.language === 'th' ? cat.nameThai : cat.name) : popupWord.category;
                      })()}
                    >
                      <Icon name={getSubcategoryIcon(popupWord.subcategory)} className="text-[10px]" />
                      {subLabel}
                    </span>
                  );
                })()}
                <HskLevelBadge word={popupWord} language={state.language} compact />
                {popupWord.partOfSpeech &&
                  (Array.isArray(popupWord.partOfSpeech)
                    ? popupWord.partOfSpeech.length > 0
                    : Boolean(popupWord.partOfSpeech)) && (
                  <>
                    <span
                      aria-hidden="true"
                      className="w-px h-4"
                      style={{ background: 'var(--border-color)' }}
                    />
                    <div className="flex flex-wrap justify-center gap-1.5" role="list" aria-label={t('vocab.partOfSpeech')}>
                        {(Array.isArray(popupWord.partOfSpeech)
                          ? popupWord.partOfSpeech
                          : [popupWord.partOfSpeech]
                        ).map((part) => {
                          const posColor = POS_META[part] || 'var(--accent-from)';
                          return (
                          <span
                            key={part}
                            role="listitem"
                            className="px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap"
                            title={part}
                            style={{
                              background: `color-mix(in srgb, ${posColor} 15%, transparent)`,
                              color: `color-mix(in srgb, ${posColor} 70%, var(--text-primary))`,
                            }}
                          >
                            {formatPartOfSpeech(part)}
                          </span>
                          );
                        })}
                      </div>
                  </>
                )}
              </div>
            </div>

            {/* body: stroke order + examples */}
            <div className="p-6 sm:p-8">
              <div className={`flex gap-8 ${popupWord.chinese.length >= 4 ? 'flex-col' : 'flex-col lg:flex-row'}`}>
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <StrokeOrder character={popupWord.chinese} size={96} charSize={56} />
                  </div>
                  <p className="text-[11px] text-muted mt-2 flex items-center gap-1">
                    <Icon name="arrow-pointer" className="text-xs" />
                    {t('vocab.clickToReplay')}
                  </p>
                </div>

                <div className="flex-1 min-w-0 space-y-3">
                  <p className="text-xs font-semibold tracking-wider uppercase text-muted flex items-center gap-2">
                    <span className="w-4 h-px" style={{background: 'var(--accent-from)'}} />
                    {t('vocab.exampleSentences')}
                  </p>
                  {(showAllExamples ? popupWord.examples : popupWord.examples.slice(0, 1)).map((ex, i) => (
                    <div
                      key={i}
                      className="rounded-xl p-4 transition-colors hover:bg-white/[0.03]"
                      style={{
                        background: 'color-mix(in srgb, var(--bg-card) 50%, transparent)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] font-mono text-muted mt-1 w-4 flex-shrink-0">{i + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] leading-relaxed text-primary">{ex.chinese}</p>
                          {state.showPinyin && (
                            <p className="text-xs text-secondary/70 italic mt-0.5">{ex.pinyin}</p>
                          )}
                          {meaning(ex) && (
                            <p className="text-xs text-muted mt-1 leading-relaxed">{meaning(ex)}</p>
                          )}
                        </div>
                        <SpeakButton
                          text={ex.chinese}
                          variant="icon"
                          size="sm"
                          className="mt-0.5 flex-shrink-0"
                        />
                      </div>
                    </div>
                  ))}
                  {popupWord.examples.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setShowAllExamples((open) => !open)}
                      aria-expanded={showAllExamples}
                      className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium text-secondary transition-colors hover:text-primary hover:bg-white/[0.04]"
                      style={{ border: '1px solid var(--border-color)' }}
                    >
                      <span>{t(showAllExamples ? 'vocab.showLessExamples' : 'vocab.showMoreExamples')}</span>
                      <Icon
                        name="chevronDown"
                        className={`text-[10px] transition-transform duration-200 ${showAllExamples ? 'rotate-180' : ''}`}
                      />
                    </button>
                  )}
                </div>
              </div>
            </div>
            </div>
          </div>
          </div>
        </>
      , document.body)}
    </div>
  );
}
