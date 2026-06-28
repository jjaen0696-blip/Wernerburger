import { useEffect, useState, useMemo, useRef } from 'react';
import {
  ArrowLeft, Plus, Minus, Trash2, ShoppingBag, X, Check, Loader2, Search, Heart,
  ChevronLeft, ChevronRight, ChevronRight as ArrowRightIcon, Flame, Star, Sparkles, Clock,
  Store, Bike, Phone, MapPin, Navigation, LocateFixed,
} from 'lucide-react';
import WernerLogo from '../components/WernerLogo';
import { supabase, type MenuItem, type CartItem, type OrderType } from '../lib/supabase';

type Props = {
  onBack: () => void;
  onOrderPlaced: (order: { id: string; number: number; type: OrderType }) => void;
  locationId: string;
};

const CATEGORY_ORDER = ['Hot Dogs', 'Pepitos', 'Salchipapas', 'Hamburguesas', 'Arepas', 'Papas', 'Bebidas', 'Postres', 'Extras'];

// Presentational metadata per category — used for icons & accent colors.
// Falls back gracefully for any category not listed (data is dynamic).
const CATEGORY_META: Record<string, { emoji: string; blurb: string; ring: string }> = {
  'Hot Dogs':     { emoji: '🌭', blurb: 'Pan suave, salchicha jugosa', ring: 'from-amber-400/30 to-red-600/20' },
  'Pepitos':      { emoji: '🥖', blurb: 'Rellenos y crujientes',       ring: 'from-orange-400/30 to-rose-600/20' },
  'Salchipapas':  { emoji: '🍟', blurb: 'El clásico irresistible',     ring: 'from-yellow-400/30 to-amber-600/20' },
  'Hamburguesas': { emoji: '🍔', blurb: 'Carne a la parrilla',         ring: 'from-red-500/30 to-yellow-500/20' },
  'Arepas':       { emoji: '🫓', blurb: 'Tradición venezolana',        ring: 'from-amber-300/30 to-orange-600/20' },
  'Papas':        { emoji: '🍟', blurb: 'Doradas y crocantes',         ring: 'from-yellow-300/30 to-amber-500/20' },
  'Bebidas':      { emoji: '🥤', blurb: 'Para refrescarte',            ring: 'from-sky-400/30 to-indigo-600/20' },
  'Postres':      { emoji: '🍰', blurb: 'El final perfecto',           ring: 'from-pink-400/30 to-rose-600/20' },
  'Extras':       { emoji: '✨', blurb: 'Acompañantes ideales',        ring: 'from-violet-400/30 to-fuchsia-600/20' },
};
const DEFAULT_META = { emoji: '🍴', blurb: 'Nuestras especialidades', ring: 'from-zinc-400/30 to-zinc-700/20' };
const metaFor = (c: string) => CATEGORY_META[c] ?? DEFAULT_META;

// First item of a category gets a "Popular" highlight (purely visual, derived from sort_order).
const isPopular = (item: MenuItem) => item.sort_order === 1;

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const hideBroken = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.opacity = '0';
};

/* ============================ Product Card ============================ */
function ProductCard({
  item, favorite, onAdd, onToggleFav,
}: {
  item: MenuItem;
  favorite: boolean;
  onAdd: (item: MenuItem) => void;
  onToggleFav: (id: string) => void;
}) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[26px] border border-white/10 bg-ink-800/80 shadow-card transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-glow-gold">
      {/* Image — ocupa casi la mitad de la tarjeta */}
      <div className="relative aspect-[5/4] overflow-hidden bg-gradient-to-br from-brand-dark/50 to-ink">
        <img
          src={item.image_url}
          alt={item.name}
          loading="lazy"
          onError={hideBroken}
          className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/5 to-transparent" />
        {/* Brillo ligero al hover */}
        <div className="pointer-events-none absolute -left-1/3 -top-1/2 h-[160%] w-1/3 rotate-12 bg-white/15 opacity-0 blur-2xl transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100" />

        {isPopular(item) && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gold-grad px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-ink shadow-soft">
            <Flame className="h-3 w-3" />
            Popular
          </span>
        )}

        <button
          onClick={() => onToggleFav(item.id)}
          aria-label="Agregar a favoritos"
          className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-ink/50 backdrop-blur-md transition-all duration-200 hover:scale-110 hover:border-white/30 active:scale-90"
        >
          <Heart className={`h-[18px] w-[18px] transition-colors ${favorite ? 'fill-brand-light text-brand-light' : 'text-white/90'}`} />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1.5 p-4 sm:p-5">
        <h3 className="font-display text-[15px] font-bold leading-tight text-white sm:text-base">
          {item.name}
        </h3>
        <p className="line-clamp-2 text-[12.5px] leading-snug text-white/50">
          {item.description}
        </p>

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="flex flex-col leading-none">
            <span className="mb-1 text-[9px] font-bold uppercase tracking-[0.15em] text-white/35">Precio</span>
            <span className="font-display text-gold-grad text-[26px] font-extrabold leading-none">
              ${item.price.toFixed(2)}
            </span>
          </div>
          <button
            onClick={() => onAdd(item)}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-yellow-cta px-3.5 py-2.5 text-[13px] font-extrabold uppercase tracking-wide text-ink shadow-glow-gold transition-all duration-200 hover:brightness-105 active:scale-90"
          >
            <Plus className="h-4 w-4" strokeWidth={3} />
            Agregar
          </button>
        </div>
      </div>
    </article>
  );
}

