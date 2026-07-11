import { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit3, Eye, EyeOff, ImagePlus, Plus, Save, Trash2, UtensilsCrossed } from 'lucide-react';
import { supabase, type MenuItem } from '../lib/supabase';
import { Banner, EmptyState, Field, GhostButton, Modal, Pill, PrimaryButton, Spinner, TextInput } from './ui';

type MenuForm = {
  name: string;
  description: string;
  price: string;
  category: string;
  image_url: string;
  available: boolean;
  sort_order: string;
};

const EMPTY_FORM: MenuForm = {
  name: '',
  description: '',
  price: '0',
  category: '',
  image_url: '',
  available: true,
  sort_order: '0',
};

const buildItemIdentity = (item: Pick<MenuItem, 'name' | 'category' | 'price'>) => {
  const normalizedName = (item.name ?? '').trim().toLowerCase();
  const normalizedCategory = (item.category ?? '').trim().toLowerCase();
  const normalizedPrice = Number(item.price ?? 0).toFixed(2);
  return `${normalizedName}::${normalizedCategory}::${normalizedPrice}`;
};

const dedupeItems = (list: MenuItem[]) => {
  const seen = new Set<string>();
  const unique: MenuItem[] = [];
  list.forEach((item) => {
    const identity = buildItemIdentity(item);
    if (seen.has(identity)) return;
    seen.add(identity);
    unique.push(item);
  });
  return unique;
};

