import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import Icon from './Icon';
import useTranslation from '../hooks/useTranslation';
import { getSubcategoryIcon, getCategoryColor } from '../data/categories';

// Speaker palette
const SPEAKER_COLORS = {
  A: { primary: 'var(--accent-from)', secondary: '#f59e0b' },
  B: { primary: '#f59e0b', secondary: 'var(--accent-from)' },
};

/* ──────────────────────────────────────────────────────────────────── */
/* STATUS config for conversations                                     */
/* ──────────────────────────────────────────────────────────────────── */
export const CONV_STATUS_CONFIG = {
  new:        { labelEn: 'New',        labelTh: 'ใหม่',      color: '#6b6358',  bg: 'color-mix(in srgb, #6b6358 12%, transparent)' },
  in_progress: { labelEn: 'In Progress', labelTh: 'กำลังเรียน', color: '#fbbf24',  bg: 'color-mix(in srgb, #fbbf24 12%, transparent)' },
  completed:  { labelEn: 'Completed',  labelTh: 'เรียนแล้ว',   color: '#22c55e', bg: 'color-mix(in srgb, #22c55e 12%, transparent)' },
};

// ── Lazy vocabulary lookup ─────────────────────────────────────────
// The full VOCABULARY (≈6 MB chunk) is only needed when the user actually
// opens a conversation popup and taps a Chinese word. Load it on demand so
// the Dashboard (which renders ConversationPopup) never downloads it on
// first paint. The lookup is cached module-wide for the session.
let vocabLookupPromise = null;
function loadVocabLookup() {
  if (!vocabLookupPromise) {
    vocabLookupPromise = import('../data/vocabulary').then(({ VOCABULARY }) => {
      const lookup = new Map();
      for (const w of VOCABULARY) {
        if (!lookup.has(w.chinese)) {
          lookup.set(w.chinese, { pinyin: w.pinyin, meaning: w.meaning, meaningThai: w.meaningThai });
        }
      }
      return {
        lookup,
        sorted: [...lookup.keys()].sort((a, b) => b.length - a.length),
      };
    });
  }
  return vocabLookupPromise;
}

function findVocabInText(text, vocab) {
  if (!text || !vocab) return [];
  const { lookup, sorted } = vocab;
  const matches = [];
  let i = 0;
  while (i < text.length) {
    let matched = false;
    for (const word of sorted) {
      if (text.startsWith(word, i)) {
        const info = lookup.get(word);
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
function VocabRichText({ text, onVocabClick, vocab }) {
  if (!text) return null;
  const matches = findVocabInText(text, vocab);
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

/* ────────────────────────────────────────────────────────────────── */
/* LineCard — single dialogue line, memoised                          */
/* ────────────────────────────────────────────────────────────────── */
const LineCard = React.memo(function LineCard({
  line, idx, isActive, onPlay, lineMeaning, linePinyin,
  transcriptMode, rolePlayHidden, onRevealLine, hiddenLines,
  tapToRevealLabel, onVocabClick, vocab,
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
        {/* Play button — fades out smoothly when role-play hides this speaker */}
        <div
          style={{
            display: 'grid',
            gridTemplateRows: showContent ? '1fr' : '0fr',
            opacity: showContent ? 1 : 0,
            pointerEvents: showContent ? 'auto' : 'none',
            visibility: showContent ? 'visible' : 'hidden',
            transition: 'grid-template-rows 0.3s ease, opacity 0.3s ease, visibility 0s 0.3s',
          }}
          aria-hidden={!showContent}
        >
          <div style={{ overflow: 'hidden', minHeight: 0 }}>
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
        </div>
      </div>

      {/* Dialogue content — collapses + fades out when hidden by role-play */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: showContent ? '1fr' : '0fr',
          opacity: showContent ? 1 : 0,
          visibility: showContent ? 'visible' : 'hidden',
          transition: 'grid-template-rows 0.3s ease, opacity 0.3s ease, visibility 0s 0.3s',
        }}
        aria-hidden={!showContent}
      >
        <div style={{ overflow: 'hidden', minHeight: 0 }}>
          <p className="text-base leading-relaxed text-primary font-medium">
            <VocabRichText text={line.chinese} onVocabClick={onVocabClick} vocab={vocab} />
          </p>
          {/* Pinyin + meaning — stay in DOM and fade/collapse smoothly when transcript (hide translation) mode is on */}
          <div
            style={{
              display: 'grid',
              gridTemplateRows: transcriptMode ? '0fr' : '1fr',
              opacity: transcriptMode ? 0 : 1,
              transition: 'grid-template-rows 0.3s ease, opacity 0.3s ease',
            }}
            aria-hidden={transcriptMode}
          >
            <div style={{ overflow: 'hidden', minHeight: 0 }}>
              <p className="text-xs text-secondary/80 italic mt-1 leading-snug">
                {linePinyin || line.pinyin}
              </p>
              {lineMeaning && (
                <p className="text-xs text-muted/70 mt-1 leading-snug">
                  {lineMeaning}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Role-play: hidden speaker — click to reveal (fades in when content is hidden) */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: showContent ? '0fr' : '1fr',
          opacity: showContent ? 0 : 1,
          visibility: showContent ? 'hidden' : 'visible',
          transition: 'grid-template-rows 0.3s ease, opacity 0.3s ease, visibility 0s 0.3s',
        }}
        aria-hidden={showContent}
      >
        <div style={{ overflow: 'hidden', minHeight: 0 }}>
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
        </div>
      </div>
    </div>
  );
});

/* ────────────────────────────────────────────────────────────────── */
/* ConversationPopup                                                  */
/* ────────────────────────────────────────────────────────────────── */
export function ConversationPopup({ conv, onClose }) {
  const { t, meaning, lang } = useTranslation();
  const { state, toggleSavedConv, updateConvStatus } = useApp();
  const catColor = getCategoryColor(conv.category);

  // Lazy vocabulary lookup — loaded once the popup actually opens
  const [vocab, setVocab] = useState(null);
  useEffect(() => {
    let cancelled = false;
    loadVocabLookup().then((v) => {
      if (!cancelled) setVocab(v);
    });
    return () => { cancelled = true; };
  }, []);

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
                  <Icon name={transcriptMode ? 'eyeSlash' : 'eye'} className="text-sm" />
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
                  vocab={vocab}
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
