/*
# Fase 2 — Esquema base del módulo de inventario

## Tablas nuevas (todas con prefijo inv_ / recipe_)
- inv_suppliers   : proveedores.
- inv_products    : catálogo de insumos + existencia en el INVENTARIO CENTRAL (central_qty),
                    stock mínimo, costo promedio (avg_cost) y último costo.
- inv_branch_stock: existencia por sucursal (qty, min, max) — 1 fila por (producto, sucursal).
- inv_purchases   : compras al inventario central (cantidad, costo, proveedor, fecha, lote, vencimiento).
- inv_movements   : HISTORIAL unificado de todos los movimientos (compra/distribución/transferencia/ajuste/consumo/corrección).
- recipe_items    : receta por nombre de producto del menú (compartida entre sucursales).

## Columnas nuevas (aditivas, seguras)
- orders.inventory_applied boolean : marca idempotente para el descuento por venta (Fase 4).

## Seguridad
- RLS en todas: el admin gestiona todo; el encargado SOLO lee/usa el inventario de su sucursal.
- Todas las MUTACIONES de stock pasan por funciones SECURITY DEFINER (atómicas, con bloqueo de fila).
- RPC de esta fase: inv_register_purchase (registrar compra al central).

## Compatibilidad
- 100% aditivo. No se altera ni borra ninguna tabla/dato existente.
- Idempotente.
*/

-- ============================================================
-- Tablas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.inv_suppliers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  contact    text NOT NULL DEFAULT '',
  phone      text NOT NULL DEFAULT '',
  notes      text NOT NULL DEFAULT '',
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inv_products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  category    text NOT NULL DEFAULT 'General',
  code        text,
  unit        text NOT NULL DEFAULT 'unidad',
  central_qty numeric(14,3) NOT NULL DEFAULT 0,
  min_stock   numeric(14,3) NOT NULL DEFAULT 0,
  avg_cost    numeric(12,2) NOT NULL DEFAULT 0,
  last_cost   numeric(12,2) NOT NULL DEFAULT 0,
  supplier_id uuid REFERENCES public.inv_suppliers(id) ON DELETE SET NULL,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
-- Código único cuando existe
CREATE UNIQUE INDEX IF NOT EXISTS uq_inv_products_code ON public.inv_products (lower(code)) WHERE code IS NOT NULL AND code <> '';
CREATE INDEX IF NOT EXISTS idx_inv_products_category ON public.inv_products(category);

CREATE TABLE IF NOT EXISTS public.inv_branch_stock (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES public.inv_products(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  qty         numeric(14,3) NOT NULL DEFAULT 0,
  min_stock   numeric(14,3) NOT NULL DEFAULT 0,
  max_stock   numeric(14,3) NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, location_id)
);
CREATE INDEX IF NOT EXISTS idx_inv_branch_stock_location ON public.inv_branch_stock(location_id);

CREATE TABLE IF NOT EXISTS public.inv_purchases (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid NOT NULL REFERENCES public.inv_products(id) ON DELETE CASCADE,
  qty           numeric(14,3) NOT NULL CHECK (qty > 0),
  unit_cost     numeric(12,2) NOT NULL DEFAULT 0,
  supplier_id   uuid REFERENCES public.inv_suppliers(id) ON DELETE SET NULL,
  purchase_date date NOT NULL DEFAULT current_date,
  lote          text NOT NULL DEFAULT '',
  expiry_date   date,
  notes         text NOT NULL DEFAULT '',
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inv_purchases_product ON public.inv_purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_inv_purchases_date ON public.inv_purchases(purchase_date DESC);

CREATE TABLE IF NOT EXISTS public.inv_movements (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type             text NOT NULL CHECK (type IN ('compra','distribucion','transferencia','ajuste','consumo','correccion')),
  product_id       uuid REFERENCES public.inv_products(id) ON DELETE SET NULL,
  product_name     text NOT NULL DEFAULT '',
  location_id      uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  from_location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  to_location_id   uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  qty              numeric(14,3) NOT NULL,
  unit_cost        numeric(12,2),
  reason           text NOT NULL DEFAULT '',
  ref_id           uuid,
  created_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_email text NOT NULL DEFAULT '',
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inv_movements_created ON public.inv_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inv_movements_location ON public.inv_movements(location_id);
CREATE INDEX IF NOT EXISTS idx_inv_movements_product ON public.inv_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inv_movements_type ON public.inv_movements(type);

CREATE TABLE IF NOT EXISTS public.recipe_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name  text NOT NULL,
  product_id uuid NOT NULL REFERENCES public.inv_products(id) ON DELETE CASCADE,
  qty        numeric(14,3) NOT NULL CHECK (qty > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (item_name, product_id)
);
CREATE INDEX IF NOT EXISTS idx_recipe_items_name ON public.recipe_items(item_name);

-- Marca idempotente para el descuento por venta (Fase 4)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='inventory_applied') THEN
    ALTER TABLE public.orders ADD COLUMN inventory_applied boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- updated_at automático
DROP TRIGGER IF EXISTS trg_inv_products_updated ON public.inv_products;
CREATE TRIGGER trg_inv_products_updated BEFORE UPDATE ON public.inv_products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_inv_branch_stock_updated ON public.inv_branch_stock;
CREATE TRIGGER trg_inv_branch_stock_updated BEFORE UPDATE ON public.inv_branch_stock FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_recipe_items_updated ON public.recipe_items;
CREATE TRIGGER trg_recipe_items_updated BEFORE UPDATE ON public.recipe_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.inv_suppliers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inv_products     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inv_branch_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inv_purchases    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inv_movements    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_items     ENABLE ROW LEVEL SECURITY;

-- Catálogo (proveedores, productos, recetas): lectura para todo el personal; escritura solo admin.
DROP POLICY IF EXISTS "inv_suppliers_read" ON public.inv_suppliers;
CREATE POLICY "inv_suppliers_read" ON public.inv_suppliers FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "inv_suppliers_admin" ON public.inv_suppliers;
CREATE POLICY "inv_suppliers_admin" ON public.inv_suppliers FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "inv_products_read" ON public.inv_products;
CREATE POLICY "inv_products_read" ON public.inv_products FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "inv_products_admin" ON public.inv_products;
CREATE POLICY "inv_products_admin" ON public.inv_products FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "recipe_items_read" ON public.recipe_items;
CREATE POLICY "recipe_items_read" ON public.recipe_items FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "recipe_items_admin" ON public.recipe_items;
CREATE POLICY "recipe_items_admin" ON public.recipe_items FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Compras: admin gestiona; lectura admin (para reportes). (Las compras son del central.)
DROP POLICY IF EXISTS "inv_purchases_admin" ON public.inv_purchases;
CREATE POLICY "inv_purchases_admin" ON public.inv_purchases FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Existencia por sucursal: admin ve todo; encargado ve solo su sucursal. (Escritura vía RPC SECURITY DEFINER.)
DROP POLICY IF EXISTS "inv_branch_stock_read" ON public.inv_branch_stock;
CREATE POLICY "inv_branch_stock_read" ON public.inv_branch_stock FOR SELECT TO authenticated
  USING (public.is_admin() OR location_id = public.current_location_id());
DROP POLICY IF EXISTS "inv_branch_stock_admin" ON public.inv_branch_stock;
CREATE POLICY "inv_branch_stock_admin" ON public.inv_branch_stock FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Movimientos (historial): admin ve todo; encargado ve los de su sucursal (origen/destino/afectada).
DROP POLICY IF EXISTS "inv_movements_read" ON public.inv_movements;
CREATE POLICY "inv_movements_read" ON public.inv_movements FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR location_id = public.current_location_id()
    OR from_location_id = public.current_location_id()
    OR to_location_id = public.current_location_id()
  );
