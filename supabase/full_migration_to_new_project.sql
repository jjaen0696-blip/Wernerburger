-- ============================================================
-- MIGRACIÓN COMPLETA -> proyecto Supabase uhodpfcajtnrmofabyyt
-- Generado para WernerBurguer. Aplicar UNA vez en el proyecto nuevo.
-- Contiene: esquema + RLS + funciones + 3 sucursales + 60 productos.
-- Idempotente (CREATE IF NOT EXISTS / DROP POLICY IF EXISTS / ON CONFLICT).
-- ============================================================

-- ===== [1/4] Esquema base (tablas, RLS, funciones) =====
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
-- ===== [2/4] Multi-sucursal (locations + seed centro/norte/sur) =====
/*
# Soporte multi-sucursal

1. Tablas nuevas
- `locations`: sucursales del restaurante (slug, nombre, dirección, activo).
2. Columnas nuevas
- `orders.location_id`: FK a locations, indica en qué sucursal se hizo el pedido.
- `menu_items.location_id`: FK a locations, permite que cada sucursal tenga su propio menú/precios.
3. Seguridad
- RLS habilitado en `locations` (lectura pública para que los clientes puedan elegir sucursal).
- Políticas existentes en orders/menu_items siguen siendo `TO anon, authenticated` (públicas).
4. Cambios en funciones
- `next_order_number()` ahora recibe `p_location_id` y numera pedidos por sucursal y por día.
5. Datos iniciales
- 3 sucursales sembradas: centro, norte, sur.
*/

CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  address text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_locations" ON locations;
CREATE POLICY "anon_select_locations" ON locations FOR SELECT
  TO anon, authenticated USING (is_active = true);

