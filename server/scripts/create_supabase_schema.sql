-- Supabase schema for Werner backend
-- Ejecuta esto en Supabase SQL Editor antes de importar datos

-- Habilitar extensión para UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Sucursales
CREATE TABLE IF NOT EXISTS branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  is_closed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Ingredientes y productos
CREATE TABLE IF NOT EXISTS ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  unit text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Recetas (producto -> ingrediente)
CREATE TABLE IF NOT EXISTS recipe_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id uuid REFERENCES ingredients(id) ON DELETE CASCADE,
  qty numeric NOT NULL,
  unit text
);

-- Inventario (unique por branch+ingredient para upsert)
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid REFERENCES branches(id) ON DELETE CASCADE,
  ingredient_id uuid REFERENCES ingredients(id) ON DELETE CASCADE,
  qty numeric DEFAULT 0,
  unit text,
  updated_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS inventory_branch_ing_uq ON inventory(branch_id, ingredient_id);

-- Movimientos de inventario
CREATE TABLE IF NOT EXISTS inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid REFERENCES branches(id),
  ingredient_id uuid REFERENCES ingredients(id),
  change numeric,
  reason text,
  created_at timestamptz DEFAULT now()
);

-- Pedidos y items
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid REFERENCES branches(id),
  status text NOT NULL DEFAULT 'pending',
  customer_name text,
  phone text,
  address text,
  delivery_type text,
  payment_method text,
  total numeric DEFAULT 0,
  items jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  qty integer DEFAULT 1
);

-- Compras y items
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid REFERENCES branches(id),
  user_id uuid,
  total numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchase_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid REFERENCES purchases(id) ON DELETE CASCADE,
  ingredient_id uuid REFERENCES ingredients(id),
  quantity numeric,
  unit_price numeric
);

-- Usuarios y roles
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  username text UNIQUE,
  password_hash text,
  branch_id uuid REFERENCES branches(id),
  role text DEFAULT 'manager',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE,
  description text
);

CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  role_id uuid REFERENCES roles(id),
  branch_id uuid REFERENCES branches(id)
);

-- Funciones auxiliares
-- Si las funciones ya existen con firma distinta, borrarlas primero
DROP FUNCTION IF EXISTS increment_inventory_by_purchase(uuid, uuid, numeric, text, uuid);
DROP FUNCTION IF EXISTS get_alerts();

CREATE OR REPLACE FUNCTION increment_inventory_by_purchase(p_branch_id uuid, p_ingredient_id uuid, p_qty numeric, p_unit text, p_user_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  LOOP
    UPDATE inventory
    SET qty = qty + p_qty, updated_at = now()
    WHERE branch_id = p_branch_id AND ingredient_id = p_ingredient_id;
    IF FOUND THEN
      INSERT INTO inventory_movements(id, branch_id, ingredient_id, change, reason, created_at)
      VALUES (gen_random_uuid(), p_branch_id, p_ingredient_id, p_qty, 'purchase', now());
      RETURN;
    END IF;
    INSERT INTO inventory(id, branch_id, ingredient_id, qty, unit, updated_at)
    VALUES (gen_random_uuid(), p_branch_id, p_ingredient_id, p_qty, p_unit, now())
    ON CONFLICT (branch_id, ingredient_id) DO UPDATE SET qty = inventory.qty + EXCLUDED.qty, updated_at = EXCLUDED.updated_at;
    INSERT INTO inventory_movements(id, branch_id, ingredient_id, change, reason, created_at)
    VALUES (gen_random_uuid(), p_branch_id, p_ingredient_id, p_qty, 'purchase', now());
    RETURN;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION get_alerts()
RETURNS TABLE(id uuid, branch_id uuid, ingredient_id uuid, qty numeric, unit text, ingredient_name text) LANGUAGE sql AS $$
  SELECT i.id, i.branch_id, i.ingredient_id, i.qty, i.unit, ing.name
  FROM inventory i
  LEFT JOIN ingredients ing ON ing.id = i.ingredient_id
  WHERE i.qty <= 5;
$$;
