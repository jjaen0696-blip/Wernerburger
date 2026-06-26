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
