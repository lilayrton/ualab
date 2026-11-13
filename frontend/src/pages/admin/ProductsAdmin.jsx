import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Power,
  PowerOff,
  X,
  Loader2,
  FlaskConical,
  AlertTriangle,
} from 'lucide-react';

export default function ProductsAdmin() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

  // Modales
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    stock: '',
    categoryId: '',
    shortDescription: '',
    longDescription: '',
    isEnabled: true,
    isFeatured: false,
    images: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const { addToast } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.allSettled([
        api.get('/api/products'),
        api.get('/api/categories'),
      ]);

      if (prodRes.status === 'fulfilled' && Array.isArray(prodRes.value)) {
        setProducts(prodRes.value);
      }
      if (catRes.status === 'fulfilled' && Array.isArray(catRes.value)) {
        setCategories(catRes.value);
      }
    } catch {
      addToast('Error al cargar el catálogo del servidor', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      price: '',
      stock: '10',
      categoryId: categories.length > 0 ? String(categories[0].id) : '',
      shortDescription: '',
      longDescription: '',
      isEnabled: true,
      isFeatured: false,
      images: '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      sku: product.sku || '',
      price: product.price !== undefined ? String(product.price) : '',
      stock: product.stock !== undefined ? String(product.stock) : '0',
      categoryId:
        Array.isArray(product.categories) && product.categories[0]
          ? String(product.categories[0].id)
          : '',
      shortDescription: product.shortDescription || '',
      longDescription: product.longDescription || product.description || '',
      isEnabled: product.isEnabled !== false,
      isFeatured: Boolean(product.isFeatured),
      images: Array.isArray(product.images) ? product.images.join(', ') : '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'El nombre del insumo o equipo es obligatorio';
    if (!formData.sku.trim()) errs.sku = 'El código SKU es obligatorio';
    if (formData.price === '' || isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      errs.price = 'El precio debe ser un número mayor o igual a 0';
    }
    if (formData.stock === '' || isNaN(Number(formData.stock)) || Number(formData.stock) < 0) {
      errs.stock = 'El stock debe ser un número mayor o igual a 0';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const imagesArray = formData.images
        .split(',')
        .map((img) => img.trim())
        .filter(Boolean);

      const payload = {
        name: formData.name.trim(),
        sku: formData.sku.trim().toUpperCase(),
        price: Number(formData.price),
        stock: Number(formData.stock),
        shortDescription: formData.shortDescription.trim(),
        longDescription: formData.longDescription.trim(),
        isEnabled: formData.isEnabled,
        isFeatured: formData.isFeatured,
        images: imagesArray,
        categories: formData.categoryId ? [formData.categoryId] : [],
      };

      if (editingProduct) {
        await api.put(`/api/products/${editingProduct.id}`, payload);
        addToast('Insumo / Equipo actualizado correctamente', 'success');
      } else {
        await api.post('/api/products', payload);
        addToast('Insumo / Equipo creado con éxito', 'success');
      }

      setModalOpen(false);
      loadData();
    } catch (err) {
      addToast(err.message || 'Error al guardar la publicación', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (product) => {
    try {
      const nextState = !product.isEnabled;
      await api.put(`/api/products/${product.id}`, { isEnabled: nextState });
      addToast(
        `Publicación ${nextState ? 'habilitada' : 'pausada'} correctamente`,
        'info'
      );
      loadData();
    } catch (err) {
      addToast(err.message || 'Error al cambiar estado', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmProduct) return;
    try {
      await api.delete(`/api/products/${deleteConfirmProduct.id}`);
      addToast('Publicación eliminada correctamente', 'success');
      setDeleteConfirmProduct(null);
      loadData();
    } catch (err) {
      addToast(err.message || 'Error al eliminar', 'error');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      searchTerm === '' ||
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategoryFilter === '' ||
      (Array.isArray(p.categories) &&
        p.categories.some((c) => String(c.id) === selectedCategoryFilter));

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            ABM de Insumos y Equipamiento
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Administrá el vademécum técnico, precios, stock y estado de disponibilidad ({products.length} ítems).
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/15 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Insumo / Equipo</span>
        </button>
      </div>

      {/* Filtros Rápidos */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por nombre o código SKU..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-teal-600"
          />
        </div>

        <div className="w-full sm:w-auto flex items-center gap-3">
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-hidden"
          >
            <option value="">Todas las especialidades</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            <span className="text-xs text-slate-500 mt-2">Cargando catálogo...</span>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Insumo / Equipo</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Precio</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Especialidad</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProducts.map((p) => {
                  const firstImg = Array.isArray(p.images) && p.images[0];
                  const imgUrl = firstImg
                    ? firstImg.startsWith('http') || firstImg.startsWith('/')
                      ? firstImg
                      : `/uploads/${firstImg}`
                    : null;
                  const catName =
                    Array.isArray(p.categories) && p.categories[0]
                      ? p.categories[0].name
                      : '-';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                          {imgUrl ? (
                            <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-teal-600">
                              <FlaskConical className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block line-clamp-1 max-w-xs">
                            {p.name}
                          </span>
                          {p.isFeatured && (
                            <span className="text-[10px] text-teal-700 font-bold uppercase">
                              ★ Destacado
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-600">{p.sku}</td>
                      <td className="py-3 px-4 font-extrabold text-slate-900">
                        ${Number(p.price).toLocaleString('es-AR')}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600">{p.stock ?? 0} u.</td>
                      <td className="py-3 px-4 text-slate-600">{catName}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleActive(p)}
                          title="Hacer clic para activar o pausar publicación"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition cursor-pointer ${
                            p.isEnabled
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          {p.isEnabled ? (
                            <Power className="w-3 h-3" />
                          ) : (
                            <PowerOff className="w-3 h-3" />
                          )}
                          <span>{p.isEnabled ? 'Activo' : 'Pausado'}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-slate-100 transition cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmProduct(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-400">
            No se encontraron publicaciones con los filtros aplicados.
          </div>
        )}
      </div>

      {/* Modal Crear / Editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg">
                {editingProduct ? 'Editar Insumo / Equipo' : 'Nuevo Insumo / Equipo'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nombre Técnico *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Micropipeta Automática 10-100 µL"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 text-sm focus:outline-hidden"
                  />
                  {formErrors.name && (
                    <p className="text-rose-500 mt-1 font-medium">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Código SKU *
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Ej: DLAB-MP-100"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 text-sm focus:outline-hidden uppercase font-mono"
                  />
                  {formErrors.sku && (
                    <p className="text-rose-500 mt-1 font-medium">{formErrors.sku}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Precio (ARS) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="118000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 text-sm focus:outline-hidden"
                  />
                  {formErrors.price && (
                    <p className="text-rose-500 mt-1 font-medium">{formErrors.price}</p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Stock *
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="15"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 text-sm focus:outline-hidden"
                  />
                  {formErrors.stock && (
                    <p className="text-rose-500 mt-1 font-medium">{formErrors.stock}</p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Especialidad / Categoría
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-hidden focus:border-teal-600"
                  >
                    <option value="">Sin categoría</option>
                    {categories.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Resumen Técnico Corto
                </label>
                <input
                  type="text"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="Resumen técnico breve para listado..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Especificación Técnica Completa
                </label>
                <textarea
                  rows={3}
                  value={formData.longDescription}
                  onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
                  placeholder="Normas ISO, rango de medición, pureza, condiciones de esterilidad..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-teal-600 resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Imágenes (URLs separadas por coma)
                </label>
                <input
                  type="text"
                  value={formData.images}
                  onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-teal-600 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.isEnabled}
                    onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600"
                  />
                  <span>Publicación Activa</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600"
                  />
                  <span>Destacar en Inicio</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Guardando...' : editingProduct ? 'Actualizar' : 'Crear Publicación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación Eliminación */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">¿Eliminar insumo/equipo?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Se eliminará "{deleteConfirmProduct.name}" del catálogo.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmProduct(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-md transition cursor-pointer"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
