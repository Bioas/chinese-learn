import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef, useState } from 'react';
import { supabase, isSupabaseReady } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { isDemoMode } from './AuthContext';

const initialState = {
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
  savedConvIds: [],
  convStatuses: {},
  learningHistory: {},
  wordStatuses: {},
  lastStudyDate: null,
  theme: 'light',
  language: 'en',
};

// Order of status "advancement" we use when merging two devices' progress
const STATUS_RANK = { new: 0, learning: 1, reviewing: 2, mastered: 3 };

function pickStrongerStatus(a, b) {
  const ra = STATUS_RANK[a] ?? 0;
  const rb = STATUS_RANK[b] ?? 0;
  return ra >= rb ? a : b;
}

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
    case 'TOGGLE_SAVED_CONV': {
      const saved = state.savedConvIds.includes(action.convId)
        ? state.savedConvIds.filter(id => id !== action.convId)
        : [...state.savedConvIds, action.convId];
      return { ...state, savedConvIds: saved };
    }
    case 'UPDATE_CONV_STATUS':
      return {
        ...state,
        convStatuses: { ...state.convStatuses, [action.convId]: action.status },
      };
    case 'LOAD_STATE':
      return { ...state, ...action.state };
    default:
      return state;
  }
}

/**
 * Deep-merge local + remote progress so neither device's work is lost.
 * Strategy:
 *   - arrays of IDs (savedWordIds, pinnedSubcategories): union + dedupe
 *   - learningHistory (date → count): take the MAX count per date so we keep
 *     the best record across devices
 *   - wordStatuses (wordId → status): keep the "more advanced" status
 *   - scalar fields (streak: max; lastStudyDate: most recent)
 *   - studiedToday: recomputed from the merged learningHistory[today] so
 *     studying on both devices adds up rather than being capped at one
 *   - everything else (theme, language, showPinyin): remote wins (it's the
 *     view preference of the device they last used)
 */
function mergeProgress(local, remote) {
  if (!remote) return local;
  if (!local) return remote;

  const merged = { ...local, ...remote };

  // Arrays: union
  merged.savedWordIds = Array.from(
    new Set([...(local.savedWordIds || []), ...(remote.savedWordIds || [])])
  );
  merged.savedConvIds = Array.from(
    new Set([...(local.savedConvIds || []), ...(remote.savedConvIds || [])])
  );
  merged.pinnedSubcategories = Array.from(
    new Set([...(local.pinnedSubcategories || []), ...(remote.pinnedSubcategories || [])])
  );

  // learningHistory: take max per day
  const history = { ...(local.learningHistory || {}) };
  for (const [date, count] of Object.entries(remote.learningHistory || {})) {
    history[date] = Math.max(history[date] || 0, count || 0);
  }
  merged.learningHistory = history;

  // wordStatuses: keep the stronger status for each word
  const statuses = { ...(local.wordStatuses || {}) };
  for (const [wordId, status] of Object.entries(remote.wordStatuses || {})) {
    statuses[wordId] = pickStrongerStatus(statuses[wordId], status);
  }
  merged.wordStatuses = statuses;
  // convStatuses: keep the more advanced status
  const convSt = { ...(local.convStatuses || {}) };
  for (const [convId, status] of Object.entries(remote.convStatuses || {})) {
    convSt[convId] = pickStrongerStatus(convSt[convId], status);
  }
  merged.convStatuses = convSt;

  // Scalar fields
  merged.streak = Math.max(local.streak || 0, remote.streak || 0);

  // studiedToday: derive from merged learningHistory so multi-device adds up
  const today = new Date().toISOString().split('T')[0];
  merged.studiedToday = history[today] || 0;

  // lastStudyDate: pick the most recent
  if ((remote.lastStudyDate || '') > (local.lastStudyDate || '')) {
    merged.lastStudyDate = remote.lastStudyDate;
  }

  return merged;
}

// Drop non-portable fields before sending to / receiving from the cloud
const PORTABLE_KEYS = [
  'studiedToday',
  'streak',
  'pinnedSubcategories',
  'showPinyin',
  'savedWordIds',
  'savedConvIds',
  'convStatuses',
  'learningHistory',
  'wordStatuses',
  'lastStudyDate',
  'theme',
  'language',
];

function pickPortable(state) {
  const portable = {};
  for (const key of PORTABLE_KEYS) {
    if (state[key] !== undefined) portable[key] = state[key];
  }
  return portable;
}

const AppContext = createContext(null);

