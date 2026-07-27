import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import Icon from './Icon';
import { useApp } from '../context/AppContext';
import useTranslation from '../hooks/useTranslation';

export default function Navigation({ mobileMenuOpen, setMobileMenuOpen }) {
  const { t } = useTranslation();
  const { state, setTheme, setLanguage } = useApp();
  const location = useLocation();

  const NAV_ITEMS = [
    { path: '/', label: t('nav.dashboard'), icon: 'dashboard' },
    { path: '/vocabulary', label: t('nav.vocabulary'), icon: 'vocabulary' },
    { path: '/flashcards', label: t('nav.flashcards'), icon: 'flashcards' },
    { path: '/quiz', label: t('nav.quiz'), icon: 'quiz' },
    { path: '/search', label: t('nav.search'), icon: 'search' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 dark:[background:color-mix(in_srgb,var(--bg-secondary)_95%,transparent)] backdrop-blur-md border-b border-slate-200 dark:[border-color:var(--border-color)] px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
            <Icon name="messageDetail" className="text-accent text-2xl" />
            <span className="font-bold text-xl gradient-text">{t('app.name')}</span>
            <span className="text-[10px] text-secondary ml-auto">{t('app.brandSub')}</span>
          </Link>
          <div className="flex items-center gap-1">
            {/* Theme icon button */}
            <button
              onClick={() => setTheme(state.theme === 'dark' ? 'light' : 'dark')}
              className="w-8 h-8 rounded-lg hover:bg-card-hover/50 transition-all duration-300 flex items-center justify-center"
              aria-label="Toggle theme"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            </button>
            {/* Language icon button */}
            <button
              onClick={() => setLanguage(state.language === 'en' ? 'th' : 'en')}
              className="w-10 h-10 rounded-xl hover:bg-card-hover/50 transition-all duration-300 flex items-center justify-center font-bold text-sm"
              style={{ color: 'var(--accent-from)' }}
              aria-label="Toggle language"
            >
              {state.language === 'en' ? 'TH' : 'EN'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-card-hover/50 transition-colors"
              aria-label={t('nav.toggleMenu')}
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
                    : 'hover:text-primary hover:bg-card-hover/50'
                }`}
              >
                <span className="text-xl"><Icon name={item.icon} className={isActive(item.path) ? 'text-accent' : 'nav-icon'} /></span>
                <div className="font-medium">{item.label}</div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col bg-white/70 dark:[background:color-mix(in_srgb,var(--bg-secondary)_80%,transparent)] backdrop-blur-md border-r border-slate-200 dark:[border-color:var(--border-color)] z-50">
        <div className="p-6 border-b border-slate-200 dark:[border-color:var(--border-color)]">
          <Link to="/" className="flex items-start gap-2.5 group">
            <span className="font-bold gradient-text text-4xl leading-none shrink-0 mt-1 group-hover:tracking-[0.08em] transition-all duration-300 ease-out">上山</span>
            <div>
              <h1 className="font-bold text-lg gradient-text">{t('app.name')}</h1>
              <p className="text-xs text-secondary">{t('app.tagline')}</p>
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
                  : 'hover:text-primary hover:bg-card-hover/50'
              }`}
            >
              <span className="text-xl transition-transform group-hover:scale-110"><Icon name={item.icon} className={isActive(item.path) ? 'text-accent' : 'nav-icon'} /></span>
              <div className="font-medium text-sm text-slate-800 dark:text-[var(--text-primary)]">{item.label}</div>
              {isActive(item.path) && (
                <div className="ml-auto w-1.5 h-8 rounded-full bg-accent-gradient" />
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:[border-color:var(--border-color)] space-y-2">
          <div className="glass-card p-3 space-y-2.5">
            <p className="text-[10px] font-semibold tracking-wider uppercase text-muted text-center">{t('sidebar.interface')}</p>
            <div className="flex items-center gap-2.5">
              <div className="flex-1 min-w-0">
                <ThemeToggle />
              </div>
              <div className="flex-1 min-w-0">
                <LanguageToggle />
              </div>
            </div>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-muted mb-1">{t('sidebar.studyDaily')}</p>
            <p className="text-lg font-bold gradient-text">{t('sidebar.encouragement')}</p>
            <p className="text-[10px] text-muted mt-1">{t('sidebar.keepGoing')}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
