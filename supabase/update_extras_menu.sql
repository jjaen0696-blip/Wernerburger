-- Delete existing Extras items
DELETE FROM public.menu_items WHERE category = 'Extras';

-- Insert new Extras category items for all locations
INSERT INTO public.menu_items (name, description, price, category, image_url, available, sort_order, location_id)
VALUES
  ('Patacon', 'Relleno Mixto', 7.00, 'Extras', 'https://via.placeholder.com/300x300?text=Patacon', true, 1, (SELECT id FROM locations WHERE slug = 'centro' LIMIT 1)),
  ('Pataconburguer', 'Patacon relleno con jugosa hamburguesa', 6.00, 'Extras', 'https://via.placeholder.com/300x300?text=Pataconburguer', true, 2, (SELECT id FROM locations WHERE slug = 'centro' LIMIT 1)),
  ('Derretido de Pollo con Papas', 'Pollo derretido acompañado con papas crujientes', 6.00, 'Extras', 'https://via.placeholder.com/300x300?text=Derretido+Pollo', true, 3, (SELECT id FROM locations WHERE slug = 'centro' LIMIT 1)),
  ('Picada de Puerki Pollo Bacon', 'Deliciosa mezcla de cerdo, pollo y bacon', 8.00, 'Extras', 'https://via.placeholder.com/300x300?text=Picada', true, 4, (SELECT id FROM locations WHERE slug = 'centro' LIMIT 1));

INSERT INTO public.menu_items (name, description, price, category, image_url, available, sort_order, location_id)
VALUES
  ('Patacon', 'Relleno Mixto', 7.00, 'Extras', 'https://via.placeholder.com/300x300?text=Patacon', true, 1, (SELECT id FROM locations WHERE slug = 'norte' LIMIT 1)),
  ('Pataconburguer', 'Patacon relleno con jugosa hamburguesa', 6.00, 'Extras', 'https://via.placeholder.com/300x300?text=Pataconburguer', true, 2, (SELECT id FROM locations WHERE slug = 'norte' LIMIT 1)),
  ('Derretido de Pollo con Papas', 'Pollo derretido acompañado con papas crujientes', 6.00, 'Extras', 'https://via.placeholder.com/300x300?text=Derretido+Pollo', true, 3, (SELECT id FROM locations WHERE slug = 'norte' LIMIT 1)),
  ('Picada de Puerki Pollo Bacon', 'Deliciosa mezcla de cerdo, pollo y bacon', 8.00, 'Extras', 'https://via.placeholder.com/300x300?text=Picada', true, 4, (SELECT id FROM locations WHERE slug = 'norte' LIMIT 1));

INSERT INTO public.menu_items (name, description, price, category, image_url, available, sort_order, location_id)
VALUES
  ('Patacon', 'Relleno Mixto', 7.00, 'Extras', 'https://via.placeholder.com/300x300?text=Patacon', true, 1, (SELECT id FROM locations WHERE slug = 'sur' LIMIT 1)),
  ('Pataconburguer', 'Patacon relleno con jugosa hamburguesa', 6.00, 'Extras', 'https://via.placeholder.com/300x300?text=Pataconburguer', true, 2, (SELECT id FROM locations WHERE slug = 'sur' LIMIT 1)),
  ('Derretido de Pollo con Papas', 'Pollo derretido acompañado con papas crujientes', 6.00, 'Extras', 'https://via.placeholder.com/300x300?text=Derretido+Pollo', true, 3, (SELECT id FROM locations WHERE slug = 'sur' LIMIT 1)),
  ('Picada de Puerki Pollo Bacon', 'Deliciosa mezcla de cerdo, pollo y bacon', 8.00, 'Extras', 'https://via.placeholder.com/300x300?text=Picada', true, 4, (SELECT id FROM locations WHERE slug = 'sur' LIMIT 1));
