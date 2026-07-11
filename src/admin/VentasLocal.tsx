import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ShoppingCart, Plus, Minus, Trash2, Search, Store, Receipt, Wallet,
  Check, Package, PencilLine, ChevronDown, Clock,
} from 'lucide-react';
import { supabase, type Location, type Profile, type MenuItem, type PaymentMethod } from '../lib/supabase';
import { fmtMoney } from '../lib/inventory';
import { Modal, Field, TextInput, SelectInput, PrimaryButton, GhostButton, Pill, Spinner, EmptyState, Banner, StatCard } from './ui';

// Línea de la venta en curso. menu_item_id null = ítem libre (no descuenta inventario).
type SaleLine = {
  menu_item_id: string | null;
  name: string;
  unit_price: number;
  quantity: number;
  notes: string;
};

type SaleItem = { id: string; name: string; quantity: number; unit_price: number; notes: string };
type Sale = {
  id: string; number: number; customer_name: string; total: number;
  payment_method: PaymentMethod; sold_by_email: string; notes: string; created_at: string;
  order_items: SaleItem[];
};

const PAYMENTS: { value: Exclude<PaymentMethod, ''>; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'otro', label: 'Otro' },
];
const PAYMENT_LABEL: Record<string, string> = Object.fromEntries(PAYMENTS.map((p) => [p.value, p.label]));

const startOfTodayISO = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });

