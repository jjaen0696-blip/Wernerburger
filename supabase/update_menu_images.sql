-- Update all menu items with AI-generated food images from Unsplash
UPDATE public.menu_items SET image_url = 'https://source.unsplash.com/400x400/?hotdog' WHERE name LIKE '%Hotdog%' AND category = 'Hot Dogs';
UPDATE public.menu_items SET image_url = 'https://source.unsplash.com/400x400/?hawaiian,food' WHERE name = 'Hotdog Hawaiano';
UPDATE public.menu_items SET image_url = 'https://source.unsplash.com/400x400/?hotdog,bacon' WHERE name IN ('Hotdog La Perra', 'Tocidog');

UPDATE public.menu_items SET image_url = 'https://source.unsplash.com/400x400/?pepito,sandwich' WHERE category = 'Pepitos';
UPDATE public.menu_items SET image_url = 'https://source.unsplash.com/400x400/?pepidog,hotdog' WHERE name = 'Pepidog';

UPDATE public.menu_items SET image_url = 'https://source.unsplash.com/400x400/?salchipapas,fries' WHERE category = 'Salchipapas';

UPDATE public.menu_items SET image_url = 'https://source.unsplash.com/400x400/?hamburger' WHERE category = 'Hamburguesas';
UPDATE public.menu_items SET image_url = 'https://source.unsplash.com/400x400/?burger,bacon,pork' WHERE name LIKE '%Chuleta%' OR name LIKE '%Fuleta%';
UPDATE public.menu_items SET image_url = 'https://source.unsplash.com/400x400/?burger,triple,bacon' WHERE name LIKE '%Triple%';
UPDATE public.menu_items SET image_url = 'https://source.unsplash.com/400x400/?burger,chicken' WHERE name LIKE '%Pollo%' AND category = 'Hamburguesas';

UPDATE public.menu_items SET image_url = 'https://source.unsplash.com/400x400/?arepa' WHERE category = 'Arepas';
UPDATE public.menu_items SET image_url = 'https://source.unsplash.com/400x400/?arepa,bacon,meat' WHERE name LIKE '%Bacon%' AND category = 'Arepas';
UPDATE public.menu_items SET image_url = 'https://source.unsplash.com/400x400/?arepa,chicken' WHERE name LIKE '%Pollo%' AND category = 'Arepas';
UPDATE public.menu_items SET image_url = 'https://source.unsplash.com/400x400/?arepa,cheese' WHERE name LIKE '%Queso%' AND category = 'Arepas';

UPDATE public.menu_items SET image_url = 'https://source.unsplash.com/400x400/?french-fries,potatoes' WHERE category = 'Papas';

UPDATE public.menu_items SET image_url = 'https://source.unsplash.com/400x400/?beverage,drink,juice' WHERE category = 'Bebidas';

UPDATE public.menu_items SET image_url = 'https://source.unsplash.com/400x400/?dessert,sweet' WHERE category = 'Postres';

UPDATE public.menu_items SET image_url = 'https://source.unsplash.com/400x400/?patacon,fried' WHERE name LIKE '%Patacon%';
UPDATE public.menu_items SET image_url = 'https://source.unsplash.com/400x400/?patacon,burger' WHERE name = 'Pataconburguer';
UPDATE public.menu_items SET image_url = 'https://source.unsplash.com/400x400/?chicken,cheese,fries' WHERE name = 'Derretido de Pollo con Papas';
UPDATE public.menu_items SET image_url = 'https://source.unsplash.com/400x400/?platter,mixed,meat,bacon' WHERE name LIKE '%Picada%';
