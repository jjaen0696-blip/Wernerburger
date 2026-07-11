-- Migración: RLS y políticas básicas para Wernerburger
-- Fecha: 2026-07-11

-- Nota: usa claims dentro del JWT: user_id, role, branch_id

-- Helpers: none (usamos current_setting('jwt.claims.xxx', true))

-- ==========================
-- Tabla: products
-- ==========================
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;

-- Permitir lectura pública (menú)
CREATE POLICY products_select_public ON public.products
  FOR SELECT USING (true);

-- Políticas para admin en products (SELECT/INSERT/UPDATE/DELETE)
CREATE POLICY products_admin_select ON public.products
  FOR SELECT USING (current_setting('jwt.claims.role', true) = 'admin');
CREATE POLICY products_admin_insert ON public.products
  FOR INSERT WITH CHECK (current_setting('jwt.claims.role', true) = 'admin');
CREATE POLICY products_admin_update ON public.products
  FOR UPDATE USING (current_setting('jwt.claims.role', true) = 'admin') WITH CHECK (current_setting('jwt.claims.role', true) = 'admin');
CREATE POLICY products_admin_delete ON public.products
  FOR DELETE USING (current_setting('jwt.claims.role', true) = 'admin');

-- ==========================
-- Tabla: orders
-- ==========================
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;

-- Cualquiera autenticado puede insertar una orden para su sucursal
CREATE POLICY orders_insert_auth ON public.orders
  FOR INSERT WITH CHECK (
    current_setting('jwt.claims.user_id', true) IS NOT NULL
    AND (
      current_setting('jwt.claims.role', true) = 'admin'
      OR branch_id = current_setting('jwt.claims.branch_id', true)::uuid
    )
  );

-- Staff/admin puede ver órdenes de su sucursal (admins ven todo)
CREATE POLICY orders_select_branch ON public.orders
  FOR SELECT USING (
    current_setting('jwt.claims.role', true) = 'admin'
    OR branch_id = current_setting('jwt.claims.branch_id', true)::uuid
  );

-- Staff (cocina/delivery) o admin pueden actualizar órdenes de su sucursal
CREATE POLICY orders_update_branch ON public.orders
  FOR UPDATE USING (
    current_setting('jwt.claims.role', true) = 'admin'
    OR (
      branch_id = current_setting('jwt.claims.branch_id', true)::uuid
      AND current_setting('jwt.claims.role', true) IN ('cocina','delivery')
    )
  ) WITH CHECK (true);

-- ==========================
-- Tabla: order_items
-- ==========================
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;

-- Insertar items si el usuario autenticado puede insertar la orden padre
CREATE POLICY order_items_insert_parent_check ON public.order_items
  FOR INSERT WITH CHECK (
    current_setting('jwt.claims.user_id', true) IS NOT NULL
    AND (
      current_setting('jwt.claims.role', true) = 'admin'
      OR EXISTS (
        SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.branch_id = current_setting('jwt.claims.branch_id', true)::uuid
      )
    )
  );

-- Selección y actualización de items permitida a staff/admin de la sucursal
-- Políticas para order_items: selección/actualización/borrado por staff/admin de la sucursal
CREATE POLICY order_items_select ON public.order_items
  FOR SELECT USING (
    current_setting('jwt.claims.role', true) = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.orders o WHERE o.id = public.order_items.order_id AND o.branch_id = current_setting('jwt.claims.branch_id', true)::uuid
    )
  );
CREATE POLICY order_items_update ON public.order_items
  FOR UPDATE USING (
    current_setting('jwt.claims.role', true) = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.orders o WHERE o.id = public.order_items.order_id AND o.branch_id = current_setting('jwt.claims.branch_id', true)::uuid
    )
  ) WITH CHECK (true);
CREATE POLICY order_items_delete ON public.order_items
  FOR DELETE USING (
    current_setting('jwt.claims.role', true) = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.orders o WHERE o.id = public.order_items.order_id AND o.branch_id = current_setting('jwt.claims.branch_id', true)::uuid
    )
  );

ALTER TABLE IF EXISTS public.inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY inventory_admin_all ON public.inventory
  FOR ALL USING (current_setting('jwt.claims.role', true) = 'admin') WITH CHECK (current_setting('jwt.claims.role', true) = 'admin');
CREATE POLICY inventory_branch_staff ON public.inventory
  FOR ALL USING (
    current_setting('jwt.claims.role', true) IN ('cocina','admin')
    OR branch_id = current_setting('jwt.claims.branch_id', true)::uuid
  ) WITH CHECK (branch_id = current_setting('jwt.claims.branch_id', true)::uuid OR current_setting('jwt.claims.role', true) = 'admin');
