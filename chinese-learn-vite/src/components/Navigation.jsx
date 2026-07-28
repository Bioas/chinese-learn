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
    { path: '/wordmap', label: t('nav.wordmap'), icon: 'wordmap' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Blur backdrop — outside header to avoid nested backdrop-filter suppression */}
      <div
        className={`fixed inset-0 z-40 bg-white/[0.01] ${
          mobileMenuOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        style={{
          transition: 'opacity 0.3s ease-out, backdrop-filter 0.3s ease-out, -webkit-backdrop-filter 0.3s ease-out',
          backdropFilter: mobileMenuOpen ? 'blur(4px)' : 'blur(0px)',
          WebkitBackdropFilter: mobileMenuOpen ? 'blur(4px)' : 'blur(0px)',
        }}
        onClick={() => setMobileMenuOpen(false)}
      />

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
              className="w-8 h-8 rounded-lg hover:bg-card-hover/50 hover:scale-110 active:scale-90 transition-all duration-200 flex items-center justify-center"
              aria-label={state.theme === 'dark' ? t('theme.lightMode') : t('theme.darkMode')}
            >
              <svg
                key={state.theme}
                className="w-4 h-4"
                style={{
                  animation: 'iconSpinIn 0.35s ease-out',
                  transformOrigin: 'center',
                }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                {state.theme === 'dark' ? (
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                ) : (
                  <>
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </>
                )}
              </svg>
            </button>
            {/* Language icon button */}
            <button
              onClick={() => setLanguage(state.language === 'en' ? 'th' : 'en')}
              className="w-10 h-10 rounded-xl hover:bg-card-hover/50 hover:scale-110 active:scale-90 transition-all duration-200 flex items-center justify-center font-bold text-sm"
              style={{ color: 'var(--accent-from)' }}
              aria-label="Toggle language"
            >
              <span
                key={state.language}
                style={{
                  display: 'inline-block',
                  animation: 'iconSpinIn 0.35s ease-out',
                }}
              >
                {state.language === 'en' ? 'TH' : 'EN'}
              </span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-10 h-10 rounded-xl hover:bg-card-hover/50 transition-all duration-300 flex items-center justify-center relative"
              aria-label={t('nav.toggleMenu')}
            >
              <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out ${
                mobileMenuOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
              }`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </div>
              <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out ${
                mobileMenuOpen ? 'scale-100 opacity-100 rotate-0' : 'scale-0 opacity-0 rotate-90'
              }`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile menu with animation */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${
            mobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="pt-1 pb-2 space-y-1" onClick={() => setMobileMenuOpen(false)}>
            {NAV_ITEMS.map((item, index) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive(item.path)
                    ? 'bg-accent-subtle border-accent-subtle text-accent'
                    : 'hover:text-primary hover:bg-card-hover/50'
                } ${
                  mobileMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-5'
                }`}
                style={{ transitionDelay: mobileMenuOpen ? `${index * 60}ms` : '0ms' }}
              >
                <span className={`text-xl transition-transform duration-300 ${mobileMenuOpen ? 'scale-100' : 'scale-75'}`}>
                  <Icon name={item.icon} className={isActive(item.path) ? 'text-accent' : 'nav-icon'} />
                </span>
                <div className={`font-medium transition-all duration-300 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
                  style={{ transitionDelay: mobileMenuOpen ? `${index * 60 + 30}ms` : '0ms' }}
                >
                  {item.label}
                </div>
              </Link>
            ))}
          </div>
        </div>
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
