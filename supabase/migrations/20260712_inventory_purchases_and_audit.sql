-- Migración: inventario, compras, proveedores, transferencias y auditoría
-- Fecha: 2026-07-12
-- Nota: ejecutar en Supabase SQL Editor

-- ==========================
-- Utilidades comunes
-- ==========================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Función genérica para updated_at
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================
-- Tabla: branches (sucursales)
-- ==========================
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_branches_name ON public.branches(name);
CREATE TRIGGER trg_branches_updated_at
BEFORE UPDATE ON public.branches
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_updated_at();

-- ==========================
-- Tabla: suppliers (proveedores)
-- ==========================
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON public.suppliers(name);
CREATE TRIGGER trg_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_updated_at();

-- ==========================
-- Tabla: ingredients
-- ==========================
CREATE TABLE IF NOT EXISTS public.ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit TEXT NOT NULL, -- e.g., kg, g, unidad, litro
  cost_per_unit DECIMAL(12,4) DEFAULT 0,
  min_stock DECIMAL(12,4) DEFAULT 0,
  max_stock DECIMAL(12,4) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ingredients_name ON public.ingredients(name);
CREATE TRIGGER trg_ingredients_updated_at
BEFORE UPDATE ON public.ingredients
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_updated_at();

-- ==========================
-- Tabla: product_recipes (receta por producto)
-- ==========================
CREATE TABLE IF NOT EXISTS public.product_recipes (
  id BIGSERIAL PRIMARY KEY,
  -- Alineado con esquema de `products.id` (texto/slug en migraciones de menú).
  -- Si en tu modelo `products.id` es UUID, cambia aquí a UUID y migra datos.
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE RESTRICT,
  quantity DECIMAL(12,4) NOT NULL, -- cantidad del ingrediente por 1 unidad de producto
  unit TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, ingredient_id)
);
CREATE INDEX IF NOT EXISTS idx_product_recipes_product_id ON public.product_recipes(product_id);
CREATE TRIGGER trg_product_recipes_updated_at
BEFORE UPDATE ON public.product_recipes
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_updated_at();

-- ==========================
-- Tabla: inventory (stock por sucursal)
-- ==========================
CREATE TABLE IF NOT EXISTS public.inventory (
  id BIGSERIAL PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE RESTRICT,
  qty DECIMAL(12,4) NOT NULL DEFAULT 0,
  unit TEXT,
  lot_number TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  min_stock DECIMAL(12,4) DEFAULT 0,
  max_stock DECIMAL(12,4) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(branch_id, ingredient_id, lot_number)
);
CREATE INDEX IF NOT EXISTS idx_inventory_branch_ingredient ON public.inventory(branch_id, ingredient_id);
CREATE TRIGGER trg_inventory_updated_at
BEFORE UPDATE ON public.inventory
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_updated_at();

-- ==========================
-- Tabla: inventory_movements (entradas/salidas/ajustes)
-- ==========================
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id BIGSERIAL PRIMARY KEY,
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE RESTRICT,
  change_qty DECIMAL(12,4) NOT NULL,
  resulting_qty DECIMAL(12,4),
  reason TEXT,
  related_table TEXT,
  related_id TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_movements_branch_ing ON public.inventory_movements(branch_id, ingredient_id);

