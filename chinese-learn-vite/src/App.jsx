import { Routes, Route } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import Navigation from './components/Navigation'
import ParticleBackground from './components/ParticleBackground'
import ThemeSplash from './components/ThemeSplash'
import Dashboard from './pages/Dashboard'
import Vocabulary from './pages/Vocabulary'
import Flashcards from './pages/Flashcards'
import Quiz from './pages/Quiz'
import Search from './pages/Search'
import WordMap from './pages/WordMap'
import Conversations from './pages/Conversations'

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
      {/* Particle background */}
      <ParticleBackground />

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
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/vocabulary" element={<Vocabulary />} />
              <Route path="/flashcards" element={<Flashcards />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/search" element={<Search />} />
              <Route path="/wordmap" element={<WordMap />} />
              <Route path="/conversations" element={<Conversations />} />
            </Routes>
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
