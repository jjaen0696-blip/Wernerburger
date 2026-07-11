-- Script para insertar órdenes de prueba
-- Ejecuta esto DESPUÉS de haber ejecutado setup-orders-db.sql

-- Obtener IDs de las sucursales
SELECT id, name FROM public.branches LIMIT 3;

-- Insertar orden de prueba 1 (COCINA - Local)
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
) RETURNING id, order_number;

-- Insertar orden de prueba 2 (DELIVERY)
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
) RETURNING id, order_number;

-- Insertar orden de prueba 3 (EN PREPARACIÓN)
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
) RETURNING id, order_number;

-- Insertar items para la primera orden
INSERT INTO public.order_items (
  order_id, product_name, product_id, quantity, unit_price, subtotal, notes
) VALUES
  ((SELECT MAX(id) FROM public.orders LIMIT 1 OFFSET 2), 'Hamburguesa Premium', 'burger-001', 1, 25.00, 25.00, 'Sin cebolla'),
  ((SELECT MAX(id) FROM public.orders LIMIT 1 OFFSET 2), 'Papas Fritas', 'fries-001', 1, 5.50, 5.50, NULL),
  ((SELECT MAX(id) FROM public.orders LIMIT 1 OFFSET 2), 'Gaseosa 1L', 'drink-001', 1, 3.50, 3.50, NULL);

-- Insertar items para la segunda orden
INSERT INTO public.order_items (
  order_id, product_name, product_id, quantity, unit_price, subtotal, notes
) VALUES
  ((SELECT MAX(id) FROM public.orders LIMIT 1 OFFSET 1), 'Hot Dog Premium', 'hotdog-001', 2, 18.00, 36.00, 'Extra picante'),
  ((SELECT MAX(id) FROM public.orders LIMIT 1 OFFSET 1), 'Gaseosa 1L', 'drink-001', 1, 3.50, 3.50, NULL),
  ((SELECT MAX(id) FROM public.orders LIMIT 1 OFFSET 1), 'Arepa Rellena', 'arepa-001', 1, 10.00, 10.00, NULL),
  ((SELECT MAX(id) FROM public.orders LIMIT 1 OFFSET 1), 'Papas Picantes', 'fries-spicy', 1, 6.75, 6.75, NULL);

-- Insertar items para la tercera orden
INSERT INTO public.order_items (
  order_id, product_name, product_id, quantity, unit_price, subtotal, notes
) VALUES
  ((SELECT MAX(id) FROM public.orders), 'Salchipapas Especiales', 'salchi-001', 1, 22.00, 22.00, NULL),
  ((SELECT MAX(id) FROM public.orders), 'Sándwich de Pollo', 'sandwich-001', 1, 12.00, 12.00, NULL),
  ((SELECT MAX(id) FROM public.orders), 'Agua Mineral', 'water-001', 1, 2.00, 2.00, NULL);

-- Ver todas las órdenes creadas
SELECT * FROM public.orders_with_items ORDER BY created_at DESC;
