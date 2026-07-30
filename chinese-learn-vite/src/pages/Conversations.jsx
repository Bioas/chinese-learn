import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import SpeakButton from '../components/SpeakButton';
import Icon from '../components/Icon';
import InkParticles from '../components/InkParticles';
import useTranslation from '../hooks/useTranslation';
import { CONVERSATIONS, getConversationById } from '../data/conversations';
import { CATEGORIES, getSubcategoryIcon } from '../data/vocabulary';

const CONV_INK_CHARS = ['對', '話', '聊', '天', '語', '音', '句', '詞', '場', '景'];

const CATEGORY_COLORS = {
  hsk: '#f97316', daily: '#e11d48', topics: '#8b5cf6',
  health: '#f43f5e', education: '#8b5cf6', technology: '#06b6d4',
  business: '#eab308', nature: '#22c55e',
};

function getCatColor(catId) {
  return CATEGORY_COLORS[catId] || '#a89488';
}

// Speaker palette — A: accent (orange), B: amber
const SPEAKER_COLORS = {
  A: { primary: 'var(--accent-from)', secondary: '#f59e0b' },
  B: { primary: '#f59e0b', secondary: 'var(--accent-from)' },
};

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

export default function Conversations() {
  const { t, meaning, lang } = useTranslation();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
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

  useEffect(() => { setPage(1); }, [selectedCategory, searchTerm, isMobile]);

  // Filter + sort
  const filteredConvs = useMemo(() => {
    let list = CONVERSATIONS;
    if (selectedCategory !== 'all') {
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
    return list;
  }, [selectedCategory, searchTerm]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredConvs.length / ITEMS_PER_PAGE)), [filteredConvs, ITEMS_PER_PAGE]);
  const paginatedConvs = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredConvs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredConvs, page, ITEMS_PER_PAGE]);

  const closePopup = useCallback(() => setPopupConv(null), []);

  // Escape to close popup
  useEffect(() => {
    if (!popupConv) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') closePopup(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [popupConv, closePopup]);

  // Pagination pages render
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

      {/* Search + Category filter */}
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
            onClick={() => setSelectedCategory('all')}
            className={`chip text-xs snap-start shrink-0 ${selectedCategory === 'all' ? 'active' : ''}`}
          >
            {t('conv.allCategories')}
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`chip text-xs snap-start shrink-0 ${selectedCategory === cat.id ? 'active' : ''}`}
            >
              <Icon name={cat.icon} className="text-[10px] mr-1" />
              {lang === 'th' ? cat.nameThai : cat.name}
            </button>
          ))}
        </ScrollFadeRow>
      </div>

      {/* Cards */}
      {filteredConvs.length === 0 ? (
        <div className="glass-card p-12 text-center animate-fade-in relative z-10">
          <p className="text-4xl mb-3 text-secondary"><Icon name="messageDetail" /></p>
          <p className="text-secondary">{t('conv.noResults')}</p>
          <p className="text-xs text-muted mt-1">{t('conv.adjustFilters')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in relative z-10">
          {paginatedConvs.map((conv, index) => {
            const catColor = getCatColor(conv.category);
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

                {/* Category badge */}
                <div className="px-5 pt-4 pb-0">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase"
                    style={{ background: `color-mix(in srgb, ${catColor} 12%, transparent)`, color: catColor }}
                  >
                    <Icon name={getSubcategoryIcon(conv.subcategory)} className="text-[9px]" />
                    {lang === 'th' ? conv.subcategory : conv.subcategory}
                  </span>
                </div>

                {/* Title — primary language first, secondary as smaller subtitle */}
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

                {/* Setting */}
                <div className="px-5 pb-4 mt-auto">
                  <p className="text-[11px] text-muted/60 leading-snug line-clamp-2">
                    {t('conv.setting')} {lang === 'th' ? conv.settingThai : conv.setting}
                  </p>
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
/* LineCard — single dialogue line, memoised */
/* ────────────────────────────────────────────────────────────────── */
const LineCard = React.memo(function LineCard({ line, idx, isActive, onPlay, lineMeaning }) {
  const speakerColor = SPEAKER_COLORS[line.role]?.primary || 'var(--text-secondary)';
  return (
    <div
      className={`relative rounded-xl border transition-all duration-200 ${
        isActive ? 'ring-2 ring-offset-1' : ''
      }`}
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
      </div>
      <p className="text-base leading-relaxed text-primary font-medium">
        {line.chinese}
      </p>
      <p className="text-xs text-secondary/80 italic mt-1 leading-snug">
        {line.pinyin}
      </p>
      <p className="text-xs text-muted/70 mt-1 leading-snug">
        {lineMeaning}
      </p>
    </div>
  );
});

/* ────────────────────────────────────────────────────────────────── */
/* ConversationPopup — simplified: clean header + dialogue lines + cultural note */
/* ────────────────────────────────────────────────────────────────── */
function ConversationPopup({ conv, onClose }) {
  const { t, meaning, lang } = useTranslation();
  const catColor = getCatColor(conv.category);

  const [activeLine, setActiveLine] = useState(-1);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const cancelRef = useRef(false);
  const isPlayingAllRef = useRef(false);
  useEffect(() => { isPlayingAllRef.current = isPlayingAll; }, [isPlayingAll]);

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
      if (i >= conv.lines.length) { setActiveLine(-1); setIsPlayingAll(false); return; }
      playLine(i, () => run(i + 1));
    };
    run(0);
  }, [conv.lines, playLine]);

  const handleLinePlay = useCallback((index) => {
    if (isPlayingAllRef.current) stop();
    cancelRef.current = false;
    setIsPlayingAll(false);
    playLine(index, () => setActiveLine(-1));
  }, [stop, playLine]);

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
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors text-muted hover:text-primary"
          >
            <Icon name="xmark" className="text-lg" />
          </button>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {/* Clean header — centered */}
            <div className="px-6 sm:px-8 pt-8 pb-4 text-center">
              <div className="flex items-center gap-2 mb-1.5">
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

              {/* Play-all button */}
              <button
                onClick={isPlayingAll ? stop : playAll}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-all duration-200 active:scale-95"
                style={{
                  background: isPlayingAll
                    ? 'color-mix(in srgb, #ef4444 14%, transparent)'
                    : `color-mix(in srgb, ${catColor} 14%, transparent)`,
                  color: isPlayingAll ? '#ef4444' : catColor,
                  border: `1px solid ${isPlayingAll ? 'color-mix(in srgb, #ef4444 30%, transparent)' : `color-mix(in srgb, ${catColor} 30%, transparent)`}`,
                }}
              >
                {isPlayingAll ? (
                  <>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                    {t('conv.stopPlay')}
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                    {t('conv.playAll')}
                  </>
                )}
              </button>
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
                  <div className="px-4 pb-4 pt-1 text-[12px] leading-relaxed" style={{ color: lang === 'th' ? 'var(--text-secondary)' : 'var(--text-secondary)' }}>
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
    </>,
    document.body
  );
}
