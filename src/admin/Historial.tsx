import { useEffect, useState, useCallback, useMemo } from 'react';
import { History, Search, Download, Filter } from 'lucide-react';
import { supabase, type Location, type Profile } from '../lib/supabase';
import { type Movement, type MovementType, MOVEMENT_LABEL, MOVEMENT_TONE, fmtQty, toCSV, downloadCSV } from '../lib/inventory';
import { SelectInput, TextInput, GhostButton, Pill, Spinner, EmptyState } from './ui';

const TYPES: MovementType[] = ['compra', 'distribucion', 'transferencia', 'ajuste', 'consumo', 'correccion'];
const dt = (s: string) => new Date(s).toLocaleString('es', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

export default function Historial({ profile }: { profile: Profile }) {
  const isAdmin = profile.role === 'admin';
  const [rows, setRows] = useState<Movement[]>([]);
  const [locs, setLocs] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<string>('');
  const [locFilter, setLocFilter] = useState<string>(isAdmin ? '' : (profile.location_id ?? ''));
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { supabase.from('locations').select('*').order('name').then(({ data }) => setLocs(data ?? [])); }, []);
  const locName = (id: string | null) => (id ? (locs.find((l) => l.id === id)?.name ?? 'Sucursal') : 'Central');

  const load = useCallback(async () => {
    let q = supabase.from('inv_movements').select('*').order('created_at', { ascending: false }).limit(500);
    if (type) q = q.eq('type', type);
    const loc = isAdmin ? locFilter : (profile.location_id ?? '');
    if (loc) q = q.or(`location_id.eq.${loc},from_location_id.eq.${loc},to_location_id.eq.${loc}`);
    if (from) q = q.gte('created_at', new Date(from).toISOString());
    if (to) q = q.lte('created_at', new Date(to + 'T23:59:59').toISOString());
    const { data } = await q;
    setRows(data ?? []);
    setLoading(false);
  }, [type, locFilter, from, to, isAdmin, profile.location_id]);

  useEffect(() => {
    setLoading(true);
    load();
    const ch = supabase.channel('history-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'inv_movements' }, () => load()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const filtered = useMemo(() => rows.filter((r) => !search.trim() || `${r.product_name} ${r.reason} ${r.created_by_email}`.toLowerCase().includes(search.toLowerCase())), [rows, search]);

  const exportCSV = () => {
    const headers = ['Fecha', 'Tipo', 'Producto', 'Cantidad', 'Origen', 'Destino', 'Sucursal', 'Usuario', 'Motivo'];
    const data = filtered.map((m) => [dt(m.created_at), MOVEMENT_LABEL[m.type], m.product_name, m.qty, m.from_location_id ? locName(m.from_location_id) : '', m.to_location_id ? locName(m.to_location_id) : '', m.location_id ? locName(m.location_id) : 'Central', m.created_by_email, m.reason]);
    downloadCSV(`historial-inventario-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(headers, data));
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold uppercase tracking-tight text-white"><History className="h-6 w-6 text-gold" /> Historial</h2>
          <p className="mt-1 text-[13px] text-white/45">Todos los movimientos de inventario. {filtered.length} registros.</p>
        </div>
        <GhostButton onClick={exportCSV} disabled={filtered.length === 0}><Download className="h-4 w-4" /> Exportar CSV</GhostButton>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="relative col-span-2 sm:col-span-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <TextInput placeholder="Buscar…" value={search} onChange={(e) => setSearch(e.target.value)} className="!py-2.5 pl-10 text-[13px]" />
        </div>
        <SelectInput value={type} onChange={(e) => setType(e.target.value)} className="!py-2.5 text-[13px]">
          <option value="" className="bg-ink-800">Todos los tipos</option>
          {TYPES.map((t) => <option key={t} value={t} className="bg-ink-800">{MOVEMENT_LABEL[t]}</option>)}
        </SelectInput>
        {isAdmin && (
          <SelectInput value={locFilter} onChange={(e) => setLocFilter(e.target.value)} className="!py-2.5 text-[13px]">
            <option value="" className="bg-ink-800">Todas las sucursales</option>
            {locs.map((l) => <option key={l.id} value={l.id} className="bg-ink-800">{l.name}</option>)}
          </SelectInput>
        )}
        <TextInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="!py-2.5 text-[13px]" />
        <TextInput type="date" value={to} onChange={(e) => setTo(e.target.value)} className="!py-2.5 text-[13px]" />
      </div>

      {loading ? <Spinner label="Cargando historial…" />
        : filtered.length === 0 ? <EmptyState title="Sin movimientos" subtitle="Ajusta los filtros o registra movimientos de inventario." icon={<Filter className="h-6 w-6" />} />
        : (
          <div className="overflow-x-auto rounded-[22px] border border-white/10 bg-ink-800/70 shadow-soft">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/8 text-[11px] uppercase tracking-wider text-white/40">
                  <th className="px-4 py-3 font-bold">Fecha</th>
                  <th className="px-4 py-3 font-bold">Tipo</th>
                  <th className="px-4 py-3 font-bold">Producto</th>
                  <th className="px-4 py-3 font-bold text-right">Cantidad</th>
                  <th className="px-4 py-3 font-bold">Lugar</th>
                  <th className="px-4 py-3 font-bold">Usuario</th>
                  <th className="px-4 py-3 font-bold">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02]">
                    <td className="whitespace-nowrap px-4 py-3 text-white/60">{dt(m.created_at)}</td>
                    <td className="px-4 py-3"><Pill tone={MOVEMENT_TONE[m.type]}>{MOVEMENT_LABEL[m.type]}</Pill></td>
                    <td className="px-4 py-3 font-bold text-white">{m.product_name}</td>
                    <td className={`px-4 py-3 text-right font-bold ${Number(m.qty) < 0 ? 'text-red-300' : 'text-emerald-300'}`}>{Number(m.qty) < 0 ? '' : '+'}{fmtQty(m.qty)}</td>
                    <td className="px-4 py-3 text-white/60">{m.from_location_id || m.to_location_id ? `${locName(m.from_location_id)} → ${locName(m.to_location_id)}` : locName(m.location_id)}</td>
                    <td className="px-4 py-3 text-[12px] text-white/45">{m.created_by_email || '—'}</td>
                    <td className="px-4 py-3 text-[12px] text-white/50">{m.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}
