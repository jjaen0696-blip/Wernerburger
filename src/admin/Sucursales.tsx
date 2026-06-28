import { useEffect, useState, useCallback } from 'react';
import { MapPin, Plus, Pencil, Power, Search, Building2, Check } from 'lucide-react';
import { supabase, type Location } from '../lib/supabase';
import { Modal, Field, TextInput, PrimaryButton, GhostButton, Pill, Spinner, EmptyState, Banner } from './ui';

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

type FormState = { id: string | null; name: string; address: string; slug: string; is_active: boolean; slugTouched: boolean };
const EMPTY: FormState = { id: null, name: '', address: '', slug: '', is_active: true, slugTouched: false };

export default function Sucursales() {
  const [items, setItems] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('locations').select('*').order('name');
    if (!error) setItems(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase
      .channel('admin-locations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'locations' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const openCreate = () => { setForm(EMPTY); setError(null); setOpen(true); };
  const openEdit = (loc: Location) => {
    setForm({ id: loc.id, name: loc.name, address: loc.address, slug: loc.slug, is_active: loc.is_active, slugTouched: true });
    setError(null);
    setOpen(true);
  };

  const save = async () => {
    const name = form.name.trim();
    const slug = (form.slugTouched ? form.slug : slugify(name)).trim();
    if (!name) { setError('El nombre es obligatorio.'); return; }
    if (!slug) { setError('El identificador (slug) es obligatorio.'); return; }
    setSaving(true);
    setError(null);
    const payload = { name, address: form.address.trim(), slug, is_active: form.is_active };
    const res = form.id
      ? await supabase.from('locations').update(payload).eq('id', form.id)
      : await supabase.from('locations').insert(payload);
    if (res.error) {
      setError(/duplicate|unique/i.test(res.error.message) ? 'Ya existe una sucursal con ese identificador (slug).' : res.error.message);
      setSaving(false);
      return;
    }
    setSaving(false);
    setOpen(false);
    load();
  };

  const toggleActive = async (loc: Location) => {
    setTogglingId(loc.id);
    await supabase.from('locations').update({ is_active: !loc.is_active }).eq('id', loc.id);
    setTogglingId(null);
    load();
  };

  const filtered = items.filter((l) =>
    !search.trim() || `${l.name} ${l.address} ${l.slug}`.toLowerCase().includes(search.toLowerCase()));
  const activeCount = items.filter((l) => l.is_active).length;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold uppercase tracking-tight text-white">
            <Building2 className="h-6 w-6 text-gold" /> Sucursales
          </h2>
          <p className="mt-1 text-[13px] text-white/45">
            {activeCount} activas · {items.length} en total · se reflejan al instante en la app del cliente.
          </p>
        </div>
        <PrimaryButton onClick={openCreate}>
          <Plus className="h-4 w-4" strokeWidth={3} /> Nueva sucursal
        </PrimaryButton>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        <TextInput placeholder="Buscar sucursal…" value={search} onChange={(e) => setSearch(e.target.value)} className="!py-2.5 pl-11" />
      </div>

      {loading ? (
        <Spinner label="Cargando sucursales…" />
      ) : filtered.length === 0 ? (
        <EmptyState title="Sin sucursales" subtitle="Crea la primera con el botón “Nueva sucursal”." icon={<MapPin className="h-6 w-6" />} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((loc) => (
            <div key={loc.id} className="flex flex-col rounded-[22px] border border-white/10 bg-ink-800/70 p-4 shadow-soft">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-display text-base font-extrabold text-white">{loc.name}</h3>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-white/50">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-gold/70" />
                    <span className="line-clamp-1">{loc.address || 'Sin dirección'}</span>
                  </p>
                </div>
                <Pill tone={loc.is_active ? 'green' : 'gray'}>{loc.is_active ? 'Activa' : 'Inactiva'}</Pill>
              </div>
              <p className="mt-2 text-[11px] font-mono text-white/30">/{loc.slug}</p>
              <div className="mt-4 flex items-center gap-2 border-t border-white/8 pt-3">
                <GhostButton onClick={() => openEdit(loc)} className="!px-3 !py-2 text-[13px]">
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </GhostButton>
                <GhostButton
                  onClick={() => toggleActive(loc)}
                  disabled={togglingId === loc.id}
                  className={`!px-3 !py-2 text-[13px] ${loc.is_active ? 'hover:!text-red-300' : 'hover:!text-emerald-300'}`}
                >
                  <Power className="h-3.5 w-3.5" /> {loc.is_active ? 'Desactivar' : 'Activar'}
                </GhostButton>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => !saving && setOpen(false)}
        title={form.id ? 'Editar sucursal' : 'Nueva sucursal'}
        footer={
          <>
            <GhostButton onClick={() => !saving && setOpen(false)} disabled={saving}>Cancelar</GhostButton>
            <PrimaryButton onClick={save} disabled={saving}>
              {saving ? 'Guardando…' : (<><Check className="h-4 w-4" strokeWidth={3} /> Guardar</>)}
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          {error && <Banner tone="err">⚠️ {error}</Banner>}
          <Field label="Nombre">
            <TextInput
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: f.slugTouched ? f.slug : slugify(e.target.value) }))}
              placeholder="Ej. WernerBurguer Plaza Mayor"
              disabled={saving}
            />
          </Field>
          <Field label="Dirección">
            <TextInput value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Ej. Av. Central 123" disabled={saving} />
          </Field>
          <Field label="Identificador (slug)" hint="Se usa internamente y debe ser único. Se genera del nombre, pero puedes ajustarlo.">
            <TextInput value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value), slugTouched: true }))} placeholder="plaza-mayor" disabled={saving} />
          </Field>
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="h-5 w-5 accent-gold" disabled={saving} />
            <span className="text-sm font-bold text-white/80">Sucursal activa (visible para clientes)</span>
          </label>
        </div>
      </Modal>
    </div>
  );
}