-- Inventory admin policies
CREATE POLICY inventory_admin_select ON public.inventory
  FOR SELECT USING (current_setting('jwt.claims.role', true) = 'admin');
CREATE POLICY inventory_admin_insert ON public.inventory
  FOR INSERT WITH CHECK (current_setting('jwt.claims.role', true) = 'admin');
CREATE POLICY inventory_admin_update ON public.inventory
  FOR UPDATE USING (current_setting('jwt.claims.role', true) = 'admin') WITH CHECK (current_setting('jwt.claims.role', true) = 'admin');
CREATE POLICY inventory_admin_delete ON public.inventory
  FOR DELETE USING (current_setting('jwt.claims.role', true) = 'admin');

-- Inventory branch staff policies (select/update/insert for branch staff)
CREATE POLICY inventory_branch_select ON public.inventory
  FOR SELECT USING (
    current_setting('jwt.claims.role', true) IN ('cocina','admin')
    OR branch_id = current_setting('jwt.claims.branch_id', true)::uuid
  );
CREATE POLICY inventory_branch_insert ON public.inventory
  FOR INSERT WITH CHECK (
    branch_id = current_setting('jwt.claims.branch_id', true)::uuid OR current_setting('jwt.claims.role', true) = 'admin'
  );
CREATE POLICY inventory_branch_update ON public.inventory
  FOR UPDATE USING (
    current_setting('jwt.claims.role', true) IN ('cocina','admin')
    OR branch_id = current_setting('jwt.claims.branch_id', true)::uuid
  ) WITH CHECK (branch_id = current_setting('jwt.claims.branch_id', true)::uuid OR current_setting('jwt.claims.role', true) = 'admin');
-- ==========================
-- Tabla: purchases & purchase_items
-- ==========================
ALTER TABLE IF EXISTS public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.purchase_items ENABLE ROW LEVEL SECURITY;

-- Policies admin for purchases
CREATE POLICY purchases_admin_select ON public.purchases
  FOR SELECT USING (current_setting('jwt.claims.role', true) = 'admin');
CREATE POLICY purchases_admin_insert ON public.purchases
  FOR INSERT WITH CHECK (current_setting('jwt.claims.role', true) = 'admin');
CREATE POLICY purchases_admin_update ON public.purchases
  FOR UPDATE USING (current_setting('jwt.claims.role', true) = 'admin') WITH CHECK (current_setting('jwt.claims.role', true) = 'admin');
CREATE POLICY purchases_admin_delete ON public.purchases
  FOR DELETE USING (current_setting('jwt.claims.role', true) = 'admin');

-- Policies para staff de sucursal en purchases (select/update/delete)
CREATE POLICY purchases_branch_select ON public.purchases
  FOR SELECT USING (
    current_setting('jwt.claims.role', true) = 'admin'
    OR branch_id = current_setting('jwt.claims.branch_id', true)::uuid
  );
CREATE POLICY purchases_branch_update ON public.purchases
  FOR UPDATE USING (
    current_setting('jwt.claims.role', true) = 'admin'
    OR branch_id = current_setting('jwt.claims.branch_id', true)::uuid
  ) WITH CHECK (branch_id = current_setting('jwt.claims.branch_id', true)::uuid OR current_setting('jwt.claims.role', true) = 'admin');
CREATE POLICY purchases_branch_delete ON public.purchases
  FOR DELETE USING (
    current_setting('jwt.claims.role', true) = 'admin'
    OR branch_id = current_setting('jwt.claims.branch_id', true)::uuid
  );

CREATE POLICY purchase_items_parent_check ON public.purchase_items
  FOR INSERT WITH CHECK (
    current_setting('jwt.claims.role', true) = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.purchases p WHERE p.id = purchase_id AND p.branch_id = current_setting('jwt.claims.branch_id', true)::uuid
    )
  );

-- ==========================
-- Tabla: transfers & transfer_items
-- ==========================
ALTER TABLE IF EXISTS public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transfer_items ENABLE ROW LEVEL SECURITY;

-- Policies admin for transfers
CREATE POLICY transfers_admin_select ON public.transfers
  FOR SELECT USING (current_setting('jwt.claims.role', true) = 'admin');
CREATE POLICY transfers_admin_insert ON public.transfers
  FOR INSERT WITH CHECK (current_setting('jwt.claims.role', true) = 'admin');
CREATE POLICY transfers_admin_update ON public.transfers
  FOR UPDATE USING (current_setting('jwt.claims.role', true) = 'admin') WITH CHECK (current_setting('jwt.claims.role', true) = 'admin');
CREATE POLICY transfers_admin_delete ON public.transfers
  FOR DELETE USING (current_setting('jwt.claims.role', true) = 'admin');