export default function VentasLocal({ profile }: { profile: Profile }) {
  const isAdmin = profile.role === 'admin';
  const [locations, setLocations] = useState<Location[]>([]);
  const [locId, setLocId] = useState<string>(isAdmin ? '' : (profile.location_id ?? ''));

  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Venta en curso
  const [lines, setLines] = useState<SaleLine[]>([]);
  const [customer, setCustomer] = useState('');
  const [payment, setPayment] = useState<Exclude<PaymentMethod, ''>>('efectivo');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [deleteSale, setDeleteSale] = useState<Sale | null>(null);
  const [deletingSale, setDeletingSale] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Ítem libre
  const [freeOpen, setFreeOpen] = useState(false);
  const [freeName, setFreeName] = useState('');
  const [freePrice, setFreePrice] = useState('');

  // Ventas del día
  const [sales, setSales] = useState<Sale[]>([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('locations').select('*').eq('is_active', true).order('name').then(({ data }: any) => {
      setLocations(data ?? []);
      if (isAdmin && !locId && data && data.length) setLocId(data[0].id);
    });
  }, [isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  // Menú disponible (ítems de la sucursal + globales).
  useEffect(() => {
    if (!locId) { setMenu([]); setMenuLoading(false); return; }
    setMenuLoading(true);
    supabase
      .from('menu_items')
      .select('*')
      .eq('available', true)
      .or(`location_id.eq.${locId},location_id.is.null`)
      .order('category')
      .order('sort_order')
      .then(({ data }: any) => {
        // Si un producto existe global y específico, prioriza el específico de la sucursal.
        const byName = new Map<string, MenuItem>();
        for (const it of ((data ?? []) as MenuItem[])) {
          const prev = byName.get(it.name);
          if (!prev || (it.location_id && !prev.location_id)) byName.set(it.name, it);
        }
        setMenu([...byName.values()]);
        setMenuLoading(false);
      });
  }, [locId]);

  const loadSales = useCallback(async () => {
    if (!locId) { setSales([]); setSalesLoading(false); return; }
    setSalesLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('id, number, customer_name, total, payment_method, sold_by_email, notes, created_at, order_items(id,name,quantity,unit_price,notes)')
      .eq('channel', 'local')
      .eq('location_id', locId)
      .gte('created_at', startOfTodayISO())
      .order('created_at', { ascending: false });
    setSales((data ?? []) as Sale[]);
    setSalesLoading(false);
  }, [locId]);

  const confirmDeleteSale = (sale: Sale) => {
    setDeleteError(null);
    setDeleteSale(sale);
  };

  const doDeleteSale = async () => {
    if (!deleteSale) return;
    setDeletingSale(true);
    setDeleteError(null);
    const { error } = await supabase.from('order_items').delete().eq('order_id', deleteSale.id);
    if (error) {
      setDeleteError(error.message);
      setDeletingSale(false);
      return;
    }
    const { error: orderError } = await supabase.from('orders').delete().eq('id', deleteSale.id);
    setDeletingSale(false);
    if (orderError) {
      setDeleteError(orderError.message);
      return;
    }
    setOkMsg(`Venta #${deleteSale.number} eliminada.`);
    setDeleteSale(null);
    loadSales();
  };

  useEffect(() => {
    loadSales();
    if (!locId) return;
    const ch = supabase.channel('ventas-local-' + locId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadSales())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadSales, locId]);

  /* ---------- Carrito ---------- */
  const addItem = (m: MenuItem) => {
    setOkMsg(null);
    setLines((prev) => {
      const i = prev.findIndex((l) => l.menu_item_id === m.id);
      if (i >= 0) {
        const next = prev.slice();
        next[i] = { ...next[i], quantity: next[i].quantity + 1 };
        return next;
      }
      return [...prev, { menu_item_id: m.id, name: m.name, unit_price: Number(m.price), quantity: 1, notes: '' }];
    });
  };

  const setQty = (idx: number, delta: number) => {
    setLines((prev) => {
      const next = prev.slice();
      const q = next[idx].quantity + delta;
      if (q <= 0) return next.filter((_, i) => i !== idx);
      next[idx] = { ...next[idx], quantity: q };
      return next;
    });
  };
  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const addFree = () => {
    const price = Number(freePrice);
    if (!freeName.trim()) return;
    if (!Number.isFinite(price) || price < 0) return;
    setLines((prev) => [...prev, { menu_item_id: null, name: freeName.trim(), unit_price: price, quantity: 1, notes: '' }]);
    setFreeName(''); setFreePrice(''); setFreeOpen(false);
  };

  const total = useMemo(() => lines.reduce((s, l) => s + l.unit_price * l.quantity, 0), [lines]);

  const dayTotal = useMemo(() => sales.reduce((s, v) => s + Number(v.total), 0), [sales]);

  const filteredMenu = useMemo(
    () => menu.filter((m) => !search.trim() || `${m.name} ${m.category}`.toLowerCase().includes(search.toLowerCase())),
    [menu, search],
  );

  const register = async () => {
    if (!locId) { setErr('Selecciona una sucursal.'); return; }
    if (lines.length === 0) { setErr('Agrega al menos un producto.'); return; }
    setSaving(true); setErr(null); setOkMsg(null);
    const { data, error } = await supabase.rpc('register_manual_sale', {
      p_location_id: locId,
      p_customer_name: customer.trim(),
      p_payment_method: payment,
      p_notes: notes.trim(),
      p_items: lines.map((l) => ({
        menu_item_id: l.menu_item_id,
        name: l.name,
        quantity: l.quantity,
        unit_price: l.unit_price,
        notes: l.notes,
      })),
    });
    setSaving(false);
    if (error) { setErr(error.message); return; }
    const num = Array.isArray(data) ? data[0]?.number : (data as { number?: number } | null)?.number;
    setLines([]); setCustomer(''); setNotes(''); setPayment('efectivo');
    setOkMsg(num ? `Venta #${num} registrada y descontada del inventario.` : 'Venta registrada.');
    loadSales();
  };

  const locName = locations.find((l) => l.id === locId)?.name ?? 'Mi sucursal';

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold uppercase tracking-tight text-white">
            <ShoppingCart className="h-6 w-6 text-gold" /> Ventas en local
          </h2>
          <p className="mt-1 text-[13px] text-white/45">Registra ventas hechas en el mostrador. Descuenta inventario y queda en reportes.</p>
        </div>
        {isAdmin ? (
          <SelectInput value={locId} onChange={(e) => setLocId(e.target.value)} className="max-w-[240px]">
            <option value="" className="bg-ink-800">Selecciona sucursal…</option>
            {locations.map((l) => <option key={l.id} value={l.id} className="bg-ink-800">{l.name}</option>)}
          </SelectInput>
        ) : (
          <Pill tone="gold"><Store className="h-3 w-3" /> {locName}</Pill>
        )}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:max-w-md">
        <StatCard label="Ventas de hoy" value={sales.length} icon={<Receipt className="h-3.5 w-3.5" />} tone="gold" />
        <StatCard label="Total de hoy" value={fmtMoney(dayTotal)} icon={<Wallet className="h-3.5 w-3.5" />} tone="green" />
      </div>

      {!locId ? (
        <EmptyState title="Selecciona una sucursal" subtitle="Elige la sucursal donde se está realizando la venta para cargar el menú." icon={<Store className="h-6 w-6" />} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
          {/* ---------- Selector de productos ---------- */}
          <div>
            <div className="relative mb-4 max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <TextInput placeholder="Buscar producto…" value={search} onChange={(e) => setSearch(e.target.value)} className="!py-2.5 pl-11" />
            </div>

            {menuLoading ? <Spinner label="Cargando menú…" />
              : filteredMenu.length === 0 ? <EmptyState title="Sin productos" subtitle="No hay productos disponibles para esta sucursal." icon={<Package className="h-6 w-6" />} />
              : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {filteredMenu.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => addItem(m)}
                      className="group flex flex-col rounded-2xl border border-white/10 bg-ink-800/70 p-3 text-left shadow-soft transition-all hover:border-gold/40 hover:bg-white/[0.04] active:scale-[0.98]"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/35">{m.category}</span>
                      <span className="mt-0.5 line-clamp-2 text-sm font-bold text-white">{m.name}</span>
                      <span className="mt-2 flex items-center justify-between">
                        <span className="font-display text-base font-extrabold text-gold">{fmtMoney(m.price)}</span>
                        <span className="grid h-7 w-7 place-items-center rounded-xl bg-yellow-cta text-ink shadow-glow-gold transition-transform group-hover:scale-110">
                          <Plus className="h-4 w-4" strokeWidth={3} />
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}

            <div className="mt-4">
              <GhostButton onClick={() => { setFreeOpen(true); setFreeName(''); setFreePrice(''); }}>
                <PencilLine className="h-4 w-4" /> Agregar ítem libre
              </GhostButton>
            </div>
          </div>

          {/* ---------- Venta en curso ---------- */}
          <div className="lg:sticky lg:top-[84px] h-fit rounded-[24px] border border-white/10 bg-ink-800/70 p-4 shadow-soft">
            <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-extrabold text-white">
              <ShoppingCart className="h-5 w-5 text-gold" /> Venta actual
            </h3>

            {okMsg && <div className="mb-3"><Banner tone="ok">✅ {okMsg}</Banner></div>}
            {err && <div className="mb-3"><Banner tone="err">⚠️ {err}</Banner></div>}

            {lines.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-8 text-center text-[13px] text-white/40">
                Toca un producto para agregarlo a la venta.
              </p>
            ) : (
              <div className="space-y-2">
                {lines.map((l, idx) => (
                  <div key={idx} className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-bold text-white">{l.name}</span>
                        {l.menu_item_id === null && <Pill tone="gray" className="!px-1.5 !py-0.5 !text-[9px]">Libre</Pill>}
                      </div>
                      <div className="text-[11px] text-white/45">{fmtMoney(l.unit_price)} c/u · {fmtMoney(l.unit_price * l.quantity)}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setQty(idx, -1)} className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/10"><Minus className="h-3.5 w-3.5" /></button>
                      <span className="w-6 text-center text-sm font-bold text-white">{l.quantity}</span>
                      <button onClick={() => setQty(idx, +1)} className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/10"><Plus className="h-3.5 w-3.5" /></button>
                      <button onClick={() => removeLine(idx)} className="ml-1 grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-red-300 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="my-4 flex items-center justify-between border-y border-white/8 py-3">
              <span className="text-sm font-bold uppercase tracking-wide text-white/60">Total</span>
              <span className="font-display text-2xl font-extrabold text-gold">{fmtMoney(total)}</span>
            </div>

            <div className="space-y-3">
              <Field label="Método de pago">
                <SelectInput value={payment} onChange={(e) => setPayment(e.target.value as Exclude<PaymentMethod, ''>)}>
                  {PAYMENTS.map((p) => <option key={p.value} value={p.value} className="bg-ink-800">{p.label}</option>)}
                </SelectInput>
              </Field>
              <Field label="Cliente (opcional)">
                <TextInput value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Nombre del cliente" />
              </Field>
              <Field label="Nota (opcional)">
                <TextInput value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observación de la venta" />
              </Field>
            </div>

            <PrimaryButton onClick={register} disabled={saving || lines.length === 0} className="mt-4 w-full">
              {saving ? 'Registrando…' : (<><Check className="h-4 w-4" strokeWidth={3} /> Registrar venta · {fmtMoney(total)}</>)}
            </PrimaryButton>
          </div>
        </div>
      )}

      {/* ---------- Ventas del día ---------- */}
      {locId && (
        <div className="mt-8">
          <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-extrabold uppercase tracking-tight text-white">
            <Clock className="h-5 w-5 text-gold" /> Ventas de hoy — {locName}
          </h3>
          {salesLoading ? <Spinner label="Cargando ventas…" />
            : sales.length === 0 ? <EmptyState title="Sin ventas hoy" subtitle="Las ventas registradas en el local aparecerán aquí." icon={<Receipt className="h-6 w-6" />} />
            : (
              <div className="space-y-2">
                {sales.map((s) => {
                  const open = expanded === s.id;
                  const count = s.order_items.reduce((n, it) => n + it.quantity, 0);
                  return (
                    <div key={s.id} className="overflow-hidden rounded-2xl border border-white/10 bg-ink-800/70 shadow-soft">
                      <button onClick={() => setExpanded(open ? null : s.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02]">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold/10 font-display text-sm font-extrabold text-gold">#{s.number}</span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-bold text-white">{s.customer_name || 'Venta en local'}</div>
                          <div className="text-[11px] text-white/45">{fmtTime(s.created_at)} · {count} {count === 1 ? 'ítem' : 'ítems'}{s.sold_by_email ? ` · ${s.sold_by_email}` : ''}</div>
                        </div>
                        {s.payment_method && <Pill tone="gray" className="hidden sm:inline-flex">{PAYMENT_LABEL[s.payment_method] ?? s.payment_method}</Pill>}
                        <span className="font-display text-base font-extrabold text-white">{fmtMoney(s.total)}</span>
                        <ChevronDown className={`h-4 w-4 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`} />
                      </button>
                      {open && (
                        <div className="border-t border-white/8 px-4 py-3">
                          <div className="space-y-1.5">
                            {s.order_items.map((it) => (
                              <div key={it.id} className="flex items-center justify-between text-[13px]">
                                <span className="text-white/75">{it.quantity}× {it.name}</span>
                                <span className="text-white/55">{fmtMoney(it.unit_price * it.quantity)}</span>
                              </div>
                            ))}
                          </div>
                          {s.notes && <p className="mt-2 text-[12px] text-white/40">Nota: {s.notes}</p>}
                          <div className="mt-4 flex justify-end">
                            <button
                              type="button"
                              onClick={() => confirmDeleteSale(s)}
                              className="inline-flex items-center gap-2 rounded-2xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-200 transition-colors hover:bg-red-500/15"
                            >
                              <Trash2 className="h-4 w-4" /> Eliminar venta
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      )}

      <Modal open={!!deleteSale} onClose={() => !deletingSale && setDeleteSale(null)} title={`Eliminar venta #${deleteSale?.number ?? ''}`}
        footer={
          <>
            <GhostButton onClick={() => !deletingSale && setDeleteSale(null)} disabled={deletingSale}>Cancelar</GhostButton>
            <PrimaryButton onClick={doDeleteSale} disabled={deletingSale} className="!bg-red-500 !text-white !shadow-none hover:!brightness-110">
              {deletingSale ? 'Eliminando…' : (<><Trash2 className="h-4 w-4" /> Eliminar</>)}
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          {deleteError && <Banner tone="err">⚠️ {deleteError}</Banner>}
          <p className="text-sm text-white/70">Esta acción eliminará la venta y todos sus productos asociados. No se puede deshacer.</p>
          <p className="text-sm text-white/50">Venta #{deleteSale?.number} · {deleteSale?.customer_name || 'Venta en local'} · {fmtMoney(deleteSale?.total ?? 0)}</p>
        </div>
      </Modal>

      {/* ---------- Modal ítem libre ---------- */}
      <Modal open={freeOpen} onClose={() => setFreeOpen(false)} title="Ítem libre"
        footer={<><GhostButton onClick={() => setFreeOpen(false)}>Cancelar</GhostButton><PrimaryButton onClick={addFree} disabled={!freeName.trim() || freePrice === ''}><Plus className="h-4 w-4" strokeWidth={3} /> Agregar</PrimaryButton></>}>
        <div className="space-y-4">
          <p className="text-[13px] text-white/55">Un ítem libre se cobra en la venta pero <span className="font-bold text-white/80">no descuenta inventario</span> (no tiene receta asociada).</p>
          <Field label="Nombre"><TextInput value={freeName} onChange={(e) => setFreeName(e.target.value)} placeholder="Ej. Combo especial" autoFocus /></Field>
          <Field label="Precio"><TextInput type="number" min="0" step="any" value={freePrice} onChange={(e) => setFreePrice(e.target.value)} placeholder="0" /></Field>
        </div>
      </Modal>
    </div>
  );
}
