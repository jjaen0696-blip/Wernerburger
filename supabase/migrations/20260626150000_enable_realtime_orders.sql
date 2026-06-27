/*
# Habilitar Realtime en orders y order_items

## Contexto
El panel de cocina y la pantalla de seguimiento del cliente se suscriben a cambios
en tiempo real (postgres_changes) sobre `orders` y `order_items`. Para que esos
eventos se emitan, las tablas deben pertenecer a la publicación `supabase_realtime`.

## Cambios
- Se agregan `public.orders` y `public.order_items` a la publicación `supabase_realtime`.
- Idempotente: solo agrega la tabla si aún no está en la publicación.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'order_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
  END IF;
END $$;
