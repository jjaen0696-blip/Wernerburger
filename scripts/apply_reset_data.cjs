// Crea/actualiza la RPC public.inv_reset_data (borrado controlado de datos de prueba).
// Uso (PowerShell):
//   $env:PGPASSWORD="tu_password_de_la_DB"; node scripts/apply_reset_data.cjs
const { Client } = require('pg');

const SQL = `
CREATE OR REPLACE FUNCTION public.inv_reset_data(
  p_orders    boolean DEFAULT false,
  p_purchases boolean DEFAULT false,
  p_movements boolean DEFAULT false,
  p_stock     boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_orders     integer := 0;
  v_purchases  integer := 0;
  v_movements  integer := 0;
  v_products   integer := 0;
  v_branch     integer := 0;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo el administrador puede reiniciar datos';
  END IF;

  IF p_orders THEN
    DELETE FROM public.orders;
    GET DIAGNOSTICS v_orders = ROW_COUNT;
  END IF;

  IF p_purchases THEN
    DELETE FROM public.inv_purchases;
    GET DIAGNOSTICS v_purchases = ROW_COUNT;
  END IF;

  IF p_movements THEN
    DELETE FROM public.inv_movements;
    GET DIAGNOSTICS v_movements = ROW_COUNT;
  END IF;

  IF p_stock THEN
    UPDATE public.inv_products
      SET central_qty = 0, avg_cost = 0, last_cost = 0;
    GET DIAGNOSTICS v_products = ROW_COUNT;

    UPDATE public.inv_branch_stock
      SET qty = 0;
    GET DIAGNOSTICS v_branch = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object(
    'orders',             v_orders,
    'purchases',          v_purchases,
    'movements',          v_movements,
    'products_reset',     v_products,
    'branch_stock_reset', v_branch
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.inv_reset_data(boolean, boolean, boolean, boolean) TO authenticated;

NOTIFY pgrst, 'reload schema';
`;

async function main() {
  if (!process.env.PGPASSWORD) {
    console.error('Falta PGPASSWORD. Ejecuta:  $env:PGPASSWORD="tu_password"; node scripts/apply_reset_data.cjs');
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
  console.log('OK: inv_reset_data creada. Ya puedes usar "Reiniciar datos" en el panel.');
  await client.end();
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
