import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || '';

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const supabaseUrl = SUPABASE_URL;
export const supabaseAnonKey = SUPABASE_ANON_KEY;
export const OWNER_EMAIL = 'baex10@icloud.com';

// Shared types
export interface Location {
  id: string;
  slug: string;
  name: string;
  address: string;
  is_active: boolean;
  is_open?: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  username: string | null;
  role: 'admin' | 'encargado' | 'delivery' | null;
  location_id: string | null;
  created_at: string;
}

export type Role = 'admin' | 'encargado' | 'delivery';
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'en_camino' | 'completed' | 'cancelled';
export type OrderType = 'pickup' | 'delivery';
export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta' | 'otro' | 'yappy' | 'sin_especificar' | '';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  image_url: string;
  available: boolean;
  location_id?: string | null;
  sort_order?: number;
}

export interface CartItem {
  menu_item: MenuItem;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  number: number;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  delivery_address?: string;
  status: OrderStatus;
  total: number;
  total_amount: number;
  payment_method: PaymentMethod;
  order_type: OrderType;
  channel?: 'web' | 'local';
  location_id: string;
  delivery_assigned_to?: string | null;
  delivery_lat?: number | null;
  delivery_lng?: number | null;
  created_at: string;
  notes?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  notes?: string;
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

if (!supabaseConfigured) {
  console.warn('Supabase client: VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY or SUPABASE_URL/SUPABASE_ANON_KEY not set');
}

const fallbackAuth = {
  getSession: async () => ({ data: { session: null } }),
  onAuthStateChange: (_callback: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
  signInWithPassword: async () => ({ error: { message: 'Supabase environment is not configured.' } }),
  signOut: async () => ({ error: null }),
};

const createFallbackFrom = () => {
  const builder: any = {
    select: () => builder,
    insert: () => builder,
    update: () => builder,
    upsert: () => builder,
    order: () => builder,
    eq: () => builder,
    filter: () => builder,
    limit: () => builder,
    returning: () => builder,
    single: async () => ({ data: null, error: { message: 'Supabase environment is not configured.' } }),
    maybeSingle: async () => ({ data: null, error: { message: 'Supabase environment is not configured.' } }),
    then: async () => ({ data: null, error: { message: 'Supabase environment is not configured.' } }),
  };
  return builder;
};

export const supabase = supabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : ({ auth: fallbackAuth, from: createFallbackFrom } as any);

// Helper functions
export async function getCurrentProfile(): Promise<Profile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    return error ? null : data || null;
  } catch {
    return null;
  }
}

export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('locations').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

export default supabase;
