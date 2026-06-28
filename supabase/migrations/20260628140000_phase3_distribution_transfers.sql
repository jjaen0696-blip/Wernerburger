/*
# Fase 3 — Distribución, Transferencias y Ajustes (RPC atómicas)

Funciones SECURITY DEFINER con bloqueo de fila (FOR UPDATE) para evitar descuentos
duplicados y condiciones de carrera:

- inv_distribute(producto, sucursal_destino, cantidad, notas)
    Central -> Sucursal. Solo admin. Descuenta del central, suma a la sucursal.
- inv_transfer(producto, sucursal_origen, sucursal_destino, cantidad, notas)
    Sucursal -> Sucursal. Admin o encargado de la sucursal de ORIGEN.
- inv_adjust(producto, sucursal|null, nueva_cantidad, motivo)
    Ajuste/corrección. Admin (central o cualquier sucursal) o encargado de su sucursal.
- inv_set_branch_limits(producto, sucursal, min, max)
    Define stock mínimo/máximo por sucursal.

Todas registran su movimiento en inv_movements (historial/auditoría).
Compatibilidad: solo agrega funciones. No toca tablas ni datos.
*/

-- ============================================================
-- Distribución: Central -> Sucursal
-- ============================================================
CREATE OR REPLACE FUNCTION public.inv_distribute(
  p_product_id uuid, p_to_location uuid, p_qty numeric, p_notes text DEFAULT ''
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_central numeric; v_uid uuid; v_email text; v_name text;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Solo el administrador puede distribuir mercancía'; END IF;
  IF p_qty IS NULL OR p_qty <= 0 THEN RAISE EXCEPTION 'La cantidad debe ser mayor a 0'; END IF;
  v_uid := auth.uid();
  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;

  SELECT central_qty, name INTO v_central, v_name FROM public.inv_products WHERE id = p_product_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'El producto no existe'; END IF;
  IF v_central < p_qty THEN RAISE EXCEPTION 'Stock central insuficiente (disponible: %)', v_central; END IF;

  UPDATE public.inv_products SET central_qty = central_qty - p_qty WHERE id = p_product_id;

  INSERT INTO public.inv_branch_stock (product_id, location_id, qty) VALUES (p_product_id, p_to_location, 0)
    ON CONFLICT (product_id, location_id) DO NOTHING;
  UPDATE public.inv_branch_stock SET qty = qty + p_qty WHERE product_id = p_product_id AND location_id = p_to_location;

  INSERT INTO public.inv_movements (type, product_id, product_name, location_id, from_location_id, to_location_id, qty, reason, created_by, created_by_email)
  VALUES ('distribucion', p_product_id, v_name, p_to_location, NULL, p_to_location, p_qty, COALESCE(NULLIF(p_notes,''),'Distribución'), v_uid, COALESCE(v_email,''));
END;
$$;

-- ============================================================
-- Transferencia: Sucursal -> Sucursal
-- ============================================================
CREATE OR REPLACE FUNCTION public.inv_transfer(
  p_product_id uuid, p_from_location uuid, p_to_location uuid, p_qty numeric, p_notes text DEFAULT ''
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_from numeric; v_uid uuid; v_email text; v_name text;
BEGIN
  v_uid := auth.uid();
  IF NOT (public.is_admin() OR public.current_location_id() = p_from_location) THEN
    RAISE EXCEPTION 'No autorizado para transferir desde esa sucursal';
  END IF;
  IF p_qty IS NULL OR p_qty <= 0 THEN RAISE EXCEPTION 'La cantidad debe ser mayor a 0'; END IF;
  IF p_from_location = p_to_location THEN RAISE EXCEPTION 'Las sucursales de origen y destino deben ser distintas'; END IF;
  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  SELECT name INTO v_name FROM public.inv_products WHERE id = p_product_id;
  IF v_name IS NULL THEN RAISE EXCEPTION 'El producto no existe'; END IF;

  -- Garantizar ambas filas y bloquearlas en orden determinista (evita deadlocks).
  INSERT INTO public.inv_branch_stock (product_id, location_id, qty) VALUES (p_product_id, p_from_location, 0) ON CONFLICT (product_id, location_id) DO NOTHING;
  INSERT INTO public.inv_branch_stock (product_id, location_id, qty) VALUES (p_product_id, p_to_location, 0) ON CONFLICT (product_id, location_id) DO NOTHING;
  PERFORM 1 FROM public.inv_branch_stock
    WHERE product_id = p_product_id AND location_id IN (p_from_location, p_to_location)
    ORDER BY location_id FOR UPDATE;

  SELECT qty INTO v_from FROM public.inv_branch_stock WHERE product_id = p_product_id AND location_id = p_from_location;
  IF v_from < p_qty THEN RAISE EXCEPTION 'Stock insuficiente en la sucursal de origen (disponible: %)', v_from; END IF;

  UPDATE public.inv_branch_stock SET qty = qty - p_qty WHERE product_id = p_product_id AND location_id = p_from_location;
  UPDATE public.inv_branch_stock SET qty = qty + p_qty WHERE product_id = p_product_id AND location_id = p_to_location;

  INSERT INTO public.inv_movements (type, product_id, product_name, location_id, from_location_id, to_location_id, qty, reason, created_by, created_by_email)
  VALUES ('transferencia', p_product_id, v_name, p_to_location, p_from_location, p_to_location, p_qty, COALESCE(NULLIF(p_notes,''),'Transferencia'), v_uid, COALESCE(v_email,''));
END;
$$;

-- ============================================================
-- Ajuste / corrección de existencias (central o sucursal)
-- ============================================================
CREATE OR REPLACE FUNCTION public.inv_adjust(
  p_product_id uuid, p_location_id uuid, p_new_qty numeric, p_reason text DEFAULT ''
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_old numeric; v_delta numeric; v_uid uuid; v_email text; v_name text;
BEGIN
  IF p_new_qty IS NULL OR p_new_qty < 0 THEN RAISE EXCEPTION 'La cantidad no puede ser negativa'; END IF;
  v_uid := auth.uid();
  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  SELECT name INTO v_name FROM public.inv_products WHERE id = p_product_id;
  IF v_name IS NULL THEN RAISE EXCEPTION 'El producto no existe'; END IF;

  IF p_location_id IS NULL THEN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Solo el administrador ajusta el inventario central'; END IF;
    SELECT central_qty INTO v_old FROM public.inv_products WHERE id = p_product_id FOR UPDATE;
    v_delta := p_new_qty - v_old;
    UPDATE public.inv_products SET central_qty = p_new_qty WHERE id = p_product_id;
  ELSE
    IF NOT (public.is_admin() OR public.current_location_id() = p_location_id) THEN
      RAISE EXCEPTION 'No autorizado para ajustar el inventario de esa sucursal';
    END IF;
    INSERT INTO public.inv_branch_stock (product_id, location_id, qty) VALUES (p_product_id, p_location_id, 0) ON CONFLICT (product_id, location_id) DO NOTHING;
    SELECT qty INTO v_old FROM public.inv_branch_stock WHERE product_id = p_product_id AND location_id = p_location_id FOR UPDATE;
    v_delta := p_new_qty - v_old;
    UPDATE public.inv_branch_stock SET qty = p_new_qty WHERE product_id = p_product_id AND location_id = p_location_id;
  END IF;

  INSERT INTO public.inv_movements (type, product_id, product_name, location_id, qty, reason, created_by, created_by_email)
  VALUES ('ajuste', p_product_id, v_name, p_location_id, v_delta, COALESCE(NULLIF(p_reason,''),'Ajuste manual'), v_uid, COALESCE(v_email,''));
END;
$$;

-- ============================================================
-- Definir mínimos/máximos por sucursal
-- ============================================================
CREATE OR REPLACE FUNCTION public.inv_set_branch_limits(
  p_product_id uuid, p_location_id uuid, p_min numeric, p_max numeric
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT (public.is_admin() OR public.current_location_id() = p_location_id) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;
  INSERT INTO public.inv_branch_stock (product_id, location_id, qty, min_stock, max_stock)
  VALUES (p_product_id, p_location_id, 0, GREATEST(COALESCE(p_min,0),0), GREATEST(COALESCE(p_max,0),0))
  ON CONFLICT (product_id, location_id)
  DO UPDATE SET min_stock = GREATEST(COALESCE(p_min,0),0), max_stock = GREATEST(COALESCE(p_max,0),0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.inv_distribute(uuid, uuid, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.inv_transfer(uuid, uuid, uuid, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.inv_adjust(uuid, uuid, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.inv_set_branch_limits(uuid, uuid, numeric, numeric) TO authenticated;
