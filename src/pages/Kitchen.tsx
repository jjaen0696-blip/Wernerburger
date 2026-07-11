import { useEffect, useState } from 'react';
import { Sparkles, Clock, ChefHat } from 'lucide-react';
import { supabase, type OrderWithItems, type OrderStatus } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type Page = 'home' | 'menu' | 'kitchen' | 'delivery' | 'login' | 'admin' | 'pos';

type Props = {
  onNavigate?: (page: Page) => void;
};

export default function Kitchen({ onNavigate }: Props) {
  const { user, branchId } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!branchId) return;

    setLoading(true);

    // Obtener órdenes iniciales
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders_with_items')
        .select('*')
        .eq('branch_id', branchId)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false });

      if (!error && data) setOrders(data as unknown as OrderWithItems[]);
      setLoading(false);
    };

    void fetchOrders();

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel(`kitchen-${branchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `branch_id=eq.${branchId}`
        },
        () => {
          void fetchOrders();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [branchId]);

  const statusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending': 'Pendiente',
      'accepted': 'Aceptado',
      'preparing': 'En preparación',
      'ready': 'Listo',
      'assigned': 'Asignado',
      'delivering': 'En ruta',
      'completed': 'Terminado',
      'cancelled': 'Cancelado'
    };
    return labels[status] || status;
  };

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-red-500/20 border-red-500/30 text-red-200',
      'accepted': 'bg-yellow-500/20 border-yellow-500/30 text-yellow-200',
      'preparing': 'bg-blue-500/20 border-blue-500/30 text-blue-200',
      'ready': 'bg-green-500/20 border-green-500/30 text-green-200',
      'completed': 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200'
    };
    return colors[status] || 'bg-gray-500/20 border-gray-500/30 text-gray-200';
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (!error) {
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus as OrderStatus } : o));
    }
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter);

  const pendingOrders = orders.filter(o => ['pending', 'accepted'].includes(o.status));
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  return (
    <div className="bg-black min-h-screen pb-16 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 rounded-[2rem] border border-amber-400/15 bg-[#080805]/95 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gradient-to-br from-amber-500 to-orange-500 p-3">
                <ChefHat className="h-6 w-6 text-black" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-amber-300/70">Cocina</p>
                <h1 className="text-2xl font-black text-white">Preparación de Órdenes</h1>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-amber-400/20 bg-white/5 px-4 py-2 text-sm text-amber-100">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>En tiempo real</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Cargando órdenes...</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            {/* PENDIENTES */}
            <section className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-red-200">📋 Pendientes</h2>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold">
                  {pendingOrders.length}
                </span>
              </div>

              {pendingOrders.length === 0 ? (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-center text-gray-400 text-sm">
                  Sin órdenes pendientes
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingOrders.map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onStatusChange={updateStatus}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* EN PREPARACIÓN */}
            <section className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-blue-200">🔥 Preparando</h2>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold">
                  {preparingOrders.length}
                </span>
              </div>

              {preparingOrders.length === 0 ? (
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4 text-center text-gray-400 text-sm">
                  Sin órdenes en preparación
                </div>
              ) : (
                <div className="space-y-3">
                  {preparingOrders.map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onStatusChange={updateStatus}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* LISTOS */}
            <section className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-green-200">✅ Listos</h2>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-xs font-bold">
                  {readyOrders.length}
                </span>
              </div>

              {readyOrders.length === 0 ? (
                <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-center text-gray-400 text-sm">
                  Sin órdenes listas
                </div>
              ) : (
                <div className="space-y-3">
                  {readyOrders.map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onStatusChange={updateStatus}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente para tarjeta de orden
function OrderCard({ order, onStatusChange }: { 
  order: OrderWithItems; 
  onStatusChange: (id: string, status: string) => Promise<void> 
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    await onStatusChange(order.id, newStatus);
    setIsUpdating(false);
  };

  const getNextStatus = (status: string): { label: string; status: string } | null => {
    const transitions: Record<string, { label: string; status: string }> = {
      'pending': { label: 'Aceptar', status: 'accepted' },
      'accepted': { label: 'Preparando', status: 'preparing' },
      'preparing': { label: 'Listo', status: 'ready' },
      'ready': { label: 'Entregado', status: 'completed' }
    };
    return transitions[status] || null;
  };

  const nextAction = getNextStatus(order.status);
  const createdTime = new Date(order.created_at).toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-mono text-amber-300 font-bold">#{order.number}</p>
          <p className="text-sm font-semibold text-white truncate">{order.customer_name}</p>
          <p className="text-xs text-gray-400">{createdTime}</p>
        </div>
        <p className="text-right font-bold text-amber-200">${order.total_amount}</p>
      </div>

      {order.order_items && order.order_items.length > 0 && (
        <div className="border-t border-white/10 pt-2 space-y-1">
          {order.order_items.map((item: any) => (
            <div key={item.id} className="flex justify-between text-xs text-gray-300">
              <span>{item.quantity}x {item.product_name}</span>
              <span>${item.subtotal}</span>
            </div>
          ))}
        </div>
      )}

      {nextAction && (
        <button
          onClick={() => handleStatusChange(nextAction.status)}
          disabled={isUpdating}
          className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-2 text-xs font-bold text-black transition-opacity disabled:opacity-50"
        >
          {isUpdating ? 'Actualizando...' : nextAction.label}
        </button>
      )}
    </div>
  );
}
