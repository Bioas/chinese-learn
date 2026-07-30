import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import ContributionCalendar from '../components/ContributionCalendar';
import SpeakButton from '../components/SpeakButton';
import Icon from '../components/Icon';
import useTranslation from '../hooks/useTranslation';
import InkParticles from '../components/InkParticles';
import { VOCABULARY, CATEGORIES } from '../data/vocabulary';
import { CONVERSATIONS } from '../data/conversations';

const DASHBOARD_INK_CHARS = ['学', '习', '进', '步', '成', '功', '日', '积', '月', '累'];

// Fisher–Yates shuffle — pure, returns new array; re-randomizes Quick Study cards.
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Localized subcategory label e.g. "HSK 1" (en) / "HSK 1" (th). Returns '' if not found.
function getSubcategoryLabel(word, language) {
  const cat = CATEGORIES.find(c => c.id === word.category);
  if (!cat) return '';
  const sub = cat.subcategories.find(s => s.id === word.subcategory);
  if (!sub) return '';
  return language === 'th' ? sub.nameThai : sub.name;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { t, meaning } = useTranslation();
  const { state, dispatch } = useApp();

  const totalWords = VOCABULARY.length;
  const masteredWords = useMemo(
    () => Object.values(state.wordStatuses).filter(s => s === 'mastered').length,
    [state.wordStatuses]
  );
  const reviewingWords = useMemo(
    () => Object.values(state.wordStatuses).filter(s => s === 'reviewing').length,
    [state.wordStatuses]
  );
  const learningWords = useMemo(
    () => Object.values(state.wordStatuses).filter(s => s === 'learning').length,
    [state.wordStatuses]
  );
  const newWords = useMemo(
    () => totalWords - masteredWords - reviewingWords - learningWords,
    [masteredWords, reviewingWords, learningWords]
  );

  // Quick Study: dedupe + random-pick 6 vocab cards, re-shuffles when user clicks the Shuffle button.
  const [studyShuffleKey, setStudyShuffleKey] = useState(0);
  const recentWords = useMemo(() => {
    const seen = new Set();
    const deduped = VOCABULARY.filter(w => {
      if (seen.has(w.chinese)) return false;
      seen.add(w.chinese);
      return true;
    });
    return shuffleArray(deduped).slice(0, 6);
  }, [studyShuffleKey]);

  // Quick Conversations: random-pick 3 conversation cards
  const [convShuffleKey, setConvShuffleKey] = useState(0);
  const recentConvs = useMemo(() => {
    return shuffleArray(CONVERSATIONS).slice(0, 3);
  }, [convShuffleKey]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return <><Icon name="sun" className="text-amber-400" />{' '}{t('dash.greeting.morning')}</>;
    if (hour < 18) return <><Icon name="cloud" className="text-sky-400" />{' '}{t('dash.greeting.afternoon')}</>;
    return <><Icon name="moon" className="text-indigo-400" />{' '}{t('dash.greeting.evening')}</>;
  };

  return (
    <div className="space-y-6 relative">
      <InkParticles chars={DASHBOARD_INK_CHARS} />

      <div className="animate-slide-up relative z-10 !mt-0">
        <p className="text-sm text-secondary mb-1">{greeting()}</p>
        <h1 className="text-3xl lg:text-4xl font-bold">
          <span className="gradient-text">{t('dash.title')}</span>
        </h1>
        <p className="text-secondary mt-1">{t('dash.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up relative z-10">
        <div className="glass-card p-5 glass-card-hover">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-lg text-blue-400"><Icon name="library" /></div>
            <div className="text-xs text-secondary font-medium">{t('dash.totalWords')}</div>
          </div>
          <p className="text-3xl font-bold text-primary">{totalWords}</p>
          <p className="text-xs text-muted mt-1">{t('dash.vocabItems')}</p>
        </div>

        <div className="glass-card p-5 glass-card-hover">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-lg text-green-400"><Icon name="bookmark" /></div>
            <div className="text-xs text-secondary font-medium">{t('dash.learned')}</div>
          </div>
          <p className="text-3xl font-bold text-primary">{learningWords + masteredWords}</p>
          <p className="text-xs text-muted mt-1">{t('dash.wordsInProgress')}</p>
        </div>

        <div className="glass-card p-5 glass-card-hover">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center text-lg text-yellow-400"><Icon name="target" /></div>
            <div className="text-xs text-secondary font-medium">{t('dash.studiedToday')}</div>
          </div>
          <p className="text-3xl font-bold text-primary">{state.studiedToday}</p>
          <p className="text-xs text-muted mt-1">{t('dash.wordsReviewed')}</p>
        </div>

        <div className="glass-card p-5 glass-card-hover">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center text-lg text-pink-400"><Icon name="fire" /></div>
            <div className="text-xs text-secondary font-medium">{t('dash.dayStreak')}</div>
          </div>
          <p className="text-3xl font-bold text-primary">{state.streak}</p>
          <p className="text-xs text-muted mt-1">{t('dash.consecutiveDays')}</p>
        </div>
      </div>

      <div className="glass-card p-5 animate-slide-up relative z-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-primary flex items-center gap-2"><Icon name="analytics" /> {t('dash.analytics')}</h3>
          <span className="text-xs text-secondary">
            {t('dash.masteredFraction', { n: masteredWords, total: totalWords })}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 mb-4">
          {[
            { label: t('dash.mastered'), count: masteredWords, color: 'bg-green-500', textColor: 'text-green-400' },
            { label: t('dash.reviewing'), count: reviewingWords, color: 'bg-red-500', textColor: 'text-red-400' },
            { label: t('dash.learning'), count: learningWords, color: 'bg-yellow-500', textColor: 'text-yellow-400' },
            { label: t('dash.new'), count: newWords, color: 'bg-slate-500', textColor: 'text-muted' },
          ].map(item => (
            <div key={item.label} className="glass-card p-3 text-center">
              <p className={`text-lg font-bold ${item.textColor}`}>{item.count}</p>
              <p className="text-[10px] text-muted mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
        <div className="h-2.5 progress-bar-bg rounded-full overflow-hidden flex">
          <div
            className="h-full bg-green-500 transition-all duration-1000"
            style={{ width: `${(masteredWords / totalWords) * 100}%` }}
          />
          <div
            className="h-full bg-red-500 transition-all duration-1000"
            style={{ width: `${(reviewingWords / totalWords) * 100}%` }}
          />
          <div
            className="h-full bg-yellow-500 transition-all duration-1000"
            style={{ width: `${(learningWords / totalWords) * 100}%` }}
          />
          <div
            className="h-full bg-slate-500/30 transition-all duration-1000"
            style={{ width: `${(newWords / totalWords) * 100}%` }}
          />
        </div>
      </div>

      <div className="animate-slide-up relative z-10">
        <ContributionCalendar history={state.learningHistory} />
      </div>

      <div className="glass-card p-5 animate-slide-up relative z-10">
        <div className="flex items-center justify-between mb-4 gap-2">
          <h3 className="font-semibold text-primary flex items-center gap-2"><Icon name="star" className="text-amber-400" /> {t('dash.quickStudy')}</h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-secondary">{t('dash.newWordsToTry')}</span>
            <button
              onClick={() => setStudyShuffleKey(k => k + 1)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted hover:text-primary hover:bg-white/[0.04] transition-colors shrink-0"
              title={state.language === 'th' ? 'สุ่มคำใหม่' : 'Reshuffle'}
            >
              <Icon name="shuffle" className="text-sm" />
              <span className="hidden md:inline">{state.language === 'th' ? 'สุ่มใหม่' : 'Shuffle'}</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {recentWords.map(word => {
            const s = state.wordStatuses[word.id] || 'new';
            return (
              <div key={word.id} className="glass-card p-4 hover:bg-card-hover transition-all border border-transparent hover:border-blue-500/20 flex flex-col gap-2 text-left">
                {/* Top: Chinese char + SpeakButton on the right */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-2xl font-medium text-primary">{word.chinese}</span>
                  <SpeakButton text={word.chinese} variant="icon" size="sm" />
                </div>
                <p className="text-xs text-secondary">{word.pinyin}</p>
                <p className="text-xs text-muted flex items-baseline gap-2">
                  <span className="flex-1 min-w-0">{meaning(word)}</span>
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-muted/55 shrink-0">
                    {getSubcategoryLabel(word, state.language)}
                  </span>
                </p>
                {/* 3 status buttons — toggle (set or unset back to 'new') */}
                <div className="flex gap-1 mt-auto pt-2 border-t border-white/[0.04]">
                  <button
                    onClick={(e) => { e.stopPropagation(); dispatch({ type: 'UPDATE_WORD_STATUS', wordId: word.id, status: s === 'mastered' ? 'new' : 'mastered' }); }}
                    className={`flex-1 text-[10px] py-1.5 rounded-md font-medium transition-all duration-200 ${
                      s === 'mastered'
                        ? 'bg-green-100 text-green-800 ring-1 ring-green-400 dark:bg-green-500/20 dark:text-green-300 dark:ring-green-500/30'
                        : 'bg-white/[0.03] text-muted hover:bg-green-500/10 hover:text-green-400 hover:ring-1 hover:ring-green-500/20'
                    }`}
                  >
                    {state.language === 'th' ? 'จำได้' : 'Got it'}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); dispatch({ type: 'UPDATE_WORD_STATUS', wordId: word.id, status: s === 'learning' ? 'new' : 'learning' }); }}
                    className={`flex-1 text-[10px] py-1.5 rounded-md font-medium transition-all duration-200 ${
                      s === 'learning'
                        ? 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-400 dark:bg-yellow-500/20 dark:text-yellow-300 dark:ring-yellow-500/30'
                        : 'bg-white/[0.03] text-muted hover:bg-yellow-500/10 hover:text-yellow-400 hover:ring-1 hover:ring-yellow-500/20'
                    }`}
                  >
                    {state.language === 'th' ? 'กำลังเรียน' : 'Learning'}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); dispatch({ type: 'UPDATE_WORD_STATUS', wordId: word.id, status: s === 'reviewing' ? 'new' : 'reviewing' }); }}
                    className={`flex-1 text-[10px] py-1.5 rounded-md font-medium transition-all duration-200 ${
                      s === 'reviewing'
                        ? 'bg-red-100 text-red-800 ring-1 ring-red-400 dark:bg-red-500/20 dark:text-red-300 dark:ring-red-500/30'
                        : 'bg-white/[0.03] text-muted hover:bg-red-500/10 hover:text-red-400 hover:ring-1 hover:ring-red-500/20'
                    }`}
                  >
                    {state.language === 'th' ? 'ทบทวน' : 'Review'}
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Conversations */}
      <div className="glass-card p-5 animate-slide-up relative z-10">
        <div className="flex items-center justify-between mb-4 gap-2">
          <h3 className="font-semibold text-primary flex items-center gap-2"><Icon name="messageDetail" className="text-amber-400" /> {t('dash.quickConv')}</h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-secondary">{t('dash.convToTry')}</span>
            <button
              onClick={() => setConvShuffleKey(k => k + 1)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted hover:text-primary hover:bg-white/[0.04] transition-colors shrink-0"
              title={state.language === 'th' ? 'สุ่มบทสนทนาใหม่' : 'Reshuffle'}
            >
              <Icon name="shuffle" className="text-sm" />
              <span className="hidden md:inline">{state.language === 'th' ? 'สุ่มใหม่' : 'Shuffle'}</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {recentConvs.map(conv => {
            const catColor = conv.category === 'hsk' ? '#f97316' : conv.category === 'daily' ? '#e11d48' : conv.category === 'health' ? '#f43f5e' : conv.category === 'education' ? '#8b5cf6' : conv.category === 'technology' ? '#06b6d4' : conv.category === 'business' ? '#eab308' : conv.category === 'nature' ? '#22c55e' : '#a89488';
            return (
              <div
                key={conv.id}
                className="relative rounded-xl flex flex-col transition-all duration-300 overflow-hidden cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                }}
                onClick={() => navigate('/conversations')}
              >
                <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${catColor}, transparent)` }} />
                <div className="p-3.5">
                  <p className="text-xs font-semibold text-primary leading-snug">
                    {state.language === 'th' ? conv.titleThai : conv.title}
                  </p>
                  <p className="text-[10px] text-muted/70 mt-1.5 line-clamp-2 leading-snug">
                    {state.language === 'th' ? conv.settingThai : conv.setting}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
