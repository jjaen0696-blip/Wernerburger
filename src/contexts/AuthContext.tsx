import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase';

type User = any;

interface AuthContextValue {
  user: User | null;
  session: any | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setLoading(false);
    };
    void getSession();

      const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  const findEmailForUsername = async (username: string) => {
    if (!username) return null;
    if (username.includes('@')) return username;
    const { data, error } = await supabase.from('app_users').select('email').eq('username', username).single();
    if (error || !data?.email) return null;
    return data.email as string;
  };

  const signIn = async (username: string, password: string) => {
    if (!supabaseConfigured) {
      return { error: { message: 'Supabase client is not configured' } };
    }
    setLoading(true);
    const email = await findEmailForUsername(username);
    if (!email) {
      setLoading(false);
      return { error: { message: 'Usuario no encontrado' } };
    }
    const res = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (res.error) return { error: res.error };
    setSession(res.data.session ?? null);
    setUser(res.data.user ?? null);
    return {};
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
  };

  const getAccessToken = () => session?.access_token ?? null;

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut, getAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
