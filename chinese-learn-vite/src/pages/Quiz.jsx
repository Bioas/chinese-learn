import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import SpeakButton from '../components/SpeakButton';
import Icon from '../components/Icon';
import useTranslation from '../hooks/useTranslation';
import InkParticles from '../components/InkParticles';
import { VOCABULARY } from '../data/vocabulary';
import { CATEGORIES, getSubcategoryIcon } from '../data/categories';

const QUIZ_INK_CHARS = ['問', '答', '考', '試', '学', '習', '知', '解', '思', '得'];

function CornerFlourishes() {
  return (
    <>
      <div className="flash-corner tl" />
      <div className="flash-corner br" />
    </>
  );
}

export default function Quiz() {
  const { t, meaning } = useTranslation();
  const { state, dispatch, studyWord, togglePinned } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('hsk');
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [questionType, setQuestionType] = useState('meaning');
  const [numQuestions, setNumQuestions] = useState(10);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [quizOver, setQuizOver] = useState(false);

  const currentCategory = useMemo(
    () => CATEGORIES.find(c => c.id === selectedCategory),
    [selectedCategory]
  );

  const startQuiz = useCallback(() => {
    let words = VOCABULARY;

    if (showSaved) {
      words = words.filter(w => state.savedWordIds.includes(w.id));
    }

    if (!showSaved && selectedSubcategories.length === 0 && currentCategory) {
      const subIds = currentCategory.subcategories.map(s => s.id);
      words = words.filter(w => subIds.includes(w.subcategory));
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

    const shuffled = [...words].sort(() => Math.random() - 0.5).slice(0, numQuestions);
    dispatch({ type: 'SET_QUIZ_WORDS', words: shuffled });
    setSelectedAnswer(null);
    setIsCorrect(null);
    setQuizOver(false);
  }, [showSaved, selectedSubcategories, selectedStatuses, numQuestions, currentCategory, state.wordStatuses, state.savedWordIds, dispatch]);

  const currentWord = state.quizWords[state.quizIndex];
  const totalQuestions = state.quizWords.length;

  const options = useMemo(() => {
    if (!currentWord) return [];
    if (questionType === 'meaning') {
      const allMeanings = VOCABULARY
        .filter(v => v.id !== currentWord.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(v => meaning(v))
        .filter(Boolean);
      return [meaning(currentWord), ...allMeanings].sort(() => Math.random() - 0.5);
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
      correct = answer === meaning(currentWord);
    } else if (questionType === 'pinyin') {
      correct = answer === currentWord.pinyin;
    } else {
      correct = answer === currentWord.chinese;
    }

    setIsCorrect(correct);
    if (currentWord) studyWord(currentWord.id);
  };

  const nextQuestion = () => {
    dispatch({ type: 'QUIZ_ANSWER', correct: isCorrect });
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
      <div className="space-y-5 relative">
        <InkParticles chars={QUIZ_INK_CHARS} />

        {/* Header + End Session */}
        <div className="flex items-start justify-between animate-slide-up relative z-10">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold">
              <span className="gradient-text"><Icon name="quiz" /> {t('quiz.title')}</span>
            </h1>
            <p className="text-secondary mt-1">
              {t('quiz.questionOf', { n: qNum, total: totalQuestions })}
            </p>
          </div>
          <button
            onClick={() => dispatch({ type: 'RESET_QUIZ' })}
            className="btn-end-session"
          >
            <Icon name="close" /> {t('flash.endSession')}
          </button>
        </div>

        {/* Progress bar */}
        <div className="flash-progress relative z-10">
          <div
            className="flash-progress-fill"
            style={{ width: `${(qNum / totalQuestions) * 100}%` }}
          />
        </div>

        {/* Score badges */}
        <div className="flex items-center gap-4 justify-center relative z-10">
          <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#22c55e' }}>
            <Icon name="check" className="text-sm" /> {state.quizCorrect}
          </span>
          <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#ef4444' }}>
            <Icon name="xmark" className="text-sm" /> {state.quizWrong}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-secondary">
            <Icon name="analytics" className="text-sm" /> {qNum > 0 ? Math.round((state.quizCorrect / qNum) * 100) : 0}%
          </span>
        </div>

        {/* Question card */}
        <div className="flex justify-center relative z-10">
          <div className="w-full max-w-lg">
            <div className="flash-card p-8 animate-fade-in">
              <CornerFlourishes />

              {questionType === 'meaning' && (
                <div className="text-center">
                  <p className="text-xs text-secondary tracking-wider mb-3">{t('quiz.questionMeaning')}</p>
                  <span className="block text-5xl font-light mb-2" style={{ fontFamily: "'Noto Sans SC', serif" }}>
                    {currentWord.chinese}
                  </span>
                  {state.showPinyin && (
                    <p className="text-base text-secondary italic tracking-wider mb-3">({currentWord.pinyin})</p>
                  )}
                  <SpeakButton text={currentWord.chinese} size="md" />
                </div>
              )}

              {questionType === 'pinyin' && (
                <div className="text-center">
                  <p className="text-xs text-secondary tracking-wider mb-3">{t('quiz.questionPinyin')}</p>
                  <span className="block text-5xl font-light mb-2" style={{ fontFamily: "'Noto Sans SC', serif" }}>
                    {currentWord.chinese}
                  </span>
                  <p className="text-base text-secondary mb-3">{meaning(currentWord)}</p>
                  <SpeakButton text={currentWord.chinese} size="md" />
                </div>
              )}

              {questionType === 'chinese' && (
                <div className="text-center">
                  <p className="text-xs text-secondary tracking-wider mb-3">{t('quiz.questionChinese')}</p>
                  <p className="text-2xl font-medium mb-2">{meaning(currentWord)}</p>
                  {state.showPinyin && (
                    <p className="text-base text-secondary italic tracking-wider mb-3">({currentWord.pinyin})</p>
                  )}
                  <SpeakButton text={currentWord.chinese} size="md" />
                </div>
              )}

              {/* Options */}
              <div className="grid grid-cols-2 gap-2.5 mt-6">
                {options.map((opt, i) => {
                  const correctAnswer = questionType === 'meaning' ? meaning(currentWord)
                    : questionType === 'pinyin' ? currentWord.pinyin
                    : currentWord.chinese;
                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(opt)}
                      disabled={selectedAnswer !== null}
                      className={`flash-option text-center ${
                        selectedAnswer !== null
                          ? selectedAnswer === opt
                            ? isCorrect
                              ? 'correct'
                              : 'wrong'
                            : opt === correctAnswer
                              ? 'border-green-500/50 bg-green-500/10 text-green-300/70'
                              : 'opacity-40'
                          : ''
                      }`}
                    >
                      <span className="text-base">{opt}</span>
                      {selectedAnswer === opt && (
                        <span className="ml-1.5 inline-flex items-center">
                          {isCorrect ? <Icon name="check" /> : <Icon name="xmark" />}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Feedback */}
              {selectedAnswer && (
                <div className="mt-5 text-center">
                  <p className={`text-sm font-medium ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                    {isCorrect ? (
                      <>{t('quiz.correctFeedback')}</>
                    ) : (
                      <>{t('quiz.wrongFeedback', { answer: meaning(currentWord) })}</>
                    )}
                  </p>
                  {currentWord.examples[0] && (
                    <p className="mt-2 text-xs text-muted">
                      {currentWord.examples[0].chinese}
                      {meaning(currentWord.examples[0], false) && ` - ${meaning(currentWord.examples[0], false)}`}
                    </p>
                  )}
                  <button
                    onClick={nextQuestion}
                    className="btn-brush primary mt-4"
                  >
                    {qNum >= totalQuestions
                      ? <><Icon name="barChart" className="text-sm" /> <span>{t('quiz.seeResults')}</span></>
                      : <><span>{t('quiz.next')}</span> <Icon name="rightArrow" className="text-sm" /></>
                    }
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Over
  if (quizOver) {
    const total = state.quizCorrect + state.quizWrong;
    const accuracy = total > 0 ? Math.round((state.quizCorrect / total) * 100) : 0;

    return (
      <div className="space-y-6 relative">
        <InkParticles chars={QUIZ_INK_CHARS} />

        <div className="animate-slide-up relative z-10">
          <h1 className="text-3xl lg:text-4xl font-bold">
            <span className="gradient-text"><Icon name="quiz" /> {t('quiz.results')}</span>
          </h1>
        </div>

        <div className="flex justify-center relative z-10">
          <div className="w-full max-w-md">
            <div className="flash-card p-8 text-center animate-fade-in">
              <div className="text-5xl mb-4">
                {accuracy >= 80 ? <Icon name="party" /> : accuracy >= 60 ? <Icon name="like" /> : <Icon name="dumbbell" />}
              </div>
              <h2 className="text-xl font-bold mb-2">
                {accuracy >= 80 ? t('quiz.excellent') : accuracy >= 60 ? t('quiz.goodJob') : t('quiz.keepPracticing')}
              </h2>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div>
                  <p className="text-2xl font-bold" style={{ color: '#22c55e' }}>{state.quizCorrect}</p>
                  <p className="text-xs text-secondary mt-1">{t('quiz.correct')}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>{state.quizWrong}</p>
                  <p className="text-xs text-secondary mt-1">{t('quiz.wrong')}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--accent-from)' }}>{accuracy}%</p>
                  <p className="text-xs text-secondary mt-1">{t('quiz.accuracy')}</p>
                </div>
              </div>
              <button
                onClick={() => dispatch({ type: 'RESET_QUIZ' })}
                className="btn-brush primary mt-6"
              >
                <Icon name="refresh" className="text-sm" /> <span>{t('quiz.tryAgain')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Setup
  return (
    <div className="space-y-6 relative">
      <InkParticles chars={QUIZ_INK_CHARS} />

      {/* Header (unchanged) */}
      <div className="animate-slide-up relative z-10">
        <h1 className="text-3xl lg:text-4xl font-bold">
          <span className="gradient-text"><Icon name="quiz" /> {t('quiz.title')}</span>
        </h1>
        <p className="text-secondary mt-1">{t('quiz.subtitle')}</p>
      </div>

      {/* Settings panel */}
      <div className="flash-settings p-6 animate-slide-up relative z-10">
        <h3 className="font-semibold mb-6 flex items-center gap-2">
          <Icon name="cog" /> {t('quiz.mode')}
        </h3>

        <div className="space-y-5">
          {/* Question type */}
          <div className="fade-slide-up" style={{ animationDelay: '0.05s' }}>
            <p className="text-xs font-semibold tracking-wider uppercase text-muted mb-2">{t('quiz.questionType')}</p>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none snap-x snap-proximity">
              <button
                onClick={() => setQuestionType('meaning')}
                className={`ink-chip shrink-0 ${questionType === 'meaning' ? 'active' : ''}`}
              >
                <Icon name="transfer" className="text-xs" /> {t('quiz.chineseToThai')}
              </button>
              <button
                onClick={() => setQuestionType('pinyin')}
                className={`ink-chip shrink-0 ${questionType === 'pinyin' ? 'active' : ''}`}
              >
                <Icon name="fontFamily" className="text-xs" /> {t('quiz.pinyin')}
              </button>
              <button
                onClick={() => setQuestionType('chinese')}
                className={`ink-chip shrink-0 ${questionType === 'chinese' ? 'active' : ''}`}
              >
                <Icon name="transfer" className="text-xs" /> {t('quiz.thaiToChinese')}
              </button>
            </div>
          </div>

          {/* Pinyin toggle */}
          <div className="fade-slide-up" style={{ animationDelay: '0.1s' }}>
            <p className="text-xs font-semibold tracking-wider uppercase text-muted mb-2">{t('quiz.showPinyin')}</p>
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

          {/* Pinned + Saved */}
          <div className="fade-slide-up" style={{ animationDelay: '0.15s' }}>
            <p className="text-xs font-semibold tracking-wider uppercase text-muted mb-2">{t('quiz.pinnedSubcategories')}</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {state.pinnedSubcategories.map(subId => (
                <span key={subId} className="ink-chip pinned">
                  <Icon name={getSubcategoryIcon(subId)} className="text-xs" /> {subId}
                </span>
              ))}
              <button
                onClick={() => { setShowSaved(!showSaved); setSelectedSubcategories([]); }}
                className={`ink-chip flex items-center gap-1 ${
                  showSaved ? 'active' : ''
                }`}
              >
                <Icon name="bookmark" className="text-xs" />
                <span>{t('quiz.saved', { n: state.savedWordIds.length })}</span>
              </button>
            </div>
            <p className="text-xs font-semibold tracking-wider uppercase text-muted mb-2">{t('quiz.otherSubcategories')}</p>
            <div className="w-full md:w-fit">
              <div className="flex gap-1.5 mb-2 overflow-x-auto scrollbar-none">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.id); setSelectedSubcategories([]); setShowSaved(false); }}
                    className={`ink-chip shrink-0 ${selectedCategory === cat.id && !showSaved ? 'active' : ''}`}
                  >
                    <Icon name={cat.icon} className="text-xs" /> {state.language === 'th' ? cat.nameThai : cat.name}
                  </button>
                ))}
              </div>
              <div className="h-[1.5px] my-2" style={{background: 'var(--border-color)', opacity: 0.6}} />
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
              {!showSaved && currentCategory && currentCategory.subcategories.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => toggleSubcategory(sub.id)}
                  onDoubleClick={() => togglePinned(sub.id)}
                  className={`ink-chip ${
                    selectedSubcategories.includes(sub.id) ? 'active' : ''
                  } ${state.pinnedSubcategories.includes(sub.id) ? 'pinned' : ''}`}
                >
                  <Icon name={sub.icon} className="text-xs" /> {state.language === 'th' ? sub.nameThai : sub.name}
                </button>
              ))}
            </div>
          </div>

          {/* Status filter */}
          <div className="fade-slide-up" style={{ animationDelay: '0.15s' }}>
            <p className="text-xs font-semibold tracking-wider uppercase text-muted mb-2">{t('quiz.filterByStatus')}</p>
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

          {/* Number of questions */}
          <div className="fade-slide-up" style={{ animationDelay: '0.2s' }}>
            <p className="text-xs font-semibold tracking-wider uppercase text-muted mb-2">{t('quiz.questions')}</p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={5}
                max={30}
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="flex-1 ink-slider"
                style={{'--pct': `${((numQuestions - 5) / (30 - 5)) * 100}%`}}
              />
              <span className="text-sm font-medium min-w-[2.5rem] text-center tabular-nums">
                {numQuestions}
              </span>
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={startQuiz}
            className="btn-primary w-full justify-center mt-2 fade-slide-up"
            style={{ animationDelay: '0.3s' }}
          >
            <Icon name="quiz" /> {t('quiz.start')}
          </button>
        </div>
      </div>
    </div>
  );
}
