import React from 'react';
import { useApp } from '../context/AppContext';
import useTranslation from '../hooks/useTranslation';

export default function ThemeToggle() {
  const { t } = useTranslation();
  const { state, setTheme } = useApp();
  const isDark = state.theme === 'dark';

  return (
    <>
      {/* Mobile: mini pill */}
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="lg:hidden relative h-7 w-14 rounded-full flex items-center px-1 transition-all duration-300 hover:scale-105 active:scale-95"
        style={{
          background: isDark
            ? 'color-mix(in srgb, var(--accent-from) 15%, transparent)'
            : 'color-mix(in srgb, var(--accent-from) 10%, transparent)',
          border: '1px solid var(--border-color)',
        }}
        aria-label={isDark ? t('theme.lightMode') : t('theme.darkMode')}
      >
        <span className="flex-1 flex items-center justify-center z-10">
          <svg
            key={isDark ? 'dark-sun' : 'light-sun'}
            className="w-3 h-3"
            style={{
              color: isDark ? 'var(--text-muted)' : 'var(--accent-from)',
              opacity: isDark ? 0.35 : 1,
              animation: isDark ? 'none' : 'iconSpinIn 0.4s ease-out',
              transformOrigin: 'center',
            }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
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
        </span>
        <span className="flex-1 flex items-center justify-center z-10">
          <svg
            key={isDark ? 'dark-moon' : 'light-moon'}
            className="w-3 h-3"
            style={{
              color: isDark ? 'var(--accent-from)' : 'var(--text-muted)',
              opacity: isDark ? 1 : 0.35,
              animation: isDark ? 'iconSpinIn 0.4s ease-out' : 'none',
              transformOrigin: 'center',
            }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </span>          <div
            className="absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full"
            style={{
              left: isDark ? 'calc(50% + 1px)' : '1px',
              background: 'linear-gradient(135deg, var(--accent-from), var(--accent-to))',
              boxShadow: isDark
                ? '0 1px 3px var(--accent-glow)'
                : '0 1px 3px var(--accent-glow)',
              transition: 'left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s',
            }}
          />
      </button>

      {/* Desktop: pill toggle */}
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="hidden lg:flex relative w-full h-9 rounded-xl items-center select-none hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        style={{
          background: isDark
            ? 'color-mix(in srgb, var(--accent-from) 12%, transparent)'
            : 'color-mix(in srgb, var(--accent-from) 8%, transparent)',
          border: '1px solid var(--border-color)',
        }}
        aria-label={isDark ? t('theme.lightMode') : t('theme.darkMode')}
      >
        <span className="flex-1 flex items-center justify-center z-10">
          <svg
            key={isDark ? 'dark-sun' : 'light-sun'}
            className="w-3.5 h-3.5"
            style={{
              color: isDark ? 'var(--text-muted)' : 'var(--accent-from)',
              opacity: isDark ? 0.4 : 1,
              animation: isDark ? 'none' : 'iconSpinIn 0.5s ease-out',
              transformOrigin: 'center',
            }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
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
        </span>

        <span className="flex-1 flex items-center justify-center z-10">
          <svg
            key={isDark ? 'dark-moon' : 'light-moon'}
            className="w-3.5 h-3.5"
            style={{
              color: isDark ? 'var(--accent-from)' : 'var(--text-muted)',
              opacity: isDark ? 1 : 0.4,
              animation: isDark ? 'iconSpinIn 0.5s ease-out' : 'none',
              transformOrigin: 'center',
            }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </span>          <div
            className="absolute top-0.5 bottom-0.5 w-1/2 rounded-[10px]"
            style={{
              left: isDark ? 'calc(50% + 2px)' : '2px',
              background: 'linear-gradient(135deg, var(--accent-from), var(--accent-to))',
              boxShadow: '0 1px 4px var(--accent-glow)',
              transition: 'left 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s',
            }}
          />
      </button>
    </>
  );
}