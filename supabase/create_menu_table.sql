-- Limpiar tablas existentes si es necesario
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

-- Crear tabla de categorías
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de productos/items del menú
CREATE TABLE public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  image_url TEXT,
  available BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar performance
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_available ON public.products(available);
CREATE INDEX idx_products_display_order ON public.products(display_order);
CREATE INDEX idx_categories_display_order ON public.categories(display_order);

-- Crear función para actualizar updated_at en productos
CREATE OR REPLACE FUNCTION public.update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en productos
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_products_updated_at();

-- Crear función para actualizar updated_at en categorías
CREATE OR REPLACE FUNCTION public.update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en categorías
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_categories_updated_at();

-- Habilitar Realtime en las tablas
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;

-- Insertar categorías por defecto
INSERT INTO public.categories (name, icon, description, display_order) VALUES
  ('Hamburguesas', '🍔', 'Deliciosas hamburguesas artesanales', 0),
  ('Hot Dogs', '🌭', 'Hot dogs tradicionales y especiales', 1),
  ('Arepas', '🫓', 'Arepas rellenas variadas', 2),
  ('Salchipapas', '🍟', 'Salchipapas crujientes', 3),
  ('Pepitos', '🥪', 'Sandwiches especiales', 4),
  ('Extras', '🥤', 'Bebidas y complementos', 5);

-- Insertar productos de ejemplo
INSERT INTO public.products (id, name, description, price, category_id, display_order, available) VALUES
  ('burger-clasica', 'Hamburguesa Clásica', 'Pan, carne 1/4 lb, lechuga, tomate, cebolla', 6.50, (SELECT id FROM public.categories WHERE name = 'Hamburguesas'), 0, true),
  ('burger-queso', 'Hamburguesa Doble Queso', 'Pan, 2 carnes, 2 quesos, lechuga, tomate', 8.00, (SELECT id FROM public.categories WHERE name = 'Hamburguesas'), 1, true),
  ('burger-tocino', 'Hamburguesa Tocino & Queso', 'Pan, carne, tocino crujiente, queso fundido', 7.50, (SELECT id FROM public.categories WHERE name = 'Hamburguesas'), 2, true),
  ('hotdog-clasico', 'Hot Dog Clásico', 'Pan tostado, salchicha, salsas', 3.50, (SELECT id FROM public.categories WHERE name = 'Hot Dogs'), 0, true),
  ('hotdog-especial', 'Hot Dog Especial', 'Pan tostado, salchicha, queso, tocino, cebolla frita', 5.00, (SELECT id FROM public.categories WHERE name = 'Hot Dogs'), 1, true),
  ('arepa-queso', 'Arepa de Queso', 'Arepa caliente rellena de queso derretido', 3.00, (SELECT id FROM public.categories WHERE name = 'Arepas'), 0, true),
  ('arepa-carnes', 'Arepa Carnes Frías', 'Arepa con jamón, queso y salami', 4.00, (SELECT id FROM public.categories WHERE name = 'Arepas'), 1, true),
  ('salchipapa-simple', 'Salchipapa Simple', 'Papas crujientes, salchicha', 4.50, (SELECT id FROM public.categories WHERE name = 'Salchipapas'), 0, true),
  ('salchipapa-doble', 'Salchipapa Doble', 'Papas extra crujientes, 2 salchichas, salsas', 6.00, (SELECT id FROM public.categories WHERE name = 'Salchipapas'), 1, true),
  ('pepito-carne', 'Pepito de Carne', 'Pan tostado, carne molida, salsas', 4.50, (SELECT id FROM public.categories WHERE name = 'Pepitos'), 0, true),
  ('pepito-pollo', 'Pepito de Pollo', 'Pan tostado, pollo desmenuzado, cebolla, salsas', 4.00, (SELECT id FROM public.categories WHERE name = 'Pepitos'), 1, true),
  ('refrescos', 'Refresco (Mediano)', 'Bebida fría', 1.50, (SELECT id FROM public.categories WHERE name = 'Extras'), 0, true),
  ('cerveza', 'Cerveza (Mediana)', 'Bebida alcohólica fría', 2.50, (SELECT id FROM public.categories WHERE name = 'Extras'), 1, true),
  ('papas-extra', 'Papas Extra', 'Orden adicional de papas', 2.00, (SELECT id FROM public.categories WHERE name = 'Extras'), 2, true);
