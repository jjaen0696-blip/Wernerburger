import { useEffect, useRef, useState } from 'react';
import { Loader2, Phone, MapPin, Store } from 'lucide-react';
import { supabase, type OrderWithItems, type Location } from '../lib/supabase';

const DELIVERY_QUEUE = 'delivery_queue';

type Props = {
  onBack: () => void;
};

export default function Delivery({ onBack }: Props) {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!menuOpen) return;
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setMenuOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [menuOpen]);
  useEffect(() => {
    let mounted = true;

    const loadLocations = async () => {
      try {
        const { data: locs } = await supabase.from('locations').select('*').eq('is_active', true).order('name');
        if (!mounted) return;
        if (locs && locs.length > 0) {
          setLocations(locs as Location[]);
          setActiveLocationId((prev) => prev ?? locs[0].id);
        }
      } catch (_) {
        // ignore
      }
    };

    const load = async () => {
      try {
        const base = supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('order_type', 'delivery')
          .in('status', ['ready', 'en_camino'])
          .order('created_at', { ascending: true });

        const query = activeLocationId && activeLocationId !== 'default'
          ? base.eq('location_id', activeLocationId)
          : base;

        const { data, error } = await query;
        if (error) throw error;
        const visible = (data ?? []) as OrderWithItems[];
        if (email) {
          setOrders(visible.filter((o) => {
            if (o.status === 'ready') {
              return o.delivery_assigned_to === 'delivery_queue';
            }
            if (o.status === 'en_camino') {
              return o.delivery_assigned_to === email;
            }
            return false;
          }));
        } else {
          setOrders(visible.filter((o) => o.status === 'ready' ? o.delivery_assigned_to === 'delivery_queue' : o.status === 'en_camino'));
        }
      } catch (err) {
        setError('No se pudieron cargar los pedidos de delivery.');
      } finally {
        setLoading(false);
      }
    };

    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    loadLocations();
    load();

    const channel = supabase
      .channel(`delivery-orders-${activeLocationId ?? 'all'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => load())
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(channel); };
  }, [activeLocationId, email]);

  if (loading) return <div className="min-h-screen bg-premium flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>;
  if (error) return <div className="min-h-screen bg-premium flex items-center justify-center text-white">{error}</div>;

  return (
    <div className="min-h-screen bg-premium text-white">
      <header className="fixed top-0 left-0 right-0 z-30 border-b border-white/10 bg-[#0b0809]/90 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display font-extrabold text-white flex items-center gap-2"><Phone className="h-4 w-4 text-gold" /> Delivery</h1>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <button
                ref={buttonRef}
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 text-white font-bold text-sm"
              >
                <Store className="h-4 w-4 text-gold" />
                {locations.find((l) => l.id === activeLocationId)?.name ?? 'Elegir sucursal'}
              </button>
              {menuOpen && (
                <div
                  ref={menuRef}
                  className="absolute top-full left-0 mt-2 rounded-md border border-white/10 bg-white/[0.04] text-white shadow-lg z-40"
                >
                  <div className="max-h-[144px] overflow-y-auto">
                    {locations.map((l) => {
                      const open = l.is_open ?? true;
                      return (
                        <button
                          key={l.id}
                          type="button"
                          disabled={!open}
                          onClick={() => {
                            if (!open) {
                              setError('Esta sucursal está cerrada hoy. Elige otra para ver los pedidos.');
                              return;
                            }
                            setActiveLocationId(l.id);
                            setMenuOpen(false);
                            setLoading(true);
                          }}
                          className={`flex w-full items-center justify-between gap-3 px-4 py-2 text-left whitespace-nowrap ${open ? 'hover:bg-white/[0.03]' : 'cursor-not-allowed opacity-60'}`}
                        >
                          <span>{l.name}</span>
                          {!open && <span className="rounded-full border border-red-400/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-red-300">Cerrado por hoy</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <button onClick={onBack} className="rounded-2xl border border-white/10 px-3 py-2">Volver</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-6">
        {orders.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] py-10 text-center">No hay pedidos de delivery pendientes</div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-display font-extrabold text-gold-grad">#{String(order.number).padStart(3, '0')}</div>
                    <div className="text-sm text-white/70">{order.customer_name}</div>
                  </div>
                  <div className="text-sm text-white/60">{order.status}</div>
                </div>
                <div className="text-sm text-white/70 mb-2">
                  {order.customer_phone && (<a href={`tel:${order.customer_phone}`} className="flex items-center gap-2"><Phone className="h-4 w-4 text-gold" /> {order.customer_phone}</a>)}
                  {order.delivery_address && (<p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gold" /> {order.delivery_address}</p>)}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-white/60">
                    {order.delivery_assigned_to === 'delivery_queue'
                      ? 'En cola de delivery'
                      : order.delivery_assigned_to
                        ? `Asignado: ${order.delivery_assigned_to}`
                        : 'Sin asignar'}
                  </div>
                  <div className="flex gap-2">
                    {order.status === 'ready' && order.delivery_assigned_to === 'delivery_queue' && email && (
                      <button
                        onClick={async () => {
                          setUpdatingId(order.id);
                          const { error } = await supabase.from('orders').update({ status: 'en_camino', delivery_assigned_to: email }).eq('id', order.id);
                          if (error) setError('No se pudo tomar el pedido.');
                          setUpdatingId(null);
                        }}
                        className="rounded-xl px-3 py-2 bg-yellow-cta text-ink font-black"
                        disabled={updatingId === order.id}
                      >
                        Tomar pedido
                      </button>
                    )}
                    {order.status === 'en_camino' && order.delivery_assigned_to === email && (
                      <button
                        onClick={async () => {
                          setUpdatingId(order.id);
                          const { error } = await supabase.from('orders').update({ status: 'completed' }).eq('id', order.id);
                          if (error) setError('No se pudo actualizar el pedido.');
                          setUpdatingId(null);
                        }}
                        className="rounded-xl px-3 py-2 bg-emerald-500 text-ink font-black"
                        disabled={updatingId === order.id}
                      >
                        Marcar entregado
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {order.order_items.map((it) => (
                    <div key={it.id} className="flex items-start gap-2">
                      <div className="font-black text-gold">{it.quantity}×</div>
                      <div className="flex-1">
                        <div className="font-bold">{it.name}</div>
                        {it.notes && <div className="text-xs italic text-white/45">{it.notes}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
