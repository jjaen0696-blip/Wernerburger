/*
# Estado "en camino" para pedidos de delivery

## Contexto
Los pedidos de delivery necesitan un paso extra entre "listo" y "entregado":
cuando la cocina despacha el pedido y se le asigna el repartidor, el cliente
debe poder ver que su pedido va "en camino".

## Cambios
- Se amplía el CHECK de `orders.status` para permitir el valor 'en_camino'.
- Flujo pickup:   pending -> preparing -> ready -> completed
- Flujo delivery: pending -> preparing -> ready -> en_camino -> completed
*/

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'preparing', 'ready', 'en_camino', 'completed', 'cancelled'));

NOTIFY pgrst, 'reload schema';
