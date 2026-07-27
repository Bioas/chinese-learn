import React, { useRef, useEffect, useState, useCallback } from 'react';

// Heuristic estimate for adaptive timing (not shown to user)
function estimateStrokeCount(char) {
  const code = char.charCodeAt(0);
  if (code >= 0x4E00 && code <= 0x9FFF) {
    if (code < 0x5000) return 4;
    if (code < 0x6000) return 6;
    if (code < 0x7000) return 8;
    if (code < 0x8000) return 10;
    if (code < 0x9000) return 12;
    return 15;
  }
  return 5;
}

const CHAR_SIZE = 80; // Each character gets 80x80px

export default function StrokeOrder({ character, size = 120 }) {
  const containerRef = useRef(null);
  const [writers, setWriters] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentCharIndex, setCurrentCharIndex] = useState(-1);

  const chars = character ? character.split('') : [];
  const isMultiChar = chars.length > 1;

  // Total width for multi-char: each char gets CHAR_SIZE + gap
  const totalWidth = isMultiChar
    ? chars.length * CHAR_SIZE + (chars.length - 1) * 8
    : size;

  useEffect(() => {
    let cancelled = false;
    let writersArr = [];

    const init = async () => {
      if (!containerRef.current || !character) return;

      const HanziWriter = (await import('hanzi-writer')).default;

      if (cancelled) return;

      // Clear container
      containerRef.current.innerHTML = '';

      // Create containers + writers for each character
      writersArr = chars.map((ch, i) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'inline-flex flex-col items-center';
        wrapper.style.width = `${isMultiChar ? CHAR_SIZE : size}px`;
        wrapper.style.height = `${isMultiChar ? CHAR_SIZE + 20 : size}px`;

        if (isMultiChar) {
          wrapper.style.marginRight = i < chars.length - 1 ? '8px' : '0';
        }

        containerRef.current.appendChild(wrapper);

        const delay = Math.max(20, Math.min(60, Math.floor(1500 / estimateStrokeCount(ch))));
        const speed = Math.min(2.5, Math.max(1.0, 1.5 - (estimateStrokeCount(ch) - 5) * 0.03));

        const writer = HanziWriter.create(wrapper, ch, {
          width: isMultiChar ? CHAR_SIZE : size,
          height: isMultiChar ? CHAR_SIZE : size,
          padding: 5,
          strokeColor: '#38bdf8',
          radicalColor: '#818cf8',
          outlineColor: '#1e2d52',
          strokeAnimationSpeed: speed,
          delayBetweenStrokes: delay,
          showOutline: false,
          showCharacter: true,
        });

        // Label below each char
        const label = document.createElement('span');
        label.className = 'text-xs text-slate-500 mt-1 text-center';
        label.textContent = ch;
        wrapper.appendChild(label);

        return writer;
      });

      if (cancelled) return;
      setWriters(writersArr);

      // Auto-play: animate all chars simultaneously
      setTimeout(() => {
        if (cancelled) return;
        setIsAnimating(true);
        setCurrentCharIndex(0);

        // Animate all characters in parallel
        let completed = 0;
        writersArr.forEach((w, i) => {
          w.hideCharacter({ duration: 0 });
          w.animateCharacter({
            onComplete: () => {
              completed++;
              if (!cancelled) {
                setCurrentCharIndex(prev => Math.max(prev, i + 1));
                if (completed >= writersArr.length) {
                  setIsAnimating(false);
                  setCurrentCharIndex(-1);
                }
              }
            },
          });
        });
      }, 300);
    };

    if (character) {
      init();
    }

    return () => {
      cancelled = true;
      writersArr = [];
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character]);

  const toggleAnimation = useCallback(() => {
    if (writers.length === 0) return;

    if (isAnimating) {
      writers.forEach(w => w.pauseAnimation());
      setIsAnimating(false);
      setCurrentCharIndex(-1);
    } else {
      setIsAnimating(true);
      setCurrentCharIndex(0);
      let completed = 0;
      writers.forEach((w, i) => {
        w.hideCharacter({ duration: 0 });
        w.animateCharacter({
          onComplete: () => {
            completed++;
            setCurrentCharIndex(prev => Math.max(prev, i + 1));
            if (completed >= writers.length) {
              setIsAnimating(false);
              setCurrentCharIndex(-1);
            }
          },
        });
      });
    }
  }, [writers, isAnimating]);

  if (!character) return null;

  // Progress display
  const progress = isAnimating && chars.length > 1
    ? `${Math.min(currentCharIndex + 1, chars.length)}/${chars.length}`
    : null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative group">
        <div
          ref={containerRef}
          className="rounded-xl bg-slate-800/50 p-2 inline-flex items-start cursor-pointer transition-all duration-300 hover:bg-slate-700/50 hover:shadow-lg hover:shadow-blue-500/10 border border-slate-700/50 hover:border-blue-500/30"
          onClick={toggleAnimation}
          title={isAnimating ? 'Pause' : 'Play stroke order'}
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-slate-900/70 flex items-center justify-center backdrop-blur-sm">
            {isAnimating ? (
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </div>
        </div>
      </div>
      {isAnimating && progress && (
        <span className="text-[10px] text-blue-400 animate-pulse">
          Drawing... ({progress})
        </span>
      )}
      {isAnimating && !progress && (
        <span className="text-[10px] text-blue-400 animate-pulse">Drawing...</span>
      )}
    </div>
  );
}
