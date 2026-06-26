-- Delete existing Arepas items
DELETE FROM public.menu_items WHERE category = 'Arepas';

-- Insert new Arepas category items for all locations
INSERT INTO public.menu_items (name, description, price, category, image_url, available, sort_order, location_id)
VALUES
  ('Arepa Mixta Bacon', 'Arepa rellena con carne mixta y bacon crujiente', 5.00, 'Arepas', 'https://via.placeholder.com/300x300?text=Arepa+Bacon', true, 1, (SELECT id FROM locations WHERE slug = 'centro' LIMIT 1)),
  ('Arepa de Pollo', 'Arepa tierna rellena de pollo desmenuzado', 4.00, 'Arepas', 'https://via.placeholder.com/300x300?text=Arepa+Pollo', true, 2, (SELECT id FROM locations WHERE slug = 'centro' LIMIT 1)),
  ('Arepa de Queso', 'Arepa clásica rellena de queso derretido', 3.00, 'Arepas', 'https://via.placeholder.com/300x300?text=Arepa+Queso', true, 3, (SELECT id FROM locations WHERE slug = 'centro' LIMIT 1));

INSERT INTO public.menu_items (name, description, price, category, image_url, available, sort_order, location_id)
VALUES
  ('Arepa Mixta Bacon', 'Arepa rellena con carne mixta y bacon crujiente', 5.00, 'Arepas', 'https://via.placeholder.com/300x300?text=Arepa+Bacon', true, 1, (SELECT id FROM locations WHERE slug = 'norte' LIMIT 1)),
  ('Arepa de Pollo', 'Arepa tierna rellena de pollo desmenuzado', 4.00, 'Arepas', 'https://via.placeholder.com/300x300?text=Arepa+Pollo', true, 2, (SELECT id FROM locations WHERE slug = 'norte' LIMIT 1)),
  ('Arepa de Queso', 'Arepa clásica rellena de queso derretido', 3.00, 'Arepas', 'https://via.placeholder.com/300x300?text=Arepa+Queso', true, 3, (SELECT id FROM locations WHERE slug = 'norte' LIMIT 1));

INSERT INTO public.menu_items (name, description, price, category, image_url, available, sort_order, location_id)
VALUES
  ('Arepa Mixta Bacon', 'Arepa rellena con carne mixta y bacon crujiente', 5.00, 'Arepas', 'https://via.placeholder.com/300x300?text=Arepa+Bacon', true, 1, (SELECT id FROM locations WHERE slug = 'sur' LIMIT 1)),
  ('Arepa de Pollo', 'Arepa tierna rellena de pollo desmenuzado', 4.00, 'Arepas', 'https://via.placeholder.com/300x300?text=Arepa+Pollo', true, 2, (SELECT id FROM locations WHERE slug = 'sur' LIMIT 1)),
  ('Arepa de Queso', 'Arepa clásica rellena de queso derretido', 3.00, 'Arepas', 'https://via.placeholder.com/300x300?text=Arepa+Queso', true, 3, (SELECT id FROM locations WHERE slug = 'sur' LIMIT 1));
