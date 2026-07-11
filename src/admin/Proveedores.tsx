import { useEffect, useState, useCallback } from 'react';
import { Truck, Plus, Pencil, Power, Check, Phone, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Supplier } from '../lib/inventory';
import { Modal, Field, TextInput, PrimaryButton, GhostButton, Pill, Spinner, EmptyState, Banner } from './ui';

type FormState = { id: string | null; name: string; contact: string; phone: string; notes: string; is_active: boolean };
const EMPTY: FormState = { id: null, name: '', contact: '', phone: '', notes: '', is_active: true };

export default function Proveedores() {
  const [items, setItems] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from('inv_suppliers').select('*').order('name');
    setItems(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase.channel('admin-suppliers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inv_suppliers' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const save = async () => {
    if (!form.name.trim()) { setError('El nombre es obligatorio.'); return; }
    setSaving(true); setError(null);
    const payload = { name: form.name.trim(), contact: form.contact.trim(), phone: form.phone.trim(), notes: form.notes.trim(), is_active: form.is_active };
    const res = form.id
      ? await supabase.from('inv_suppliers').update(payload).eq('id', form.id)
      : await supabase.from('inv_suppliers').insert(payload);
    setSaving(false);
    if (res.error) { setError(res.error.message); return; }
    setOpen(false); load();
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold uppercase tracking-tight text-white">
            <Truck className="h-6 w-6 text-gold" /> Proveedores
          </h2>
          <p className="mt-1 text-[13px] text-white/45">{items.length} registrados</p>
        </div>
        <PrimaryButton onClick={() => { setForm(EMPTY); setError(null); setOpen(true); }}>
          <Plus className="h-4 w-4" strokeWidth={3} /> Nuevo proveedor
        </PrimaryButton>
      </div>

      {loading ? <Spinner label="Cargando proveedores…" />
        : items.length === 0 ? <EmptyState title="Sin proveedores" subtitle="Agrega tu primer proveedor." icon={<Truck className="h-6 w-6" />} />
        : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((s) => (
              <div key={s.id} className="rounded-[22px] border border-white/10 bg-ink-800/70 p-4 shadow-soft">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-base font-extrabold text-white">{s.name}</h3>
                  <Pill tone={s.is_active ? 'green' : 'gray'}>{s.is_active ? 'Activo' : 'Inactivo'}</Pill>
                </div>
                <div className="mt-2 space-y-1 text-[13px] text-white/55">
                  {s.contact && <p className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-gold/70" />{s.contact}</p>}
                  {s.phone && <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-gold/70" />{s.phone}</p>}
                  {s.notes && <p className="text-white/40">{s.notes}</p>}
                </div>
                <div className="mt-3 flex gap-2 border-t border-white/8 pt-3">
                  <GhostButton onClick={() => { setForm({ id: s.id, name: s.name, contact: s.contact, phone: s.phone, notes: s.notes, is_active: s.is_active }); setError(null); setOpen(true); }} className="!px-3 !py-2 text-[13px]">
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </GhostButton>
                  <GhostButton onClick={async () => { await supabase.from('inv_suppliers').update({ is_active: !s.is_active }).eq('id', s.id); load(); }} className="!px-3 !py-2 text-[13px]">
                    <Power className="h-3.5 w-3.5" /> {s.is_active ? 'Desactivar' : 'Activar'}
                  </GhostButton>
                </div>
              </div>
            ))}
          </div>
        )}

      <Modal open={open} onClose={() => !saving && setOpen(false)} title={form.id ? 'Editar proveedor' : 'Nuevo proveedor'}
        footer={<><GhostButton onClick={() => !saving && setOpen(false)} disabled={saving}>Cancelar</GhostButton><PrimaryButton onClick={save} disabled={saving}>{saving ? 'Guardando…' : (<><Check className="h-4 w-4" strokeWidth={3} /> Guardar</>)}</PrimaryButton></>}>
        <div className="space-y-4">
          {error && <Banner tone="err">⚠️ {error}</Banner>}
          <Field label="Nombre"><TextInput value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ej. Distribuidora La Económica" disabled={saving} /></Field>
          <Field label="Contacto"><TextInput value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} placeholder="Persona de contacto" disabled={saving} /></Field>
          <Field label="Teléfono"><TextInput value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="0000-0000" disabled={saving} /></Field>
          <Field label="Notas"><TextInput value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Opcional" disabled={saving} /></Field>
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="h-5 w-5 accent-gold" disabled={saving} />
            <span className="text-sm font-bold text-white/80">Proveedor activo</span>
          </label>
        </div>
      </Modal>
    </div>
  );
}
