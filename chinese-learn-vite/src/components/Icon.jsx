import React from 'react';

const ICON_MAP = {
  // Navigation
  dashboard: 'bx-grid-alt',
  vocabulary: 'bx-book-open',
  flashcards: 'bx-layer',
  quiz: 'bx-edit-alt',
  search: 'bx-search',
  close: 'bx-x',
  menu: 'bx-menu-alt-right',

  // Dashboard
  library: 'bx-library',
  bookmark: 'bx-book-bookmark',
  target: 'bx-target-lock',
  fire: 'bxs-hot',
  analytics: 'bx-line-chart-down',
  star: 'bxs-star',
  sun: 'bx-sun',
  cloud: 'bx-cloud',
  moon: 'bx-moon',
  check: 'bx-check',
  xmark: 'bx-x',
  plus: 'bx-plus',

  // Vocabulary
  pin: 'bxs-pin',
  chevronDown: 'bx-chevron-down',
  chevronLeft: 'bx-chevron-left',
  chevronRight: 'bx-chevron-right',

  // Flashcards
  cog: 'bx-cog',
  rightArrow: 'bx-right-arrow-alt',
  leftArrow: 'bx-left-arrow-alt',

  // Quiz
  party: 'bx-party',
  like: 'bx-like',
  dumbbell: 'bx-dumbbell',
  refresh: 'bx-refresh',
  fontFamily: 'bx-font-family',
  transfer: 'bx-transfer-alt',
  barChart: 'bx-bar-chart-alt',

  // Search
  searchAlt: 'bx-search-alt',
  searchAlt2: 'bx-search-alt-2',

  // Calendar
  calendar: 'bx-calendar-event',

  // App
  messageDetail: 'bx-message-square-detail',
  heart: 'bx-heart',
  checkCircle: 'bx-check-circle',

  // Category icons
  circle: 'bxs-circle',
  wave: 'bx-hand',
  food: 'bxs-bowl-hot',
  shopping: 'bxs-shopping-bag',
  travel: 'bxs-plane',
  time: 'bxs-time',
  family: 'bxs-group',
  colors: 'bxs-palette',
  numbers: 'bxs-hashtag',
};

export default function Icon({ name, className = '' }) {
  const iconClass = ICON_MAP[name];
  if (!iconClass) {
    console.warn(`Icon "${name}" not found in ICON_MAP`);
    return null;
  }
  return <i className={`bx ${iconClass} ${className}`.trim()} />;
}
