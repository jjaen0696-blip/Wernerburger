import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Edit, Image as ImageIcon, X, Save, Loader } from 'lucide-react';


interface Category {
  id: string;
  name: string;
  icon: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  image_url: string;
  available: boolean;
  display_order: number;
}

export default function MenuManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    price: '',
    category_id: '',
    available: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.from('products').select('*').order('display_order'),
        supabase.from('categories').select('*').order('display_order'),
      ]);

      if (productsRes.data) setProducts(productsRes.data);
      if (categoriesRes.data) {
        setCategories(categoriesRes.data);
        if (categoriesRes.data.length > 0 && !selectedCategory) {
          setSelectedCategory(categoriesRes.data[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
      alert('Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  }

  function getCategoryName(categoryId: string): string {
    const category = categories.find(c => c.id === categoryId);
    return category ? `${category.icon} ${category.name}` : 'Sin categoría';
  }

  function openAddModal() {
    setEditingProduct(null);
    setFormData({
      id: '',
      name: '',
      description: '',
      price: '',
      category_id: selectedCategory,
      available: true,
    });
    setImagePreview('');
    setIsModalOpen(true);
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);
    setFormData({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category_id: product.category_id,
      available: product.available,
    });
    setImagePreview(product.image_url || '');
    setIsModalOpen(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `menu/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('products').getPublicUrl(filePath);
      setImagePreview(data.publicUrl);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name.trim() || !formData.price || !formData.category_id) {
      alert('Completa todos los campos requeridos');
      return;
    }

    setUploading(true);
    try {
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category_id: formData.category_id,
        available: formData.available,
        image_url: imagePreview || null,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert([{ id: formData.id || `prod-${Date.now()}`, ...productData }]);

        if (error) throw error;
      }

      await loadData();
      setIsModalOpen(false);
      alert(editingProduct ? 'Producto actualizado' : 'Producto creado');
    } catch (err) {
      console.error('Save error:', err);
      alert('Error al guardar el producto');
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteProduct(productId: string) {
    if (!confirm('¿Eliminar este producto?')) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;

      await loadData();
      alert('Producto eliminado');
    } catch (err) {
      console.error('Delete error:', err);
      alert('Error al eliminar el producto');
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Gestión de Menú</h2>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 font-semibold text-stone-950 transition hover:bg-amber-600"
        >
          <Plus className="h-5 w-5" />
          Agregar Producto
        </button>
      </div>

      {/* Categorías con productos */}
      <div className="space-y-8">
        {categories.map(category => {
          const categoryProducts = products.filter(p => p.category_id === category.id);
          if (categoryProducts.length === 0) return null;

          return (
            <div key={category.id} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <span className="text-2xl">{category.icon}</span>
                <h3 className="text-lg font-bold text-white">{category.name}</h3>
                <span className="ml-auto text-xs text-gray-400">{categoryProducts.length} items</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categoryProducts.map(product => (
                  <div
                    key={product.id}
                    className="overflow-hidden rounded-lg border border-white/10 bg-white/5 transition hover:border-amber-400/50"
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="aspect-video w-full object-cover"
                      />
                    ) : (
                      <div className="aspect-video w-full bg-gray-700 flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-gray-500" />
                      </div>
                    )}

                    <div className="p-4 space-y-3">
                      <div>
                        <p className="font-bold text-white">{product.name}</p>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{product.description}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-bold text-amber-300">${product.price.toFixed(2)}</p>
                          <span
                            className={`text-xs font-semibold ${
                              product.available
                                ? 'text-emerald-300'
                                : 'text-red-300'
                            }`}
                          >
                            {product.available ? '✓ Disponible' : '✗ No disponible'}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-500/20 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/30"
                        >
                          <Edit className="h-4 w-4" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="flex items-center justify-center rounded-lg bg-red-500/20 p-2 text-red-300 transition hover:bg-red-500/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal para agregar/editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-8">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-amber-400/20 bg-[#0c0b0f]/95 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full bg-white/10 p-2 text-gray-300 transition hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-semibold text-amber-200 mb-2">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej. Hamburguesa Especial"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-gray-500 outline-none focus:border-amber-400"
                  required
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-semibold text-amber-200 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ingredientes y detalles..."
                  rows={3}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-gray-500 outline-none focus:border-amber-400 resize-none"
                />
              </div>

              {/* Precio y Categoría */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-amber-200 mb-2">
                    Precio ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-gray-500 outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-amber-200 mb-2">
                    Categoría *
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-amber-400"
                    required
                  >
                    <option value="">Selecciona una categoría</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Imagen */}
              <div>
                <label className="block text-sm font-semibold text-amber-200 mb-2">
                  Imagen del Producto
                </label>
                <div className="flex gap-4">
                  {imagePreview && (
                    <div className="relative h-32 w-32">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-full w-full rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setImagePreview('')}
                        className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <label className="flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed border-amber-400/50 bg-amber-500/5 p-6 cursor-pointer transition hover:border-amber-400">
                    <ImageIcon className="h-8 w-8 text-amber-400 mb-2" />
                    <span className="text-sm font-semibold text-amber-200">
                      {uploading ? 'Subiendo...' : 'Clic para subir imagen'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Disponibilidad */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="available"
                  checked={formData.available}
                  onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                  className="h-4 w-4 rounded border-white/10"
                />
                <label htmlFor="available" className="text-sm font-semibold text-amber-200">
                  Disponible en el menú
                </label>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-lg border border-white/10 py-2 font-semibold text-white transition hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-amber-500 py-2 font-semibold text-stone-950 transition hover:bg-amber-600 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {editingProduct ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
