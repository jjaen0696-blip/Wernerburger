/*
# Soporte de retiro en local y delivery

## Contexto
Al finalizar el pedido el cliente ahora elige "Retiro en local" o "Delivery".
Si elige delivery, comparte su ubicación actual (lat/lng) y su línea de contacto
para que la cocina pueda coordinar la entrega.

## Columnas nuevas en `orders`
- `order_type` (text): 'pickup' (retiro en local) o 'delivery'. Default 'pickup'.
- `customer_phone` (text): línea de contacto del cliente (se usa en delivery).
- `delivery_address` (text): dirección o referencia escrita (opcional).
- `delivery_lat`, `delivery_lng` (numeric): ubicación actual compartida por el cliente.

## Notas
- Los pedidos existentes quedan como 'pickup'.
- No cambia RLS: el cliente anónimo sigue pudiendo crear pedidos.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'order_type'
  ) THEN
    ALTER TABLE orders ADD COLUMN order_type text NOT NULL DEFAULT 'pickup'
      CHECK (order_type IN ('pickup', 'delivery'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'customer_phone'
  ) THEN
    ALTER TABLE orders ADD COLUMN customer_phone text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'delivery_address'
  ) THEN
    ALTER TABLE orders ADD COLUMN delivery_address text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'delivery_lat'
  ) THEN
    ALTER TABLE orders ADD COLUMN delivery_lat numeric(10, 7);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'delivery_lng'
  ) THEN
    ALTER TABLE orders ADD COLUMN delivery_lng numeric(10, 7);
  END IF;
END $$;

-- Refrescar la caché de esquema de PostgREST para exponer las columnas nuevas de inmediato.
NOTIFY pgrst, 'reload schema';
