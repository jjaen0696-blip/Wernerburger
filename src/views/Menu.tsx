import { useEffect, useState, useMemo } from 'react';
import {
  ArrowLeft, Plus, Minus, Trash2, ShoppingBag, X, Check, Loader2, Search, Heart, Filter,
} from 'lucide-react';
import WernerLogo from '../components/WernerLogo';
import { supabase, type MenuItem, type CartItem } from '../lib/supabase';

type Props = {
  onBack: () => void;
  onOrderPlaced: (orderNumber: number) => void;
  locationId: string;
};

const CATEGORY_ORDER = ['Hot Dogs', 'Pepitos', 'Salchipapas', 'Hamburguesas', 'Arepas', 'Papas', 'Bebidas', 'Postres', 'Extras'];

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

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

  const filteredItems = useMemo(() => {
    let filtered = items;

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query),
      );
    }

    // Filtrar por categoría
    if (selectedCategory) {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    return filtered;
  }, [items, searchQuery, selectedCategory]);

  const grouped = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const item of filteredItems) {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category)!.push(item);
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({
      category: c,
      items: map.get(c)!,
    }));
  }, [filteredItems]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const item of items) {
      cats.add(item.category);
    }
    return CATEGORY_ORDER.filter((c) => cats.has(c));
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

  const toggleFavorite = (itemId: string) => {
    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
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
    <div className="min-h-screen bg-[#c8102e] pb-32 sm:pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#c8102e] border-b-4 border-yellow-400">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-3 flex items-center justify-between gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white hover:text-yellow-300 font-bold transition-colors p-2 -m-2 min-h-[44px] min-w-[44px] justify-center sm:p-0 sm:m-0 sm:min-h-auto sm:min-w-auto"
          >
            <ArrowLeft className="w-6 h-6 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline text-base">Inicio</span>
          </button>
          <div className="flex-1 flex justify-center">
            <WernerLogo size="sm" />
          </div>
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 px-3 sm:px-4 py-3 sm:py-2 rounded-xl bg-yellow-400 text-black font-black hover:bg-yellow-300 transition-colors min-h-[44px] text-sm sm:text-base"
          >
            <ShoppingBag className="w-6 h-6 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Carrito</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-7 h-7 sm:w-6 sm:h-6 rounded-full bg-black text-yellow-400 text-xs font-black flex items-center justify-center">
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

        {/* Search and filters */}
        <div className="mb-8 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar en el menú..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 sm:py-3 rounded-xl bg-black/20 border-2 border-yellow-400/40 text-white placeholder-white/40 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all text-base"
            />
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-3 sm:py-2 rounded-lg font-bold transition-all min-h-[44px] sm:min-h-auto text-sm sm:text-base ${
                selectedCategory === null
                  ? 'bg-yellow-400 text-black'
                  : 'bg-black/20 border-2 border-yellow-400/40 text-white hover:border-yellow-400'
              }`}
            >
              <Filter className="w-4 h-4 inline mr-2" />
              Todas
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-3 sm:py-2 rounded-lg font-bold transition-all min-h-[44px] sm:min-h-auto text-sm sm:text-base ${
                  selectedCategory === cat
                    ? 'bg-yellow-400 text-black'
                    : 'bg-black/20 border-2 border-yellow-400/40 text-white hover:border-yellow-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Category columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {grouped.map((col) => (
            <div
              key={col.category}
              className="bg-black/20 rounded-2xl border-2 border-yellow-400/40 overflow-hidden"
            >
              {/* Category header */}
              <div className="bg-yellow-400 px-4 py-4 sm:py-3 text-center">
                <h2
                  className="text-xl sm:text-2xl font-black uppercase text-black"
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
                    className="flex gap-3 p-4 sm:p-4 hover:bg-black/40 transition-all group relative"
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-20 h-20 sm:w-16 sm:h-16 rounded-lg object-cover border-2 border-yellow-400/50 group-hover:border-yellow-400 transition-all"
                      />
                      <button
                        onClick={() => toggleFavorite(item.id)}
                        className="absolute -top-2 -right-2 p-2 sm:p-1.5 rounded-full bg-black border-2 border-yellow-400 hover:bg-yellow-400 hover:text-black transition-all min-w-[32px] min-h-[32px] flex items-center justify-center"
                      >
                        <Heart
                          className={`w-5 h-5 sm:w-4 sm:h-4 ${
                            favorites.has(item.id)
                              ? 'fill-current text-red-500'
                              : 'text-yellow-400'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3
                            className="font-black text-white leading-tight text-sm sm:text-base"
                            style={{ fontFamily: "'Arial Black', sans-serif" }}
                          >
                            {item.name}
                          </h3>
                          <p className="text-xs text-white/70 leading-snug mt-0.5 mb-2 line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                        <span
                          className="font-black text-yellow-400 whitespace-nowrap text-sm sm:text-base"
                          style={{ fontFamily: "'Arial Black', sans-serif" }}
                        >
                          ${item.price.toFixed(2)}
                        </span>
                      </div>
                      <button
                        onClick={() => addToCart(item)}
                        className="flex items-center gap-1.5 px-4 py-3 sm:px-3 sm:py-1.5 rounded-lg bg-yellow-400 text-black font-black text-sm sm:text-xs uppercase hover:bg-yellow-300 transition-all active:scale-95 hover:shadow-lg min-h-[44px] sm:min-h-auto"
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

      {/* Floating cart button with animation */}
      {cartCount > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-6 py-4 sm:py-3.5 rounded-2xl bg-black text-white font-black shadow-2xl hover:bg-stone-800 hover:shadow-yellow-400/50 transition-all active:scale-95 border-2 border-yellow-400 animate-pulse min-h-[48px]"
        >
          <ShoppingBag className="w-5 h-5 text-yellow-400" />
          <span>
            {cartCount} {cartCount === 1 ? 'artículo' : 'artículos'}
          </span>
          <span className="text-yellow-400 font-black">${cartTotal.toFixed(2)}</span>
        </button>
      )}

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-md max-h-screen bg-[#c8102e] flex flex-col shadow-2xl animate-slide-in rounded-t-3xl sm:rounded-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b-2 border-yellow-400">
              <h2
                className="text-xl font-black text-white flex items-center gap-2"
                style={{ fontFamily: "'Arial Black', sans-serif" }}
              >
                <ShoppingBag className="w-6 h-6 sm:w-5 sm:h-5 text-yellow-400" />
                Tu Carrito
              </h2>
              <button
                onClick={() => setCartOpen(false)}
                className="p-3 sm:p-2 rounded-lg hover:bg-black/20 transition-colors -m-3 sm:-m-2 min-w-[44px] min-h-[44px] sm:min-h-auto sm:min-w-auto flex items-center justify-center"
              >
                <X className="w-6 h-6 sm:w-5 sm:h-5 text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 min-h-[100px]">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-8">
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
                      key={`${c.menu_item.id}-${c.notes}`}
                      className="flex gap-3 p-4 rounded-xl bg-black/30 border-2 border-yellow-400/30 hover:border-yellow-400/60 transition-all group"
                    >
                      <img
                        src={c.menu_item.image_url}
                        alt={c.menu_item.name}
                        className="w-16 h-16 sm:w-14 sm:h-14 rounded-lg object-cover border border-yellow-400/40 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4
                              className="font-black text-white text-sm leading-tight"
                              style={{ fontFamily: "'Arial Black', sans-serif" }}
                            >
                              {c.menu_item.name}
                            </h4>
                            {c.notes && (
                              <p className="text-xs text-yellow-300 mt-1 italic">
                                Nota: {c.notes}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => removeItem(c.menu_item.id)}
                            className="text-white/50 hover:text-red-300 transition-colors flex-shrink-0 p-2 -m-2 min-w-[40px] min-h-[40px] flex items-center justify-center"
                          >
                            <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQty(c.menu_item.id, -1)}
                              className="w-8 h-8 sm:w-6 sm:h-6 rounded-md bg-black/50 hover:bg-black transition-colors flex items-center justify-center"
                            >
                              <Minus className="w-4 h-4 sm:w-3 sm:h-3 text-white" />
                            </button>
                            <span className="font-black text-white w-6 text-center text-base sm:text-sm">
                              {c.quantity}
                            </span>
                            <button
                              onClick={() => updateQty(c.menu_item.id, 1)}
                              className="w-8 h-8 sm:w-6 sm:h-6 rounded-md bg-yellow-400/30 hover:bg-yellow-400/50 transition-colors flex items-center justify-center"
                            >
                              <Plus className="w-4 h-4 sm:w-3 sm:h-3 text-white" />
                            </button>
                          </div>
                          <span className="font-black text-yellow-400 text-lg sm:text-base">
                            ${(c.menu_item.price * c.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t-2 border-yellow-400 px-5 py-4 space-y-3 bg-gradient-to-t from-black/20">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-white/70 text-xs font-bold">SUBTOTAL</p>
                    <p className="text-sm text-white/60">{cartCount} {cartCount === 1 ? 'ítem' : 'ítems'}</p>
                  </div>
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
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-300 text-black font-black uppercase hover:from-yellow-300 hover:to-yellow-200 transition-all active:scale-95 shadow-lg shadow-yellow-400/30 text-base min-h-[48px]"
                >
                  <ShoppingBag className="w-6 h-6 sm:w-5 sm:h-5 inline mr-2" />
                  Realizar Pedido
                </button>
                <button
                  onClick={() => setCartOpen(false)}
                  className="w-full py-3 rounded-xl bg-black/50 text-white font-bold uppercase hover:bg-black/70 transition-all text-sm min-h-[44px]"
                >
                  Continuar Comprando
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
          <div className="relative bg-[#c8102e] rounded-2xl shadow-2xl w-full max-w-md max-h-screen overflow-y-auto p-6 animate-pop-in border-2 border-yellow-400">
            <div className="flex items-center justify-between mb-5">
              <h2
                className="text-xl font-black text-white"
                style={{ fontFamily: "'Arial Black', sans-serif" }}
              >
                Confirmar Pedido
              </h2>
              <button
                onClick={() => !submitting && setCheckoutOpen(false)}
                className="p-3 sm:p-2 rounded-lg hover:bg-black/20 transition-colors -m-3 sm:-m-2 min-w-[44px] min-h-[44px] sm:min-h-auto sm:min-w-auto flex items-center justify-center"
              >
                <X className="w-6 h-6 sm:w-5 sm:h-5 text-white" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-base sm:text-sm font-bold text-white mb-3 sm:mb-2">
                  👤 Tu nombre
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ej. María González"
                  className="w-full px-4 py-3 rounded-xl bg-black/20 border-2 border-yellow-400/40 text-white placeholder-white/40 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all font-bold text-base"
                  disabled={submitting}
                  minHeight="44px"
                />
              </div>

              <div>
                <label className="block text-base sm:text-sm font-bold text-white mb-3 sm:mb-2">
                  📝 Notas especiales (opcional)
                </label>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Ej. Sin cebolla, extra queso, que sea rápido..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-black/20 border-2 border-yellow-400/40 text-white placeholder-white/40 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all resize-none text-base"
                  disabled={submitting}
                />
              </div>

              {/* Order summary */}
              <div className="bg-black/40 rounded-xl p-4 space-y-3 border-2 border-yellow-400/30">
                <h4 className="font-black text-white uppercase text-sm">📦 Resumen del Pedido</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {cart.map((c) => (
                    <div key={`${c.menu_item.id}-${c.notes}`} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <span className="text-white/80">
                          {c.quantity}× {c.menu_item.name}
                        </span>
                        {c.notes && (
                          <p className="text-xs text-yellow-300 italic">
                            ({c.notes})
                          </p>
                        )}
                      </div>
                      <span className="font-black text-yellow-400 flex-shrink-0 ml-2">
                        ${(c.menu_item.price * c.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-yellow-400/30 pt-3 flex justify-between items-end">
                  <span className="font-black text-white uppercase text-sm">Total a pagar</span>
                  <span
                    className="font-black text-yellow-400 text-2xl"
                    style={{ fontFamily: "'Arial Black', sans-serif" }}
                  >
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {submitError && (
                <div className="p-3 rounded-lg bg-red-500/20 border-2 border-red-400 text-red-200 text-sm font-bold">
                  ⚠️ {submitError}
                </div>
              )}

              <button
                onClick={placeOrder}
                disabled={submitting || !customerName.trim()}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-300 text-black font-black uppercase hover:from-yellow-300 hover:to-yellow-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-yellow-400/30 text-base min-h-[48px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-6 h-6 sm:w-5 sm:h-5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Check className="w-6 h-6 sm:w-5 sm:h-5" />
                    Confirmar Pedido
                  </>
                )}
              </button>

              <button
                onClick={() => !submitting && setCheckoutOpen(false)}
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-black/50 text-white font-bold uppercase hover:bg-black/70 transition-all text-sm min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Volver al Carrito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
