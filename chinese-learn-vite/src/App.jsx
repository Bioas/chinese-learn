import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navigation from './components/Navigation'
import ParticleBackground from './components/ParticleBackground'
import ThemeSplash from './components/ThemeSplash'
import Dashboard from './pages/Dashboard'
import Vocabulary from './pages/Vocabulary'
import Flashcards from './pages/Flashcards'
import Quiz from './pages/Quiz'
import Search from './pages/Search'

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('splashShown')
  })

  useEffect(() => {
    if (!showSplash) sessionStorage.setItem('splashShown', 'true')
  }, [showSplash])

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
          className="lg:pl-64 pt-16 lg:pt-0 min-h-screen"
          onClick={() => mobileMenuOpen && setMobileMenuOpen(false)}
        >
          <div className="max-w-7xl mx-auto p-4 lg:p-8 animate-fade-in">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/vocabulary" element={<Vocabulary />} />
              <Route path="/flashcards" element={<Flashcards />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/search" element={<Search />} />
            </Routes>
          </div>
        </main>
      </div>
    </>
  )
}