/* ============================ Carousel ============================ */
function ProductCarousel({
  category, items, favorites, onAdd, onToggleFav, onVerMas, id,
}: {
  category: string;
  items: MenuItem[];
  favorites: Set<string>;
  onAdd: (item: MenuItem) => void;
  onToggleFav: (id: string) => void;
  onVerMas: (c: string) => void;
  id: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const meta = metaFor(category);

  const update = () => {
    const el = scroller.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  useEffect(() => {
    update();
  }, [items]);

  const scrollByDir = (dir: number) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.9, 620), behavior: 'smooth' });
  };

  return (
    <section id={id} className="scroll-mt-44">
      {/* Section header */}
      <div className="mb-4 flex items-end justify-between gap-3 px-1">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-2xl shadow-soft">
            {meta.emoji}
          </span>
          <div>
            <h2 className="font-display text-xl font-extrabold uppercase tracking-tight text-white sm:text-2xl">
              {category}
            </h2>
            <p className="text-[12px] font-medium text-white/45">{items.length} opciones · {meta.blurb}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onVerMas(category)}
            className="hidden items-center gap-1 rounded-full border border-white/10 px-3.5 py-2 text-[12px] font-bold text-white/70 transition-colors hover:border-gold/40 hover:text-gold sm:inline-flex"
          >
            Ver más
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </button>
          <div className="hidden gap-1.5 lg:flex">
            <button
              onClick={() => scrollByDir(-1)}
              disabled={!canLeft}
              aria-label="Anterior"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white transition-all hover:border-gold/40 hover:text-gold disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scrollByDir(1)}
              disabled={!canRight}
              aria-label="Siguiente"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white transition-all hover:border-gold/40 hover:text-gold disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Track */}
      <div
        ref={scroller}
        onScroll={update}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scrollbar-hide px-4 pb-2 sm:mx-0 sm:gap-5 sm:px-1"
      >
        {items.map((item, i) => (
          <div
            key={item.id}
            className="reveal w-[78vw] shrink-0 snap-start sm:w-[260px] lg:w-[272px]"
            style={{ animationDelay: `${Math.min(i, 6) * 55}ms` }}
          >
            <ProductCard item={item} favorite={favorites.has(item.id)} onAdd={onAdd} onToggleFav={onToggleFav} />
          </div>
        ))}

        {/* Ver más tile */}
        <button
          onClick={() => onVerMas(category)}
          className="group flex w-[40vw] shrink-0 snap-start flex-col items-center justify-center gap-3 rounded-[26px] border border-dashed border-white/15 text-white/60 transition-all hover:border-gold/40 hover:text-gold sm:w-[150px]"
        >
          <span className="grid h-12 w-12 place-items-center rounded-full border border-white/15 transition-transform group-hover:scale-110">
            <ArrowRightIcon className="h-6 w-6" />
          </span>
          <span className="text-[13px] font-bold">Ver todo</span>
        </button>
      </div>
    </section>
  );
}