DROP POLICY IF EXISTS "inv_movements_admin" ON public.inv_movements;
CREATE POLICY "inv_movements_admin" ON public.inv_movements FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Privilegios de tabla (RLS sigue restringiendo). Las RPC SECURITY DEFINER no dependen de esto.
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.inv_suppliers, public.inv_products, public.inv_branch_stock,
  public.inv_purchases, public.inv_movements, public.recipe_items
  TO authenticated;

-- ============================================================
-- RPC: registrar compra al inventario central (recalcula costo promedio ponderado)
-- ============================================================
CREATE OR REPLACE FUNCTION public.inv_register_purchase(
  p_product_id  uuid,
  p_qty         numeric,
  p_unit_cost   numeric DEFAULT 0,
  p_supplier_id uuid    DEFAULT NULL,
  p_purchase_date date  DEFAULT current_date,
  p_lote        text    DEFAULT '',
  p_expiry      date    DEFAULT NULL,
  p_notes       text    DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_old_qty numeric; v_old_avg numeric; v_new_avg numeric;
  v_purchase uuid; v_uid uuid; v_email text; v_name text;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Solo el administrador puede registrar compras'; END IF;
  IF p_qty IS NULL OR p_qty <= 0 THEN RAISE EXCEPTION 'La cantidad debe ser mayor a 0'; END IF;
  v_uid := auth.uid();
  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;

  SELECT central_qty, avg_cost, name INTO v_old_qty, v_old_avg, v_name
  FROM public.inv_products WHERE id = p_product_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'El producto no existe'; END IF;

  IF (v_old_qty + p_qty) > 0 THEN
    v_new_avg := round((v_old_qty * v_old_avg + p_qty * COALESCE(p_unit_cost,0)) / (v_old_qty + p_qty), 2);
  ELSE
    v_new_avg := v_old_avg;
  END IF;

  UPDATE public.inv_products
    SET central_qty = central_qty + p_qty,
        avg_cost    = v_new_avg,
        last_cost   = COALESCE(p_unit_cost, last_cost),
        supplier_id = COALESCE(p_supplier_id, supplier_id)
  WHERE id = p_product_id;

  INSERT INTO public.inv_purchases (product_id, qty, unit_cost, supplier_id, purchase_date, lote, expiry_date, notes, created_by)
  VALUES (p_product_id, p_qty, COALESCE(p_unit_cost,0), p_supplier_id, COALESCE(p_purchase_date, current_date), COALESCE(p_lote,''), p_expiry, COALESCE(p_notes,''), v_uid)
  RETURNING id INTO v_purchase;

  INSERT INTO public.inv_movements (type, product_id, product_name, location_id, qty, unit_cost, reason, ref_id, created_by, created_by_email)
  VALUES ('compra', p_product_id, v_name, NULL, p_qty, COALESCE(p_unit_cost,0), COALESCE(NULLIF(p_notes,''),'Compra de mercancía'), v_purchase, v_uid, COALESCE(v_email,''));

  RETURN v_purchase;
END;
$$;
GRANT EXECUTE ON FUNCTION public.inv_register_purchase(uuid, numeric, numeric, uuid, date, text, date, text) TO authenticated;

-- ============================================================
-- Realtime
-- ============================================================
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['inv_products','inv_branch_stock','inv_movements','inv_purchases','recipe_items','inv_suppliers'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename=t) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
