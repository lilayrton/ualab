import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useStoreInfo } from '../../context/StoreInfoContext';
import ProductCard from '../../components/products/ProductCard';
import InquiryModal from '../../components/inquiries/InquiryModal';
import LiveSearchDropdown from '../../components/common/LiveSearchDropdown';
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  Search,
  Award,
  FileCheck,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';

// Mapeo de fotos de laboratorio/producto de alta calidad para cada categoría principal
const CATEGORY_VISUALS = {
  'equipos-de-laboratorio': {
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
    tagline: 'Centrífugas, agitadores y balanzas de precisión',
    skuSample: 'ISO 17025',
  },
  'manejo-de-liquidos': {
    image: 'https://images.unsplash.com/photo-1579165466791-788226ab77b6?auto=format&fit=crop&w=600&q=80',
    tagline: 'Micropipetas monocanal, multicanal y dispensadores',
    skuSample: 'ISO 8655',
  },
  'consumibles-y-descartables': {
    image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80',
    tagline: 'Tips con filtro, tubos Falcon, crioviales y descartables',
    skuSample: 'DNase/RNase Free',
  },
  'insumos-farmaceuticos-y-vidrieria': {
    image: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=600&q=80',
    tagline: 'Vidrio borosilicato 3.3, cápsulas, frascos y morteros',
    skuSample: 'ANMAT / USP',
  },
};

