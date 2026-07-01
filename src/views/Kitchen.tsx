import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  ArrowLeft, Loader2, Clock, ChefHat, CheckCircle2, PackageCheck, XCircle, LogOut, UserPlus, X, Mail, KeyRound,
  Bike, Store, Phone, MapPin, Home, Boxes,
} from 'lucide-react';
import {
  supabase, supabaseUrl, supabaseAnonKey, type OrderWithItems, type OrderStatus, type Location,
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

function actionLabelFor(order: OrderWithItems): string | undefined {
  switch (order.status) {
    case 'pending': return 'Empezar a preparar';
    case 'preparing': return 'Marcar como listo';
    case 'ready': return order.order_type === 'delivery' ? 'Asignar delivery' : 'Marcar entregado';
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
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ type: 'ok' | 'err' | 'info'; text: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentEmail(data.user?.email ?? null));
  }, []);

  const isAdmin = currentEmail?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const createKitchenUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newEmail.trim();
    if (!email || newPassword.length < 6) {
      setCreateMsg({ type: 'err', text: 'Ingresa un correo válido y una contraseña de al menos 6 caracteres.' });
      return;
    }
    setCreating(true);
    setCreateMsg(null);
    try {
      // Cliente aislado: crea la cuenta sin tocar la sesión del administrador actual.
      const tmpClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await tmpClient.auth.signUp({ email, password: newPassword });
      if (error) throw error;

      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setCreateMsg({ type: 'err', text: 'Ese correo ya está registrado.' });
      } else if (data.session) {
        setCreateMsg({ type: 'ok', text: `Usuario ${email} creado y listo para iniciar sesión.` });
        setNewEmail('');
        setNewPassword('');
      } else {
        setCreateMsg({
          type: 'info',
          text: `Usuario ${email} creado. Debe abrir el enlace de confirmación enviado a su correo antes de poder entrar.`,
        });
        setNewEmail('');
        setNewPassword('');
      }
    } catch (err) {
      setCreateMsg({ type: 'err', text: err instanceof Error ? err.message : 'No se pudo crear el usuario.' });
    } finally {
      setCreating(false);
    }
  };

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
    const next = nextStatusFor(order);
    if (!next) return;
    setUpdatingId(order.id);
    const { error } = await supabase
      .from('orders')
      .update({ status: next })
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
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
          <div className="flex items-center gap-2 sm:gap-3">
            <select
              value={activeLocationId ?? ''}
              onChange={(e) => {
                setActiveLocationId(e.target.value);
                setLoading(true);
              }}
              className="rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-white font-bold text-sm outline-none focus:border-gold/50 cursor-pointer min-h-[44px] backdrop-blur-sm"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id} className="bg-ink-800">
                  {loc.name}
                </option>
              ))}
            </select>
            <button
              onClick={onGoAdmin}
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-3 sm:py-2.5 text-white font-bold text-sm transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:text-gold min-h-[44px] backdrop-blur-sm"
            >
              <Boxes className="h-4 w-4" />
              <span className="hidden md:inline">Inventario</span>
            </button>
            {isAdmin && (
              <button
                onClick={() => { setCreateMsg(null); setCreateOpen(true); }}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#f7d878] via-[#e5b04a] to-[#b87b08] px-3 py-3 sm:py-2.5 text-ink font-extrabold text-sm shadow-[0_14px_35px_rgba(234,171,8,0.25)] transition-all hover:-translate-y-0.5 hover:brightness-105 active:scale-95 min-h-[44px]"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden md:inline">Crear usuario</span>
              </button>
            )}
            <span className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-300 font-bold">En vivo</span>
            </span>
            <button
              onClick={async () => { await supabase.auth.signOut(); onBack(); }}
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-3 sm:py-2.5 text-white font-bold text-sm transition-all hover:-translate-y-0.5 hover:bg-white/10 min-h-[44px] backdrop-blur-sm"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Salir</span>
            </button>
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

      {/* Modal: crear usuario de cocina (solo admin) */}
      {isAdmin && createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
            onClick={() => !creating && setCreateOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl animate-pop-in">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-white">
                <UserPlus className="h-5 w-5 text-gold" />
                Crear usuario de cocina
              </h2>
              <button
                onClick={() => !creating && setCreateOpen(false)}
                aria-label="Cerrar"
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white transition-colors hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-5 text-[13px] leading-relaxed text-white/50">
              Crea una cuenta con acceso al panel de cocina. El nuevo usuario podrá iniciar
              sesión con el correo y la contraseña que definas aquí.
            </p>

            <form onSubmit={createKitchenUser} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-white/80">Correo</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="empleado@correo.com"
                    autoComplete="off"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.05] py-3.5 pl-12 pr-4 text-[15px] text-white placeholder-white/30 outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/15"
                    disabled={creating}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-white/80">Contraseña</label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="off"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.05] py-3.5 pl-12 pr-4 text-[15px] text-white placeholder-white/30 outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/15"
                    disabled={creating}
                  />
                </div>
              </div>

              {createMsg && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                    createMsg.type === 'ok'
                      ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                      : createMsg.type === 'info'
                        ? 'border-gold/40 bg-gold/10 text-gold-light'
                        : 'border-brand-light/40 bg-brand/15 text-red-200'
                  }`}
                >
                  {createMsg.type === 'ok' ? '✅ ' : createMsg.type === 'info' ? 'ℹ️ ' : '⚠️ '}
                  {createMsg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={creating}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#f7d878] via-[#e5b04a] to-[#b87b08] py-4 text-base font-extrabold uppercase tracking-[0.2em] text-ink shadow-[0_14px_35px_rgba(234,171,8,0.25)] transition-all hover:-translate-y-0.5 hover:brightness-105 active:scale-95 disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creando…
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    Crear usuario
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