-- Agregar location_id a orders (sin perder datos existentes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'location_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN location_id uuid REFERENCES locations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Agregar location_id a menu_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'location_id'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN location_id uuid REFERENCES locations(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_location_id ON orders(location_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_location_id ON menu_items(location_id);

-- Actualizar next_order_number para numerar por sucursal
CREATE OR REPLACE FUNCTION next_order_number(p_location_id uuid DEFAULT NULL)
RETURNS integer AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COALESCE(MAX(number), 0) + 1 INTO next_num
  FROM orders
  WHERE created_at::date = now()::date
    AND (p_location_id IS NULL OR location_id = p_location_id);
  RETURN next_num;
END;
$$ LANGUAGE plpgsql;

-- Sembrar 3 sucursales
INSERT INTO locations (slug, name, address) VALUES
  ('centro', 'WernerBurguer Centro', 'Av. Principal 100, Centro'),
  ('norte', 'WernerBurguer Norte', 'Av. Norte 500, Zona Norte'),
  ('sur', 'WernerBurguer Sur', 'Av. Sur 300, Zona Sur')
ON CONFLICT (slug) DO NOTHING;

-- Asignar sucursal "centro" a los menu_items existentes
UPDATE menu_items SET location_id = (SELECT id FROM locations WHERE slug = 'centro')
WHERE location_id IS NULL;

-- Asignar sucursal "centro" a los orders existentes
UPDATE orders SET location_id = (SELECT id FROM locations WHERE slug = 'centro')
WHERE location_id IS NULL;

-- ===== [3/4] Endurecer RLS =====
/*
# Endurecer políticas RLS (seguridad)

## Problema
Las políticas previas otorgaban a `anon` permisos completos (INSERT/UPDATE/DELETE)
sobre `menu_items`, `orders` y `order_items`. Como la clave anónima es pública
(viaja al navegador), cualquiera podía borrar el menú, cambiar precios o
alterar/eliminar pedidos llamando a la API directamente.

## Solución
- `menu_items`: lectura pública; escritura (INSERT/UPDATE/DELETE) solo para `authenticated` (cocina/admin).
- `orders`: el cliente (`anon`) puede CREAR y LEER su pedido; solo `authenticated` puede ACTUALIZAR/BORRAR.
- `order_items`: el cliente (`anon`) puede CREAR y LEER; solo `authenticated` puede ACTUALIZAR/BORRAR.
- `locations`: sin cambios (lectura pública de sucursales activas).

## Nota
El panel de cocina ya exige inicio de sesión (signInWithPassword), por lo que opera
como `authenticated` y conserva todos sus permisos. El flujo del cliente (elegir
sucursal, ver menú, crear pedido) no requiere login y sigue funcionando igual.
*/

-- ============================================================
-- menu_items: solo lectura para anon; escritura para authenticated
-- ============================================================
DROP POLICY IF EXISTS "anon_insert_menu_items" ON menu_items;
DROP POLICY IF EXISTS "anon_update_menu_items" ON menu_items;
DROP POLICY IF EXISTS "anon_delete_menu_items" ON menu_items;

DROP POLICY IF EXISTS "auth_insert_menu_items" ON menu_items;
CREATE POLICY "auth_insert_menu_items" ON menu_items FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_menu_items" ON menu_items;
CREATE POLICY "auth_update_menu_items" ON menu_items FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_menu_items" ON menu_items;
CREATE POLICY "auth_delete_menu_items" ON menu_items FOR DELETE
  TO authenticated USING (true);
-- (se conserva "anon_select_menu_items": lectura pública del menú)

-- ============================================================
-- orders: anon crea y lee; solo authenticated actualiza/borra
-- ============================================================
DROP POLICY IF EXISTS "anon_update_orders" ON orders;
DROP POLICY IF EXISTS "anon_delete_orders" ON orders;

DROP POLICY IF EXISTS "auth_update_orders" ON orders;
CREATE POLICY "auth_update_orders" ON orders FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_orders" ON orders;
CREATE POLICY "auth_delete_orders" ON orders FOR DELETE
  TO authenticated USING (true);
-- (se conservan "anon_select_orders" y "anon_insert_orders" para el flujo del cliente)

-- ============================================================
-- order_items: anon crea y lee; solo authenticated actualiza/borra
-- ============================================================
DROP POLICY IF EXISTS "anon_update_order_items" ON order_items;
DROP POLICY IF EXISTS "anon_delete_order_items" ON order_items;

DROP POLICY IF EXISTS "auth_update_order_items" ON order_items;
CREATE POLICY "auth_update_order_items" ON order_items FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_order_items" ON order_items;
CREATE POLICY "auth_delete_order_items" ON order_items FOR DELETE
  TO authenticated USING (true);
-- (se conservan "anon_select_order_items" y "anon_insert_order_items" para el flujo del cliente)

-- ===== [4/4] Datos del menú (60 productos) =====
-- Datos: 60 productos de menu (migrados del proyecto viejo)

INSERT INTO menu_items (name, description, price, category, image_url, available, sort_order, location_id) VALUES
  ('Coca-Cola', 'Refresco de cola 500ml bien frío.', 2, 'Bebidas', 'https://images.pexels.com/photos/2983100/pexels-photo-2983100.jpeg?auto=compress&cs=tinysrgb&w=600', true, 1, (SELECT id FROM locations WHERE slug='centro')),
  ('Papas Fritas', 'Crujientes papas fritas con sal.', 3, 'Papas', 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=600', true, 1, (SELECT id FROM locations WHERE slug='centro')),
  ('Tocino Extra', '3 tiras de tocino crujiente.', 1.5, 'Extras', 'https://images.pexels.com/photos/675951/pexels-photo-675951.jpeg?auto=compress&cs=tinysrgb&w=600', true, 1, (SELECT id FROM locations WHERE slug='centro')),
  ('Hamburguesa Simple', 'Medallón de carne, queso, lechuga, tomate y salsa.', 5, 'Hamburguesas', 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=600', true, 1, (SELECT id FROM locations WHERE slug='centro')),
  ('Helado de Vainilla', 'Copa de helado cremoso de vainilla.', 2.5, 'Postres', 'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=600', true, 1, (SELECT id FROM locations WHERE slug='centro')),
  ('Papas con Cheddar', 'Papas fritas cubiertas con cheddar fundido y tocino.', 4.5, 'Papas', 'https://images.pexels.com/photos/4109111/pexels-photo-4109111.jpeg?auto=compress&cs=tinysrgb&w=600', true, 2, (SELECT id FROM locations WHERE slug='centro')),
  ('Hamburguesa Doble', 'Doble medallón de carne, doble queso, lechuga, tomate y salsa.', 7, 'Hamburguesas', 'https://images.pexels.com/photos/2983101/pexels-photo-2983101.jpeg?auto=compress&cs=tinysrgb&w=600', true, 2, (SELECT id FROM locations WHERE slug='centro')),
  ('Brownie con Helado', 'Brownie de chocolate tibio con helado de vainilla.', 4, 'Postres', 'https://images.pexels.com/photos/2915289/pexels-photo-2915289.jpeg?auto=compress&cs=tinysrgb&w=600', true, 2, (SELECT id FROM locations WHERE slug='centro')),
  ('Sprite', 'Refresco de limón 500ml.', 2, 'Bebidas', 'https://images.pexels.com/photos/8473019/pexels-photo-8473019.jpeg?auto=compress&cs=tinysrgb&w=600', true, 2, (SELECT id FROM locations WHERE slug='centro')),
  ('Queso Extra', 'Porción extra de queso cheddar.', 1, 'Extras', 'https://images.pexels.com/photos/821363/pexels-photo-821363.jpeg?auto=compress&cs=tinysrgb&w=600', true, 2, (SELECT id FROM locations WHERE slug='centro')),
  ('Hamburguesa Triple', 'Triple medallón de carne, triple queso, tocino y salsa BBQ.', 9, 'Hamburguesas', 'https://images.pexels.com/photos/15566913/pexels-photo-15566913.jpeg?auto=compress&cs=tinysrgb&w=600', true, 3, (SELECT id FROM locations WHERE slug='centro')),
  ('Fanta', 'Refresco de naranja 500ml.', 2, 'Bebidas', 'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=600', true, 3, (SELECT id FROM locations WHERE slug='centro')),
  ('Tarta de Manzana', 'Porción de tarta casera de manzana.', 3.5, 'Postres', 'https://images.pexels.com/photos/14705355/pexels-photo-14705355.jpeg?auto=compress&cs=tinysrgb&w=600', true, 3, (SELECT id FROM locations WHERE slug='centro')),
  ('Papas Deluxe', 'Patas gajo con piel, especias y salsa ranch.', 4, 'Papas', 'https://images.pexels.com/photos/115740/pexels-photo-115740.jpeg?auto=compress&cs=tinysrgb&w=600', true, 3, (SELECT id FROM locations WHERE slug='centro')),
  ('Salsa Extra', 'Salsa a elegir: BBQ, mayonesa, ketchup, mostaza.', 0.5, 'Extras', 'https://images.pexels.com/photos/4198015/pexels-photo-4198015.jpeg?auto=compress&cs=tinysrgb&w=600', true, 3, (SELECT id FROM locations WHERE slug='centro')),
  ('Agua Mineral', 'Agua sin gas 500ml.', 1.5, 'Bebidas', 'https://images.pexels.com/photos/327090/pexels-photo-327090.jpeg?auto=compress&cs=tinysrgb&w=600', true, 4, (SELECT id FROM locations WHERE slug='centro')),
  ('Hamburguesa con Cheddar', 'Medallón de carne, cheddar fundido, cebolla caramelizada.', 6, 'Hamburguesas', 'https://images.pexels.com/photos/3915857/pexels-photo-3915857.jpeg?auto=compress&cs=tinysrgb&w=600', true, 4, (SELECT id FROM locations WHERE slug='centro')),
  ('Limonada', 'Limonada natural con menta.', 2.5, 'Bebidas', 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&cs=tinysrgb&w=600', true, 5, (SELECT id FROM locations WHERE slug='centro')),
  ('Hamburguesa de Pollo', 'Filete de pollo empanizado, lechuga, mayonesa.', 5.5, 'Hamburguesas', 'https://images.pexels.com/photos/2762942/pexels-photo-2762942.jpeg?auto=compress&cs=tinysrgb&w=600', true, 5, (SELECT id FROM locations WHERE slug='centro')),
  ('Hamburguesa Vegetariana', 'Medallón de garbanzo, rúcula, tomate y queso.', 6.5, 'Hamburguesas', 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=600', true, 6, (SELECT id FROM locations WHERE slug='centro'));

INSERT INTO menu_items (name, description, price, category, image_url, available, sort_order, location_id) VALUES
  ('Hamburguesa Simple', 'Medallón de carne, queso, lechuga, tomate y salsa.', 5, 'Hamburguesas', 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=600', true, 1, (SELECT id FROM locations WHERE slug='norte')),
  ('Papas Fritas', 'Crujientes papas fritas con sal.', 3, 'Papas', 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=600', true, 1, (SELECT id FROM locations WHERE slug='norte')),
  ('Tocino Extra', '3 tiras de tocino crujiente.', 1.5, 'Extras', 'https://images.pexels.com/photos/675951/pexels-photo-675951.jpeg?auto=compress&cs=tinysrgb&w=600', true, 1, (SELECT id FROM locations WHERE slug='norte')),
  ('Helado de Vainilla', 'Copa de helado cremoso de vainilla.', 2.5, 'Postres', 'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=600', true, 1, (SELECT id FROM locations WHERE slug='norte')),
  ('Coca-Cola', 'Refresco de cola 500ml bien frío.', 2, 'Bebidas', 'https://images.pexels.com/photos/2983100/pexels-photo-2983100.jpeg?auto=compress&cs=tinysrgb&w=600', true, 1, (SELECT id FROM locations WHERE slug='norte')),
  ('Sprite', 'Refresco de limón 500ml.', 2, 'Bebidas', 'https://images.pexels.com/photos/8473019/pexels-photo-8473019.jpeg?auto=compress&cs=tinysrgb&w=600', true, 2, (SELECT id FROM locations WHERE slug='norte')),
  ('Hamburguesa Doble', 'Doble medallón de carne, doble queso, lechuga, tomate y salsa.', 7, 'Hamburguesas', 'https://images.pexels.com/photos/2983101/pexels-photo-2983101.jpeg?auto=compress&cs=tinysrgb&w=600', true, 2, (SELECT id FROM locations WHERE slug='norte')),
  ('Papas con Cheddar', 'Papas fritas cubiertas con cheddar fundido y tocino.', 4.5, 'Papas', 'https://images.pexels.com/photos/4109111/pexels-photo-4109111.jpeg?auto=compress&cs=tinysrgb&w=600', true, 2, (SELECT id FROM locations WHERE slug='norte')),
  ('Brownie con Helado', 'Brownie de chocolate tibio con helado de vainilla.', 4, 'Postres', 'https://images.pexels.com/photos/2915289/pexels-photo-2915289.jpeg?auto=compress&cs=tinysrgb&w=600', true, 2, (SELECT id FROM locations WHERE slug='norte')),
  ('Queso Extra', 'Porción extra de queso cheddar.', 1, 'Extras', 'https://images.pexels.com/photos/821363/pexels-photo-821363.jpeg?auto=compress&cs=tinysrgb&w=600', true, 2, (SELECT id FROM locations WHERE slug='norte')),
  ('Salsa Extra', 'Salsa a elegir: BBQ, mayonesa, ketchup, mostaza.', 0.5, 'Extras', 'https://images.pexels.com/photos/4198015/pexels-photo-4198015.jpeg?auto=compress&cs=tinysrgb&w=600', true, 3, (SELECT id FROM locations WHERE slug='norte')),
  ('Fanta', 'Refresco de naranja 500ml.', 2, 'Bebidas', 'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=600', true, 3, (SELECT id FROM locations WHERE slug='norte')),
  ('Tarta de Manzana', 'Porción de tarta casera de manzana.', 3.5, 'Postres', 'https://images.pexels.com/photos/14705355/pexels-photo-14705355.jpeg?auto=compress&cs=tinysrgb&w=600', true, 3, (SELECT id FROM locations WHERE slug='norte')),
  ('Hamburguesa Triple', 'Triple medallón de carne, triple queso, tocino y salsa BBQ.', 9, 'Hamburguesas', 'https://images.pexels.com/photos/15566913/pexels-photo-15566913.jpeg?auto=compress&cs=tinysrgb&w=600', true, 3, (SELECT id FROM locations WHERE slug='norte')),
  ('Papas Deluxe', 'Patas gajo con piel, especias y salsa ranch.', 4, 'Papas', 'https://images.pexels.com/photos/115740/pexels-photo-115740.jpeg?auto=compress&cs=tinysrgb&w=600', true, 3, (SELECT id FROM locations WHERE slug='norte')),
  ('Agua Mineral', 'Agua sin gas 500ml.', 1.5, 'Bebidas', 'https://images.pexels.com/photos/327090/pexels-photo-327090.jpeg?auto=compress&cs=tinysrgb&w=600', true, 4, (SELECT id FROM locations WHERE slug='norte')),
  ('Hamburguesa con Cheddar', 'Medallón de carne, cheddar fundido, cebolla caramelizada.', 6, 'Hamburguesas', 'https://images.pexels.com/photos/3915857/pexels-photo-3915857.jpeg?auto=compress&cs=tinysrgb&w=600', true, 4, (SELECT id FROM locations WHERE slug='norte')),
  ('Hamburguesa de Pollo', 'Filete de pollo empanizado, lechuga, mayonesa.', 5.5, 'Hamburguesas', 'https://images.pexels.com/photos/2762942/pexels-photo-2762942.jpeg?auto=compress&cs=tinysrgb&w=600', true, 5, (SELECT id FROM locations WHERE slug='norte')),
  ('Limonada', 'Limonada natural con menta.', 2.5, 'Bebidas', 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&cs=tinysrgb&w=600', true, 5, (SELECT id FROM locations WHERE slug='norte')),
  ('Hamburguesa Vegetariana', 'Medallón de garbanzo, rúcula, tomate y queso.', 6.5, 'Hamburguesas', 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=600', true, 6, (SELECT id FROM locations WHERE slug='norte'));

INSERT INTO menu_items (name, description, price, category, image_url, available, sort_order, location_id) VALUES
  ('Coca-Cola', 'Refresco de cola 500ml bien frío.', 2, 'Bebidas', 'https://images.pexels.com/photos/2983100/pexels-photo-2983100.jpeg?auto=compress&cs=tinysrgb&w=600', true, 1, (SELECT id FROM locations WHERE slug='sur')),
  ('Papas Fritas', 'Crujientes papas fritas con sal.', 3, 'Papas', 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=600', true, 1, (SELECT id FROM locations WHERE slug='sur')),
  ('Hamburguesa Simple', 'Medallón de carne, queso, lechuga, tomate y salsa.', 5, 'Hamburguesas', 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=600', true, 1, (SELECT id FROM locations WHERE slug='sur')),
  ('Tocino Extra', '3 tiras de tocino crujiente.', 1.5, 'Extras', 'https://images.pexels.com/photos/675951/pexels-photo-675951.jpeg?auto=compress&cs=tinysrgb&w=600', true, 1, (SELECT id FROM locations WHERE slug='sur')),
  ('Helado de Vainilla', 'Copa de helado cremoso de vainilla.', 2.5, 'Postres', 'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=600', true, 1, (SELECT id FROM locations WHERE slug='sur')),
  ('Queso Extra', 'Porción extra de queso cheddar.', 1, 'Extras', 'https://images.pexels.com/photos/821363/pexels-photo-821363.jpeg?auto=compress&cs=tinysrgb&w=600', true, 2, (SELECT id FROM locations WHERE slug='sur')),
  ('Hamburguesa Doble', 'Doble medallón de carne, doble queso, lechuga, tomate y salsa.', 7, 'Hamburguesas', 'https://images.pexels.com/photos/2983101/pexels-photo-2983101.jpeg?auto=compress&cs=tinysrgb&w=600', true, 2, (SELECT id FROM locations WHERE slug='sur')),
  ('Papas con Cheddar', 'Papas fritas cubiertas con cheddar fundido y tocino.', 4.5, 'Papas', 'https://images.pexels.com/photos/4109111/pexels-photo-4109111.jpeg?auto=compress&cs=tinysrgb&w=600', true, 2, (SELECT id FROM locations WHERE slug='sur')),
  ('Sprite', 'Refresco de limón 500ml.', 2, 'Bebidas', 'https://images.pexels.com/photos/8473019/pexels-photo-8473019.jpeg?auto=compress&cs=tinysrgb&w=600', true, 2, (SELECT id FROM locations WHERE slug='sur')),
  ('Brownie con Helado', 'Brownie de chocolate tibio con helado de vainilla.', 4, 'Postres', 'https://images.pexels.com/photos/2915289/pexels-photo-2915289.jpeg?auto=compress&cs=tinysrgb&w=600', true, 2, (SELECT id FROM locations WHERE slug='sur')),
  ('Salsa Extra', 'Salsa a elegir: BBQ, mayonesa, ketchup, mostaza.', 0.5, 'Extras', 'https://images.pexels.com/photos/4198015/pexels-photo-4198015.jpeg?auto=compress&cs=tinysrgb&w=600', true, 3, (SELECT id FROM locations WHERE slug='sur')),
  ('Fanta', 'Refresco de naranja 500ml.', 2, 'Bebidas', 'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=600', true, 3, (SELECT id FROM locations WHERE slug='sur')),
  ('Hamburguesa Triple', 'Triple medallón de carne, triple queso, tocino y salsa BBQ.', 9, 'Hamburguesas', 'https://images.pexels.com/photos/15566913/pexels-photo-15566913.jpeg?auto=compress&cs=tinysrgb&w=600', true, 3, (SELECT id FROM locations WHERE slug='sur')),
  ('Tarta de Manzana', 'Porción de tarta casera de manzana.', 3.5, 'Postres', 'https://images.pexels.com/photos/14705355/pexels-photo-14705355.jpeg?auto=compress&cs=tinysrgb&w=600', true, 3, (SELECT id FROM locations WHERE slug='sur')),
  ('Papas Deluxe', 'Patas gajo con piel, especias y salsa ranch.', 4, 'Papas', 'https://images.pexels.com/photos/115740/pexels-photo-115740.jpeg?auto=compress&cs=tinysrgb&w=600', true, 3, (SELECT id FROM locations WHERE slug='sur')),
  ('Hamburguesa con Cheddar', 'Medallón de carne, cheddar fundido, cebolla caramelizada.', 6, 'Hamburguesas', 'https://images.pexels.com/photos/3915857/pexels-photo-3915857.jpeg?auto=compress&cs=tinysrgb&w=600', true, 4, (SELECT id FROM locations WHERE slug='sur')),
  ('Agua Mineral', 'Agua sin gas 500ml.', 1.5, 'Bebidas', 'https://images.pexels.com/photos/327090/pexels-photo-327090.jpeg?auto=compress&cs=tinysrgb&w=600', true, 4, (SELECT id FROM locations WHERE slug='sur')),
  ('Limonada', 'Limonada natural con menta.', 2.5, 'Bebidas', 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&cs=tinysrgb&w=600', true, 5, (SELECT id FROM locations WHERE slug='sur')),
  ('Hamburguesa de Pollo', 'Filete de pollo empanizado, lechuga, mayonesa.', 5.5, 'Hamburguesas', 'https://images.pexels.com/photos/2762942/pexels-photo-2762942.jpeg?auto=compress&cs=tinysrgb&w=600', true, 5, (SELECT id FROM locations WHERE slug='sur')),
  ('Hamburguesa Vegetariana', 'Medallón de garbanzo, rúcula, tomate y queso.', 6.5, 'Hamburguesas', 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=600', true, 6, (SELECT id FROM locations WHERE slug='sur'));
