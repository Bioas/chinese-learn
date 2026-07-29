import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseReady } from '../lib/supabase';

const AuthContext = createContext(null);

// Demo mode is for LOCAL DEVELOPMENT when Supabase isn't configured yet.
// It is gated by THREE conditions, all of which must be true:
//   1. import.meta.env.DEV        — only ever true inside `vite dev` (never in production bundle)
//   2. VITE_DEMO_MODE === 'true'  — must be explicitly opted-in via .env.local
//   3. !isSupabaseReady()         — refuses to override when real credentials exist
// Result: a fake user is set on login so visual flows (avatar dropdown, navbar) can
// be inspected before real auth is wired up. Production behavior is unchanged.
const isDemoMode =
  import.meta.env.DEV === true &&
  import.meta.env.VITE_DEMO_MODE === 'true' &&
  isSupabaseReady() === false;

// Exported so AppContext can branch the sync effect on the same flag.
export { isDemoMode };

const buildDemoUser = (email) => ({
  id: 'demo-user-id',
  email,
  created_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseReady()) {
      setLoading(false);
      return;
    }

    // Check current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const login = useCallback(async (email, password) => {
    if (isDemoMode) {
      setUser(buildDemoUser(email));
      return;
    }
    if (!isSupabaseReady()) throw new Error('Supabase not configured. Please set environment variables.');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const register = useCallback(async (email, password) => {
    if (isDemoMode) {
      setUser(buildDemoUser(email));
      return;
    }
    if (!isSupabaseReady()) throw new Error('Supabase not configured. Please set environment variables.');
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }, []);

  const loginWithGoogle = useCallback(async () => {
    if (isDemoMode) {
      setUser(buildDemoUser('demo.google@local.test'));
      return;
    }
    if (!isSupabaseReady()) throw new Error('Supabase not configured. Please set environment variables.');
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) throw error;
  }, []);

  const resetPassword = useCallback(async (email) => {
    if (isDemoMode) {
      // No-op in demo mode — pretend the email was sent
      return;
    }
    if (!isSupabaseReady()) throw new Error('Supabase not configured. Please set environment variables.');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
  }, []);

  const logout = useCallback(async () => {
    if (isDemoMode) {
      setUser(null);
      return;
    }
    if (!isSupabaseReady()) return;
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
