import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { VOCABULARY } from '../data/vocabulary';

const initialState = {
  vocabulary: VOCABULARY,
  studiedToday: 0,
  streak: 0,
  pinnedSubcategories: [],
  showPinyin: true,
  currentFlashcardIndex: 0,
  flashcardWords: [],
  quizWords: [],
  quizIndex: 0,
  quizCorrect: 0,
  quizWrong: 0,
  searchQuery: '',
  savedWordIds: [],
  learningHistory: {},
  wordStatuses: {},
  lastStudyDate: null,
  theme: 'light',
  language: 'en',
};

function appReducer(state, action) {
  switch (action.type) {
    case 'STUDY_WORD': {
      const today = new Date().toISOString().split('T')[0];
      const newHistory = { ...state.learningHistory };
      newHistory[today] = (newHistory[today] || 0) + 1;

      const newStatuses = { ...state.wordStatuses };
      const currentStatus = newStatuses[action.wordId] || 'new';
      if (currentStatus === 'new') newStatuses[action.wordId] = 'learning';
      else if (currentStatus === 'learning') newStatuses[action.wordId] = 'reviewing';
      else if (currentStatus === 'reviewing') {
        const studiedCount = Object.values(newHistory).reduce((a, b) => a + b, 0);
        if (studiedCount > 20) newStatuses[action.wordId] = 'mastered';
      }

      const studiedToday = newHistory[today] || 0;

      let streak = state.streak;
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (state.lastStudyDate === yesterday || state.lastStudyDate === today) {
        if (state.lastStudyDate !== today) streak += 1;
      } else if (state.lastStudyDate !== today) {
        streak = 1;
      }

      return {
        ...state,
        studiedToday,
        streak,
        learningHistory: newHistory,
        wordStatuses: newStatuses,
        lastStudyDate: today,
      };
    }
    case 'TOGGLE_PINNED': {
      const pinned = state.pinnedSubcategories.includes(action.subcategoryId)
        ? state.pinnedSubcategories.filter(id => id !== action.subcategoryId)
        : [...state.pinnedSubcategories, action.subcategoryId];
      return { ...state, pinnedSubcategories: pinned };
    }
    case 'TOGGLE_PINYIN':
      return { ...state, showPinyin: !state.showPinyin };
    case 'SET_THEME':
      return { ...state, theme: action.theme };
    case 'SET_LANGUAGE':
      return { ...state, language: action.language };
    case 'SET_FLASHCARD_WORDS':
      return { ...state, flashcardWords: action.words, currentFlashcardIndex: 0 };
    case 'NEXT_FLASHCARD':
      return {
        ...state,
        currentFlashcardIndex: Math.min(state.currentFlashcardIndex + 1, state.flashcardWords.length - 1),
      };
    case 'PREV_FLASHCARD':
      return {
        ...state,
        currentFlashcardIndex: Math.max(state.currentFlashcardIndex - 1, 0),
      };
    case 'SET_QUIZ_WORDS':
      return { ...state, quizWords: action.words, quizIndex: 0, quizCorrect: 0, quizWrong: 0 };
    case 'QUIZ_ANSWER':
      return {
        ...state,
        quizIndex: state.quizIndex + 1,
        quizCorrect: action.correct ? state.quizCorrect + 1 : state.quizCorrect,
        quizWrong: action.correct ? state.quizWrong : state.quizWrong + 1,
      };
    case 'RESET_QUIZ':
      return { ...state, quizIndex: 0, quizCorrect: 0, quizWrong: 0, quizWords: [] };
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.query };
    case 'TOGGLE_SAVED_WORD': {
      const saved = state.savedWordIds.includes(action.wordId)
        ? state.savedWordIds.filter(id => id !== action.wordId)
        : [...state.savedWordIds, action.wordId];
      return { ...state, savedWordIds: saved };
    }
    case 'UPDATE_WORD_STATUS':
      return {
        ...state,
        wordStatuses: { ...state.wordStatuses, [action.wordId]: action.status },
      };
    case 'LOAD_STATE':
      return { ...state, ...action.state };
    default:
      return state;
  }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState, (initial) => {
    try {
      const saved = localStorage.getItem('chinese-learn-state');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...initial, ...parsed };
      }
    } catch {}
    return initial;
  });

  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip saving on first render (hydration)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const { vocabulary, flashcardWords, quizWords, ...savable } = state;
    localStorage.setItem('chinese-learn-state', JSON.stringify(savable));
  }, [state]);

  const studyWord = useCallback((wordId) => {
    dispatch({ type: 'STUDY_WORD', wordId });
  }, []);

  const togglePinned = useCallback((subcategoryId) => {
    dispatch({ type: 'TOGGLE_PINNED', subcategoryId });
  }, []);

  const togglePinyin = useCallback(() => {
    dispatch({ type: 'TOGGLE_PINYIN' });
  }, []);

  const updateWordStatus = useCallback((wordId, status) => {
    dispatch({ type: 'UPDATE_WORD_STATUS', wordId, status });
  }, []);

  const toggleSavedWord = useCallback((wordId) => {
    dispatch({ type: 'TOGGLE_SAVED_WORD', wordId });
  }, []);

  const setTheme = useCallback((theme) => {
    dispatch({ type: 'SET_THEME', theme });
  }, []);

  const setLanguage = useCallback((language) => {
    dispatch({ type: 'SET_LANGUAGE', language });
  }, []);

  // Sync theme to <html> class
  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
  }, [state.theme]);

  return (
    <AppContext.Provider value={{ state, dispatch, studyWord, togglePinned, togglePinyin, updateWordStatus, toggleSavedWord, setTheme, setLanguage }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
