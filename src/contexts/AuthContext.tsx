import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase';

type User = any;
export type UserRole = 'admin' | 'cocina' | 'delivery';

interface AuthContextValue {
  user: User | null;
  session: any | null;
  loading: boolean;
  role: UserRole | null;
  branchId: string | null;
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

const fetchUserRole = async (userId: string): Promise<{ role: UserRole | null; branchId: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role, branch_id')
      .eq('id', userId)
      .single();
    
    if (error || !data) return { role: 'admin', branchId: null };
    return { role: data.role || 'admin', branchId: data.branch_id };
  } catch {
    return { role: 'admin', branchId: null };
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session ?? null);
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser?.id) {
        const { role: userRole, branchId: userBranch } = await fetchUserRole(currentUser.id);
        setRole(userRole);
        setBranchId(userBranch);
      }
      setLoading(false);
    };
    void getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event: string, s: any) => {
      setSession(s ?? null);
      const currentUser = s?.user ?? null;
      setUser(currentUser);
      
      if (currentUser?.id) {
        const { role: userRole, branchId: userBranch } = await fetchUserRole(currentUser.id);
        setRole(userRole);
        setBranchId(userBranch);
      } else {
        setRole(null);
        setBranchId(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (username: string, password: string) => {
    if (!supabaseConfigured) {
      return { error: { message: 'Supabase client is not configured' } };
    }
    setLoading(true);
    
    let email = username;
    
    // If username doesn't contain @, search for it in users table
    if (!username.includes('@')) {
      try {
        // Try to find user by username in the users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('username', username)
          .single();
        
        if (userError || !userData?.email) {
          setLoading(false);
          return { error: { message: 'Usuario no encontrado' } };
        }
        
        email = userData.email;
      } catch (err) {
        setLoading(false);
        return { error: { message: 'Error al buscar usuario' } };
      }
    }
    
    const res = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (res.error) return { error: res.error };
    setSession(res.data.session ?? null);
    setUser(res.data.user ?? null);
    
    // Fetch role after login
    if (res.data.user?.id) {
      const { role: userRole, branchId: userBranch } = await fetchUserRole(res.data.user.id);
      setRole(userRole);
      setBranchId(userBranch);
    }
    
    return {};
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setRole(null);
    setBranchId(null);
    setLoading(false);
  };

  const getAccessToken = () => session?.access_token ?? null;

  return (
    <AuthContext.Provider value={{ user, session, loading, role, branchId, signIn, signOut, getAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
