import React from 'react';
import { useApp } from '../context/AppContext';
import useTranslation from '../hooks/useTranslation';

export default function LanguageToggle() {
  const { t } = useTranslation();
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
          className="relative z-10 flex-1 h-full rounded-full text-[9px] font-bold tracking-widest transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            color: lang === 'en' ? '#fff' : 'var(--text-muted)',
            textShadow: lang === 'en' ? '0 0 6px rgba(255,255,255,0.4)' : 'none',
          }}
          aria-label={t('lang.en')}
        >
          <span className={`inline-block transition-all duration-300 ${lang === 'en' ? 'scale-100' : 'scale-90'}`}>
            EN
          </span>
        </button>
        <button
          onClick={() => setLanguage('th')}
          className="relative z-10 flex-1 h-full rounded-full text-[9px] font-bold tracking-widest transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            color: lang === 'th' ? '#fff' : 'var(--text-muted)',
            textShadow: lang === 'th' ? '0 0 6px rgba(255,255,255,0.4)' : 'none',
          }}
          aria-label={t('lang.th')}
        >
          <span className={`inline-block transition-all duration-300 ${lang === 'th' ? 'scale-100' : 'scale-90'}`}>
            TH
          </span>
        </button>
        <div
          className="absolute top-0.5 bottom-0.5 rounded-full"
          style={{
            width: 'calc(50% - 1px)',
            left: lang === 'en' ? '1px' : 'calc(50% + 0px)',
            background: 'linear-gradient(135deg, var(--accent-from), var(--accent-to))',
            boxShadow: '0 1px 3px var(--accent-glow)',
            transition: 'left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s',
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
          className="relative z-10 flex-1 h-full rounded-[10px] text-[11px] font-bold tracking-widest transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            color: lang === 'en' ? '#fff' : 'var(--text-muted)',
            textShadow: lang === 'en' ? '0 0 8px rgba(255,255,255,0.3)' : 'none',
          }}
          aria-label={t('lang.en')}
        >
          <span className={`inline-block transition-all duration-400 ${lang === 'en' ? 'scale-100 translate-y-0' : 'scale-90 translate-y-px'}`}>
            EN
          </span>
        </button>
        <button
          onClick={() => setLanguage('th')}
          className="relative z-10 flex-1 h-full rounded-[10px] text-[11px] font-bold tracking-widest transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            color: lang === 'th' ? '#fff' : 'var(--text-muted)',
            textShadow: lang === 'th' ? '0 0 8px rgba(255,255,255,0.3)' : 'none',
          }}
          aria-label={t('lang.th')}
        >
          <span className={`inline-block transition-all duration-400 ${lang === 'th' ? 'scale-100 translate-y-0' : 'scale-90 translate-y-px'}`}>
            TH
          </span>
        </button>

        <div
          className="absolute top-0.5 bottom-0.5 rounded-[10px]"
          style={{
            width: 'calc(50% - 2px)',
            left: lang === 'en' ? '2px' : 'calc(50% + 0px)',
            background: 'linear-gradient(135deg, var(--accent-from), var(--accent-to))',
            boxShadow: '0 1px 6px var(--accent-glow)',
            transition: 'left 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s',
          }}
        />
      </div>
    </>
  );
}