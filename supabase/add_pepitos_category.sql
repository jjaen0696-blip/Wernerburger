-- Insert Pepitos category items
INSERT INTO public.menu_items (name, description, price, category, image_url, available, sort_order, location_id)
VALUES
  ('Pepidog', 'Delicioso pepidog con salchicha, queso y salsas especiales', 6.50, 'Pepitos', 'https://via.placeholder.com/300x300?text=Pepidog', true, 1, (SELECT id FROM locations WHERE slug = 'centro' LIMIT 1)),
  ('Taco Mixto', 'Taco con carne mixta, cebolla y cilantro', 4.00, 'Pepitos', 'https://via.placeholder.com/300x300?text=Taco+Mixto', true, 2, (SELECT id FROM locations WHERE slug = 'centro' LIMIT 1)),
  ('Taco de Pollo', 'Taco clásico de pollo tierno y jugoso', 3.50, 'Pepitos', 'https://via.placeholder.com/300x300?text=Taco+Pollo', true, 3, (SELECT id FROM locations WHERE slug = 'centro' LIMIT 1));

-- Repeat for other locations
INSERT INTO public.menu_items (name, description, price, category, image_url, available, sort_order, location_id)
VALUES
  ('Pepidog', 'Delicioso pepidog con salchicha, queso y salsas especiales', 6.50, 'Pepitos', 'https://via.placeholder.com/300x300?text=Pepidog', true, 1, (SELECT id FROM locations WHERE slug = 'norte' LIMIT 1)),
  ('Taco Mixto', 'Taco con carne mixta, cebolla y cilantro', 4.00, 'Pepitos', 'https://via.placeholder.com/300x300?text=Taco+Mixto', true, 2, (SELECT id FROM locations WHERE slug = 'norte' LIMIT 1)),
  ('Taco de Pollo', 'Taco clásico de pollo tierno y jugoso', 3.50, 'Pepitos', 'https://via.placeholder.com/300x300?text=Taco+Pollo', true, 3, (SELECT id FROM locations WHERE slug = 'norte' LIMIT 1));

INSERT INTO public.menu_items (name, description, price, category, image_url, available, sort_order, location_id)
VALUES
  ('Pepidog', 'Delicioso pepidog con salchicha, queso y salsas especiales', 6.50, 'Pepitos', 'https://via.placeholder.com/300x300?text=Pepidog', true, 1, (SELECT id FROM locations WHERE slug = 'sur' LIMIT 1)),
  ('Taco Mixto', 'Taco con carne mixta, cebolla y cilantro', 4.00, 'Pepitos', 'https://via.placeholder.com/300x300?text=Taco+Mixto', true, 2, (SELECT id FROM locations WHERE slug = 'sur' LIMIT 1)),
  ('Taco de Pollo', 'Taco clásico de pollo tierno y jugoso', 3.50, 'Pepitos', 'https://via.placeholder.com/300x300?text=Taco+Pollo', true, 3, (SELECT id FROM locations WHERE slug = 'sur' LIMIT 1));
