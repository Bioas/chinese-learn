import { useCallback, useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import useTranslation from '../hooks/useTranslation'
import './simple-splash.css'

type ThemeSplashProps = {
  onFinish?: () => void
}

type Phase = 'enter' | 'hold' | 'exit' | 'done'

export default function ThemeSplash({ onFinish }: ThemeSplashProps) {
  const { t } = useTranslation()
  const { state } = useApp() as { state: { theme: string } }
  const [phase, setPhase] = useState<Phase>('enter')
  const finishedRef = useRef(false)
  const phaseTimersRef = useRef<number[]>([])
  const finishTimerRef = useRef<number | null>(null)
  const isDark = state.theme === 'dark'

  const finish = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    phaseTimersRef.current.forEach((timer) => window.clearTimeout(timer))
    phaseTimersRef.current = []
    setPhase('done')
    finishTimerRef.current = window.setTimeout(() => {
      finishTimerRef.current = null
      onFinish?.()
    }, 100)
  }, [onFinish])

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Keep the finished composition on screen for a relaxed 3.2 seconds
    // before the handoff, while reduced-motion users still get a brief pass.
    const enterTimer = window.setTimeout(() => setPhase('hold'), reduceMotion ? 0 : 850)
    const exitTimer = window.setTimeout(() => setPhase('exit'), reduceMotion ? 80 : 3200)
    const finishTimer = window.setTimeout(finish, reduceMotion ? 120 : 3950)
    phaseTimersRef.current = [enterTimer, exitTimer, finishTimer]

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finish()
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.clearTimeout(enterTimer)
      window.clearTimeout(exitTimer)
      window.clearTimeout(finishTimer)
      phaseTimersRef.current = []
      if (finishTimerRef.current !== null) {
        window.clearTimeout(finishTimerRef.current)
        finishTimerRef.current = null
      }
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [finish])

  if (phase === 'done') return null

  return (
    <div
      className={`simple-splash simple-splash--${isDark ? 'dark' : 'light'} simple-splash--${phase}`}
      role="dialog"
      aria-modal="true"
      aria-label={t(isDark ? 'splash.moonLabel' : 'splash.inkLabel')}
    >
      <div className="simple-splash__ambient" aria-hidden="true" />


      <div className="simple-splash__center">
        <div className="simple-splash__logo-wrap">
          <img
            className="simple-splash__logo"
            src={isDark ? '/logo%20dark.png' : '/logo.png'}
            alt={t('app.name')}
            width="1024"
            height="1024"
            draggable="false"
          />
        </div>

        <div className="simple-splash__copy">
          <h1 className="simple-splash__quote" lang="zh-Hans">{t('splash.quoteDark')}</h1>
          <p className="simple-splash__brand">{t('app.name')} <span aria-hidden="true">·</span> {t('app.tagline')}</p>
        </div>

        <div className="simple-splash__loader" aria-live="polite">
          <span className="simple-splash__pulse-line" aria-hidden="true" />
          <span>{t('splash.loading')}</span>
        </div>
      </div>
    </div>
  )
}
