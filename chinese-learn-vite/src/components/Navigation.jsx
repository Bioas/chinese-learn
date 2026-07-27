import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import Icon from './Icon';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: 'dashboard', labelThai: 'แดชบอร์ด' },
  { path: '/vocabulary', label: 'Vocabulary', icon: 'vocabulary', labelThai: 'คำศัพท์' },
  { path: '/flashcards', label: 'Flashcards', icon: 'flashcards', labelThai: 'บัตรคำ' },
  { path: '/quiz', label: 'Quiz', icon: 'quiz', labelThai: 'แบบทดสอบ' },
  { path: '/search', label: 'Search', icon: 'search', labelThai: 'ค้นหา' },
];

export default function Navigation({ mobileMenuOpen, setMobileMenuOpen }) {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 dark:bg-slate-900/95 bg-white/95 backdrop-blur-md border-b dark:border-slate-800 border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>                <Icon name="messageDetail" className="text-2xl" />
            <span className="font-bold text-lg gradient-text">Chinese</span>
            <span className="text-[10px] dark:text-slate-500 text-slate-400 ml-auto">学习</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle menu"
            >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="mt-3 pb-2 space-y-1" onClick={() => setMobileMenuOpen(false)}>
            {NAV_ITEMS.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive(item.path)
                    ? 'bg-accent-subtle border-accent-subtle text-accent'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                <span className="text-xl"><Icon name={item.icon} /></span>
                <div>
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-slate-500">{item.labelThai}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col dark:bg-slate-900/50 bg-white/70 backdrop-blur-md border-r dark:border-slate-800 border-slate-200 z-50">
        <div className="p-6 border-b dark:border-slate-800 border-slate-200">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-accent-gradient flex items-center justify-center text-xl shadow-lg group-hover:shadow-accent transition-shadow">
              <Icon name="messageDetail" className="text-white text-xl" />
            </div>
            <div>
              <h1 className="font-bold text-lg gradient-text">Chinese</h1>
              <p className="text-xs dark:text-slate-500 text-slate-400">Learn Mandarin</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                isActive(item.path)
                  ? 'bg-accent-subtle border-accent-subtle text-accent'
                  : 'dark:text-slate-400 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <span className="text-xl transition-transform group-hover:scale-110"><Icon name={item.icon} /></span>
              <div>
                <div className="font-medium text-sm text-slate-800 dark:text-white">{item.label}</div>
                <div className="text-[10px] dark:text-slate-500 text-slate-400">{item.labelThai}</div>
              </div>
              {isActive(item.path) && (
                <div className="ml-auto w-1.5 h-8 rounded-full bg-accent-gradient" />
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t dark:border-slate-800 border-slate-200 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-slate-500 dark:text-slate-500">Interface</span>
            <ThemeToggle />
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-500 mb-1">每天学习</p>
            <p className="text-lg font-bold gradient-text">加油！</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1">Keep going!</p>
          </div>
        </div>
      </aside>
    </>
  );
}
