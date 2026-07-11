-- Script para verificar que todo está funcionando correctamente
-- Ejecuta esto en Supabase SQL Editor

-- 1. Verificar órdenes por estado
SELECT 
  status,
  COUNT(*) as cantidad,
  STRING_AGG(customer_name, ', ') as clientes
FROM public.orders
GROUP BY status
ORDER BY status;

-- 2. Verificar órdenes por tipo de entrega
SELECT 
  delivery_type,
  COUNT(*) as cantidad,
  STRING_AGG(order_number, ', ') as ordenes
FROM public.orders
GROUP BY delivery_type;

-- 3. Ver todas las órdenes con items (para Cocina)
SELECT * FROM public.orders_with_items 
WHERE delivery_type = 'local'
ORDER BY created_at DESC;

-- 4. Ver todas las órdenes con items (para Delivery)
SELECT * FROM public.orders_with_items 
WHERE delivery_type = 'delivery'
ORDER BY created_at DESC;

-- 5. Estadísticas por sucursal
SELECT 
  b.name as sucursal,
  COUNT(o.id) as total_ordenes,
  COUNT(CASE WHEN o.delivery_type = 'local' THEN 1 END) as local,
  COUNT(CASE WHEN o.delivery_type = 'delivery' THEN 1 END) as delivery,
  SUM(o.total_amount) as ingresos
FROM public.orders o
JOIN public.branches b ON o.branch_id = b.id
GROUP BY b.name;

-- 6. Verificar tabla de usuarios y roles
SELECT id, username, email, role, branch_id FROM public.users ORDER BY username;

-- 7. Ver items de cada orden
SELECT 
  o.order_number,
  o.customer_name,
  STRING_AGG(oi.product_name || ' x' || oi.quantity, ', ') as items,
  SUM(oi.subtotal) as total
FROM public.orders o
LEFT JOIN public.order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.order_number, o.customer_name
ORDER BY o.id;
