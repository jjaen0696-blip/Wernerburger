import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  CheckCircle2, ArrowLeft, ShoppingBag, Clock, ChefHat, PackageCheck, Bike, MapPin, Phone, XCircle,
} from 'lucide-react';
import { supabase, type Order, type OrderStatus, type OrderType } from '../lib/supabase';

type Props = {
  orderId: string;
  orderNumber: number;
  orderType: OrderType;
  onBackHome: () => void;
  onOrderAgain: () => void;
  onFinished?: (status: OrderStatus) => void;
};

type Step = { status: OrderStatus; label: string; desc: string; icon: LucideIcon };

// Pasos del seguimiento según el tipo de pedido.
const PICKUP_STEPS: Step[] = [
  { status: 'pending', label: 'Recibido', desc: 'La cocina recibió tu pedido', icon: Clock },
  { status: 'preparing', label: 'En preparación', desc: 'Están cocinando lo tuyo', icon: ChefHat },
  { status: 'ready', label: 'Listo para retirar', desc: 'Pásalo a buscar al local', icon: PackageCheck },
  { status: 'completed', label: 'Entregado', desc: '¡Que lo disfrutes!', icon: CheckCircle2 },
];

const DELIVERY_STEPS: Step[] = [
  { status: 'pending', label: 'Recibido', desc: 'La cocina recibió tu pedido', icon: Clock },
  { status: 'preparing', label: 'En preparación', desc: 'Están cocinando lo tuyo', icon: ChefHat },
  { status: 'ready', label: 'Listo', desc: 'Tu pedido está listo y empacado', icon: PackageCheck },
  { status: 'en_camino', label: 'En camino', desc: 'El repartidor va en camino a tu ubicación', icon: Bike },
  { status: 'completed', label: 'Entregado', desc: '¡Que lo disfrutes!', icon: CheckCircle2 },
];

