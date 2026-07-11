-- Crear tabla de items del menú
CREATE TABLE IF NOT EXISTS public.menu_items (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('hotdogs', 'hamburguesas', 'arepas', 'salchipapas', 'extras', 'pepitos')),
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON public.menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_menu_items_branch_id ON public.menu_items(branch_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_sort_order ON public.menu_items(sort_order);

-- Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_menu_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_menu_items_updated_at ON public.menu_items;
CREATE TRIGGER update_menu_items_updated_at
BEFORE UPDATE ON public.menu_items
FOR EACH ROW
EXECUTE FUNCTION public.update_menu_items_updated_at();

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;

-- Insertar menú inicial del establecimiento
INSERT INTO public.menu_items (name, description, price, category, is_available, is_popular, sort_order, image_url)
VALUES
  -- Hot Dogs
  ('Hotdog Hawaiano', 'Hotdog con piña y jamón, toque tropical', 2.50, 'hotdogs', true, false, 1, NULL),
  ('Hotdog La Perra', 'Hotdog cargado con todos los toppings', 4.50, 'hotdogs', true, true, 2, NULL),
  ('Tocidog', 'Hotdog clásico de tocino crujiente', 4.00, 'hotdogs', true, false, 3, NULL),
  ('Hotdog Clásico', 'Hotdog tradicional con salsas', 2.50, 'hotdogs', true, false, 4, NULL),
  
  -- Hamburguesas
  ('Hamburguesa Fuleta Chuleta', 'Deliciosa hamburguesa con chuleta de cerdo', 8.00, 'hamburguesas', true, true, 1, NULL),
  ('Hamburguesa Doble Carne Bacon', 'Dos carnes con bacon crujiente', 5.50, 'hamburguesas', true, true, 2, NULL),
  ('Hamburguesa La Mixta Carne Pollo Bacon', 'Mixta de carne, pollo y bacon', 5.50, 'hamburguesas', true, true, 3, NULL),
  ('Hamburguesa Triple Bacon', 'Triple carne con mucho bacon', 7.00, 'hamburguesas', true, true, 4, NULL),
  
  -- Arepas
  ('Arepa Mixta Bacon', 'Arepa con mixta de carnes y bacon', 6.50, 'arepas', true, false, 1, NULL),
  ('Arepa De Queso', 'Arepa rellena de queso derretido', 4.00, 'arepas', true, false, 2, NULL),
  
  -- Salchipapas
  ('Salchipapas Mix', 'Papas fritas con salchichas y salsas', 5.00, 'salchipapas', true, false, 1, NULL),
  
  -- Pepitos
  ('Pepito de Carne', 'Pan tostado con carne y vegetales', 5.50, 'pepitos', true, false, 1, NULL),
  
  -- Extras/Bebidas
  ('Coca Cola 2L', 'Refresco tamaño familiar', 3.00, 'extras', true, false, 1, NULL),
  ('Cerveza Pilsen 354ml', 'Cerveza fría', 1.50, 'extras', true, false, 2, NULL)
ON CONFLICT DO NOTHING;
