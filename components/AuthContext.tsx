"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import supabase from '../lib/supabase';
import { api } from '../lib/api';
import type { Profile } from '../lib/types';

interface AuthContextType {
  user: import('@supabase/supabase-js').User | null;
  session: import('@supabase/supabase-js').Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<import('@supabase/supabase-js').Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const p = await api.profiles.me();
      setProfile(p);
    } catch (err) {
      console.error('fetchProfile error:', err);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mockSessionStr = localStorage.getItem('mock_session');
      if (mockSessionStr) {
        try {
          const parsed = JSON.parse(mockSessionStr);
          setSession(parsed);
          fetchProfile().finally(() => setLoading(false));
          return;
        } catch (e) {
          console.error('Error parsing mock session:', e);
        }
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile().finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (typeof window !== 'undefined' && localStorage.getItem('mock_session')) {
        return; // Skip supabase session state changes if using a mock session
      }
      setSession(session);
      if (session) {
        fetchProfile().finally(() => setLoading(false));
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mock_session');
    }
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Supabase signOut error:', e);
    }
    setProfile(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, session, profile, loading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
