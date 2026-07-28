import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'shangshan_user';

function getStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function storeUser(user) {
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getStoredUser());
    setLoading(false);
  }, []);

  const setPersistedUser = useCallback((u) => {
    storeUser(u);
    setUser(u);
  }, []);

  const login = useCallback(async (email, password) => {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 500));
    if (!email || !password) throw new Error('Email and password are required.');
    if (password.length < 4) throw new Error('Invalid credentials.');
    const userObj = {
      id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
      email,
      created_at: new Date().toISOString(),
    };
    setPersistedUser(userObj);
  }, [setPersistedUser]);

  const register = useCallback(async (email, password) => {
    await new Promise(r => setTimeout(r, 500));
    if (!email || !password) throw new Error('Email and password are required.');
    if (password.length < 4) throw new Error('Password must be at least 4 characters.');
    const userObj = {
      id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
      email,
      created_at: new Date().toISOString(),
    };
    setPersistedUser(userObj);
  }, [setPersistedUser]);

  const loginWithGoogle = useCallback(async () => {
    await new Promise(r => setTimeout(r, 600));
    const userObj = {
      id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
      email: 'user@gmail.com',
      provider: 'google',
      created_at: new Date().toISOString(),
    };
    setPersistedUser(userObj);
  }, [setPersistedUser]);

  const logout = useCallback(async () => {
    setPersistedUser(null);
  }, [setPersistedUser]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
