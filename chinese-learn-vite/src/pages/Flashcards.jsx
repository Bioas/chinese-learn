import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import SpeakButton from '../components/SpeakButton';
import Icon from '../components/Icon';
import StrokeOrder from '../components/StrokeOrder';
import { CATEGORIES, VOCABULARY, getSubcategoryIcon } from '../data/vocabulary';

export default function Flashcards() {
  const { state, dispatch, studyWord, togglePinned } = useApp();
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyLimit, setStudyLimit] = useState(10);
  const [sessionStarted, setSessionStarted] = useState(false);

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

    return words.sort(() => Math.random() - 0.5).slice(0, studyLimit);
  }, [selectedSubcategories, selectedStatuses, studyLimit, state.wordStatuses]);

  const startSession = () => {
    dispatch({ type: 'SET_FLASHCARD_WORDS', words: filteredWords });
    setIsFlipped(false);
    setSessionStarted(true);
  };

  const currentWord = state.flashcardWords[state.currentFlashcardIndex];

  const handleNext = useCallback(() => {
    if (currentWord) studyWord(currentWord.id);
    setIsFlipped(false);
    setTimeout(() => dispatch({ type: 'NEXT_FLASHCARD' }), 100);
  }, [currentWord, studyWord, dispatch]);

  const handlePrev = useCallback(() => {
    setIsFlipped(false);
    setTimeout(() => dispatch({ type: 'PREV_FLASHCARD' }), 100);
  }, [dispatch]);

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
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-slide-up">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold">
              <span className="gradient-text"><Icon name="flashcards" /> Flashcards</span>
            </h1>
            <p className="text-secondary mt-1">
              Card {state.currentFlashcardIndex + 1} of {state.flashcardWords.length}
            </p>
          </div>
          <button
            onClick={() => { setSessionStarted(false); setIsFlipped(false); }}
            className="btn-secondary text-sm"
          >
            <><Icon name="close" className="mr-1" /> End Session</>
          </button>
        </div>

        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-gradient rounded-full transition-all duration-500"
            style={{ width: `${((state.currentFlashcardIndex + 1) / state.flashcardWords.length) * 100}%` }}
          />
        </div>

        <div className="flex justify-center animate-bounce-in">
          <div
            className="w-full max-w-lg aspect-[3/4] cursor-pointer"
            style={{ perspective: '1000px' }}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div
              className="relative w-full h-full transition-transform duration-500 preserve-3d"
              style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
            >
              <div className="absolute inset-0 glass-card flex flex-col items-center justify-center p-8 backface-hidden">
                <div className="flex items-center gap-3 mb-6">
                  <div className="text-6xl">{currentWord.chinese}</div>
                  <SpeakButton text={currentWord.chinese} size="lg" />
                </div>
                {state.showPinyin && (
                  <p className="text-xl text-secondary italic">({currentWord.pinyin})</p>
                )}
                <p className="text-xs text-muted mt-8">tap to flip</p>
                <div className="absolute top-4 right-4 text-xs text-muted">
                  {currentWord.hskLevel > 0 ? `HSK ${currentWord.hskLevel}` : currentWord.subcategory}
                </div>
              </div>

              <div className="absolute inset-0 glass-card flex flex-col items-center justify-center p-4 sm:p-8 backface-hidden" style={{ transform: 'rotateY(180deg)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-2xl sm:text-3xl">{currentWord.chinese}</div>
                  <SpeakButton text={currentWord.chinese} size="md" />
                </div>
                {state.showPinyin && (
                  <p className="text-sm sm:text-lg text-secondary italic mb-2">({currentWord.pinyin})</p>
                )}
                <div className="text-center space-y-1 mb-2">
                  <p className="text-xl sm:text-2xl text-primary font-medium">{currentWord.meaning}</p>
                  <p className="text-base sm:text-lg text-secondary">{currentWord.meaningThai}</p>
                </div>
                {/* Stroke order */}
                <StrokeOrder character={currentWord.chinese} size={80} />
                {currentWord.examples[0] && (
                  <div className="mt-3 pt-3 border-t border-app text-center w-full max-w-xs">
                    <p className="text-xs text-muted mb-1">Example:</p>
                    <p className="text-sm sm:text-lg">{currentWord.examples[0].chinese}</p>
                    {state.showPinyin && (
                      <p className="text-xs text-secondary italic">{currentWord.examples[0].pinyin}</p>
                    )}
                    <p className="text-xs text-muted mt-0.5">{currentWord.examples[0].meaning}</p>
                  </div>
                )}
                <p className="text-xs text-muted mt-auto pt-2">tap to flip back</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handlePrev}
            disabled={state.currentFlashcardIndex === 0}
            className="btn-secondary disabled:opacity-30"
          >
            <><Icon name="leftArrow" className="mr-1" /> Previous</>
          </button>

          <button
            onClick={() => {
              setShowQuiz(true);
              setSelectedAnswer(null);
            }}
            className="btn-primary"
          >
            <><Icon name="quiz" className="mr-1" /> Quiz Me</>
          </button>

          <button
            onClick={handleNext}
            disabled={state.currentFlashcardIndex >= state.flashcardWords.length - 1}
            className="btn-primary disabled:opacity-30"
          >
            <>Next <Icon name="rightArrow" className="ml-1" /></>
          </button>
        </div>

        {showQuiz && (
          <div className="glass-card p-6 animate-fade-in">
            <p className="text-sm text-secondary mb-3">What does this mean?</p>
            <p className="text-3xl text-center mb-4">{currentWord.chinese}</p>
            <div className="grid grid-cols-2 gap-3">
              {(() => {
                const allThai = VOCABULARY
                  .filter(v => v.id !== currentWord.id && v.meaningThai)
                  .sort(() => Math.random() - 0.5)
                  .slice(0, 3)
                  .map(v => v.meaningThai)
                  .filter(Boolean);
                const options = [currentWord.meaningThai, ...allThai].sort(() => Math.random() - 0.5);
                return options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedAnswer(opt)}
                    className={`p-3 rounded-xl border transition-all ${
                      selectedAnswer === opt
                        ? opt === currentWord.meaningThai
                          ? 'border-green-500 bg-green-500/20 text-green-300'
                          : 'border-red-500 bg-red-500/20 text-red-300'
                        : 'border-app hover:border-blue-500/30 text-primary'
                    }`}
                    disabled={selectedAnswer !== null}
                  >
                    {opt}
                    {selectedAnswer === opt && opt === currentWord.meaningThai && <Icon name="check" />}
                    {selectedAnswer === opt && opt !== currentWord.meaningThai && <Icon name="xmark" />}
                  </button>
                ));
              })()}
            </div>
            {selectedAnswer && (
              <p className="text-center mt-3 text-sm text-secondary">
                {selectedAnswer === currentWord.meaningThai
                  ? <><Icon name="check" /> Correct! Well done!</>
                  : <><Icon name="xmark" /> Correct answer: {currentWord.meaningThai}</>
                }
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <h1 className="text-3xl lg:text-4xl font-bold">
          <span className="gradient-text"><Icon name="flashcards" /> Flashcards</span>
        </h1>
        <p className="text-secondary mt-1">Interactive flashcard sessions with customizable settings</p>
      </div>

      <div className="glass-card p-5 animate-slide-up">
        <h3 className="font-semibold text-primary mb-4 flex items-center gap-2"><Icon name="cog" /> Display Settings</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-primary">Show Pinyin</span>
            <button
              onClick={() => dispatch({ type: 'TOGGLE_PINYIN' })}
              className={`relative w-12 h-6 rounded-full transition-colors ${state.showPinyin ? 'bg-blue-500' : 'bg-card-hover'}`}
            >
              <div className={`absolute w-5 h-5 rounded-full bg-white top-0.5 transition-transform ${state.showPinyin ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div>
            <p className="text-sm text-secondary mb-2">Pinned Subcategories</p>
            <div className="flex flex-wrap gap-2">
              {state.pinnedSubcategories.map(subId => (
                <span key={subId} className="chip pinned">
                  {getSubcategoryIcon(subId)} {subId}
                </span>
              ))}
              {state.pinnedSubcategories.length === 0 && (
                <span className="text-xs text-muted">No pinned subcategories. Double-click in Vocabulary to pin.</span>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm text-secondary mb-2">Other Subcategories</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat =>
                cat.subcategories.map(sub => {
                  const isPinned = state.pinnedSubcategories.includes(sub.id);
                  const isSelected = selectedSubcategories.includes(sub.id);
                  return (
                    <button
                      key={sub.id}
                      onClick={() => toggleSubcategory(sub.id)}
                      onDoubleClick={() => togglePinned(sub.id)}
                      className={`chip text-xs ${isSelected ? 'active' : ''} ${isPinned ? 'pinned' : ''}`}
                    >
                      <Icon name={sub.icon} /> {sub.name}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <p className="text-sm text-secondary mb-2">Filter by Status (Multiple)</p>
            <div className="flex flex-wrap gap-2">
              {['new', 'learning', 'reviewing', 'mastered'].map(status => (
                <button
                  key={status}
                  onClick={() => toggleStatus(status)}
                  className={`chip text-xs ${selectedStatuses.includes(status) ? 'active' : ''}`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-secondary mb-2">Number of Vocabularies</p>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={5}
                max={50}
                value={studyLimit}
                onChange={(e) => setStudyLimit(Number(e.target.value))}
                className="flex-1 accent-blue-500"
              />
              <span className="text-sm text-primary font-medium min-w-[3rem] text-center">
                {studyLimit}
              </span>
            </div>
          </div>

          <button
            onClick={startSession}
            className="btn-primary w-full justify-center mt-2"
            disabled={filteredWords.length === 0}
          >
            <><Icon name="flashcards" className="mr-1" /> Start Session ({Math.min(filteredWords.length, studyLimit)} cards)</>
          </button>
        </div>
      </div>
    </div>
  );
}
