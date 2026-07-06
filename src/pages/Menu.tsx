import React, { useMemo, useState, useEffect, type FormEvent } from 'react';
import {
  Plus,
  Trash2,
  ShoppingBag,
  X,
  CreditCard,
  Wallet,
  MapPin,
  Phone,
  Check,
  Navigation,
  Clock,
  UtensilsCrossed,
  Truck,
} from 'lucide-react';

import { MENU_ITEMS, CATEGORIES, type MenuItem, type Category } from '../data/menuData';
import { useCart } from '../context/CartContext';
import HeroPremium from '../components/HeroPremium';
import ProductCardPremium from '../components/ProductCardPremium';

type FilterCategory = 'todas' | Category;
type PaymentMethod = 'efectivo' | 'yappy';
type DeliveryType = 'local' | 'delivery' | null;

// Small inline SVG icons for the categories (single-color, easy to style)
function AllStarsIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 2l2.6 5.3L20 9l-4 3.3L17.2 20 12 16.7 6.8 20 8 12.3 4 9l5.4-1.7L12 2z" />
    </svg>
  );
}

function HotdogIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M2 12c0-3 4-6 10-6s10 3 10 6-4 6-10 6S2 15 2 12z" />
      <path d="M4 12v2c0 1.5 3 3 8 3s8-1.5 8-3v-2" />
    </svg>
  );
}

function BurgerIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="3" y="6" width="18" height="3" rx="1" />
      <path d="M3 12h18v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2z" />
      <rect x="5" y="17" width="14" height="2" rx="1" />
    </svg>
  );
}

function FriesIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M7 4l1.5 12.5a2 2 0 0 0 2 1.8h3a2 2 0 0 0 2-1.8L17 4" />
      <path d="M10 6v6" />
      <path d="M14 6v6" />
    </svg>
  );
}

function DrinkIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M8 3h8l-1 6a4 4 0 0 1-6 0L8 3z" />
      <path d="M12 14v6" />
    </svg>
  );
}

