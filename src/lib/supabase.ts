import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? 'https://uhodpfcajtnrmofabyyt.supabase.co';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVob2RwZmNhanRucm1vZmFieXl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MjcxNTgsImV4cCI6MjA5ODAwMzE1OH0.OoTWzxnquodS7WizMibnv-9CpsQTtw1v-o9DfCGw-oY';

console.log('Supabase env', {
  supabaseUrl,
  supabaseAnonKeySet: Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY),
  usingFallback: !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY,
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true },
});

export type Location = {
  id: string;
  slug: string;
  name: string;
  address: string;
  is_active: boolean;
  created_at: string;
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  available: boolean;
  sort_order: number;
  location_id: string | null;
  created_at: string;
};

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'en_camino' | 'completed' | 'cancelled';

export type OrderType = 'pickup' | 'delivery';

export type Order = {
  id: string;
  number: number;
  status: OrderStatus;
  customer_name: string;
  notes: string;
  total: number;
  location_id: string | null;
  // Retiro en local ('pickup') o entrega a domicilio ('delivery').
  order_type: OrderType;
  // Datos de delivery (vacíos / null cuando es retiro en local).
  customer_phone: string;
  delivery_address: string;
  delivery_lat: number | null;
  delivery_lng: number | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  name: string;
  quantity: number;
  unit_price: number;
  notes: string;
  created_at: string;
};

export type OrderWithItems = Order & { order_items: OrderItem[] };

export type CartItem = {
  menu_item: MenuItem;
  quantity: number;
  notes: string;
};

// ===================== Roles / perfiles (módulo administrativo) =====================
export type Role = 'admin' | 'encargado';

export type Profile = {
  id: string;
  email: string | null;
  role: Role;
  location_id: string | null;
  created_at: string;
  updated_at: string;
};

// Devuelve el perfil del usuario autenticado (rol + sucursal). null si no hay sesión.
export async function getCurrentProfile(): Promise<Profile | null> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !data) {
    // Si el perfil aún no existe (p. ej. trigger recién creado), asumimos rol básico.
    return {
      id: user.id,
      email: user.email ?? null,
      role: 'encargado',
      location_id: null,
      created_at: '',
      updated_at: '',
    };
  }
  return data as Profile;
}
