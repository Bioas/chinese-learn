import React, { useEffect } from 'react';
import useSpeech from '../hooks/useSpeech';
import useTranslation from '../hooks/useTranslation';

export default function SpeakButton({ text, lang = 'zh-CN', size = 'sm', variant = 'icon', className = '' }) {
  const { t } = useTranslation();
  const { speak, stop, isSpeaking } = useSpeech();

  // Pre-load voices on first interaction
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      const handleVoices = () => window.speechSynthesis.getVoices();
      window.speechSynthesis.addEventListener('voiceschanged', handleVoices);
      return () => window.speechSynthesis.removeEventListener('voiceschanged', handleVoices);
    }
  }, []);

  const handleClick = (e) => {
    e.stopPropagation();
    if (isSpeaking) {
      stop();
    } else {
      speak(text, lang);
    }
  };

  if (variant === 'wide') {
    return (
      <span
        onClick={handleClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(e); }}
        role="button"
        tabIndex={0}
        className={`w-full py-2.5 px-4 rounded-xl inline-flex items-center justify-center gap-2 text-sm font-medium transition-all duration-300 cursor-pointer select-none ${
          isSpeaking
            ? 'bg-orange-200/70 text-orange-700 shadow-lg shadow-orange-500/20 dark:bg-amber-500/25 dark:text-amber-300 dark:shadow-orange-500/15'
            : 'bg-orange-50/80 text-orange-600 hover:bg-orange-100 hover:text-orange-700 dark:bg-card-hover/50 dark:text-secondary dark:hover:bg-card-hover dark:hover:text-amber-300'
        } ${className}`}
        title={isSpeaking ? t('speak.stop') : t('speak.listenPronunciation')}
        aria-label={isSpeaking ? t('speak.stopSpeaking') : t('speak.speakText')}
      >
        {isSpeaking ? (
          <svg className="w-4 h-4 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H2v6h4l5 4V5z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
          </svg>
        )}
        {isSpeaking ? t('speak.speaking') : t('speak.listen')}
      </span>
    );
  }

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  return (
    <span
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(e); }}
      role="button"
      tabIndex={0}
      className={`${sizeClasses[size] || sizeClasses.sm} rounded-full inline-flex items-center justify-center transition-all duration-300 cursor-pointer select-none ${
        isSpeaking
          ? 'bg-orange-200/70 text-orange-600 shadow-lg shadow-orange-500/20 scale-110 dark:bg-amber-500/25 dark:text-amber-300 dark:shadow-orange-500/15'
          : 'bg-orange-50/80 text-orange-500 hover:bg-orange-100 hover:text-orange-700 hover:scale-105 dark:bg-card-hover/50 dark:text-secondary dark:hover:bg-card-hover dark:hover:text-amber-300'
      } ${className}`}
      title={isSpeaking ? t('speak.stop') : t('speak.listenPronunciation')}
      aria-label={isSpeaking ? t('speak.stopSpeaking') : t('speak.speakText')}
    >
      {isSpeaking ? (
        <svg className="w-3.5 h-3.5 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H2v6h4l5 4V5z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
        </svg>
      )}
    </span>
  );
}
