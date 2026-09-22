import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from '../lib/api';

const AuthContext = createContext(null);

/**
 * AuthProvider wraps the app and exposes:
 *   - user: { id, email } (or null)
 *   - profile: the profiles row for the current user (or null)
 *   - signUp({ name, email, password })
 *   - signIn({ email, password })
 *   - signOut()
 *   - updateProfile(patch)
 *   - loading: true while the initial session check is happening
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: if a token is stashed in localStorage, validate it against the API.
  useEffect(() => {
    let mounted = true;
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api.getSession()
      .then(({ user: u, profile: p }) => {
        if (!mounted) return;
        setUser(u);
        setProfile(p);
      })
      .catch(() => {
        if (!mounted) return;
        setToken(null); // stale/expired token
        setUser(null);
        setProfile(null);
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const signUp = async ({ name, email, password }) => {
    try {
      const { token, user: u, profile: p } = await api.signUp({ name, email, password });
      setToken(token);
      setUser(u);
      setProfile(p);
      return { success: true, user: u };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const signIn = async ({ email, password }) => {
    try {
      const { token, user: u, profile: p } = await api.signIn({ email, password });
      setToken(token);
      setUser(u);
      setProfile(p);
      return { success: true, user: u };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const signOut = async () => {
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (patch) => {
    if (!user) return { success: false, message: 'Not signed in.' };
    try {
      const { profile: p } = await api.updateProfile(patch);
      setProfile(p);
      return { success: true, profile: p };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const value = { user, profile, loading, signUp, signIn, signOut, updateProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
