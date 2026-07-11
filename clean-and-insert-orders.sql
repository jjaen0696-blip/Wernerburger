-- Script para limpiar y reinsertar órdenes con order_number único
-- Ejecuta esto en Supabase SQL Editor

-- PASO 1: Eliminar constraint de unique si existe
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_number_key;

-- PASO 2: Limpiar datos viejos
DELETE FROM public.order_items;
DELETE FROM public.orders;

-- PASO 3: Reiniciar secuencias
ALTER SEQUENCE IF EXISTS public.orders_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.order_items_id_seq RESTART WITH 1;

-- PASO 4: Crear secuencia para order_number
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1000;

-- PASO 5: Insertar orden 1 con order_number único
INSERT INTO public.orders (
  order_number,
  branch_id,
  customer_name,
  customer_phone,
  delivery_type,
  payment_method,
  status,
  total_amount,
  notes
) VALUES (
  'ORD-' || LPAD(nextval('order_number_seq')::text, 6, '0'),
  (SELECT id FROM public.branches LIMIT 1),
  'Juan Pérez',
  '+507 6123-4567',
  'local',
  'efectivo',
  'pending',
  45.50,
  'Sin cebolla'
);

-- PASO 6: Insertar orden 2 con order_number único
INSERT INTO public.orders (
  order_number,
  branch_id,
  customer_name,
  customer_phone,
  customer_address,
  delivery_type,
  payment_method,
  status,
  total_amount,
  notes
) VALUES (
  'ORD-' || LPAD(nextval('order_number_seq')::text, 6, '0'),
  (SELECT id FROM public.branches LIMIT 1),
  'María González',
  '+507 6987-6543',
  'Calle Principal 123, Apt 4B',
  'delivery',
  'yappy',
  'ready',
  62.75,
  'Extra picante'
);

-- PASO 7: Insertar orden 3 con order_number único
INSERT INTO public.orders (
  order_number,
  branch_id,
  customer_name,
  customer_phone,
  delivery_type,
  payment_method,
  status,
  total_amount,
  notes
) VALUES (
  'ORD-' || LPAD(nextval('order_number_seq')::text, 6, '0'),
  (SELECT id FROM public.branches LIMIT 1),
  'Carlos López',
  '+507 6555-8888',
  'local',
  'tarjeta',
  'preparing',
  38.00,
  NULL
);

-- PASO 8: Agregar items a las órdenes
INSERT INTO public.order_items (order_id, product_name, product_id, quantity, unit_price, subtotal, notes) VALUES
  (1, 'Hamburguesa Premium', 'burger-001', 1, 25.00, 25.00, 'Sin cebolla'),
  (1, 'Papas Fritas', 'fries-001', 1, 5.50, 5.50, NULL),
  (1, 'Gaseosa 1L', 'drink-001', 1, 3.50, 3.50, NULL),
  (2, 'Hot Dog Premium', 'hotdog-001', 2, 18.00, 36.00, 'Extra picante'),
  (2, 'Arepa Rellena', 'arepa-001', 1, 10.00, 10.00, NULL),
  (2, 'Papas Picantes', 'fries-spicy', 1, 6.75, 6.75, NULL),
  (2, 'Gaseosa 1L', 'drink-001', 1, 3.50, 3.50, NULL),
  (3, 'Salchipapas Especiales', 'salchi-001', 1, 22.00, 22.00, NULL),
  (3, 'Sándwich de Pollo', 'sandwich-001', 1, 12.00, 12.00, NULL),
  (3, 'Agua Mineral', 'water-001', 1, 2.00, 2.00, NULL);

-- PASO 9: Verificar órdenes creadas
SELECT 
  o.id,
  o.order_number,
  o.customer_name,
  o.status,
  o.delivery_type,
  o.total_amount,
  (SELECT COUNT(*) FROM public.order_items WHERE order_id = o.id) as items_count
FROM public.orders o
ORDER BY o.id;

-- PASO 10: Ver órdenes con items
SELECT * FROM public.orders_with_items ORDER BY created_at DESC;
