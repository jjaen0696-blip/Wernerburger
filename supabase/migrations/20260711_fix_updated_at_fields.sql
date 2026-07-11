-- Migración: Corregir campos updated_at faltantes
-- Fecha: 2026-07-11
-- Descripción: Agregar updated_at a tablas que lo necesitan y corregir triggers

-- ==========================
-- 1. Agregar updated_at a tablas que lo necesitan
-- ==========================

-- Tabla: orders
ALTER TABLE IF EXISTS public.orders
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Tabla: order_items  
ALTER TABLE IF EXISTS public.order_items
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Tabla: purchase_items
ALTER TABLE IF EXISTS public.purchase_items
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Tabla: transfer_items
ALTER TABLE IF EXISTS public.transfer_items
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ==========================
-- 2. Crear/recrear triggers de updated_at para tablas que lo tienen
-- ==========================

-- Orders
DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_updated_at();

-- Order items
DROP TRIGGER IF EXISTS trg_order_items_updated_at ON public.order_items;
CREATE TRIGGER trg_order_items_updated_at
BEFORE UPDATE ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_updated_at();

-- Purchase items
DROP TRIGGER IF EXISTS trg_purchase_items_updated_at ON public.purchase_items;
CREATE TRIGGER trg_purchase_items_updated_at
BEFORE UPDATE ON public.purchase_items
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_updated_at();

-- Transfer items
DROP TRIGGER IF EXISTS trg_transfer_items_updated_at ON public.transfer_items;
CREATE TRIGGER trg_transfer_items_updated_at
BEFORE UPDATE ON public.transfer_items
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_updated_at();

-- ==========================
-- 3. Recrear triggers de auditoría sin incluir 'users'
-- ==========================

-- Limpiar triggers de auditoría existentes
DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['products','categories','orders','order_items','inventory','purchases','purchase_items','transfers','transfer_items','suppliers','ingredients','branches']) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_%I_trigger ON public.%I;', tbl, tbl);
  END LOOP;
END$$;

-- Recrear triggers de auditoría solo en tablas que existen
DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['products','categories','orders','order_items','inventory','purchases','purchase_items','transfers','transfer_items','suppliers','ingredients','branches']) LOOP
    IF to_regclass('public.' || tbl) IS NOT NULL THEN
      EXECUTE format('CREATE TRIGGER audit_%I_trigger AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.fn_audit_changes();', tbl, tbl);
    END IF;
  END LOOP;
END$$;

-- ==========================
-- 4. Habilitar Realtime si es necesario
-- ==========================
ALTER PUBLICATION supabase_realtime ADD TABLE IF EXISTS public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE IF EXISTS public.order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE IF EXISTS public.branches;
ALTER PUBLICATION supabase_realtime ADD TABLE IF EXISTS public.inventory;
