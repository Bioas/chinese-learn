import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import Icon from '../components/Icon';
import InkParticles from '../components/InkParticles';
import useTranslation from '../hooks/useTranslation';
import { CONVERSATIONS } from '../data/conversations';
import { VOCABULARY, CATEGORIES, getSubcategoryIcon } from '../data/vocabulary';

const CONV_INK_CHARS = ['對', '話', '聊', '天', '語', '音', '句', '詞', '場', '景'];

const CATEGORY_COLORS = {
  hsk: '#f97316', daily: '#e11d48', topics: '#8b5cf6',
  health: '#f43f5e', education: '#8b5cf6', technology: '#06b6d4',
  business: '#eab308', nature: '#22c55e',
};

function getCatColor(catId) {
  return CATEGORY_COLORS[catId] || '#a89488';
}

// Speaker palette
const SPEAKER_COLORS = {
  A: { primary: 'var(--accent-from)', secondary: '#f59e0b' },
  B: { primary: '#f59e0b', secondary: 'var(--accent-from)' },
};

// ── Module-level vocabulary lookup (built once) ─────────────────────
const VOCAB_LOOKUP = new Map();
for (const w of VOCABULARY) {
  if (!VOCAB_LOOKUP.has(w.chinese)) {
    VOCAB_LOOKUP.set(w.chinese, { pinyin: w.pinyin, meaning: w.meaning, meaningThai: w.meaningThai });
  }
}
// Sorted longest-first for longest-match behaviour
const VOCAB_WORDS_SORTED = [...VOCAB_LOOKUP.keys()].sort((a, b) => b.length - a.length);

function findVocabInText(text) {
  if (!text) return [];
  const matches = [];
  let i = 0;
  while (i < text.length) {
    let matched = false;
    for (const word of VOCAB_WORDS_SORTED) {
      if (text.startsWith(word, i)) {
        const info = VOCAB_LOOKUP.get(word);
        matches.push({ word, start: i, end: i + word.length, ...info });
        i += word.length;
        matched = true;
        break;
      }
    }
    if (!matched) i++;
  }
  return matches;
}

// ── Render Chinese text with clickable vocab words (popover managed by parent) ──
function VocabRichText({ text, onVocabClick }) {
  if (!text) return null;
  const matches = findVocabInText(text);
  if (matches.length === 0) return <span>{text}</span>;

  const parts = [];
  let cursor = 0;

  for (const m of matches) {
    if (m.start > cursor) {
      parts.push(<span key={`t-${cursor}`}>{text.slice(cursor, m.start)}</span>);
    }

    parts.push(
      <span key={`v-${m.start}`} className="relative inline-flex items-center mx-[1px]">
        <button
          data-vocab-btn
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            onVocabClick(m.word, m.pinyin, m.start, m.meaning, m.meaningThai, rect);
          }}
          className="font-medium cursor-pointer border-b-[2px] border-solid leading-tight hover:brightness-125 transition-all duration-150 text-left"
          style={{
            color: 'var(--text-primary)',
            borderColor: `color-mix(in srgb, var(--accent-from) 55%, transparent)`,
          }}
        >
          {m.word}
        </button>
      </span>
    );

    cursor = m.end;
  }

  if (cursor < text.length) {
    parts.push(<span key={`t-${cursor}`}>{text.slice(cursor)}</span>);
  }

  return <span>{parts}</span>;
}

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
/* STATUS config for conversations                                     */
/* ──────────────────────────────────────────────────────────────────── */
const CONV_STATUS_CONFIG = {
  new:        { labelEn: 'New',        labelTh: 'ใหม่',      color: '#6b6358',  bg: 'color-mix(in srgb, #6b6358 12%, transparent)' },
  in_progress: { labelEn: 'In Progress', labelTh: 'กำลังเรียน', color: '#fbbf24',  bg: 'color-mix(in srgb, #fbbf24 12%, transparent)' },
  completed:  { labelEn: 'Completed',  labelTh: 'เรียนแล้ว',   color: '#22c55e', bg: 'color-mix(in srgb, #22c55e 12%, transparent)' },
};

