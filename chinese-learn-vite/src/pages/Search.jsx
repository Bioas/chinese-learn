import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import SpeakButton from '../components/SpeakButton';
import Icon from '../components/Icon';
import StrokeOrder from '../components/StrokeOrder';
import useTranslation from '../hooks/useTranslation';
import InkParticles from '../components/InkParticles';
import { VOCABULARY } from '../data/vocabulary';

const SEARCH_INK_CHARS = ['搜', '尋', '查', '找', '探', '索', '发', '現', '觅', '見'];

export default function Search() {
  const { t, meaning } = useTranslation();
  const { state, dispatch, studyWord } = useApp();
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState('all');

  const results = useMemo(() => {
    if (!query.trim()) return [];

    const q = query.toLowerCase().trim();
    const matched = VOCABULARY.filter(word => {
      switch (searchMode) {
        case 'chinese':
          return (word.chinese || '').includes(q);
        case 'pinyin':
          return (word.pinyin || '').toLowerCase().includes(q);
        case 'meaning':
          return (word.meaning || '').toLowerCase().includes(q) ||
                 ((word.meaningThai || '').toLowerCase().includes(q));
        default:
          return (word.chinese || '').includes(q) ||
                 (word.pinyin || '').toLowerCase().includes(q) ||
                 (word.meaning || '').toLowerCase().includes(q) ||
                 ((word.meaningThai || '').toLowerCase().includes(q));
      }
    });

    // Deduplicate by Chinese text — the vocabulary contains the same `chinese`
    // word across multiple HSK levels with different IDs (e.g. 可能 as hsk2-054,
    // hsk3-109, hsk4-069). Without this, searching for such a word returns
    // multiple identical result cards.
    const seenSearchChinese = new Set();
    return matched.filter(w => {
      if (seenSearchChinese.has(w.chinese)) return false;
      seenSearchChinese.add(w.chinese);
      return true;
    });
  }, [query, searchMode]);

  const getStatusBadge = (wordId) => {
    const status = state.wordStatuses[wordId] || 'new';
    switch (status) {
      case 'mastered': return <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">{t('status.mastered')}</span>;
      case 'reviewing': return <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">{t('status.reviewing')}</span>;
      case 'learning': return <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">{t('status.learning')}</span>;
      default: return <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/50 text-secondary">{t('status.new')}</span>;
    }
  };

  return (
    <div className="space-y-6 relative">
      <InkParticles chars={SEARCH_INK_CHARS} />

      <div className="animate-slide-up relative z-10">
        <h1 className="text-3xl lg:text-4xl font-bold">
          <span className="gradient-text"><Icon name="search" /> {t('search.title')}</span>
        </h1>
        <p className="text-secondary mt-1">{t('search.subtitle')}</p>
      </div>

      <div className="glass-card p-4 animate-slide-up relative z-10">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-secondary"><Icon name="searchAlt" /></span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            className="input-field pl-12 text-lg"
            autoFocus
          />
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <button
            onClick={() => setSearchMode('all')}
            className={`chip text-xs ${searchMode === 'all' ? 'active' : ''}`}
          >
            <><Icon name="search" className="mr-1" /> {t('search.allFields')}</>
          </button>
          <button
            onClick={() => setSearchMode('chinese')}
            className={`chip text-xs ${searchMode === 'chinese' ? 'active' : ''}`}
          >
            <><Icon name="fontFamily" className="mr-1" /> {t('search.chinese')}</>
          </button>
          <button
            onClick={() => setSearchMode('pinyin')}
            className={`chip text-xs ${searchMode === 'pinyin' ? 'active' : ''}`}
          >
            <><Icon name="fontFamily" className="mr-1" /> {t('search.pinyin')}</>
          </button>
          <button
            onClick={() => setSearchMode('meaning')}
            className={`chip text-xs ${searchMode === 'meaning' ? 'active' : ''}`}
          >
            <><Icon name="bookmark" className="mr-1" /> {t('search.meaning')}</>
          </button>
          {query && (
            <span className="text-xs text-muted ml-auto self-center">
              {t('search.results', { n: results.length })}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3 animate-fade-in relative z-10">
        {results.length === 0 && query ? (
          <div className="glass-card p-8 text-center">
            <p className="text-4xl mb-3 text-secondary"><Icon name="searchAlt" /></p>
            <p className="text-secondary font-medium">{t('search.noResults')}</p>
            <p className="text-xs text-muted mt-1">{t('search.noResultsHint')}</p>
          </div>
        ) : results.length === 0 && !query ? (
          <div className="glass-card p-8 text-center">
            <p className="text-4xl mb-3 text-secondary"><Icon name="searchAlt2" /></p>
            <p className="text-secondary">{t('search.startTyping')}</p>
            <p className="text-xs text-muted mt-1">{t('search.wordsAvailable', { n: VOCABULARY.length })}</p>
          </div>
        ) : (
          results.map((word, i) => (
            <div
              key={word.id}
              className="glass-card glass-card-hover p-4 animate-slide-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 hidden sm:block">
                  <StrokeOrder character={word.chinese} size={60} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl font-medium text-primary">{word.chinese}</span>
                    <SpeakButton text={word.chinese} size="sm" />
                    {state.showPinyin && (
                      <span className="text-sm text-secondary italic">({word.pinyin})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-primary">{meaning(word)}</span>
                  </div>
                  {word.examples?.[0] && (
                    <p className="text-xs text-muted mt-1">
                      {word.examples[0].chinese}{meaning(word.examples[0], false) && ` - ${meaning(word.examples[0], false)}`}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(word.id)}
                  <span className="text-xs text-muted px-2 py-0.5 rounded-full bg-secondary">
                    {word.hskLevel > 0 ? `HSK ${word.hskLevel}` : word.subcategory}
                  </span>
                  <button
                    onClick={() => studyWord(word.id)}
                    className="p-2 rounded-lg hover:bg-card-hover transition-colors"
                    title={t('search.studyWord')}
                  >
                    <svg className="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
