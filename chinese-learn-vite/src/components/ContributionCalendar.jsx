import React, { useMemo } from 'react';
import Icon from './Icon';
import useTranslation from '../hooks/useTranslation';

export default function ContributionCalendar({ history }) {
  const { t } = useTranslation();
  const weeks = useMemo(() => {
    const result = [];
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    const startDate = new Date(oneYearAgo);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    let currentWeek = [];
    const current = new Date(startDate);

    while (current <= today || currentWeek.length > 0) {
      const dateStr = current.toISOString().split('T')[0];
      currentWeek.push({
        date: dateStr,
        count: history[dateStr] || 0,
      });

      if (current.getDay() === 6) {
        result.push(currentWeek);
        currentWeek = [];
      }

      current.setDate(current.getDate() + 1);

      if (current > today && currentWeek.length > 0) {
        while (currentWeek.length < 7) {
          const nextDate = new Date(current);
          nextDate.setDate(nextDate.getDate() + currentWeek.length);
          currentWeek.push({
            date: nextDate.toISOString().split('T')[0],
            count: 0,
          });
        }
        result.push(currentWeek);
        currentWeek = [];
      }
    }

    return result;
  }, [history]);

  const getColor = (count) => {
    if (count === 0) return 'bg-gray-200 dark:bg-card-hover';
    if (count <= 3) return 'bg-green-300 dark:bg-green-900/60';
    if (count <= 6) return 'bg-green-400 dark:bg-green-700/60';
    if (count <= 10) return 'bg-green-500 dark:bg-green-500/60';
    return 'bg-green-600 dark:bg-green-400/80';
  };

  const totalDays = Object.keys(history).length;

  const longestStreak = useMemo(() => {
    const sorted = Object.entries(history)
      .filter(([_, count]) => count > 0)
      .map(([date]) => date)
      .sort();

    if (sorted.length === 0) return 0;

    let maxStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else if (diffDays > 1) {
        currentStreak = 1;
      }
    }

    return maxStreak;
  }, [history]);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-primary flex items-center gap-2"><Icon name="calendar" /> {t('calendar.title')}</h3>
          <p className="text-xs text-secondary mt-0.5">{t('calendar.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-secondary">
          <span>{t('calendar.days', { n: totalDays })}</span>
          <span className="w-px h-4 bg-card-hover" />
          <span>{t('calendar.best', { n: longestStreak })}</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex gap-0.5" style={{ minWidth: Math.max(weeks.length * 10, 500) }}>
          <div className="flex flex-col gap-0.5 mr-1 text-[8px] text-muted pt-4">
            <span className="h-[10px]">{t('calendar.mon')}</span>
            <span className="h-[10px]">{t('calendar.wed')}</span>
            <span className="h-[10px]">{t('calendar.fri')}</span>
          </div>

          <div className="flex gap-0.5">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((day, di) => (
                  <div
                    key={`${wi}-${di}`}
                    className={`w-[10px] h-[10px] rounded-sm ${getColor(day.count)} transition-colors hover:ring-1 hover:ring-white/20 cursor-pointer`}
                    title={t('calendar.dayLabel', { date: day.date, count: day.count })}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 mt-3 text-[10px] text-muted">
        <span>{t('calendar.less')}</span>
        <div className="w-[10px] h-[10px] rounded-sm bg-gray-200 dark:bg-card-hover" />
        <div className="w-[10px] h-[10px] rounded-sm bg-green-300 dark:bg-green-900/60" />
        <div className="w-[10px] h-[10px] rounded-sm bg-green-400 dark:bg-green-700/60" />
        <div className="w-[10px] h-[10px] rounded-sm bg-green-500 dark:bg-green-500/60" />
        <div className="w-[10px] h-[10px] rounded-sm bg-green-600 dark:bg-green-400/80" />
        <span>{t('calendar.more')}</span>
      </div>
    </div>
  );
}