/* ──────────────────────────────────────────────────────────────────── */
/* MAIN PAGE                                                            */
/* ──────────────────────────────────────────────────────────────────── */
export default function Conversations() {
  const { t, meaning, lang } = useTranslation();
  const { state, dispatch, toggleSavedConv, updateConvStatus } = useApp();

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
            const catColor = getCatColor(conv.category);
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

/* ────────────────────────────────────────────────────────────────── */
/* LineCard — single dialogue line, memoised                          */
/* ────────────────────────────────────────────────────────────────── */
const LineCard = React.memo(function LineCard({
  line, idx, isActive, onPlay, lineMeaning, linePinyin,
  transcriptMode, rolePlayHidden, onRevealLine, hiddenLines,
  tapToRevealLabel, onVocabClick,
}) {
  const speakerColor = SPEAKER_COLORS[line.role]?.primary || 'var(--text-secondary)';
  const isRoleHidden = rolePlayHidden && line.role === rolePlayHidden;
  const isRevealed = hiddenLines?.has?.(idx);

  const showContent = !isRoleHidden || isRevealed;

  return (
    <div
      data-line-idx={idx}
      className={`relative rounded-xl border transition-all duration-200 ${
        isActive ? 'ring-2 ring-offset-1' : ''
      } ${isRoleHidden && !isRevealed ? 'select-none' : ''}`}
      style={{
        padding: '14px 16px',
        background: isActive
          ? `color-mix(in srgb, ${speakerColor} 8%, var(--bg-card))`
          : 'var(--bg-card)',
        borderColor: isActive
          ? `color-mix(in srgb, ${speakerColor} 40%, transparent)`
          : 'color-mix(in srgb, var(--text-muted) 15%, transparent)',
        '--tw-ring-color': isActive
          ? `color-mix(in srgb, ${speakerColor} 50%, transparent)`
          : 'transparent',
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span
          className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold text-white"
          style={{ background: speakerColor }}
        >
          {line.role}
        </span>
        {showContent && (
          <button
            onClick={() => onPlay(idx)}
            className="shrink-0 w-7 h-7 rounded-full inline-flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90"
            style={{
              background: isActive
                ? `color-mix(in srgb, ${speakerColor} 15%, transparent)`
                : 'transparent',
              color: isActive ? speakerColor : 'var(--text-muted)',
              border: `1px solid ${isActive ? `color-mix(in srgb, ${speakerColor} 40%, transparent)` : 'var(--border-color)'}`,
            }}
          >
            {isActive ? (
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
            ) : (
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>
        )}
      </div>

      {showContent ? (
        <>
          <p className="text-base leading-relaxed text-primary font-medium">
            <VocabRichText text={line.chinese} onVocabClick={onVocabClick} />
          </p>
          {!transcriptMode && (
            <p className="text-xs text-secondary/80 italic mt-1 leading-snug">
              {linePinyin || line.pinyin}
            </p>
          )}
          {!transcriptMode && lineMeaning && (
            <p className="text-xs text-muted/70 mt-1 leading-snug">
              {lineMeaning}
            </p>
          )}
        </>
      ) : (
        /* Role-play: hidden speaker — click to reveal */
        <button
          onClick={() => onRevealLine?.(idx)}
          className="w-full text-left cursor-pointer"
        >
          <div
            className="flex items-center gap-3 py-3 rounded-lg justify-center transition-all duration-200 hover:bg-white/[0.03]"
            style={{
              color: 'var(--text-muted)',
              border: '1px dashed var(--border-color)',
            }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span className="text-xs font-medium">{tapToRevealLabel || 'Tap to reveal'}</span>
          </div>
        </button>
      )}
    </div>
  );
});

/* ────────────────────────────────────────────────────────────────── */
/* ConversationPopup                                                  */
/* ────────────────────────────────────────────────────────────────── */
export function ConversationPopup({ conv, onClose }) {
  const { t, meaning, lang } = useTranslation();
  const { state, toggleSavedConv, updateConvStatus } = useApp();
  const catColor = getCatColor(conv.category);

  // ── Global vocab popover state (shared across all lines) ──────────
  const [activeVocab, setActiveVocab] = useState(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const vocabPopoverRef = useRef(null);

  const handleVocabClick = useCallback((word, pinyin, start, meaning, meaningThai, rect) => {
    if (activeVocab && activeVocab.start === start) {
      setActiveVocab(null);
      return;
    }
    const maxLeft = window.innerWidth - 140;
    const popLeft = Math.max(4, Math.min(rect.left, maxLeft));
    setPopoverPos({ top: rect.bottom + 4, left: popLeft });
    setActiveVocab({
      word, pinyin, start,
      meaning: lang === 'th' ? (meaningThai || meaning) : meaning,
    });
  }, [activeVocab, lang]);

  // Close vocab popover on outside click
  useEffect(() => {
    if (!activeVocab) return;
    const handler = (e) => {
      if (
        vocabPopoverRef.current &&
        !vocabPopoverRef.current.contains(e.target) &&
        !e.target.closest('[data-vocab-btn]')
      ) {
        setActiveVocab(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [activeVocab]);

  const isSaved = state.savedConvIds.includes(conv.id);
  const convStatus = state.convStatuses[conv.id] || 'new';

  const [activeLine, setActiveLine] = useState(-1);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [transcriptMode, setTranscriptMode] = useState(false);
  const [rolePlayHidden, setRolePlayHidden] = useState(null); // null | 'A' | 'B'
  const [hiddenLinesRevealed, setHiddenLinesRevealed] = useState(new Set());
  const cancelRef = useRef(false);
  const isPlayingAllRef = useRef(false);
  useEffect(() => { isPlayingAllRef.current = isPlayingAll; }, [isPlayingAll]);

  // Reveal a single hidden line in role-play mode
  const revealLine = useCallback((idx) => {
    setHiddenLinesRevealed(prev => new Set(prev).add(idx));
  }, []);

  const stop = useCallback(() => {
    cancelRef.current = true;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setActiveLine(-1);
    setIsPlayingAll(false);
  }, []);

  useEffect(() => {
    return () => {
      cancelRef.current = true;
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  const playLine = useCallback((index, onDone) => {
    if (cancelRef.current) return;
    const line = conv.lines[index];
    if (!line) { onDone?.(); return; }
    if (!window.speechSynthesis) { onDone?.(); return; }

    setActiveLine(index);
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(line.chinese);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9;

    const voices = window.speechSynthesis.getVoices() || [];
    const NEURAL_NAMES = /xiaoxiao|xiaoyu|xiaorui|xiaomo|xiaoshuang|yunyang|yunxi|yunjian|yunze|tingting|sin.?ji|mei.?jia/i;
    const lc = (s) => (s || '').toLowerCase();
    const neuralVoice = voices.find(v => NEURAL_NAMES.test(v.name || ''));
    const exactCN = voices.find(v => {
      const lang = lc(v.lang);
      return lang === 'zh-cn' || lang === 'zh-hans-cn' || lang === 'zh-hans';
    });
    const anyZh = voices.find(v => lc(v.lang).startsWith('zh') || lc(v.lang).startsWith('cmn'));
    const chosenVoice = neuralVoice || exactCN || anyZh;
    if (chosenVoice) utterance.voice = chosenVoice;

    utterance.onend = () => {
      if (cancelRef.current) return;
      setTimeout(() => {
        if (cancelRef.current) { onDone?.(); return; }
        onDone?.();
      }, 350);
    };
    utterance.onerror = () => onDone?.();

    window.speechSynthesis.speak(utterance);
  }, [conv.lines]);

  const playAll = useCallback(() => {
    cancelRef.current = false;
    setIsPlayingAll(true);
    const run = (i) => {
      if (cancelRef.current) { setActiveLine(-1); setIsPlayingAll(false); return; }
      if (i >= conv.lines.length) {
        setActiveLine(-1);
        setIsPlayingAll(false);
        // Mark as completed when play-all finishes naturally
        updateConvStatus(conv.id, 'completed');
        return;
      }
      playLine(i, () => run(i + 1));
    };
    run(0);
  }, [conv.lines, playLine, conv.id, updateConvStatus]);

  const handleLinePlay = useCallback((index) => {
    if (isPlayingAllRef.current) stop();
    cancelRef.current = false;
    setIsPlayingAll(false);
    playLine(index, () => setActiveLine(-1));
  }, [stop, playLine]);

  // Detect unique speakers
  const speakers = useMemo(() => {
    const roles = new Set(conv.lines.map(l => l.role));
    return [...roles].sort();
  }, [conv.lines]);

  // Start/stop role-play
  const toggleRolePlay = useCallback((speaker) => {
    if (rolePlayHidden === speaker) {
      setRolePlayHidden(null);
      setHiddenLinesRevealed(new Set());
    } else {
      setRolePlayHidden(speaker);
      setHiddenLinesRevealed(new Set());
    }
  }, [rolePlayHidden]);

  // Lock body scroll + Escape key (self-contained for reuse from any page)
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  // Mark as in_progress when popup opens (unless already completed)
  useEffect(() => {
    if (convStatus === 'new') {
      updateConvStatus(conv.id, 'in_progress');
    }
  }, [conv.id, convStatus, updateConvStatus]);

  const scrollContainerRef = useRef(null);

  // Auto-scroll to the active line during play-all (with offset)
  useEffect(() => {
    if (!isPlayingAll || activeLine < 0) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    const lineEl = el.querySelector(`[data-line-idx="${activeLine}"]`);
    if (!lineEl) return;
    const lineRect = lineEl.getBoundingClientRect();
    const containerRect = el.getBoundingClientRect();
    const lineTop = lineRect.top - containerRect.top + el.scrollTop;
    el.scrollTo({
      top: Math.max(0, lineTop - el.clientHeight * 0.25),
      behavior: 'smooth',
    });
  }, [activeLine, isPlayingAll]);

  return createPortal(
    <>
      <div
        className="fixed bg-black/60 popup-overlay-enter"
        style={{ top: '-100px', left: '-100px', right: '-100px', bottom: '-100px', zIndex: 100 }}
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
        <div
          key={conv.id}
          className="relative w-full max-w-2xl max-h-[min(85vh,720px)] rounded-2xl border border-white/[0.06] overflow-hidden flex flex-col pointer-events-auto popup-enter"
          style={{
            background: 'linear-gradient(160deg, color-mix(in srgb, var(--bg-card) 95%, ' + catColor + '), var(--bg-primary) 80%)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px var(--border-color), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors text-muted hover:text-primary"
          >
            <Icon name="xmark" className="text-lg" />
          </button>

          <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto">
            {/* Header */}
            <div className="px-6 sm:px-8 pt-8 pb-4 text-center">
              {/* Top row: subcategory, HSK, bookmark */}
              <div className="flex items-center justify-center gap-2 mb-1.5">
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase"
                  style={{ background: `color-mix(in srgb, ${catColor} 12%, transparent)`, color: catColor }}
                >
                  <Icon name={getSubcategoryIcon(conv.subcategory)} className="text-[9px]" />
                  {conv.subcategory}
                </span>
                {conv.hskLevel > 0 && (
                  <span className="text-[10px] text-muted/60 font-mono">HSK {conv.hskLevel}</span>
                )}
                {/* Bookmark */}
                <button
                  onClick={() => toggleSavedConv(conv.id)}
                  className="ml-1 w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/[0.06] transition-colors"
                  title={isSaved ? t('conv.unbookmark') : t('conv.bookmark')}
                >
                  <Icon
                    name="bookmark"
                    className="text-sm"
                    style={{ color: isSaved ? 'var(--accent-from)' : 'var(--text-muted)' }}
                  />
                </button>
              </div>

              <h2 className="font-bold text-primary leading-snug" style={{ fontSize: '1.35rem' }}>
                {lang === 'th' ? conv.titleThai : conv.title}
              </h2>
              <p className="text-sm text-secondary/80 mt-0.5">
                {lang === 'th' ? conv.title : conv.titleThai}
              </p>
              <p className="text-[11px] text-muted/60 mt-2 italic">
                {lang === 'th' ? conv.settingThai : conv.setting}
              </p>

              {/* Mode toggles + status */}
              <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                {/* Play-all */}
                <button
                  onClick={isPlayingAll ? stop : playAll}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-all duration-200 active:scale-95"
                  style={{
                    background: isPlayingAll
                      ? 'color-mix(in srgb, #ef4444 14%, transparent)'
                      : `color-mix(in srgb, ${catColor} 14%, transparent)`,
                    color: isPlayingAll ? '#ef4444' : catColor,
                    border: `1px solid ${isPlayingAll ? 'color-mix(in srgb, #ef4444 30%, transparent)' : `color-mix(in srgb, ${catColor} 30%, transparent)`}`,
                  }}
                >
                  {isPlayingAll ? (
                    <><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>{t('conv.stopPlay')}</>
                  ) : (
                    <><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>{t('conv.playAll')}</>
                  )}
                </button>

                {/* Transcript toggle */}
                <button
                  onClick={() => setTranscriptMode(!transcriptMode)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-200 active:scale-95"
                  style={{
                    background: transcriptMode ? 'color-mix(in srgb, #8b5cf6 14%, transparent)' : 'transparent',
                    color: transcriptMode ? '#a78bfa' : 'var(--text-muted)',
                    border: `1px solid ${transcriptMode ? 'color-mix(in srgb, #8b5cf6 30%, transparent)' : 'var(--border-color)'}`,
                  }}
                  title={t('conv.transcriptHint')}
                >
                  <Icon name="fontFamily" className="text-sm" />
                  <span className="hidden sm:inline">{t('conv.transcriptMode')}</span>
                </button>

                {/* Role-play — one button per speaker */}
                {speakers.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleRolePlay(s)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-200 active:scale-95"
                    style={{
                      background: rolePlayHidden === s ? 'color-mix(in srgb, #f59e0b 14%, transparent)' : 'transparent',
                      color: rolePlayHidden === s ? '#fbbf24' : 'var(--text-muted)',
                      border: `1px solid ${rolePlayHidden === s ? 'color-mix(in srgb, #f59e0b 30%, transparent)' : 'var(--border-color)'}`,
                    }}
                    title={rolePlayHidden === s ? t('conv.showSpeaker', { role: s }) : t('conv.hideSpeaker', { role: s })}
                  >
                    <span className="text-[11px] font-bold">{s}</span>
                    <span>{rolePlayHidden === s ? t('conv.show') : t('conv.hide')}</span>
                  </button>
                ))}
              </div>

              {/* Status buttons */}
              <div className="flex items-center justify-center gap-1.5 mt-3">
                {['new', 'in_progress', 'completed'].map(st => {
                  const cfg = CONV_STATUS_CONFIG[st];
                  const label = lang === 'th' ? cfg.labelTh : cfg.labelEn;
                  const isActive = convStatus === st;
                  return (
                    <button
                      key={st}
                      onClick={() => updateConvStatus(conv.id, st)}
                      className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-all duration-200 ${
                        isActive ? 'ring-1' : 'opacity-50 hover:opacity-100'
                      }`}
                      style={{
                        background: isActive ? cfg.bg : 'transparent',
                        color: isActive ? cfg.color : 'var(--text-muted)',
                        borderColor: isActive ? cfg.color : 'var(--border-color)',
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dialogue lines */}
            <div className="px-6 sm:px-8 pb-6 space-y-3">
              {conv.lines.map((line, idx) => (
                <LineCard
                  key={idx}
                  line={line}
                  idx={idx}
                  isActive={activeLine === idx}
                  onPlay={handleLinePlay}
                  lineMeaning={meaning(line)}
                  linePinyin={line.pinyin}
                  transcriptMode={transcriptMode}
                  rolePlayHidden={rolePlayHidden}
                  onRevealLine={revealLine}
                  hiddenLines={hiddenLinesRevealed}
                  tapToRevealLabel={t('conv.tapToReveal')}
                  onVocabClick={handleVocabClick}
                />
              ))}
            </div>

            {/* Cultural note */}
            {conv.culturalNote && (
              <div className="px-6 sm:px-8 pb-8">
                <details className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
                  <summary className="cursor-pointer px-4 py-2.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted hover:text-primary transition-colors select-none">
                    <Icon name="chevronDown" className="text-[10px] transition-transform duration-200 group-open:rotate-180" />
                    <span>{t('conv.culturalNote')}</span>
                  </summary>
                  <div className="px-4 pb-4 pt-1 text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {lang === 'th' ? (
                      <p>{conv.culturalNote.th}</p>
                    ) : (
                      <p>{conv.culturalNote.en}</p>
                    )}
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vocab popover — horizontal */}
      {activeVocab && (
        <div
          ref={vocabPopoverRef}
          className="fixed z-[200] animate-fade-in rounded-lg px-3 py-2 shadow-md flex items-center gap-2.5 whitespace-nowrap"
          style={{
            top: `${popoverPos.top + 4}px`,
            left: `${popoverPos.left}px`,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
          }}
        >
          <span className="text-sm font-semibold text-primary leading-tight">{activeVocab.word}</span>
          <span className="text-[11px] text-secondary/70 italic leading-tight">{activeVocab.pinyin}</span>
          <span className="text-[11px] text-muted/70 leading-tight pl-2.5"
                style={{ borderLeft: '1px solid color-mix(in srgb, var(--border-color) 50%, transparent)' }}
          >
            {activeVocab.meaning}
          </span>
        </div>
      )}
    </>,
    document.body
  );
}
