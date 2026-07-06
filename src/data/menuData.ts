export interface MenuItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  category: Category;
  image: string;
  isPopular?: boolean;
  isFeatured?: boolean;
}

export type Category = 'hotdogs' | 'hamburguesas' | 'arepas' | 'salchipapas' | 'extras' | 'pepitos';

export const CATEGORIES = [
  { id: 'todas', label: 'Todos los platillos', emoji: '🍽️' },
  { id: 'hotdogs', label: 'Hot Dogs', emoji: '🌭' },
  { id: 'pepitos', label: 'Pepitos', emoji: '🥪' },
  { id: 'salchipapas', label: 'Salchipapas', emoji: '🍟' },
  { id: 'hamburguesas', label: 'Hamburguesas', emoji: '🍔' },
  { id: 'arepas', label: 'Arepas', emoji: '🫓' },
  { id: 'extras', label: 'Bebidas', emoji: '🥤' },
] as const;

export const MENU_ITEMS: MenuItem[] = [
  // Hot Dogs
  {
    id: 'hd1',
    name: 'Hotdog Hawaiano',
    price: 2.50,
    description: 'Hotdog con piña y jamón, toque tropical',
    category: 'hotdogs',
    image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 'hd2',
    name: 'Hotdog La Perra',
    price: 4.50,
    description: 'Hotdog cargado con todos los toppings',
    category: 'hotdogs',
    image: 'https://images.pexels.com/photos/2983101/pexels-photo-2983101.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 'hd3',
    name: 'Tocidog',
    price: 4.00,
    description: 'Hotdog clásico de tocino crujiente',
    category: 'hotdogs',
    image: 'https://images.pexels.com/photos/1600711/pexels-photo-1600711.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 'hd4',
    name: 'Hotdog Clásico',
    price: 2.50,
    description: 'Hotdog tradicional con salsas',
    category: 'hotdogs',
    image: 'https://images.pexels.com/photos/4518655/pexels-photo-4518655.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  // Hamburguesas
  {
    id: 'hb1',
    name: 'Hamburguesa Fuleta Chuleta',
    price: 8.00,
    description: 'Deliciosa hamburguesa con chuleta de cerdo',
    category: 'hamburguesas',
    isPopular: true,
    image: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 'hb2',
    name: 'Hamburguesa Doble Carne Bacon',
    price: 5.50,
    description: 'Dos carnes con bacon crujiente',
    category: 'hamburguesas',
    isPopular: true,
    image: 'https://images.pexels.com/photos/3219547/pexels-photo-3219547.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 'hb3',
    name: 'Hamburguesa La Mixta Carne Pollo Bacon',
    price: 5.50,
    description: 'Mixta de carne, pollo y bacon',
    category: 'hamburguesas',
    isPopular: true,
    image: 'https://images.pexels.com/photos/1639562/pexels-photo-1639562.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 'hb4',
    name: 'Hamburguesa Triple Bacon',
    price: 7.00,
    description: 'Triple carne con mucho bacon',
    category: 'hamburguesas',
    isPopular: true,
    isFeatured: true,
    image: 'https://images.pexels.com/photos/2271107/pexels-photo-2271107.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  // Arepas
  {
    id: 'ar1',
    name: 'Arepa Mixta Bacon',
    price: 5.00,
    description: 'Arepa rellena con carne mixta y bacon crujiente',
    category: 'arepas',
    image: 'https://images.pexels.com/photos/5765/food-salad-restaurant-person.jpg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 'ar2',
    name: 'Arepa de Pollo',
    price: 4.00,
    description: 'Arepa con tiras de pollo desmechado',
    category: 'arepas',
    image: 'https://images.pexels.com/photos/461382/pexels-photo-461382.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 'ar3',
    name: 'Arepa de Queso',
    price: 3.00,
    description: 'Arepa clásica rellena de queso derretido',
    category: 'arepas',
    image: 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  // Salchipapas
  {
    id: 'sp1',
    name: 'Salchipapa Clásica',
    price: 3.75,
    description: 'Salchipapa clásica con papas y queso',
    category: 'salchipapas',
    image: 'https://images.pexels.com/photos/1893556/pexels-photo-1893556.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 'sp2',
    name: 'Salchipapa Especial',
    price: 5.00,
    description: 'Con toppings especiales',
    category: 'salchipapas',
    image: 'https://images.pexels.com/photos/4109111/pexels-photo-4109111.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  // Pepitos
  {
    id: 'pp1',
    name: 'Pepito Clásico',
    price: 3.50,
    description: 'Pan de hot dog relleno con carne y salsas',
    category: 'pepitos',
    image: 'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 'pp2',
    name: 'Pepito Especial',
    price: 4.50,
    description: 'Con doble carne y queso derretido',
    category: 'pepitos',
    image: 'https://images.pexels.com/photos/3616956/pexels-photo-3616956.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  // Extras
  {
    id: 'ex1',
    name: 'Patacón',
    price: 7.00,
    description: 'Relleno Mixto',
    category: 'extras',
    image: 'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 'ex2',
    name: 'Bebida Natural',
    price: 2.00,
    description: 'Refrescante y natural',
    category: 'extras',
    image: 'https://images.pexels.com/photos/3616956/pexels-photo-3616956.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
];
