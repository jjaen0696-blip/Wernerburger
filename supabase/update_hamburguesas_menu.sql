-- Delete existing Hamburguesas items
DELETE FROM public.menu_items WHERE category = 'Hamburguesas';

-- Insert new Hamburguesas category items for all locations
INSERT INTO public.menu_items (name, description, price, category, image_url, available, sort_order, location_id)
VALUES
  ('Hamburguesa Fuleta Chuleta', 'Deliciosa hamburguesa con chuleta de cerdo', 8.00, 'Hamburguesas', 'https://via.placeholder.com/300x300?text=Fuleta+Chuleta', true, 1, (SELECT id FROM locations WHERE slug = 'centro' LIMIT 1)),
  ('Hamburguesa Doble Carne Bacon', 'Dos carnes con bacon crujiente', 5.50, 'Hamburguesas', 'https://via.placeholder.com/300x300?text=Doble+Bacon', true, 2, (SELECT id FROM locations WHERE slug = 'centro' LIMIT 1)),
  ('Hamburguesa La Mixta Carne Pollo Bacon', 'Mezcla de carne, pollo y bacon', 5.00, 'Hamburguesas', 'https://via.placeholder.com/300x300?text=La+Mixta', true, 3, (SELECT id FROM locations WHERE slug = 'centro' LIMIT 1)),
  ('Hamburguesa Clásica', 'Hamburguesa tradicional jugosa', 3.00, 'Hamburguesas', 'https://via.placeholder.com/300x300?text=Clasica', true, 4, (SELECT id FROM locations WHERE slug = 'centro' LIMIT 1)),
  ('Burguer de Pollo', 'Hamburguesa de pollo tierno y sabroso', 3.50, 'Hamburguesas', 'https://via.placeholder.com/300x300?text=Burguer+Pollo', true, 5, (SELECT id FROM locations WHERE slug = 'centro' LIMIT 1)),
  ('Hamburguesa Clásica Bacon', 'Hamburguesa clásica con bacon', 4.00, 'Hamburguesas', 'https://via.placeholder.com/300x300?text=Clasica+Bacon', true, 6, (SELECT id FROM locations WHERE slug = 'centro' LIMIT 1)),
  ('Hamburguesa Triple Bacon', 'Triple carne con mucho bacon', 7.00, 'Hamburguesas', 'https://via.placeholder.com/300x300?text=Triple+Bacon', true, 7, (SELECT id FROM locations WHERE slug = 'centro' LIMIT 1)),
  ('Hamburguesa La Perra', 'Hamburguesa completa con todos los toppings', 5.00, 'Hamburguesas', 'https://via.placeholder.com/300x300?text=La+Perra', true, 8, (SELECT id FROM locations WHERE slug = 'centro' LIMIT 1)),
  ('Hamburguesa Chulefull', 'Hamburguesa premium con chuleta completa', 9.00, 'Hamburguesas', 'https://via.placeholder.com/300x300?text=Chulefull', true, 9, (SELECT id FROM locations WHERE slug = 'centro' LIMIT 1));