// Single source of truth for pushing the current portable state to Supabase.
// Takes setters as an options object (instead of positional) so future params
// can be added without breaking call sites.
async function pushToCloud(userId, portable, { setSyncStatus, setLastSyncError }) {
  try {
    const { error } = await supabase.from('user_progress').upsert(
      {
        user_id: userId,
        data: portable,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
    if (error) {
      console.warn('Supabase sync error:', error.message);
      setLastSyncError?.(error.message || 'Supabase rejected the row');
      setSyncStatus('error');
      return false;
    }
    setLastSyncError?.(null);
    setSyncStatus('saved');
    setTimeout(() => {
      setSyncStatus((s) => (s === 'saved' ? 'idle' : s));
    }, 2500);
    return true;
  } catch (err) {
    console.warn('Cloud sync failed (offline?):', err.message);
    setLastSyncError?.(err?.message || 'Network unreachable');
    setSyncStatus('offline');
    return false;
  }
}

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

  const { user } = useAuth();
  const isFirstRender = useRef(true);
  const syncTimeoutRef = useRef(null);
  // Until we have loaded from the cloud we MUST NOT push to it, otherwise a
  // slow network would let the user's empty local state clobber their cloud
  // data the moment they log in.
  const isCloudLoaded = useRef(false);
  // Suppress the next save after applying a pull-from-cloud, otherwise the
  // sync effect would immediately echo it straight back to the server.
  const skipNextSync = useRef(false);

  // Sync status surfaced to UI: 'idle' | 'saving' | 'saved' | 'offline' | 'error'
  // Initial state honors the demo-mode flag so local dev starts at 'idle'
  // and gets the simulated cycle on first state change.
  const [syncStatus, setSyncStatus] = useState(() =>
    isSupabaseReady() || isDemoMode ? 'idle' : 'offline'
  );

  // Most recent sync-failure message, surfaced via tooltip on the inline
  // status label so users can self-diagnose why the indicator shows
  // 'Offline' or 'Error' instead of guessing.
  const [lastSyncError, setLastSyncError] = useState(null);

  // Keep a ref of latest state so realtime callbacks read fresh values
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Save to localStorage on every state change (skip initial hydration)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    try {
      localStorage.setItem('chinese-learn-state', JSON.stringify(state));
    } catch {}
  }, [state]);

  // ---- Cloud sync: push to Supabase (debounced) ----------------------------
  useEffect(() => {
    if (!user) {
      setSyncStatus('offline');
      setLastSyncError(null);            // logged out by definition, not an error
      return;
    }

    if (!isSupabaseReady()) {
      if (isDemoMode) {
        // Demo mode: simulate the full saving → saved → idle cycle locally so
        // visual feedback matches what a user with real Supabase would see.
        // Reuses the existing debounce ref so rapid state changes don't pile up
        // overlapping timeouts.
        setSyncStatus('saving');
        setLastSyncError(null);
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(() => {
          setSyncStatus('saved');
          setTimeout(() => {
            setSyncStatus((s) => (s === 'saved' ? 'idle' : s));
          }, 2500);
        }, 600); // 600ms feels snappy without being instant
      } else {
        // Real Supabase env but the JS client failed to init (bad URL, etc.).
        setSyncStatus('offline');
        setLastSyncError('Supabase credentials missing — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
      }
      return;
    }

    if (!isCloudLoaded.current) return; // wait until we've pulled first
    if (isFirstRender.current) return;

    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }

    setSyncStatus('saving');
    setLastSyncError(null);
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    syncTimeoutRef.current = setTimeout(() => {
      pushToCloud(user.id, pickPortable(state), { setSyncStatus, setLastSyncError });
    }, 3000);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [user, state, setSyncStatus]);

  // ---- Cloud sync: pull from Supabase + subscribe to realtime --------------
  useEffect(() => {
    if (!user || !isSupabaseReady()) {
      isCloudLoaded.current = false;
      return;
    }

    let cancelled = false;

    const applyRemote = (remote) => {
      if (cancelled) return;
      // Always merge against the freshest in-memory state, not the closure
      // capture — otherwise a previous LOAD_STATE could be overwritten.
      const merged = mergeProgress(pickPortable(stateRef.current), remote || {});
      skipNextSync.current = true; // do NOT echo this back to the server
      dispatch({ type: 'LOAD_STATE', state: merged });
    };

    // Initial pull
    supabase
      .from('user_progress')
      .select('data')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error && error.code !== 'PGRST116') {
          console.warn('Supabase load error:', error.message);
          setLastSyncError(error.message || 'Could not load your progress from the cloud');
          setSyncStatus('error');
        }
        isCloudLoaded.current = true;
        if (data?.data) {
          applyRemote(data.data);
        } else {
          // NEW USER (or first cloud row): no remote data. Their localStorage
          // progress needs to be uploaded on first sync, otherwise it lives
          // only on this device forever. Push it now so the cloud row exists.
          setSyncStatus('saving');
          setLastSyncError(null);
          setTimeout(() => {
            if (cancelled) return;
            pushToCloud(user.id, pickPortable(stateRef.current), { setSyncStatus, setLastSyncError });
          }, 400);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('Supabase load failed (offline?):', err.message);
        setLastSyncError(err?.message || 'Network unreachable');
        // Still mark as loaded so we can push fresh local edits later
        isCloudLoaded.current = true;
        setSyncStatus('offline');
      });

    // Realtime subscription so other devices' edits propagate live
    const channel = supabase
      .channel(`user_progress:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_progress',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (cancelled) return;
          // Any UPDATE event arriving from the server means we successfully
          // received data — clear any previous error so the tooltip reverts.
          setLastSyncError(null);
          applyRemote(payload.new?.data);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      isCloudLoaded.current = false;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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

  const toggleSavedConv = useCallback((convId) => {
    dispatch({ type: 'TOGGLE_SAVED_CONV', convId });
  }, []);

  const updateConvStatus = useCallback((convId, status) => {
    dispatch({ type: 'UPDATE_CONV_STATUS', convId, status });
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

  // Manual "sync now" trigger so UI can force a push (e.g. on logout, or
  // the user clicking "Retry" in the popover when they see an error).
  const syncNow = useCallback(async () => {
    if (!user || !isSupabaseReady()) return false;
    return pushToCloud(user.id, pickPortable(stateRef.current), { setSyncStatus, setLastSyncError });
  }, [user, setSyncStatus]);

  return (
    <AppContext.Provider value={{
      state, dispatch,
      studyWord, togglePinned, togglePinyin, updateWordStatus, toggleSavedWord,
      toggleSavedConv, updateConvStatus,
      setTheme, setLanguage,
      syncStatus, lastSyncError, syncNow,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
