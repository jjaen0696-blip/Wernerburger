import { MapPin, Sparkles, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Delivery() {
  const { orders, updateOrderStatus } = useCart();
  const deliveryOrders = orders.filter((order) => order.deliveryType === 'delivery' && order.status === 'assigned');

  return (
    <div className="bg-black min-h-screen pb-16 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-[2rem] border border-fuchsia-400/15 bg-[#11070f]/95 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-fuchsia-300/70">Interfaz de delivery</p>
              <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.2em] text-white">Pedidos para repartir</h1>
              <p className="mt-3 max-w-2xl text-gray-300">Solo los repartidores ven esta pantalla. Acepta pedidos asignados y marca el estado de entrega.</p>
            </div>
            <div className="inline-flex items-center gap-3 rounded-full border border-fuchsia-400/20 bg-white/5 px-4 py-3 text-sm text-fuchsia-100 shadow-[0_12px_30px_rgba(192,83,255,0.12)] backdrop-blur-sm">
              <Sparkles className="h-5 w-5 text-fuchsia-300" />
              <span>Pedidos listos para delivery</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-fuchsia-200">Pendientes</p>
              <p className="mt-3 text-3xl font-black text-white">{deliveryOrders.length}</p>
              <p className="mt-2 text-sm text-gray-400">Pedidos asignados a delivery esperando que aceptes.</p>
            </div>
          </div>
        </div>

        {deliveryOrders.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-12 text-center text-gray-400 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            <p className="text-lg font-semibold text-white">No hay órdenes de delivery asignadas</p>
            <p className="mt-3 text-sm text-gray-400">Verás las órdenes aquí cuando el equipo de cocina las asigne.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {deliveryOrders.map((order) => (
              <article key={order.id} className="rounded-[2rem] border border-fuchsia-400/20 bg-[#130815]/95 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3 text-sm uppercase tracking-[0.2em] text-fuchsia-200">
                      <span className="rounded-full bg-fuchsia-500/10 px-3 py-1">{order.id}</span>
                      <span>{new Date(order.placedAt).toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="rounded-full border border-fuchsia-400/30 bg-black/40 px-3 py-1 text-fuchsia-100">Asignado</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-300">
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                        <MapPin className="h-4 w-4 text-fuchsia-300" />
                        {order.address ?? 'Ubicación no disponible'}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                        <Truck className="h-4 w-4 text-fuchsia-300" />
                        {order.paymentMethod === 'yappy' ? 'Pago Yappy' : 'Efectivo'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-white">${order.total.toFixed(2)}</p>
                    <p className="text-sm text-gray-400">{order.items.length} artículos</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                    <h2 className="text-sm uppercase tracking-[0.25em] text-fuchsia-200">Información del cliente</h2>
                    <div className="mt-4 space-y-3 text-sm text-gray-200">
                      <div>
                        <p className="font-semibold text-white">{order.customerName}</p>
                        <p className="text-xs text-gray-400">{order.phone}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-fuchsia-200">Ubicación</p>
                        <p className="mt-1 text-sm text-gray-200">{order.address ?? 'Sin ubicación'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col justify-between rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                    <button
                      type="button"
                      onClick={() => updateOrderStatus(order.id, 'delivering')}
                      className="w-full rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 px-4 py-3 text-sm font-black text-white transition hover:brightness-110"
                    >
                      Aceptar y salir
                    </button>
                    <button
                      type="button"
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-fuchsia-400 transition hover:bg-white/10"
                    >
                      Marcar entregado
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
