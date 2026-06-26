import { useEffect, useState, useMemo } from 'react';
import {
  ArrowLeft, Plus, Minus, Trash2, ShoppingBag, X, Check, Loader2,
} from 'lucide-react';
import WernerLogo from '../components/WernerLogo';
import { supabase, type MenuItem, type CartItem } from '../lib/supabase';

type Props = {
  onBack: () => void;
  onOrderPlaced: (orderNumber: number) => void;
  locationId: string;
};

const CATEGORY_ORDER = ['Hot Dogs', 'Salchipapas', 'Hamburguesas', 'Arepas', 'Sándwiches', 'Papas', 'Bebidas', 'Postres', 'Extras'];

export default function Menu({ onBack, onOrderPlaced, locationId }: Props) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const fetchQuery = supabase
          .from('menu_items')
          .select('*')
          .eq('available', true)
          .order('category')
          .order('sort_order');

        const { data: itemsByLocation, error: queryError } = locationId === 'default'
          ? { data: null, error: null }
          : await fetchQuery.eq('location_id', locationId);

        if (queryError) {
          const { data, error } = await fetchQuery;
          if (error) {
            throw error;
          }
          setItems(data ?? []);
        } else if (itemsByLocation && itemsByLocation.length > 0) {
          setItems(itemsByLocation);
        } else {
          const { data, error } = await fetchQuery;
          if (error) {
            throw error;
          }
          setItems(data ?? []);
        }
      } catch (err) {
        setError('No se pudo cargar el menú. Inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [locationId]);

  const grouped = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const item of items) {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category)!.push(item);
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({
      category: c,
      items: map.get(c)!,
    }));
  }, [items]);

  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);
  const cartTotal = cart.reduce((sum, c) => sum + c.quantity * c.menu_item.price, 0);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menu_item.id === item.id && !c.notes);
      if (existing) {
        return prev.map((c) =>
          c.menu_item.id === item.id && !c.notes ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [...prev, { menu_item: item, quantity: 1, notes: '' }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.menu_item.id === id ? { ...c, quantity: c.quantity + delta } : c,
        )
        .filter((c) => c.quantity > 0),
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((c) => c.menu_item.id !== id));
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const rpcLocationId = locationId === 'default' ? null : locationId;
      const { data: numResult, error: rpcError } = await supabase.rpc('next_order_number', {
        p_location_id: rpcLocationId,
      });
      const orderNumber = typeof numResult === 'number' ? numResult : 1;
      if (rpcError && rpcError.message) {
        console.warn('next_order_number fallback:', rpcError.message);
      }

      const orderPayload: Record<string, unknown> = {
        number: orderNumber,
        status: 'pending',
        customer_name: customerName.trim() || 'Cliente',
        notes: orderNotes.trim(),
        total: Number(cartTotal.toFixed(2)),
      };
      if (rpcLocationId) {
        orderPayload.location_id = rpcLocationId;
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select()
        .single();

      if (orderError || !order) {
        throw new Error(orderError?.message ?? 'Error al crear el pedido');
      }

      const orderItems = cart.map((c) => ({
        order_id: order.id,
        menu_item_id: c.menu_item.id,
        name: c.menu_item.name,
        quantity: c.quantity,
        unit_price: c.menu_item.price,
        notes: c.notes,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      setCart([]);
      setCustomerName('');
      setOrderNotes('');
      setCheckoutOpen(false);
      setCartOpen(false);
      onOrderPlaced(orderNumber);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error al enviar el pedido');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#c8102e] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#c8102e] flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-white font-bold">{error}</p>
        <button onClick={onBack} className="text-yellow-400 font-bold underline">
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#c8102e] pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#c8102e] border-b-4 border-yellow-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white hover:text-yellow-300 font-bold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Inicio</span>
          </button>
          <WernerLogo size="sm" />
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-400 text-black font-black hover:bg-yellow-300 transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="hidden sm:inline">Carrito</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black text-yellow-400 text-xs font-black flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Menu board */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Title banner */}
        <div className="text-center mb-8">
          <h1
            className="text-4xl sm:text-5xl font-black uppercase text-white"
            style={{
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
              letterSpacing: '0.03em',
            }}
          >
            Nuestro Menú
          </h1>
          <div className="w-24 h-1 bg-yellow-400 mx-auto mt-3 rounded-full" />
        </div>

        {/* Category columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {grouped.map((col) => (
            <div
              key={col.category}
              className="bg-black/20 rounded-2xl border-2 border-yellow-400/40 overflow-hidden"
            >
              {/* Category header */}
              <div className="bg-yellow-400 px-4 py-3 text-center">
                <h2
                  className="text-2xl font-black uppercase text-black"
                  style={{
                    fontFamily: "'Arial Black', 'Impact', sans-serif",
                    letterSpacing: '0.04em',
                  }}
                >
                  {col.category}
                </h2>
              </div>

              {/* Items */}
              <div className="divide-y divide-yellow-400/20">
                {col.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 p-4 hover:bg-black/30 transition-colors group"
                  >
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border-2 border-yellow-400/50"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          className="font-black text-white leading-tight"
                          style={{ fontFamily: "'Arial Black', sans-serif" }}
                        >
                          {item.name}
                        </h3>
                        <span
                          className="font-black text-yellow-400 whitespace-nowrap"
                          style={{ fontFamily: "'Arial Black', sans-serif" }}
                        >
                          ${item.price.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm text-white/70 leading-snug mt-0.5 mb-2">
                        {item.description}
                      </p>
                      <button
                        onClick={() => addToCart(item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-400 text-black font-black text-xs uppercase hover:bg-yellow-300 transition-all active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Agregar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating cart button */}
      {cartCount > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-black text-white font-black shadow-2xl hover:bg-stone-800 transition-all active:scale-95 border-2 border-yellow-400"
        >
          <ShoppingBag className="w-5 h-5 text-yellow-400" />
          {cartCount} {cartCount === 1 ? 'artículo' : 'artículos'}
          <span className="text-yellow-400">${cartTotal.toFixed(2)}</span>
        </button>
      )}

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-md bg-[#c8102e] h-full flex flex-col shadow-2xl animate-slide-in">
            <div className="flex items-center justify-between px-5 py-4 border-b-2 border-yellow-400">
              <h2
                className="text-xl font-black text-white flex items-center gap-2"
                style={{ fontFamily: "'Arial Black', sans-serif" }}
              >
                <ShoppingBag className="w-5 h-5 text-yellow-400" />
                Tu Carrito
              </h2>
              <button
                onClick={() => setCartOpen(false)}
                className="p-2 rounded-lg hover:bg-black/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 rounded-full bg-black/20 flex items-center justify-center mb-4">
                    <ShoppingBag className="w-8 h-8 text-yellow-400/50" />
                  </div>
                  <p className="text-white font-bold">Tu carrito está vacío</p>
                  <p className="text-sm text-white/60 mt-1">Agrega artículos del menú</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((c) => (
                    <div
                      key={c.menu_item.id}
                      className="flex gap-3 p-3 rounded-xl bg-black/20 border border-yellow-400/30"
                    >
                      <img
                        src={c.menu_item.image_url}
                        alt={c.menu_item.name}
                        className="w-16 h-16 rounded-lg object-cover border border-yellow-400/40"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            className="font-black text-white text-sm leading-tight"
                            style={{ fontFamily: "'Arial Black', sans-serif" }}
                          >
                            {c.menu_item.name}
                          </h4>
                          <button
                            onClick={() => removeItem(c.menu_item.id)}
                            className="text-white/50 hover:text-red-300 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-yellow-400 font-black text-sm mt-1">
                          ${(c.menu_item.price * c.quantity).toFixed(2)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQty(c.menu_item.id, -1)}
                            className="w-7 h-7 rounded-lg bg-black/30 hover:bg-black/50 flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5 text-white" />
                          </button>
                          <span className="font-black text-white w-6 text-center">
                            {c.quantity}
                          </span>
                          <button
                            onClick={() => updateQty(c.menu_item.id, 1)}
                            className="w-7 h-7 rounded-lg bg-black/30 hover:bg-black/50 flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5 text-white" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t-2 border-yellow-400 px-5 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold">Total</span>
                  <span
                    className="text-2xl font-black text-yellow-400"
                    style={{ fontFamily: "'Arial Black', sans-serif" }}
                  >
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setCartOpen(false);
                    setCheckoutOpen(true);
                  }}
                  className="w-full py-3.5 rounded-xl bg-yellow-400 text-black font-black uppercase hover:bg-yellow-300 transition-all active:scale-95"
                >
                  Realizar Pedido
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout modal */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !submitting && setCheckoutOpen(false)}
          />
          <div className="relative bg-[#c8102e] rounded-2xl shadow-2xl w-full max-w-md p-6 animate-pop-in border-2 border-yellow-400">
            <div className="flex items-center justify-between mb-5">
              <h2
                className="text-xl font-black text-white"
                style={{ fontFamily: "'Arial Black', sans-serif" }}
              >
                Confirmar Pedido
              </h2>
              <button
                onClick={() => !submitting && setCheckoutOpen(false)}
                className="p-2 rounded-lg hover:bg-black/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-white mb-1.5">
                  Tu nombre
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ej. María González"
                  className="w-full px-4 py-3 rounded-xl bg-black/20 border-2 border-yellow-400/40 text-white placeholder-white/40 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-white mb-1.5">
                  Notas del pedido (opcional)
                </label>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Ej. Sin cebolla, extra queso..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-black/20 border-2 border-yellow-400/40 text-white placeholder-white/40 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all resize-none"
                />
              </div>

              <div className="bg-black/20 rounded-xl p-4 space-y-2 border border-yellow-400/30">
                {cart.map((c) => (
                  <div key={c.menu_item.id} className="flex justify-between text-sm">
                    <span className="text-white/80">
                      {c.quantity}× {c.menu_item.name}
                    </span>
                    <span className="font-black text-yellow-400">
                      ${(c.menu_item.price * c.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="border-t border-yellow-400/30 pt-2 flex justify-between">
                  <span className="font-black text-white">Total</span>
                  <span
                    className="font-black text-yellow-400 text-lg"
                    style={{ fontFamily: "'Arial Black', sans-serif" }}
                  >
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {submitError && (
                <p className="text-sm text-red-200 font-bold">{submitError}</p>
              )}

              <button
                onClick={placeOrder}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-yellow-400 text-black font-black uppercase hover:bg-yellow-300 transition-all active:scale-95 disabled:opacity-60 disabled:active:scale-100"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Enviar Pedido
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
