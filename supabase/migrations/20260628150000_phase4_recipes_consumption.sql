/*
# Fase 4 — Descuento automático por venta + verificación de stock

## Descuento automático
- Trigger BEFORE UPDATE en `orders`: cuando un pedido pasa a 'completed' (y no se aplicó antes),
  descuenta los ingredientes según la receta (recipe_items por nombre de producto del menú),
  SOLO del inventario de la sucursal del pedido (orders.location_id).
- Idempotente: usa orders.inventory_applied para no descontar dos veces.
- SECURITY DEFINER: opera sobre el inventario sin depender de los permisos del usuario de cocina.
- Registra un movimiento 'consumo' por ingrediente (historial/auditoría).
- No bloquea la cocina: si falta stock, la existencia puede quedar en negativo (señal de sobreventa)
  y se refleja como “Agotado” + alerta. La PREVENCIÓN se hace al confirmar el pedido (función de abajo).

## Verificación de stock (advertencia al confirmar pedido)
- `check_stock_for_order(location_id, items_jsonb)`: devuelve los ingredientes que NO alcanzan
  para el carrito en esa sucursal. Callable por el cliente (anon) — solo expone faltantes del carrito,
  no el inventario completo.

## Compatibilidad
- Aditivo. Usa la columna orders.inventory_applied creada en la Fase 2.
*/

-- ============================================================
-- Trigger de consumo automático
-- ============================================================
CREATE OR REPLACE FUNCTION public.apply_inventory_on_complete()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid; v_email text; r record;
BEGIN
  IF NEW.status = 'completed'
     AND (OLD.status IS DISTINCT FROM 'completed')
     AND NEW.inventory_applied = false
     AND NEW.location_id IS NOT NULL THEN

    v_uid := auth.uid();
    SELECT email INTO v_email FROM auth.users WHERE id = v_uid;

    FOR r IN
      SELECT ri.product_id, p.name AS pname, SUM(ri.qty * oi.quantity) AS used
      FROM public.order_items oi
      JOIN public.recipe_items ri ON ri.item_name = oi.name
      JOIN public.inv_products p ON p.id = ri.product_id
      WHERE oi.order_id = NEW.id
      GROUP BY ri.product_id, p.name
    LOOP
      INSERT INTO public.inv_branch_stock (product_id, location_id, qty)
        VALUES (r.product_id, NEW.location_id, 0)
        ON CONFLICT (product_id, location_id) DO NOTHING;

      UPDATE public.inv_branch_stock
        SET qty = qty - r.used
        WHERE product_id = r.product_id AND location_id = NEW.location_id;

      INSERT INTO public.inv_movements (type, product_id, product_name, location_id, qty, reason, ref_id, created_by, created_by_email)
        VALUES ('consumo', r.product_id, r.pname, NEW.location_id, -r.used,
                'Consumo por pedido #' || NEW.number, NEW.id, v_uid, COALESCE(v_email,''));
    END LOOP;

    NEW.inventory_applied := true;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_inventory_on_complete ON public.orders;
CREATE TRIGGER trg_apply_inventory_on_complete
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.apply_inventory_on_complete();

-- ============================================================
-- Verificación de stock para un carrito (advertencia previa)
-- items = jsonb array: [{ "name": "...", "qty": 2 }, ...]
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_stock_for_order(
  p_location_id uuid, p_items jsonb
)
RETURNS TABLE (product_id uuid, product_name text, needed numeric, available numeric)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  WITH cart AS (
    SELECT (e->>'name') AS name, COALESCE((e->>'qty')::numeric, 0) AS qty
    FROM jsonb_array_elements(p_items) e
  ),
  needs AS (
    SELECT ri.product_id, SUM(ri.qty * c.qty) AS needed
    FROM cart c
    JOIN public.recipe_items ri ON ri.item_name = c.name
    GROUP BY ri.product_id
  )
  SELECT n.product_id, p.name, n.needed, COALESCE(bs.qty, 0) AS available
  FROM needs n
  JOIN public.inv_products p ON p.id = n.product_id
  LEFT JOIN public.inv_branch_stock bs ON bs.product_id = n.product_id AND bs.location_id = p_location_id
  WHERE COALESCE(bs.qty, 0) < n.needed;
$$;

GRANT EXECUTE ON FUNCTION public.check_stock_for_order(uuid, jsonb) TO anon, authenticated;
