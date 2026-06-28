/*
# Fase 6 — Funciones de Reportes

- inv_report(location, from, to)            -> jsonb resumen: compras, distribuciones, transferencias,
    consumo, ajustes (neto), pérdidas, valor de inventario actual.
- inv_product_consumption(location, from, to) -> consumo por producto en el rango (para más/menos vendidos).

Respetan el rol (admin global o por sucursal; encargado siempre su sucursal). Aditivo.
*/

CREATE OR REPLACE FUNCTION public.inv_report(
  p_location uuid DEFAULT NULL,
  p_from timestamptz DEFAULT (now() - interval '30 days'),
  p_to timestamptz DEFAULT now()
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $$
DECLARE
  v_loc uuid; v_is_admin boolean;
  v_compras numeric; v_compras_n int;
  v_dist numeric; v_dist_n int;
  v_trans numeric; v_trans_n int;
  v_consumo numeric; v_consumo_n int;
  v_ajuste_net numeric; v_perdidas numeric; v_ajuste_n int;
  v_central_value numeric; v_branch_value numeric;
BEGIN
  v_is_admin := public.is_admin();
  IF v_is_admin THEN v_loc := p_location; ELSE v_loc := public.current_location_id(); END IF;

  -- Compras (solo central / global admin)
  IF v_is_admin AND v_loc IS NULL THEN
    SELECT COALESCE(sum(qty),0), count(*) INTO v_compras, v_compras_n
    FROM public.inv_movements WHERE type='compra' AND created_at BETWEEN p_from AND p_to;
  ELSE
    v_compras := 0; v_compras_n := 0;
  END IF;

  SELECT COALESCE(sum(qty),0), count(*) INTO v_dist, v_dist_n
  FROM public.inv_movements WHERE type='distribucion' AND created_at BETWEEN p_from AND p_to AND (v_loc IS NULL OR to_location_id=v_loc);

  SELECT COALESCE(sum(qty),0), count(*) INTO v_trans, v_trans_n
  FROM public.inv_movements WHERE type='transferencia' AND created_at BETWEEN p_from AND p_to AND (v_loc IS NULL OR from_location_id=v_loc OR to_location_id=v_loc);

  SELECT COALESCE(sum(-qty),0), count(*) INTO v_consumo, v_consumo_n
  FROM public.inv_movements WHERE type='consumo' AND created_at BETWEEN p_from AND p_to AND (v_loc IS NULL OR location_id=v_loc);

  SELECT COALESCE(sum(qty),0), count(*) INTO v_ajuste_net, v_ajuste_n
  FROM public.inv_movements WHERE type='ajuste' AND created_at BETWEEN p_from AND p_to AND (v_loc IS NULL OR location_id=v_loc);

  SELECT COALESCE(sum(-qty),0) INTO v_perdidas
  FROM public.inv_movements WHERE type='ajuste' AND qty < 0 AND created_at BETWEEN p_from AND p_to AND (v_loc IS NULL OR location_id=v_loc);

  IF v_is_admin THEN
    SELECT COALESCE(sum(central_qty*avg_cost),0) INTO v_central_value FROM public.inv_products;
  ELSE v_central_value := 0; END IF;
  SELECT COALESCE(sum(bs.qty*p.avg_cost),0) INTO v_branch_value
  FROM public.inv_branch_stock bs JOIN public.inv_products p ON p.id=bs.product_id WHERE (v_loc IS NULL OR bs.location_id=v_loc);

  RETURN jsonb_build_object(
    'compras', v_compras, 'compras_n', v_compras_n,
    'distribuciones', v_dist, 'distribuciones_n', v_dist_n,
    'transferencias', v_trans, 'transferencias_n', v_trans_n,
    'consumo', v_consumo, 'consumo_n', v_consumo_n,
    'ajustes_net', v_ajuste_net, 'ajustes_n', v_ajuste_n,
    'perdidas', v_perdidas,
    'valor_central', round(v_central_value,2),
    'valor_sucursal', round(v_branch_value,2),
    'valor_total', round(v_central_value+v_branch_value,2)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.inv_product_consumption(
  p_location uuid DEFAULT NULL,
  p_from timestamptz DEFAULT (now() - interval '30 days'),
  p_to timestamptz DEFAULT now()
)
RETURNS TABLE(product_name text, total numeric, movements int)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $$
DECLARE v_loc uuid;
BEGIN
  IF public.is_admin() THEN v_loc := p_location; ELSE v_loc := public.current_location_id(); END IF;
  RETURN QUERY
    SELECT m.product_name, sum(-m.qty)::numeric AS total, count(*)::int
    FROM public.inv_movements m
    WHERE m.type='consumo' AND m.created_at BETWEEN p_from AND p_to AND (v_loc IS NULL OR m.location_id=v_loc)
    GROUP BY m.product_name
    ORDER BY total DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.inv_report(uuid, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.inv_product_consumption(uuid, timestamptz, timestamptz) TO authenticated;
