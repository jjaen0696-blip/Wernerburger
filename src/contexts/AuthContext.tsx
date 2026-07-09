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

  const resolveEmailForUsername = async (username: string) => {
    const apiBase = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://127.0.0.1:5174' : 'https://wernerburger.onrender.com');
    if (!username) return { email: null, error: null };
    if (username.includes('@')) {
      return {
        email: null,
        error: { message: 'Debes iniciar sesión con tu nombre de usuario, no con tu correo electrónico.' },
      };
    }

    try {
      const resp = await fetch(`${apiBase}/auth/resolve-email?username=${encodeURIComponent(username)}`);
      const result = await resp.json();

      if (!resp.ok) {
        return {
          email: null,
          error: { message: result.error || 'No se pudo resolver el correo del usuario.' },
        };
      }

      return { email: result.email as string | null, error: null };
    } catch (err: any) {
      console.error('Auth server lookup failed:', err);
      return {
        email: null,
        error: { message: 'Error al consultar el servidor de autenticación. Revisa la configuración de Supabase.' },
      };
    }
  };

  const signIn = async (username: string, password: string) => {
    if (!supabaseConfigured) {
      return { error: { message: 'Supabase client is not configured' } };
    }
    setLoading(true);
    const lookup = await resolveEmailForUsername(username);
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
          message: 'Usuario no encontrado. Asegura que la tabla app_users exista, que el usuario esté creado y que el username sea correcto.',
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
