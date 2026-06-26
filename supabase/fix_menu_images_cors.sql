-- Update menu items with direct food image URLs from reliable CDNs without CORS blocking
-- Hot Dogs
UPDATE public.menu_items SET image_url = 'https://images.pexels.com/photos/2696/pizza-food-cheese-tomatoes.jpg?auto=compress&cs=tinysrgb&w=400&h=400' WHERE name = 'Hotdog Hawaiano';
UPDATE public.menu_items SET image_url = 'https://images.pexels.com/photos/1410235/pexels-photo-1410235.jpeg?auto=compress&cs=tinysrgb&w=400&h=400' WHERE name = 'Hotdog La Perra';
UPDATE public.menu_items SET image_url = 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400&h=400' WHERE name = 'Tocidog';
UPDATE public.menu_items SET image_url = 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400&h=400' WHERE name IN ('Hotdog Clásico', 'Hotdog Parmesano', 'Hotdog Mixto');

-- Pepitos
UPDATE public.menu_items SET image_url = 'https://images.pexels.com/photos/1026479/pexels-photo-1026479.jpeg?auto=compress&cs=tinysrgb&w=400&h=400' WHERE category = 'Pepitos';

-- Salchipapas
UPDATE public.menu_items SET image_url = 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400&h=400' WHERE category = 'Salchipapas';

-- Hamburguesas
UPDATE public.menu_items SET image_url = 'https://images.pexels.com/photos/1028323/pexels-photo-1028323.jpeg?auto=compress&cs=tinysrgb&w=400&h=400' WHERE category = 'Hamburguesas' AND name LIKE '%Pollo%';
UPDATE public.menu_items SET image_url = 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400&h=400' WHERE category = 'Hamburguesas' AND name NOT LIKE '%Pollo%';

-- Arepas
UPDATE public.menu_items SET image_url = 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=400&h=400' WHERE category = 'Arepas';

-- Papas
UPDATE public.menu_items SET image_url = 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400&h=400' WHERE category = 'Papas';

-- Bebidas
UPDATE public.menu_items SET image_url = 'https://images.pexels.com/photos/327098/pexels-photo-327098.jpeg?auto=compress&cs=tinysrgb&w=400&h=400' WHERE category = 'Bebidas';

-- Postres
UPDATE public.menu_items SET image_url = 'https://images.pexels.com/photos/821365/pexels-photo-821365.jpeg?auto=compress&cs=tinysrgb&w=400&h=400' WHERE category = 'Postres';

-- Extras - Patacones y especiales
UPDATE public.menu_items SET image_url = 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400&h=400' WHERE category = 'Extras' AND name LIKE '%Patacon%';
UPDATE public.menu_items SET image_url = 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400&h=400' WHERE category = 'Extras' AND name LIKE '%Derretido%';
UPDATE public.menu_items SET image_url = 'https://images.pexels.com/photos/1026479/pexels-photo-1026479.jpeg?auto=compress&cs=tinysrgb&w=400&h=400' WHERE category = 'Extras' AND name LIKE '%Picada%';
