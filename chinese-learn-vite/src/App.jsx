import { Routes, Route } from 'react-router-dom'
import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import Navigation from './components/Navigation'
import ThemeSplash from './components/ThemeSplash'

// Route-level code splitting — each page is a separate chunk loaded on demand
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Vocabulary = lazy(() => import('./pages/Vocabulary'))
const Flashcards = lazy(() => import('./pages/Flashcards'))
const Quiz = lazy(() => import('./pages/Quiz'))
const WordMap = lazy(() => import('./pages/WordMap'))
const Conversations = lazy(() => import('./pages/Conversations'))

// ParticleBackground is heavy and not critical — lazy load it
const ParticleBackground = lazy(() => import('./components/ParticleBackground'))

// Minimal loading placeholder for route transitions
function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24 animate-fade-in">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-7 h-7 rounded-full animate-spin"
          style={{
            border: '2px solid var(--border-color)',
            borderTopColor: 'var(--accent-from)',
          }}
        />
        <span className="text-xs text-muted">Loading…</span>
      </div>
    </div>
  )
}

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('splashShown')
  })
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    if (!showSplash) sessionStorage.setItem('splashShown', 'true')
  }, [showSplash])

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  if (showSplash) {
    return <ThemeSplash onFinish={() => setShowSplash(false)} />
  }

  return (
    <>
      {/* Particle background — lazy loaded */}
      <Suspense fallback={null}>
        <ParticleBackground />
      </Suspense>

      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Navigation
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />
        <main
          className="lg:pl-64 min-h-screen"
          onClick={() => mobileMenuOpen && setMobileMenuOpen(false)}
        >
          <div className="max-w-7xl mx-auto px-4 pt-3 pb-4 lg:p-8 animate-fade-in">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/vocabulary" element={<Vocabulary />} />
                <Route path="/flashcards" element={<Flashcards />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/wordmap" element={<WordMap />} />
                <Route path="/conversations" element={<Conversations />} />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>

      {/* Go to top button */}
      <button
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg active:scale-90"
        style={{
          background: 'var(--accent-gradient)',
          color: '#fff',
          opacity: showScrollTop ? 1 : 0,
          transform: showScrollTop ? 'scale(1) translateY(0)' : 'scale(0.6) translateY(10px)',
          pointerEvents: showScrollTop ? 'auto' : 'none',
          boxShadow: '0 4px 20px var(--accent-glow)',
        }}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
    </>
  )
}
