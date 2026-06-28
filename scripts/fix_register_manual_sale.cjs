// Aplica el fix de ambigüedad de "id" en register_manual_sale.
// Uso (PowerShell):
//   $env:PGPASSWORD="tu_password_de_la_DB"; node scripts/fix_register_manual_sale.cjs
const { Client } = require('pg');

const SQL = `
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

  SELECT COALESCE(SUM(
            COALESCE((e->>'quantity')::numeric, 0) * COALESCE((e->>'unit_price')::numeric, 0)
         ), 0)
    INTO v_total
    FROM jsonb_array_elements(p_items) e;

  v_num := public.next_order_number(p_location_id);

  INSERT INTO public.orders
    (number, status, customer_name, notes, total, location_id, order_type,
     channel, payment_method, sold_by_email, inventory_applied)
  VALUES
    (v_num, 'pending', COALESCE(NULLIF(trim(p_customer_name), ''), 'Venta en local'),
     COALESCE(p_notes, ''), v_total, p_location_id, 'pickup',
     'local', p_payment_method, COALESCE(v_email, ''), false)
  RETURNING orders.id INTO v_order;

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

  UPDATE public.orders SET status = 'completed' WHERE orders.id = v_order;

  RETURN QUERY SELECT v_order, v_num;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_manual_sale(uuid, text, text, text, jsonb) TO authenticated;

NOTIFY pgrst, 'reload schema';
`;

async function main() {
  if (!process.env.PGPASSWORD) {
    console.error('Falta PGPASSWORD. Ejecuta:  $env:PGPASSWORD="tu_password"; node scripts/fix_register_manual_sale.cjs');
    process.exit(1);
  }
  const client = new Client({
    host: 'aws-1-us-east-1.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres.uhodpfcajtnrmofabyyt',
    password: process.env.PGPASSWORD,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  await client.query(SQL);
  console.log('OK: register_manual_sale corregida (id ya no es ambiguo).');
  await client.end();
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
