import { useEffect, useState, useCallback } from 'react';
import { MapPin, Plus, Pencil, Power, Search, Building2, Check } from 'lucide-react';
import { supabase, type Location, checkSupabaseConnection, getCurrentProfile } from '../lib/supabase';
import { Modal, Field, TextInput, PrimaryButton, GhostButton, Pill, Spinner, EmptyState, Banner } from './ui';

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

type FormState = { id: string | null; name: string; address: string; slug: string; is_active: boolean; is_open: boolean; slugTouched: boolean };
const EMPTY: FormState = { id: null, name: '', address: '', slug: '', is_active: true, is_open: true, slugTouched: false };

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
    const selectCols = 'id,slug,name,address,is_active,is_open,created_at';
    const fallbackCols = 'id,slug,name,address,is_active,created_at';
    let result = await supabase.from('locations').select(selectCols).order('name');
    if (result.error && /is_open|column/i.test(result.error.message)) {
      result = await supabase.from('locations').select(fallbackCols).order('name');
    }
    if (result.error) {
      console.error('Sucursales load error', result.error);
      setError(`No se pudieron cargar las sucursales: ${result.error.message}`);
      setItems([]);
    } else {
      setItems(result.data ?? []);
    }
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

  const openCreate = () => { setForm({ ...EMPTY, is_open: true }); setError(null); setOpen(true); };
  const openEdit = (loc: Location) => {
    setForm({ id: loc.id, name: loc.name, address: loc.address, slug: loc.slug, is_active: loc.is_active, is_open: loc.is_open ?? true, slugTouched: true });
    setError(null);
    setOpen(true);
  };

  const save = async () => {
    // Verificar conexión a Supabase antes de intentar guardar
    const connected = await checkSupabaseConnection();
    if (!connected) {
      setError('No hay conexión con Supabase. Comprueba tu red o la configuración de Supabase.');
      return;
    }
    // Verificar que el usuario esté autenticado y sea admin (políticas RLS requieren admin)
    try {
      const profile = await getCurrentProfile();
      if (!profile || profile.role !== 'admin') {
        setError('Debes iniciar sesión como administrador para crear/editar sucursales.');
        setSaving(false);
        return;
      }
    } catch (e) {
      // Si falla la obtención del perfil, prevenir la operación y mostrar error
      setError('No se pudo verificar la sesión de usuario. Inicia sesión nuevamente.');
      setSaving(false);
      return;
    }
    const name = form.name.trim();
    const slug = (form.slugTouched ? form.slug : slugify(name)).trim();
    if (!name) { setError('El nombre es obligatorio.'); return; }
    if (!slug) { setError('El identificador (slug) es obligatorio.'); return; }
    setSaving(true);
    setError(null);
    const payload = { name, address: form.address.trim(), slug, is_active: form.is_active };
    const payloadWithOpen = { ...payload, is_open: form.is_open };
    const selectCols = 'id,slug,name,address,is_active,is_open,created_at';
    const fallbackCols = 'id,slug,name,address,is_active,created_at';

    try {
      const isNew = !form.id;
      let res = form.id
        ? await supabase.from('locations').update(payloadWithOpen).eq('id', form.id).select(selectCols).maybeSingle()
        : await supabase.from('locations').insert(payloadWithOpen).select(selectCols).maybeSingle();

      if (res.error && /is_open|column/i.test(res.error.message)) {
        res = form.id
          ? await supabase.from('locations').update(payload).eq('id', form.id).select(fallbackCols).maybeSingle()
          : await supabase.from('locations').insert(payload).select(fallbackCols).maybeSingle();
      }

      if (res.error) {
        console.error('Supabase save error', res.error, { form, payload, fallback: false });
        const message = /duplicate|unique/i.test(res.error.message)
          ? 'Ya existe una sucursal con ese identificador (slug).'
          : res.error.message;
        setError(`${message} ${res.error.status === 0 ? 'Verifica tu conexión a Supabase.' : ''}`.trim());
        setSaving(false);
        return;
      }

        if (!res.data) {
          console.error('Supabase save returned no data', {
            status: (res as any).status,
            statusText: (res as any).statusText,
            count: (res as any).count,
            error: res.error,
            data: res.data,
          });
        // Intento alternativo: re-consultar la fila por slug (nuevo) o id (edición)
        try {
          let fallbackRow = null;
          if (isNew) {
            const { data: lookup, error: lookupErr } = await supabase.from('locations').select(selectCols).eq('slug', slug).maybeSingle();
            if (!lookupErr && lookup) fallbackRow = lookup;
          } else if (form.id) {
            const { data: lookup, error: lookupErr } = await supabase.from('locations').select(selectCols).eq('id', form.id).maybeSingle();
            if (!lookupErr && lookup) fallbackRow = lookup;
          }

          if (fallbackRow) {
            // asignar manualmente para seguir el flujo normal
            // @ts-expect-error asignación temporal
            res.data = fallbackRow;
          } else {
            setError('No se recibió respuesta correcta de Supabase. Comprueba la conexión y los permisos.');
            setSaving(false);
            return;
          }
        } catch (e) {
          setError('No se recibió respuesta correcta de Supabase. Comprueba la conexión y los permisos.');
          setSaving(false);
          return;
        }
      }

      if (isNew) {
        const { data: baseItems, error: baseItemsError } = await supabase.from('menu_items').select('*').is('location_id', null);
        if (!baseItemsError && (baseItems ?? []).length > 0) {
          const copies = (baseItems ?? []).map(({ id: _id, created_at: _createdAt, ...item }) => ({ ...item, location_id: res.data.id }));
          const { error: copyError } = await supabase.from('menu_items').insert(copies);
          if (copyError) {
            setError('La sucursal se creó, pero no se pudieron copiar los menús. Inténtalo de nuevo.');
            setSaving(false);
            load();
            return;
          }
        }
      }

      setSaving(false);
      setOpen(false);
      await load();
      return;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la sucursal.');
      setSaving(false);
      return;
    }
  };

  const toggleActive = async (loc: Location) => {
    // Verificar conexión antes de togglear
    const connected = await checkSupabaseConnection();
    if (!connected) {
      setError('No hay conexión con Supabase. Comprueba tu red o la configuración de Supabase.');
      return;
    }
    // Verificar sesión/admin (RLS)
    try {
      const profile = await getCurrentProfile();
      if (!profile || profile.role !== 'admin') {
        setError('Debes iniciar sesión como administrador para cambiar el estado de una sucursal.');
        return;
      }
    } catch (e) {
      setError('No se pudo verificar la sesión de usuario. Inicia sesión nuevamente.');
      return;
    }
    setTogglingId(loc.id);
    const result = await supabase.from('locations').update({ is_active: !loc.is_active }).eq('id', loc.id).select('id,is_active').maybeSingle();
    setTogglingId(null);
    if (result.error) {
      console.error('Supabase toggleActive error', result.error, { loc });
      setError(`No se pudo cambiar el estado de la sucursal: ${result.error.message}. ${result.error.status === 0 ? 'Verifica tu conexión a Supabase.' : ''}`);
      return;
    }
    if (!result.data) {
      console.error('Supabase toggleActive returned no data', {
        status: (result as any).status,
        statusText: (result as any).statusText,
        count: (result as any).count,
        error: result.error,
        data: result.data,
        loc,
      });
      // Intento fallback: consultar la fila por id para confirmar si la actualización ocurrió
      try {
        const { data: lookup, error: lookupErr } = await supabase.from('locations').select('id,is_active').eq('id', loc.id).maybeSingle();
        if (!lookupErr && lookup) {
          // La fila existe; recargar datos para reflejar el cambio
          await load();
          return;
        }
        // Si tampoco encontramos la fila, reportar error habitual
        setError('No se encontró la sucursal para actualizar. Refresca y vuelve a intentar.');
        return;
      } catch (e) {
        console.error('Fallback lookup failed', e);
        setError('No se pudo verificar la sucursal tras la operación. Comprueba la conexión.');
        return;
      }
    }
    await load();
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
                <Pill tone={loc.is_open === false ? 'red' : (loc.is_active ? 'green' : 'gray')}>{loc.is_open === false ? 'Cerrada hoy' : (loc.is_active ? 'Activa' : 'Inactiva')}</Pill>
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
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-red-400/20 bg-red-500/[0.06] px-4 py-3">
            <input type="checkbox" checked={form.is_open === false} onChange={(e) => setForm((f) => ({ ...f, is_open: !e.target.checked }))} className="h-5 w-5 accent-red-500" disabled={saving} />
            <span className="text-sm font-bold text-red-200">Marcar como cerrada por hoy</span>
          </label>
        </div>
      </Modal>
    </div>
  );
}