export default function MenuManager({ currentEmail }: { currentEmail: string | null }) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: 'ok' | 'err' | 'info'; text: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<MenuForm>(EMPTY_FORM);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = (currentEmail ?? '').trim().toLowerCase() === 'baex10@icloud.com';

  const normalizedItems = useMemo(() => dedupeItems(items), [items]);
  const categories = useMemo(() => {
    return Array.from(new Set(normalizedItems.map((item) => item.category).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [normalizedItems]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from('menu_items')
      .select('*')
      .order('category')
      .order('sort_order')
      .order('name');

    if (loadError) {
      setError(loadError.message);
      setItems([]);
    } else {
      setError(null);
      setItems(dedupeItems((data ?? []) as MenuItem[]));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadItems();
    const channel = supabase
      .channel('menu-manager-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => loadItems())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadItems]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setSelectedFile(null);
    setEditingItem(null);
    setMessage(null);
  };

  const openNew = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    resetForm();
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description ?? '',
      price: item.price.toString(),
      category: item.category ?? '',
      image_url: item.image_url ?? '',
      available: item.available,
      sort_order: item.sort_order?.toString() ?? '0',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving || deleting) return;
    setModalOpen(false);
    resetForm();
  };

  const handleSave = async () => {
    const name = form.name.trim();
    const category = form.category.trim();
    const priceValue = Number.parseFloat(form.price);

    if (!name || !category) {
      setMessage({ tone: 'err', text: 'Ingresa el nombre y la categoría del producto.' });
      return;
    }
    if (Number.isNaN(priceValue) || priceValue < 0) {
      setMessage({ tone: 'err', text: 'El precio debe ser un número válido.' });
      return;
    }

    const normalizedPayload = {
      name,
      category,
      price: Number(priceValue.toFixed(2)),
    };

    const duplicateExists = items.some((item) => item.id !== editingItem?.id && buildItemIdentity(item) === buildItemIdentity(normalizedPayload as Pick<MenuItem, 'name' | 'category' | 'price'>));
    if (duplicateExists) {
      setMessage({ tone: 'err', text: 'Ya existe un producto igual en este menú. Edita el existente o cambia el nombre/categoría.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    let imageUrl = form.image_url.trim();

    if (selectedFile) {
      const reader = new FileReader();
      const fileDataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
        reader.onerror = () => reject(new Error('No se pudo leer la imagen seleccionada.'));
        reader.readAsDataURL(selectedFile);
      });
      imageUrl = fileDataUrl;
    }

    const payload = {
      name,
      description: form.description.trim(),
      price: Number(priceValue.toFixed(2)),
      category,
      image_url: imageUrl,
      available: form.available,
      sort_order: Number(form.sort_order || 0),
    };

    const { data, error: saveError } = editingItem
      ? await supabase.from('menu_items').update(payload).eq('id', editingItem.id).select('*').single()
      : await supabase.from('menu_items').insert(payload).select('*').single();

    setSaving(false);
    if (saveError || !data) {
      setMessage({ tone: 'err', text: saveError?.message ?? 'No se pudo guardar el producto.' });
      return;
    }

    setItems((prev) => dedupeItems([...prev.filter((item) => item.id !== data.id), data as MenuItem]).sort((a, b) => a.category.localeCompare(b.category) || a.sort_order - b.sort_order || a.name.localeCompare(b.name)));

    setMessage({ tone: 'ok', text: editingItem ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.' });
    setModalOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!editingItem) return;
    if (!window.confirm(`¿Eliminar "${editingItem.name}" del menú?`)) return;

    setDeleting(true);
    const { error: deleteError } = await supabase.from('menu_items').delete().eq('id', editingItem.id);
    setDeleting(false);

    if (deleteError) {
      setMessage({ tone: 'err', text: deleteError.message });
      return;
    }

    setMessage({ tone: 'ok', text: 'Producto eliminado.' });
    setModalOpen(false);
    resetForm();
    loadItems();
  };

  if (!isOwner) return null;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold uppercase tracking-tight text-white">
            <UtensilsCrossed className="h-6 w-6 text-gold" /> Menú y catálogos
          </h2>
          <p className="mt-1 max-w-2xl text-[13px] text-white/45">
            Modifica productos, categorías, visibilidad, precios, orden y reemplaza las imágenes del menú desde aquí.
          </p>
        </div>
        <PrimaryButton onClick={openNew}>
          <Plus className="h-4 w-4" /> Nuevo producto
        </PrimaryButton>
      </div>

      {message && <div className="mb-4"><Banner tone={message.tone}>{message.text}</Banner></div>}
      {error && <div className="mb-4"><Banner tone="err">⚠️ {error}</Banner></div>}

      {loading ? (
        <Spinner label="Cargando menú…" />
      ) : normalizedItems.length === 0 ? (
        <EmptyState title="Sin productos" subtitle="Crea el primer artículo del menú para empezar a editarlo." icon={<UtensilsCrossed className="h-6 w-6" />} />
      ) : (
        <div className="space-y-5">
          {categories.map((category) => {
            const categoryItems = normalizedItems.filter((item) => item.category === category);
            return (
              <div key={category} className="premium-panel rounded-[24px] p-4">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h3 className="font-display text-lg font-extrabold uppercase tracking-tight text-white">{category}</h3>
                  <Pill tone="gold">{categoryItems.length} productos</Pill>
                </div>
                <div className="grid gap-3 xl:grid-cols-2">
                  {categoryItems.map((item) => (
                    <div key={item.id} className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4 shadow-[0_16px_36px_rgba(0,0,0,0.22)]">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-display text-lg font-extrabold text-white">{item.name}</p>
                          <p className="mt-1 text-sm text-white/55">{item.description || 'Sin descripción'}</p>
                        </div>
                        {item.available ? <Pill tone="green" className="w-fit"><Eye className="h-3 w-3" /> Visible</Pill> : <Pill tone="gray" className="w-fit"><EyeOff className="h-3 w-3" /> Oculto</Pill>}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Pill tone="gold">${Number(item.price).toFixed(2)}</Pill>
                        <Pill tone="gray">Orden {item.sort_order}</Pill>
                      </div>
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="mt-3 h-28 w-full rounded-2xl object-cover" />
                      ) : (
                        <div className="mt-3 flex h-28 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.03] text-sm text-white/40">
                          <ImagePlus className="mr-2 h-4 w-4" /> Sin imagen
                        </div>
                      )}
                      <div className="mt-4 flex justify-start sm:justify-end">
                        <GhostButton onClick={() => openEdit(item)} className="w-full sm:w-auto">
                          <Edit3 className="h-4 w-4" /> Editar
                        </GhostButton>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingItem ? `Editar ${editingItem.name}` : 'Nuevo producto'}
        wide
        footer={
          <>
            {editingItem && (
              <GhostButton onClick={handleDelete} disabled={saving || deleting} className="mr-auto !border-red-500/30 !text-red-200 hover:!border-red-400 hover:!text-red-100">
                <Trash2 className="h-4 w-4" /> Eliminar
              </GhostButton>
            )}
            <GhostButton onClick={closeModal} disabled={saving || deleting}>Cancelar</GhostButton>
            <PrimaryButton onClick={handleSave} disabled={saving || deleting}>
              {saving ? 'Guardando…' : <><Save className="h-4 w-4" /> Guardar</>}
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          {message && <Banner tone={message.tone}>{message.text}</Banner>}

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre del producto">
              <TextInput value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Ej. Hamburguesa doble" />
            </Field>
            <Field label="Precio">
              <TextInput type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))} placeholder="0.00" />
            </Field>
          </div>

          <Field label="Descripción">
            <TextInput value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Describe el producto" />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Categoría">
              <TextInput list="menu-categories-list" value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} placeholder="Hamburguesas" />
              <datalist id="menu-categories-list">
                {categories.map((category) => <option key={category} value={category} />)}
              </datalist>
            </Field>
            <Field label="Orden / prioridad">
              <TextInput type="number" min="0" value={form.sort_order} onChange={(e) => setForm((prev) => ({ ...prev, sort_order: e.target.value }))} placeholder="0" />
            </Field>
          </div>

          <Field label="Imagen del producto">
            <TextInput value={form.image_url} onChange={(e) => setForm((prev) => ({ ...prev, image_url: e.target.value }))} placeholder="https://... o deja vacío para quitarla" />
            <input type="file" accept="image/*" className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white file:mr-3 file:rounded-xl file:border-0 file:bg-yellow-cta file:px-3 file:py-2 file:text-ink" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
            <p className="mt-2 text-[12px] text-white/45">Puedes pegar una URL externa o subir un archivo nuevo; si subes uno, reemplazará la imagen actual.</p>
          </Field>

          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70">
            <input type="checkbox" checked={form.available} onChange={(e) => setForm((prev) => ({ ...prev, available: e.target.checked }))} className="h-4 w-4 rounded border-white/20 bg-transparent" />
            Mostrar este producto en el menú público
          </label>
        </div>
      </Modal>
    </div>
  );
}
