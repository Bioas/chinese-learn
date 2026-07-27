import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import ContributionCalendar from '../components/ContributionCalendar';
import SpeakButton from '../components/SpeakButton';
import Icon from '../components/Icon';
import useTranslation from '../hooks/useTranslation';
import InkParticles from '../components/InkParticles';
import { VOCABULARY } from '../data/vocabulary';

const DASHBOARD_INK_CHARS = ['学', '习', '进', '步', '成', '功', '日', '积', '月', '累'];

export default function Dashboard() {
  const { t, meaning } = useTranslation();
  const { state, studyWord } = useApp();

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

  const recentWords = useMemo(() => VOCABULARY.slice(0, 6), []);

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
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-primary flex items-center gap-2"><Icon name="star" className="text-amber-400" /> {t('dash.quickStudy')}</h3>
          <span className="text-xs text-secondary">{t('dash.newWordsToTry')}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {recentWords.map(word => (
            <div key={word.id} className="relative group">
              <button
                onClick={() => studyWord(word.id)}
                className="glass-card p-4 text-center hover:bg-card-hover transition-all cursor-pointer border border-transparent hover:border-blue-500/20 w-full"
              >
                <p className="text-2xl font-medium text-primary mb-1">{word.chinese}</p>
                <p className="text-xs text-secondary">{word.pinyin}</p>
                <p className="text-xs text-muted mt-1 mb-3">{meaning(word)}</p>
                <SpeakButton text={word.chinese} variant="wide" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
