-- Import script generated from local_db.json
-- Run this in Supabase SQL editor for your project (requires gen_random_uuid extension enabled)

BEGIN;

-- Branches
INSERT INTO branches(id, name, address, is_closed, created_at)
VALUES
('branch-1', 'Sucursal Central', NULL, false, now())
ON CONFLICT (id) DO NOTHING;

-- Ingredients
INSERT INTO ingredients(id, name, unit, created_at) VALUES
('ing-bread', 'Pan', NULL, now()),
('ing-meat', 'Carne', NULL, now()),
('d799945d-b723-4d28-9a91-02f92663daee', 'Tomate', 'kg', '2026-07-06T20:28:23.438Z')
ON CONFLICT (id) DO NOTHING;

-- Products
INSERT INTO products(id, name, price, created_at) VALUES
('prod-burger', 'Hamburguesa Clásica', 5.5, now())
ON CONFLICT (id) DO NOTHING;

-- Recipe items
INSERT INTO recipe_items(id, product_id, ingredient_id, qty, unit) VALUES
(gen_random_uuid(), 'prod-burger', 'ing-bread', 1, 'unidad'),
(gen_random_uuid(), 'prod-burger', 'ing-meat', 0.2, 'kg')
ON CONFLICT DO NOTHING;

-- Inventory (use explicit ids when present)
INSERT INTO inventory(id, branch_id, ingredient_id, qty, unit, updated_at) VALUES
('branch-1::ing-bread', 'branch-1', 'ing-bread', 8, 'unidad', '2026-07-06T06:54:41.337Z'),
('branch-1::ing-meat', 'branch-1', 'ing-meat', 4.6, 'kg', '2026-07-06T06:54:41.337Z'),
('6c2794f0-42b1-46cb-80fa-b0948784c51e', 'branch-1', 'ing-bread', -2, 'sale', '2026-07-06T06:54:41.337Z'),
('92eb61ef-8f59-4aed-9488-aba8e7c42fb0', 'branch-1', 'ing-meat', -0.4, 'sale', '2026-07-06T06:54:41.337Z'),
('branch-1::d799945d-b723-4d28-9a91-02f92663daee', 'branch-1', 'd799945d-b723-4d28-9a91-02f92663daee', 22, 'kg', '2026-07-06T20:28:23.505Z'),
('349b5331-4012-4b54-aedb-9deaf9d727c7', 'branch-1', 'd799945d-b723-4d28-9a91-02f92663daee', 12, 'initial', '2026-07-06T20:28:23.438Z'),
('11aa2aaa-0989-41e3-b237-cc7b098d0193', 'branch-1', 'd799945d-b723-4d28-9a91-02f92663daee', 10, 'purchase', '2026-07-06T20:28:23.505Z')
ON CONFLICT (branch_id, ingredient_id) DO UPDATE SET qty = EXCLUDED.qty, unit = EXCLUDED.unit, updated_at = EXCLUDED.updated_at;

-- Inventory movements (none in JSON except those implied)
-- Orders
INSERT INTO orders(id, branch_id, status, total, items, created_at) VALUES
('b6fa2cde-2f0d-441a-8617-8bd42101626e', 'branch-1', 'accepted', 11,
  '[{"product_id":"prod-burger","quantity":2,"unit_price":5.5}]'::jsonb,
  '2026-07-06T06:54:41.337Z')
ON CONFLICT (id) DO NOTHING;

-- Order items
INSERT INTO order_items(id, order_id, product_id, qty) VALUES
('50b5e6be-1309-4662-8c08-28db4fe4ffb9', 'b6fa2cde-2f0d-441a-8617-8bd42101626e', 'prod-burger', 2)
ON CONFLICT (id) DO NOTHING;

-- Purchases
INSERT INTO purchases(id, branch_id, user_id, total, created_at) VALUES
('06813f5a-cef0-4e5c-905f-01a1b63da767', 'branch-1', 'admin', 120, '2026-07-06T20:28:23.505Z')
ON CONFLICT (id) DO NOTHING;

-- Purchase items
INSERT INTO purchase_items(id, purchase_id, ingredient_id, quantity, unit_price) VALUES
('8d9aea5b-3981-4ef3-aba7-6f53f69db6b6', '06813f5a-cef0-4e5c-905f-01a1b63da767', 'd799945d-b723-4d28-9a91-02f92663daee', 10, 12)
ON CONFLICT (id) DO NOTHING;

-- Users (use ON CONFLICT on username to avoid duplicates)
INSERT INTO users(id, email, username, password_hash, branch_id, role, created_at) VALUES
('17d2e0b3-4019-49aa-9d6c-b529785d5747', 'op@test.com', 'operador1', NULL, NULL, 'manager', '2026-07-06T21:08:05.600Z'),
('2febd4d5-3a7e-4494-819d-9dcb7c604365', 'admin@local', 'admin', 'admin123', 'branch-1', 'manager', '2026-07-06T21:31:12.440Z'),
('28efbc87-10b7-4388-bf07-31165e89058f', 'mgr@local', 'manager1', 'pass123', 'branch-1', 'manager', '2026-07-06T21:31:12.502Z'),
('a6f0b009-74e1-4f7c-97b4-34d9c86ee342', 'cook@local', 'kitchen1', 'pass123', 'branch-1', 'kitchen', '2026-07-06T21:31:12.517Z'),
('48d69f71-3f09-4efb-9d42-f4e79a5c8d1c', 'deli@local', 'delivery1', 'pass123', 'branch-1', 'delivery', '2026-07-06T21:31:12.536Z'),
('73ea96b6-1da6-4b0f-aee5-f3d368c25e62', 'admin@local', 'admin', 'admin123', 'branch-1', 'manager', '2026-07-06T21:31:17.020Z'),
('e328df2a-e048-4692-b3ec-4f7267b7402f', 'mgr@local', 'manager1', 'pass123', 'branch-1', 'manager', '2026-07-06T21:31:17.067Z'),
('524ef140-e53d-4953-9174-81fb7f3bd577', 'cook@local', 'kitchen1', 'pass123', 'branch-1', 'kitchen', '2026-07-06T21:31:17.083Z'),
('9fa0ca99-5df1-4956-abdd-4a778de6be07', 'deli@local', 'delivery1', 'pass123', 'branch-1', 'delivery', '2026-07-06T21:31:17.104Z')
ON CONFLICT (username) DO UPDATE SET
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  branch_id = EXCLUDED.branch_id,
  role = COALESCE(EXCLUDED.role, users.role),
  created_at = COALESCE(EXCLUDED.created_at, users.created_at);

COMMIT;

-- Notes:
--  - Revisa los duplicados de `username` antes de ejecutar si quieres conservar IDs originales.
--  - Ejecuta primero el esquema SQL (si no lo has creado) y luego este script.
--  - Si usas RLS en Supabase, desactiva temporalmente o crea políticas que permitan inserciones desde el panel SQL con la clave de servicio.

-- After import: verify users table and try login via backend using service role key from backend env vars.
