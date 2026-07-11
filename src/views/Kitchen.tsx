import { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft, Loader2, Clock, ChefHat, CheckCircle2, PackageCheck, XCircle, LogOut, X, Bike, Store, Phone, MapPin, Home, Boxes,
} from 'lucide-react';
import {
  supabase, supabaseUrl, supabaseAnonKey, getCurrentProfile, type OrderWithItems, type OrderStatus, type Location,
} from '../lib/supabase';

type Props = {
  onBack: () => void;
  onGoAdmin: () => void;
};

// Correo con privilegios para crear nuevos usuarios de cocina desde el panel.
const ADMIN_EMAIL = 'baex10@icloud.com';

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string; border: string; icon: typeof Clock }
> = {
  pending: {
    label: 'Recibido',
    color: 'text-gold',
    bg: 'bg-gold/[0.06]',
    border: 'border-gold/40',
    icon: Clock,
  },
  preparing: {
    label: 'Preparando',
    color: 'text-sky-400',
    bg: 'bg-sky-500/[0.06]',
    border: 'border-sky-400/40',
    icon: ChefHat,
  },
  ready: {
    label: 'Listo',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/[0.06]',
    border: 'border-emerald-400/40',
    icon: PackageCheck,
  },
  en_camino: {
    label: 'En camino',
    color: 'text-orange-300',
    bg: 'bg-orange-500/[0.06]',
    border: 'border-orange-400/40',
    icon: Bike,
  },
  completed: {
    label: 'Entregado',
    color: 'text-white/50',
    bg: 'bg-white/[0.02]',
    border: 'border-white/20',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelado',
    color: 'text-red-300',
    bg: 'bg-brand/[0.08]',
    border: 'border-brand-light/40',
    icon: XCircle,
  },
};

// Las transiciones dependen del tipo de pedido: delivery suma el paso "en camino".
// pickup:   pending -> preparing -> ready -> completed
// delivery: pending -> preparing -> ready -> en_camino -> completed
function nextStatusFor(order: OrderWithItems): OrderStatus | undefined {
  switch (order.status) {
    case 'pending': return 'preparing';
    case 'preparing': return 'ready';
    case 'ready': return order.order_type === 'delivery' ? 'en_camino' : 'completed';
    case 'en_camino': return 'completed';
    default: return undefined;
  }
}

const DELIVERY_QUEUE = 'delivery_queue';

