import { useEffect, useState, useCallback, useMemo } from 'react';
import { Send, PackageCheck, ArrowRight } from 'lucide-react';
import { supabase, type Location } from '../lib/supabase';
import { type Product, fmtQty } from '../lib/inventory';
import { Field, SelectInput, TextInput, PrimaryButton, Banner } from './ui';
import MovementsList from './MovementsList';

export default function Distribucion() {
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [productId, setProductId] = useState('');
  const [toLoc, setToLoc] = useState('');
  const [qty, setQty] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  const load = useCallback(async () => {
    const [{ data: p }, { data: l }] = await Promise.all([
      supabase.from('inv_products').select('*').eq('is_active', true).order('name'),
      supabase.from('locations').select('*').eq('is_active', true).order('name'),
    ]);
    setProducts(p ?? []);
    setLocations(l ?? []);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase.channel('dist-refs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inv_products' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const selected = useMemo(() => products.find((p) => p.id === productId), [products, productId]);

  const submit = async () => {
    const n = Number(qty);
    if (!productId) return setMsg({ tone: 'err', text: 'Selecciona un producto.' });
    if (!toLoc) return setMsg({ tone: 'err', text: 'Selecciona la sucursal de destino.' });
    if (!n || n <= 0) return setMsg({ tone: 'err', text: 'Ingresa una cantidad mayor a 0.' });
    if (selected && n > Number(selected.central_qty)) return setMsg({ tone: 'err', text: `Solo hay ${fmtQty(selected.central_qty)} en el central.` });
    setBusy(true); setMsg(null);
    const { error } = await supabase.rpc('inv_distribute', { p_product_id: productId, p_to_location: toLoc, p_qty: n, p_notes: notes.trim() });
    setBusy(false);
    if (error) return setMsg({ tone: 'err', text: error.message });
    setMsg({ tone: 'ok', text: 'Distribución registrada.' });
    setQty(''); setNotes('');
    load();
  };

  return (
    <div>
      <div className="mb-5">
        <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold uppercase tracking-tight text-white">
          <Send className="h-6 w-6 text-gold" /> Distribución
        </h2>
        <p className="mt-1 text-[13px] text-white/45">Envía mercancía del inventario central a una sucursal.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[22px] border border-white/10 bg-ink-800/70 p-5 shadow-soft">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold text-white/70">
            <PackageCheck className="h-4 w-4 text-gold" /> Central <ArrowRight className="h-4 w-4 text-white/30" /> Sucursal
          </div>
          <div className="space-y-4">
            {msg && <Banner tone={msg.tone === 'ok' ? 'ok' : 'err'}>{msg.tone === 'ok' ? '✅ ' : '⚠️ '}{msg.text}</Banner>}
            <Field label="Producto">
              <SelectInput value={productId} onChange={(e) => { setProductId(e.target.value); setMsg(null); }} disabled={busy}>
                <option value="" className="bg-ink-800">Selecciona…</option>
                {products.map((p) => <option key={p.id} value={p.id} className="bg-ink-800">{p.name} — {fmtQty(p.central_qty)} {p.unit}</option>)}
              </SelectInput>
            </Field>
            {selected && (
              <p className="rounded-xl bg-white/[0.03] px-3 py-2 text-[12px] text-white/55">
                Disponible en central: <span className="font-bold text-white">{fmtQty(selected.central_qty)} {selected.unit}</span>
              </p>
            )}
            <Field label="Sucursal de destino">
              <SelectInput value={toLoc} onChange={(e) => setToLoc(e.target.value)} disabled={busy}>
                <option value="" className="bg-ink-800">Selecciona…</option>
                {locations.map((l) => <option key={l.id} value={l.id} className="bg-ink-800">{l.name}</option>)}
              </SelectInput>
            </Field>
            <Field label={`Cantidad ${selected ? `(${selected.unit})` : ''}`}>
              <TextInput type="number" min="0" step="any" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" disabled={busy} />
            </Field>
            <Field label="Observaciones"><TextInput value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" disabled={busy} /></Field>
            <PrimaryButton onClick={submit} disabled={busy} className="w-full">
              {busy ? 'Registrando…' : (<><Send className="h-4 w-4" /> Distribuir</>)}
            </PrimaryButton>
          </div>
        </div>

        <div>
          <MovementsList types={['distribucion']} title="Distribuciones recientes" limit={12} />
        </div>
      </div>
    </div>
  );
}
