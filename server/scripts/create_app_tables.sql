-- Tablas de aplicación para evitar colisiones con tablas gestionadas por Supabase Auth
-- Ejecuta esto en Supabase SQL Editor antes de ejecutar el import script

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  username text UNIQUE,
  password_hash text,
  branch_id uuid REFERENCES branches(id),
  role text DEFAULT 'manager',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_recipe_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id uuid REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity numeric NOT NULL,
  unit text
);

CREATE TABLE IF NOT EXISTS app_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  quantity integer DEFAULT 1,
  unit_price numeric
);

CREATE TABLE IF NOT EXISTS app_purchase_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid REFERENCES purchases(id) ON DELETE CASCADE,
  ingredient_id uuid REFERENCES ingredients(id),
  quantity numeric,
  unit text,
  unit_price numeric
);

-- Índices útiles
CREATE UNIQUE INDEX IF NOT EXISTS app_users_username_uq ON app_users(username);
CREATE INDEX IF NOT EXISTS app_recipe_product_idx ON app_recipe_items(product_id);
CREATE INDEX IF NOT EXISTS app_order_order_idx ON app_order_items(order_id);
CREATE INDEX IF NOT EXISTS app_purchase_purchase_idx ON app_purchase_items(purchase_id);
