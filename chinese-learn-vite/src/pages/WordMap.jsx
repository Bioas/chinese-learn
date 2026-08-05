import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import SpeakButton from '../components/SpeakButton';
import Icon from '../components/Icon';
import InkParticles from '../components/InkParticles';
import useTranslation from '../hooks/useTranslation';
import useWordMap from '../hooks/useWordMap';
import { VOCABULARY } from '../data/vocabulary';
import { CATEGORIES, getSubcategoryIcon, getCategoryColor } from '../data/categories';
import HskLevelBadge from '../components/HskLevelBadge';

const WORDMAP_INK_CHARS = ['網', '絡', '連', '繫', '字', '詞', '關', '聯', '圖', '譜'];


// Localized subcategory label e.g. "Food & Drink" (en) / "อาหารและเครื่องดื่ม" (th).
// Falls back to the raw subcategory id (e.g. "hsk5") if the subcategory is unknown.
function getSubcategoryLabel(word, language) {
  const cat = CATEGORIES.find((c) => c.id === word?.category);
  const sub = cat?.subcategories.find((s) => s.id === word?.subcategory);
  return sub ? (language === 'th' ? sub.nameThai : sub.name) : word?.subcategory || '';
}

export default function WordMap() {
  const { t, meaning } = useTranslation();
  const { state, toggleSavedWord } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [popupWord, setPopupWord] = useState(null);

  // Pagination state (50 cards per page, mirror Vocabulary page)
  // Responsive pagination: 10 cards on mobile (< 768px), 50 cards on desktop
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  );
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = isMobile ? 10 : 50;
  // Reset to page 1 when filter inputs or breakpoint change
  useEffect(() => { setPage(1); }, [selectedCategory, selectedSubcategories, searchTerm, isMobile]);

  // Scroll back to the top whenever the page changes, so the user doesn't stay at the bottom
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  const currentCategory = useMemo(
    () => CATEGORIES.find(c => c.id === selectedCategory),
    [selectedCategory]
  );

  const { clusters, totalCount } = useWordMap({
    searchTerm,
    selectedCategory,
    selectedSubcategories,
  });

  // Pagination computed values
  const totalPages = useMemo(() => Math.max(1, Math.ceil(clusters.length / ITEMS_PER_PAGE)), [clusters, ITEMS_PER_PAGE]);
  const paginatedClusters = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return clusters.slice(start, start + ITEMS_PER_PAGE);
  }, [clusters, page, ITEMS_PER_PAGE]);

  const closePopup = useCallback(() => setPopupWord(null), []);

  // Mobile filter horizontal-scroll tracking for edge fade hints
  const filterScrollRef = useRef(null);
  const [filterScrolled, setFilterScrolled] = useState({ left: false, right: false });
  const updateFilterScroll = useCallback(() => {
    const el = filterScrollRef.current;
    if (!el) return;
    setFilterScrolled({
      left: el.scrollLeft > 8,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 8,
    });
  }, []);
  useEffect(() => {
    updateFilterScroll();
    const handleResize = () => updateFilterScroll();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateFilterScroll]);

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

        <div className="relative min-w-0 mb-2">
          {/* Mobile: horizontal scroll with snap + fade hints / Desktop (md+): flex-wrap fallback so all 9 chips fit comfortably */}
          <div
            ref={filterScrollRef}
            onScroll={updateFilterScroll}
            className="flex gap-1.5 overflow-x-auto scrollbar-none snap-x snap-proximity md:flex-wrap md:overflow-visible"
          >
            <button
              onClick={() => { setSelectedCategory('all'); setSelectedSubcategories([]); }}
              className={`chip text-xs snap-start shrink-0 ${selectedCategory === 'all' && selectedSubcategories.length === 0 && !searchTerm ? 'active' : ''}`}
            >
              {t('wordmap.allCategories')}
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.id); setSelectedSubcategories([]); }}
                className={`chip text-xs snap-start shrink-0 ${selectedCategory === cat.id && selectedSubcategories.length === 0 ? 'active' : ''}`}
              >
                <Icon name={cat.icon} className="text-[10px] mr-1" />
                {state.language === 'th' ? cat.nameThai : cat.name}
              </button>
            ))}
          </div>
          {/* Edge fade hints — only show mid-scroll on mobile to imply more content */}
          <div
            className={`absolute left-0 top-0 bottom-0 w-10 pointer-events-none bg-gradient-to-r from-[var(--bg-primary)] to-transparent transition-opacity duration-200 md:hidden ${
              filterScrolled.left ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden
          />
          <div
            className={`absolute right-0 top-0 bottom-0 w-10 pointer-events-none bg-gradient-to-l from-[var(--bg-primary)] to-transparent transition-opacity duration-200 md:hidden ${
              filterScrolled.right ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden
          />
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
            ? t('wordmap.wordCount', { n: totalCount, shown: paginatedClusters.length, page, total: totalPages })
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
          {paginatedClusters.map(({ word, clusters: wordClusters }) => {
            const catColor = getCategoryColor(word.category);
            return (
              // Editorial card enriched — calm magazine layout + vocab-style accent stripe / subcategory eyebrow / prominent bookmark
              <article
                key={word.id}
                onClick={() => setPopupWord(word)}
                className="relative rounded-xl flex flex-col group/card transition-all duration-300 overflow-hidden cursor-pointer"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.025) inset, 0 2px 10px rgba(0,0,0,0.025)',
                }}
              >
                {/* Top accent stripe — same pattern as Vocabulary card (h-0.5 + 90deg catColor → 40% mix) */}
                <div
                  className="h-0.5 w-full flex-shrink-0"
                  style={{ background: `linear-gradient(90deg, ${catColor}, color-mix(in srgb, ${catColor} 40%, transparent))` }}
                  aria-hidden
                />

                {/* Top bar: subcategory eyebrow LEFT + Issue № + bookmark RIGHT */}
                <div className="flex items-center justify-between px-5 pt-4">
                  {/* Subcategory eyebrow — vocab-style identity (icon + caps tracked label in catColor) */}
                  <span
                    className="text-[9px] uppercase tracking-[0.2em] font-bold flex items-center gap-1.5"
                    style={{ color: catColor }}
                  >
                    <Icon name={getSubcategoryIcon(word.subcategory)} className="text-[9px] opacity-80" />
                    {getSubcategoryLabel(word, state.language)}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Bookmark — now matches Vocabulary card prominence: scale on hover, bg-tint when saved, hidden until group-hover on desktop */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSavedWord(word.id); }}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-200 hover:scale-110 ${
                        state.savedWordIds.includes(word.id) ? '' : 'opacity-60 md:opacity-0 md:group-hover/card:opacity-80'
                      }`}
                      style={{
                        background: state.savedWordIds.includes(word.id) ? `color-mix(in srgb, ${catColor} 15%, transparent)` : 'transparent',
                      }}
                      title={state.savedWordIds.includes(word.id) ? t('wordmap.unsave') : t('wordmap.save')}
                      aria-label={state.savedWordIds.includes(word.id) ? t('wordmap.unsave') : t('wordmap.save')}
                    >
                      <Icon
                        name="bookmark"
                        className="text-[14px] transition-all duration-200"
                        style={{
                          color: state.savedWordIds.includes(word.id) ? catColor : 'var(--text-muted)',
                          fill: state.savedWordIds.includes(word.id) ? catColor : 'transparent',
                        }}
                      />
                    </button>
                  </div>
                </div>

                {/* Hero — character on whitespace, serif weight for editorial gravitas */}
                <button
                  onClick={() => setPopupWord(word)}
                  className="block w-full px-5 pt-1 pb-2 group/word focus:outline-none"
                >
                  <span
                    className="block text-center font-bold transition-colors duration-300 group-hover/word:text-[var(--accent-from)]"
                    style={{
                      fontSize: '3.25rem',
                      lineHeight: 1.05,
                      color: 'var(--text-primary)',
                      fontFamily: "'Noto Sans SC', serif",
                    }}
                  >
                    {word.chinese}
                  </span>
                </button>

                {/* Bilingual metadata — editorial label-prefix pattern */}
                <div className="px-5 pt-3 pb-5 space-y-1.5">
                  {/* Pinyin always shown on the map card — the showPinyin toggle
                      is a test-mode preference for Flashcards/Quiz only and has
                      no visible control on this page (same fix as Vocabulary). */}
                  <p className="flex items-baseline gap-2.5">
                    <span className="text-[9px] uppercase tracking-[0.18em] font-semibold text-muted/70 shrink-0" style={{ minWidth: '54px' }}>
                      Pinyin
                    </span>
                    <span className="text-[12px] italic tracking-[0.04em] text-secondary/85 leading-snug">
                      {word.pinyin}
                    </span>
                  </p>
                  <p className="flex items-baseline gap-2.5">
                    <span className="text-[9px] uppercase tracking-[0.18em] font-semibold text-muted/70 shrink-0" style={{ minWidth: '54px' }}>
                      {state.language === 'th' ? 'แปลว่า' : 'Meaning'}
                    </span>
                    <span className="text-[12.5px] text-primary/90 leading-snug">
                      {meaning(word)}
                    </span>
                  </p>
                </div>

                {/* Hairline */}
                <div className="mx-5 border-t" style={{ borderColor: 'var(--border-color)' }} />

                {/* Connections — editorial column with leader lines */}
                {wordClusters.length > 0 ? (
                  <div className="px-5 pt-4 pb-5 flex-1">
                    <p className="text-[9px] uppercase tracking-[0.2em] font-semibold text-muted/70 mb-3">
                      {t('wordmap.connectedBy')}
                    </p>
                    <div className="space-y-2">
                      {wordClusters.map(({ char, related }) => (
                        <div key={char} className="flex items-baseline gap-2">
                          {/* Shared char — serif, accent colour */}
                          <span
                            className="font-bold leading-tight"
                            style={{
                              color: catColor,
                              fontFamily: "'Noto Sans SC', serif",
                              fontSize: '1.15rem',
                            }}
                          >
                            {char}
                          </span>
                          <span className="text-[10px] text-muted/60 font-mono tabular-nums">
                            ·{related.length}
                          </span>
                          {/* Hairline leader (TOC pattern) */}
                          <span
                            className="grow self-center mx-1"
                            style={{
                              borderBottom: '1px dotted var(--border-color)',
                              height: '1px',
                            }}
                            aria-hidden
                          />
                          {/* Inline list of related words */}
                          <span className="text-[11.5px] text-primary/85 leading-snug">
                            {related.slice(0, 3).map((v, i) => (
                              <React.Fragment key={v.id}>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setPopupWord(v); }}
                                  className="hover:text-[var(--accent-from)] transition-colors duration-150 focus:outline-none"
                                  title={`${v.chinese} — ${meaning(v)}`}
                                >
                                  {v.chinese}
                                </button>
                                {i < Math.min(2, related.length - 1) && (
                                  <span className="text-muted/40 mx-1.5">·</span>
                                )}
                              </React.Fragment>
                            ))}
                            {related.length > 3 && (
                              <span className="text-muted/60 text-[10px] ml-1.5 font-mono">
                                +{related.length - 3}
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center px-5 py-6">
                    <p className="text-[11px] text-muted/50 italic">{t('wordmap.noConnections')}</p>
                  </div>
                )}

              </article>
            );
          })}
        </div>
      )}

      {/* Pagination UI (mirror Vocabulary.jsx pattern, 50 cards per page) */}
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
                <span className="hidden md:inline">{t('wordmap.pagination.prev')}</span>
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
                <span className="hidden md:inline">{t('wordmap.pagination.next')}</span>
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
              {t('wordmap.pagination.info', { page, total: totalPages, n: ITEMS_PER_PAGE })}
            </div>
          </div>
        );
      })()}

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
              className="relative w-full max-w-xl max-h-[min(82vh,620px)] rounded-2xl border border-white/[0.06] overflow-hidden flex flex-col pointer-events-auto popup-enter"
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

              <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth p-7 sm:p-10">
                <div className="text-center mb-6">
                  <div className="relative inline-flex items-center justify-center">
                    <span className="font-bold tracking-wide"
                      style={{ fontSize: '4rem', lineHeight: 1.05, color: 'var(--text-primary)', textShadow: '0 0 40px var(--accent-glow)' }}
                    >
                      {popupWord.chinese}
                    </span>
                    <div className="absolute -right-11 top-1/2 -translate-y-1/2">
                      <SpeakButton text={popupWord.chinese} variant="icon" size="md" />
                    </div>
                  </div>
                  {/* Pinyin always shown in the popup — same rationale as Vocabulary. */}
                  <p className="text-sm text-secondary/80 italic tracking-wide mt-2">{popupWord.pinyin}</p>
                  <p className="text-base text-primary/90 mt-2 font-medium">{meaning(popupWord)}</p>

                  <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                    {popupWord.category !== 'hsk' && (() => {
                      const catColor = getCategoryColor(popupWord.category);
                      return (
                        <span
                          className="text-[11px] px-3 py-1 rounded-full"
                          style={{
                            background: `color-mix(in srgb, ${catColor} 15%, transparent)`,
                            color: `color-mix(in srgb, ${catColor} 70%, var(--text-primary))`,
                            border: `1px solid color-mix(in srgb, ${catColor} 26%, transparent)`,
                          }}
                        >
                          <Icon name={getSubcategoryIcon(popupWord.subcategory)} className="text-[9px] mr-1" />
                          {getSubcategoryLabel(popupWord, state.language)}
                        </span>
                      );
                    })()}
                    <HskLevelBadge word={popupWord} language={state.language} compact />
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
                        {t('wordmap.shared')} <span className="text-2xl font-bold text-primary" style={{ fontFamily: "'Noto Sans SC', serif", lineHeight: 1 }}>{ch}</span>
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
