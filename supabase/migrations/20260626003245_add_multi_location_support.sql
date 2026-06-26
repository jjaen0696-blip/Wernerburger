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