-- ==========================
-- Tabla: purchases (órdenes de compra)
-- ==========================
CREATE TABLE IF NOT EXISTS public.purchases (
  id BIGSERIAL PRIMARY KEY,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  invoice_number TEXT,
  total_amount DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TRIGGER trg_purchases_updated_at
BEFORE UPDATE ON public.purchases
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_updated_at();

CREATE TABLE IF NOT EXISTS public.purchase_items (
  id BIGSERIAL PRIMARY KEY,
  purchase_id BIGINT REFERENCES public.purchases(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE RESTRICT,
  quantity DECIMAL(12,4) NOT NULL,
  unit_price DECIMAL(12,4) NOT NULL,
  lot_number TEXT,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- ==========================
-- Tabla: transfers (entre sucursales)
-- ==========================
CREATE TABLE IF NOT EXISTS public.transfers (
  id BIGSERIAL PRIMARY KEY,
  from_branch UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  to_branch UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transfer_items (
  id BIGSERIAL PRIMARY KEY,
  transfer_id BIGINT REFERENCES public.transfers(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE RESTRICT,
  quantity DECIMAL(12,4) NOT NULL
);
CREATE TRIGGER trg_transfers_updated_at
BEFORE UPDATE ON public.transfers
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_updated_at();

-- ==========================
-- Tabla: audits (registro de acciones)
-- ==========================
CREATE TABLE IF NOT EXISTS public.audits (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT,
  action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  changed_by UUID REFERENCES public.users(id),
  branch_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audits_table_created ON public.audits(table_name, created_at DESC);

-- ==========================
-- Función: auditar cambios (genérica)
-- ==========================
CREATE OR REPLACE FUNCTION public.fn_audit_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_old JSONB;
  v_new JSONB;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    v_old = to_jsonb(OLD);
    INSERT INTO public.audits(table_name, record_id, action, changed_by, branch_id, old_data, new_data)
    VALUES (TG_TABLE_NAME, COALESCE(OLD.id::text, ''), 'DELETE', current_setting('jwt.claims.user_id', true)::uuid, NULL, v_old, NULL);
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    v_old = to_jsonb(OLD);
    v_new = to_jsonb(NEW);
    INSERT INTO public.audits(table_name, record_id, action, changed_by, branch_id, old_data, new_data)
    VALUES (TG_TABLE_NAME, COALESCE(NEW.id::text, ''), 'UPDATE', current_setting('jwt.claims.user_id', true)::uuid, NULL, v_old, v_new);
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    v_new = to_jsonb(NEW);
    INSERT INTO public.audits(table_name, record_id, action, changed_by, branch_id, new_data)
    VALUES (TG_TABLE_NAME, COALESCE(NEW.id::text, ''), 'INSERT', current_setting('jwt.claims.user_id', true)::uuid, NULL, v_new);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers de auditoría en tablas críticas
DO $$
DECLARE tbl TEXT;
BEGIN
  -- Lista de tablas a auditar
  FOR tbl IN SELECT unnest(ARRAY['products','categories','orders','order_items','inventory','purchases','purchase_items','transfers','transfer_items','suppliers','ingredients','branches','users']) LOOP
    IF to_regclass('public.' || tbl) IS NOT NULL THEN
      EXECUTE format('DROP TRIGGER IF EXISTS audit_%I_trigger ON public.%I;', tbl, tbl);
      EXECUTE format('CREATE TRIGGER audit_%I_trigger AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.fn_audit_changes();', tbl, tbl);
    END IF;
  END LOOP;
END$$;

-- ==========================
-- Función: consumir stock en insert de order_items
-- ==========================
CREATE OR REPLACE FUNCTION public.fn_consume_stock_on_order_item()
RETURNS TRIGGER AS $$
DECLARE
  rec RECORD;
  required_qty NUMERIC;
  cur_qty NUMERIC;
  v_branch UUID;
  v_prod_uuid UUID;
BEGIN
  -- Obtener branch_id de la orden padre
  SELECT branch_id INTO v_branch FROM public.orders WHERE id = NEW.order_id;
  IF v_branch IS NULL THEN
    RAISE EXCEPTION 'Order % does not have branch_id', NEW.order_id;
  END IF;

  -- Si no hay product_id en el item, no consumir stock
  IF NEW.product_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Intentar convertir product_id a UUID; si falla, saltar consumo
  BEGIN
    v_prod_uuid := NEW.product_id::uuid;
  EXCEPTION WHEN others THEN
    RETURN NEW;
  END;

  FOR rec IN SELECT ingredient_id, quantity FROM public.product_recipes WHERE product_id = v_prod_uuid LOOP
    required_qty := (rec.quantity::numeric) * (NEW.quantity::numeric);

    SELECT qty INTO cur_qty FROM public.inventory
      WHERE branch_id = v_branch AND ingredient_id = rec.ingredient_id
      ORDER BY lot_number NULLS LAST LIMIT 1 FOR UPDATE;

    IF cur_qty IS NULL OR cur_qty < required_qty THEN
      RAISE EXCEPTION 'Insufficient stock for ingredient % (required: %)', rec.ingredient_id, required_qty;
    END IF;

    UPDATE public.inventory
      SET qty = qty - required_qty, updated_at = NOW()
      WHERE branch_id = v_branch AND ingredient_id = rec.ingredient_id
      AND qty >= required_qty
      RETURNING qty INTO cur_qty;

    -- Registrar movimiento
    INSERT INTO public.inventory_movements(branch_id, ingredient_id, change_qty, resulting_qty, reason, related_table, related_id, created_by)
    VALUES (v_branch, rec.ingredient_id, -required_qty, cur_qty, 'order_consumption', 'order_items', NEW.id::text, current_setting('jwt.claims.user_id', true)::uuid);
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger en order_items
DROP TRIGGER IF EXISTS trg_consume_stock_order_items ON public.order_items;
CREATE TRIGGER trg_consume_stock_order_items
BEFORE INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.fn_consume_stock_on_order_item();

-- ==========================
-- Función: aumentar stock cuando se inserta purchase_item
-- ==========================
CREATE OR REPLACE FUNCTION public.fn_increase_stock_on_purchase_item()
RETURNS TRIGGER AS $$
DECLARE
  cur_qty NUMERIC;
  v_branch UUID;
BEGIN
  SELECT branch_id INTO v_branch FROM public.purchases WHERE id = NEW.purchase_id;
  IF v_branch IS NULL THEN
    RAISE EXCEPTION 'Purchase % does not have branch_id', NEW.purchase_id;
  END IF;

  -- Insert or update inventory row for the branch
  INSERT INTO public.inventory(branch_id, ingredient_id, qty, unit, lot_number, expires_at, created_at, updated_at)
  VALUES ( v_branch, NEW.ingredient_id, NEW.quantity, NULL, NEW.lot_number, NEW.expires_at, NOW(), NOW())
  ON CONFLICT (branch_id, ingredient_id, lot_number) DO UPDATE
    SET qty = public.inventory.qty + EXCLUDED.qty,
        updated_at = NOW();

  -- Obtener nuevo qty
  SELECT qty INTO cur_qty FROM public.inventory WHERE branch_id = v_branch AND ingredient_id = NEW.ingredient_id ORDER BY lot_number NULLS LAST LIMIT 1;

  INSERT INTO public.inventory_movements(branch_id, ingredient_id, change_qty, resulting_qty, reason, related_table, related_id, created_by)
  VALUES (v_branch, NEW.ingredient_id, NEW.quantity, cur_qty, 'purchase_received', 'purchase_items', NEW.id::text, current_setting('jwt.claims.user_id', true)::uuid);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increase_stock_purchase_items ON public.purchase_items;
CREATE TRIGGER trg_increase_stock_purchase_items
AFTER INSERT ON public.purchase_items
FOR EACH ROW
EXECUTE FUNCTION public.fn_increase_stock_on_purchase_item();

-- ==========================
-- Índices y notas finales
-- ==========================
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON public.purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_transfer_items_transfer_id ON public.transfer_items(transfer_id);

-- Nota: Revisar y ajustar Políticas RLS por tabla en Supabase según el modelo de roles y JWT claims.

-- Fin de migración
