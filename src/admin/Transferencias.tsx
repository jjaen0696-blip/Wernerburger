import { useEffect, useState, useCallback, useMemo } from 'react';
import { ArrowLeftRight, ArrowRight } from 'lucide-react';
import { supabase, type Location, type Profile } from '../lib/supabase';
import { type Product, fmtQty } from '../lib/inventory';
import { Field, SelectInput, TextInput, PrimaryButton, Banner } from './ui';
import MovementsList from './MovementsList';

export default function Transferencias({ profile }: { profile: Profile }) {
  const isAdmin = profile.role === 'admin';
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [fromLoc, setFromLoc] = useState(isAdmin ? '' : (profile.location_id ?? ''));
  const [toLoc, setToLoc] = useState('');
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState('');
  const [notes, setNotes] = useState('');
  const [sourceStock, setSourceStock] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  const loadRefs = useCallback(async () => {
    const [{ data: p }, locResult] = await Promise.all([
      supabase.from('inv_products').select('*').eq('is_active', true).order('name'),
      supabase.from('locations').select('id,slug,name,address,is_active,is_open,created_at').eq('is_active', true).order('name'),
    ]);
    let locationsData = locResult.data;
    if (locResult.error && /is_open|column/i.test(locResult.error.message)) {
      const fallback = await supabase.from('locations').select('id,slug,name,address,is_active,created_at').eq('is_active', true).order('name');
      locationsData = fallback.data;
    }
    setProducts(p ?? []);
    setLocations(locationsData ?? []);
  }, []);

  useEffect(() => { loadRefs(); }, [loadRefs]);

  // Existencias de la sucursal de origen (para validar y mostrar disponibilidad).
  const loadSource = useCallback(async () => {
    if (!fromLoc) { setSourceStock({}); return; }
    const { data } = await supabase.from('inv_branch_stock').select('product_id, qty').eq('location_id', fromLoc);
    const m: Record<string, number> = {};
    (data ?? []).forEach((r: { product_id: string; qty: number }) => { m[r.product_id] = Number(r.qty); });
    setSourceStock(m);
  }, [fromLoc]);

  useEffect(() => {
    loadSource();
    const ch = supabase.channel('transfer-source')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inv_branch_stock' }, () => loadSource())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadSource]);

  const available = productId ? (sourceStock[productId] ?? 0) : 0;
  const stockedProducts = useMemo(() => products.filter((p) => (sourceStock[p.id] ?? 0) > 0), [products, sourceStock]);

  const submit = async () => {
    const n = Number(qty);
    if (!fromLoc) return setMsg({ tone: 'err', text: 'Selecciona la sucursal de origen.' });
    if (!toLoc) return setMsg({ tone: 'err', text: 'Selecciona la sucursal de destino.' });
    if (fromLoc === toLoc) return setMsg({ tone: 'err', text: 'Origen y destino deben ser distintos.' });
    if (!productId) return setMsg({ tone: 'err', text: 'Selecciona un producto.' });
    if (!n || n <= 0) return setMsg({ tone: 'err', text: 'Ingresa una cantidad mayor a 0.' });
    if (n > available) return setMsg({ tone: 'err', text: `Solo hay ${fmtQty(available)} en la sucursal de origen.` });
    setBusy(true); setMsg(null);
    const { error } = await supabase.rpc('inv_transfer', { p_product_id: productId, p_from_location: fromLoc, p_to_location: toLoc, p_qty: n, p_notes: notes.trim() });
    setBusy(false);
    if (error) return setMsg({ tone: 'err', text: error.message });
    setMsg({ tone: 'ok', text: 'Transferencia registrada.' });
    setQty(''); setNotes('');
    loadSource();
  };

  return (
    <div>
      <div className="mb-5">
        <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold uppercase tracking-tight text-white">
          <ArrowLeftRight className="h-6 w-6 text-gold" /> Transferencias
        </h2>
        <p className="mt-1 text-[13px] text-white/45">Mueve mercancía entre sucursales.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[22px] border border-white/10 bg-ink-800/70 p-5 shadow-soft">
          <div className="space-y-4">
            {msg && <Banner tone={msg.tone === 'ok' ? 'ok' : 'err'}>{msg.tone === 'ok' ? '✅ ' : '⚠️ '}{msg.text}</Banner>}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Origen">
                <SelectInput value={fromLoc} onChange={(e) => { setFromLoc(e.target.value); setProductId(''); }} disabled={busy || !isAdmin}>
                  {isAdmin && <option value="" className="bg-ink-800">Selecciona…</option>}
                  {locations.map((l) => <option key={l.id} value={l.id} className="bg-ink-800">{l.name}</option>)}
                </SelectInput>
              </Field>
              <Field label="Destino">
                <SelectInput value={toLoc} onChange={(e) => setToLoc(e.target.value)} disabled={busy}>
                  <option value="" className="bg-ink-800">Selecciona…</option>
                  {locations.filter((l) => l.id !== fromLoc).map((l) => <option key={l.id} value={l.id} className="bg-ink-800">{l.name}</option>)}
                </SelectInput>
              </Field>
            </div>
            <Field label="Producto" hint={fromLoc ? 'Solo se listan productos con existencia en el origen.' : 'Elige primero el origen.'}>
              <SelectInput value={productId} onChange={(e) => setProductId(e.target.value)} disabled={busy || !fromLoc}>
                <option value="" className="bg-ink-800">Selecciona…</option>
                {stockedProducts.map((p) => <option key={p.id} value={p.id} className="bg-ink-800">{p.name} — {fmtQty(sourceStock[p.id] ?? 0)} {p.unit}</option>)}
              </SelectInput>
            </Field>
            {productId && <p className="rounded-xl bg-white/[0.03] px-3 py-2 text-[12px] text-white/55">Disponible en origen: <span className="font-bold text-white">{fmtQty(available)}</span></p>}
            <Field label="Cantidad"><TextInput type="number" min="0" step="any" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" disabled={busy} /></Field>
            <Field label="Observaciones"><TextInput value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" disabled={busy} /></Field>
            <PrimaryButton onClick={submit} disabled={busy} className="w-full">
              {busy ? 'Registrando…' : (<>Transferir <ArrowRight className="h-4 w-4" /></>)}
            </PrimaryButton>
          </div>
        </div>

        <div>
          <MovementsList types={['transferencia']} title="Transferencias recientes" limit={12} locationId={isAdmin ? null : profile.location_id} />
        </div>
      </div>
    </div>
  );
}
