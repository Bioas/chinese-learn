import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Icon from '../components/Icon';
import useTranslation from '../hooks/useTranslation';
import HSK_GRAMMAR from '../data/hskGrammar';
import { getCategoryColor } from '../data/categories';
import SpeakButton from '../components/SpeakButton';
import InkParticles from '../components/InkParticles';

const GRAMMAR_INK_CHARS = ['語', '法', '句', '文', '學', '筆', '詞', '問', '答', '意'];

/* ── Lightweight scroll fade row (mobile only) ── */
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
      <div ref={ref} onScroll={update} className={`flex gap-2 overflow-x-auto scrollbar-none snap-x snap-proximity ${className}`}>
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

/* Lightweight hex-tinted column — matches the per-category accent used by
   the other pages so HSK 1 feels "warmer" / HSK 7 deeper etc. */
const LEVEL_ACCENT = {
  1: '#84cc16',   // lime-500 — easiest, fresh
  2: '#22c55e',   // green-500
  3: '#10b981',   // emerald-500
  4: '#06b6d4',   // cyan-500
  5: '#3b82f6',   // blue-500
  6: '#8b5cf6',   // violet-500
  7: '#ec4899',   // pink-500 — HSK 7-9
};



function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);
  const handle = useCallback(async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // No-op; the browser blocks clipboard write outside secure contexts.
    }
  }, [text]);
  return (
    <button
      onClick={handle}
      title={label}
      className="ml-1.5 inline-flex items-center justify-center rounded-md p-1 transition-all duration-200 hover:bg-card-hover/60 active:scale-90"
      style={{ color: 'var(--text-muted)' }}
    >
      <Icon
        name={copied ? 'check' : 'messageDetail'}
        className="text-[11px]"
        style={{ color: copied ? 'var(--accent-from)' : 'inherit' }}
      />
    </button>
  );
}

