import { useMemo } from 'react';

export default function InkParticles({ chars = [], paused = false }) {
  const particles = useMemo(() =>
    chars.map((char, i) => ({
      char,
      id: i,
      left: `${(i * 11 + 7) % 100}%`,
      delay: `${i * 2.3}s`,
      duration: `${16 + i * 1.8}s`,
      fontSize: `${2.8 + (i % 3) * 0.8}rem`,
    })),
    [chars],
  );

  if (!chars.length) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map(p => (
        <div
          key={p.id}
          className="ink-particle"
          style={{
            left: p.left,
            bottom: '-10%',
            animationDelay: p.delay,
            animationDuration: p.duration,
            fontSize: p.fontSize,
            // Freeze the floating animations so pages that open cost-heavy
            // modals (e.g.ConversationPopup with backdrop-blur) don't pay a
            // per-frame re-blur cost on the underlying animated background.
            animationPlayState: paused ? 'paused' : 'running',
          }}
        >
          {p.char}
        </div>
      ))}
    </div>
  );
}