export default function Home() {
  const { storeInfo } = useStoreInfo();
  const navigate = useNavigate();
  const [heroSearch, setHeroSearch] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductForInquiry, setSelectedProductForInquiry] = useState(null);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [featuredRes, newRes, categoriesRes] = await Promise.allSettled([
          api.get('/api/products/featured'),
          api.get('/api/products/new'),
          api.get('/api/categories/public'),
        ]);

        if (featuredRes.status === 'fulfilled' && Array.isArray(featuredRes.value)) {
          setFeaturedProducts(featuredRes.value.slice(0, 8));
        }
        if (newRes.status === 'fulfilled' && Array.isArray(newRes.value)) {
          setNewProducts(newRes.value.slice(0, 4));
        }
        if (categoriesRes.status === 'fulfilled' && Array.isArray(categoriesRes.value)) {
          setCategories(categoriesRes.value);
        }
      } catch (err) {
        console.error('Error al cargar datos del Home', err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/catalogo?q=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      navigate('/catalogo');
    }
  };

  return (
    <div className="space-y-12 lg:space-y-16 pb-16 bg-slate-50/50">
      {/* Banner Principal Sobrio y Profesional con HP-banner_v2 */}
      <section className="relative w-full bg-slate-900 border-b border-slate-200">
        <div className="relative min-h-[360px] sm:min-h-[440px] lg:min-h-[480px] flex items-center">
          {/* Imagen de fondo del banner con overflow-hidden para no salirse */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img
              src="/HP-banner_v2_2880x900.avif"
              alt="Instrumental científico y laboratorio"
              className="w-full h-full object-cover object-center"
            />
            {/* Overlay sobrio y elegante para legibilidad óptima */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/75 to-slate-900/40" />
          </div>

          {/* Contenido sobre el banner */}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 w-full z-20">
            <div className="max-w-2xl space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/10 backdrop-blur-md border border-white/20 text-teal-300 text-xs font-semibold tracking-wide">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                <span className="uppercase tracking-wider">Trazabilidad y Control de Calidad · Normas ISO / ANMAT</span>
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                  Precisión analítica para su{' '}
                  <span className="text-teal-400">laboratorio.</span>
                </h1>
                <p className="text-sm sm:text-base text-slate-200 font-normal leading-relaxed max-w-xl">
                  Provisión de instrumental, reactivos P.A. y consumibles estériles con certificación de lote. Optimizamos la exactitud técnica y la continuidad de sus operaciones.
                </p>
              </div>

              {/* Buscador reactivo en vivo sobre el banner */}
              <div className="relative z-30 bg-white/95 p-1.5 sm:p-2 rounded-2xl shadow-2xl max-w-xl border border-slate-200/60">
                <LiveSearchDropdown
                  placeholder="Buscar equipo, reactivo, fórmula o código SKU..."
                  inputClassName="w-full pl-10 pr-20 py-2.5 rounded-xl bg-transparent text-slate-800 placeholder:text-slate-400 text-xs sm:text-sm focus:outline-hidden"
                  buttonText="Buscar"
                  buttonClassName="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm transition cursor-pointer shrink-0"
                />
              </div>

              {/* Accesos Rápidos Sobrios */}
              <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                <span className="text-slate-300 font-medium">Líneas directas:</span>
                <Link
                  to="/catalogo?q=Micropipeta"
                  className="px-2.5 py-1 rounded-md bg-white/15 hover:bg-white/25 text-white backdrop-blur-xs transition"
                >
                  Micropipetas
                </Link>
                <Link
                  to="/catalogo?q=Vortex"
                  className="px-2.5 py-1 rounded-md bg-white/15 hover:bg-white/25 text-white backdrop-blur-xs transition"
                >
                  Agitadores
                </Link>
                <Link
                  to="/catalogo?q=Balanza"
                  className="px-2.5 py-1 rounded-md bg-white/15 hover:bg-white/25 text-white backdrop-blur-xs transition"
                >
                  Balanzas Analíticas
                </Link>
                <Link
                  to="/catalogo?q=Capsulas"
                  className="px-2.5 py-1 rounded-md bg-white/15 hover:bg-white/25 text-white backdrop-blur-xs transition"
                >
                  Insumos Magistrales
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Franja de Respaldo Técnico y Garantías (Estilo OneLab) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-0">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md divide-y sm:divide-y-0 sm:divide-x divide-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-slate-50 text-teal-700 flex items-center justify-center shrink-0 border border-slate-200">
              <FileCheck className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Certificación y Normas</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Trazabilidad ANMAT e ISO 8655</p>
            </div>
          </div>

          <div className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-slate-50 text-teal-700 flex items-center justify-center shrink-0 border border-slate-200">
              <Truck className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Despachos Especializados</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Embalaje reforzado para vidrio y óptica</p>
            </div>
          </div>

          <div className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-slate-50 text-teal-700 flex items-center justify-center shrink-0 border border-slate-200">
              <Award className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Instrumental Homologado</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Marcas líderes con soporte oficial</p>
            </div>
          </div>

          <div className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-slate-50 text-teal-700 flex items-center justify-center shrink-0 border border-slate-200">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Garantía y Asistencia</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Asesoramiento técnico continuo</p>
            </div>
          </div>
        </div>
      </section>

      {/* Grid de Categorías con Fotografías Reales (Estilo E-Commerce Científico OneLab) */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="flex items-end justify-between mb-6 pb-3 border-b border-slate-200">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 block mb-1">
                Catálogo Especializado
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Principales Líneas de Productos
              </h2>
            </div>
            <Link
              to="/catalogo"
              className="text-xs sm:text-sm font-bold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1 group"
            >
              <span>Ver todas las categorías</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat) => {
              const visual = CATEGORY_VISUALS[cat.slug] || {
                image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80',
                tagline: 'Equipamiento e insumos de laboratorio',
                skuSample: 'Calidad Homologada',
              };

              return (
                <div
                  key={cat.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-teal-500 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group"
                >
                  {/* Foto técnica del rubro */}
                  <div className="relative h-44 overflow-hidden bg-slate-100 border-b border-slate-100">
                    <img
                      src={visual.image}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
                    <span className="absolute top-3 right-3 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/90 text-slate-800 backdrop-blur-xs shadow-xs">
                      {visual.skuSample}
                    </span>
                    <div className="absolute bottom-3 left-4 right-4">
                      <Link
                        to={`/catalogo?categoria=${cat.id}`}
                        className="font-black text-base text-white group-hover:text-teal-300 transition block leading-snug drop-shadow-xs"
                      >
                        {cat.name}
                      </Link>
                    </div>
                  </div>

                  {/* Cuerpo de la tarjeta con subcategorías y enlace */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
                      {cat.description || visual.tagline}
                    </p>

                    {/* Subcategorías directas con badges */}
                    {Array.isArray(cat.children) && cat.children.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                          Subcategorías:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {cat.children.map((sub) => (
                            <Link
                              key={sub.id}
                              to={`/catalogo?categoria=${sub.id}`}
                              className="text-[11px] font-medium px-2 py-1 rounded-md bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-700 border border-slate-200/80 transition"
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-2">
                      <Link
                        to={`/catalogo?categoria=${cat.id}`}
                        className="inline-flex items-center justify-between w-full py-2 px-3 rounded-xl bg-slate-50 group-hover:bg-teal-600 text-slate-700 group-hover:text-white text-xs font-bold transition"
                      >
                        <span>Ver productos</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Instrumental e Insumos Destacados */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6 pb-3 border-b border-slate-200">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 block mb-1">
              Selección de Productos
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Insumos y Equipos Destacados
            </h2>
          </div>
          <Link
            to="/catalogo?destacado=true"
            className="text-xs sm:text-sm font-bold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1 group"
          >
            <span>Ver todos los destacados</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-slate-200 h-80 rounded-2xl" />
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onInquire={(p) => setSelectedProductForInquiry(p)}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
            <p className="text-sm text-slate-500">No hay productos destacados por el momento.</p>
          </div>
        )}
      </section>

      {/* Nuevos Ingresos */}
      {newProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-6 pb-3 border-b border-slate-200">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Lanzamientos & Incorporaciones
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Nuevos Ingresos en el Catálogo
              </h2>
            </div>
            <Link
              to="/catalogo"
              className="text-xs sm:text-sm font-bold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1 group"
            >
              <span>Ver catálogo</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onInquire={(p) => setSelectedProductForInquiry(p)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Banner Sobrio para Consultas y Cotizaciones Institucionales */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="bg-slate-900 rounded-2xl p-8 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm border border-slate-800">
          <div className="max-w-xl space-y-2 text-center md:text-left">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-400">
              Atención a Instituciones y Profesionales
            </span>
            <h3 className="text-xl sm:text-2xl font-bold">
              ¿Requerís presupuesto o cotización técnica formal?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Contactá a nuestro equipo técnico para cotizaciones por volumen, licitaciones o asesoramiento sobre instrumental analítico.
            </p>
          </div>
          <Link
            to="/contacto"
            className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm transition shrink-0 shadow-xs"
          >
            Solicitar Cotización
          </Link>
        </div>
      </section>

      {/* Modal de Consulta */}
      <InquiryModal
        product={selectedProductForInquiry}
        isOpen={Boolean(selectedProductForInquiry)}
        onClose={() => setSelectedProductForInquiry(null)}
      />
    </div>
  );
}
