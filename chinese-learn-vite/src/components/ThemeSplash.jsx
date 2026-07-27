import { useEffect, useState, useRef, useCallback } from 'react'
import { useApp } from '../context/AppContext'

export default function ThemeSplash({ onFinish }) {
  const { state } = useApp()
  const [phase, setPhase] = useState('enter') // enter | hold | exit | done
  const isDark = state.theme === 'dark'
  const splashRef = useRef(null)
  const finishCalled = useRef(false)

  const finish = useCallback(() => {
    if (finishCalled.current) return
    finishCalled.current = true
    setPhase('done')
    if (onFinish) setTimeout(onFinish, 100)
  }, [onFinish])

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 1200)
    const t2 = setTimeout(() => setPhase('exit'), 2200)
    const t3 = setTimeout(finish, 3200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [finish])

  if (phase === 'done') return null

  const overlayOpacity = phase === 'enter'
    ? 'opacity-100'
    : phase === 'exit'
      ? 'opacity-0 scale-105'
      : 'opacity-100'

  const bodyScale = phase === 'enter'
    ? 'scale-0 opacity-0'
    : phase === 'hold'
      ? 'scale-100 opacity-100'
      : 'scale-90 opacity-0'

  // Pre-compute random star positions (stable per render)
  const stars = [...Array(20)].map(() => ({
    cx: 40 + Math.random() * 200,
    cy: 40 + Math.random() * 200,
    r: 1 + Math.random() * 1.5,
    delay: `${Math.random() * 2}s`,
    duration: `${1.5 + Math.random() * 2}s`,
    opacity: 0.3 + Math.random() * 0.5,
  }))

  // Pre-compute ray angles (stable per render)
  const rays = [...Array(12)].map((_, i) => {
    const angle = (i * 30) * Math.PI / 180
    return {
      x2: 130 + Math.cos(angle) * 70,
      y2: 130 + Math.sin(angle) * 70,
      delay: `${i * 0.05}s`,
    }
  })

  return (
    <div
      ref={splashRef}
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-700 ease-out ${overlayOpacity}`}
      style={{ backgroundColor: 'var(--bg-primary)' }}
      onClick={phase !== 'enter' ? finish : undefined}
      role="dialog"
      aria-label={isDark ? 'Welcome animation - moon' : 'Welcome animation - sun'}
    >
      {/* Skip button */}
      <button
        onClick={(e) => { e.stopPropagation(); finish() }}
        className="absolute top-6 right-6 z-10 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
          text-secondary hover:text-primary border border-transparent hover:border-border-app
          bg-secondary/50 hover:bg-card-hover backdrop-blur-sm"
        aria-label="Skip splash animation"
      >
        Skip →
      </button>

      {/* Ambient glow */}
      <div
        className={`absolute inset-0 transition-all duration-1000 ${isDark ? 'opacity-40' : 'opacity-25'}`}
        style={{
          background: isDark
            ? 'radial-gradient(ellipse at 50% 40%, rgba(56,189,248,0.12) 0%, transparent 60%)'
            : 'radial-gradient(ellipse at 50% 40%, rgba(249,115,22,0.15) 0%, transparent 60%)',
        }}
      />

      {/* Sun / Moon + Stars */}
      <div
        className={`relative transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${bodyScale}`}
      >
        {isDark ? (
          /* === Dark Mode: Moon + Stars === */
          <div className="relative flex flex-col items-center">
            {/* Stars background layer */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="280" height="280" viewBox="0 0 280 280" className="splash-stars" aria-hidden="true">
                {stars.map((s, i) => (
                  <circle
                    key={i}
                    cx={s.cx}
                    cy={s.cy}
                    r={s.r}
                    className="splash-star"
                    style={{ animationDelay: s.delay, animationDuration: s.duration }}
                    fill="currentColor"
                    opacity={s.opacity}
                  />
                ))}
              </svg>
            </div>

            {/* Moon */}
            <div className="relative">
              <div className="splash-moon-shadow" />
              <svg width="120" height="120" viewBox="0 0 120 120" className="splash-moon-svg drop-shadow-[0_0_40px_rgba(56,189,248,0.3)]" aria-hidden="true">
                <defs>
                  <radialGradient id="moonGrad" cx="40%" cy="35%" r="60%">
                    <stop offset="0%" stopColor="#e0f2fe" />
                    <stop offset="70%" stopColor="#7dd3fc" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </radialGradient>
                  <filter id="moonGlow">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                <path
                  d="M 65 15 A 45 45 0 1 0 105 60 A 38 38 0 1 1 65 15"
                  fill="url(#moonGrad)"
                  filter={phase === 'hold' ? 'url(#moonGlow)' : undefined}
                  className="splash-crescent"
                />
              </svg>
              <div className="absolute top-[28px] right-[28px] w-[6px] h-[6px] rounded-full bg-white/20" />
              <div className="absolute top-[45px] right-[18px] w-[9px] h-[9px] rounded-full bg-white/15" />
              <div className="absolute top-[55px] right-[35px] w-[5px] h-[5px] rounded-full bg-white/10" />
            </div>

            <div className="mt-8 text-center splash-text-fade">
              <p className="text-lg text-sky-400/80 font-light tracking-[0.2em]">学而时习之</p>
              <p className="text-sm text-sky-300/40 mt-2 tracking-wider">Welcome</p>
            </div>
          </div>
        ) : (
          /* === Light Mode: Sun === */
          <div className="relative flex flex-col items-center">
            {/* Sun rays */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="260" height="260" viewBox="0 0 260 260" className="splash-rays" aria-hidden="true">
                {rays.map((r, i) => (
                  <line
                    key={i}
                    x1={130}
                    y1={130}
                    x2={r.x2}
                    y2={r.y2}
                    className="splash-ray"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    style={{ animationDelay: r.delay }}
                  />
                ))}
              </svg>
            </div>

            {/* Sun body */}
            <div className="relative">
              <svg width="110" height="110" viewBox="0 0 110 110" className="splash-sun-svg drop-shadow-[0_0_50px_rgba(249,115,22,0.3)]" aria-hidden="true">
                <defs>
                  <radialGradient id="sunGrad" cx="40%" cy="35%" r="60%">
                    <stop offset="0%" stopColor="#fef3c7" />
                    <stop offset="40%" stopColor="#fb923c" />
                    <stop offset="100%" stopColor="#ea580c" />
                  </radialGradient>
                  <filter id="sunGlow">
                    <feGaussianBlur stdDeviation="8" result="blur" />
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                <circle
                  cx="55"
                  cy="55"
                  r="35"
                  fill="url(#sunGrad)"
                  filter={phase === 'hold' ? 'url(#sunGlow)' : undefined}
                  className="splash-sun-body"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[45px] h-[45px] rounded-full bg-white/20 blur-sm" />
              </div>
            </div>

            <div className="mt-6 w-32 h-0.5 rounded-full splash-horizon" />

            <div className="mt-6 text-center splash-text-fade">
              <p className="text-lg text-orange-500/80 font-light tracking-[0.2em]">一日之计在于晨</p>
              <p className="text-sm text-orange-400/40 mt-2 tracking-wider">Welcome</p>
            </div>
          </div>
        )}

        {/* Loading dots */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex gap-2 splash-dots">
          <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-sky-400/60' : 'bg-orange-400/60'} splash-dot`} style={{ animationDelay: '0s' }} />
          <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-sky-400/60' : 'bg-orange-400/60'} splash-dot`} style={{ animationDelay: '0.2s' }} />
          <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-sky-400/60' : 'bg-orange-400/60'} splash-dot`} style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  )
}