function PatternCard({ pattern, levelMeta, expanded, onToggle }) {
  const { lang } = useTranslation();
  const accent = LEVEL_ACCENT[pattern.level] || '#eab308';
  const titleId = `g-${pattern.level}-${pattern.rank}`;
  return (
    <article
      id={titleId}
      className={`relative rounded-xl flex flex-col overflow-hidden animate-slide-up cursor-pointer transition-shadow duration-200`}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        boxShadow: expanded
          ? `0 0 0 1px color-mix(in srgb, ${accent} 35%, transparent), 0 4px 20px color-mix(in srgb, ${accent} 10%, rgba(0,0,0,0.04))`
          : '0 1px 0 rgba(255,255,255,0.025) inset, 0 2px 10px rgba(0,0,0,0.025)',
        animationDelay: `${pattern.rank * 25}ms`,
      }}
      onClick={onToggle}
    >
      {/* Accent stripe */}
      <div className="h-0.5 w-full flex-shrink-0" style={{ background: `linear-gradient(90deg, ${accent}, color-mix(in srgb, ${accent} 40%, transparent))` }} />

      {/* HSK badge + rank + structure */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase"
            style={{ background: `color-mix(in srgb, ${accent} 14%, transparent)`, color: accent }}
          >
            <Icon name="library" className="text-[9px]" />
            HSK {pattern.level === 7 ? '7-9' : pattern.level}
          </span>
          <span
            className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-[10px] font-bold tabular-nums"
            style={{
              background: `color-mix(in srgb, ${accent} 22%, transparent)`,
              color: accent,
            }}
          >
            #{pattern.rank}
          </span>
        </div>
        {/* Structure */}
        <h3
          className="font-serif font-bold leading-tight"
          style={{
            fontSize: '1.45rem',
            color: 'var(--text-primary)',
            fontFamily: '"Noto Serif SC", "Songti SC", serif',
          }}
        >
          {pattern.structure}
        </h3>
        <p
          className="text-xs mt-1 italic"
          style={{ color: 'var(--text-muted)' }}
        >
          {pattern.pinyin}
        </p>

        {/* English / Thai description */}
        <p
          className="text-sm mt-3 leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          {pattern.english}
        </p>
        {lang === 'th' && (
          <p
            className="text-[13px] mt-1.5 leading-relaxed"
            style={{ color: 'var(--text-secondary)', opacity: 0.85 }}
          >
            {pattern.thai}
          </p>
        )}
      </div>

      {/* Bottom row: example + actions */}
      <div className="px-5 pb-4 mt-auto">
        <div
          className="rounded-lg px-3 py-2.5 flex flex-col gap-1.5 transition-all duration-200 cursor-pointer"
          style={{
            background: expanded
              ? `color-mix(in srgb, ${accent} 9%, transparent)`
              : 'color-mix(in srgb, var(--bg-card-hover) 55%, transparent)',
            border: `1px solid ${
              expanded
                ? `color-mix(in srgb, ${accent} 30%, transparent)`
                : 'var(--border-color)'
            }`,
          }}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <p
              className="font-medium leading-snug flex-1"
              style={{
                fontFamily: '"Noto Serif SC", "Songti SC", serif',
                fontSize: '1rem',
                color: 'var(--text-primary)',
              }}
            >
              {pattern.example_zh}
              <CopyButton text={pattern.example_zh} label="Copy CN sentence" />
            </p>
            <SpeakButton text={pattern.example_zh} className="shrink-0" />
          </div>
          {expanded && (
            <>
              <p
                className="text-[12px] italic mt-1"
                style={{ color: 'var(--text-muted)' }}
              >
                {pattern.example_py}
              </p>
              <p
                className="text-[12.5px] mt-1 leading-snug"
                style={{ color: 'var(--text-secondary)' }}
              >
                {pattern.example_en}
              </p>
              <p
                className="text-[12.5px] leading-snug"
                style={{ color: 'var(--text-secondary)', opacity: 0.85 }}
              >
                {pattern.example_th}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Extra examples (only HSK 1-4 carry more_examples from studycli.org) */}
      {expanded && pattern.more_examples && pattern.more_examples.length > 0 && (
        <div className="px-5 pb-4 -mt-2 space-y-2">
          <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: accent }}>
            {lang === 'th' ? `ตัวอย่างเพิ่มเติม (${pattern.more_examples.length})` : `More examples (${pattern.more_examples.length})`}
          </p>
          {pattern.more_examples.map((ex, idx) => (
            <div
              key={idx}
              className="rounded-lg px-3 py-2 flex flex-col gap-1"
              style={{
                background: `color-mix(in srgb, ${accent} 5%, transparent)`,
                border: `1px solid color-mix(in srgb, ${accent} 18%, transparent)`,
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <p
                  className="font-medium leading-snug flex-1"
                  style={{
                    fontFamily: '"Noto Serif SC", "Songti SC", serif',
                    fontSize: '0.95rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  {ex.zh}
                  <CopyButton text={ex.zh} label="Copy CN sentence" />
                </p>
                <SpeakButton text={ex.zh} className="shrink-0" />
              </div>
              <p
                className="text-[12px] italic mt-0.5"
                style={{ color: 'var(--text-muted)' }}
              >
                {ex.py}
              </p>
              <p className="text-[12.5px] mt-0.5 leading-snug" style={{ color: 'var(--text-secondary)' }}>
                {ex.en}
              </p>
              <p className="text-[12.5px] leading-snug" style={{ color: 'var(--text-secondary)', opacity: 0.85 }}>
                {ex.th}
              </p>
            </div>
          ))}
          {pattern.source_url && (
            <a
              href={pattern.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] hover:underline"
              style={{ color: accent }}
            >
              <Icon name="library" className="text-[10px]" />
              <span>{lang === 'th' ? 'ที่มา: studycli.org' : 'Source: studycli.org'}</span>
              <Icon name="chevronDown" className="text-[9px] -rotate-90" />
            </a>
          )}
        </div>
      )}

      {/* Subtle expand hint */}
      {!expanded && (
        <div className="px-5 pb-3 -mt-1 flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
          <Icon name="chevronDown" className="text-[10px]" />
          <span>
            {lang === 'th'
              ? (pattern.more_examples?.length
                  ? `แตะเพื่อดู ${pattern.more_examples.length + 1} ตัวอย่าง`
                  : 'แตะเพื่อดูตัวอย่างเพิ่มเติม')
              : (pattern.more_examples?.length
                  ? `Tap to reveal ${pattern.more_examples.length + 1} examples`
                  : 'Tap to reveal pinyin + translation')}
          </span>
        </div>
      )}
    </article>
  );
}

export default function HskGrammar() {
  const { t, lang } = useTranslation();
  const hskColor = getCategoryColor('hsk');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState(null); // null = all levels
  const [expandedKey, setExpandedKey] = useState(null);

  // Pre-compute flat list filtered by level + search
  const flatPatterns = useMemo(() => {
    return HSK_GRAMMAR.flatMap((lv) =>
      lv.patterns.map((p) => ({
        ...p,
        level: lv.level,
        levelTitle: lv.title,
        levelSubtitle: lv.subtitle,
      })),
    );
  }, []);

  const visibleLevels = useMemo(() => {
    if (selectedLevel === null) return HSK_GRAMMAR;
    return HSK_GRAMMAR.filter((lv) => lv.level === selectedLevel);
  }, [selectedLevel]);

  // Apply search filtering: show patterns whose structure, pinyin, EN, or TH
  // contains the query.
  const filteredLevels = useMemo(() => {
    if (!searchTerm.trim()) return visibleLevels;
    const q = searchTerm.trim().toLowerCase();
    return visibleLevels
      .map((lv) => ({
        ...lv,
        patterns: lv.patterns.filter(
          (p) =>
            p.structure.toLowerCase().includes(q) ||
            p.pinyin.toLowerCase().includes(q) ||
            p.english.toLowerCase().includes(q) ||
            p.thai.toLowerCase().includes(q) ||
            p.example_zh.includes(q) ||
            p.example_en.toLowerCase().includes(q) ||
            p.example_th.toLowerCase().includes(q),
        ),
      }))
      .filter((lv) => lv.patterns.length > 0);
  }, [visibleLevels, searchTerm]);

  const totalMatching = useMemo(
    () => filteredLevels.reduce((sum, lv) => sum + lv.patterns.length, 0),
    [filteredLevels],
  );

  // Per-level counts regardless of search filter — useful for chip badges.
  const levelCounts = useMemo(() => {
    return HSK_GRAMMAR.map((lv) => ({
      level: lv.level,
      count: lv.patterns.length,
    }));
  }, []);

  return (
    <div className="space-y-6 relative">
      <InkParticles chars={GRAMMAR_INK_CHARS} />

      {/* Title */}
      <div className="animate-slide-up relative z-10">
        <h1 className="text-3xl lg:text-4xl font-bold">
          <span className="gradient-text"><Icon name="library" /> {t('grammar.title')}</span>
        </h1>
        <p className="text-secondary mt-1">{t('grammar.subtitle')}</p>
      </div>

      {/* Search */}
      <div className="glass-card p-4 animate-slide-up relative z-10">
        <div className="relative mb-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('grammar.searchPlaceholder')}
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

        {/* Level filter chips */}
        <ScrollFadeRow className="md:flex-wrap md:overflow-visible">
          <button
            type="button"
            onClick={() => setSelectedLevel(null)}
            className={`chip text-xs snap-start shrink-0 ${selectedLevel === null ? 'active' : ''}`}
          >
            <span>{t('grammar.allLevels')}</span>
            <span
              className="ml-1 text-[10px] font-semibold tabular-nums px-1.5 py-px rounded-full"
              style={{
                background: selectedLevel === null ? 'rgba(255,255,255,0.22)' : 'color-mix(in srgb, var(--text-muted) 12%, transparent)',
                color: selectedLevel === null ? '#fff' : 'var(--text-muted)',
              }}
            >
              {flatPatterns.length}
            </span>
          </button>
          {levelCounts.map(({ level, count }) => {
            const accent = LEVEL_ACCENT[level] || hskColor;
            const active = selectedLevel === level;
            return (
              <button
                key={level}
                type="button"
                onClick={() => setSelectedLevel(level)}
                aria-pressed={active}
                className="chip text-xs snap-start shrink-0 flex items-center gap-1"
                style={{
                  background: active ? `color-mix(in srgb, ${accent} 20%, transparent)` : undefined,
                  borderColor: active ? `color-mix(in srgb, ${accent} 45%, transparent)` : undefined,
                  color: active ? `color-mix(in srgb, ${accent} 70%, var(--text-primary))` : undefined,
                  boxShadow: active ? `0 0 0 3px color-mix(in srgb, ${accent} 10%, transparent)` : undefined,
                }}
              >
                <span style={{ color: active ? accent : undefined }}>
                  HSK {level === 7 ? '7-9' : level}
                </span>
                <span
                  className="text-[10px] font-semibold tabular-nums px-1.5 py-px rounded-full"
                  style={{
                    background: active ? `color-mix(in srgb, ${accent} 22%, transparent)` : 'color-mix(in srgb, var(--text-muted) 12%, transparent)',
                    color: active ? accent : 'var(--text-muted)',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </ScrollFadeRow>

        {/* Result summary */}
        <div className="mt-3 pt-3 flex items-center justify-between gap-2" style={{ borderTop: '1px solid var(--border-color)' }}>
          <p className="text-[11px] text-muted">
            {searchTerm
              ? t('grammar.matchCount', { shown: totalMatching, total: flatPatterns.length })
              : t('grammar.totalCount', { n: flatPatterns.length })}
          </p>
          {(selectedLevel !== null || searchTerm) && (
            <button
              type="button"
              onClick={() => { setSelectedLevel(null); setSearchTerm(''); }}
              className="text-[11px] flex items-center gap-1 text-muted hover:text-primary transition-colors"
            >
              <Icon name="xmark" className="text-[10px]" />
              <span>{t('grammar.reset')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {filteredLevels.length === 0 && (
        <div className="glass-card p-12 text-center animate-fade-in relative z-10">
          <p className="text-4xl mb-3 text-secondary"><Icon name="search" /></p>
          <p className="text-secondary">{t('grammar.noResults')}</p>
          <p className="text-xs text-muted mt-1">{t('grammar.noResultsHint')}</p>
        </div>
      )}

      {/* Pattern grid per HSK level */}
      {filteredLevels.map((level, levelIndex) => {
        const levelAccent = LEVEL_ACCENT[level.level] || hskColor;
        return (
          <section
            key={level.level}
            className="space-y-3 animate-fade-in relative z-10"
            style={{ animationDelay: `${levelIndex * 80}ms` }}
          >
            {/* Level header */}
            <header
              className="flex items-baseline gap-3 px-1"
              style={{ borderLeft: `3px solid ${levelAccent}`, paddingLeft: '12px' }}
            >
              <h2
                className="font-bold"
                style={{
                  fontSize: '1.05rem',
                  color: 'var(--text-primary)',
                }}
              >
                {lang === 'th'
                  ? (level.level === 7 ? 'HSK 7-9' : `HSK ${level.level}`)
                  : level.title}
              </h2>
              <span
                className="text-[10px] uppercase tracking-[0.08em] font-semibold"
                style={{ color: levelAccent }}
              >
                {lang === 'th' ? level.title : level.subtitle}
              </span>
              <span className="ml-auto text-[10px] text-muted tabular-nums">
                {level.patterns.length} {t('grammar.patterns')}
              </span>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {level.patterns.map((pattern) => {
                const key = `${pattern.level}-${pattern.rank}`;
                return (
                  <PatternCard
                    key={key}
                    pattern={pattern}
                    levelMeta={level}
                    expanded={expandedKey === key}
                    onToggle={() => setExpandedKey(expandedKey === key ? null : key)}
                  />
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Attribution footer */}
      <footer className="glass-card p-4 animate-fade-in relative z-10">
        <p className="text-[11px] text-muted leading-relaxed">
          {t('grammar.attribution')}
        </p>
        <a
          href="https://studycli.org/chinese-tools/hsk-1-vocabulary/#grammar"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-2 text-[12px] font-medium transition-colors duration-200 hover:opacity-80"
          style={{ color: 'var(--accent-from)' }}
        >
          <Icon name="rightArrow" className="text-[10px]" />
          <span>{t('grammar.attributionLink')}</span>
          <span className="text-[10px]">↗</span>
        </a>
      </footer>
    </div>
  );
}