INSERT INTO public.menu_items (name, description, price, category, image_url, available, sort_order, location_id)
VALUES
  ('Hamburguesa Fuleta Chuleta', 'Deliciosa hamburguesa con chuleta de cerdo', 8.00, 'Hamburguesas', 'https://via.placeholder.com/300x300?text=Fuleta+Chuleta', true, 1, (SELECT id FROM locations WHERE slug = 'norte' LIMIT 1)),
  ('Hamburguesa Doble Carne Bacon', 'Dos carnes con bacon crujiente', 5.50, 'Hamburguesas', 'https://via.placeholder.com/300x300?text=Doble+Bacon', true, 2, (SELECT id FROM locations WHERE slug = 'norte' LIMIT 1)),
  ('Hamburguesa La Mixta Carne Pollo Bacon', 'Mezcla de carne, pollo y bacon', 5.00, 'Hamburguesas', 'https://via.placeholder.com/300x300?text=La+Mixta', true, 3, (SELECT id FROM locations WHERE slug = 'norte' LIMIT 1)),
  ('Hamburguesa Clásica', 'Hamburguesa tradicional jugosa', 3.00, 'Hamburguesas', 'https://via.placeholder.com/300x300?text=Clasica', true, 4, (SELECT id FROM locations WHERE slug = 'norte' LIMIT 1)),
  ('Burguer de Pollo', 'Hamburguesa de pollo tierno y sabroso', 3.50, 'Hamburguesas', 'https://via.placeholder.com/300x300?text=Burguer+Pollo', true, 5, (SELECT id FROM locations WHERE slug = 'norte' LIMIT 1)),
  ('Hamburguesa Clásica Bacon', 'Hamburguesa clásica con bacon', 4.00, 'Hamburguesas', 'https://via.placeholder.com/300x300?text=Clasica+Bacon', true, 6, (SELECT id FROM locations WHERE slug = 'norte' LIMIT 1)),
  ('Hamburguesa Triple Bacon', 'Triple carne con mucho bacon', 7.00, 'Hamburguesas', 'https://via.placeholder.com/300x300?text=Triple+Bacon', true, 7, (SELECT id FROM locations WHERE slug = 'norte' LIMIT 1)),
  ('Hamburguesa La Perra', 'Hamburguesa completa con todos los toppings', 5.00, 'Hamburguesas', 'https://via.placeholder.com/300x300?text=La+Perra', true, 8, (SELECT id FROM locations WHERE slug = 'norte' LIMIT 1)),
  ('Hamburguesa Chulefull', 'Hamburguesa premium con chuleta completa', 9.00, 'Hamburguesas', 'https://via.placeholder.com/300x300?text=Chulefull', true, 9, (SELECT id FROM locations WHERE slug = 'norte' LIMIT 1));

INSERT INTO public.menu_items (name, description, price, category, image_url, available, sort_order, location_id)
VALUES
  ('Hamburguesa Fuleta Chuleta', 'Deliciosa hamburguesa con chuleta de cerdo', 8.00, 'Hamburguesas', 'https://via.placeholder.com/300x300?text=Fuleta+Chuleta', true, 1, (SELECT id FROM locations WHERE slug = 'sur' LIMIT 1)),
  ('Hamburguesa Doble Carne Bacon', 'Dos carnes con bacon crujiente', 5.50, 'Hamburguesas', 'https://via.placeholder.com/300x300?text=Doble+Bacon', true, 2, (SELECT id FROM locations WHERE slug = 'sur' LIMIT 1)),
  ('Hamburguesa La Mixta Carne Pollo Bacon', 'Mezcla de carne, pollo y bacon', 5.00, 'Hamburguesas', 'https://via.placeholder.com/300x300?text=La+Mixta', true, 3, (SELECT id FROM locations WHERE slug = 'sur' LIMIT 1)),
  ('Hamburguesa Clásica', 'Hamburguesa tradicional jugosa', 3.00, 'Hamburguesas', 'https://via.placeholder.com/300x300?text=Clasica', true, 4, (SELECT id FROM locations WHERE slug = 'sur' LIMIT 1)),
  ('Burguer de Pollo', 'Hamburguesa de pollo tierno y sabroso', 3.50, 'Hamburguesas', 'https://via.placeholder.com/300x300?text=Burguer+Pollo', true, 5, (SELECT id FROM locations WHERE slug = 'sur' LIMIT 1)),
  ('Hamburguesa Clásica Bacon', 'Hamburguesa clásica con bacon', 4.00, 'Hamburguesas', 'https://via.placeholder.com/300x300?text=Clasica+Bacon', true, 6, (SELECT id FROM locations WHERE slug = 'sur' LIMIT 1)),
  ('Hamburguesa Triple Bacon', 'Triple carne con mucho bacon', 7.00, 'Hamburguesas', 'https://via.placeholder.com/300x300?text=Triple+Bacon', true, 7, (SELECT id FROM locations WHERE slug = 'sur' LIMIT 1)),
  ('Hamburguesa La Perra', 'Hamburguesa completa con todos los toppings', 5.00, 'Hamburguesas', 'https://via.placeholder.com/300x300?text=La+Perra', true, 8, (SELECT id FROM locations WHERE slug = 'sur' LIMIT 1)),
  ('Hamburguesa Chulefull', 'Hamburguesa premium con chuleta completa', 9.00, 'Hamburguesas', 'https://via.placeholder.com/300x300?text=Chulefull', true, 9, (SELECT id FROM locations WHERE slug = 'sur' LIMIT 1));
