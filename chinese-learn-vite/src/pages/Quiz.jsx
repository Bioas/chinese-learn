import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import SpeakButton from '../components/SpeakButton';
import Icon from '../components/Icon';
import { CATEGORIES, VOCABULARY, getSubcategoryIcon } from '../data/vocabulary';

export default function Quiz() {
  const { state, dispatch, studyWord, togglePinned } = useApp();
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [questionType, setQuestionType] = useState('meaning');
  const [numQuestions, setNumQuestions] = useState(10);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [quizOver, setQuizOver] = useState(false);

  const startQuiz = useCallback(() => {
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

    const shuffled = [...words].sort(() => Math.random() - 0.5).slice(0, numQuestions);
    dispatch({ type: 'SET_QUIZ_WORDS', words: shuffled });
    setSelectedAnswer(null);
    setIsCorrect(null);
    setQuizOver(false);
  }, [selectedSubcategories, selectedStatuses, numQuestions, state.wordStatuses, dispatch]);

  const currentWord = state.quizWords[state.quizIndex];
  const totalQuestions = state.quizWords.length;

  const options = useMemo(() => {
    if (!currentWord) return [];
    if (questionType === 'meaning') {
      const allMeanings = VOCABULARY
        .filter(v => v.id !== currentWord.id && v.meaningThai)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(v => v.meaningThai)
        .filter(Boolean);
      return [currentWord.meaningThai, ...allMeanings].sort(() => Math.random() - 0.5);
    } else if (questionType === 'pinyin') {
      const allPinyin = VOCABULARY
        .filter(v => v.id !== currentWord.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(v => v.pinyin);
      return [currentWord.pinyin, ...allPinyin].sort(() => Math.random() - 0.5);
    } else {
      const allChinese = VOCABULARY
        .filter(v => v.id !== currentWord.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(v => v.chinese);
      return [currentWord.chinese, ...allChinese].sort(() => Math.random() - 0.5);
    }
  }, [currentWord, questionType]);

  const handleAnswer = (answer) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(answer);
    let correct = false;

    if (questionType === 'meaning') {
      correct = answer === currentWord.meaningThai;
    } else if (questionType === 'pinyin') {
      correct = answer === currentWord.pinyin;
    } else {
      correct = answer === currentWord.chinese;
    }

    setIsCorrect(correct);
    if (currentWord) studyWord(currentWord.id);
    dispatch({ type: 'QUIZ_ANSWER', correct });
  };

  const nextQuestion = () => {
    if (state.quizIndex >= totalQuestions - 1) {
      setQuizOver(true);
      return;
    }
    setSelectedAnswer(null);
    setIsCorrect(null);
  };

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

  // Quiz in progress
  if (state.quizWords.length > 0 && !quizOver && currentWord) {
    const qNum = state.quizIndex + 1;

    return (
      <div className="space-y-6">
        <div className="animate-slide-up">
          <h1 className="text-3xl lg:text-4xl font-bold">
            <span className="gradient-text"><Icon name="quiz" /> Quiz</span>
          </h1>
          <p className="text-secondary mt-1">
            Question {qNum} of {totalQuestions}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-gradient rounded-full transition-all duration-500"
              style={{ width: `${(qNum / totalQuestions) * 100}%` }}
            />
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-green-400"><Icon name="check" /> {state.quizCorrect}</span>
            <span className="text-red-400"><Icon name="xmark" /> {state.quizWrong}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-secondary">
          <span><Icon name="check" className="text-green-400" /> Correct: {state.quizCorrect}</span>
          <span><Icon name="xmark" className="text-red-400" /> Wrong: {state.quizWrong}</span>
          <span><Icon name="analytics" className="mr-1" /> Accuracy: {qNum > 0 ? Math.round((state.quizCorrect / qNum) * 100) : 0}%</span>
        </div>

        <div className="glass-card p-8 animate-bounce-in">
          {questionType === 'meaning' && (
            <>
              <p className="text-sm text-secondary text-center mb-2">What does this word mean?</p>
              <div className="flex items-center justify-center gap-3 mb-4">
                <p className="text-5xl text-center text-primary font-medium">{currentWord.chinese}</p>
                <SpeakButton text={currentWord.chinese} size="lg" />
              </div>
              {state.showPinyin && (
                <p className="text-lg text-secondary text-center italic">({currentWord.pinyin})</p>
              )}
            </>
          )}
          {questionType === 'pinyin' && (
            <>
              <p className="text-sm text-secondary text-center mb-2">What is the pinyin for this word?</p>
              <div className="flex items-center justify-center gap-3 mb-4">
                <p className="text-5xl text-center text-primary font-medium">{currentWord.chinese}</p>
                <SpeakButton text={currentWord.chinese} size="lg" />
              </div>
              <p className="text-lg text-secondary text-center">{currentWord.meaning}</p>
            </>
          )}
  {questionType === 'chinese' && (
            <>
              <p className="text-sm text-secondary text-center mb-2">Which Chinese word matches?</p>
              <div className="flex items-center justify-center gap-3 mb-1">
                <p className="text-2xl text-center text-primary">{currentWord.meaningThai}</p>
                <SpeakButton text={currentWord.chinese} size="md" />
              </div>
              {state.showPinyin && (
                <p className="text-lg text-secondary text-center italic">({currentWord.pinyin})</p>
              )}
            </>
          )}

          <div className="grid grid-cols-2 gap-3 mt-6">
            {options.map((opt, i) => {
              const correctAnswer = questionType === 'meaning' ? currentWord.meaningThai
                : questionType === 'pinyin' ? currentWord.pinyin
                : currentWord.chinese;
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(opt)}
                  disabled={selectedAnswer !== null}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    selectedAnswer === null
                      ? 'border-app hover:border-blue-500/50 bg-card hover:bg-card-hover text-primary'
                      : selectedAnswer === opt
                        ? isCorrect
                          ? 'border-green-500 bg-green-500/20 text-green-300'
                          : 'border-red-500 bg-red-500/20 text-red-300'
                        : opt === correctAnswer && selectedAnswer !== null
                          ? 'border-green-500/50 bg-green-500/10 text-green-300/70'
                          : 'border-app bg-secondary/30 text-muted'
                  }`}
                >
                  <span className="text-lg">{opt}</span>
                  {selectedAnswer === opt && (
                    <span className="ml-2">{isCorrect ? <Icon name="check" /> : <Icon name="xmark" />}</span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedAnswer && (
            <div className="mt-4 text-center">
              <p className={`text-sm ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {isCorrect ? (
                  <><Icon name="check" className="text-green-400 mr-1" /> Correct! Well done! <Icon name="party" /></>
                ) : (
                  <><Icon name="xmark" className="text-red-400 mr-1" /> Sorry! The correct answer was: {currentWord.meaningThai}</>
                )}
              </p>
              {currentWord.examples[0] && (
                <div className="mt-3 text-xs text-muted">
                  <p>{currentWord.examples[0].chinese} - {currentWord.examples[0].meaning}</p>
                </div>
              )}
              <button
                onClick={nextQuestion}
                className="btn-primary mt-4"
              >
                {qNum >= totalQuestions ? <><Icon name="barChart" className="mr-1" /> See Results</> : <>Next <Icon name="rightArrow" className="ml-1" /></>}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Quiz Over
  if (quizOver) {
    const total = state.quizCorrect + state.quizWrong;
    const accuracy = total > 0 ? Math.round((state.quizCorrect / total) * 100) : 0;

    return (
      <div className="space-y-6">
        <div className="animate-slide-up">
          <h1 className="text-3xl lg:text-4xl font-bold">
            <span className="gradient-text"><Icon name="quiz" /> Quiz Results</span>
          </h1>
        </div>

        <div className="glass-card p-8 text-center animate-bounce-in">
          <p className="text-6xl mb-4">
            {accuracy >= 80 ? <Icon name="party" className="text-6xl" /> : accuracy >= 60 ? <Icon name="like" className="text-6xl" /> : <Icon name="dumbbell" className="text-6xl" />}
          </p>
          <h2 className="text-2xl font-bold text-primary mb-2">
            {accuracy >= 80 ? 'Excellent!' : accuracy >= 60 ? 'Good Job!' : 'Keep Practicing!'}
          </h2>
          <div className="grid grid-cols-3 gap-6 mt-6 max-w-md mx-auto">
            <div>
              <p className="text-3xl font-bold text-green-400">{state.quizCorrect}</p>
              <p className="text-xs text-secondary">Correct</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-red-400">{state.quizWrong}</p>
              <p className="text-xs text-secondary">Wrong</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-400">{accuracy}%</p>
              <p className="text-xs text-secondary">Accuracy</p>
            </div>
          </div>
          <button
            onClick={() => dispatch({ type: 'RESET_QUIZ' })}
            className="btn-primary mt-6"
          >
            <><Icon name="refresh" className="mr-1" /> Try Again</>
          </button>
        </div>
      </div>
    );
  }

  // Quiz Setup
  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <h1 className="text-3xl lg:text-4xl font-bold">
          <span className="gradient-text"><Icon name="quiz" /> Quiz</span>
        </h1>
        <p className="text-secondary mt-1">Test your knowledge with contextual questions</p>
      </div>

      <div className="glass-card p-5 animate-slide-up">
        <h3 className="font-semibold text-primary mb-4 flex items-center gap-2"><Icon name="cog" /> Quiz Mode</h3>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-secondary mb-2">Question Type:</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setQuestionType('meaning')}
                className={`chip ${questionType === 'meaning' ? 'active' : ''}`}
              >
                <><Icon name="transfer" className="mr-1" /> Chinese → Thai</>
              </button>
              <button
                onClick={() => setQuestionType('pinyin')}
                className={`chip ${questionType === 'pinyin' ? 'active' : ''}`}
              >
                <><Icon name="fontFamily" className="mr-1" /> Pinyin</>
              </button>
              <button
                onClick={() => setQuestionType('chinese')}
                className={`chip ${questionType === 'chinese' ? 'active' : ''}`}
              >
                <><Icon name="transfer" className="mr-1" /> Thai → Chinese</>
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm text-secondary mb-2">Pinned Subcategories</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {state.pinnedSubcategories.map(subId => (
                <span key={subId} className="chip pinned">
                  <Icon name={getSubcategoryIcon(subId)} /> {subId}
                </span>
              ))}
              {state.pinnedSubcategories.length === 0 && (
                <span className="text-xs text-muted">No pinned subcategories</span>
              )}
            </div>
            <p className="text-sm text-secondary mb-2">Other Subcategories</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat =>
                cat.subcategories.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => toggleSubcategory(sub.id)}
                    onDoubleClick={() => togglePinned(sub.id)}
                    className={`chip text-xs ${
                      selectedSubcategories.includes(sub.id) ? 'active' : ''
                    } ${state.pinnedSubcategories.includes(sub.id) ? 'pinned' : ''}`}
                  >
                    <Icon name={sub.icon} /> {sub.name}
                  </button>
                ))
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
            <p className="text-sm text-secondary mb-2">Questions:</p>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={5}
                max={30}
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="flex-1 accent-blue-500"
              />
              <span className="text-sm text-primary font-medium min-w-[3rem] text-center">
                {numQuestions}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-primary">Show Pinyin in Quiz</span>
            <button
              onClick={() => dispatch({ type: 'TOGGLE_PINYIN' })}
              className={`relative w-12 h-6 rounded-full transition-colors ${state.showPinyin ? 'bg-blue-500' : 'bg-card-hover'}`}
            >
              <div className={`absolute w-5 h-5 rounded-full bg-white top-0.5 transition-transform ${state.showPinyin ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <button
            onClick={startQuiz}
            className="btn-primary w-full justify-center mt-2"
          >
            <><Icon name="quiz" className="mr-1" /> Start Quiz</>
          </button>
        </div>
      </div>
    </div>
  );
}
