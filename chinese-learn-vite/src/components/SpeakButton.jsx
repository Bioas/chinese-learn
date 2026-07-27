import React, { useEffect } from 'react';
import useSpeech from '../hooks/useSpeech';

export default function SpeakButton({ text, lang = 'zh-CN', size = 'sm', className = '' }) {
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
          ? 'bg-blue-500/30 text-blue-400 shadow-lg shadow-blue-500/20 scale-110'
          : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 hover:text-blue-400 hover:scale-105'
      } ${className}`}
      title={isSpeaking ? 'Stop' : 'Listen to pronunciation'}
      aria-label={isSpeaking ? 'Stop speaking' : 'Speak text'}
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
