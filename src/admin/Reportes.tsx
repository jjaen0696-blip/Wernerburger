import { useEffect, useState, useCallback } from 'react';
import { BarChart3, Download, ShoppingCart, Send, ArrowLeftRight, TrendingDown, SlidersHorizontal, TrendingUp, Wallet } from 'lucide-react';
import { supabase, type Location, type Profile } from '../lib/supabase';
import { fmtMoney, fmtQty, toCSV, downloadCSV } from '../lib/inventory';
import { StatCard, SelectInput, TextInput, GhostButton, Spinner } from './ui';

type Report = {
  compras: number; compras_n: number; distribuciones: number; distribuciones_n: number;
  transferencias: number; transferencias_n: number; consumo: number; consumo_n: number;
  ajustes_net: number; ajustes_n: number; perdidas: number;
  valor_central: number; valor_sucursal: number; valor_total: number;
};
type Rank = { product_name: string; total: number; movements: number };

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
const todayStr = () => new Date().toISOString().slice(0, 10);

export default function Reportes({ profile }: { profile: Profile }) {
  const isAdmin = profile.role === 'admin';
  const [locations, setLocations] = useState<Location[]>([]);
  const [scope, setScope] = useState(isAdmin ? '' : (profile.location_id ?? ''));
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(todayStr());
  const [rep, setRep] = useState<Report | null>(null);
  const [rank, setRank] = useState<Rank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (isAdmin) supabase.from('locations').select('*').eq('is_active', true).order('name').then(({ data }: any) => setLocations(data ?? [])); }, [isAdmin]);

  const load = useCallback(async () => {
    setLoading(true);
    const p_from = new Date(from).toISOString();
    const p_to = new Date(to + 'T23:59:59').toISOString();
    const loc = scope || null;
    const [r, c] = await Promise.all([
      supabase.rpc('inv_report', { p_location: loc, p_from, p_to }),
      supabase.rpc('inv_product_consumption', { p_location: loc, p_from, p_to }),
    ]);
    setRep(r.data ?? null);
    setRank((c.data ?? []) as Rank[]);
    setLoading(false);
  }, [scope, from, to]);

  useEffect(() => { load(); }, [load]);

  const setPreset = (n: number) => { setFrom(daysAgo(n)); setTo(todayStr()); };

  const exportRanking = () => {
    const headers = ['Producto', 'Consumo total', 'N° movimientos'];
    downloadCSV(`consumo-productos-${from}_a_${to}.csv`, toCSV(headers, rank.map((r) => [r.product_name, r.total, r.movements])));
  };

  const top = rank.slice(0, 5);
  const bottom = rank.length > 5 ? rank.slice(-5).reverse() : [];

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold uppercase tracking-tight text-white"><BarChart3 className="h-6 w-6 text-gold" /> Reportes</h2>
          <p className="mt-1 text-[13px] text-white/45">Entradas, salidas, consumo, pérdidas y valor del inventario por periodo.</p>
        </div>
        <GhostButton onClick={exportRanking} disabled={rank.length === 0}><Download className="h-4 w-4" /> Exportar consumo</GhostButton>
      </div>

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

      {loading || !rep ? <Spinner label="Generando reporte…" /> : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Compras" value={fmtQty(rep.compras)} sub={`${rep.compras_n} mov.`} icon={<ShoppingCart className="h-3.5 w-3.5" />} tone="green" />
            <StatCard label="Distribuciones" value={fmtQty(rep.distribuciones)} sub={`${rep.distribuciones_n} mov.`} icon={<Send className="h-3.5 w-3.5" />} tone="gold" />
            <StatCard label="Transferencias" value={fmtQty(rep.transferencias)} sub={`${rep.transferencias_n} mov.`} icon={<ArrowLeftRight className="h-3.5 w-3.5" />} tone="gold" />
            <StatCard label="Consumo" value={fmtQty(rep.consumo)} sub={`${rep.consumo_n} mov.`} icon={<TrendingDown className="h-3.5 w-3.5" />} tone="red" />
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Ajustes (neto)" value={fmtQty(rep.ajustes_net)} sub={`${rep.ajustes_n} mov.`} icon={<SlidersHorizontal className="h-3.5 w-3.5" />} tone="yellow" />
            <StatCard label="Pérdidas" value={fmtQty(rep.perdidas)} icon={<TrendingDown className="h-3.5 w-3.5" />} tone="red" />
            <StatCard label="Valor inventario" value={fmtMoney(rep.valor_total)} sub={isAdmin ? `Central ${fmtMoney(rep.valor_central)}` : undefined} icon={<Wallet className="h-3.5 w-3.5" />} tone="green" />
            <StatCard label="Valor en sucursal" value={fmtMoney(rep.valor_sucursal)} icon={<Wallet className="h-3.5 w-3.5" />} tone="gold" />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-[22px] border border-white/10 bg-ink-800/70 p-5 shadow-soft">
              <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-wide text-white/70"><TrendingUp className="h-4 w-4 text-emerald-400" /> Más consumidos</h3>
              {top.length === 0 ? <p className="py-6 text-center text-sm text-white/35">Sin datos en el periodo.</p> :
                <ol className="space-y-2">{top.map((r, i) => <li key={r.product_name} className="flex items-center gap-3"><span className="grid h-6 w-6 place-items-center rounded-full bg-gold/15 text-[11px] font-black text-gold">{i + 1}</span><span className="flex-1 truncate text-sm font-bold text-white">{r.product_name}</span><span className="text-sm text-gold">{fmtQty(r.total)}</span></li>)}</ol>}
            </div>
            <div className="rounded-[22px] border border-white/10 bg-ink-800/70 p-5 shadow-soft">
              <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-wide text-white/70"><TrendingDown className="h-4 w-4 text-white/40" /> Menos consumidos</h3>
              {bottom.length === 0 ? <p className="py-6 text-center text-sm text-white/35">Se necesita más historial.</p> :
                <ol className="space-y-2">{bottom.map((r) => <li key={r.product_name} className="flex items-center gap-3"><span className="flex-1 truncate text-sm font-bold text-white">{r.product_name}</span><span className="text-sm text-white/50">{fmtQty(r.total)}</span></li>)}</ol>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
