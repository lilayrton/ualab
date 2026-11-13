import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import ProductCard from '../../components/products/ProductCard';
import InquiryModal from '../../components/inquiries/InquiryModal';
import {
  Search,
  Filter,
  X,
  SlidersHorizontal,
  RotateCcw,
  PackageX,
  FlaskConical,
  ChevronRight,
} from 'lucide-react';

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();

  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('categoria') || '';
  const featuredParam = searchParams.get('destacado') === 'true';
  const sortParam = searchParams.get('orden') || 'relevance';

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [onlyFeatured, setOnlyFeatured] = useState(featuredParam);
  const [onlyNew, setOnlyNew] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState(sortParam);

  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categoriesTree, setCategoriesTree] = useState([]);
  const [facetCounts, setFacetCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedProductForInquiry, setSelectedProductForInquiry] = useState(null);

  // Sincronizar cambios externos de URL (ej. desde el buscador del Navbar)
  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
    setSelectedCategory(searchParams.get('categoria') || '');
    setOnlyFeatured(searchParams.get('destacado') === 'true');
  }, [searchParams]);

  // Cargar árbol de categorías públicas
  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await api.get('/api/categories/public');
        if (Array.isArray(data)) {
          setCategoriesTree(data);
        }
      } catch (err) {
        console.error('Error al cargar categorías', err);
      }
    }
    loadCategories();
  }, []);

  // Búsqueda y filtrado contra /api/products/search
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', '50');
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (onlyFeatured) params.append('featured', 'true');
      if (onlyNew) params.append('new', 'true');
      if (inStockOnly) params.append('inStock', 'true');
      if (minPrice !== '' && !isNaN(Number(minPrice)) && Number(minPrice) >= 0) {
        params.append('minPrice', String(Number(minPrice)));
      }
      if (maxPrice !== '' && !isNaN(Number(maxPrice)) && Number(maxPrice) >= 0) {
        params.append('maxPrice', String(Number(maxPrice)));
      }

      if (['relevance', 'newest', 'priceLow', 'priceHigh', 'name'].includes(sortBy)) {
        params.append('sort', sortBy);
      }

      const data = await api.get(`/api/products/search?${params.toString()}`);

      if (data && Array.isArray(data.items)) {
        setProducts(data.items);
        setTotalCount(data.total ?? data.items.length);
        if (data.facets?.categories) {
          const map = {};
          data.facets.categories.forEach((fc) => {
            map[String(fc.id)] = fc.count;
          });
          setFacetCounts(map);
        }
      } else if (Array.isArray(data)) {
        setProducts(data);
        setTotalCount(data.length);
      } else {
        setProducts([]);
        setTotalCount(0);
      }
    } catch {
      try {
        const fallback = await api.get('/api/products/public');
        const list = Array.isArray(fallback) ? fallback : [];
        setProducts(list);
        setTotalCount(list.length);
      } catch {
        setProducts([]);
        setTotalCount(0);
      }
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, onlyFeatured, onlyNew, inStockOnly, minPrice, maxPrice, sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const updateUrlParams = (nextQ, nextCat, nextFeat, nextSort) => {
    const nextParams = {};
    if (nextQ.trim()) nextParams.q = nextQ.trim();
    if (nextCat) nextParams.categoria = nextCat;
    if (nextFeat) nextParams.destacado = 'true';
    if (nextSort !== 'relevance') nextParams.orden = nextSort;
    setSearchParams(nextParams, { replace: true });
  };

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    updateUrlParams(searchQuery, catId, onlyFeatured, sortBy);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setOnlyFeatured(false);
    setOnlyNew(false);
    setInStockOnly(false);
    setMinPrice('');
    setMaxPrice('');
    setSortBy('relevance');
    setSearchParams({});
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    Boolean(selectedCategory) ||
    onlyFeatured ||
    onlyNew ||
    inStockOnly ||
    minPrice !== '' ||
    maxPrice !== '' ||
    sortBy !== 'relevance';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Cabecera Técnica del Catálogo */}
      <div className="bg-linear-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 mb-8 border border-teal-800/40 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-teal-300 text-xs font-bold uppercase tracking-wider">
            <FlaskConical className="w-4 h-4" />
            <span>Vademécum & Catálogo de Instrumental</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Insumos Farmacéuticos y Equipamiento Científico
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Explorá equipos analíticos, manejo de líquidos, vidriería borosilicato Clase A, reactivos y descartables estériles.
          </p>
        </div>
        <div className="bg-white/10 border border-white/15 rounded-2xl px-4 py-3 text-right shrink-0 self-start md:self-center">
          <span className="text-[10px] uppercase tracking-wider text-teal-200 font-bold block">
            Publicaciones Activas
          </span>
          <span className="text-2xl font-black text-white">{totalCount}</span>
          <span className="text-xs text-slate-300 ml-1">ítems</span>
        </div>
      </div>

      {/* Barra Superior de Búsqueda y Orden */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Buscador */}
        <div className="relative w-full md:max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              updateUrlParams(e.target.value, selectedCategory, onlyFeatured, sortBy);
            }}
            placeholder="Buscar por nombre técnico, aplicación o SKU (ej: DLAB-MX-S, pipeta, Sartorius)..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 text-xs sm:text-sm transition focus:outline-hidden"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                updateUrlParams('', selectedCategory, onlyFeatured, sortBy);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Ordenamiento y Botón Filtros Mobile */}
        <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-3">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="md:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            <Filter className="w-4 h-4 text-teal-600" />
            <span>Filtros Técnicos</span>
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-teal-600" />}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold hidden sm:inline">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                updateUrlParams(searchQuery, selectedCategory, onlyFeatured, e.target.value);
              }}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-hidden focus:border-teal-600 cursor-pointer"
            >
              <option value="relevance">Relevancia técnica</option>
              <option value="newest">Más recientes</option>
              <option value="priceLow">Menor precio</option>
              <option value="priceHigh">Mayor precio</option>
              <option value="name">Nombre A - Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Layout Principal: Sidebar + Grilla */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar de Filtros Desktop */}
        <aside className="hidden md:block w-72 shrink-0 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <SlidersHorizontal className="w-4 h-4 text-teal-600" />
              <span>Especialidades y Filtros</span>
            </div>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs text-teal-700 hover:text-teal-900 font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Limpiar
              </button>
            )}
          </div>

          {/* Árbol de Categorías */}
          <div>
            <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-3">
              Rubros de Laboratorio
            </h4>
            <div className="space-y-1">
              <button
                onClick={() => handleCategorySelect('')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  selectedCategory === ''
                    ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200/60'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Todas las especialidades
              </button>

              {categoriesTree.map((cat) => (
                <div key={cat.id} className="space-y-1">
                  <button
                    onClick={() => handleCategorySelect(String(cat.id))}
                    className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      selectedCategory === String(cat.id)
                        ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200/60'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    {facetCounts[String(cat.id)] !== undefined && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold">
                        {facetCounts[String(cat.id)]}
                      </span>
                    )}
                  </button>

                  {/* Subcategorías */}
                  {Array.isArray(cat.children) && cat.children.length > 0 && (
                    <div className="pl-3 border-l-2 border-slate-100 ml-3 space-y-1">
                      {cat.children.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => handleCategorySelect(String(sub.id))}
                          className={`w-full flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                            selectedCategory === String(sub.id)
                              ? 'bg-teal-50 text-teal-800 font-bold'
                              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                          }`}
                        >
                          <span className="flex items-center gap-1 truncate">
                            <ChevronRight className="w-3 h-3 text-teal-500 shrink-0" />
                            <span className="truncate">{sub.name}</span>
                          </span>
                          {facetCounts[String(sub.id)] !== undefined && (
                            <span className="text-[10px] text-slate-400 font-semibold">
                              {facetCounts[String(sub.id)]}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Rango de Precio */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Rango de Precio (ARS)
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 font-semibold block mb-1">Mínimo</label>
                <input
                  type="number"
                  min="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="$ 0"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-teal-600"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-semibold block mb-1">Máximo</label>
                <input
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Sin tope"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-teal-600"
                />
              </div>
            </div>
          </div>

          {/* Condición y Disponibilidad */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
              Disponibilidad y Destacados
            </h4>
            <label className="flex items-center gap-2.5 text-xs text-slate-700 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
              />
              <span>Con stock para entrega inmediata</span>
            </label>
            <label className="flex items-center gap-2.5 text-xs text-slate-700 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={onlyFeatured}
                onChange={(e) => {
                  setOnlyFeatured(e.target.checked);
                  updateUrlParams(searchQuery, selectedCategory, e.target.checked, sortBy);
                }}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
              />
              <span>Instrumental destacado</span>
            </label>
            <label className="flex items-center gap-2.5 text-xs text-slate-700 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={onlyNew}
                onChange={(e) => setOnlyNew(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
              />
              <span>Nuevos ingresos</span>
            </label>
          </div>
        </aside>

        {/* Grilla de Productos */}
        <div className="flex-1 w-full">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-slate-200 h-80 rounded-2xl" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onInquire={(p) => setSelectedProductForInquiry(p)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
                <PackageX className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                No se encontraron insumos o equipos con esos parámetros
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Probá buscando por otro código SKU, nombre genérico o restablecé los filtros activos.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-teal-600 text-white hover:bg-teal-700 font-bold text-xs transition cursor-pointer"
                >
                  Restablecer todos los filtros
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Drawer de Filtros Mobile */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full p-6 flex flex-col justify-between shadow-2xl z-10 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="font-bold text-base text-slate-900">Filtros Técnicos</h3>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Especialidades
                </h4>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      handleCategorySelect('');
                      setMobileFiltersOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium ${
                      selectedCategory === '' ? 'bg-teal-50 text-teal-800 font-bold' : 'text-slate-600'
                    }`}
                  >
                    Todas las especialidades
                  </button>
                  {categoriesTree.map((cat) => (
                    <div key={cat.id} className="space-y-1">
                      <button
                        onClick={() => {
                          handleCategorySelect(String(cat.id));
                          setMobileFiltersOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium ${
                          selectedCategory === String(cat.id)
                            ? 'bg-teal-50 text-teal-800 font-bold'
                            : 'text-slate-700'
                        }`}
                      >
                        {cat.name}
                      </button>
                      {Array.isArray(cat.children) &&
                        cat.children.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => {
                              handleCategorySelect(String(sub.id));
                              setMobileFiltersOpen(false);
                            }}
                            className={`w-full text-left pl-6 pr-3 py-1.5 rounded-lg text-xs ${
                              selectedCategory === String(sub.id)
                                ? 'bg-teal-50 text-teal-800 font-bold'
                                : 'text-slate-500'
                            }`}
                          >
                            ↳ {sub.name}
                          </button>
                        ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="rounded border-slate-300 text-teal-600 w-4 h-4"
                  />
                  <span>Solo en stock</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyFeatured}
                    onChange={(e) => setOnlyFeatured(e.target.checked)}
                    className="rounded border-slate-300 text-teal-600 w-4 h-4"
                  />
                  <span>Solo destacados</span>
                </label>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full py-3 rounded-xl bg-teal-600 text-white font-bold text-xs"
              >
                Ver {products.length} resultados
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Consulta */}
      <InquiryModal
        product={selectedProductForInquiry}
        isOpen={Boolean(selectedProductForInquiry)}
        onClose={() => setSelectedProductForInquiry(null)}
      />
    </div>
  );
}
