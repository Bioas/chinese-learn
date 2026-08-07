import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from './Icon';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import useTranslation from '../hooks/useTranslation';

const Login = lazy(() => import('../pages/Login'));

const SYNC_STYLES = {
  idle:    { dot: 'text-green-500',         label: 'auth.syncIdle',    pulse: false },
  saving:  { dot: 'text-amber-400',         label: 'auth.syncSaving',  pulse: true  },
  saved:   { dot: 'text-green-500',         label: 'auth.syncSaved',   pulse: false },
  offline: { dot: 'text-slate-500',         label: 'auth.syncOffline', pulse: false },
  error:   { dot: 'text-red-500',           label: 'auth.syncError',   pulse: true  },
};

// Hex colors used by the avatar status dot + popover indicator
const SYNC_DOT_COLORS = {
  idle:    '#22c55e',  // green-500 — "Ready / Synced" reads as healthy
  saving:  '#fbbf24',  // amber-400
  saved:   '#22c55e',  // green-500 — same as idle, so the 2.5s post-save flash
                        //   becomes a subtle "Saved" label change rather than a
                        //   colour jump that distracts the user
  offline: '#6b6358',  // darker slate
  error:   '#ef4444',  // red-500
};

export default function Navigation({ mobileMenuOpen, setMobileMenuOpen }) {
  const { t } = useTranslation();
  const { state, setTheme, setLanguage, syncStatus, lastSyncError } = useApp();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showLogin, setShowLogin] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuDesktopRef = useRef(null);
  const userMenuMobileRef = useRef(null);

  // Close the user menu on outside-click or Escape
  useEffect(() => {
    if (!showUserMenu) return;
    const handleClickOutside = (e) => {
      if (
        userMenuDesktopRef.current && !userMenuDesktopRef.current.contains(e.target) &&
        userMenuMobileRef.current && !userMenuMobileRef.current.contains(e.target)
      ) {
        setShowUserMenu(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [showUserMenu]);

  const syncStyle = SYNC_STYLES[syncStatus] || SYNC_STYLES.idle;
  const syncLabel = user ? t(syncStyle.label) : t('auth.syncOffline');
  const syncDotColor = SYNC_DOT_COLORS[syncStatus] || SYNC_DOT_COLORS.idle;
  // Combined tooltip so users can self-diagnose offline/error without opening the popover
  const syncTooltip = lastSyncError ? `${syncLabel}: ${lastSyncError}` : syncLabel;
  // Make the corner dot pulse when offline-with-error too — visually demanding
  const statusIsPulsing =
    syncStyle.pulse || (syncStatus === 'offline' && Boolean(lastSyncError));
  const userInitial = user?.email?.charAt(0).toUpperCase() || '?';
  // Preferred display label: full_name from OAuth > email-prefix > generic.
  // Always force the first character to uppercase so "nanti.niti@gmail.com"
  // renders as "Nanti.niti" instead of "nanti.niti" (or "JOHN DOE" stays "JOHN DOE"
  // — only the very first letter is normalized, the rest is preserved as-typed).
  const rawDisplayName =
    user?.user_metadata?.full_name?.trim() ||
    user?.email?.split('@')[0] ||
    'User';
  const displayName = rawDisplayName
    ? rawDisplayName.charAt(0).toUpperCase() + rawDisplayName.slice(1)
    : rawDisplayName;

  const NAV_ITEMS = [
    { path: '/', label: t('nav.dashboard'), icon: 'dashboard' },
    { path: '/vocabulary', label: t('nav.vocabulary'), icon: 'vocabulary' },
    { path: '/wordmap', label: t('nav.wordmap'), icon: 'wordmap' },
    { path: '/conversations', label: t('nav.conversation'), icon: 'messageDetail' },
    { path: '/hsk-grammar', label: t('nav.grammar'), icon: 'library' },
    { path: '/flashcards', label: t('nav.flashcards'), icon: 'flashcards' },
    { path: '/quiz', label: t('nav.quiz'), icon: 'quiz' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Popover body — shared by desktop + mobile, identical markup
  const renderUserMenu = (refProp, animClass) => (
    <div
      ref={refProp}
      role="menu"
      aria-label={t('auth.userMenu') || 'User menu'}
      className={`${animClass} rounded-xl overflow-hidden`}
      style={{
        background: 'color-mix(in srgb, var(--bg-card) 96%, transparent)',
        border: '1px solid var(--border-color)',
        boxShadow: '0 14px 40px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Account header — gradient accent bar on the left */}
      <div className="relative px-3.5 pt-3 pb-2.5">
        <div
          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
          style={{ background: 'var(--accent-gradient)' }}
        />
        <p className="text-[9px] uppercase tracking-[0.08em] text-secondary font-semibold mb-1">
          {t('auth.signedIn') || 'Signed in as'}
        </p>
        <p className="text-[11px] text-primary font-medium leading-tight" style={{ wordBreak: 'break-all' }}>
          {user.email}
        </p>
      </div>

      {/* Sync status row */}
      <div className="px-3.5 pb-2.5 flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${statusIsPulsing ? 'status-dot-pulse' : ''}`}
          style={{ backgroundColor: syncDotColor }}
          title={syncTooltip}
        />
        <span className="text-[10px] text-secondary font-medium" title={syncTooltip}>
          {syncLabel}
        </span>
      </div>

      {/* Gradient divider */}
      <div
        className="mx-3.5"
        style={{
          height: '1px',
          background:
            'linear-gradient(to right, transparent, var(--border-color) 25%, var(--border-color) 75%, transparent)',
        }}
      />

      {/* Sign out */}
      <button
        role="menuitem"
        onClick={() => { logout(); setShowUserMenu(false); }}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-red-500/10 active:scale-[0.98] transition-all duration-200 group/logout"
      >
        <svg
          className="w-3.5 h-3.5 transition-transform duration-200 group-hover/logout:translate-x-0.5"
          viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ color: 'color-mix(in srgb, var(--text-muted) 80%, red)' }}
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        <span
          className="text-[11px] font-medium transition-colors group-hover/logout:text-red-500"
          style={{ color: 'var(--text-primary)' }}
        >
          {t('auth.logout')}
        </span>
      </button>
    </div>
  );

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
      <div ref={userMenuMobileRef} className="lg:hidden sticky top-0 z-50 backdrop-blur-md" style={{ background: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between gap-2 px-4 py-2.5">
          {/* Brand — original logo + name + subtitle */}
          <Link to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
            <Icon name="messageDetail" className="text-accent text-2xl" />
            <span className="font-bold text-xl gradient-text">{t('app.name')}</span>
            <span className="text-[10px] text-secondary ml-auto">{t('app.brandSub')}</span>
          </Link>

          {/* Right cluster: glass pill grouping all actions */}
          <div
            className="flex items-center p-1 gap-0.5 rounded-full"
            style={{
              background: 'color-mix(in srgb, var(--bg-card) 70%, transparent)',
              border: '1px solid color-mix(in srgb, var(--border-color) 55%, transparent)',
              boxShadow: '0 1px 6px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.06)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {/* Theme icon button */}
            <button
              onClick={() => setTheme(state.theme === 'dark' ? 'light' : 'dark')}
              className="w-8 h-8 rounded-full hover:bg-black/[0.06] dark:hover:bg-white/[0.08] active:scale-90 transition-all duration-200 flex items-center justify-center text-secondary"
              aria-label={state.theme === 'dark' ? t('theme.lightMode') : t('theme.darkMode')}
            >
              <svg
                key={state.theme}
                className="w-3.5 h-3.5"
                style={{ animation: 'iconSpinIn 0.35s ease-out', transformOrigin: 'center' }}
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
              className="w-8 h-8 rounded-full hover:bg-black/[0.06] dark:hover:bg-white/[0.08] active:scale-90 transition-all duration-200 flex items-center justify-center font-bold text-[10px]"
              style={{ color: 'var(--accent-from)' }}
              aria-label="Toggle language"
            >
              <span
                key={state.language}
                style={{ display: 'inline-block', animation: 'iconSpinIn 0.35s ease-out' }}
              >
                {state.language === 'en' ? 'TH' : 'EN'}
              </span>
            </button>

            {/* Subtle divider between settings and user actions */}
            <div className="w-px h-4 mx-0.5 opacity-50" style={{ background: 'var(--border-color)' }} aria-hidden />
            {/* Login / User avatar — mobile */}
            {user ? (
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="relative active:scale-90 transition-all duration-200 group"
                aria-label={t('auth.userMenu') || 'User menu'}
                aria-expanded={showUserMenu}
                aria-haspopup="menu"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 transition-all duration-200 group-hover:scale-110"
                  style={{
                    background: 'var(--accent-gradient)',
                    boxShadow: '0 0 0 1.5px color-mix(in srgb, var(--bg-card) 80%, transparent), 0 2px 6px var(--accent-glow)',
                  }}
                >
                  {userInitial}
                </div>
                {/* Status dot in corner */}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border ${syncStyle.pulse ? 'status-dot-pulse' : ''}`}
                  style={{
                    backgroundColor: syncDotColor,
                    borderColor: 'var(--bg-card)',
                  }}
                  title={syncLabel}
                />
              </button>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="w-8 h-8 rounded-full hover:bg-black/[0.06] dark:hover:bg-white/[0.08] active:scale-90 transition-all duration-200 flex items-center justify-center"
                style={{ color: 'var(--accent-from)' }}
                aria-label={t('auth.login')}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-8 h-8 rounded-full hover:bg-black/[0.06] dark:hover:bg-white/[0.08] active:scale-90 transition-all duration-300 flex items-center justify-center relative text-secondary"
              aria-label={t('nav.toggleMenu')}
            >
              <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out ${
                mobileMenuOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
              }`}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </div>
              <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out ${
                mobileMenuOpen ? 'scale-100 opacity-100 rotate-0' : 'scale-0 opacity-0 rotate-90'
              }`}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* User menu popover — mobile (under header, anchored right) */}
        {user && showUserMenu && (
          <div className="absolute right-3 top-full mt-2 w-60 z-[60]">
            {renderUserMenu(null, 'menu-pop-in-down')}
          </div>
        )}

        {/* Mobile menu with animation */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${
            mobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="pt-1 pb-2 space-y-1" onClick={() => { setMobileMenuOpen(false); setShowUserMenu(false); }}>
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

        <div ref={userMenuDesktopRef} className="p-3 pt-2.5 border-t relative" style={{ borderColor: 'var(--border-color)' }}>
          {/* User menu popover — opens upward, overlays nav area, dismissed on outside-click */}
          {user && showUserMenu && (
            <div className="absolute left-2 right-2 bottom-full mb-2 z-[60]">
              {renderUserMenu(null, 'menu-pop-in')}
            </div>
          )}

          <div
            className="rounded-xl overflow-hidden transition-all duration-300"
            style={{
              background: 'color-mix(in srgb, var(--bg-card) 70%, transparent)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            {/* Top row: avatar button (left) + theme/lang icons (right) */}
            <div className="px-3 pt-2.5 pb-2">
              {user ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:scale-[0.97] transition-all duration-200 group flex-1 min-w-0"
                    aria-label={t('auth.userMenu') || 'User menu'}
                    aria-expanded={showUserMenu}
                    aria-haspopup="menu"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <div className="relative shrink-0">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-bold transition-all duration-200 group-hover:scale-110"
                        style={{
                          background: 'var(--accent-gradient)',
                          boxShadow: '0 2px 8px var(--accent-glow)',
                        }}
                      >
                        {userInitial}
                      </div>
                      {/* Status dot */}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${statusIsPulsing ? 'status-dot-pulse' : ''}`}
                        style={{
                          backgroundColor: syncDotColor,
                          borderColor: 'var(--bg-card)',
                        }}
                        title={syncTooltip}
                      />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-[11px] font-semibold leading-tight truncate">
                        {displayName}
                      </p>
                      <p
                        className={`text-[9px] leading-tight truncate mt-0.5 ${syncStyle.dot}`}
                        title={syncTooltip}
                      >
                        {syncLabel}
                      </p>
                    </div>
                    <svg
                      className={`w-3 h-3 transition-transform duration-200 shrink-0 ${showUserMenu ? 'rotate-180' : ''}`}
                      viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  <div className="flex items-center gap-0.5 shrink-0">
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
      {showLogin && (
        <Suspense fallback={null}>
          <Login onClose={() => setShowLogin(false)} />
        </Suspense>
      )}
    </>
  );
}
