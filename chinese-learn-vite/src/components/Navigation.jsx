import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from './Icon';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import Login from '../pages/Login';
import useTranslation from '../hooks/useTranslation';

const SYNC_STYLES = {
  idle:    { dot: 'text-slate-400',         label: 'auth.syncIdle',    pulse: false },
  saving:  { dot: 'text-amber-400',         label: 'auth.syncSaving',  pulse: true  },
  saved:   { dot: 'text-green-500',         label: 'auth.syncSaved',   pulse: false },
  offline: { dot: 'text-slate-500',         label: 'auth.syncOffline', pulse: false },
  error:   { dot: 'text-red-500',           label: 'auth.syncError',   pulse: true  },
};

export default function Navigation({ mobileMenuOpen, setMobileMenuOpen }) {
  const { t } = useTranslation();
  const { state, setTheme, setLanguage, syncStatus } = useApp();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showLogin, setShowLogin] = useState(false);

  const syncStyle = SYNC_STYLES[syncStatus] || SYNC_STYLES.idle;
  const syncLabel = user ? t(syncStyle.label) : t('auth.syncOffline');

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
            {/* Login / User avatar — mobile */}
            {user ? (
              <div className="flex items-center gap-1.5 mr-0.5">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                  style={{ background: 'var(--accent-gradient)' }}
                >
                  {user.email?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex flex-col items-start max-w-[80px]">
                  <p className="text-[9px] font-medium text-primary leading-tight truncate w-full">{user.email}</p>
                  <p
                    className={`text-[7px] leading-tight flex items-center gap-1 ${syncStyle.dot}`}
                    title={syncLabel}
                  >
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full bg-current ${syncStyle.pulse ? 'animate-pulse' : ''}`}
                    />
                    <span className="truncate max-w-[64px]">{syncLabel}</span>
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="w-10 h-10 rounded-xl hover:bg-card-hover/50 hover:scale-110 active:scale-90 transition-all duration-200 flex items-center justify-center"
                style={{ color: 'var(--accent-from)' }}
                aria-label={t('auth.login')}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
              </button>
            )}
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
          {/* Mobile logout — only when logged in */}
          {user && (
            <div
              className={`pt-1.5 pb-1 ${
                mobileMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-5'
              }`}
              style={{ transition: 'all 0.3s ease-out', transitionDelay: mobileMenuOpen ? `${NAV_ITEMS.length * 60 + 30}ms` : '0ms' }}
            >
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full hover:bg-red-500/5 active:scale-[0.97]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'color-mix(in srgb, var(--text-muted) 80%, red)' }}>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span className="text-sm font-medium" style={{ color: 'color-mix(in srgb, var(--text-muted) 80%, red)' }}>
                  {t('auth.logout')}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Desktop sidebar — parchment/ink aesthetic */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col backdrop-blur-md border-r z-50"
        style={{
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-color)',
        }}
      >
        <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
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

        <div className="p-3 pt-2.5 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <div
            className="rounded-xl overflow-hidden transition-all duration-300"
            style={{
              background: 'color-mix(in srgb, var(--bg-card) 70%, transparent)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            {/* Top row: login (left) + theme/lang icons (right) */}
            <div className="px-3 pt-2.5 pb-2">
              {user ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                      style={{ background: 'var(--accent-gradient)' }}
                    >
                      {user.email?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium text-primary truncate">{user.email}</p>
                      <p
                        className={`text-[7px] flex items-center gap-1 ${syncStyle.dot}`}
                        title={syncLabel}
                      >
                        <span
                          className={`inline-block w-1.5 h-1.5 rounded-full bg-current ${syncStyle.pulse ? 'animate-pulse' : ''}`}
                        />
                        <span className="truncate max-w-[90px]">{syncLabel}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={logout}
                      className="text-[9px] font-medium transition-all duration-200 px-2 py-1 rounded-md hover:bg-red-500/10 active:scale-95"
                      style={{ color: 'color-mix(in srgb, var(--text-muted) 80%, red)' }}
                    >
                      {t('auth.logout')}
                    </button>
                    <div className="flex items-center gap-0.5 ml-1">
                      <div className="relative flex items-center justify-center w-7 h-7 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all duration-200 cursor-pointer"
                        onClick={() => setTheme(state.theme === 'dark' ? 'light' : 'dark')}
                        title={state.theme === 'dark' ? t('theme.lightMode') : t('theme.darkMode')}
                      >
                        <svg key={state.theme} className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)', animation: 'iconSpinIn 0.35s ease-out', transformOrigin: 'center' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          {state.theme === 'dark' ? (
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                          ) : (
                            <><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></>
                          )}
                        </svg>
                      </div>
                      <button onClick={() => setLanguage(state.language === 'en' ? 'th' : 'en')} className="relative flex items-center justify-center w-7 h-7 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all duration-200 font-bold text-[11px]" style={{ color: 'var(--accent-from)' }} title={state.language === 'en' ? 'TH' : 'EN'}>
                        <span key={state.language} style={{ display: 'inline-block', animation: 'iconSpinIn 0.35s ease-out' }}>{state.language === 'en' ? 'TH' : 'EN'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <button onClick={() => setShowLogin(true)} className="group flex-1 flex items-center gap-2.5 px-3 py-[6px] rounded-xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.97]" style={{ background: 'color-mix(in srgb, var(--bg-card-hover) 50%, transparent)', border: '1px solid var(--border-color)', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg shrink-0" style={{ background: 'var(--accent-gradient)', boxShadow: '0 0 8px var(--accent-glow)' }}><Icon name="user" /></div>
                    <span className="flex-1 text-[11px] font-semibold text-left" style={{ color: 'var(--text-primary)' }}>{t('auth.login')}</span>
                    <svg className="w-3.5 h-3.5 transition-all duration-300 group-hover:translate-x-0.5" style={{ color: 'var(--text-muted)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                  <div className="flex items-center gap-0.5">
                    <div className="relative flex items-center justify-center w-7 h-7 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all duration-200 cursor-pointer"
                      onClick={() => setTheme(state.theme === 'dark' ? 'light' : 'dark')}
                      title={state.theme === 'dark' ? t('theme.lightMode') : t('theme.darkMode')}
                    >
                      <svg key={state.theme} className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)', animation: 'iconSpinIn 0.35s ease-out', transformOrigin: 'center' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        {state.theme === 'dark' ? (
                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        ) : (
                          <><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></>
                        )}
                      </svg>
                    </div>
                    <button onClick={() => setLanguage(state.language === 'en' ? 'th' : 'en')} className="relative flex items-center justify-center w-7 h-7 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all duration-200 font-bold text-[11px]" style={{ color: 'var(--accent-from)' }} title={state.language === 'en' ? 'TH' : 'EN'}>
                      <span key={state.language} style={{ display: 'inline-block', animation: 'iconSpinIn 0.35s ease-out' }}>{state.language === 'en' ? 'TH' : 'EN'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Decorative divider */}
            <div className="mx-3" style={{ height: '1px', background: 'linear-gradient(to right, transparent, var(--border-color) 20%, var(--border-color) 80%, transparent)' }} />

            {/* Encouragement — 3 lines */}
            <div className="px-3 pb-3 pt-2.5">
              <div className="flex flex-col items-center justify-center gap-0.5 text-center">
                <span className="text-[12px] text-muted/50 tracking-wide">{t('sidebar.studyDaily')}</span>
                <span className="text-[15px] font-bold gradient-text leading-tight">{t('sidebar.encouragement')}</span>
                <span className="text-[11px] text-muted/50">{t('sidebar.keepGoing')}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Login modal */}
      {showLogin && <Login onClose={() => setShowLogin(false)} />}
    </>
  );
}
