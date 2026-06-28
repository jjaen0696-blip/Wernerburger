/*
# Fase 8 — Ventas manuales en el local (mostrador)

## Objetivo
Registrar las ventas que se hacen presencialmente en el local (no desde la web)
para tener control de TODO lo vendido y que descuente inventario igual que un pedido.

## Qué hace
1. Amplía `orders` (aditivo, sin tocar datos existentes):
   - `channel` text: 'web' (pedidos de la página) | 'local' (ventas de mostrador). Default 'web'.
   - `payment_method` text: '', 'efectivo', 'transferencia', 'tarjeta', 'otro'. Default ''.
   - `sold_by_email` text: correo del usuario que registró la venta (auditoría de caja).
2. RPC `register_manual_sale(...)`: crea la venta de mostrador en una sola operación
   atómica y segura.
   - Seguridad: admin (cualquier sucursal) o encargado SOLO de su propia sucursal.
   - Total calculado en el servidor (no se confía en el cliente).
   - Inserta la orden como 'pending' + sus ítems y luego la pasa a 'completed', de modo
     que se REUTILIZA el trigger `apply_inventory_on_complete` de la Fase 4: descuenta
     los insumos por receta del inventario de esa sucursal y registra el movimiento
     'consumo' en inv_movements (auditoría completa).
   - Ítems libres (menu_item_id NULL y/o sin receta) se registran como venta pero no
     descuentan inventario (no tienen receta asociada): el trigger simplemente los omite.

## Compatibilidad
- Aditivo e idempotente. Los pedidos web existentes quedan con channel='web' por defecto.
- No va a la cocina: la venta nace 'completed', por lo que no aparece en el tablero
  (que solo muestra pending/preparing/ready/en_camino).
*/

-- ============================================================
-- 1) Columnas nuevas en orders
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='channel') THEN
    ALTER TABLE public.orders ADD COLUMN channel text NOT NULL DEFAULT 'web'
      CHECK (channel IN ('web','local'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_method') THEN
    ALTER TABLE public.orders ADD COLUMN payment_method text NOT NULL DEFAULT ''
      CHECK (payment_method IN ('', 'efectivo', 'transferencia', 'tarjeta', 'otro'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='sold_by_email') THEN
    ALTER TABLE public.orders ADD COLUMN sold_by_email text NOT NULL DEFAULT '';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_channel ON public.orders(channel);

-- ============================================================
-- 2) RPC: registrar venta manual de mostrador
--    p_items = jsonb array:
--      [{ "menu_item_id": uuid|null, "name": "...", "quantity": 2, "unit_price": 3500, "notes": "" }, ...]
-- ============================================================
CREATE OR REPLACE FUNCTION public.register_manual_sale(
  p_location_id   uuid,
  p_customer_name text,
  p_payment_method text,
  p_notes         text,
  p_items         jsonb
)
RETURNS TABLE (id uuid, number integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid     uuid := auth.uid();
  v_email   text;
  v_num     integer;
  v_total   numeric(10,2) := 0;
  v_order   uuid;
  r         record;
  v_count   integer := 0;
BEGIN
  -- Autorización: admin (cualquier sucursal) o encargado de su propia sucursal.
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;
  IF p_location_id IS NULL THEN
    RAISE EXCEPTION 'Debes indicar la sucursal de la venta';
  END IF;
  IF NOT (public.is_admin() OR public.current_location_id() = p_location_id) THEN
    RAISE EXCEPTION 'No autorizado para registrar ventas en esta sucursal';
  END IF;

  IF p_payment_method IS NULL OR p_payment_method NOT IN ('', 'efectivo', 'transferencia', 'tarjeta', 'otro') THEN
    RAISE EXCEPTION 'Método de pago inválido';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'La venta no tiene productos';
  END IF;

  SELECT u.email INTO v_email FROM auth.users u WHERE u.id = v_uid;

  -- Total calculado en el servidor a partir de los ítems.
  SELECT COALESCE(SUM(
            COALESCE((e->>'quantity')::numeric, 0) * COALESCE((e->>'unit_price')::numeric, 0)
         ), 0)
    INTO v_total
    FROM jsonb_array_elements(p_items) e;

  -- Número correlativo por sucursal/día (misma función que los pedidos web).
  v_num := public.next_order_number(p_location_id);

  -- 1) Orden en estado 'pending' (todavía sin descontar inventario).
  INSERT INTO public.orders
    (number, status, customer_name, notes, total, location_id, order_type,
     channel, payment_method, sold_by_email, inventory_applied)
  VALUES
    (v_num, 'pending', COALESCE(NULLIF(trim(p_customer_name), ''), 'Venta en local'),
     COALESCE(p_notes, ''), v_total, p_location_id, 'pickup',
     'local', p_payment_method, COALESCE(v_email, ''), false)
  RETURNING orders.id INTO v_order;

  -- 2) Ítems de la venta.
  FOR r IN
    SELECT
      NULLIF(e->>'menu_item_id', '')::uuid AS menu_item_id,
      NULLIF(trim(e->>'name'), '')         AS name,
      COALESCE((e->>'quantity')::integer, 0) AS quantity,
      COALESCE((e->>'unit_price')::numeric, 0) AS unit_price,
      COALESCE(e->>'notes', '')            AS notes
    FROM jsonb_array_elements(p_items) e
  LOOP
    IF r.name IS NULL THEN
      RAISE EXCEPTION 'Cada producto debe tener nombre';
    END IF;
    IF r.quantity <= 0 THEN
      RAISE EXCEPTION 'La cantidad de "%" debe ser mayor a 0', r.name;
    END IF;

    INSERT INTO public.order_items (order_id, menu_item_id, name, quantity, unit_price, notes)
    VALUES (v_order, r.menu_item_id, r.name, r.quantity, r.unit_price, r.notes);
    v_count := v_count + 1;
  END LOOP;

  IF v_count = 0 THEN
    RAISE EXCEPTION 'La venta no tiene productos';
  END IF;

  -- 3) Pasar a 'completed' → dispara apply_inventory_on_complete (descuenta stock + movimiento).
  UPDATE public.orders SET status = 'completed' WHERE orders.id = v_order;

  RETURN QUERY SELECT v_order, v_num;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_manual_sale(uuid, text, text, text, jsonb) TO authenticated;

NOTIFY pgrst, 'reload schema';
