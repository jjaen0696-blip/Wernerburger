import { useEffect, useState, useCallback, useMemo } from 'react';
import { Store, Search, SlidersHorizontal, Pencil, Package, AlertTriangle, PackageX, Wallet, Check } from 'lucide-react';
import { supabase, type Location, type Profile } from '../lib/supabase';
import { stockState, STOCK_TONE, STOCK_LABEL, fmtQty, fmtMoney } from '../lib/inventory';
import { Modal, Field, TextInput, SelectInput, PrimaryButton, GhostButton, Pill, Spinner, EmptyState, Banner, StatCard } from './ui';

type Row = {
  id: string; product_id: string; location_id: string; qty: number; min_stock: number; max_stock: number; updated_at: string;
  product: { name: string; unit: string; category: string; avg_cost: number } | null;
};

export default function InventarioSucursal({ profile }: { profile: Profile }) {
  const isAdmin = profile.role === 'admin';
  const [locations, setLocations] = useState<Location[]>([]);
  const [locId, setLocId] = useState<string>(isAdmin ? '' : (profile.location_id ?? ''));
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [adjFor, setAdjFor] = useState<Row | null>(null);
  const [adjQty, setAdjQty] = useState(''); const [adjReason, setAdjReason] = useState(''); const [adjBusy, setAdjBusy] = useState(false); const [adjErr, setAdjErr] = useState<string | null>(null);
  const [limFor, setLimFor] = useState<Row | null>(null);
  const [limMin, setLimMin] = useState(''); const [limMax, setLimMax] = useState(''); const [limBusy, setLimBusy] = useState(false); const [limErr, setLimErr] = useState<string | null>(null);

  useEffect(() => {
    const loadLocations = async () => {
      let result = await supabase.from('locations').select('id,slug,name,address,is_active,is_open,created_at').eq('is_active', true).order('name');
      if (result.error && /is_open|column/i.test(result.error.message)) {
        result = await supabase.from('locations').select('id,slug,name,address,is_active,created_at').eq('is_active', true).order('name');
      }
      setLocations(result.data ?? []);
      if (isAdmin && !locId && result.data && result.data.length) setLocId(result.data[0].id);
    };
    loadLocations();
  }, [isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async () => {
    if (!locId) { setRows([]); setLoading(false); return; }
    const { data } = await supabase
      .from('inv_branch_stock')
      .select('*, product:inv_products(name,unit,category,avg_cost)')
      .eq('location_id', locId);
    const sorted = (data ?? []).slice().sort((a: Row, b: Row) => (a.product?.name ?? '').localeCompare(b.product?.name ?? ''));
    setRows(sorted as Row[]);
    setLoading(false);
  }, [locId]);

  useEffect(() => {
    setLoading(true);
    load();
    const ch = supabase.channel('branch-stock-' + locId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inv_branch_stock' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load, locId]);

  const filtered = useMemo(() => rows.filter((r) => !search.trim() || `${r.product?.name ?? ''} ${r.product?.category ?? ''}`.toLowerCase().includes(search.toLowerCase())), [rows, search]);
  const kpis = useMemo(() => {
    const value = rows.reduce((s, r) => s + Number(r.qty) * Number(r.product?.avg_cost ?? 0), 0);
    const low = rows.filter((r) => stockState(Number(r.qty), Number(r.min_stock)) === 'bajo').length;
    const out = rows.filter((r) => stockState(Number(r.qty), Number(r.min_stock)) === 'agotado').length;
    return { count: rows.length, value, low, out };
  }, [rows]);

  const doAdjust = async () => {
    if (!adjFor) return;
    const n = Number(adjQty);
    if (adjQty === '' || n < 0) { setAdjErr('Ingresa una cantidad válida (≥ 0).'); return; }
    setAdjBusy(true); setAdjErr(null);
    const { error } = await supabase.rpc('inv_adjust', { p_product_id: adjFor.product_id, p_location_id: locId, p_new_qty: n, p_reason: adjReason.trim() });
    setAdjBusy(false);
    if (error) { setAdjErr(error.message); return; }
    setAdjFor(null); load();
  };

  const doLimits = async () => {
    if (!limFor) return;
    setLimBusy(true); setLimErr(null);
    const { error } = await supabase.rpc('inv_set_branch_limits', { p_product_id: limFor.product_id, p_location_id: locId, p_min: Number(limMin) || 0, p_max: Number(limMax) || 0 });
    setLimBusy(false);
    if (error) { setLimErr(error.message); return; }
    setLimFor(null); load();
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold uppercase tracking-tight text-white">
            <Store className="h-6 w-6 text-gold" /> Inventario por sucursal
          </h2>
          <p className="mt-1 text-[13px] text-white/45">Existencias, mínimos/máximos y estado por sucursal.</p>
        </div>
        {isAdmin ? (
          <SelectInput value={locId} onChange={(e) => setLocId(e.target.value)} className="max-w-[240px]">
            {locations.map((l) => <option key={l.id} value={l.id} className="bg-ink-800">{l.name}</option>)}
          </SelectInput>
        ) : (
          <Pill tone="gold"><Store className="h-3 w-3" /> {locations.find((l) => l.id === locId)?.name ?? 'Mi sucursal'}</Pill>
        )}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Productos" value={kpis.count} icon={<Package className="h-3.5 w-3.5" />} tone="gold" />
        <StatCard label="Valor estimado" value={fmtMoney(kpis.value)} icon={<Wallet className="h-3.5 w-3.5" />} tone="green" />
        <StatCard label="Stock bajo" value={kpis.low} icon={<AlertTriangle className="h-3.5 w-3.5" />} tone="yellow" />
        <StatCard label="Agotados" value={kpis.out} icon={<PackageX className="h-3.5 w-3.5" />} tone="red" />
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        <TextInput placeholder="Buscar producto…" value={search} onChange={(e) => setSearch(e.target.value)} className="!py-2.5 pl-11" />
      </div>

      {loading ? <Spinner label="Cargando inventario…" />
        : filtered.length === 0 ? <EmptyState title="Sin existencias" subtitle="Esta sucursal aún no tiene productos. Distribuye mercancía desde el central." icon={<Store className="h-6 w-6" />} />
        : (
          <div className="overflow-x-auto rounded-[22px] border border-white/10 bg-ink-800/70 shadow-soft">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/8 text-[11px] uppercase tracking-wider text-white/40">
                  <th className="px-4 py-3 font-bold">Producto</th>
                  <th className="px-4 py-3 font-bold text-right">Existencia</th>
                  <th className="px-4 py-3 font-bold text-right">Mín</th>
                  <th className="px-4 py-3 font-bold text-right">Máx</th>
                  <th className="px-4 py-3 font-bold">Estado</th>
                  <th className="px-4 py-3 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const st = stockState(Number(r.qty), Number(r.min_stock));
                  return (
                    <tr key={r.id} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">{r.product?.name ?? '—'}</div>
                        <div className="text-[11px] text-white/40">{r.product?.category}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-white">{fmtQty(r.qty)} <span className="text-[11px] font-normal text-white/40">{r.product?.unit}</span></td>
                      <td className="px-4 py-3 text-right text-white/50">{fmtQty(r.min_stock)}</td>
                      <td className="px-4 py-3 text-right text-white/50">{Number(r.max_stock) > 0 ? fmtQty(r.max_stock) : '—'}</td>
                      <td className="px-4 py-3"><Pill tone={STOCK_TONE[st]}>{STOCK_LABEL[st]}</Pill></td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <GhostButton onClick={() => { setAdjFor(r); setAdjQty(String(r.qty)); setAdjReason(''); setAdjErr(null); }} className="!px-2.5 !py-1.5 !text-xs"><Pencil className="h-3.5 w-3.5" /> Ajustar</GhostButton>
                          <GhostButton onClick={() => { setLimFor(r); setLimMin(String(r.min_stock)); setLimMax(String(r.max_stock)); setLimErr(null); }} className="!px-2.5 !py-1.5 !text-xs"><SlidersHorizontal className="h-3.5 w-3.5" /> Límites</GhostButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      {/* Ajuste */}
      <Modal open={!!adjFor} onClose={() => !adjBusy && setAdjFor(null)} title={`Ajustar — ${adjFor?.product?.name ?? ''}`}
        footer={<><GhostButton onClick={() => !adjBusy && setAdjFor(null)} disabled={adjBusy}>Cancelar</GhostButton><PrimaryButton onClick={doAdjust} disabled={adjBusy}>{adjBusy ? 'Guardando…' : (<><Check className="h-4 w-4" strokeWidth={3} /> Aplicar</>)}</PrimaryButton></>}>
        <div className="space-y-4">
          {adjErr && <Banner tone="err">⚠️ {adjErr}</Banner>}
          <p className="text-[13px] text-white/55">Existencia actual: <span className="font-bold text-white">{fmtQty(adjFor?.qty ?? 0)} {adjFor?.product?.unit}</span></p>
          <Field label="Nueva existencia (conteo real)"><TextInput type="number" min="0" step="any" value={adjQty} onChange={(e) => setAdjQty(e.target.value)} disabled={adjBusy} /></Field>
          <Field label="Motivo"><TextInput value={adjReason} onChange={(e) => setAdjReason(e.target.value)} placeholder="Ej. merma, conteo físico, corrección" disabled={adjBusy} /></Field>
        </div>
      </Modal>

      {/* Límites */}
      <Modal open={!!limFor} onClose={() => !limBusy && setLimFor(null)} title={`Límites — ${limFor?.product?.name ?? ''}`}
        footer={<><GhostButton onClick={() => !limBusy && setLimFor(null)} disabled={limBusy}>Cancelar</GhostButton><PrimaryButton onClick={doLimits} disabled={limBusy}>{limBusy ? 'Guardando…' : (<><Check className="h-4 w-4" strokeWidth={3} /> Guardar</>)}</PrimaryButton></>}>
        <div className="space-y-4">
          {limErr && <Banner tone="err">⚠️ {limErr}</Banner>}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Stock mínimo"><TextInput type="number" min="0" step="any" value={limMin} onChange={(e) => setLimMin(e.target.value)} disabled={limBusy} /></Field>
            <Field label="Stock máximo"><TextInput type="number" min="0" step="any" value={limMax} onChange={(e) => setLimMax(e.target.value)} disabled={limBusy} /></Field>
          </div>
          <p className="text-[12px] text-white/40">El estado “Stock bajo” se activa cuando la existencia es menor o igual al mínimo.</p>
        </div>
      </Modal>
    </div>
  );
}
