import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? 'https://uhodpfcajtnrmofabyyt.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVob2RwZmNhanRucm1vZmFieXl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MjcxNTgsImV4cCI6MjA5ODAwMzE1OH0.OoTWzxnquodS7WizMibnv-9CpsQTtw1v-o9DfCGw-oY';

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

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export type Order = {
  id: string;
  number: number;
  status: OrderStatus;
  customer_name: string;
  notes: string;
  total: number;
  location_id: string | null;
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