function CategoryScroller({ setActiveCategory, activeCategory }: { setActiveCategory: (c: FilterCategory) => void; activeCategory: FilterCategory }) {
  return (
    <div className="relative">
      <div className="overflow-hidden rounded-full border border-white/10 bg-white/5">
        <div className="flex min-w-full gap-2 overflow-x-auto whitespace-nowrap px-3 py-3 scroll-smooth ios-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as FilterCategory)}
              className={`shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-300 ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black shadow-[0_6px_20px_rgba(245,158,11,0.28)]'
                  : 'bg-white/6 text-gray-300 border border-white/10 hover:border-amber-400/30 hover:bg-white/10'
              }`}
            >
              <span className={`${activeCategory === cat.id ? 'text-amber-300' : 'text-gray-400'}`}>
                {cat.id === 'todas' && <AllStarsIcon className="w-4 h-4" />}
                {cat.id === 'hotdogs' && <HotdogIcon className="w-4 h-4" />}
                {cat.id === 'hamburguesas' && <BurgerIcon className="w-4 h-4" />}
                {cat.id === 'salchipapas' && <FriesIcon className="w-4 h-4" />}
                {cat.id === 'pepitos' && <HotdogIcon className="w-4 h-4" />}
                {cat.id === 'arepas' && <FriesIcon className="w-4 h-4" />}
                {cat.id === 'extras' && <DrinkIcon className="w-4 h-4" />}
              </span>
              <span className="truncate max-w-[8rem]">{cat.id === 'todas' ? 'TODOS' : cat.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Menu() {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('todas');
  const [search, setSearch] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>(null);
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [trackingStep, setTrackingStep] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  const { cart, addToCart, removeFromCart, total, itemCount, clearCart, placeOrder } = useCart();

  useEffect(() => {
    if (!orderPlaced) return;
    const timers = [3000, 6000, 9000].map((ms, i) =>
      setTimeout(() => setTrackingStep(i + 1), ms)
    );
    return () => timers.forEach((t) => clearTimeout(t));
  }, [orderPlaced]);

  const filtered = useMemo(() => {
    return MENU_ITEMS.filter((item) => {
      const matchCat = activeCategory === 'todas' || item.category === activeCategory;
      const q = search.trim().toLowerCase();
      const matchSearch = !q || item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [activeCategory, search]);

  const deliveryFee = deliveryType === 'delivery' ? 2.0 : 0;
  const grandTotal = total + (total > 0 ? deliveryFee : 0);

  const handleCheckout = () => {
    if (itemCount === 0) return;
    setOrderPlaced(false);
    setDeliveryType(null);
    setUbicacion(null);
    setCheckoutOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const handleCloseCheckout = () => {
    setCheckoutOpen(false);
    setDeliveryType(null);
    setUbicacion(null);
    document.body.style.overflow = '';
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => alert('No pudimos obtener tu ubicación.')
      );
    } else {
      alert('Tu navegador no soporta geolocalización.');
    }
  };

  const handlePlaceOrder = (e: FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Ingresa tu nombre y teléfono para completar el pedido.');
      return;
    }

    if (deliveryType === 'delivery' && !customerAddress.trim() && !ubicacion) {
      alert('Ingresa tu dirección o comparte tu ubicación.');
      return;
    }

    placeOrder({
      items: cart,
      total: grandTotal,
      customerName: customerName.trim(),
      phone: customerPhone.trim(),
      address: deliveryType === 'delivery'
        ? ubicacion
          ? `Lat ${ubicacion.lat.toFixed(4)}, Lng ${ubicacion.lng.toFixed(4)}`
          : customerAddress.trim()
        : undefined,
      deliveryType: deliveryType!,
      paymentMethod,
    });

    setOrderPlaced(true);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setUbicacion(null);
  };

  return (
    <div className="bg-black min-h-screen pt-16 pb-32">
      <HeroPremium value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="sticky top-16 z-30 border-b border-amber-500/5 bg-gradient-to-r from-black via-black/98 to-black/95 py-5 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CategoryScroller setActiveCategory={setActiveCategory} activeCategory={activeCategory} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <div>
            <p className="text-gray-200 text-sm font-semibold">{filtered.length} platillo{filtered.length !== 1 ? 's' : ''} disponibles</p>
            <p className="text-xs text-amber-300/70 mt-1.5 font-medium">Todos listos para preparar</p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">No encontramos lo que buscas</p>
            <p className="text-sm mt-2">Intenta con otro nombre o categoría</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((item) => (
              <ProductCardPremium key={item.id} item={item} onAdd={() => addToCart(item)} compact={activeCategory === 'todas'} />
            ))}
          </div>
        )}
      </div>

      {itemCount > 0 && (
        <div className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2">
          <button
            onClick={handleCheckout}
            className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-black text-stone-950 shadow-lg"
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="text-base font-black">${grandTotal.toFixed(2)}</span>
            <span className="text-xs uppercase tracking-[0.4em] font-black">Hacer pedido</span>
          </button>
        </div>
      )}

      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 backdrop-blur-sm px-4 py-6 overflow-y-auto sm:items-center sm:py-12">
          <div className="relative w-full max-w-5xl overflow-hidden rounded-[2rem] border border-amber-400/20 bg-[#0c0b0f]/95 shadow-[0_32px_96px_rgba(0,0,0,0.65)] max-h-[90vh]">
            <button
              onClick={handleCloseCheckout}
              className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-gray-300 transition hover:bg-white/15"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="grid gap-6 p-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-6">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_8px_28px_rgba(0,0,0,0.25)]">
                  <div className="mb-4 flex items-center gap-3 text-sm uppercase tracking-[0.35em] text-amber-200 font-bold">
                    <CreditCard className="h-4 w-4" />
                    Tu pedido
                  </div>
                  <div className="space-y-4 max-h-[44vh] overflow-auto pr-1">
                    {cart.length === 0 ? (
                      <div className="rounded-2xl bg-white/5 p-4 text-center text-sm text-gray-300">No hay artículos en el carrito.</div>
                    ) : (
                      cart.map(({ item, quantity }) => (
                        <div key={item.id} className="flex items-center justify-between gap-3 border-b border-white/10 py-3 last:border-0">
                          <div>
                            <p className="text-sm font-semibold text-white">{item.name}</p>
                            <p className="text-xs text-gray-400">x{quantity}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="text-sm font-bold text-amber-300">${(item.price * quantity).toFixed(2)}</p>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              className="rounded-full bg-red-500/20 p-1.5 text-red-400 transition hover:bg-red-500/30"
                              aria-label={`Quitar ${item.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-gray-200">
                  <div className="flex justify-between">
                    <span className="font-medium">Comida</span>
                    <span className="font-semibold">${total.toFixed(2)}</span>
                  </div>
                  {deliveryType === 'delivery' && (
                    <div className="flex justify-between text-amber-200">
                      <span className="font-medium">Envío</span>
                      <span className="font-semibold">+$2.00</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-white/10 pt-3 text-base font-black text-white">
                    <span>Total</span>
                    <span className="text-amber-300">${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {orderPlaced ? (
                  <div className="space-y-5 rounded-3xl border border-emerald-400/20 bg-emerald-900/5 p-5 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                      <Check className="h-6 w-6" />
                    </div>
                    <h4 className="text-xl font-black text-white">¡Pedido confirmado!</h4>
                    <p className="text-sm text-emerald-100/80">Estamos preparando tu orden con cuidado.</p>
                    <button
                      onClick={handleCloseCheckout}
                      className="mt-4 w-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 font-black text-stone-950"
                    >
                      Volver al menú
                    </button>
                  </div>
                ) : !deliveryType ? (
                  <div className="grid gap-3">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('local')}
                      className={`rounded-3xl border p-4 text-left transition ${deliveryType === 'local' ? 'border-amber-400/60 bg-amber-500/10' : 'border-white/10 bg-white/5 hover:border-amber-400/30'}`}
                    >
                      <p className="text-sm font-black text-white">Recoger en tienda</p>
                      <p className="text-xs text-gray-400 mt-2">Retira tu orden cuando esté lista.</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType('delivery')}
                      className={`rounded-3xl border p-4 text-left transition ${deliveryType === 'delivery' ? 'border-amber-400/60 bg-amber-500/10' : 'border-white/10 bg-white/5 hover:border-amber-400/30'}`}
                    >
                      <p className="text-sm font-black text-white">Entregar a domicilio</p>
                      <p className="text-xs text-gray-400 mt-2">Te lo llevamos (+$2).</p>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handlePlaceOrder} className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="rounded-3xl border border-white/10 bg-white/5 p-4">
                        <span className="text-xs uppercase tracking-[0.3em] text-amber-200 font-semibold">A nombre de</span>
                        <input
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Ej. Juan Pérez"
                          className="mt-3 w-full bg-transparent text-white outline-none"
                        />
                      </label>
                      <label className="rounded-3xl border border-white/10 bg-white/5 p-4">
                        <span className="text-xs uppercase tracking-[0.3em] text-amber-200 font-semibold">Teléfono</span>
                        <input
                          required
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="Ej. 6789-1234"
                          className="mt-3 w-full bg-transparent text-white outline-none"
                        />
                      </label>
                    </div>

                    {deliveryType === 'delivery' && (
                      <label className="rounded-3xl border border-white/10 bg-white/5 p-4">
                        <span className="text-xs uppercase tracking-[0.3em] text-amber-200 font-semibold">Dirección</span>
                        {ubicacion ? (
                          <div className="mt-3 text-sm font-semibold text-white">✓ Ubicación confirmada</div>
                        ) : (
                          <input
                            value={customerAddress}
                            onChange={(e) => setCustomerAddress(e.target.value)}
                            placeholder="Calle, número, apto"
                            className="mt-3 w-full bg-transparent text-white outline-none"
                          />
                        )}
                      </label>
                    )}

                    {deliveryType === 'delivery' && (
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        className="w-full rounded-3xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-200"
                      >
                        Compartir mi ubicación
                      </button>
                    )}

                    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-amber-200 font-semibold">¿Cómo deseas pagar?</p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('efectivo')}
                          className={`rounded-3xl border px-4 py-3 text-left transition ${paymentMethod === 'efectivo' ? 'border-amber-400/60 bg-amber-500/10 text-amber-100' : 'border-white/10 bg-white/6 text-gray-200 hover:border-amber-400/30'}`}
                        >
                          <div className="flex items-center gap-2 font-semibold">
                            <Wallet className="h-4 w-4" /> Efectivo
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('yappy')}
                          className={`rounded-3xl border px-4 py-3 text-left transition ${paymentMethod === 'yappy' ? 'border-amber-400/60 bg-amber-500/10 text-amber-100' : 'border-white/10 bg-white/6 text-gray-200 hover:border-amber-400/30'}`}
                        >
                          <div className="flex items-center gap-2 font-semibold">
                            <CreditCard className="h-4 w-4" /> Yappy
                          </div>
                        </button>
                      </div>
                    </div>

                    <button type="submit" className="w-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 font-black text-stone-950">
                      Confirmar y pagar
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
