import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import SpeakButton from '../components/SpeakButton';
import Icon from '../components/Icon';
import StrokeOrder from '../components/StrokeOrder';
import useTranslation from '../hooks/useTranslation';
import InkParticles from '../components/InkParticles';
import { CATEGORIES, VOCABULARY, getSubcategoryIcon } from '../data/vocabulary';

const FLASHCARD_INK_CHARS = ['學', '書', '墨', '筆', '紙', '硯', '畫', '文', '字', '詞'];

function SealStamp({ label = '學' }) {
  return <div className="flash-seal" style={{ bottom: '12px', right: '12px' }}>{label}</div>;
}

function CornerFlourishes() {
  return (
    <>
      <div className="flash-corner tl" />
      <div className="flash-corner br" />
    </>
  );
}

export default function Flashcards() {
  const { t, meaning } = useTranslation();
  const { state, dispatch, studyWord, togglePinned } = useApp();
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyLimit, setStudyLimit] = useState(10);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showInkFx, setShowInkFx] = useState(false);

  const filteredWords = useMemo(() => {
    let words = VOCABULARY;
    if (showSaved) {
      words = words.filter(w => state.savedWordIds.includes(w.id));
    }
    if (selectedSubcategories.length > 0) {
      words = words.filter(w => selectedSubcategories.includes(w.subcategory));
    }
    if (selectedStatuses.length > 0) {
      words = words.filter(w => {
        const status = state.wordStatuses[w.id] || 'new';
        return selectedStatuses.includes(status);
      });
    }
    return words.sort(() => Math.random() - 0.5).slice(0, studyLimit);
  }, [showSaved, selectedSubcategories, selectedStatuses, studyLimit, state.wordStatuses, state.savedWordIds]);

  const startSession = () => {
    dispatch({ type: 'SET_FLASHCARD_WORDS', words: filteredWords });
    setIsFlipped(false);
    setSessionStarted(true);
  };

  const currentWord = state.flashcardWords[state.currentFlashcardIndex];

  const handleFlip = () => {
    if (!isFlipped) {
      setShowInkFx(true);
      setTimeout(() => setShowInkFx(false), 700);
    }
    setIsFlipped(!isFlipped);
  };

  const handleNext = useCallback(() => {
    if (state.currentFlashcardIndex >= state.flashcardWords.length - 1) return;
    if (currentWord) studyWord(currentWord.id);
    setIsFlipped(false);
    setShowQuiz(false);
    setSelectedAnswer(null);
    setTimeout(() => dispatch({ type: 'NEXT_FLASHCARD' }), 100);
  }, [currentWord, studyWord, dispatch, state.currentFlashcardIndex, state.flashcardWords.length]);

  const handlePrev = useCallback(() => {
    if (state.currentFlashcardIndex <= 0) return;
    setIsFlipped(false);
    setShowQuiz(false);
    setSelectedAnswer(null);
    setTimeout(() => dispatch({ type: 'PREV_FLASHCARD' }), 100);
  }, [dispatch, state.currentFlashcardIndex]);

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

  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  if (sessionStarted && currentWord) {
    return (
      <div className="space-y-5 relative">
        <InkParticles chars={FLASHCARD_INK_CHARS} />

        {/* Header */}
        <div className="flex items-center justify-between animate-slide-up relative z-10">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold">
              <span className="gradient-text"><Icon name="flashcards" /> {t('flash.title')}</span>
            </h1>
            <p className="text-secondary mt-1">
              {t('flash.cardOf', { n: state.currentFlashcardIndex + 1, total: state.flashcardWords.length })}
            </p>
          </div>
          <button
            onClick={() => { setSessionStarted(false); setIsFlipped(false); }}
            className="btn-end-session"
          >
            <Icon name="close" /> {t('flash.endSession')}
          </button>
        </div>

        {/* Progress bar */}
        <div className="flash-progress relative z-10">
          <div
            className="flash-progress-fill"
            style={{ width: `${((state.currentFlashcardIndex + 1) / state.flashcardWords.length) * 100}%` }}
          />
        </div>

        {/* Card */}
        <div className="flex justify-center relative z-10">
          <div className="w-full max-w-lg flash-deck animate-fade-in">
            <div
              className="w-full aspect-[3/4] cursor-pointer flash-card"
              style={{ perspective: '1200px' }}
              onClick={handleFlip}
            >
              <div
                className="relative w-full h-full transition-transform duration-700 ease-out transform-style-3d"
                style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
              >
                {/* Front face */}
                <div className="absolute inset-0 flex flex-col backface-hidden">
                  <CornerFlourishes />
                  <div className="flex-1 flex flex-col items-center justify-center px-8">
                    <span className="text-7xl sm:text-8xl font-light tracking-wide" style={{ fontFamily: "'Noto Sans SC', serif" }}>
                      {currentWord.chinese}
                    </span>
                    {state.showPinyin && (
                      <p className="text-lg text-secondary italic tracking-wider mt-3">({currentWord.pinyin})</p>
                    )}
                    <div className="mt-3">
                      <SpeakButton text={currentWord.chinese} size="lg" />
                    </div>
                  </div>
                  <div className="pb-7 text-center">
                    <p className="text-xs text-muted/60 tracking-wider">{t('flash.tapToFlip')}</p>
                  </div>
                  <SealStamp label={currentWord.chinese.charAt(0)} />
                </div>

                {/* Back face */}
                <div className="absolute inset-0 flex flex-col backface-hidden" style={{ transform: 'rotateY(180deg)' }}>
                  <CornerFlourishes />
                  <div className="flex-1 flex flex-col items-center justify-center px-5 sm:px-8 py-4 overflow-y-auto">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xl sm:text-2xl text-primary" style={{ fontFamily: "'Noto Sans SC', serif" }}>
                        {currentWord.chinese}
                      </span>
                      <SpeakButton text={currentWord.chinese} size="md" />
                    </div>
                    {state.showPinyin && (
                      <p className="text-sm text-secondary italic mb-2 tracking-wider">({currentWord.pinyin})</p>
                    )}
                    <p className="text-xl sm:text-2xl font-medium text-center mb-2">{meaning(currentWord)}</p>
                    <StrokeOrder character={currentWord.chinese} size={80} />
                    {currentWord.examples[0] && (
                      <div className="mt-2 pt-2 border-t border-app text-center w-full max-w-xs">
                        <p className="text-xs text-muted mb-1">{t('flash.example')}</p>
                        <p className="text-sm sm:text-base">{currentWord.examples[0].chinese}</p>
                        {state.showPinyin && (
                          <p className="text-xs text-secondary italic">{currentWord.examples[0].pinyin}</p>
                        )}
                        {meaning(currentWord.examples[0], false) && (
                          <p className="text-xs text-muted mt-0.5">{meaning(currentWord.examples[0], false)}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="pb-4 text-center">
                    <p className="text-xs text-muted/60 tracking-wider">{t('flash.tapToFlipBack')}</p>
                  </div>
                </div>
              </div>

              {showInkFx && <div className="flash-ink-fx" />}
            </div>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-center gap-3 relative z-10">
          <button
            onClick={handlePrev}
            disabled={state.currentFlashcardIndex === 0}
            className="btn-brush"
          >
            <Icon name="leftArrow" /> <span>{t('flash.previous')}</span>
          </button>

          <button
            onClick={() => { setShowQuiz(true); setSelectedAnswer(null); }}
            className="btn-brush primary"
          >
            <Icon name="quiz" /> <span>{t('flash.quizMe')}</span>
          </button>

          <button
            onClick={handleNext}
            disabled={state.currentFlashcardIndex >= state.flashcardWords.length - 1}
            className="btn-brush"
          >
            <span>{t('flash.next')}</span> <Icon name="rightArrow" />
          </button>
        </div>

        {/* Quiz section */}
        {showQuiz && (
          <div className="flash-quiz p-5 animate-fade-in relative z-10">
            <p className="text-sm text-secondary mb-2 tracking-wider">{t('flash.whatDoesThisMean')}</p>
            <p className="text-3xl text-center mb-5" style={{ fontFamily: "'Noto Sans SC', serif" }}>{currentWord.chinese}</p>
            <div className="grid grid-cols-2 gap-2.5">
              {(() => {
                const allMeanings = VOCABULARY
                  .filter(v => v.id !== currentWord.id)
                  .sort(() => Math.random() - 0.5)
                  .slice(0, 3)
                  .map(v => meaning(v))
                  .filter(Boolean);
                const options = [meaning(currentWord), ...allMeanings].sort(() => Math.random() - 0.5);
                return options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedAnswer(opt)}
                    className={`flash-option ${
                      selectedAnswer === opt
                        ? opt === meaning(currentWord) ? 'correct' : 'wrong'
                        : ''
                    }`}
                    disabled={selectedAnswer !== null}
                  >
                    {opt}
                    {selectedAnswer === opt && opt === meaning(currentWord) && <Icon name="check" />}
                    {selectedAnswer === opt && opt !== meaning(currentWord) && <Icon name="xmark" />}
                  </button>
                ));
              })()}
            </div>
            {selectedAnswer && (
              <p className="text-center mt-4 text-sm text-secondary">
                {selectedAnswer === meaning(currentWord)
                  ? <><Icon name="check" /> {t('flash.correct')}</>
                  : <><Icon name="xmark" /> {t('flash.correctAnswer', { answer: meaning(currentWord) })}</>
                }
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <InkParticles chars={FLASHCARD_INK_CHARS} />

      {/* Title */}
      <div className="animate-slide-up relative z-10">
        <h1 className="text-3xl lg:text-4xl font-bold">
          <span className="gradient-text"><Icon name="flashcards" /> {t('flash.title')}</span>
        </h1>
        <p className="text-secondary mt-1">{t('flash.subtitle')}</p>
      </div>

      {/* Settings panel */}
      <div className="flash-settings p-6 animate-slide-up relative z-10">
        <h3 className="font-semibold mb-6 flex items-center gap-2">
          <Icon name="cog" /> {t('flash.displaySettings')}
        </h3>

        <div className="space-y-5">
          {/* Pinyin toggle */}
          <div className="fade-slide-up" style={{ animationDelay: '0.05s' }}>
            <p className="text-xs font-semibold tracking-wider uppercase text-muted mb-2">{t('flash.showPinyin')}</p>
            <button
              onClick={() => dispatch({ type: 'TOGGLE_PINYIN' })}
              className="relative h-7 w-14 rounded-full flex items-center px-1 transition-all duration-300"
              style={{
                background: state.showPinyin
                  ? 'color-mix(in srgb, var(--accent-from) 15%, transparent)'
                  : 'color-mix(in srgb, var(--accent-from) 8%, transparent)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div
                className="absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full transition-all duration-300"
                style={{
                  left: state.showPinyin ? 'calc(50% + 1px)' : '1px',
                  background: state.showPinyin
                    ? 'var(--accent-gradient)'
                    : 'var(--text-muted)',
                  boxShadow: state.showPinyin
                    ? '0 1px 3px rgba(249,115,22,0.3)'
                    : 'none',
                }}
              />
            </button>
          </div>

          {/* Pinned subcategories + Saved */}
          <div className="fade-slide-up" style={{ animationDelay: '0.1s' }}>
            <p className="text-xs font-semibold tracking-wider uppercase text-muted mb-2">{t('flash.pinnedSubcategories')}</p>
            <div className="flex flex-wrap gap-1.5">
              {state.pinnedSubcategories.map(subId => (
                <span key={subId} className="ink-chip pinned">
                  {getSubcategoryIcon(subId)} {subId}
                </span>
              ))}
              <button
                onClick={() => { setShowSaved(!showSaved); setSelectedSubcategories([]); }}
                className={`ink-chip flex items-center gap-1 ${
                  showSaved ? 'active' : ''
                }`}
              >
                <Icon name="bookmark" className="text-xs" />
                <span>{t('flash.saved', { n: state.savedWordIds.length })}</span>
              </button>
            </div>
          </div>

          {/* Category filter */}
          <div className="fade-slide-up" style={{ animationDelay: '0.15s' }}>
            <p className="text-xs font-semibold tracking-wider uppercase text-muted mb-2">{t('flash.otherSubcategories')}</p>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
              {CATEGORIES.map(cat =>
                cat.subcategories.map(sub => {
                  const isPinned = state.pinnedSubcategories.includes(sub.id);
                  const isSelected = selectedSubcategories.includes(sub.id);
                  return (
                    <button
                      key={sub.id}
                      onClick={() => toggleSubcategory(sub.id)}
                      onDoubleClick={() => togglePinned(sub.id)}
                      className={`ink-chip ${isSelected ? 'active' : ''} ${isPinned ? 'pinned' : ''}`}
                    >
                      <Icon name={sub.icon} /> {state.language === 'th' ? sub.nameThai : sub.name}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Status filter */}
          <div className="fade-slide-up" style={{ animationDelay: '0.2s' }}>
            <p className="text-xs font-semibold tracking-wider uppercase text-muted mb-2">{t('flash.filterByStatus')}</p>
            <div className="flex flex-wrap gap-1.5">
              {['new', 'learning', 'reviewing', 'mastered'].map(status => (
                <button
                  key={status}
                  onClick={() => toggleStatus(status)}
                  className={`ink-chip ${selectedStatuses.includes(status) ? 'active' : ''}`}
                >
                  {t('status.' + status)}
                </button>
              ))}
            </div>
          </div>

          {/* Study limit slider */}
          <div className="fade-slide-up" style={{ animationDelay: '0.25s' }}>
            <p className="text-xs font-semibold tracking-wider uppercase text-muted mb-2">{t('flash.numVocabularies')}</p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={5}
                max={200}
                value={studyLimit}
                onChange={(e) => setStudyLimit(Number(e.target.value))}
                className="flex-1 ink-slider"
              />
              <span className="text-sm font-medium min-w-[2.5rem] text-center tabular-nums">
                {studyLimit}
              </span>
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={startSession}
            className="btn-primary w-full justify-center mt-2 fade-slide-up"
            style={{ animationDelay: '0.3s' }}
            disabled={filteredWords.length === 0}
          >
            <Icon name="flashcards" /> {t('flash.startSession', { n: Math.min(filteredWords.length, studyLimit) })}
          </button>
        </div>
      </div>
    </div>
  );
}
