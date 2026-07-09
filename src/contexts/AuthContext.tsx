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

      const { data: listener } = supabase.auth.onAuthStateChange((_event: string, s: any) => {
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
    if (!username) return { email: null, error: null };
    if (username.includes('@')) {
      return {
        email: null,
        error: { message: 'Debes iniciar sesión con tu nombre de usuario, no con tu correo electrónico.' },
      };
    }

    const tables = ['app_users', 'users'];
    let lastError: any = null;

    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('email').ilike('username', username).maybeSingle();
      if (error) {
        console.warn(`Supabase ${table} query warning:`, error.message || error);
        lastError = error;
        continue;
      }
      if (data?.email) {
        return { email: data.email as string, error: null };
      }
    }

    return {
      email: null,
      error: lastError ?? { message: 'Usuario no encontrado en app_users o users.' },
    };
  };

  const signIn = async (username: string, password: string) => {
    if (!supabaseConfigured) {
      return { error: { message: 'Supabase client is not configured' } };
    }
    setLoading(true);
    const lookup = await findEmailForUsername(username);
    if (lookup.error) {
      setLoading(false);
      return {
        error: {
          message: `Error al consultar usuarios en Supabase: ${lookup.error.message || 'Revisa la tabla app_users y permisos.'}`,
        },
      };
    }
    if (!lookup.email) {
      setLoading(false);
      return {
        error: {
          message: 'Usuario no encontrado. Asegura que la tabla app_users exista y que el usuario esté creado en Supabase.',
        },
      };
    }
    const email = lookup.email;
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
    setSession(null);
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
