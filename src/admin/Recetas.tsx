import { useEffect, useState, useCallback, useMemo } from 'react';
import { ChefHat, Search, Plus, Trash2, UtensilsCrossed } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { type Product, fmtQty } from '../lib/inventory';
import { Field, SelectInput, TextInput, PrimaryButton, Spinner, EmptyState, Banner } from './ui';

type RecipeRow = { id: string; item_name: string; product_id: string; qty: number; product: { name: string; unit: string } | null };

export default function Recetas() {
  const [names, setNames] = useState<{ name: string; category: string }[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [recipes, setRecipes] = useState<RecipeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const [addProd, setAddProd] = useState('');
  const [addQty, setAddQty] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [{ data: mi }, { data: prods }, { data: recs }] = await Promise.all([
      supabase.from('menu_items').select('name, category'),
      supabase.from('inv_products').select('*').eq('is_active', true).order('name'),
      supabase.from('recipe_items').select('*, product:inv_products(name,unit)'),
    ]);
    const seen = new Map<string, string>();
    (mi ?? []).forEach((m: { name: string; category: string }) => { if (!seen.has(m.name)) seen.set(m.name, m.category); });
    setNames(Array.from(seen, ([name, category]) => ({ name, category })).sort((a, b) => a.name.localeCompare(b.name)));
    setProducts(prods ?? []);
    setRecipes((recs ?? []) as RecipeRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase.channel('admin-recipes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recipe_items' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const countByName = useMemo(() => {
    const m: Record<string, number> = {};
    recipes.forEach((r) => { m[r.item_name] = (m[r.item_name] || 0) + 1; });
    return m;
  }, [recipes]);

  const filteredNames = useMemo(() => names.filter((n) => !search.trim() || n.name.toLowerCase().includes(search.toLowerCase())), [names, search]);
  const current = useMemo(() => recipes.filter((r) => r.item_name === selected), [recipes, selected]);

  const addIngredient = async () => {
    if (!selected) return;
    const q = Number(addQty);
    if (!addProd) { setErr('Selecciona un insumo.'); return; }
    if (!q || q <= 0) { setErr('Ingresa una cantidad mayor a 0.'); return; }
    setBusy(true); setErr(null);
    const { error } = await supabase.from('recipe_items').upsert(
      { item_name: selected, product_id: addProd, qty: q },
      { onConflict: 'item_name,product_id' },
    );
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setAddProd(''); setAddQty(''); load();
  };

  const removeIngredient = async (id: string) => {
    await supabase.from('recipe_items').delete().eq('id', id);
    load();
  };

  return (
    <div>
      <div className="mb-5">
        <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold uppercase tracking-tight text-white">
          <ChefHat className="h-6 w-6 text-gold" /> Recetas
        </h2>
        <p className="mt-1 text-[13px] text-white/45">Define los ingredientes de cada producto del menú. Se descuentan automáticamente al completar el pedido.</p>
      </div>

      {loading ? <Spinner label="Cargando recetas…" /> : (
        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          {/* Lista de productos del menú */}
          <div className="rounded-[22px] border border-white/10 bg-ink-800/70 p-3 shadow-soft">
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <TextInput placeholder="Buscar producto del menú…" value={search} onChange={(e) => setSearch(e.target.value)} className="!py-2.5 pl-10 text-[13px]" />
            </div>
            <div className="max-h-[60vh] space-y-1 overflow-y-auto scrollbar-hide">
              {filteredNames.map((n) => {
                const c = countByName[n.name] || 0;
                return (
                  <button key={n.name} onClick={() => { setSelected(n.name); setErr(null); }}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition-colors ${selected === n.name ? 'bg-yellow-cta text-ink' : 'text-white/80 hover:bg-white/[0.06]'}`}>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">{n.name}</span>
                      <span className={`block text-[11px] ${selected === n.name ? 'text-ink/60' : 'text-white/40'}`}>{n.category}</span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${c > 0 ? (selected === n.name ? 'bg-ink/15 text-ink' : 'bg-gold/15 text-gold') : (selected === n.name ? 'bg-ink/10 text-ink/50' : 'bg-white/5 text-white/30')}`}>{c} ing.</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editor de receta */}
          <div className="rounded-[22px] border border-white/10 bg-ink-800/70 p-5 shadow-soft">
            {!selected ? (
              <EmptyState title="Selecciona un producto" subtitle="Elige un producto del menú para editar su receta." icon={<UtensilsCrossed className="h-6 w-6" />} />
            ) : (
              <div>
                <h3 className="font-display text-lg font-extrabold text-white">{selected}</h3>
                <p className="mb-4 text-[12px] text-white/40">Ingredientes y cantidad por unidad vendida.</p>

                {current.length === 0 ? (
                  <div className="mb-4 rounded-xl border border-dashed border-white/15 px-4 py-6 text-center text-sm text-white/45">Sin ingredientes. Agrega el primero abajo.</div>
                ) : (
                  <div className="mb-4 overflow-hidden rounded-[16px] border border-white/10">
                    {current.map((r, i) => (
                      <div key={r.id} className={`flex items-center gap-3 px-4 py-2.5 ${i > 0 ? 'border-t border-white/[0.06]' : ''}`}>
                        <span className="flex-1 text-sm font-bold text-white">{r.product?.name ?? '—'}</span>
                        <span className="text-sm text-gold">{fmtQty(r.qty)} <span className="text-[11px] text-white/40">{r.product?.unit}</span></span>
                        <button onClick={() => removeIngredient(r.id)} className="grid h-8 w-8 place-items-center rounded-lg text-white/40 transition-colors hover:bg-white/5 hover:text-red-300"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
                )}

                {err && <div className="mb-3"><Banner tone="err">⚠️ {err}</Banner></div>}
                <div className="flex flex-wrap items-end gap-3 rounded-[16px] border border-white/10 bg-white/[0.02] p-3">
                  <div className="min-w-[180px] flex-1"><Field label="Insumo">
                    <SelectInput value={addProd} onChange={(e) => setAddProd(e.target.value)} disabled={busy}>
                      <option value="" className="bg-ink-800">Selecciona…</option>
                      {products.map((p) => <option key={p.id} value={p.id} className="bg-ink-800">{p.name} ({p.unit})</option>)}
                    </SelectInput>
                  </Field></div>
                  <div className="w-28"><Field label="Cantidad"><TextInput type="number" min="0" step="any" value={addQty} onChange={(e) => setAddQty(e.target.value)} placeholder="0" disabled={busy} /></Field></div>
                  <PrimaryButton onClick={addIngredient} disabled={busy} className="!py-3"><Plus className="h-4 w-4" strokeWidth={3} /> Agregar</PrimaryButton>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
