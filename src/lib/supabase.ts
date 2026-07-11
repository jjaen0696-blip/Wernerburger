import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? 'https://uhodpfcajtnrmofabyyt.supabase.co';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVob2RwZmNhanRucm1vZmFieXl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MjcxNTgsImV4cCI6MjA5ODAwMzE1OH0.OoTWzxnquodS7WizMibnv-9CpsQTtw1v-o9DfCGw-oY';

console.log('Supabase env', {
  supabaseUrl,
  supabaseAnonKeySet: Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY),
  usingFallback: !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY,
});

export const OWNER_EMAIL = 'baex10@icloud.com';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true },
  global: {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  },
});

// Comprueba conectividad básica con Supabase. Intenta una consulta ligera y
// devuelve `true` si la petición no falló por red (status === 0 indica fallo de red).
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const res = await supabase.from('locations').select('id').limit(1);
    // Si error y status 0 => fallo de red (no conectado). Devolver false.
    if (res.error && res.error.status === 0) return false;
    // En cualquier otro caso (consulta exitosa o error de permisos/RLS), consideramos conectado.
    return true;
  } catch (e) {
    return false;
  }
}

export type Location = {
  id: string;
  slug: string;
  name: string;
  address: string;
  is_active: boolean;
  is_open?: boolean | null;
  created_at: string;
};

export function sortLocationsForDisplay(locations: Location[]): Location[] {
  return [...locations].sort((a, b) => {
    if (a.is_active !== b.is_active) return Number(b.is_active) - Number(a.is_active);

    const aOpen = a.is_open ?? true;
    const bOpen = b.is_open ?? true;
    if (aOpen !== bOpen) return Number(bOpen) - Number(aOpen);

    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (aTime !== bTime) return bTime - aTime;

    return a.name.localeCompare(b.name);
  });
}

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

// Origen del pedido: 'web' (desde la página) | 'local' (venta de mostrador registrada manualmente).
export type OrderChannel = 'web' | 'local';

// Método de pago (solo se registra en ventas de mostrador). '' = sin especificar.
export type PaymentMethod = '' | 'efectivo' | 'transferencia' | 'tarjeta' | 'otro' | 'yappy';

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
  // Email del repartidor asignado (null si no hay asignado aún)
  delivery_assigned_to?: string | null;
  // Venta de mostrador (Fase 8).
  channel: OrderChannel;
  payment_method: PaymentMethod;
  sold_by_email: string;
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
export type Role = 'admin' | 'encargado' | 'delivery';
export type AppRole = 'kitchen' | 'delivery';

export type Profile = {
  id: string;
  email: string | null;
  role: Role;
  location_id: string | null;
  created_at: string;
  updated_at: string;
};

export function profileAppRole(profile: Profile | null): AppRole | null {
  if (!profile) return null;
  return profile.role === 'delivery' ? 'delivery' : 'kitchen';
}

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
      role: user.email?.toLowerCase() === OWNER_EMAIL ? 'admin' : 'encargado',
      location_id: null,
      created_at: '',
      updated_at: '',
    };
  }

  const profile = data as Profile;
  if (profile.email?.toLowerCase() === OWNER_EMAIL) {
    profile.role = 'admin';
  }
  return profile;
}
