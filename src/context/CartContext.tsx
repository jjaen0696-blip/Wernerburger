import { createContext, useContext, useState, ReactNode } from 'react';
import { MenuItem } from '../data/menuData';

export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'assigned' | 'delivering' | 'completed';

export interface OrderItem {
  item: MenuItem;
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  customerName: string;
  phone: string;
  address?: string;
  deliveryType: 'local' | 'delivery';
  paymentMethod: 'efectivo' | 'yappy';
  status: OrderStatus;
  placedAt: number;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  orders: Order[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  placeOrder: (payload: Omit<Order, 'id' | 'status' | 'placedAt'>) => string;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) return prev.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(c => c.item.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => {
      return prev.map(c => {
        if (c.item.id !== itemId) return c;
        const newQty = c.quantity + delta;
        return newQty <= 0 ? { ...c, quantity: 0 } : { ...c, quantity: newQty };
      }).filter(c => c.quantity > 0);
    });
  };

  const clearCart = () => setCart([]);

  const placeOrder = (payload: Omit<Order, 'id' | 'status' | 'placedAt'>) => {
    const id = `ORD-${Date.now()}`;
    const newOrder: Order = {
      ...payload,
      id,
      status: 'pending',
      placedAt: Date.now(),
    };
    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    return id;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status } : order)));
  };

  const total = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
  const itemCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, orders, addToCart, removeFromCart, updateQuantity, clearCart, placeOrder, updateOrderStatus, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
