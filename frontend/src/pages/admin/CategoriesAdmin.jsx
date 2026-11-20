import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  AlertTriangle,
  Folder,
} from 'lucide-react';

export default function CategoriesAdmin() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('all');

  // Modales
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteConfirmCategory, setDeleteConfirmCategory] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    parentId: '',
    isEnabled: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const { addToast } = useToast();

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/categories');
      if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch {
      addToast('Error al cargar especialidades / líneas', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      image: '',
      parentId: '',
      isEnabled: true,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name || '',
      description: cat.description || '',
      image: cat.image || '',
      parentId: cat.parentId ? String(cat.parentId) : '',
      isEnabled: cat.isEnabled !== false,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'El nombre del rubro o categoría es obligatorio';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        image: formData.image.trim(),
        parentId: formData.parentId ? Number(formData.parentId) : null,
        isEnabled: formData.isEnabled,
      };

      if (editingCategory) {
        await api.put(`/api/categories/${editingCategory.id}`, payload);
        addToast('Línea / categoría actualizada correctamente', 'success');
      } else {
        await api.post('/api/categories', payload);
        addToast('Línea / categoría creada con éxito', 'success');
      }

      setModalOpen(false);
      loadCategories();
    } catch (err) {
      addToast(err.message || 'Error al guardar la categoría', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmCategory) return;
    try {
      await api.delete(`/api/categories/${deleteConfirmCategory.id}`);
      addToast('Categoría eliminada', 'success');
      setDeleteConfirmCategory(null);
      loadCategories();
    } catch (err) {
      addToast(err.message || 'Error al eliminar la categoría', 'error');
    }
  };

  const rootCount = categories.filter((c) => !c.parentId).length;
  const subCount = categories.filter((c) => Boolean(c.parentId)).length;
  const enabledCount = categories.filter((c) => c.isEnabled !== false).length;

  const filteredCategories = categories.filter((c) => {
    if (filterMode === 'root') return !c.parentId;
    if (filterMode === 'sub') return Boolean(c.parentId);
    if (filterMode === 'enabled') return c.isEnabled !== false;
    return true;
  });

  return (
    <div className="space-y-5 pb-12">
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-700 block">
            Organización del Catálogo
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Líneas y Especialidades
          </h1>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="sm:hidden">Nueva</span>
          <span className="hidden sm:inline">Nueva Línea / Rubro</span>
        </button>
      </div>

      {/* Resumen Interactivo (tocar para filtrar) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={() => setFilterMode('all')}
          className={`text-left p-3 sm:p-3.5 rounded-xl border transition cursor-pointer ${
            filterMode === 'all'
              ? 'bg-white border-slate-900 ring-1 ring-slate-900 shadow-2xs'
              : 'bg-white/80 border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-500 block">Total</span>
          <span className="text-lg sm:text-xl font-extrabold text-slate-900 tabular-nums mt-0.5 block">
            {categories.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterMode((prev) => (prev === 'root' ? 'all' : 'root'))}
          className={`text-left p-3 sm:p-3.5 rounded-xl border transition cursor-pointer ${
            filterMode === 'root'
              ? 'bg-white border-teal-600 ring-1 ring-teal-600 shadow-2xs'
              : 'bg-white/80 border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-500 block">Principales</span>
          <span className="text-lg sm:text-xl font-extrabold text-teal-700 tabular-nums mt-0.5 block">
            {rootCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterMode((prev) => (prev === 'sub' ? 'all' : 'sub'))}
          className={`text-left p-3 sm:p-3.5 rounded-xl border transition cursor-pointer ${
            filterMode === 'sub'
              ? 'bg-white border-cyan-600 ring-1 ring-cyan-600 shadow-2xs'
              : 'bg-white/80 border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-500 block">Subcategorías</span>
          <span className="text-lg sm:text-xl font-extrabold text-cyan-700 tabular-nums mt-0.5 block">
            {subCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterMode((prev) => (prev === 'enabled' ? 'all' : 'enabled'))}
          className={`text-left p-3 sm:p-3.5 rounded-xl border transition cursor-pointer ${
            filterMode === 'enabled'
              ? 'bg-white border-emerald-600 ring-1 ring-emerald-600 shadow-2xs'
              : 'bg-white/80 border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Habilitadas
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-emerald-700 tabular-nums mt-0.5 block">
            {enabledCount}
          </span>
        </button>
      </div>

      {/* Listado de Categorías */}
      <div className="md:bg-white md:rounded-2xl md:border md:border-slate-200/80 md:shadow-xs overflow-hidden">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            <span className="text-xs text-slate-500 mt-2">Cargando especialidades...</span>
          </div>
        ) : filteredCategories.length > 0 ? (
          <>
            {/* Vista Mobile: Tarjetas verticales independientes sin scroll horizontal */}
            <div className="md:hidden space-y-3">
              {filteredCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Folder className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-slate-900 leading-snug">
                          {cat.name}
                        </h3>
                        {cat.parentId && (
                          <span className="text-[10px] font-semibold text-cyan-700 uppercase tracking-wide block mt-0.5">
                            Subcategoría
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase shrink-0 ${
                        cat.isEnabled !== false
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {cat.isEnabled !== false ? 'Habilitada' : 'Oculta'}
                    </span>
                  </div>

                  {cat.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                    <span className="font-mono text-[11px] text-slate-400 truncate">
                      {cat.slug || '-'}
                    </span>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 text-xs font-semibold transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => setDeleteConfirmCategory(cat)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Vista Desktop: Tabla completa */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Línea / Rubro</th>
                    <th className="py-3 px-4">Descripción Técnica</th>
                    <th className="py-3 px-4">Slug / Identificador</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredCategories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 flex items-center gap-2.5 font-bold text-slate-800">
                        <Folder className="w-4 h-4 text-teal-600 shrink-0" />
                        <span>{cat.name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                        {cat.description || 'Sin descripción'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                        {cat.slug || '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            cat.isEnabled !== false
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {cat.isEnabled !== false ? 'Habilitada' : 'Oculta'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-slate-100 transition cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmCategory(cat)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-xs text-slate-400">
            No hay categorías para mostrar con este filtro.
          </div>
        )}
      </div>

      {/* Modal Crear / Editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingCategory ? 'Editar Línea / Rubro' : 'Nueva Línea / Rubro'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Insumos Farmacéuticos y Vidriería"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 text-sm focus:outline-hidden"
                />
                {formErrors.name && (
                  <p className="text-rose-500 mt-1 font-medium">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Descripción
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Breve alcance técnico de los insumos comprendidos..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-teal-600 resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Imagen de portada (URL)
                </label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-teal-600"
                />
                {formData.image.trim() && (
                  <div className="mt-2 h-20 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                    <img
                      src={formData.image.trim()}
                      alt="Vista previa"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {categories.length > 0 && (
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Línea Principal Padre (opcional)
                  </label>
                  <select
                    value={formData.parentId}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-hidden"
                  >
                    <option value="">Ninguna (Línea principal)</option>
                    {categories
                      .filter((c) => !editingCategory || c.id !== editingCategory.id)
                      .map((c) => (
                        <option key={c.id} value={String(c.id)}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.isEnabled}
                    onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600"
                  />
                  <span>Habilitar categoría en el catálogo web</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-teal-600 text-white font-bold shadow-md hover:bg-teal-700 transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Guardando...' : editingCategory ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Eliminación */}
      {deleteConfirmCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">¿Eliminar categoría?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Se eliminará "{deleteConfirmCategory.name}".
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmCategory(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-md transition cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
