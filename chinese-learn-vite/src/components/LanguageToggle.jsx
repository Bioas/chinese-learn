import React from 'react';
import { useApp } from '../context/AppContext';

export default function LanguageToggle() {
  const { state, setLanguage } = useApp();
  const lang = state.language || 'en';

  return (
    <>
      {/* Mobile: mini pill */}
      <div
        className="lg:hidden relative h-7 w-16 rounded-full flex items-center px-0.5"
        style={{
          background: 'color-mix(in srgb, var(--bg-card) 70%, transparent)',
          border: '1px solid var(--border-color)',
        }}
      >
        <button
          onClick={() => setLanguage('en')}
          className="relative z-10 flex-1 h-full rounded-full text-[9px] font-bold tracking-widest transition-all duration-300"
          style={{
            color: lang === 'en' ? '#fff' : 'var(--text-muted)',
          }}
          aria-label="English"
        >
          EN
        </button>
        <button
          onClick={() => setLanguage('th')}
          className="relative z-10 flex-1 h-full rounded-full text-[9px] font-bold tracking-widest transition-all duration-300"
          style={{
            color: lang === 'th' ? '#fff' : 'var(--text-muted)',
          }}
          aria-label="ไทย"
        >
          TH
        </button>
        <div
          className="absolute top-0.5 bottom-0.5 rounded-full transition-all duration-300"
          style={{
            width: 'calc(50% - 1px)',
            left: lang === 'en' ? '1px' : 'calc(50% + 0px)',
            background: 'linear-gradient(135deg, var(--accent-from), var(--accent-to))',
            boxShadow: '0 1px 3px var(--accent-glow)',
          }}
        />
      </div>

      {/* Desktop: segmented control */}
      <div
        className="hidden lg:flex relative w-full h-9 rounded-xl items-center p-0.5 select-none"
        style={{
          background: 'color-mix(in srgb, var(--bg-card) 70%, transparent)',
          border: '1px solid var(--border-color)',
        }}
      >
        <button
          onClick={() => setLanguage('en')}
          className="relative z-10 flex-1 h-full rounded-[10px] text-[11px] font-bold tracking-widest transition-all duration-500"
          style={{
            color: lang === 'en' ? '#fff' : 'var(--text-muted)',
          }}
          aria-label="English"
        >
          EN
        </button>
        <button
          onClick={() => setLanguage('th')}
          className="relative z-10 flex-1 h-full rounded-[10px] text-[11px] font-bold tracking-widest transition-all duration-500"
          style={{
            color: lang === 'th' ? '#fff' : 'var(--text-muted)',
          }}
          aria-label="ไทย"
        >
          TH
        </button>

        <div
          className="absolute top-0.5 bottom-0.5 rounded-[10px] transition-all duration-500"
          style={{
            width: 'calc(50% - 2px)',
            left: lang === 'en' ? '2px' : 'calc(50% + 0px)',
            background: 'linear-gradient(135deg, var(--accent-from), var(--accent-to))',
            boxShadow: '0 1px 6px var(--accent-glow)',
          }}
        />
      </div>
    </>
  );
}