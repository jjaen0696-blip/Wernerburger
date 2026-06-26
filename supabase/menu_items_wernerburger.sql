-- Insertar productos del menú de WernerBurguer desde la imagen
INSERT INTO menu_items (name, description, price, category, available, sort_order, location_id) VALUES

-- HOT DOGS
('Hot Dog Simple', 'Hot dog clásico con salsa', 3, 'Hot Dogs', true, 1, (SELECT id FROM locations WHERE slug='centro')),
('Hot Dog Jamón', 'Hot dog con jamón', 3, 'Hot Dogs', true, 2, (SELECT id FROM locations WHERE slug='centro')),
('Hot Dog Queso', 'Hot dog con queso derretido', 3, 'Hot Dogs', true, 3, (SELECT id FROM locations WHERE slug='centro')),
('Hot Dog Mixto', 'Hot dog con jamón y queso', 3, 'Hot Dogs', true, 4, (SELECT id FROM locations WHERE slug='centro')),
('Hot Dog Carnes', 'Hot dog con carnes variadas', 5, 'Hot Dogs', true, 5, (SELECT id FROM locations WHERE slug='centro')),

-- PEPITOS
('Pepito de Pollo', 'Sándwich de pollo deshilachado', 6, 'Pepitos', true, 1, (SELECT id FROM locations WHERE slug='centro')),
('Taco Mixto', 'Taco con carnes mixtas', 4, 'Pepitos', true, 2, (SELECT id FROM locations WHERE slug='centro')),
('Taco de Pollo', 'Taco crujiente con pollo', 5, 'Pepitos', true, 3, (SELECT id FROM locations WHERE slug='centro')),

-- HAMBURGUESAS
('Hamburguesa Simple', 'Medallón de carne, queso, lechuga y tomate', 5, 'Hamburguesas', true, 1, (SELECT id FROM locations WHERE slug='centro')),
('Hamburguesa Doble Carnes', 'Doble medallón con dos tipos de carnes', 7, 'Hamburguesas', true, 2, (SELECT id FROM locations WHERE slug='centro')),
('Hamburguesa Triple Carnes y Jamón', 'Triple medallón con jamón y carnes', 9, 'Hamburguesas', true, 3, (SELECT id FROM locations WHERE slug='centro')),
('Hamburguesa Doble Pollo Sacón', 'Doble pechuga de pollo empanizada', 7, 'Hamburguesas', true, 4, (SELECT id FROM locations WHERE slug='centro')),
('Hamburguesa La Perra', 'Hamburguesa con carnes y tocino', 8, 'Hamburguesas', true, 5, (SELECT id FROM locations WHERE slug='centro')),
('Hamburguesa Chefsull', 'Especialidad del chef con toppings premium', 8, 'Hamburguesas', true, 6, (SELECT id FROM locations WHERE slug='centro')),
('Hamburguesa Triple Bacon', 'Triple medallón cubierto de tocino crujiente', 9, 'Hamburguesas', true, 7, (SELECT id FROM locations WHERE slug='centro')),
('Hamburguesa Triple Lomo', 'Triple medallón de lomo de res', 8, 'Hamburguesas', true, 8, (SELECT id FROM locations WHERE slug='centro')),
('Hamburguesa Triple Queso', 'Triple medallón con triple queso fundido', 8, 'Hamburguesas', true, 9, (SELECT id FROM locations WHERE slug='centro')),
('Hamburguesa Pollo Especial', 'Pechuga de pollo con toppings especiales', 8, 'Hamburguesas', true, 10, (SELECT id FROM locations WHERE slug='centro')),

-- AREPAS
('Arepa de Carne', 'Arepa rellena de carne deshilachada', 5, 'Arepas', true, 1, (SELECT id FROM locations WHERE slug='centro')),
('Arepa de Pollo', 'Arepa rellena de pollo', 5, 'Arepas', true, 2, (SELECT id FROM locations WHERE slug='centro')),
('Arepa de Queso', 'Arepa rellena de queso derretido', 5, 'Arepas', true, 3, (SELECT id FROM locations WHERE slug='centro')),
('Arepa de Champiñón', 'Arepa vegetariana con champiñones', 5, 'Arepas', true, 4, (SELECT id FROM locations WHERE slug='centro')),

-- SÁNDWICHES
('Salchipaoas', 'Sándwich de salchichas con toppings', 8, 'Sándwiches', true, 1, (SELECT id FROM locations WHERE slug='centro')),
('Salchi-Mixto', 'Sándwich de salchichas con carnes mixtas', 9, 'Sándwiches', true, 2, (SELECT id FROM locations WHERE slug='centro')),
('Salchi-Queso', 'Sándwich de salchichas con queso', 9, 'Sándwiches', true, 3, (SELECT id FROM locations WHERE slug='centro')),
('Salchi-Bacon', 'Sándwich de salchichas con tocino crujiente', 10, 'Sándwiches', true, 4, (SELECT id FROM locations WHERE slug='centro')),
('Salchi-Puerka', 'Sándwich de salchichas con carne de cerdo', 10, 'Sándwiches', true, 5, (SELECT id FROM locations WHERE slug='centro')),
('Salchi-Doble', 'Dos salchichas con toppings', 8, 'Sándwiches', true, 6, (SELECT id FROM locations WHERE slug='centro')),
('Salchi-Carne', 'Sándwich de salchichas con carne molida', 8, 'Sándwiches', true, 7, (SELECT id FROM locations WHERE slug='centro')),
('Salchibueno', 'Especialidad de salchichas con extras', 9, 'Sándwiches', true, 8, (SELECT id FROM locations WHERE slug='centro')),
('Salchi-Nech Carne', 'Salchichas con carne y queso', 9, 'Sándwiches', true, 9, (SELECT id FROM locations WHERE slug='centro')),

-- EXTRAS
('Papas', 'Papas fritas crujientes', 7, 'Extras', true, 1, (SELECT id FROM locations WHERE slug='centro')),
('Papas con Queso', 'Papas fritas cubiertas con queso derretido', 8, 'Extras', true, 2, (SELECT id FROM locations WHERE slug='centro')),
('Cherry Locura', 'Postre especial', 15, 'Extras', true, 3, (SELECT id FROM locations WHERE slug='centro')),
('Arepa Queso', 'Arepa simple de queso', 8, 'Extras', true, 4, (SELECT id FROM locations WHERE slug='centro'))
ON CONFLICT DO NOTHING;
