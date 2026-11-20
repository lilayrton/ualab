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
  ChevronDown,
  Check,
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
  const [mobileSortOpen, setMobileSortOpen] = useState(false);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Cabecera Sobria del Catálogo */}
      <div className="border-b border-slate-200 pb-5 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-700 block">
            Catálogo de Productos
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Insumos Farmacéuticos y Equipamiento
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            Equipos analíticos, manejo de líquidos, vidriería borosilicato, reactivos y descartables.
          </p>
        </div>
        <div className="text-xs sm:text-sm text-slate-500 shrink-0 tabular-nums">
          <span className="font-semibold text-slate-900">{totalCount}</span>{' '}
          {totalCount === 1 ? 'producto' : 'productos'}
        </div>
      </div>

      {/* Barra Superior de Búsqueda y Orden */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs mb-6 sm:mb-8 space-y-3 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4">
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
            placeholder="Buscar equipo, reactivo o SKU..."
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

        {/* Barra Mobile: Filtros + Ordenar en lista personalizada */}
        <div className="grid grid-cols-2 gap-2.5 md:hidden">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
              hasActiveFilters
                ? 'border-teal-600 bg-teal-50/70 text-teal-800'
                : 'border-slate-200 bg-slate-50/70 text-slate-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600" />
              <span>Filtros</span>
            </span>
            {hasActiveFilters ? (
              <span className="w-2 h-2 rounded-full bg-teal-600" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMobileSortOpen((prev) => !prev)}
              className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-800 cursor-pointer"
            >
              <span className="truncate">
                {{
                  relevance: 'Relevancia',
                  newest: 'Recientes',
                  priceLow: 'Menor precio',
                  priceHigh: 'Mayor precio',
                  name: 'Nombre A-Z',
                }[sortBy] || 'Ordenar'}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
                  mobileSortOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {mobileSortOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setMobileSortOpen(false)}
                />
                <div className="absolute right-0 left-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl py-1 z-30 divide-y divide-slate-100">
                  {[
                    { value: 'relevance', label: 'Relevancia técnica' },
                    { value: 'newest', label: 'Más recientes' },
                    { value: 'priceLow', label: 'Menor precio' },
                    { value: 'priceHigh', label: 'Mayor precio' },
                    { value: 'name', label: 'Nombre A - Z' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSortBy(opt.value);
                        updateUrlParams(searchQuery, selectedCategory, onlyFeatured, opt.value);
                        setMobileSortOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left cursor-pointer ${
                        sortBy === opt.value
                          ? 'bg-teal-50/80 text-teal-800 font-bold'
                          : 'text-slate-700 font-medium'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {sortBy === opt.value && <Check className="w-3.5 h-3.5 text-teal-600" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Ordenamiento Desktop */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Ordenar por:</span>
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

      {/* Bottom Sheet de Filtros Mobile */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="relative w-full bg-white rounded-t-3xl max-h-[88vh] flex flex-col shadow-2xl z-10 overflow-hidden">
            {/* Handle + Cabecera fija */}
            <div className="px-5 pt-3 pb-3.5 border-b border-slate-100 shrink-0">
              <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-teal-600" />
                  <h3 className="font-bold text-base text-slate-900">Filtrar y ordenar</h3>
                </div>
                <div className="flex items-center gap-3">
                  {hasActiveFilters && (
                    <button
                      onClick={resetFilters}
                      className="text-xs font-bold text-teal-700 hover:text-teal-900"
                    >
                      Limpiar
                    </button>
                  )}
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Contenido scrolleable */}
            <div className="p-5 space-y-6 overflow-y-auto flex-1">
              {/* Ordenar por (pills) */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  Ordenar por
                </h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'relevance', label: 'Relevancia' },
                    { value: 'newest', label: 'Más recientes' },
                    { value: 'priceLow', label: 'Menor precio' },
                    { value: 'priceHigh', label: 'Mayor precio' },
                    { value: 'name', label: 'A - Z' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setSortBy(opt.value);
                        updateUrlParams(searchQuery, selectedCategory, onlyFeatured, opt.value);
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                        sortBy === opt.value
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Especialidades en lista */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Especialidades
                </h4>
                <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                  <button
                    onClick={() => handleCategorySelect('')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left transition ${
                      selectedCategory === ''
                        ? 'bg-teal-50/80 text-teal-800 font-bold'
                        : 'bg-white text-slate-700 font-medium'
                    }`}
                  >
                    <span>Todas las especialidades</span>
                    {selectedCategory === '' && <Check className="w-3.5 h-3.5 text-teal-600" />}
                  </button>
                  {categoriesTree.map((cat) => (
                    <React.Fragment key={cat.id}>
                      <button
                        onClick={() => handleCategorySelect(String(cat.id))}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left transition ${
                          selectedCategory === String(cat.id)
                            ? 'bg-teal-50/80 text-teal-800 font-bold'
                            : 'bg-white text-slate-800 font-semibold'
                        }`}
                      >
                        <span>{cat.name}</span>
                        {selectedCategory === String(cat.id) && (
                          <Check className="w-3.5 h-3.5 text-teal-600" />
                        )}
                      </button>
                      {Array.isArray(cat.children) &&
                        cat.children.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => handleCategorySelect(String(sub.id))}
                            className={`w-full flex items-center justify-between pl-7 pr-3.5 py-2 text-xs text-left transition ${
                              selectedCategory === String(sub.id)
                                ? 'bg-teal-50/80 text-teal-800 font-bold'
                                : 'bg-slate-50/60 text-slate-600'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <ChevronRight className="w-3 h-3 text-slate-400" />
                              <span>{sub.name}</span>
                            </span>
                            {selectedCategory === String(sub.id) && (
                              <Check className="w-3.5 h-3.5 text-teal-600" />
                            )}
                          </button>
                        ))}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Rango de Precio */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  Precio (ARS)
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    min="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="Mínimo $"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-teal-600"
                  />
                  <input
                    type="number"
                    min="0"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Máximo $"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-teal-600"
                  />
                </div>
              </div>

              {/* Opciones rápidas tipo switch */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="flex items-center justify-between text-xs font-medium text-slate-700 cursor-pointer">
                  <span>Solo en stock</span>
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="rounded border-slate-300 text-teal-600 w-4 h-4 accent-teal-600"
                  />
                </label>
                <label className="flex items-center justify-between text-xs font-medium text-slate-700 cursor-pointer">
                  <span>Solo destacados</span>
                  <input
                    type="checkbox"
                    checked={onlyFeatured}
                    onChange={(e) => setOnlyFeatured(e.target.checked)}
                    className="rounded border-slate-300 text-teal-600 w-4 h-4 accent-teal-600"
                  />
                </label>
                <label className="flex items-center justify-between text-xs font-medium text-slate-700 cursor-pointer">
                  <span>Nuevos ingresos</span>
                  <input
                    type="checkbox"
                    checked={onlyNew}
                    onChange={(e) => setOnlyNew(e.target.checked)}
                    className="rounded border-slate-300 text-teal-600 w-4 h-4 accent-teal-600"
                  />
                </label>
              </div>
            </div>

            {/* Footer fijo */}
            <div className="p-4 border-t border-slate-100 bg-white shrink-0">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
              >
                Ver {totalCount} {totalCount === 1 ? 'producto' : 'productos'}
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
