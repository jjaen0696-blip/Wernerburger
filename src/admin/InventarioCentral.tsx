import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Boxes, Plus, Pencil, ShoppingCart, Search, PackageX, AlertTriangle, Wallet, Package, Check,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  type Product, type Supplier, stockState, STOCK_TONE, STOCK_LABEL, UNITS, fmtQty, fmtMoney,
} from '../lib/inventory';
import { Modal, Field, TextInput, SelectInput, PrimaryButton, GhostButton, Pill, Spinner, EmptyState, Banner, StatCard } from './ui';

const today = () => new Date().toISOString().slice(0, 10);

type ProductForm = {
  id: string | null; name: string; category: string; code: string; unit: string; min_stock: string; supplier_id: string; is_active: boolean;
};
const EMPTY_PRODUCT: ProductForm = { id: null, name: '', category: '', code: '', unit: 'unidad', min_stock: '0', supplier_id: '', is_active: true };

type PurchaseForm = {
  qty: string; unit_cost: string; supplier_id: string; purchase_date: string; lote: string; expiry_date: string; notes: string;
};
const emptyPurchase = (p: Product): PurchaseForm => ({
  qty: '', unit_cost: String(p.last_cost || ''), supplier_id: p.supplier_id ?? '', purchase_date: today(), lote: '', expiry_date: '', notes: '',
});

