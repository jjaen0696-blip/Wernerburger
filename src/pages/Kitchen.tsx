import { Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface KitchenProps {
  onNavigate?: (page: 'home' | 'menu' | 'kitchen' | 'delivery') => void;
}

export default function Kitchen({}: KitchenProps) {
  const { orders, updateOrderStatus } = useCart();

  // Mostrar solo pedidos de local en la interfaz de cocina
  const localOrders = orders.filter((o) => !o.deliveryType || o.deliveryType === 'local');

  const statusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'accepted': return 'Aceptado';
      case 'preparing': return 'En preparación';
      case 'ready': return 'Listo';
      case 'assigned': return 'Asignado';
      case 'delivering': return 'En ruta';
      case 'completed': return 'Terminado';
      default: return status;
    }
  };

  return (
    <div className="bg-black min-h-screen pb-16 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-[2rem] border border-amber-400/15 bg-[#080805]/95 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-amber-300/70">Interfaz de cocina</p>
              <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.2em] text-white">Pedidos en preparación</h1>
              <p className="mt-3 max-w-2xl text-gray-300">Interfaz limpia: solo pedidos locales para preparar. Las órdenes de delivery se gestionan en el módulo de Delivery.</p>
            </div>
            <div className="inline-flex items-center gap-3 rounded-full border border-amber-400/20 bg-white/5 px-4 py-3 text-sm text-amber-100 shadow-[0_12px_30px_rgba(245,158,11,0.12)] backdrop-blur-sm">
              <Sparkles className="h-5 w-5 text-amber-300" />
              <span>Actualizado en tiempo real</span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-amber-200">Pedidos locales</h2>
              <span className="text-sm text-gray-400">{localOrders.length} activos</span>
            </div>

            {localOrders.length === 0 ? (
              <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-6 text-center text-gray-400">No hay pedidos locales</div>
            ) : (
              <div className="space-y-4">
                {localOrders.map((order) => (
                  <article key={order.id} className="rounded-xl border border-amber-400/15 bg-[#0d0a07]/90 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 text-sm text-amber-200">
                          <span className="font-bold">{order.id}</span>
                          <span className="text-xs text-gray-400">{statusLabel(order.status)}</span>
                        </div>
                        <p className="mt-2 text-sm text-gray-300">{order.customerName} • {order.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-amber-200">${order.total.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-3">
                      {order.status === 'pending' && (
                        <button onClick={() => updateOrderStatus(order.id, 'accepted')} className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-2 text-sm font-black text-stone-950">Aceptar</button>
                      )}
                      {order.status === 'accepted' && (
                        <button onClick={() => updateOrderStatus(order.id, 'preparing')} className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-2 text-sm font-black text-stone-950">Preparando</button>
                      )}
                      {order.status === 'preparing' && (
                        <button onClick={() => updateOrderStatus(order.id, 'ready')} className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-2 text-sm font-black text-stone-950">Listo</button>
                      )}
                      {order.status === 'ready' && (
                        <button onClick={() => updateOrderStatus(order.id, 'completed')} className="rounded-full bg-emerald-500/90 px-3 py-2 text-sm font-black text-stone-950">Terminado</button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
