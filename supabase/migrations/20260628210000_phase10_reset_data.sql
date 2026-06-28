/*
# Fase 10 — Reinicio de datos de prueba

Permite borrar de forma controlada los datos TRANSACCIONALES generados durante
las pruebas, sin tocar la configuración (sucursales, usuarios, catálogo de
productos, recetas, proveedores ni el menú).

## RPC: public.inv_reset_data(p_orders, p_purchases, p_movements, p_stock)
Solo ADMIN (SECURITY DEFINER). Cada bandera activa borra/reinicia un grupo:
- p_orders     : pedidos y ventas (orders → order_items en cascada). Esto elimina
                 el "saldo recibido" de las pruebas.
- p_purchases  : compras al inventario central (inv_purchases).
- p_movements  : historial de movimientos de inventario (inv_movements).
- p_stock      : pone TODAS las existencias en cero (central y por sucursal) y
                 reinicia costos promedio/último.

Devuelve un jsonb con el conteo de lo eliminado/afectado.

## Seguridad y compatibilidad
- Solo admin. No borra catálogo ni configuración. Idempotente.
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
  v_orders     integer := 0;
  v_purchases  integer := 0;
  v_movements  integer := 0;
  v_products   integer := 0;
  v_branch     integer := 0;
BEGIN
  -- Solo el PROPIETARIO (baex10@icloud.com) puede reiniciar datos, aunque otros
  -- usuarios tengan rol de administrador. Se valida con el email del JWT.
  IF lower(coalesce(auth.jwt() ->> 'email', '')) <> 'baex10@icloud.com' THEN
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
