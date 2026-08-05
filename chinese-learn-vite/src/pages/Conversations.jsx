import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import Icon from '../components/Icon';
import InkParticles from '../components/InkParticles';
import useTranslation from '../hooks/useTranslation';
import { CONVERSATIONS } from '../data/conversations';
import { ConversationPopup, CONV_STATUS_CONFIG } from '../components/ConversationPopup';
import { CATEGORIES, getSubcategoryIcon, getCategoryColor } from '../data/categories';

const CONV_INK_CHARS = ['對', '話', '聊', '天', '語', '音', '句', '詞', '場', '景'];

// ── Scroll fade row ──────────────────────────────────────────────────
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

/* ──────────────────────────────────────────────────────────────────── */
/* MAIN PAGE                                                            */
/* ──────────────────────────────────────────────────────────────────── */
export default function Conversations() {
  const { t, lang } = useTranslation();
  const { state, toggleSavedConv, updateConvStatus } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showSaved, setShowSaved] = useState(false);
  const [popupConv, setPopupConv] = useState(null);

  // Responsive pagination
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  );
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  const ITEMS_PER_PAGE = isMobile ? 6 : 12;
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [selectedCategory, searchTerm, showSaved, isMobile]);

  // Scroll back to the top whenever the page changes, so the user doesn't stay at the bottom
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  // Filter + shuffle
  const filteredConvs = useMemo(() => {
    let list = CONVERSATIONS;

    // Show only saved
    if (showSaved) {
      list = list.filter(c => state.savedConvIds.includes(c.id));
    } else if (selectedCategory !== 'all') {
      list = list.filter(c => c.category === selectedCategory);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.titleThai.includes(q) ||
        c.lines.some(line =>
          line.chinese.includes(q) || line.pinyin.toLowerCase().includes(q) ||
          line.meaning.toLowerCase().includes(q) || line.meaningThai.includes(q)
        )
      );
    }
    // Fisher-Yates shuffle
    const shuffled = [...list];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [selectedCategory, searchTerm, showSaved, state.savedConvIds]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredConvs.length / ITEMS_PER_PAGE)), [filteredConvs, ITEMS_PER_PAGE]);
  const paginatedConvs = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredConvs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredConvs, page, ITEMS_PER_PAGE]);

  const closePopup = useCallback(() => setPopupConv(null), []);

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

  return (
    <div className="space-y-6 relative">
      <InkParticles chars={CONV_INK_CHARS} paused={popupConv !== null} />

      <div className="animate-slide-up relative z-10">
        <h1 className="text-3xl lg:text-4xl font-bold">
          <span className="gradient-text"><Icon name="messageDetail" /> {t('conv.title')}</span>
        </h1>
        <p className="text-secondary mt-1">{t('conv.subtitle')}</p>
      </div>

      {/* Search + Category filter + Saved toggle */}
      <div className="glass-card p-4 animate-slide-up relative z-10">
        <div className="relative mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('conv.searchPlaceholder')}
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

        <ScrollFadeRow className="md:flex-wrap md:overflow-visible">
          <button
            onClick={() => { setSelectedCategory('all'); setShowSaved(false); }}
            className={`chip text-xs snap-start shrink-0 ${selectedCategory === 'all' && !showSaved ? 'active' : ''}`}
          >
            {t('conv.allCategories')}
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id); setShowSaved(false); }}
              className={`chip text-xs snap-start shrink-0 ${selectedCategory === cat.id && !showSaved ? 'active' : ''}`}
            >
              <Icon name={cat.icon} className="text-[10px] mr-1" />
              {lang === 'th' ? cat.nameThai : cat.name}
            </button>
          ))}
          <button
            onClick={() => { setShowSaved(true); setSelectedCategory('all'); }}
            className={`chip text-xs snap-start shrink-0 flex items-center gap-1 ${showSaved ? 'active' : ''}`}
          >
            <Icon name="bookmark" className="text-[10px]" />
            <span>{state.savedConvIds.length > 0 ? `${t('conv.saved')} (${state.savedConvIds.length})` : t('conv.saved')}</span>
          </button>
        </ScrollFadeRow>
      </div>

      {/* Cards */}
      {filteredConvs.length === 0 ? (
        <div className="glass-card p-12 text-center animate-fade-in relative z-10">
          <p className="text-4xl mb-3 text-secondary"><Icon name="messageDetail" /></p>
          <p className="text-secondary">{showSaved ? t('conv.noSaved') : t('conv.noResults')}</p>
          <p className="text-xs text-muted mt-1">{showSaved ? t('conv.noSavedHint') : t('conv.adjustFilters')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in relative z-10">
          {paginatedConvs.map((conv, index) => {
            const catColor = getCategoryColor(conv.category);
            const isSaved = state.savedConvIds.includes(conv.id);
            const convStatus = state.convStatuses[conv.id] || 'new';
            const statusCfg = CONV_STATUS_CONFIG[convStatus];
            const statusLabel = lang === 'th' ? statusCfg.labelTh : statusCfg.labelEn;
            return (
              <article
                key={conv.id}
                onClick={() => setPopupConv(conv)}
                className="relative rounded-xl flex flex-col group/card transition-all duration-300 overflow-hidden cursor-pointer"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.025) inset, 0 2px 10px rgba(0,0,0,0.025)',
                  animationDelay: `${index * 30}ms`,
                  animation: 'slide-up 0.4s ease-out backwards',
                }}
              >
                {/* Accent stripe */}
                <div
                  className="h-0.5 w-full flex-shrink-0"
                  style={{ background: `linear-gradient(90deg, ${catColor}, color-mix(in srgb, ${catColor} 40%, transparent))` }}
                  aria-hidden
                />

                {/* Bookmark button */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSavedConv(conv.id); }}
                  className={`absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-200 hover:scale-110 ${
                    isSaved ? 'opacity-100' : 'opacity-0 group-hover/card:opacity-100'
                  }`}
                  style={{
                    background: isSaved ? `color-mix(in srgb, var(--accent-from) 15%, transparent)` : 'transparent',
                  }}
                >
                  <Icon
                    name="bookmark"
                    className="text-sm"
                    style={{ color: isSaved ? 'var(--accent-from)' : 'var(--text-muted)' }}
                  />
                </button>

                {/* Category badge */}
                <div className="px-5 pt-4 pb-0 pr-14">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase"
                    style={{ background: `color-mix(in srgb, ${catColor} 12%, transparent)`, color: catColor }}
                  >
                    <Icon name={getSubcategoryIcon(conv.subcategory)} className="text-[9px]" />
                    {lang === 'th' ? conv.subcategory : conv.subcategory}
                  </span>
                </div>

                {/* Title */}
                <button
                  onClick={() => setPopupConv(conv)}
                  className="block w-full px-5 pt-2.5 pb-3 group/word focus:outline-none"
                >
                  <p className="font-semibold text-primary leading-snug" style={{ fontSize: '1.1rem' }}>
                    {lang === 'th' ? conv.titleThai : conv.title}
                  </p>
                  <p className="text-xs text-secondary/80 mt-0.5">
                    {lang === 'th' ? conv.title : conv.titleThai}
                  </p>
                </button>

                {/* Bottom row: setting (left) + status badge (right) */}
                <div className="px-5 pb-4 mt-auto flex items-end justify-between gap-2">
                  <p className="text-[11px] text-muted/60 leading-snug line-clamp-2 flex-1 min-w-0">
                    {t('conv.setting')} {lang === 'th' ? conv.settingThai : conv.setting}
                  </p>
                  {convStatus !== 'new' && (
                    <span
                      className="shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                      style={{ background: statusCfg.bg, color: statusCfg.color }}
                    >
                      {statusLabel}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="glass-card animate-fade-in mt-6 relative z-10 overflow-hidden">
          <div className="hidden sm:flex items-center justify-between px-3 py-2.5 gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-20 disabled:cursor-default hover:bg-card-hover/50 active:scale-95"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Icon name="chevronLeft" className="text-sm" />
              <span className="hidden md:inline">{t('conv.pagination.prev')}</span>
            </button>

            <div className="flex items-center gap-0.5">
              {getPageNumbers().map((p, i) =>
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
              disabled={page === totalPages}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-20 disabled:cursor-default hover:bg-card-hover/50 active:scale-95"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span className="hidden md:inline">{t('conv.pagination.next')}</span>
              <Icon name="chevronRight" className="text-sm" />
            </button>
          </div>

          {/* Mobile */}
          <div className="flex sm:hidden items-center justify-center gap-2.5 px-3 py-2.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
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
                  style={{ width: `${(page / totalPages) * 100}%`, background: 'var(--accent-gradient)' }}
                />
              </div>
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-20 disabled:cursor-default hover:bg-card-hover/50 active:scale-90"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Icon name="chevronRight" className="text-lg" />
            </button>
          </div>

          <div className="px-3 pb-2 text-center text-[10px] text-muted/60 tracking-wider">
            {t('conv.pagination.info', { page, total: totalPages, n: ITEMS_PER_PAGE })}
          </div>
        </div>
      )}

      {/* Popup */}
      {popupConv && (
        <ConversationPopup conv={popupConv} onClose={closePopup} />
      )}
    </div>
  );
}