CREATE POLICY transfers_branch_staff ON public.transfers
  FOR SELECT USING (
    current_setting('jwt.claims.role', true) = 'admin'
    OR from_branch = current_setting('jwt.claims.branch_id', true)::uuid
    OR to_branch = current_setting('jwt.claims.branch_id', true)::uuid
  );

CREATE POLICY transfer_items_parent_check ON public.transfer_items
  FOR INSERT WITH CHECK (
    current_setting('jwt.claims.role', true) = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.transfers t WHERE t.id = transfer_id AND (t.from_branch = current_setting('jwt.claims.branch_id', true)::uuid OR t.to_branch = current_setting('jwt.claims.branch_id', true)::uuid)
    )
  );

-- ==========================
-- Tabla: suppliers, ingredients, branches
-- ==========================
ALTER TABLE IF EXISTS public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.branches ENABLE ROW LEVEL SECURITY;

-- Suppliers admin-only
CREATE POLICY suppliers_admin_select ON public.suppliers
  FOR SELECT USING (current_setting('jwt.claims.role', true) = 'admin');
CREATE POLICY suppliers_admin_insert ON public.suppliers
  FOR INSERT WITH CHECK (current_setting('jwt.claims.role', true) = 'admin');
CREATE POLICY suppliers_admin_update ON public.suppliers
  FOR UPDATE USING (current_setting('jwt.claims.role', true) = 'admin') WITH CHECK (current_setting('jwt.claims.role', true) = 'admin');
CREATE POLICY suppliers_admin_delete ON public.suppliers
  FOR DELETE USING (current_setting('jwt.claims.role', true) = 'admin');

-- Ingredients admin-only
CREATE POLICY ingredients_admin_select ON public.ingredients
  FOR SELECT USING (current_setting('jwt.claims.role', true) = 'admin');
CREATE POLICY ingredients_admin_insert ON public.ingredients
  FOR INSERT WITH CHECK (current_setting('jwt.claims.role', true) = 'admin');
CREATE POLICY ingredients_admin_update ON public.ingredients
  FOR UPDATE USING (current_setting('jwt.claims.role', true) = 'admin') WITH CHECK (current_setting('jwt.claims.role', true) = 'admin');
CREATE POLICY ingredients_admin_delete ON public.ingredients
  FOR DELETE USING (current_setting('jwt.claims.role', true) = 'admin');

CREATE POLICY branches_admin_select ON public.branches
  FOR SELECT USING (true);
CREATE POLICY branches_admin_insert ON public.branches
  FOR INSERT WITH CHECK (current_setting('jwt.claims.role', true) = 'admin');
CREATE POLICY branches_admin_update ON public.branches
  FOR UPDATE USING (current_setting('jwt.claims.role', true) = 'admin') WITH CHECK (current_setting('jwt.claims.role', true) = 'admin');
CREATE POLICY branches_admin_delete ON public.branches
  FOR DELETE USING (current_setting('jwt.claims.role', true) = 'admin');

-- ==========================
-- Tabla: users
-- ==========================
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;

-- Usuario puede leer su propio registro
CREATE POLICY users_select_self ON public.users
  FOR SELECT USING (current_setting('jwt.claims.user_id', true)::uuid = id);

-- Admin administra usuarios
CREATE POLICY users_admin_select ON public.users
  FOR SELECT USING (current_setting('jwt.claims.role', true) = 'admin');
CREATE POLICY users_admin_insert ON public.users
  FOR INSERT WITH CHECK (current_setting('jwt.claims.role', true) = 'admin');
CREATE POLICY users_admin_update ON public.users
  FOR UPDATE USING (current_setting('jwt.claims.role', true) = 'admin') WITH CHECK (current_setting('jwt.claims.role', true) = 'admin');
CREATE POLICY users_admin_delete ON public.users
  FOR DELETE USING (current_setting('jwt.claims.role', true) = 'admin');

-- ==========================
-- Tabla: audits (solo admin)
-- ==========================
ALTER TABLE IF EXISTS public.audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY audits_admin_select ON public.audits
  FOR SELECT USING (current_setting('jwt.claims.role', true) = 'admin');
CREATE POLICY audits_admin_insert ON public.audits
  FOR INSERT WITH CHECK (current_setting('jwt.claims.role', true) = 'admin');
CREATE POLICY audits_admin_update ON public.audits
  FOR UPDATE USING (current_setting('jwt.claims.role', true) = 'admin') WITH CHECK (current_setting('jwt.claims.role', true) = 'admin');
CREATE POLICY audits_admin_delete ON public.audits
  FOR DELETE USING (current_setting('jwt.claims.role', true) = 'admin');

-- Fin de políticas RLS básicas
