-- Productos de Salchipapas corregidos
INSERT INTO menu_items (name, description, price, category, available, sort_order, location_id) VALUES
('Salchimixto', 'Salchipapa con carnes mixtas', 7, 'Salchipapas', true, 1, (SELECT id FROM locations WHERE slug='centro')),
('Salchipollo', 'Salchipapa con pollo', 6, 'Salchipapas', true, 2, (SELECT id FROM locations WHERE slug='centro')),
('Salchibacon', 'Salchipapa con tocino crujiente', 6, 'Salchipapas', true, 3, (SELECT id FROM locations WHERE slug='centro')),
('Salchipapa Clásica', 'Salchipapa clásica con papas y queso', 3.75, 'Salchipapas', true, 4, (SELECT id FROM locations WHERE slug='centro')),
('Salchi Burger', 'Salchipapa con hamburguesa', 5.5, 'Salchipapas', true, 5, (SELECT id FROM locations WHERE slug='centro')),
('Salchimechi', 'Salchipapa con queso y salsas especiales', 8.5, 'Salchipapas', true, 6, (SELECT id FROM locations WHERE slug='centro')),
('Salchipuerka', 'Salchipapa con carne de cerdo', 7, 'Salchipapas', true, 7, (SELECT id FROM locations WHERE slug='centro'))
ON CONFLICT DO NOTHING;