function actionLabelFor(order: OrderWithItems): string | undefined {
  switch (order.status) {
    case 'pending': return 'Empezar a preparar';
    case 'preparing': return 'Marcar como listo';
    case 'ready':
      if (order.order_type === 'delivery') {
        if (order.delivery_assigned_to === DELIVERY_QUEUE) return undefined;
        if (order.delivery_assigned_to) return 'Asignado';
        return 'Enviar a delivery';
      }
      return 'Marcar entregado';
    case 'en_camino': return 'Marcar entregado';
    default: return undefined;
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'hace un momento';
  if (mins === 1) return 'hace 1 min';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `hace ${hrs}h ${mins % 60}m`;
}

export default function Kitchen({ onBack, onGoAdmin }: Props) {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);

  // --- Administración de usuarios (solo ADMIN_EMAIL) ---
  const [currentProfile, setCurrentProfile] = useState<{ email: string | null; role: string | null } | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const profile = await getCurrentProfile();
      setCurrentProfile({ email: profile?.email ?? null, role: profile?.role ?? null });
    };
    void loadProfile();
  }, []);

  const isAdmin = currentProfile?.role === 'admin';

  const defaultLocation: Location = {
    id: 'default',
    slug: 'default',
    name: 'WernerBurguer',
    address: 'Sucursal por defecto',
    is_active: true,
    created_at: new Date().toISOString(),
  };

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const { data, error } = await supabase
          .from('locations')
          .select('*')
          .eq('is_active', true)
          .order('name');
        if (error) {
          throw error;
        }
        if (data && data.length > 0) {
          setLocations(data);
          setActiveLocationId(data[0].id);
        } else {
          setLocations([defaultLocation]);
          setActiveLocationId(defaultLocation.id);
        }
      } catch {
        setLocations([defaultLocation]);
        setActiveLocationId(defaultLocation.id);
      }
    };
    loadLocations();
  }, []);

  const loadOrders = useCallback(async () => {
    if (!activeLocationId) return;
    const baseQuery = supabase
      .from('orders')
      .select('*, order_items(*)')
      .in('status', ['pending', 'preparing', 'ready', 'en_camino'])
      .order('created_at', { ascending: true });

    const query = activeLocationId === 'default'
      ? baseQuery
      : baseQuery.eq('location_id', activeLocationId);

    const { data, error } = await query;
    if (error && activeLocationId !== 'default') {
      const fallback = await baseQuery;
      if (fallback.error) {
        setError('No se pudieron cargar los pedidos.');
      } else {
        setOrders(fallback.data ?? []);
        setError(null);
      }
    } else if (error) {
      setError('No se pudieron cargar los pedidos.');
    } else {
      setOrders(data ?? []);
      setError(null);
    }
    setLoading(false);
  }, [activeLocationId]);

  useEffect(() => {
    loadOrders();

    const channel = supabase
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => loadOrders(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        () => loadOrders(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadOrders]);

  const advanceOrder = async (order: OrderWithItems) => {
    setUpdatingId(order.id);

    if (order.status === 'ready' && order.order_type === 'delivery' && !order.delivery_assigned_to) {
      const { error } = await supabase
        .from('orders')
        .update({ delivery_assigned_to: DELIVERY_QUEUE })
        .eq('id', order.id);
      if (error) {
        setError('Error al enviar el pedido a delivery.');
      }
      setUpdatingId(null);
      return;
    }

    const next = nextStatusFor(order);
    if (!next) {
      setUpdatingId(null);
      return;
    }

    const updateData: Record<string, any> = { status: next };
    if (order.status === 'ready' && order.order_type === 'delivery' && order.delivery_assigned_to === DELIVERY_QUEUE) {
      updateData.delivery_assigned_to = null;
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id);
    if (error) {
      setError('Error al actualizar el pedido.');
    }
    setUpdatingId(null);
  };

  const cancelOrder = async (order: OrderWithItems) => {
    setUpdatingId(order.id);
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', order.id);
    if (error) {
      setError('Error al cancelar el pedido.');
    }
    setUpdatingId(null);
  };

  const columns: { status: OrderStatus; title: string }[] = [
    { status: 'pending', title: 'Recibidos' },
    { status: 'preparing', title: 'En preparación' },
    { status: 'ready', title: 'Listos' },
    { status: 'en_camino', title: 'En camino' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-premium flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-premium text-white">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0b0809]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={onBack}
              className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/80 transition-all hover:border-gold/40 hover:text-gold"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 sm:gap-3">
              <img
                src="/werner-chef.png"
                alt="WernerBurguer logo"
                className="w-11 h-11 rounded-full border-2 border-gold/50 object-cover"
              />
              <div className="h-8 w-px bg-white/10 hidden sm:block" />
              <div className="hidden sm:block">
                <h1 className="font-display font-extrabold leading-tight text-white flex items-center gap-2">
                  <ChefHat className="h-4 w-4 text-gold" /> Cocina
                </h1>
                <p className="text-xs text-white/40">Panel de pedidos en tiempo real</p>
              </div>
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <select
              value={activeLocationId ?? ''}
              onChange={(e) => {
                setActiveLocationId(e.target.value);
                setLoading(true);
              }}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-white font-bold text-sm outline-none focus:border-gold/50 cursor-pointer min-h-[44px] backdrop-blur-sm sm:w-auto"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id} className="bg-ink-800">
                  {loc.name}
                </option>
              ))}
            </select>
            <div className="grid w-full gap-2 sm:flex sm:w-auto sm:items-center">
              <button
                onClick={onGoAdmin}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-3 text-white font-bold text-sm transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:text-gold min-h-[44px] backdrop-blur-sm sm:w-auto sm:justify-start sm:py-2.5"
              >
                <Boxes className="h-4 w-4" />
                <span className="text-[11px] font-extrabold uppercase tracking-wide sm:hidden">Inv</span>
                <span className="hidden md:inline">Inventario</span>
              </button>
              <span className="flex items-center justify-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-center sm:inline-flex sm:justify-start">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold text-emerald-300 sm:text-xs">En vivo</span>
              </span>
              <button
                onClick={async () => { await supabase.auth.signOut(); onBack(); }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-3 text-white font-bold text-sm transition-all hover:-translate-y-0.5 hover:bg-white/10 min-h-[44px] backdrop-blur-sm sm:w-auto sm:justify-start sm:py-2.5"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-[11px] font-extrabold uppercase tracking-wide sm:hidden">Salir</span>
                <span className="hidden md:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
          <p className="text-sm text-red-200 font-semibold rounded-2xl border border-brand-light/40 bg-brand/15 px-4 py-3">
            {error}
          </p>
        </div>
      )}

      {/* Kanban columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          {columns.map((col) => {
            const colOrders = orders.filter((o) => o.status === col.status);
            return (
              <div key={col.status} className="flex flex-col">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className="font-display font-extrabold text-white uppercase tracking-tight">{col.title}</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-yellow-cta text-ink text-sm font-black">
                    {colOrders.length}
                  </span>
                </div>
                <div className="space-y-3 min-h-[200px]">
                  {colOrders.length === 0 ? (
                    <div className="rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] py-10 text-center backdrop-blur-sm">
                      <p className="text-white/35 text-sm">Sin pedidos</p>
                    </div>
                  ) : (
                    colOrders.map((order) => {
                      const cfg = STATUS_CONFIG[order.status];
                      const Icon = cfg.icon;
                      const next = nextStatusFor(order);
                      const actionLabel = actionLabelFor(order);
                      const isUpdating = updatingId === order.id;
                      return (
                        <div
                          key={order.id}
                          className={`reveal rounded-[24px] border ${cfg.border} ${cfg.bg} bg-white/[0.04] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <span className="font-display text-lg font-extrabold text-gold-grad">
                                #{String(order.number).padStart(3, '0')}
                              </span>
                              <p className="text-sm text-white font-bold">
                                {order.customer_name}
                              </p>
                            </div>
                            <div className={`flex items-center gap-1.5 ${cfg.color}`}>
                              <Icon className="h-4 w-4" />
                              <span className="text-xs font-bold">{cfg.label}</span>
                            </div>
                          </div>

                          <div className="text-xs text-white/40 mb-3">
                            {timeAgo(order.created_at)}
                          </div>

                          {order.order_type === 'delivery' ? (
                            <div className="mb-3 space-y-1.5 rounded-xl border border-gold/30 bg-gold/[0.06] px-3 py-2.5">
                              <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-gold">
                                <Bike className="h-3.5 w-3.5" />
                                Delivery
                              </div>
                              {order.customer_phone && (
                                <a
                                  href={`tel:${order.customer_phone}`}
                                  className="flex items-center gap-1.5 text-sm font-bold text-white transition-colors hover:text-gold"
                                >
                                  <Phone className="h-3.5 w-3.5 text-gold" />
                                  {order.customer_phone}
                                </a>
                              )}
                              {order.delivery_address && (
                                <p className="flex items-start gap-1.5 text-xs text-white/70">
                                  <Home className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                                  {order.delivery_address}
                                </p>
                              )}
                              {order.delivery_assigned_to === DELIVERY_QUEUE ? (
                                <p className="text-xs text-white/60 mt-1">En cola de delivery</p>
                              ) : order.delivery_assigned_to ? (
                                <p className="text-xs text-white/60 mt-1">Asignado a: {order.delivery_assigned_to}</p>
                              ) : null}
                              {order.delivery_lat != null && order.delivery_lng != null && (
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${order.delivery_lat},${order.delivery_lng}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-cta px-2.5 py-1.5 text-xs font-black text-ink transition-all hover:brightness-105 active:scale-95"
                                >
                                  <MapPin className="h-3.5 w-3.5" />
                                  Ver ubicación en mapa
                                </a>
                              )}
                            </div>
                          ) : (
                            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[11px] font-bold text-white/60">
                              <Store className="h-3.5 w-3.5" />
                              Retiro en local
                            </div>
                          )}

                          <div className="space-y-1.5 mb-3">
                            {order.order_items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-start gap-2 text-sm bg-black/25 rounded-xl px-3 py-2"
                              >
                                <span className="font-black text-gold min-w-[1.5rem]">
                                  {item.quantity}×
                                </span>
                                <div className="flex-1">
                                  <span className="font-bold text-white">
                                    {item.name}
                                  </span>
                                  {item.notes && (
                                    <p className="text-xs text-white/45 italic mt-0.5">
                                      {item.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {order.notes && (
                            <div className="text-xs text-white/65 bg-black/25 rounded-xl px-3 py-2 mb-3">
                              <span className="font-bold text-gold">Nota: </span>
                              {order.notes}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-white/10">
                            <span className="font-display font-extrabold text-gold-grad">
                              ${Number(order.total).toFixed(2)}
                            </span>
                            <div className="flex gap-2 flex-col sm:flex-row">
                              {order.status === 'pending' && (
                                <button
                                  onClick={() => cancelOrder(order)}
                                  disabled={isUpdating}
                                  className="rounded-xl px-4 py-3 sm:px-3 sm:py-1.5 text-sm sm:text-xs font-bold text-red-300 bg-brand/15 border border-brand-light/30 hover:bg-brand/25 transition-all disabled:opacity-50 min-h-[44px] sm:min-h-auto"
                                >
                                  Cancelar
                                </button>
                              )}
                              {next && actionLabel && (
                                <button
                                  onClick={() => advanceOrder(order)}
                                  disabled={isUpdating}
                                  className="flex items-center justify-center gap-1.5 rounded-xl px-4 py-3 sm:px-4 sm:py-1.5 text-sm sm:text-xs font-black bg-gradient-to-r from-[#f7d878] via-[#e5b04a] to-[#b87b08] text-ink hover:-translate-y-0.5 hover:brightness-105 transition-all disabled:opacity-50 min-h-[44px] sm:min-h-auto"
                                >
                                  {isUpdating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-4 w-4" />
                                  )}
                                  {actionLabel}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
