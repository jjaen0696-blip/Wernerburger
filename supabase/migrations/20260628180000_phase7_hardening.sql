/*
# Fase 7 — Endurecimiento (índices de auditoría y rendimiento)

- Índices para acelerar búsquedas del historial por referencia (pedido/compra) y por usuario.
- Verificación: deja constancia de que RLS está activo en todas las tablas del módulo.

Notas de seguridad/concurrencia (ya implementadas en fases previas):
- Todas las mutaciones de stock usan funciones SECURITY DEFINER con SELECT ... FOR UPDATE
  (bloqueo de fila) → evita descuentos duplicados y condiciones de carrera.
- El descuento por venta es idempotente (orders.inventory_applied).
- Cada operación deja un registro en inv_movements (auditoría completa: usuario, fecha, motivo).
- NO se usa FORCE ROW LEVEL SECURITY a propósito: las RPC corren como owner y deben poder
  escribir el stock de forma controlada; la seguridad se aplica DENTRO de cada función (is_admin/sucursal).

Aditivo e idempotente.
*/

CREATE INDEX IF NOT EXISTS idx_inv_movements_ref ON public.inv_movements(ref_id);
CREATE INDEX IF NOT EXISTS idx_inv_movements_created_by ON public.inv_movements(created_by);
CREATE INDEX IF NOT EXISTS idx_inv_purchases_supplier ON public.inv_purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inv_products_supplier ON public.inv_products(supplier_id);

-- Verificación: asegurar RLS habilitado (no falla si ya lo está).
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','inv_suppliers','inv_products','inv_branch_stock','inv_purchases','inv_movements','recipe_items'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;
