import { useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard, Package, Wallet, AlertTriangle, PackageX, TrendingDown, Flame,
  ShoppingCart, Send, ArrowLeftRight, Bell,
} from 'lucide-react';
import { supabase, type Location, type Profile } from '../lib/supabase';
import { fmtMoney, fmtQty } from '../lib/inventory';
import { StatCard, Pill, Spinner, SelectInput, EmptyState } from './ui';
import MovementsList from './MovementsList';

type Dash = {
  is_admin: boolean; products: number; central_value: number; branch_value: number; total_value: number;
  low: number; out: number; consumo_today: number; consumo_week: number; consumo_month: number;
  dist_week: number; trans_week: number; purch_week: number;
};
type Alert = { scope: string; location_name: string; product_name: string; qty: number; min_stock: number; state: string };
type Series = { day: string; total: number };
type Top = { product_name: string; total: number };

function Bars({ data }: { data: Series[] }) {
  const max = Math.max(1, ...data.map((d) => Number(d.total)));
  return (
    <div>
      <div className="flex h-36 items-end gap-1">
        {data.map((d, i) => (
          <div key={i} className="group flex flex-1 flex-col items-center justify-end" title={`${d.day}: ${fmtQty(d.total)}`}>
            <span className="mb-1 text-[9px] font-bold text-white/0 transition-colors group-hover:text-gold">{Number(d.total) > 0 ? fmtQty(d.total) : ''}</span>
            <div className="w-full rounded-t bg-gradient-to-t from-gold/40 to-gold transition-all" style={{ height: `${(Number(d.total) / max) * 100}%`, minHeight: Number(d.total) > 0 ? 3 : 1 }} />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-white/30">
        <span>{data[0] ? new Date(data[0].day).toLocaleDateString('es', { day: '2-digit', month: 'short' }) : ''}</span>
        <span>hoy</span>
      </div>
    </div>
  );
}

export default function Dashboard({ profile }: { profile: Profile }) {
  const isAdmin = profile.role === 'admin';
  const [locations, setLocations] = useState<Location[]>([]);
  const [scope, setScope] = useState<string>(isAdmin ? '' : (profile.location_id ?? ''));
  const [dash, setDash] = useState<Dash | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [top, setTop] = useState<Top[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) supabase.from('locations').select('*').eq('is_active', true).order('name').then(({ data }: any) => setLocations(data ?? []));
  }, [isAdmin]);

  const load = useCallback(async () => {
    const loc = scope || null;
    const [d, a, s, t] = await Promise.all([
      supabase.rpc('inv_dashboard', { p_location: loc }),
      supabase.rpc('inv_alerts', { p_location: loc }),
      supabase.rpc('inv_consumption_series', { p_location: loc, p_days: 14 }),
      supabase.rpc('inv_top_consumed', { p_location: loc, p_days: 30, p_limit: 8 }),
    ]);
    setDash(d.data ?? null);
    setAlerts((a.data ?? []) as Alert[]);
    setSeries((s.data ?? []) as Series[]);
    setTop((t.data ?? []) as Top[]);
    setLoading(false);
  }, [scope]);

  useEffect(() => {
    setLoading(true);
    load();
    const ch = supabase.channel('dashboard-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inv_movements' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inv_branch_stock' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inv_products' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const topMax = Math.max(1, ...top.map((t) => Number(t.total)));

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold uppercase tracking-tight text-white">
            <LayoutDashboard className="h-6 w-6 text-gold" /> Dashboard
          </h2>
          <p className="mt-1 text-[13px] text-white/45">Métricas y alertas de inventario en tiempo real.</p>
        </div>
        {isAdmin && (
          <SelectInput value={scope} onChange={(e) => setScope(e.target.value)} className="max-w-[240px]">
            <option value="" className="bg-ink-800">Global (todas)</option>
            {locations.map((l) => <option key={l.id} value={l.id} className="bg-ink-800">{l.name}</option>)}
          </SelectInput>
        )}
      </div>

      {loading || !dash ? <Spinner label="Cargando métricas…" /> : (
        <div className="space-y-5">
          {/* KPIs principales */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Valor total inventario" value={fmtMoney(dash.total_value)} icon={<Wallet className="h-3.5 w-3.5" />} tone="green" sub={isAdmin ? `Central ${fmtMoney(dash.central_value)} · Sucursal ${fmtMoney(dash.branch_value)}` : undefined} />
            <StatCard label="Productos" value={dash.products} icon={<Package className="h-3.5 w-3.5" />} tone="gold" />
            <StatCard label="Stock bajo" value={dash.low} icon={<AlertTriangle className="h-3.5 w-3.5" />} tone="yellow" />
            <StatCard label="Agotados" value={dash.out} icon={<PackageX className="h-3.5 w-3.5" />} tone="red" />
          </div>

          {/* Consumo + movimientos semana */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Consumo hoy" value={fmtQty(dash.consumo_today)} icon={<TrendingDown className="h-3.5 w-3.5" />} tone="gold" />
            <StatCard label="Consumo semana" value={fmtQty(dash.consumo_week)} icon={<TrendingDown className="h-3.5 w-3.5" />} tone="gold" />
            <StatCard label="Consumo mes" value={fmtQty(dash.consumo_month)} icon={<TrendingDown className="h-3.5 w-3.5" />} tone="gold" />
            <StatCard label="Movimientos (7d)" value={`${dash.purch_week}C · ${dash.dist_week}D · ${dash.trans_week}T`} icon={<ArrowLeftRight className="h-3.5 w-3.5" />} tone="gray"
              sub={<span className="flex gap-2"><ShoppingCart className="h-3 w-3" /><Send className="h-3 w-3" /><ArrowLeftRight className="h-3 w-3" /></span>} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Gráfica consumo */}
            <div className="rounded-[22px] border border-white/10 bg-ink-800/70 p-5 shadow-soft">
              <h3 className="mb-4 flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-wide text-white/70"><TrendingDown className="h-4 w-4 text-gold" /> Consumo diario (14 días)</h3>
              <Bars data={series} />
            </div>

            {/* Top consumidos */}
            <div className="rounded-[22px] border border-white/10 bg-ink-800/70 p-5 shadow-soft">
              <h3 className="mb-4 flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-wide text-white/70"><Flame className="h-4 w-4 text-gold" /> Más consumidos (30 días)</h3>
              {top.length === 0 ? <p className="py-8 text-center text-sm text-white/35">Sin consumo registrado aún.</p> : (
                <div className="space-y-2.5">
                  {top.map((t) => (
                    <div key={t.product_name}>
                      <div className="mb-1 flex items-center justify-between text-[13px]"><span className="font-bold text-white">{t.product_name}</span><span className="text-gold">{fmtQty(t.total)}</span></div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-gold/60 to-gold" style={{ width: `${(Number(t.total) / topMax) * 100}%` }} /></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Alertas + Movimientos recientes */}
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-[22px] border border-white/10 bg-ink-800/70 p-5 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-wide text-white/70"><Bell className="h-4 w-4 text-gold" /> Alertas de stock</h3>
                {alerts.length > 0 && <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-black ${alerts.some((a) => a.state === 'agotado') ? 'bg-red-500/15 text-red-300 animate-pulse' : 'bg-amber-500/15 text-amber-300'}`}>{alerts.length}</span>}
              </div>
              {alerts.length === 0 ? <EmptyState title="Todo en orden" subtitle="No hay productos en stock bajo ni agotados." icon={<Package className="h-6 w-6" />} /> : (
                <div className="max-h-80 space-y-2 overflow-y-auto scrollbar-hide">
                  {alerts.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                      <Pill tone={a.state === 'agotado' ? 'red' : 'yellow'}>{a.state === 'agotado' ? 'Agotado' : 'Bajo'}</Pill>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-white">{a.product_name}</p>
                        <p className="text-[11px] text-white/40">{a.location_name}</p>
                      </div>
                      <span className="text-sm font-bold text-white">{fmtQty(a.qty)}<span className="text-[11px] text-white/40"> / min {fmtQty(a.min_stock)}</span></span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[22px] border border-white/10 bg-ink-800/70 p-5 shadow-soft">
              <MovementsList title="Movimientos recientes" limit={12} locationId={isAdmin ? (scope || null) : profile.location_id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