export default function OrderTracking({ orderId, orderNumber, orderType, onBackHome, onOrderAgain, onFinished }: Props) {
  const steps = orderType === 'delivery' ? DELIVERY_STEPS : PICKUP_STEPS;
  const [status, setStatus] = useState<OrderStatus>('pending');
  const [order, setOrder] = useState<Order | null>(null);

  // Carga inicial + suscripción en tiempo real a este pedido.
  useEffect(() => {
    let active = true;

    const fetchOrder = async () => {
      const { data } = await supabase.from('orders').select('*').eq('id', orderId).single();
      if (active && data) {
        setOrder(data);
        setStatus(data.status);
        if (data.status === 'completed' || data.status === 'cancelled') {
          onFinished?.(data.status);
        }
      }
    };
    fetchOrder();

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          const next = payload.new as Order;
          setOrder(next);
          setStatus(next.status);
          if (next.status === 'completed' || next.status === 'cancelled') {
            onFinished?.(next.status);
          }
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [orderId, onFinished]);

  const cancelled = status === 'cancelled';
  const currentIndex = steps.findIndex((s) => s.status === status);
  const mapsUrl =
    order?.delivery_lat != null && order?.delivery_lng != null
      ? `https://www.google.com/maps/search/?api=1&query=${order.delivery_lat},${order.delivery_lng}`
      : null;

  return (
    <div className="min-h-screen bg-premium flex items-center justify-center px-4 sm:px-6 py-10 text-white">
      <div className="max-w-md w-full animate-fade-up">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="/werner-chef.png"
            alt="WernerBurguer logo"
            className="w-20 h-20 rounded-full border-2 border-gold/60 object-cover shadow-glow-gold"
          />
        </div>

        {/* Encabezado */}
        <div className="text-center mb-7">
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight mb-2">
            ¡Pedido <span className="text-gold-grad">enviado!</span>
          </h1>
          <p className="text-white/60 text-sm leading-relaxed">
            Sigue el estado de tu pedido aquí en tiempo real.
          </p>
        </div>

        {/* Número + tipo de entrega */}
        <div className="glass-strong rounded-[28px] p-6 mb-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1">N.º de pedido</p>
              <p className="font-display text-4xl font-extrabold text-gold-grad leading-none">
                #{String(orderNumber).padStart(3, '0')}
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${
                orderType === 'delivery'
                  ? 'border-gold/40 bg-gold/10 text-gold-light'
                  : 'border-white/15 bg-white/[0.05] text-white/70'
              }`}
            >
              {orderType === 'delivery' ? <Bike className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
              {orderType === 'delivery' ? 'Delivery' : 'Retiro en local'}
            </span>
          </div>

          {/* Recap de ubicación / contacto (solo delivery) */}
          {orderType === 'delivery' && (order?.customer_phone || mapsUrl) && (
            <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
              {order?.customer_phone && (
                <p className="flex items-center gap-2 text-sm text-white/70">
                  <Phone className="h-4 w-4 text-gold" />
                  {order.customer_phone}
                </p>
              )}
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-gold transition-colors hover:text-gold-light"
                >
                  <MapPin className="h-4 w-4" />
                  Ver la ubicación que compartiste
                </a>
              )}
            </div>
          )}
        </div>

        {/* Seguimiento */}
        {cancelled ? (
          <div className="glass-strong rounded-[28px] p-6 mb-7 shadow-card text-center">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-brand/20">
              <XCircle className="h-8 w-8 text-red-300" />
            </div>
            <p className="font-display text-lg font-extrabold text-white">Pedido cancelado</p>
            <p className="mt-1 text-sm text-white/55">
              Este pedido fue cancelado. Si crees que es un error, comunícate con el local.
            </p>
          </div>
        ) : (
          <div className="glass-strong rounded-[28px] p-6 mb-7 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-sm font-extrabold uppercase tracking-wide text-white/80">
                Estado del pedido
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold text-emerald-300">En vivo</span>
              </span>
            </div>

            <ol className="space-y-1">
              {steps.map((step, i) => {
                const done = currentIndex > i;
                const active = currentIndex === i;
                const Icon = step.icon;
                const isLast = i === steps.length - 1;
                return (
                  <li key={step.status} className="flex gap-3">
                    {/* Columna del icono + línea */}
                    <div className="flex flex-col items-center">
                      <span
                        className={`grid h-10 w-10 place-items-center rounded-full border transition-all ${
                          done
                            ? 'border-gold bg-gold/20 text-gold'
                            : active
                              ? 'border-gold bg-yellow-cta text-ink shadow-glow-gold'
                              : 'border-white/15 bg-white/[0.04] text-white/35'
                        }`}
                      >
                        {done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                      </span>
                      {!isLast && (
                        <span
                          className={`my-1 w-0.5 flex-1 min-h-[22px] rounded-full ${
                            done ? 'bg-gold/60' : 'bg-white/10'
                          }`}
                        />
                      )}
                    </div>

                    {/* Texto */}
                    <div className={`pb-4 pt-1 ${isLast ? 'pb-0' : ''}`}>
                      <p
                        className={`font-display text-[15px] font-bold leading-tight ${
                          active ? 'text-gold' : done ? 'text-white' : 'text-white/40'
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className={`text-xs leading-snug ${active ? 'text-white/70' : 'text-white/40'}`}>
                        {step.desc}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {/* Acciones */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onOrderAgain}
            className="flex items-center justify-center gap-2 rounded-2xl bg-yellow-cta py-4 text-ink font-extrabold uppercase tracking-wide shadow-glow-gold transition-all hover:brightness-105 active:scale-95 min-h-[50px]"
          >
            <ShoppingBag className="h-5 w-5" />
            Hacer otro pedido
          </button>
          <button
            onClick={onBackHome}
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] py-4 text-white/80 font-bold transition-colors hover:bg-white/10 min-h-[50px]"
          >
            <ArrowLeft className="h-5 w-5" />
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