export default function InventarioCentral() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('');

  const [prodModal, setProdModal] = useState(false);
  const [prodForm, setProdForm] = useState<ProductForm>(EMPTY_PRODUCT);
  const [savingProd, setSavingProd] = useState(false);
  const [prodErr, setProdErr] = useState<string | null>(null);

  const [buyFor, setBuyFor] = useState<Product | null>(null);
  const [buyForm, setBuyForm] = useState<PurchaseForm>(emptyPurchase({ last_cost: 0, supplier_id: null } as Product));
  const [buying, setBuying] = useState(false);
  const [buyErr, setBuyErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [{ data: prods }, { data: sups }] = await Promise.all([
      supabase.from('inv_products').select('*').order('name'),
      supabase.from('inv_suppliers').select('*').eq('is_active', true).order('name'),
    ]);
    setProducts(prods ?? []);
    setSuppliers(sups ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase.channel('admin-central')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inv_products' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inv_suppliers' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort(), [products]);
  const supplierName = (id: string | null) => suppliers.find((s) => s.id === id)?.name ?? '—';

  const filtered = useMemo(() => products.filter((p) => {
    if (cat && p.category !== cat) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return `${p.name} ${p.code ?? ''} ${p.category}`.toLowerCase().includes(q);
    }
    return true;
  }), [products, search, cat]);

  const kpis = useMemo(() => {
    const active = products.filter((p) => p.is_active);
    const value = products.reduce((s, p) => s + Number(p.central_qty) * Number(p.avg_cost), 0);
    const out = products.filter((p) => stockState(Number(p.central_qty), Number(p.min_stock)) === 'agotado').length;
    const low = products.filter((p) => stockState(Number(p.central_qty), Number(p.min_stock)) === 'bajo').length;
    return { count: active.length, value, out, low };
  }, [products]);

  const openNew = () => { setProdForm(EMPTY_PRODUCT); setProdErr(null); setProdModal(true); };
  const openEdit = (p: Product) => {
    setProdForm({ id: p.id, name: p.name, category: p.category, code: p.code ?? '', unit: p.unit, min_stock: String(p.min_stock), supplier_id: p.supplier_id ?? '', is_active: p.is_active });
    setProdErr(null); setProdModal(true);
  };

  const saveProduct = async () => {
    if (!prodForm.name.trim()) { setProdErr('El nombre es obligatorio.'); return; }
    setSavingProd(true); setProdErr(null);
    const payload = {
      name: prodForm.name.trim(),
      category: prodForm.category.trim() || 'General',
      code: prodForm.code.trim() || null,
      unit: prodForm.unit,
      min_stock: Number(prodForm.min_stock) || 0,
      supplier_id: prodForm.supplier_id || null,
      is_active: prodForm.is_active,
    };
    const res = prodForm.id
      ? await supabase.from('inv_products').update(payload).eq('id', prodForm.id)
      : await supabase.from('inv_products').insert(payload);
    setSavingProd(false);
    if (res.error) { setProdErr(/duplicate|unique/i.test(res.error.message) ? 'Ya existe un producto con ese código.' : res.error.message); return; }
    setProdModal(false); load();
  };

  const openBuy = (p: Product) => { setBuyFor(p); setBuyForm(emptyPurchase(p)); setBuyErr(null); };
  const doPurchase = async () => {
    if (!buyFor) return;
    const qty = Number(buyForm.qty);
    if (!qty || qty <= 0) { setBuyErr('Ingresa una cantidad mayor a 0.'); return; }
    setBuying(true); setBuyErr(null);
    const { error } = await supabase.rpc('inv_register_purchase', {
      p_product_id: buyFor.id,
      p_qty: qty,
      p_unit_cost: Number(buyForm.unit_cost) || 0,
      p_supplier_id: buyForm.supplier_id || null,
      p_purchase_date: buyForm.purchase_date || today(),
      p_lote: buyForm.lote.trim(),
      p_expiry: buyForm.expiry_date || null,
      p_notes: buyForm.notes.trim(),
    });
    setBuying(false);
    if (error) { setBuyErr(error.message); return; }
    setBuyFor(null); load();
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold uppercase tracking-tight text-white">
            <Boxes className="h-6 w-6 text-gold" /> Inventario central
          </h2>
          <p className="mt-1 text-[13px] text-white/45">Catálogo de insumos y existencias del almacén central.</p>
        </div>
        <PrimaryButton onClick={openNew}><Plus className="h-4 w-4" strokeWidth={3} /> Nuevo producto</PrimaryButton>
      </div>

      {/* KPIs */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Productos activos" value={kpis.count} icon={<Package className="h-3.5 w-3.5" />} tone="gold" />
        <StatCard label="Valor del inventario" value={fmtMoney(kpis.value)} icon={<Wallet className="h-3.5 w-3.5" />} tone="green" />
        <StatCard label="Stock bajo" value={kpis.low} icon={<AlertTriangle className="h-3.5 w-3.5" />} tone="yellow" />
        <StatCard label="Agotados" value={kpis.out} icon={<PackageX className="h-3.5 w-3.5" />} tone="red" />
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <TextInput placeholder="Buscar producto o código…" value={search} onChange={(e) => setSearch(e.target.value)} className="!py-2.5 pl-11" />
        </div>
        <SelectInput value={cat} onChange={(e) => setCat(e.target.value)} className="!py-2.5 max-w-[220px]">
          <option value="" className="bg-ink-800">Todas las categorías</option>
          {categories.map((c) => <option key={c} value={c} className="bg-ink-800">{c}</option>)}
        </SelectInput>
      </div>

      {loading ? <Spinner label="Cargando inventario…" />
        : filtered.length === 0 ? <EmptyState title="Sin productos" subtitle="Crea tu primer insumo con “Nuevo producto”." icon={<Boxes className="h-6 w-6" />} />
        : (
          <div className="overflow-x-auto rounded-[22px] border border-white/10 bg-ink-800/70 shadow-soft">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/8 text-[11px] uppercase tracking-wider text-white/40">
                  <th className="px-4 py-3 font-bold">Producto</th>
                  <th className="px-4 py-3 font-bold">Categoría</th>
                  <th className="px-4 py-3 font-bold text-right">Existencia</th>
                  <th className="px-4 py-3 font-bold text-right">Mín</th>
                  <th className="px-4 py-3 font-bold text-right">Costo prom.</th>
                  <th className="px-4 py-3 font-bold text-right">Valor</th>
                  <th className="px-4 py-3 font-bold">Estado</th>
                  <th className="px-4 py-3 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const st = stockState(Number(p.central_qty), Number(p.min_stock));
                  return (
                    <tr key={p.id} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">{p.name}</div>
                        <div className="text-[11px] text-white/40">{p.code ? `#${p.code} · ` : ''}{supplierName(p.supplier_id)}</div>
                      </td>
                      <td className="px-4 py-3 text-white/60">{p.category}</td>
                      <td className="px-4 py-3 text-right font-bold text-white">{fmtQty(p.central_qty)} <span className="text-[11px] font-normal text-white/40">{p.unit}</span></td>
                      <td className="px-4 py-3 text-right text-white/50">{fmtQty(p.min_stock)}</td>
                      <td className="px-4 py-3 text-right text-white/70">{fmtMoney(p.avg_cost)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gold">{fmtMoney(Number(p.central_qty) * Number(p.avg_cost))}</td>
                      <td className="px-4 py-3"><Pill tone={STOCK_TONE[st]}>{STOCK_LABEL[st]}</Pill></td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <PrimaryButton onClick={() => openBuy(p)} className="!px-3 !py-1.5 !text-xs"><ShoppingCart className="h-3.5 w-3.5" /> Comprar</PrimaryButton>
                          <GhostButton onClick={() => openEdit(p)} className="!px-2.5 !py-1.5 !text-xs"><Pencil className="h-3.5 w-3.5" /></GhostButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      {/* Modal producto */}
      <Modal open={prodModal} onClose={() => !savingProd && setProdModal(false)} title={prodForm.id ? 'Editar producto' : 'Nuevo producto'} wide
        footer={<><GhostButton onClick={() => !savingProd && setProdModal(false)} disabled={savingProd}>Cancelar</GhostButton><PrimaryButton onClick={saveProduct} disabled={savingProd}>{savingProd ? 'Guardando…' : (<><Check className="h-4 w-4" strokeWidth={3} /> Guardar</>)}</PrimaryButton></>}>
        <div className="space-y-4">
          {prodErr && <Banner tone="err">⚠️ {prodErr}</Banner>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nombre"><TextInput value={prodForm.name} onChange={(e) => setProdForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ej. Carne de res 120g" disabled={savingProd} /></Field>
            <Field label="Categoría"><TextInput value={prodForm.category} onChange={(e) => setProdForm((f) => ({ ...f, category: e.target.value }))} placeholder="Ej. Carnes" disabled={savingProd} /></Field>
            <Field label="Código" hint="Opcional, debe ser único."><TextInput value={prodForm.code} onChange={(e) => setProdForm((f) => ({ ...f, code: e.target.value }))} placeholder="Ej. CARN-120" disabled={savingProd} /></Field>
            <Field label="Unidad de medida">
              <SelectInput value={prodForm.unit} onChange={(e) => setProdForm((f) => ({ ...f, unit: e.target.value }))} disabled={savingProd}>
                {UNITS.map((u) => <option key={u} value={u} className="bg-ink-800">{u}</option>)}
              </SelectInput>
            </Field>
            <Field label="Stock mínimo"><TextInput type="number" min="0" step="any" value={prodForm.min_stock} onChange={(e) => setProdForm((f) => ({ ...f, min_stock: e.target.value }))} disabled={savingProd} /></Field>
            <Field label="Proveedor">
              <SelectInput value={prodForm.supplier_id} onChange={(e) => setProdForm((f) => ({ ...f, supplier_id: e.target.value }))} disabled={savingProd}>
                <option value="" className="bg-ink-800">Sin proveedor</option>
                {suppliers.map((s) => <option key={s.id} value={s.id} className="bg-ink-800">{s.name}</option>)}
              </SelectInput>
            </Field>
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <input type="checkbox" checked={prodForm.is_active} onChange={(e) => setProdForm((f) => ({ ...f, is_active: e.target.checked }))} className="h-5 w-5 accent-gold" disabled={savingProd} />
            <span className="text-sm font-bold text-white/80">Producto activo</span>
          </label>
        </div>
      </Modal>

      {/* Modal compra */}
      <Modal open={!!buyFor} onClose={() => !buying && setBuyFor(null)} title={`Registrar compra — ${buyFor?.name ?? ''}`} wide
        footer={<><GhostButton onClick={() => !buying && setBuyFor(null)} disabled={buying}>Cancelar</GhostButton><PrimaryButton onClick={doPurchase} disabled={buying}>{buying ? 'Registrando…' : (<><ShoppingCart className="h-4 w-4" /> Registrar compra</>)}</PrimaryButton></>}>
        <div className="space-y-4">
          {buyErr && <Banner tone="err">⚠️ {buyErr}</Banner>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={`Cantidad (${buyFor?.unit ?? ''})`}><TextInput type="number" min="0" step="any" value={buyForm.qty} onChange={(e) => setBuyForm((f) => ({ ...f, qty: e.target.value }))} placeholder="0" disabled={buying} /></Field>
            <Field label="Costo unitario"><TextInput type="number" min="0" step="any" value={buyForm.unit_cost} onChange={(e) => setBuyForm((f) => ({ ...f, unit_cost: e.target.value }))} placeholder="0.00" disabled={buying} /></Field>
            <Field label="Proveedor">
              <SelectInput value={buyForm.supplier_id} onChange={(e) => setBuyForm((f) => ({ ...f, supplier_id: e.target.value }))} disabled={buying}>
                <option value="" className="bg-ink-800">Sin proveedor</option>
                {suppliers.map((s) => <option key={s.id} value={s.id} className="bg-ink-800">{s.name}</option>)}
              </SelectInput>
            </Field>
            <Field label="Fecha de compra"><TextInput type="date" value={buyForm.purchase_date} onChange={(e) => setBuyForm((f) => ({ ...f, purchase_date: e.target.value }))} disabled={buying} /></Field>
            <Field label="Número de lote"><TextInput value={buyForm.lote} onChange={(e) => setBuyForm((f) => ({ ...f, lote: e.target.value }))} placeholder="Opcional" disabled={buying} /></Field>
            <Field label="Fecha de vencimiento" hint="Si aplica."><TextInput type="date" value={buyForm.expiry_date} onChange={(e) => setBuyForm((f) => ({ ...f, expiry_date: e.target.value }))} disabled={buying} /></Field>
          </div>
          <Field label="Observaciones"><TextInput value={buyForm.notes} onChange={(e) => setBuyForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Opcional" disabled={buying} /></Field>
          <p className="text-[12px] text-white/40">Al registrar, se suma al inventario central y se recalcula el costo promedio ponderado.</p>
        </div>
      </Modal>
    </div>
  );
}
