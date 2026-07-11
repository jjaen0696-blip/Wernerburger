-- Migración: añadir más tablas a publicación supabase_realtime y crear vista orders_with_items
-- Fecha: 2026-07-11

DO $$
BEGIN
  -- Añadir orders
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr
    JOIN pg_class c ON pr.prrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    JOIN pg_publication p ON pr.prpubid = p.oid
    WHERE p.pubname = 'supabase_realtime' AND n.nspname='public' AND c.relname='orders'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.orders';
  END IF;

  -- Añadir order_items
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr
    JOIN pg_class c ON pr.prrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    JOIN pg_publication p ON pr.prpubid = p.oid
    WHERE p.pubname = 'supabase_realtime' AND n.nspname='public' AND c.relname='order_items'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items';
  END IF;

  -- Añadir products
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr
    JOIN pg_class c ON pr.prrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    JOIN pg_publication p ON pr.prpubid = p.oid
    WHERE p.pubname = 'supabase_realtime' AND n.nspname='public' AND c.relname='products'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.products';
  END IF;

  -- Añadir categories
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr
    JOIN pg_class c ON pr.prrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    JOIN pg_publication p ON pr.prpubid = p.oid
    WHERE p.pubname = 'supabase_realtime' AND n.nspname='public' AND c.relname='categories'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.categories';
  END IF;

  -- Añadir public.users (tabla custom)
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname='public' AND c.relname='users') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_rel pr
      JOIN pg_class c ON pr.prrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      JOIN pg_publication p ON pr.prpubid = p.oid
      WHERE p.pubname = 'supabase_realtime' AND n.nspname='public' AND c.relname='users'
    ) THEN
      EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.users';
    END IF;
  END IF;
END$$;

-- Vista: orders_with_items (combina order + items en JSON)
CREATE OR REPLACE VIEW public.orders_with_items AS
SELECT
  o.id,
  o.order_number,
  o.branch_id,
  o.customer_name,
  o.customer_phone,
  o.customer_address,
  o.delivery_type,
  o.payment_method,
  o.status,
  o.total_amount,
  o.notes,
  o.assigned_to,
  o.created_at,
  o.updated_at,
  o.completed_at,
  COALESCE(
    (
      SELECT json_agg(row_to_json(oi_sub))
      FROM (
        SELECT id, order_id, product_name, product_id, quantity, unit_price, subtotal, notes, created_at
        FROM public.order_items oi2 WHERE oi2.order_id = o.id
        ORDER BY id
      ) oi_sub
    ), '[]'::json
  ) AS items
FROM public.orders o;

-- Fin
