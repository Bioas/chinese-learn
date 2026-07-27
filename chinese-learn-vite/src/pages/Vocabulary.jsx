import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import SpeakButton from '../components/SpeakButton';
import Icon from '../components/Icon';
import StrokeOrder from '../components/StrokeOrder';
import { CATEGORIES, VOCABULARY, getSubcategoryIcon } from '../data/vocabulary';

export default function Vocabulary() {
  const { state, dispatch, togglePinned, studyWord } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('hsk');
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [expandedWord, setExpandedWord] = useState(null);

  const currentCategory = useMemo(
    () => CATEGORIES.find(c => c.id === selectedCategory),
    [selectedCategory]
  );

  const filteredWords = useMemo(() => {
    let words = VOCABULARY;

    if (selectedSubcategories.length > 0) {
      words = words.filter(w => selectedSubcategories.includes(w.subcategory));
    }

    if (selectedStatuses.length > 0) {
      words = words.filter(w => {
        const status = state.wordStatuses[w.id] || 'new';
        return selectedStatuses.includes(status);
      });
    }

    return words;
  }, [selectedSubcategories, selectedStatuses, state.wordStatuses]);

  const toggleSubcategory = (subId) => {
    setSelectedSubcategories(prev =>
      prev.includes(subId) ? prev.filter(id => id !== subId) : [...prev, subId]
    );
  };

  const toggleStatus = (status) => {
    setSelectedStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const getStatusBadge = (word) => {
    const status = state.wordStatuses[word.id] || 'new';
    switch (status) {
      case 'mastered': return <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/20">Mastered</span>;
      case 'reviewing': return <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/20">Reviewing</span>;
      case 'learning': return <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/20">Learning</span>;
      default: return <span className="text-[10px] px-2 py-0.5 rounded-full border-app text-secondary border border-app">New</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <h1 className="text-3xl lg:text-4xl font-bold">
          <span className="gradient-text"><Icon name="vocabulary" /> Vocabulary</span>
        </h1>
        <p className="text-secondary mt-1">Browse and learn Chinese vocabulary</p>
      </div>

      {state.pinnedSubcategories.length > 0 && (
        <div className="glass-card p-4 animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-blue-400"><Icon name="pin" /></span>
            <h3 className="font-medium text-sm text-primary">Pinned Subcategory Shortcuts</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {state.pinnedSubcategories.map(subId => {
              const icon = getSubcategoryIcon(subId);
              return (
                <button
                  key={subId}
                  onClick={() => {
                    setSelectedSubcategories([subId]);
                    togglePinned(subId);
                  }}
                  className="chip pinned flex items-center gap-1.5"
                >
                  <Icon name={icon} />
                  <span>{subId}</span>
                  <Icon name="xmark" className="text-muted ml-1" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 animate-slide-up">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id);
              setSelectedSubcategories([]);
            }}
            className={`chip flex items-center gap-1.5 ${selectedCategory === cat.id ? 'active' : ''}`}
          >
            <Icon name={cat.icon} />
            <span>{cat.name}</span>
            <span className="text-xs opacity-60">({cat.nameThai})</span>
          </button>
        ))}
      </div>

      {currentCategory && (
        <div className="flex flex-wrap gap-2 animate-fade-in">
          {currentCategory.subcategories.map(sub => {
            const isPinned = state.pinnedSubcategories.includes(sub.id);
            return (
              <div key={sub.id} className="relative group">
                <button
                  onClick={() => toggleSubcategory(sub.id)}
                  onDoubleClick={() => togglePinned(sub.id)}
                  className={`chip flex items-center gap-1.5 ${
                    selectedSubcategories.includes(sub.id) ? 'active' : ''
                  } ${isPinned ? 'pinned' : ''}`}
                  title={isPinned ? 'Double-click to unpin' : 'Double-click to pin'}
                >
                  <Icon name={sub.icon} />
                  <span>{sub.name}</span>
                  {isPinned && <Icon name="pin" className="text-[10px] text-pink-400" />}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="glass-card p-4 animate-fade-in">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm text-secondary">Filter by Status:</span>
          {['new', 'learning', 'reviewing', 'mastered'].map(status => (
            <button
              key={status}
              onClick={() => toggleStatus(status)}
              className={`chip text-xs ${selectedStatuses.includes(status) ? 'active' : ''}`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
          <span className="text-xs text-muted ml-auto">
            {filteredWords.length} words
          </span>
        </div>
      </div>

      <div className="grid gap-3 animate-fade-in">
        {filteredWords.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-4xl mb-3 text-secondary"><Icon name="searchAlt" /></p>
            <p className="text-secondary">No matching words found.</p>
            <p className="text-xs text-muted mt-1">Try selecting different categories or filters</p>
          </div>
        ) : (
          filteredWords.map((word, index) => (
            <div
              key={word.id}
              className="glass-card glass-card-hover overflow-hidden animate-slide-up"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <button
                onClick={() => {
                  setExpandedWord(expandedWord === word.id ? null : word.id);
                  studyWord(word.id);
                }}
                className="w-full text-left p-4 flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl font-medium text-primary">{word.chinese}</span>
                    <SpeakButton text={word.chinese} size="sm" />
                    {state.showPinyin && (
                      <span className="text-sm text-secondary italic">({word.pinyin})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-primary">{word.meaning}</span>
                    <span className="text-muted">|</span>
                    <span className="text-muted">{word.meaningThai}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(word)}
                  <span className="text-xs text-muted px-2 py-0.5 rounded-full bg-secondary">
                    {word.hskLevel > 0 ? `HSK ${word.hskLevel}` : word.subcategory}
                  </span>
                  <svg
                    className={`w-4 h-4 text-muted transition-transform ${expandedWord === word.id ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {expandedWord === word.id && (
                <div className="px-4 pb-4 border-t border-app animate-fade-in">
                  <div className="mt-3 flex flex-col lg:flex-row gap-6">
                    {/* Stroke Order */}
                    <div className="flex-shrink-0 flex flex-col items-center">
                      <StrokeOrder character={word.chinese} size={100} />
                      <p className="text-[10px] text-muted mt-2">Click to replay</p>
                    </div>

                    <div className="flex-1 space-y-2">
                      <p className="text-xs text-secondary font-medium">Example Sentences:</p>
                      {word.examples.map((ex, i) => (
                        <div key={i} className="bg-secondary/50 rounded-lg p-3">
                          <p className="text-lg text-primary" style={{color: 'var(--text-primary)'}}>{ex.chinese}</p>
                          {state.showPinyin && (
                            <p className="text-xs text-secondary italic mt-0.5">{ex.pinyin}</p>
                          )}
                          <p className="text-xs text-muted mt-0.5">{ex.meaning}</p>
                        </div>
                      ))}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch({ type: 'UPDATE_WORD_STATUS', wordId: word.id, status: 'mastered' });
                          }}
                          className="text-xs px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                        >
                          <><Icon name="checkCircle" className="mr-1" /> Mastered</>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch({ type: 'UPDATE_WORD_STATUS', wordId: word.id, status: 'learning' });
                          }}
                          className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                        >
                          Still Learning
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
