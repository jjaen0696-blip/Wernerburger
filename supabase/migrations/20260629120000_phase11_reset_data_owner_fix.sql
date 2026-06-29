/*
# Fase 11 — Corrige el reinicio de datos para el PROPIETARIO

Problema: `public.inv_reset_data` validaba al propietario con
`auth.jwt() ->> 'email'`. Ese claim no siempre llega con el valor esperado, por
lo que ni siquiera el propietario (baex10@icloud.com) podía borrar: la función
lanzaba "Solo el propietario puede reiniciar datos".

Solución: validar usando exactamente la MISMA fuente que la interfaz para
mostrar/ocultar la sección "Reiniciar datos": el correo en `public.profiles`
buscado por `auth.uid()` (normalizado con lower+trim). Así, si el panel le
muestra la opción al propietario, la función también lo autoriza.

La opción sigue siendo EXCLUSIVA del propietario; ningún otro admin puede borrar.
Idempotente: sólo redefine la función.
*/

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
  v_owner_email constant text := 'baex10@icloud.com';
  v_email      text;
  v_orders     integer := 0;
  v_purchases  integer := 0;
  v_movements  integer := 0;
  v_products   integer := 0;
  v_branch     integer := 0;
BEGIN
  -- Solo el PROPIETARIO puede reiniciar datos. Se valida con el correo del
  -- perfil (misma fuente que usa el panel para mostrar la sección), evitando
  -- depender de los claims del JWT que pueden variar entre sesiones.
  SELECT lower(trim(email)) INTO v_email
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_email IS DISTINCT FROM v_owner_email THEN
    RAISE EXCEPTION 'Solo el propietario puede reiniciar datos';
  END IF;

  IF p_orders THEN
    DELETE FROM public.orders;               -- order_items cae en cascada
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
    'orders',           v_orders,
    'purchases',        v_purchases,
    'movements',        v_movements,
    'products_reset',   v_products,
    'branch_stock_reset', v_branch
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.inv_reset_data(boolean, boolean, boolean, boolean) TO authenticated;

NOTIFY pgrst, 'reload schema';
