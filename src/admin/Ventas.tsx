import { useEffect, useState, useCallback } from 'react';
import { DollarSign, Globe, Store, SlidersHorizontal, Wallet, CreditCard, Receipt, Building2 } from 'lucide-react';
import { supabase, type Location, type Profile, checkSupabaseConnection, getCurrentProfile } from '../lib/supabase';
import { fmtMoney } from '../lib/inventory';
import { StatCard, SelectInput, TextInput, Spinner, EmptyState } from './ui';

type Pay = { method: string; total: number; count: number };
type Branch = { location_id: string; name: string; total: number; count: number; web_total: number; local_total: number };
type SalesReport = {
  is_admin: boolean;
  total: number; count: number;
  web_total: number; web_count: number;
  local_total: number; local_count: number;
  by_payment: Pay[];
  by_branch: Branch[];
};

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
const todayStr = () => new Date().toISOString().slice(0, 10);

const PAY_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
  otro: 'Otro',
  sin_especificar: 'Sin especificar (web)',
};

export default function Ventas({ profile }: { profile: Profile }) {
  const isAdmin = profile.role === 'admin';
  const [locations, setLocations] = useState<Location[]>([]);
  const [scope, setScope] = useState(isAdmin ? '' : (profile.location_id ?? ''));
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(todayStr());
  const [rep, setRep] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    const loadLocations = async () => {
      let result = await supabase.from('locations').select('id,slug,name,address,is_active,is_open,created_at').eq('is_active', true).order('name');
      if (result.error && /is_open|column/i.test(result.error.message)) {
        result = await supabase.from('locations').select('id,slug,name,address,is_active,created_at').eq('is_active', true).order('name');
      }
      setLocations(result.data ?? []);
    };
    loadLocations();
  }, [isAdmin]);

  const load = useCallback(async () => {
    setLoading(true);
    const p_from = new Date(from).toISOString();
    const p_to = new Date(to + 'T23:59:59').toISOString();
    const { data } = await supabase.rpc('inv_sales_report', { p_location: scope || null, p_from, p_to });
    setRep((data as SalesReport) ?? null);
    setLoading(false);
  }, [scope, from, to]);

  useEffect(() => { load(); }, [load]);

  // Recargar en vivo cuando cambian los pedidos (ventas web o de mostrador).
  useEffect(() => {
    const ch = supabase.channel('ventas-report')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const setPreset = (n: number) => { setFrom(daysAgo(n)); setTo(todayStr()); };

  const showBranches = isAdmin && !scope && rep && rep.by_branch.length > 0;
  const branchMax = showBranches ? Math.max(1, ...rep!.by_branch.map((b) => Number(b.total))) : 1;

  

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold uppercase tracking-tight text-white"><DollarSign className="h-6 w-6 text-gold" /> Ventas</h2>
          <p className="mt-1 text-[13px] text-white/45">Ingresos por ventas completadas (web + local) por periodo. {isAdmin ? 'Global y por sucursal.' : 'De tu sucursal.'}</p>
        </div>
      </div>

      {/* Deleted: soft-reset UI removed per request */}

      {/* Filtros */}
      <div className="mb-5 flex flex-wrap items-end gap-3 rounded-[18px] border border-white/10 bg-ink-800/70 p-3">
        <div className="flex items-center gap-2 text-white/50"><SlidersHorizontal className="h-4 w-4" /></div>
        {isAdmin && (
          <SelectInput value={scope} onChange={(e) => setScope(e.target.value)} className="!py-2.5 max-w-[200px] text-[13px]">
            <option value="" className="bg-ink-800">Global (todas)</option>
            {locations.map((l) => <option key={l.id} value={l.id} className="bg-ink-800">{l.name}</option>)}
          </SelectInput>
        )}
        <TextInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="!py-2.5 max-w-[160px] text-[13px]" />
        <span className="text-white/40">→</span>
        <TextInput type="date" value={to} onChange={(e) => setTo(e.target.value)} className="!py-2.5 max-w-[160px] text-[13px]" />
        <div className="flex gap-1.5">
          {[7, 30, 90].map((n) => <button key={n} onClick={() => setPreset(n)} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] font-bold text-white/60 transition-colors hover:border-gold/40 hover:text-gold">{n}d</button>)}
        </div>
      </div>

      {loading || !rep ? <Spinner label="Calculando ventas…" /> : (
        <div className="space-y-5">
          {/* Totales */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Total vendido" value={fmtMoney(rep.total)} sub={`${rep.count} ventas`} icon={<Wallet className="h-3.5 w-3.5" />} tone="green" />
            <StatCard label="Ventas web" value={fmtMoney(rep.web_total)} sub={`${rep.web_count} pedidos`} icon={<Globe className="h-3.5 w-3.5" />} tone="gold" />
            <StatCard label="Ventas en local" value={fmtMoney(rep.local_total)} sub={`${rep.local_count} ventas`} icon={<Store className="h-3.5 w-3.5" />} tone="gold" />
            <StatCard label="Ticket promedio" value={fmtMoney(rep.count > 0 ? rep.total / rep.count : 0)} icon={<Receipt className="h-3.5 w-3.5" />} tone="yellow" />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Por sucursal (admin global) */}
            {showBranches && (
              <div className="rounded-[22px] border border-white/10 bg-ink-800/70 p-5 shadow-soft lg:col-span-2">
                <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-wide text-white/70"><Building2 className="h-4 w-4 text-gold" /> Ventas por sucursal</h3>
                <div className="space-y-3">
                  {rep!.by_branch.map((b) => (
                    <div key={b.location_id}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-[13px]">
                        <span className="font-bold text-white">{b.name}</span>
                        <span className="flex items-center gap-3">
                          <span className="text-white/40">{b.count} ventas</span>
                          <span className="font-display font-extrabold text-gold">{fmtMoney(b.total)}</span>
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
                        <div className="h-full rounded-full bg-gradient-to-r from-gold/60 to-gold" style={{ width: `${(Number(b.total) / branchMax) * 100}%` }} />
                      </div>
                      <div className="mt-1 flex gap-4 text-[11px] text-white/40">
                        <span><Globe className="mr-1 inline h-3 w-3" />Web {fmtMoney(b.web_total)}</span>
                        <span><Store className="mr-1 inline h-3 w-3" />Local {fmtMoney(b.local_total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Por método de pago */}
            <div className="rounded-[22px] border border-white/10 bg-ink-800/70 p-5 shadow-soft">
              <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-wide text-white/70"><CreditCard className="h-4 w-4 text-emerald-400" /> Por método de pago</h3>
              {rep.by_payment.length === 0 ? <EmptyState title="Sin ventas en el periodo" icon={<Receipt className="h-6 w-6" />} /> :
                <ul className="space-y-2">
                  {rep.by_payment.map((p) => (
                    <li key={p.method} className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-bold text-white">{PAY_LABELS[p.method] ?? p.method}</span>
                      <span className="flex items-center gap-3">
                        <span className="text-white/40">{p.count}</span>
                        <span className="text-gold">{fmtMoney(p.total)}</span>
                      </span>
                    </li>
                  ))}
                </ul>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