/* ============================ Cart Row ============================ */
function CartRow({
  line, onQty, onRemove,
}: {
  line: CartItem;
  onQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 transition-colors hover:border-gold/30">
      <img
        src={line.menu_item.image_url}
        alt={line.menu_item.name}
        onError={hideBroken}
        className="h-16 w-16 shrink-0 rounded-xl border border-white/10 object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-display text-[13.5px] font-bold leading-tight text-white line-clamp-2">
            {line.menu_item.name}
          </h4>
          <button
            onClick={() => onRemove(line.menu_item.id)}
            aria-label="Eliminar"
            className="-m-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-white/40 transition-colors hover:bg-white/5 hover:text-brand-light"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        {line.notes && <p className="mt-0.5 text-[11px] italic text-gold/80">Nota: {line.notes}</p>}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-ink/40 p-0.5">
            <button
              onClick={() => onQty(line.menu_item.id, -1)}
              className="grid h-7 w-7 place-items-center rounded-full text-white transition-colors hover:bg-white/10"
            >
              <Minus className="h-3.5 w-3.5" strokeWidth={3} />
            </button>
            <span className="w-5 text-center font-display text-sm font-bold text-white">{line.quantity}</span>
            <button
              onClick={() => onQty(line.menu_item.id, 1)}
              className="grid h-7 w-7 place-items-center rounded-full bg-gold/20 text-gold transition-colors hover:bg-gold/30"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={3} />
            </button>
          </div>
          <span className="font-display text-base font-extrabold text-gold-grad">
            ${(line.menu_item.price * line.quantity).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ============================ Skeletons ============================ */
function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-[26px] border border-white/10 bg-ink-800/60">
      <div className="skeleton aspect-[5/4] w-full" />
      <div className="space-y-3 p-5">
        <div className="skeleton h-4 w-3/4 rounded-full" />
        <div className="skeleton h-3 w-full rounded-full" />
        <div className="flex items-center justify-between pt-3">
          <div className="skeleton h-7 w-16 rounded-full" />
          <div className="skeleton h-9 w-24 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/* ============================ Main ============================ */
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

  // Tipo de entrega y datos de delivery
  const [orderType, setOrderType] = useState<OrderType>('pickup');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [geoError, setGeoError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  // Advertencia de stock por sucursal (no bloquea el pedido).
  const [stockShort, setStockShort] = useState<{ product_name: string }[]>([]);

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
      } catch {
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

  // Imágenes reales para el Hero (extraídas del menú existente, nunca placeholders)
  const heroImages = useMemo(() => {
    const byCat = (cats: string[]) => items.find((i) => cats.includes(i.category) && i.image_url);
    return {
      burger: byCat(['Hamburguesas']) ?? items[0],
      hotdog: byCat(['Hot Dogs', 'Pepitos']),
      fries: byCat(['Salchipapas', 'Papas']),
      drink: byCat(['Bebidas', 'Postres', 'Extras']),
    };
  }, [items]);

  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);
  const cartTotal = cart.reduce((sum, c) => sum + c.quantity * c.menu_item.price, 0);

  // Micro-interacción puramente visual del contador del carrito
  const [bump, setBump] = useState(false);
  useEffect(() => {
    if (cartCount === 0) return;
    setBump(true);
    const t = setTimeout(() => setBump(false), 360);
    return () => clearTimeout(t);
  }, [cartCount]);

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

  // Solicita la ubicación actual del navegador (solo para delivery).
  const requestLocation = () => {
    if (!('geolocation' in navigator)) {
      setGeoStatus('error');
      setGeoError('Tu dispositivo no permite compartir la ubicación.');
      return;
    }
    setGeoStatus('loading');
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setGeoStatus('success');
      },
      (err) => {
        setGeoStatus('error');
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? 'Permiso denegado. Activa la ubicación en tu navegador para enviar tu dirección.'
            : 'No se pudo obtener tu ubicación. Inténtalo de nuevo.',
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  // El delivery exige teléfono de contacto y ubicación compartida.
  const deliveryReady =
    orderType === 'pickup' || (customerPhone.trim() !== '' && coords !== null);

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
        order_type: orderType,
      };
      if (rpcLocationId) {
        orderPayload.location_id = rpcLocationId;
      }
      if (orderType === 'delivery') {
        orderPayload.customer_phone = customerPhone.trim();
        orderPayload.delivery_address = deliveryAddress.trim();
        if (coords) {
          orderPayload.delivery_lat = coords.lat;
          orderPayload.delivery_lng = coords.lng;
        }
      }

      // Campos de delivery añadidos por la migración 20260626130000. Si la migración
      // aún no se aplicó, PostgREST devuelve un error de columna desconocida: en ese caso
      // reintentamos sin esos campos para no romper el flujo de pedido.
      const insertOrder = (payload: Record<string, unknown>) =>
        supabase.from('orders').insert(payload).select().single();

      let { data: order, error: orderError } = await insertOrder(orderPayload);
      if (orderError && /order_type|customer_phone|delivery_|column|schema cache/i.test(orderError.message ?? '')) {
        const legacyPayload = { ...orderPayload };
        for (const k of ['order_type', 'customer_phone', 'delivery_address', 'delivery_lat', 'delivery_lng']) {
          delete legacyPayload[k];
        }
        ({ data: order, error: orderError } = await insertOrder(legacyPayload));
      }

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
      setOrderType('pickup');
      setCustomerPhone('');
      setDeliveryAddress('');
      setCoords(null);
      setGeoStatus('idle');
      setGeoError(null);
      setCheckoutOpen(false);
      setCartOpen(false);
      onOrderPlaced({ id: order.id, number: orderNumber, type: orderType });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error al enviar el pedido');
    } finally {
      setSubmitting(false);
    }
  };

  // Verifica disponibilidad de ingredientes en la sucursal antes de confirmar (advertencia previa).
  useEffect(() => {
    if (!checkoutOpen || locationId === 'default' || cart.length === 0) {
      setStockShort([]);
      return;
    }
    let active = true;
    (async () => {
      const items = cart.map((c) => ({ name: c.menu_item.name, qty: c.quantity }));
      const { data, error } = await supabase.rpc('check_stock_for_order', {
        p_location_id: locationId,
        p_items: items,
      });
      if (active && !error) setStockShort((data ?? []) as { product_name: string }[]);
    })();
    return () => { active = false; };
  }, [checkoutOpen, cart, locationId]);

  const isFiltering = selectedCategory !== null || searchQuery.trim() !== '';

  const scrollToMenu = () =>
    document.getElementById('menu-start')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const goToCategory = (c: string) =>
    document.getElementById(`cat-${slugify(c)}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  /* ---------- Loading (skeleton premium) ---------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-premium pb-24">
        <div className="sticky top-0 z-40 glass-strong border-b border-white/8">
          <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:px-6">
            <div className="skeleton h-10 w-10 rounded-full" />
            <div className="skeleton h-10 w-40 rounded-xl" />
            <div className="ml-auto skeleton h-11 w-28 rounded-2xl" />
          </div>
        </div>
        <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
          <div className="skeleton mb-8 h-56 w-full rounded-[32px] sm:h-72" />
          <div className="skeleton mb-6 h-8 w-52 rounded-full" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Error ---------- */
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-premium px-6 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-3xl">😕</div>
        <p className="max-w-sm font-display text-lg font-bold text-white">{error}</p>
        <button
          onClick={onBack}
          className="rounded-2xl bg-yellow-cta px-6 py-3 font-extrabold uppercase text-ink shadow-glow-gold transition-transform active:scale-95"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  /* ============================ Render ============================ */
  return (
    <div className="min-h-screen bg-premium text-white">
      {/* ===================== HEADER FIJO ===================== */}
      <header className="sticky top-0 z-40 glass-strong border-b border-white/8">
        <div className="mx-auto max-w-[1400px] px-3 sm:px-6">
          {/* Row 1 */}
          <div className="flex items-center gap-3 py-3">
            <button
              onClick={onBack}
              aria-label="Volver al inicio"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/80 transition-all hover:border-gold/40 hover:text-gold"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="shrink-0">
              <WernerLogo size="md" />
            </div>

            {/* Buscador (desktop) */}
            <div className="relative mx-auto hidden w-full max-w-xl md:block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />
              <input
                type="text"
                placeholder="Busca tu antojo… hamburguesa, hot dog, papas"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.05] py-3 pl-12 pr-10 text-[15px] text-white placeholder-white/35 outline-none transition-all focus:border-gold/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-gold/15"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Limpiar"
                  className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-white/40 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Carrito */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative ml-auto flex shrink-0 items-center gap-2 rounded-2xl bg-yellow-cta px-3.5 py-3 font-extrabold text-ink shadow-glow-gold transition-all hover:brightness-105 active:scale-95 sm:px-5"
            >
              <ShoppingBag className="h-5 w-5" />
              <span className="hidden sm:inline">Carrito</span>
              {cartTotal > 0 && (
                <span className="hidden font-display text-sm sm:inline">· ${cartTotal.toFixed(2)}</span>
              )}
              {cartCount > 0 && (
                <span className={`absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-ink text-[11px] font-black text-gold ${bump ? 'animate-cart-pop' : ''}`}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Buscador (mobile) */}
          <div className="relative pb-3 md:hidden">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />
            <input
              type="text"
              placeholder="Busca tu antojo…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.05] py-3 pl-12 pr-10 text-[15px] text-white placeholder-white/35 outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/15"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Limpiar"
                className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-white/40 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Categorías con iconos */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-bold transition-all ${
                selectedCategory === null
                  ? 'border-transparent bg-yellow-cta text-ink shadow-glow-gold'
                  : 'border-white/10 bg-white/[0.04] text-white/70 hover:border-gold/40 hover:text-white'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              Todo
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-bold transition-all ${
                  selectedCategory === cat
                    ? 'border-transparent bg-yellow-cta text-ink shadow-glow-gold'
                    : 'border-white/10 bg-white/[0.04] text-white/70 hover:border-gold/40 hover:text-white'
                }`}
              >
                <span className="text-base leading-none">{metaFor(cat).emoji}</span>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ===================== CONTENIDO ===================== */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:flex lg:gap-8">
        {/* ---- Columna principal ---- */}
        <main className="min-w-0 flex-1 pb-32 lg:pb-16">
          {!isFiltering && (
            <>
              {/* ===== HERO ===== */}
              <section className="relative mt-6 overflow-hidden rounded-[32px] border border-white/10 shadow-card">
                {/* Fondo oscuro con imagen real de producto */}
                <div className="absolute inset-0">
                  {heroImages.burger?.image_url && (
                    <img
                      src={heroImages.burger.image_url}
                      alt=""
                      onError={hideBroken}
                      className="h-full w-full scale-110 object-cover opacity-50 blur-[2px]"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/90 to-brand-deep/70" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
                </div>

                <div className="relative grid items-center gap-6 p-6 sm:p-10 lg:grid-cols-2 lg:p-14">
                  {/* Texto */}
                  <div className="animate-fade-up">
                    <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-wider text-gold-light">
                      <Star className="h-3.5 w-3.5 fill-gold-light text-gold-light" />
                      Hecho al momento · 2026
                    </span>
                    <h1 className="mt-5 font-display text-[40px] font-extrabold uppercase leading-[0.95] tracking-tight text-balance sm:text-6xl lg:text-[64px]">
                      Antojos que
                      <br />
                      <span className="text-gold-grad">no se olvidan</span>
                    </h1>
                    <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/60 sm:text-base">
                      Hamburguesas a la parrilla, hot dogs cargados, salchipapas y más.
                      Arma tu pedido y la cocina lo recibe al instante.
                    </p>

                    <div className="mt-7 flex flex-wrap items-center gap-3">
                      <button
                        onClick={scrollToMenu}
                        className="group inline-flex items-center gap-2.5 rounded-2xl bg-yellow-cta px-7 py-4 text-base font-extrabold uppercase tracking-wide text-ink shadow-glow-gold transition-all hover:brightness-105 active:scale-95"
                      >
                        <ShoppingBag className="h-5 w-5" />
                        Ordenar ahora
                        <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </button>
                      <div className="flex items-center gap-2 text-[13px] font-medium text-white/55">
                        <Clock className="h-4 w-4 text-gold" />
                        Listo en minutos
                      </div>
                    </div>
                  </div>

                  {/* Composición de imágenes reales */}
                  <div className="relative hidden h-[340px] lg:block">
                    {heroImages.burger?.image_url && (
                      <div className="animate-float absolute right-4 top-2 h-60 w-60 overflow-hidden rounded-[36px] border-2 border-white/15 shadow-glow-red">
                        <img src={heroImages.burger.image_url} alt={heroImages.burger.name} onError={hideBroken} className="h-full w-full object-cover" />
                      </div>
                    )}
                    {heroImages.hotdog?.image_url && (
                      <div className="animate-float-slow absolute left-0 top-24 h-40 w-40 overflow-hidden rounded-[28px] border-2 border-white/15 shadow-card">
                        <img src={heroImages.hotdog.image_url} alt={heroImages.hotdog.name} onError={hideBroken} className="h-full w-full object-cover" />
                      </div>
                    )}
                    {heroImages.fries?.image_url && (
                      <div className="animate-float absolute bottom-0 left-28 h-36 w-36 overflow-hidden rounded-[24px] border-2 border-white/15 shadow-card" style={{ animationDelay: '1.2s' }}>
                        <img src={heroImages.fries.image_url} alt={heroImages.fries.name} onError={hideBroken} className="h-full w-full object-cover" />
                      </div>
                    )}
                    {heroImages.drink?.image_url && (
                      <div className="animate-float-slow absolute bottom-6 right-0 h-28 w-28 overflow-hidden rounded-3xl border-2 border-white/15 shadow-card" style={{ animationDelay: '0.6s' }}>
                        <img src={heroImages.drink.image_url} alt={heroImages.drink.name} onError={hideBroken} className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* ===== CATEGORÍAS (tarjetas grandes con iconos) ===== */}
              {categories.length > 0 && (
                <section className="mt-12">
                  <div className="mb-5 flex items-center justify-between px-1">
                    <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-white">
                      Explora el menú
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
                    {categories.map((cat, i) => {
                      const meta = metaFor(cat);
                      return (
                        <button
                          key={cat}
                          onClick={() => goToCategory(cat)}
                          className={`group reveal relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${meta.ring} p-5 text-left transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-glow-gold`}
                          style={{ animationDelay: `${i * 60}ms` }}
                        >
                          <div className="absolute inset-0 bg-ink-800/40" />
                          <div className="relative">
                            <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-ink/40 text-3xl shadow-soft transition-transform duration-300 group-hover:scale-110">
                              {meta.emoji}
                            </span>
                            <h3 className="mt-4 font-display text-base font-extrabold uppercase tracking-tight text-white">
                              {cat}
                            </h3>
                            <p className="mt-0.5 text-[11.5px] font-medium text-white/45 line-clamp-1">{meta.blurb}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* ===== CARRUSELES POR CATEGORÍA ===== */}
              <div id="menu-start" className="mt-14 space-y-14">
                {grouped.map((col) => (
                  <ProductCarousel
                    key={col.category}
                    id={`cat-${slugify(col.category)}`}
                    category={col.category}
                    items={col.items}
                    favorites={favorites}
                    onAdd={addToCart}
                    onToggleFav={toggleFavorite}
                    onVerMas={(c) => {
                      setSelectedCategory(c);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                ))}
              </div>
            </>
          )}

          {/* ===== MODO FILTRO / BÚSQUEDA (grid premium) ===== */}
          {isFiltering && (
            <section className="mt-8">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-white sm:text-3xl">
                    {selectedCategory ? (
                      <span className="flex items-center gap-2">
                        <span>{metaFor(selectedCategory).emoji}</span> {selectedCategory}
                      </span>
                    ) : (
                      'Resultados'
                    )}
                  </h2>
                  <p className="mt-1 text-[13px] text-white/45">
                    {filteredItems.length} {filteredItems.length === 1 ? 'producto' : 'productos'}
                    {searchQuery.trim() && <> para “{searchQuery.trim()}”</>}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setSearchQuery('');
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[13px] font-bold text-white/70 transition-colors hover:border-gold/40 hover:text-gold"
                >
                  <X className="h-4 w-4" />
                  Limpiar
                </button>
              </div>

              {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 rounded-[28px] border border-white/10 bg-white/[0.02] py-20 text-center">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-3xl">🔍</div>
                  <p className="font-display text-lg font-bold text-white">Sin resultados</p>
                  <p className="max-w-xs text-sm text-white/45">Prueba con otra categoría o cambia tu búsqueda.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredItems.map((item, i) => (
                    <div key={item.id} className="reveal" style={{ animationDelay: `${Math.min(i, 10) * 45}ms` }}>
                      <ProductCard
                        item={item}
                        favorite={favorites.has(item.id)}
                        onAdd={addToCart}
                        onToggleFav={toggleFavorite}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>

        {/* ---- Carrito sticky (desktop, estilo Uber Eats) ---- */}
        <aside className="hidden w-[360px] shrink-0 lg:block">
          <div className="sticky top-[150px] py-6">
            <div className="glass-strong overflow-hidden rounded-[28px] shadow-card">
              <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
                <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-white">
                  <ShoppingBag className="h-5 w-5 text-gold" />
                  Tu pedido
                </h2>
                {cartCount > 0 && (
                  <span className="rounded-full bg-gold/15 px-2.5 py-1 text-[12px] font-bold text-gold">
                    {cartCount} {cartCount === 1 ? 'ítem' : 'ítems'}
                  </span>
                )}
              </div>

              <div className="max-h-[calc(100vh-360px)] space-y-3 overflow-y-auto scrollbar-hide px-4 py-4">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                    <div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">
                      <ShoppingBag className="h-7 w-7 text-white/30" />
                    </div>
                    <p className="font-bold text-white/80">Tu carrito está vacío</p>
                    <p className="text-[13px] text-white/40">Agrega productos del menú para empezar.</p>
                  </div>
                ) : (
                  cart.map((c) => (
                    <CartRow key={`${c.menu_item.id}-${c.notes}`} line={c} onQty={updateQty} onRemove={removeItem} />
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="space-y-3 border-t border-white/8 bg-gradient-to-t from-black/30 px-5 py-4">
                  <div className="flex items-center justify-between text-[13px] text-white/55">
                    <span>Subtotal</span>
                    <span className="font-semibold text-white/80">${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="font-display text-sm font-bold uppercase tracking-wide text-white">Total</span>
                    <span className="font-display text-3xl font-extrabold text-gold-grad">${cartTotal.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => setCheckoutOpen(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-cta py-4 text-base font-extrabold uppercase tracking-wide text-ink shadow-glow-gold transition-all hover:brightness-105 active:scale-95"
                  >
                    Finalizar pedido
                    <ArrowRightIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
            <p className="mt-3 text-center text-[11px] text-white/30">
              La cocina recibe tu pedido al instante 🔥
            </p>
          </div>
        </aside>
      </div>

      {/* ===================== BOTÓN FLOTANTE (mobile/tablet) ===================== */}
      {cartCount > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-yellow-cta px-6 py-4 font-extrabold text-ink shadow-glow-gold transition-all active:scale-95 lg:hidden"
        >
          <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-[12px] font-black text-gold">
            {cartCount}
          </span>
          <span className="uppercase tracking-wide">Ver carrito</span>
          <span className="font-display text-lg">${cartTotal.toFixed(2)}</span>
        </button>
      )}

      {/* ===================== DRAWER CARRITO (mobile) ===================== */}
      {cartOpen && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setCartOpen(false)} />
          <div className="relative flex h-full w-full max-w-md flex-col bg-premium shadow-2xl animate-slide-in">
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-white">
                <ShoppingBag className="h-5 w-5 text-gold" />
                Tu Carrito
              </h2>
              <button
                onClick={() => setCartOpen(false)}
                aria-label="Cerrar"
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white transition-colors hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">
                    <ShoppingBag className="h-8 w-8 text-white/30" />
                  </div>
                  <p className="font-bold text-white">Tu carrito está vacío</p>
                  <p className="text-sm text-white/45">Agrega artículos del menú</p>
                </div>
              ) : (
                cart.map((c) => (
                  <CartRow key={`${c.menu_item.id}-${c.notes}`} line={c} onQty={updateQty} onRemove={removeItem} />
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="space-y-3 border-t border-white/8 bg-gradient-to-t from-black/30 px-5 py-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-white/40">Total · {cartCount} {cartCount === 1 ? 'ítem' : 'ítems'}</p>
                  </div>
                  <span className="font-display text-3xl font-extrabold text-gold-grad">${cartTotal.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => {
                    setCartOpen(false);
                    setCheckoutOpen(true);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-cta py-4 text-base font-extrabold uppercase tracking-wide text-ink shadow-glow-gold transition-all active:scale-95"
                >
                  <ShoppingBag className="h-5 w-5" />
                  Realizar Pedido
                </button>
                <button
                  onClick={() => setCartOpen(false)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 text-sm font-bold uppercase text-white/70 transition-colors hover:bg-white/10"
                >
                  Seguir comprando
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== CHECKOUT MODAL ===================== */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => !submitting && setCheckoutOpen(false)} />
          <div className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[28px] border border-white/10 glass-strong p-6 shadow-card animate-pop-in">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-xl font-extrabold text-white">Confirmar pedido</h2>
              <button
                onClick={() => !submitting && setCheckoutOpen(false)}
                aria-label="Cerrar"
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white transition-colors hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-white/80">👤 Tu nombre</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ej. María González"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-[15px] font-semibold text-white placeholder-white/35 outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/15"
                  disabled={submitting}
                />
              </div>

              {/* Tipo de pedido: retiro en local o delivery */}
              <div>
                <label className="mb-2 block text-sm font-bold text-white/80">🛍️ ¿Cómo quieres tu pedido?</label>
                <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
                  <button
                    type="button"
                    onClick={() => setOrderType('pickup')}
                    disabled={submitting}
                    className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-extrabold transition-all ${
                      orderType === 'pickup'
                        ? 'bg-yellow-cta text-ink shadow-glow-gold'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    <Store className="h-4 w-4" />
                    Retiro en local
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('delivery')}
                    disabled={submitting}
                    className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-extrabold transition-all ${
                      orderType === 'delivery'
                        ? 'bg-yellow-cta text-ink shadow-glow-gold'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    <Bike className="h-4 w-4" />
                    Delivery
                  </button>
                </div>
              </div>

              {/* Datos de delivery: línea de contacto + ubicación actual */}
              {orderType === 'delivery' && (
                <div className="space-y-4 rounded-2xl border border-gold/25 bg-gold/[0.05] p-4 animate-fade-up">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-white/80">📞 Línea de contacto</label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Ej. 0412 123 4567"
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.05] py-3 pl-11 pr-4 text-[15px] font-semibold text-white placeholder-white/35 outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/15"
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-white/80">🏠 Dirección o referencia (opcional)</label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Ej. Calle 5, casa azul, portón negro"
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-[15px] text-white placeholder-white/35 outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/15"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-white/80">📍 Tu ubicación actual</label>
                    {coords ? (
                      <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-emerald-300">
                          <Check className="h-4 w-4" strokeWidth={3} />
                          Ubicación compartida
                        </div>
                        <p className="mt-1 text-xs text-white/55">
                          Precisión ~{Math.round(coords.accuracy)} m · {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] px-3 py-1.5 text-xs font-bold text-white/80 transition-colors hover:border-gold/40 hover:text-gold"
                          >
                            <MapPin className="h-3.5 w-3.5" />
                            Ver en mapa
                          </a>
                          <button
                            type="button"
                            onClick={requestLocation}
                            disabled={submitting || geoStatus === 'loading'}
                            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] px-3 py-1.5 text-xs font-bold text-white/80 transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50"
                          >
                            <LocateFixed className="h-3.5 w-3.5" />
                            Actualizar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={requestLocation}
                        disabled={submitting || geoStatus === 'loading'}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gold/40 bg-gold/10 py-3 text-sm font-extrabold text-gold-light transition-all hover:bg-gold/15 active:scale-95 disabled:opacity-50"
                      >
                        {geoStatus === 'loading' ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Obteniendo ubicación…
                          </>
                        ) : (
                          <>
                            <Navigation className="h-4 w-4" />
                            Enviar mi ubicación actual
                          </>
                        )}
                      </button>
                    )}
                    {geoError && (
                      <p className="mt-2 text-xs font-semibold text-red-300">⚠️ {geoError}</p>
                    )}
                    <p className="mt-2 text-[11px] leading-snug text-white/40">
                      Compartimos tu ubicación solo con la cocina para coordinar la entrega.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-bold text-white/80">📝 Notas especiales (opcional)</label>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Ej. Sin cebolla, extra queso, que sea rápido…"
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-[15px] text-white placeholder-white/35 outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/15"
                  disabled={submitting}
                />
              </div>

              {/* Resumen */}
              <div className="space-y-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <h4 className="text-[13px] font-extrabold uppercase tracking-wide text-white/80">📦 Resumen del pedido</h4>
                <div className="flex items-center justify-between rounded-xl bg-black/20 px-3 py-2 text-sm">
                  <span className="text-white/55">Entrega</span>
                  <span className="inline-flex items-center gap-1.5 font-bold text-white">
                    {orderType === 'delivery'
                      ? (<><Bike className="h-4 w-4 text-gold" /> Delivery</>)
                      : (<><Store className="h-4 w-4 text-gold" /> Retiro en local</>)}
                  </span>
                </div>
                <div className="max-h-48 space-y-2 overflow-y-auto scrollbar-hide">
                  {cart.map((c) => (
                    <div key={`${c.menu_item.id}-${c.notes}`} className="flex justify-between gap-2 text-sm">
                      <div className="min-w-0 flex-1">
                        <span className="text-white/75">{c.quantity}× {c.menu_item.name}</span>
                        {c.notes && <p className="text-xs italic text-gold/80">({c.notes})</p>}
                      </div>
                      <span className="shrink-0 font-display font-bold text-gold">${(c.menu_item.price * c.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-end justify-between border-t border-white/8 pt-3">
                  <span className="text-[13px] font-extrabold uppercase tracking-wide text-white">Total a pagar</span>
                  <span className="font-display text-2xl font-extrabold text-gold-grad">${cartTotal.toFixed(2)}</span>
                </div>
              </div>

              {stockShort.length > 0 && (
                <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-3 text-sm font-semibold text-amber-200">
                  ⚠️ Algunos ingredientes podrían estar por agotarse en esta sucursal
                  {' '}({stockShort.map((s) => s.product_name).join(', ')}).
                  Puedes enviar el pedido; la cocina lo confirmará.
                </div>
              )}

              {submitError && (
                <div className="rounded-2xl border border-brand-light/40 bg-brand/15 p-3 text-sm font-semibold text-red-200">
                  ⚠️ {submitError}
                </div>
              )}

              {orderType === 'delivery' && !deliveryReady && !submitError && (
                <p className="text-center text-xs text-white/45">
                  Agrega tu línea de contacto y comparte tu ubicación para continuar.
                </p>
              )}

              <button
                onClick={placeOrder}
                disabled={submitting || !customerName.trim() || !deliveryReady}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-cta py-4 text-base font-extrabold uppercase tracking-wide text-ink shadow-glow-gold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Procesando…
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" strokeWidth={3} />
                    Confirmar pedido
                  </>
                )}
              </button>

              <button
                onClick={() => !submitting && setCheckoutOpen(false)}
                disabled={submitting}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 text-sm font-bold uppercase text-white/70 transition-colors hover:bg-white/10 disabled:opacity-40"
              >
                Volver al carrito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
