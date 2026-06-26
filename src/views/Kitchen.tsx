import { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft, Loader2, Clock, ChefHat, CheckCircle2, PackageCheck, XCircle, LogOut,
} from 'lucide-react';
import WernerLogo from '../components/WernerLogo';
import { supabase, type OrderWithItems, type OrderStatus, type Location } from '../lib/supabase';

type Props = {
  onBack: () => void;
};

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string; border: string; icon: typeof Clock }
> = {
  pending: {
    label: 'Recibido',
    color: 'text-yellow-400',
    bg: 'bg-black/30',
    border: 'border-yellow-400',
    icon: Clock,
  },
  preparing: {
    label: 'Preparando',
    color: 'text-blue-400',
    bg: 'bg-black/30',
    border: 'border-blue-400',
    icon: ChefHat,
  },
  ready: {
    label: 'Listo',
    color: 'text-emerald-400',
    bg: 'bg-black/30',
    border: 'border-emerald-400',
    icon: PackageCheck,
  },
  completed: {
    label: 'Entregado',
    color: 'text-white/50',
    bg: 'bg-black/20',
    border: 'border-white/30',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelado',
    color: 'text-red-300',
    bg: 'bg-black/30',
    border: 'border-red-400',
    icon: XCircle,
  },
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'preparing',
  preparing: 'ready',
  ready: 'completed',
};

const ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  pending: 'Empezar a preparar',
  preparing: 'Marcar como listo',
  ready: 'Marcar entregado',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'hace un momento';
  if (mins === 1) return 'hace 1 min';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `hace ${hrs}h ${mins % 60}m`;
}

export default function Kitchen({ onBack }: Props) {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);

  useEffect(() => {
    const loadLocations = async () => {
      const { data } = await supabase
        .from('locations')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (data && data.length > 0) {
        setLocations(data);
        setActiveLocationId(data[0].id);
      }
    };
    loadLocations();
  }, []);

  const loadOrders = useCallback(async () => {
    if (!activeLocationId) return;
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('location_id', activeLocationId)
      .in('status', ['pending', 'preparing', 'ready'])
      .order('created_at', { ascending: true });
    if (error) {
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
    const next = NEXT_STATUS[order.status];
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
    { status: 'ready', title: 'Listos para entregar' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#c8102e] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#c8102e]">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-black text-white border-b-4 border-yellow-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <WernerLogo size="sm" />
              <div className="h-8 w-px bg-white/20" />
              <div>
                <h1 className="font-black leading-tight text-white" style={{ fontFamily: "'Arial Black', sans-serif" }}>Cocina</h1>
                <p className="text-xs text-white/50">Panel de pedidos en tiempo real</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={activeLocationId ?? ''}
              onChange={(e) => {
                setActiveLocationId(e.target.value);
                setLoading(true);
              }}
              className="px-3 py-2 rounded-lg bg-white/10 border-2 border-yellow-400/40 text-white font-bold text-sm outline-none focus:border-yellow-400 cursor-pointer"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id} className="bg-stone-900">
                  {loc.name}
                </option>
              ))}
            </select>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-white/70 font-bold hidden sm:inline">En vivo</span>
            <button
              onClick={async () => { await supabase.auth.signOut(); onBack(); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
          <p className="text-sm text-red-200 font-bold bg-black/30 border border-red-400/40 rounded-xl px-4 py-3">
            {error}
          </p>
        </div>
      )}

      {/* Kanban columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {columns.map((col) => {
            const colOrders = orders.filter((o) => o.status === col.status);
            return (
              <div key={col.status} className="flex flex-col">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className="font-black text-white uppercase" style={{ fontFamily: "'Arial Black', sans-serif" }}>{col.title}</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-yellow-400 text-black text-sm font-black">
                    {colOrders.length}
                  </span>
                </div>
                <div className="space-y-3 min-h-[200px]">
                  {colOrders.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-white/20 py-10 text-center">
                      <p className="text-white/40 text-sm">Sin pedidos</p>
                    </div>
                  ) : (
                    colOrders.map((order) => {
                      const cfg = STATUS_CONFIG[order.status];
                      const Icon = cfg.icon;
                      const next = NEXT_STATUS[order.status];
                      const actionLabel = ACTION_LABEL[order.status];
                      const isUpdating = updatingId === order.id;
                      return (
                        <div
                          key={order.id}
                          className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} p-4 shadow-sm`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <span className="text-lg font-black text-yellow-400" style={{ fontFamily: "'Arial Black', sans-serif" }}>
                                #{String(order.number).padStart(3, '0')}
                              </span>
                              <p className="text-sm text-white font-bold">
                                {order.customer_name}
                              </p>
                            </div>
                            <div className={`flex items-center gap-1.5 ${cfg.color}`}>
                              <Icon className="w-4 h-4" />
                              <span className="text-xs font-bold">{cfg.label}</span>
                            </div>
                          </div>

                          <div className="text-xs text-white/50 mb-3">
                            {timeAgo(order.created_at)}
                          </div>

                          <div className="space-y-1.5 mb-3">
                            {order.order_items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-start gap-2 text-sm bg-black/20 rounded-lg px-3 py-2"
                              >
                                <span className="font-black text-yellow-400 min-w-[1.5rem]">
                                  {item.quantity}×
                                </span>
                                <div className="flex-1">
                                  <span className="font-bold text-white">
                                    {item.name}
                                  </span>
                                  {item.notes && (
                                    <p className="text-xs text-white/50 italic mt-0.5">
                                      {item.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {order.notes && (
                            <div className="text-xs text-white/70 bg-black/20 rounded-lg px-3 py-2 mb-3">
                              <span className="font-bold text-yellow-400">Nota: </span>
                              {order.notes}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-white/10">
                            <span className="font-black text-yellow-400" style={{ fontFamily: "'Arial Black', sans-serif" }}>
                              ${Number(order.total).toFixed(2)}
                            </span>
                            <div className="flex gap-2">
                              {order.status === 'pending' && (
                                <button
                                  onClick={() => cancelOrder(order)}
                                  disabled={isUpdating}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-300 bg-red-500/20 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                >
                                  Cancelar
                                </button>
                              )}
                              {next && actionLabel && (
                                <button
                                  onClick={() => advanceOrder(order)}
                                  disabled={isUpdating}
                                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-black bg-yellow-400 text-black hover:bg-yellow-300 transition-colors disabled:opacity-50"
                                >
                                  {isUpdating ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
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
