-- Delete existing Hot Dogs items
DELETE FROM public.menu_items WHERE category = 'Hot Dogs';

-- Insert new Hot Dogs category items for all locations
INSERT INTO public.menu_items (name, description, price, category, image_url, available, sort_order, location_id)
VALUES
  ('Hotdog Hawaiano', 'Hotdog con piña y jamón, toque tropical', 2.50, 'Hot Dogs', 'https://via.placeholder.com/300x300?text=Hotdog+Hawaiano', true, 1, (SELECT id FROM locations WHERE slug = 'centro' LIMIT 1)),
  ('Hotdog La Perra', 'Hotdog cargado con todos los toppings', 4.50, 'Hot Dogs', 'https://via.placeholder.com/300x300?text=Hotdog+Perra', true, 2, (SELECT id FROM locations WHERE slug = 'centro' LIMIT 1)),
  ('Tocidog', 'Hotdog cubierto de bacon crujiente', 4.00, 'Hot Dogs', 'https://via.placeholder.com/300x300?text=Tocidog', true, 3, (SELECT id FROM locations WHERE slug = 'centro' LIMIT 1)),
  ('Hotdog Clásico', 'Hotdog tradicional con salsas', 2.50, 'Hot Dogs', 'https://via.placeholder.com/300x300?text=Hotdog+Clasico', true, 4, (SELECT id FROM locations WHERE slug = 'centro' LIMIT 1)),
  ('Hotdog Parmesano', 'Hotdog con queso parmesano gratinado', 2.50, 'Hot Dogs', 'https://via.placeholder.com/300x300?text=Hotdog+Parmesano', true, 5, (SELECT id FROM locations WHERE slug = 'centro' LIMIT 1)),
  ('Hotdog Mixto', 'Hotdog con carne mixta y queso', 5.00, 'Hot Dogs', 'https://via.placeholder.com/300x300?text=Hotdog+Mixto', true, 6, (SELECT id FROM locations WHERE slug = 'centro' LIMIT 1));

INSERT INTO public.menu_items (name, description, price, category, image_url, available, sort_order, location_id)
VALUES
  ('Hotdog Hawaiano', 'Hotdog con piña y jamón, toque tropical', 2.50, 'Hot Dogs', 'https://via.placeholder.com/300x300?text=Hotdog+Hawaiano', true, 1, (SELECT id FROM locations WHERE slug = 'norte' LIMIT 1)),
  ('Hotdog La Perra', 'Hotdog cargado con todos los toppings', 4.50, 'Hot Dogs', 'https://via.placeholder.com/300x300?text=Hotdog+Perra', true, 2, (SELECT id FROM locations WHERE slug = 'norte' LIMIT 1)),
  ('Tocidog', 'Hotdog cubierto de bacon crujiente', 4.00, 'Hot Dogs', 'https://via.placeholder.com/300x300?text=Tocidog', true, 3, (SELECT id FROM locations WHERE slug = 'norte' LIMIT 1)),
  ('Hotdog Clásico', 'Hotdog tradicional con salsas', 2.50, 'Hot Dogs', 'https://via.placeholder.com/300x300?text=Hotdog+Clasico', true, 4, (SELECT id FROM locations WHERE slug = 'norte' LIMIT 1)),
  ('Hotdog Parmesano', 'Hotdog con queso parmesano gratinado', 2.50, 'Hot Dogs', 'https://via.placeholder.com/300x300?text=Hotdog+Parmesano', true, 5, (SELECT id FROM locations WHERE slug = 'norte' LIMIT 1)),
  ('Hotdog Mixto', 'Hotdog con carne mixta y queso', 5.00, 'Hot Dogs', 'https://via.placeholder.com/300x300?text=Hotdog+Mixto', true, 6, (SELECT id FROM locations WHERE slug = 'norte' LIMIT 1));

INSERT INTO public.menu_items (name, description, price, category, image_url, available, sort_order, location_id)
VALUES
  ('Hotdog Hawaiano', 'Hotdog con piña y jamón, toque tropical', 2.50, 'Hot Dogs', 'https://via.placeholder.com/300x300?text=Hotdog+Hawaiano', true, 1, (SELECT id FROM locations WHERE slug = 'sur' LIMIT 1)),
  ('Hotdog La Perra', 'Hotdog cargado con todos los toppings', 4.50, 'Hot Dogs', 'https://via.placeholder.com/300x300?text=Hotdog+Perra', true, 2, (SELECT id FROM locations WHERE slug = 'sur' LIMIT 1)),
  ('Tocidog', 'Hotdog cubierto de bacon crujiente', 4.00, 'Hot Dogs', 'https://via.placeholder.com/300x300?text=Tocidog', true, 3, (SELECT id FROM locations WHERE slug = 'sur' LIMIT 1)),
  ('Hotdog Clásico', 'Hotdog tradicional con salsas', 2.50, 'Hot Dogs', 'https://via.placeholder.com/300x300?text=Hotdog+Clasico', true, 4, (SELECT id FROM locations WHERE slug = 'sur' LIMIT 1)),
  ('Hotdog Parmesano', 'Hotdog con queso parmesano gratinado', 2.50, 'Hot Dogs', 'https://via.placeholder.com/300x300?text=Hotdog+Parmesano', true, 5, (SELECT id FROM locations WHERE slug = 'sur' LIMIT 1)),
  ('Hotdog Mixto', 'Hotdog con carne mixta y queso', 5.00, 'Hot Dogs', 'https://via.placeholder.com/300x300?text=Hotdog+Mixto', true, 6, (SELECT id FROM locations WHERE slug = 'sur' LIMIT 1));
