/*
# Sistema de pedidos de restaurante (single-tenant, sin auth)

1. Tablas nuevas
- `menu_items`: productos del menú (nombre, descripción, precio, categoría, imagen, disponible).
- `orders`: pedidos realizados por clientes (número, estado, total, nombre del cliente, notas).
- `order_items`: líneas de cada pedido (producto, cantidad, precio unitario, notas).
2. Seguridad
- RLS habilitado en las tres tablas.
- Políticas `TO anon, authenticated` (CRUD) porque es una app pública sin login:
  el cliente anónimo crea pedidos y la cocina (también anónima) los lee/actualiza.
3. Notas
- `orders.number` es un secuencial por día para mostrar al cliente (ej. #001).
- Estados: `pending` (recibido) -> `preparing` (en preparación) -> `ready` (listo) -> `completed` (entregado).
*/

CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  category text NOT NULL,
  image_url text NOT NULL DEFAULT '',
  available boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number integer NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','preparing','ready','completed','cancelled')),
  customer_name text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  total numeric(10,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE SET NULL,
  name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- menu_items: lectura pública, escritura pública (gestión del menú)
DROP POLICY IF EXISTS "anon_select_menu_items" ON menu_items;
CREATE POLICY "anon_select_menu_items" ON menu_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_menu_items" ON menu_items;
CREATE POLICY "anon_insert_menu_items" ON menu_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_menu_items" ON menu_items;
CREATE POLICY "anon_update_menu_items" ON menu_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_menu_items" ON menu_items;
CREATE POLICY "anon_delete_menu_items" ON menu_items FOR DELETE
  TO anon, authenticated USING (true);

-- orders: CRUD público (cliente crea, cocina lee/actualiza)
DROP POLICY IF EXISTS "anon_select_orders" ON orders;
CREATE POLICY "anon_select_orders" ON orders FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_orders" ON orders;
CREATE POLICY "anon_update_orders" ON orders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_orders" ON orders;
CREATE POLICY "anon_delete_orders" ON orders FOR DELETE
  TO anon, authenticated USING (true);

-- order_items: CRUD público
DROP POLICY IF EXISTS "anon_select_order_items" ON order_items;
CREATE POLICY "anon_select_order_items" ON order_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_order_items" ON order_items;
CREATE POLICY "anon_insert_order_items" ON order_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_order_items" ON order_items;
CREATE POLICY "anon_update_order_items" ON order_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_order_items" ON order_items;
CREATE POLICY "anon_delete_order_items" ON order_items FOR DELETE
  TO anon, authenticated USING (true);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Función para calcular el siguiente número de pedido del día
CREATE OR REPLACE FUNCTION next_order_number()
RETURNS integer AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COALESCE(MAX(number), 0) + 1 INTO next_num
  FROM orders
  WHERE created_at::date = now()::date;
  RETURN next_num;
END;
$$ LANGUAGE plpgsql;