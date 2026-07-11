import { useEffect, useState } from 'react';
import { MapPin, Sparkles, Truck, Phone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  status: string;
  total_amount: number;
  items: any[];
  created_at: string;
  branch_id: string;
  payment_method: string;
}

export default function Delivery() {
  const { user, branchId } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!branchId) return;

    setLoading(true);

    // Obtener órdenes de delivery iniciales
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders_with_items')
        .select('*')
        .eq('branch_id', branchId)
        .eq('delivery_type', 'delivery')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false });

      if (!error && data) setOrders(data as Order[]);
      setLoading(false);
    };

    void fetchOrders();

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel(`delivery-${branchId}`)
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

  const updateStatus = async (orderId: number, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (!error) {
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    }
  };

  const readyOrders = orders.filter(o => o.status === 'ready');
  const inTransitOrders = orders.filter(o => o.status === 'delivering');
  const completedOrders = orders.filter(o => o.status === 'completed');

  return (
    <div className="bg-black min-h-screen pb-16 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 rounded-[2rem] border border-fuchsia-400/15 bg-[#11070f]/95 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500 p-3">
                <Truck className="h-6 w-6 text-black" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-fuchsia-300/70">Delivery</p>
                <h1 className="text-2xl font-black text-white">Gestión de Entregas</h1>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-fuchsia-400/20 bg-white/5 px-4 py-2 text-sm text-fuchsia-100">
              <Sparkles className="h-4 w-4 text-fuchsia-300" />
              <span>En tiempo real</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Cargando entregas...</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            {/* LISTOS PARA ENTREGAR */}
            <section className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-yellow-200">🚚 Para Entregar</h2>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500 text-xs font-bold">
                  {readyOrders.length}
                </span>
              </div>

              {readyOrders.length === 0 ? (
                <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4 text-center text-gray-400 text-sm">
                  Sin entregas pendientes
                </div>
              ) : (
                <div className="space-y-3">
                  {readyOrders.map(order => (
                    <DeliveryCard
                      key={order.id}
                      order={order}
                      onStatusChange={updateStatus}
                      status="ready"
                    />
                  ))}
                </div>
              )}
            </section>

            {/* EN TRÁNSITO */}
            <section className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-blue-200">📍 En Tránsito</h2>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold">
                  {inTransitOrders.length}
                </span>
              </div>

              {inTransitOrders.length === 0 ? (
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4 text-center text-gray-400 text-sm">
                  Sin entregas en tránsito
                </div>
              ) : (
                <div className="space-y-3">
                  {inTransitOrders.map(order => (
                    <DeliveryCard
                      key={order.id}
                      order={order}
                      onStatusChange={updateStatus}
                      status="delivering"
                    />
                  ))}
                </div>
              )}
            </section>

            {/* COMPLETADAS */}
            <section className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-green-200">✅ Completadas</h2>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-xs font-bold">
                  {completedOrders.length}
                </span>
              </div>

              {completedOrders.length === 0 ? (
                <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-center text-gray-400 text-sm">
                  Sin entregas completadas
                </div>
              ) : (
                <div className="space-y-3">
                  {completedOrders.slice(0, 5).map(order => (
                    <div key={order.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                      <p className="text-xs font-mono text-green-300 font-bold">{order.order_number}</p>
                      <p className="text-sm font-semibold text-white truncate">{order.customer_name}</p>
                      <p className="text-xs text-gray-400">${order.total_amount}</p>
                    </div>
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

// Componente para tarjeta de entrega
function DeliveryCard({ 
  order, 
  onStatusChange,
  status
}: { 
  order: Order;
  onStatusChange: (id: number, status: string) => Promise<void>;
  status: string;
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    await onStatusChange(order.id, newStatus);
    setIsUpdating(false);
  };

  const createdTime = new Date(order.created_at).toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const getNextAction = (status: string) => {
    if (status === 'ready') return { label: 'Salir a entregar', status: 'delivering' };
    if (status === 'delivering') return { label: 'Marcar entregado', status: 'completed' };
    return null;
  };

  const nextAction = getNextAction(status);

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-mono text-fuchsia-300 font-bold">{order.order_number}</p>
          <p className="text-sm font-semibold text-white truncate">{order.customer_name}</p>
          <p className="text-xs text-gray-400">{createdTime}</p>
        </div>
        <p className="text-right font-bold text-fuchsia-200">${order.total_amount}</p>
      </div>

      {order.customer_phone && (
        <div className="flex items-center gap-2 text-xs text-gray-300 border-t border-white/10 pt-2">
          <Phone className="h-3 w-3 text-fuchsia-300" />
          <a href={`tel:${order.customer_phone}`} className="hover:text-fuchsia-300">
            {order.customer_phone}
          </a>
        </div>
      )}

      {order.customer_address && (
        <div className="flex items-start gap-2 text-xs text-gray-300">
          <MapPin className="h-3 w-3 text-fuchsia-300 mt-0.5 flex-shrink-0" />
          <p className="break-words">{order.customer_address}</p>
        </div>
      )}

      {order.items && order.items.length > 0 && (
        <div className="border-t border-white/10 pt-2 space-y-1">
          {order.items.map((item: any) => (
            <div key={item.id} className="flex justify-between text-xs text-gray-300">
              <span>{item.quantity}x {item.product_name}</span>
            </div>
          ))}
        </div>
      )}

      {nextAction && (
        <button
          onClick={() => handleStatusChange(nextAction.status)}
          disabled={isUpdating}
          className="w-full rounded-lg bg-gradient-to-r from-fuchsia-500 to-pink-500 px-3 py-2 text-xs font-bold text-white transition-opacity disabled:opacity-50"
        >
          {isUpdating ? 'Actualizando...' : nextAction.label}
        </button>
      )}
    </div>
  );
}
