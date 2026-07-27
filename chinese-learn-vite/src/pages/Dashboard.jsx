import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import ContributionCalendar from '../components/ContributionCalendar';
import SpeakButton from '../components/SpeakButton';
import Icon from '../components/Icon';
import { VOCABULARY } from '../data/vocabulary';

export default function Dashboard() {
  const { state, studyWord } = useApp();

  const totalWords = VOCABULARY.length;
  const masteredWords = useMemo(
    () => Object.values(state.wordStatuses).filter(s => s === 'mastered').length,
    [state.wordStatuses]
  );
  const learningWords = useMemo(
    () => Object.values(state.wordStatuses).filter(s => s === 'learning' || s === 'reviewing').length,
    [state.wordStatuses]
  );

  const recentWords = useMemo(() => VOCABULARY.slice(0, 6), []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return <><Icon name="sun" className="text-amber-400" />{' '}早上好! Good Morning!</>;
    if (hour < 18) return <><Icon name="cloud" className="text-sky-400" />{' '}下午好! Good Afternoon!</>;
    return <><Icon name="moon" className="text-indigo-400" />{' '}晚上好! Good Evening!</>;
  };

  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <p className="text-sm text-secondary mb-1">{greeting()}</p>
        <h1 className="text-3xl lg:text-4xl font-bold">
          <span className="gradient-text">Dashboard</span>
        </h1>
        <p className="text-secondary mt-1">Track your Chinese learning progress</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
        <div className="glass-card p-5 glass-card-hover">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-lg text-blue-400"><Icon name="library" /></div>
            <div className="text-xs text-secondary font-medium">Total Words</div>
          </div>
          <p className="text-3xl font-bold text-primary">{totalWords}</p>
          <p className="text-xs text-muted mt-1">vocabulary items</p>
        </div>

        <div className="glass-card p-5 glass-card-hover">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-lg text-green-400"><Icon name="bookmark" /></div>
            <div className="text-xs text-secondary font-medium">Learned</div>
          </div>
          <p className="text-3xl font-bold text-primary">{learningWords + masteredWords}</p>
          <p className="text-xs text-muted mt-1">words in progress</p>
        </div>

        <div className="glass-card p-5 glass-card-hover">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center text-lg text-yellow-400"><Icon name="target" /></div>
            <div className="text-xs text-secondary font-medium">Studied Today</div>
          </div>
          <p className="text-3xl font-bold text-primary">{state.studiedToday}</p>
          <p className="text-xs text-muted mt-1">words reviewed</p>
        </div>

        <div className="glass-card p-5 glass-card-hover">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center text-lg text-pink-400"><Icon name="fire" /></div>
            <div className="text-xs text-secondary font-medium">Day Streak</div>
          </div>
          <p className="text-3xl font-bold text-primary">{state.streak}</p>
          <p className="text-xs text-muted mt-1">consecutive days</p>
        </div>
      </div>

      <div className="glass-card p-5 animate-slide-up">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-primary flex items-center gap-2"><Icon name="analytics" /> Learning Analytics</h3>
          <span className="text-xs text-secondary">
            {masteredWords}/{totalWords} mastered
          </span>
        </div>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-secondary">Mastered</span>
              <span className="text-green-400 font-medium">{masteredWords}</span>
            </div>
            <div className="h-2.5 progress-bar-bg rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-1000"
                style={{ width: `${(masteredWords / totalWords) * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-secondary">Learning</span>
              <span className="text-blue-400 font-medium">{learningWords}</span>
            </div>
            <div className="h-2.5 progress-bar-bg rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-gradient rounded-full transition-all duration-1000"
                style={{ width: `${(learningWords / totalWords) * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-secondary">New</span>
              <span className="text-secondary font-medium">{totalWords - masteredWords - learningWords}</span>
            </div>
            <div className="h-2.5 progress-bar-bg rounded-full overflow-hidden">
              <div
                className="h-full bg-card-hover rounded-full transition-all duration-1000"
                style={{ width: `${((totalWords - masteredWords - learningWords) / totalWords) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="animate-slide-up">
        <ContributionCalendar history={state.learningHistory} />
      </div>

      <div className="glass-card p-5 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-primary flex items-center gap-2"><Icon name="star" className="text-amber-400" /> Quick Study</h3>
          <span className="text-xs text-secondary">New words to try</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {recentWords.map(word => (
            <div key={word.id} className="relative group">
              <button
                onClick={() => studyWord(word.id)}
                className="glass-card p-4 text-center hover:bg-card-hover transition-all cursor-pointer border border-transparent hover:border-blue-500/20 w-full"
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <p className="text-2xl font-medium text-primary">{word.chinese}</p>
                  <SpeakButton text={word.chinese} size="sm" />
                </div>
                <p className="text-xs text-secondary">{word.pinyin}</p>
                <p className="text-xs text-muted mt-1">{word.meaning}</p>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
