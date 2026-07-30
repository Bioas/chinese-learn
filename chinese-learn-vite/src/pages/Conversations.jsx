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

function getCatAccent(catId) {
  // CSS variable reference for accent when category matches theme
  if (catId === 'hsk') return 'var(--accent-from)';
  return CATEGORY_COLORS[catId] || '#a89488';
}

// Speaker badge colour — A = accent-from (CSS var), B = amber.
// Hoisted to module-level constant so React.memo'd LineCards see a stable
// reference and the color-mix expressions are evaluated by the browser
// once (via the --sp-* CSS variables) instead of being re-built in JS on
// every render.
const SPEAKER_STYLES = {
  A: {
    bg: 'color-mix(in srgb, var(--accent-from) 14%, transparent)',
    text: 'var(--accent-from)',
    border: 'color-mix(in srgb, var(--accent-from) 28%, transparent)',
    bar: 'var(--accent-from)',
    barAlpha30: 'color-mix(in srgb, var(--accent-from) 30%, transparent)',
    barAlpha25: 'color-mix(in srgb, var(--accent-from) 25%, transparent)',
    barAlpha50: 'color-mix(in srgb, var(--accent-from) 50%, transparent)',
  },
  B: {
    bg: 'color-mix(in srgb, #f59e0b 14%, transparent)',
    text: '#f59e0b',
    border: 'color-mix(in srgb, #f59e0b 28%, transparent)',
    bar: '#f59e0b',
    barAlpha30: 'color-mix(in srgb, #f59e0b 30%, transparent)',
    barAlpha25: 'color-mix(in srgb, #f59e0b 25%, transparent)',
    barAlpha50: 'color-mix(in srgb, #f59e0b 50%, transparent)',
  },
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

  // Unique speakers count helper
  const countUniqueSpeakers = (conv) => new Set(conv.lines.map(l => l.role)).size;

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
                <div
                  className="h-0.5 w-full flex-shrink-0"
                  style={{ background: `linear-gradient(90deg, ${catColor}, color-mix(in srgb, ${catColor} 40%, transparent))` }}
                  aria-hidden
                />
                <div className="flex items-center justify-between px-5 pt-4">
                  <span
                    className="text-[9px] uppercase tracking-[0.2em] font-bold flex items-center gap-1.5"
                    style={{ color: catColor }}
                  >
                    <Icon name={getSubcategoryIcon(conv.subcategory)} className="text-[9px] opacity-80" />
                    {conv.subcategory}
                  </span>
                  {conv.hskLevel > 0 && (
                    <span className="text-[10px] font-mono tabular-nums text-muted">
                      HSK {conv.hskLevel}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setPopupConv(conv)}
                  className="block w-full px-5 pt-2 pb-2 group/word focus:outline-none"
                >
                  <p className="text-center font-bold text-primary transition-colors duration-300 group-hover/word:text-[var(--accent-from)] leading-tight" style={{ fontSize: '1.25rem' }}>
                    {conv.title}
                  </p>
                  <p className="text-center text-xs text-secondary mt-1">
                    {conv.titleThai}
                  </p>
                </button>
                <div className="px-5 pb-2 mt-auto">
                  <p className="text-[11px] text-muted/70 italic leading-snug line-clamp-2">
                    {t('conv.setting')} {lang === 'th' ? conv.settingThai : conv.setting}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted/70 font-mono tracking-wider">
                    <span>{t('conv.lineCount', { n: conv.lines.length })}</span>
                    <span>·</span>
                    <span>{t('conv.speakers', { n: countUniqueSpeakers(conv) })}</span>
                  </div>
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
/* LineCard — single dialogue line, memoised so parent state changes
   (activeLine, isPlayingAll) only re-render the affected line, not all
   siblings. Theming is CSS-variable driven so toggling "active" is just
   a class change — the browser caches the color-mix expressions. */
/* ────────────────────────────────────────────────────────────────── */
const LineCard = React.memo(function LineCard({ line, idx, isActive, onPlay, stopTitle, playTitle, stopAria, playAria, lineMeaning }) {
  const sp = SPEAKER_STYLES[line.role];
  return (
    <div
      className={`conv-line ${isActive ? 'conv-line--active' : ''}`}
      style={{
        '--sp-bg': sp.bg,
        '--sp-border': sp.border,
        '--sp-bar': sp.bar,
        '--sp-text': sp.text,
        '--sp-bar-30': sp.barAlpha30,
        '--sp-bar-25': sp.barAlpha25,
        '--sp-bar-50': sp.barAlpha50,
      }}
    >
      <div className="conv-line-bar absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full" aria-hidden />
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <span className="conv-line-role text-[10px] font-mono font-bold tracking-wider">
          {line.role}
        </span>
        <button
          onClick={() => onPlay(idx)}
          className="conv-line-btn shrink-0 w-6 h-6 rounded-full inline-flex items-center justify-center transition-all duration-200"
          title={isActive ? stopTitle : playTitle}
          aria-label={isActive ? stopAria : playAria}
        >
          {isActive ? (
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
          ) : (
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>
      </div>
      <p className="text-[15px] leading-relaxed text-primary font-medium">
        {line.chinese}
      </p>
      <p className="text-[11px] text-secondary/80 italic mt-1 leading-snug">
        {line.pinyin}
      </p>
      <p className="text-[11px] text-muted/80 mt-1 leading-snug">
        {lineMeaning}
      </p>
    </div>
  );
});

/* ────────────────────────────────────────────────────────────────── */
/* ConversationPopup — hero header + sequential play-all + speaker-tinted dialogue lines + cultural note */
/* ────────────────────────────────────────────────────────────────── */
function ConversationPopup({ conv, onClose }) {
  const { t, meaning, lang } = useTranslation();
  const catColor = getCatColor(conv.category);

  const [activeLine, setActiveLine] = useState(-1); // -1 = idle, 0..N = currently playing
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const cancelRef = useRef(false);
  // Mirror isPlayingAll into a ref so callbacks that depend on it can stay
  // referentially stable (keeps React.memo on LineCards effective).
  const isPlayingAllRef = useRef(false);
  useEffect(() => { isPlayingAllRef.current = isPlayingAll; }, [isPlayingAll]);

  const stop = useCallback(() => {
    cancelRef.current = true;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setActiveLine(-1);
    setIsPlayingAll(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelRef.current = true;
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  // Play one line with chained onend → next line. Uses browser-default
  // speechSynthesis (same approach as the rest of the app via useSpeech).
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

    // Force a Chinese neural voice BY NAME first so single-character /
    // very short phrases also get Chinese prosody (Edge heuristic does
    // not reliably pick Xiaoxiao/Yunyang for short input, and the legacy
    // Microsoft Huihui voice falls back to non-Chinese behaviour when
    // assigned via lang-only).
    //
    // Tier 1 — Microsoft Neural (Edge/Chrome Windows) + macOS Chinese voices
    // Tier 2 — Exact zh-CN match (most reliable on Windows hybrid packs)
    // Tier 3 — Any zh-prefix voice (zh-Hans, zh-Hant, zh-TW, cmn…)
    // Tier 4 — No assignment (browser's lang='zh-CN' heuristic = baseline)
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

  // Per-line speaker might toggle between single-line read & interrupt-all.
  // Reads isPlayingAll indirectly via the ref so this callback's reference
  // stays stable across the playAll ↔ idle transitions (otherwise every
  // LineCard would be memo-invalidated every time the global state flipped).
  const handleLinePlay = useCallback((index) => {
    if (isPlayingAllRef.current) stop(); // cancel global play
    cancelRef.current = false;
    setIsPlayingAll(false);
    playLine(index, () => setActiveLine(-1));
  }, [stop, playLine]);

  return createPortal(
    <>
      <div
        className="fixed bg-black/60 popup-overlay-enter"
        style={{ top: '-100px', left: '-100px', right: '-100px', bottom: '-100px', zIndex: 100, willChange: 'transform' }}
        onClick={stop}
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
          <div className="absolute top-0 left-0 w-16 h-16 pointer-events-none" style={{ background: `linear-gradient(135deg, ${catColor} 0%, transparent 60%)`, opacity: 0.15, borderRadius: '16px 0 0 0' }} />
          <div className="absolute bottom-0 right-0 w-16 h-16 pointer-events-none" style={{ background: `linear-gradient(315deg, ${catColor} 0%, transparent 60%)`, opacity: 0.15, borderRadius: '0 0 16px 0' }} />

          <button
            onClick={onClose}
            className="absolute top-4 right-5 z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors text-muted hover:text-primary"
          >
            <Icon name="xmark" className="text-lg" />
          </button>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {/* Hero header */}
            <div className="px-8 pt-10 pb-5 text-center">
              <p className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-2" style={{ color: catColor }}>
                {conv.subcategory}
              </p>
              <h2 className="font-bold text-primary" style={{ fontSize: '1.5rem', lineHeight: 1.1 }}>
                {conv.title}
              </h2>
              <p className="text-sm text-secondary mt-1.5">{conv.titleThai}</p>
              {conv.hskLevel > 0 && (
                <span className="inline-block text-[10px] font-mono mt-2 px-2.5 py-0.5 rounded-full" style={{ background: `color-mix(in srgb, ${catColor} 15%, transparent)`, color: catColor }}>
                  HSK {conv.hskLevel}
                </span>
              )}
              <p className="text-[11px] text-muted/80 mt-3 italic">
                {t('conv.setting')} {lang === 'th' ? conv.settingThai : conv.setting}
              </p>

              {/* Play-all button */}
              <button
                onClick={isPlayingAll ? stop : playAll}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-medium transition-all duration-200 active:scale-95"
                style={{
                  background: isPlayingAll
                    ? 'color-mix(in srgb, #ef4444 18%, transparent)'
                    : `color-mix(in srgb, ${catColor} 18%, transparent)`,
                  color: isPlayingAll ? '#ef4444' : catColor,
                  border: `1px solid ${isPlayingAll ? 'color-mix(in srgb, #ef4444 35%, transparent)' : `color-mix(in srgb, ${catColor} 35%, transparent)`}`,
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
            <div className="px-6 sm:px-8 pb-6 space-y-2.5">
              {conv.lines.map((line, idx) => (
                <LineCard
                  key={idx}
                  line={line}
                  idx={idx}
                  isActive={activeLine === idx}
                  onPlay={handleLinePlay}
                  stopTitle={t('speak.stop')}
                  playTitle={t('speak.listenPronunciation')}
                  stopAria={t('speak.stopSpeaking')}
                  playAria={t('speak.speakText')}
                  lineMeaning={meaning(line)}
                />
              ))}
            </div>

            {/* Cultural note */}
            {conv.culturalNote && (
              <div className="px-6 sm:px-8 pb-8">
                <details
                  className="rounded-xl overflow-hidden group"
                  style={{
                    background: 'color-mix(in srgb, var(--bg-card) 50%, transparent)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <summary
                    className="cursor-pointer px-4 py-2.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted hover:text-primary transition-colors select-none"
                  >
                    <Icon name="chevronDown" className="text-[10px] transition-transform duration-200 group-open:rotate-180" />
                    <span>{t('conv.culturalNote')}</span>
                  </summary>
                  <div className="px-4 pb-4 pt-1 space-y-2 text-[12px] leading-relaxed text-secondary/90">
                    <p>{conv.culturalNote.en}</p>
                    <p className="text-muted/80">{conv.culturalNote.th}</p>
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
