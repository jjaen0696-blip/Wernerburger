-- Script para limpiar y reinsertar órdenes de prueba
-- Ejecuta esto en Supabase SQL Editor

-- LIMPIAR DATOS VIEJOS (conserva tablas, solo borra filas)
DELETE FROM public.order_items;
DELETE FROM public.orders;

-- REINICIAR SECUENCIAS
ALTER SEQUENCE public.orders_id_seq RESTART WITH 1;
ALTER SEQUENCE public.order_items_id_seq RESTART WITH 1;

-- INSERTAR ORDEN 1: Pendiente (Local)
INSERT INTO public.orders (
  branch_id, customer_name, customer_phone, customer_address,
  delivery_type, payment_method, status, total_amount, notes
) VALUES (
  (SELECT id FROM public.branches LIMIT 1),
  'Juan Pérez',
  '+507 6123-4567',
  NULL,
  'local',
  'efectivo',
  'pending',
  45.50,
  'Sin cebolla'
) RETURNING id as orden_1_id;

-- INSERTAR ORDEN 2: Lista para Delivery
INSERT INTO public.orders (
  branch_id, customer_name, customer_phone, customer_address,
  delivery_type, payment_method, status, total_amount, notes
) VALUES (
  (SELECT id FROM public.branches LIMIT 1),
  'María González',
  '+507 6987-6543',
  'Calle Principal 123, Apt 4B',
  'delivery',
  'yappy',
  'ready',
  62.75,
  'Extra picante'
) RETURNING id as orden_2_id;

-- INSERTAR ORDEN 3: En preparación (Local)
INSERT INTO public.orders (
  branch_id, customer_name, customer_phone, customer_address,
  delivery_type, payment_method, status, total_amount, notes
) VALUES (
  (SELECT id FROM public.branches LIMIT 1),
  'Carlos López',
  '+507 6555-8888',
  NULL,
  'local',
  'tarjeta',
  'preparing',
  38.00,
  NULL
) RETURNING id as orden_3_id;

-- AGREGAR ITEMS A ORDEN 1
INSERT INTO public.order_items (order_id, product_name, product_id, quantity, unit_price, subtotal, notes) 
VALUES 
  (1, 'Hamburguesa Premium', 'burger-001', 1, 25.00, 25.00, 'Sin cebolla'),
  (1, 'Papas Fritas', 'fries-001', 1, 5.50, 5.50, NULL),
  (1, 'Gaseosa 1L', 'drink-001', 1, 3.50, 3.50, NULL);

-- AGREGAR ITEMS A ORDEN 2
INSERT INTO public.order_items (order_id, product_name, product_id, quantity, unit_price, subtotal, notes) 
VALUES 
  (2, 'Hot Dog Premium', 'hotdog-001', 2, 18.00, 36.00, 'Extra picante'),
  (2, 'Gaseosa 1L', 'drink-001', 1, 3.50, 3.50, NULL),
  (2, 'Arepa Rellena', 'arepa-001', 1, 10.00, 10.00, NULL),
  (2, 'Papas Picantes', 'fries-spicy', 1, 6.75, 6.75, NULL);

-- AGREGAR ITEMS A ORDEN 3
INSERT INTO public.order_items (order_id, product_name, product_id, quantity, unit_price, subtotal, notes) 
VALUES 
  (3, 'Salchipapas Especiales', 'salchi-001', 1, 22.00, 22.00, NULL),
  (3, 'Sándwich de Pollo', 'sandwich-001', 1, 12.00, 12.00, NULL),
  (3, 'Agua Mineral', 'water-001', 1, 2.00, 2.00, NULL);

-- VERIFICAR DATOS INSERTADOS
SELECT 
  o.id,
  o.order_number,
  o.customer_name,
  o.status,
  o.delivery_type,
  o.total_amount,
  COUNT(oi.id) as item_count
FROM public.orders o
LEFT JOIN public.order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.order_number, o.customer_name, o.status, o.delivery_type, o.total_amount
ORDER BY o.id;
