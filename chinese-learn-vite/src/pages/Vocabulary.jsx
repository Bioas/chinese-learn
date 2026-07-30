import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import SpeakButton from '../components/SpeakButton';
import Icon from '../components/Icon';
import StrokeOrder from '../components/StrokeOrder';
import useTranslation from '../hooks/useTranslation';
import InkParticles from '../components/InkParticles';
import { VOCABULARY } from '../data/vocabulary';
import { CATEGORIES, getSubcategoryIcon } from '../data/categories';

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

export default function Vocabulary() {
  const { t, meaning } = useTranslation();
  const { state, dispatch, togglePinned, studyWord, toggleSavedWord } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('hsk');
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [popupWord, setPopupWord] = useState(null);
  const [page, setPage] = useState(1);
  // Bump this counter to force the filtered-words memo to re-shuffle on demand (manual reshuffle button).
  const [shuffleKey, setShuffleKey] = useState(0);
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

  useEffect(() => { setPage(1); }, [selectedSubcategories, selectedStatuses, showSaved, isMobile]);

  const currentCategory = useMemo(
    () => CATEGORIES.find(c => c.id === selectedCategory),
    [selectedCategory]
  );

  // Layer 1: filter by *intent only* (category + subcategory + dedupe) — no state-driven filters here
  // so bookmark/status toggles won't re-shuffle the deck below.
  const intentWords = useMemo(() => {
    let words = VOCABULARY;
    if (!showSaved && selectedSubcategories.length === 0 && currentCategory) {
      // No subcategory selected → show ALL words from the current category
      const subIds = currentCategory.subcategories.map(s => s.id);
      words = words.filter(w => subIds.includes(w.subcategory));
    }
    if (selectedSubcategories.length > 0) {
      words = words.filter(w => selectedSubcategories.includes(w.subcategory));
    }
    // Deduplicate by Chinese text — the vocabulary has the same `chinese`
    // word across multiple HSK levels with different IDs (e.g. 可能 as hsk2-054,
    // hsk3-109, hsk4-069). Without this, the grid would show the same card
    // multiple times for one logical word.
    const seenVocabChinese = new Set();
    words = words.filter(w => {
      if (seenVocabChinese.has(w.chinese)) return false;
      seenVocabChinese.add(w.chinese);
      return true;
    });
    return words;
  }, [showSaved, selectedSubcategories, currentCategory]);

  // Layer 2: shuffle — re-shuffles ONLY when filter-intent (category/subcategory/showSaved flag) changes,
  // or when user explicitly clicks the Shuffle button. Bookmark + status toggles do NOT re-shuffle.
  const shuffledIntent = useMemo(() => {
    return shuffleArray(intentWords);
  }, [intentWords, shuffleKey]);

  // Layer 3: apply state-dependent filters ON TOP of the stable shuffled order (showSaved + status).
  const filteredWords = useMemo(() => {
    let words = shuffledIntent;
    if (showSaved) {
      words = words.filter(w => state.savedWordIds.includes(w.id));
    }
    if (selectedStatuses.length > 0) {
      words = words.filter(w => {
        const status = state.wordStatuses[w.id] || 'new';
        return selectedStatuses.includes(status);
      });
    }
    return words;
  }, [shuffledIntent, showSaved, selectedStatuses, state.wordStatuses, state.savedWordIds]);

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

      <div className="w-full md:w-fit relative z-10 animate-slide-up">
        <ScrollFadeRow className="md:flex-wrap md:overflow-visible">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSelectedSubcategories([]);
                setShowSaved(false);
              }}
              className={`chip flex items-center gap-1.5 snap-start shrink-0 ${selectedCategory === cat.id && !showSaved ? 'active' : ''}`}
            >
              <Icon name={cat.icon} />
              <span>{state.language === 'th' ? cat.nameThai : cat.name}</span>
            </button>
          ))}
          <button
            onClick={() => {
              setShowSaved(true);
              setSelectedSubcategories([]);
            }}
            className={`chip flex items-center gap-1.5 snap-start shrink-0 ${showSaved ? 'active' : ''}`}
          >
            <Icon name="bookmark" />
            <span>{t('vocab.saved')}</span>
          </button>
        </ScrollFadeRow>

      </div>

      {!showSaved && currentCategory && (
        <div className="flex flex-wrap gap-2 animate-fade-in relative z-10">
          {currentCategory.subcategories.map(sub => {
            const isPinned = state.pinnedSubcategories.includes(sub.id);
            return (
              <div key={sub.id} className="relative group">
                <button
                  onClick={() => toggleSubcategory(sub.id)}
                  onDoubleClick={() => togglePinned(sub.id)}
                  className={`chip flex items-center gap-1.5 ${
                    selectedSubcategories.includes(sub.id) ? 'active' : ''
                  } ${isPinned ? 'pinned' : ''}`}
                  title={isPinned ? t('vocab.doubleClickUnpin') : t('vocab.doubleClickPin')}
                >
                  <Icon name={sub.icon} />
                  <span>{state.language === 'th' ? sub.nameThai : sub.name}</span>
                  {isPinned && <Icon name="pin" className="text-[10px] text-pink-400" />}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="glass-card p-4 animate-fade-in relative z-10">
        <div className="flex md:flex-nowrap flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-sm text-secondary shrink-0">{t('vocab.filterByStatus')}</span>
          <ScrollFadeRow className="md:overflow-visible">
            {['new', 'learning', 'reviewing', 'mastered'].map(status => (
              <button
                key={status}
                onClick={() => toggleStatus(status)}
                className={`chip text-xs snap-start shrink-0 ${selectedStatuses.includes(status) ? 'active' : ''}`}
              >
                {t('status.' + status)}
              </button>
            ))}
          </ScrollFadeRow>
          {/* Reshuffle button — re-randomizes order of currently-filtered vocab */}
          <button
            onClick={() => setShuffleKey(k => k + 1)}
            className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted hover:text-primary hover:bg-white/[0.04] transition-colors shrink-0"
            title={state.language === 'th' ? 'สุ่มลำดับคำศัพท์ใหม่' : 'Reshuffle order'}
          >
            <Icon name="shuffle" className="text-sm" />
            <span className="hidden md:inline">{state.language === 'th' ? 'สุ่มใหม่' : 'Shuffle'}</span>
          </button>
        </div>
        <span className="absolute top-4 right-4 text-[10px] text-muted tracking-wider">
          {t('vocab.wordCount', { n: filteredWords.length })}
        </span>
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
            const catColor = word.category === 'hsk' ? 'var(--accent-from)' : word.category === 'daily' ? 'var(--accent-to)' : word.category === 'health' ? '#f43f5e' : word.category === 'education' ? '#8b5cf6' : word.category === 'technology' ? '#06b6d4' : word.category === 'business' ? '#eab308' : word.category === 'nature' ? '#22c55e' : 'var(--text-muted)';
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
                      {word.subcategory}
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
              <div className="flex items-center justify-center gap-2 mt-3">
                <span className="text-[11px] px-3 py-1 rounded-full" style={{background: 'color-mix(in srgb, var(--accent-from) 15%, transparent)', color: 'var(--accent-from)'}}>
                  {popupWord.hskLevel > 0 ? `HSK ${popupWord.hskLevel}` : popupWord.subcategory}
                </span>
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
                  {popupWord.examples.map((ex, i) => (
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
