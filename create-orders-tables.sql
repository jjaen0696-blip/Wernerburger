-- Crear tabla de órdenes
CREATE TABLE IF NOT EXISTS public.orders (
  id BIGSERIAL PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL DEFAULT ('ORD-' || to_char(now(), 'YYYYMMDDHH24MISS')),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT,
  delivery_type TEXT NOT NULL CHECK (delivery_type IN ('local', 'delivery')) DEFAULT 'local',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('efectivo', 'yappy', 'tarjeta')) DEFAULT 'efectivo',
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'preparing', 'ready', 'assigned', 'delivering', 'completed', 'cancelled')) DEFAULT 'pending',
  total_amount DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Crear tabla de items de órdenes
CREATE TABLE IF NOT EXISTS public.order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_id TEXT,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_orders_branch_id ON public.orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_to ON public.orders(assigned_to);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_type ON public.orders(delivery_type);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar Realtime en las tablas
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;

-- Crear vista para órdenes con detalles
CREATE OR REPLACE VIEW public.orders_with_items AS
SELECT 
  o.id,
  o.order_number,
  o.branch_id,
  o.customer_name,
  o.customer_phone,
  o.customer_address,
  o.delivery_type,
  o.payment_method,
  o.status,
  o.total_amount,
  o.notes,
  o.assigned_to,
  o.created_at,
  o.updated_at,
  o.completed_at,
  json_agg(
    json_build_object(
      'id', oi.id,
      'product_name', oi.product_name,
      'product_id', oi.product_id,
      'quantity', oi.quantity,
      'unit_price', oi.unit_price,
      'subtotal', oi.subtotal,
      'notes', oi.notes
    )
  ) as items
FROM public.orders o
LEFT JOIN public.order_items oi ON o.id = oi.order_id
GROUP BY o.id;
