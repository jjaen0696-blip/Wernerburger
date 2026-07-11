import { createContext, useContext, useState, ReactNode } from 'react';
import { MenuItem } from '../data/menuData';
import supabase from '../lib/supabase';

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
  // ahora devuelve la fila de orden insertada o null en error
  placeOrder: (payload: Omit<Order, 'id' | 'status' | 'placedAt'>, branchId?: string) => Promise<any | null>;
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

  const placeOrder = async (payload: Omit<Order, 'id' | 'status' | 'placedAt'>, branchId?: string) => {
    try {
      // Determinar branch si no fue proporcionado
      let orderBranchId = branchId;
      if (!orderBranchId) {
        const { data: bdata } = await supabase.from('branches').select('id').limit(1);
        orderBranchId = bdata?.[0]?.id;
      }

      if (!orderBranchId) throw new Error('No branch available to place order');

      // Insertar orden
      const { data: orderData, error: orderError } = await supabase.from('orders').insert([{
        branch_id: orderBranchId,
        customer_name: payload.customerName,
        customer_phone: payload.phone,
        customer_address: payload.address || null,
        delivery_type: payload.deliveryType || 'local',
        payment_method: payload.paymentMethod,
        status: 'pending',
        total_amount: payload.total,
        notes: null,
      }]).select();

      if (orderError || !orderData || orderData.length === 0) {
        console.error('Error inserting order:', orderError);
        return null;
      }

      const insertedOrder = orderData[0];

      // Insertar items
      const itemsToInsert = cart.map(entry => ({
        order_id: insertedOrder.id,
        product_name: entry.item.name,
        product_id: entry.item.id,
        quantity: entry.quantity,
        unit_price: entry.item.price,
        subtotal: entry.item.price * entry.quantity,
        notes: null,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);
      if (itemsError) {
        console.error('Error inserting order items:', itemsError);
        return null;
      }

      // Actualizar estado local
      const newOrder: Order = {
        id: insertedOrder.id?.toString() || `ORD-${Date.now()}`,
        items: cart.map(c => ({ item: c.item, quantity: c.quantity })),
        total: payload.total,
        customerName: payload.customerName,
        phone: payload.phone,
        address: payload.address,
        deliveryType: payload.deliveryType,
        paymentMethod: payload.paymentMethod,
        status: 'pending',
        placedAt: Date.now(),
      };

      setOrders((prev) => [newOrder, ...prev]);
      clearCart();

      return insertedOrder;
    } catch (err) {
      console.error('placeOrder error:', err);
      return null;
    }
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
