/*
# Fase 9 — Reporte de ventas / ingresos (dinero vendido)

## Objetivo
Ver cuánto se ha VENDIDO (en dinero) global y por sucursal, sumando TODO:
pedidos de la web (channel='web') + ventas de mostrador (channel='local').
Cuenta solo pedidos en estado 'completed' (venta confirmada).

## RPC
inv_sales_report(p_location, p_from, p_to) -> jsonb
  - total / count        : ingresos y N° de ventas del alcance
  - web_total / local_total (+ sus counts) : desglose por canal
  - by_payment[]         : total por método de pago
  - by_branch[]          : total por cada sucursal (solo admin global)
  - is_admin             : para que la UI sepa qué mostrar

## Seguridad
- Admin: ve todo (global) o una sucursal puntual si pasa p_location.
- Encargado: SIEMPRE forzado a su propia sucursal (ignora p_location).
Aditivo, no toca nada existente.
*/

CREATE OR REPLACE FUNCTION public.inv_sales_report(
  p_location uuid DEFAULT NULL,
  p_from timestamptz DEFAULT (now() - interval '30 days'),
  p_to timestamptz DEFAULT now()
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $$
DECLARE
  v_loc        uuid;
  v_is_admin   boolean;
  v_total      numeric; v_count int;
  v_web_total  numeric; v_web_count int;
  v_local_total numeric; v_local_count int;
  v_by_payment jsonb;
  v_by_branch  jsonb;
BEGIN
  v_is_admin := public.is_admin();
  IF v_is_admin THEN v_loc := p_location; ELSE v_loc := public.current_location_id(); END IF;

  -- Totales del alcance (global si v_loc IS NULL y admin; si no, su sucursal)
  SELECT COALESCE(sum(o.total),0), count(*)
    INTO v_total, v_count
    FROM public.orders o
   WHERE o.status = 'completed'
     AND o.created_at BETWEEN p_from AND p_to
     AND (v_loc IS NULL OR o.location_id = v_loc);

  -- Desglose por canal
  SELECT COALESCE(sum(o.total) FILTER (WHERE o.channel = 'web'), 0),
         count(*)              FILTER (WHERE o.channel = 'web'),
         COALESCE(sum(o.total) FILTER (WHERE o.channel = 'local'), 0),
         count(*)              FILTER (WHERE o.channel = 'local')
    INTO v_web_total, v_web_count, v_local_total, v_local_count
    FROM public.orders o
   WHERE o.status = 'completed'
     AND o.created_at BETWEEN p_from AND p_to
     AND (v_loc IS NULL OR o.location_id = v_loc);

  -- Por método de pago (los pedidos web suelen tener payment_method '' -> se etiqueta como 'sin_especificar')
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'method', m.method, 'total', round(m.total,2), 'count', m.count
         ) ORDER BY m.total DESC), '[]'::jsonb)
    INTO v_by_payment
    FROM (
      SELECT CASE WHEN COALESCE(o.payment_method,'') = '' THEN 'sin_especificar' ELSE o.payment_method END AS method,
             sum(o.total) AS total, count(*) AS count
        FROM public.orders o
       WHERE o.status = 'completed'
         AND o.created_at BETWEEN p_from AND p_to
         AND (v_loc IS NULL OR o.location_id = v_loc)
       GROUP BY 1
    ) m;

  -- Por sucursal (solo tiene sentido en vista global de admin)
  IF v_is_admin AND v_loc IS NULL THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
              'location_id', b.location_id,
              'name', b.name,
              'total', round(b.total,2),
              'count', b.count,
              'web_total', round(b.web_total,2),
              'local_total', round(b.local_total,2)
           ) ORDER BY b.total DESC), '[]'::jsonb)
      INTO v_by_branch
      FROM (
        SELECT l.id AS location_id, l.name AS name,
               COALESCE(sum(o.total),0) AS total,
               count(o.id) AS count,
               COALESCE(sum(o.total) FILTER (WHERE o.channel='web'),0) AS web_total,
               COALESCE(sum(o.total) FILTER (WHERE o.channel='local'),0) AS local_total
          FROM public.locations l
          LEFT JOIN public.orders o
            ON o.location_id = l.id
           AND o.status = 'completed'
           AND o.created_at BETWEEN p_from AND p_to
         WHERE l.is_active = true
         GROUP BY l.id, l.name
      ) b;
  ELSE
    v_by_branch := '[]'::jsonb;
  END IF;

  RETURN jsonb_build_object(
    'is_admin', v_is_admin,
    'total', round(v_total,2), 'count', v_count,
    'web_total', round(v_web_total,2), 'web_count', v_web_count,
    'local_total', round(v_local_total,2), 'local_count', v_local_count,
    'by_payment', v_by_payment,
    'by_branch', v_by_branch
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.inv_sales_report(uuid, timestamptz, timestamptz) TO authenticated;

NOTIFY pgrst, 'reload schema';
