import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY =
  import.meta.env.SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_KEY ||
  '';

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!supabaseConfigured) {
  console.warn('Supabase client: SUPABASE_URL/SUPABASE_ANON_KEY or VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY not set');
}

const fallbackAuth = {
  getSession: async () => ({ data: { session: null } }),
  onAuthStateChange: (_callback: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
  signInWithPassword: async () => ({ error: { message: 'Supabase environment is not configured.' } }),
  signOut: async () => ({ error: null }),
};

export const supabase = supabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : ({ auth: fallbackAuth } as any);

export default supabase;
