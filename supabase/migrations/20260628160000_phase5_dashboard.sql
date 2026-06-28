/*
# Fase 5 — Funciones de Dashboard y Alertas (en tiempo real)

Funciones SECURITY DEFINER que respetan el rol:
- Admin: vista global (p_location = NULL) o de una sucursal concreta.
- Encargado: SIEMPRE acotado a su propia sucursal (ignora el parámetro).

- inv_dashboard(location)          -> jsonb con KPIs (valor, bajos, agotados, consumo día/semana/mes, etc.)
- inv_top_consumed(location,d,n)   -> productos más consumidos
- inv_consumption_series(location,d)-> consumo por día (para la gráfica)
- inv_alerts(location)             -> alertas de stock bajo/agotado (central + sucursales)

Aditivo: solo crea funciones.
*/

CREATE OR REPLACE FUNCTION public.inv_dashboard(p_location uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $$
DECLARE
  v_loc uuid; v_is_admin boolean;
  v_products int; v_central_value numeric; v_branch_value numeric;
  v_low int; v_out int;
  v_c_today numeric; v_c_week numeric; v_c_month numeric;
  v_dist_week int; v_trans_week int; v_purch_week int;
BEGIN
  v_is_admin := public.is_admin();
  IF v_is_admin THEN v_loc := p_location; ELSE v_loc := public.current_location_id(); END IF;

  SELECT count(*) INTO v_products FROM public.inv_products WHERE is_active;

  IF v_is_admin THEN
    SELECT COALESCE(sum(central_qty*avg_cost),0) INTO v_central_value FROM public.inv_products;
  ELSE
    v_central_value := 0;
  END IF;

  SELECT COALESCE(sum(bs.qty*p.avg_cost),0) INTO v_branch_value
  FROM public.inv_branch_stock bs JOIN public.inv_products p ON p.id=bs.product_id
  WHERE (v_loc IS NULL OR bs.location_id=v_loc);

  IF v_loc IS NULL AND v_is_admin THEN
    SELECT count(*) FILTER (WHERE central_qty<=0),
           count(*) FILTER (WHERE central_qty>0 AND central_qty<=min_stock)
      INTO v_out, v_low FROM public.inv_products WHERE is_active;
  ELSE
    SELECT count(*) FILTER (WHERE bs.qty<=0),
           count(*) FILTER (WHERE bs.qty>0 AND bs.qty<=bs.min_stock)
      INTO v_out, v_low FROM public.inv_branch_stock bs WHERE (v_loc IS NULL OR bs.location_id=v_loc);
  END IF;

  SELECT COALESCE(sum(-qty),0) INTO v_c_today FROM public.inv_movements
    WHERE type='consumo' AND created_at::date=current_date AND (v_loc IS NULL OR location_id=v_loc);
  SELECT COALESCE(sum(-qty),0) INTO v_c_week FROM public.inv_movements
    WHERE type='consumo' AND created_at >= now()-interval '7 days' AND (v_loc IS NULL OR location_id=v_loc);
  SELECT COALESCE(sum(-qty),0) INTO v_c_month FROM public.inv_movements
    WHERE type='consumo' AND created_at >= now()-interval '30 days' AND (v_loc IS NULL OR location_id=v_loc);

  SELECT count(*) INTO v_dist_week FROM public.inv_movements WHERE type='distribucion' AND created_at >= now()-interval '7 days' AND (v_loc IS NULL OR to_location_id=v_loc);
  SELECT count(*) INTO v_trans_week FROM public.inv_movements WHERE type='transferencia' AND created_at >= now()-interval '7 days' AND (v_loc IS NULL OR from_location_id=v_loc OR to_location_id=v_loc);
  SELECT count(*) INTO v_purch_week FROM public.inv_movements WHERE type='compra' AND created_at >= now()-interval '7 days';

  RETURN jsonb_build_object(
    'is_admin', v_is_admin,
    'products', v_products,
    'central_value', round(v_central_value,2),
    'branch_value', round(v_branch_value,2),
    'total_value', round(v_central_value + v_branch_value,2),
    'low', v_low, 'out', v_out,
    'consumo_today', v_c_today, 'consumo_week', v_c_week, 'consumo_month', v_c_month,
    'dist_week', v_dist_week, 'trans_week', v_trans_week, 'purch_week', v_purch_week
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.inv_top_consumed(p_location uuid DEFAULT NULL, p_days int DEFAULT 30, p_limit int DEFAULT 8)
RETURNS TABLE(product_name text, total numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $$
DECLARE v_loc uuid;
BEGIN
  IF public.is_admin() THEN v_loc := p_location; ELSE v_loc := public.current_location_id(); END IF;
  RETURN QUERY
    SELECT m.product_name, sum(-m.qty)::numeric AS total
    FROM public.inv_movements m
    WHERE m.type='consumo' AND m.created_at >= now() - (p_days || ' days')::interval
      AND (v_loc IS NULL OR m.location_id=v_loc)
    GROUP BY m.product_name
    ORDER BY total DESC
    LIMIT GREATEST(p_limit, 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.inv_consumption_series(p_location uuid DEFAULT NULL, p_days int DEFAULT 14)
RETURNS TABLE(day date, total numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $$
DECLARE v_loc uuid;
BEGIN
  IF public.is_admin() THEN v_loc := p_location; ELSE v_loc := public.current_location_id(); END IF;
  RETURN QUERY
    SELECT d::date AS day, COALESCE(sum(-m.qty),0)::numeric AS total
    FROM generate_series(current_date - (GREATEST(p_days,1)-1), current_date, interval '1 day') d
    LEFT JOIN public.inv_movements m
      ON m.type='consumo' AND m.created_at::date = d::date AND (v_loc IS NULL OR m.location_id=v_loc)
    GROUP BY d
    ORDER BY d;
END;
$$;

CREATE OR REPLACE FUNCTION public.inv_alerts(p_location uuid DEFAULT NULL)
RETURNS TABLE(scope text, location_name text, product_name text, qty numeric, min_stock numeric, state text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $$
DECLARE v_loc uuid; v_is_admin boolean;
BEGIN
  v_is_admin := public.is_admin();
  IF v_is_admin THEN v_loc := p_location; ELSE v_loc := public.current_location_id(); END IF;
  RETURN QUERY
    SELECT 'central'::text, 'Inventario central'::text, p.name, p.central_qty, p.min_stock,
           CASE WHEN p.central_qty<=0 THEN 'agotado' ELSE 'bajo' END
    FROM public.inv_products p
    WHERE v_is_admin AND v_loc IS NULL AND p.is_active AND p.central_qty <= p.min_stock AND (p.min_stock>0 OR p.central_qty<=0)
    UNION ALL
    SELECT 'sucursal'::text, l.name, pr.name, bs.qty, bs.min_stock,
           CASE WHEN bs.qty<=0 THEN 'agotado' ELSE 'bajo' END
    FROM public.inv_branch_stock bs
    JOIN public.inv_products pr ON pr.id=bs.product_id
    JOIN public.locations l ON l.id=bs.location_id
    WHERE (v_loc IS NULL OR bs.location_id=v_loc) AND bs.qty <= bs.min_stock AND (bs.min_stock>0 OR bs.qty<=0)
    ORDER BY 6, 3;
END;
$$;

GRANT EXECUTE ON FUNCTION public.inv_dashboard(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.inv_top_consumed(uuid, int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.inv_consumption_series(uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.inv_alerts(uuid) TO authenticated;
