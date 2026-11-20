import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useStoreInfo } from '../../context/StoreInfoContext';
import ProductCard from '../../components/products/ProductCard';
import BlackFridayCard from '../../components/products/BlackFridayCard';
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
  Zap,
  TrendingUp,
  FlaskConical,
} from 'lucide-react';

export default function Home() {
  const { storeInfo } = useStoreInfo();
  const navigate = useNavigate();
  const [heroSearch, setHeroSearch] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [blackFridayProducts, setBlackFridayProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductForInquiry, setSelectedProductForInquiry] = useState(null);
  const [countdown, setCountdown] = useState({ days: 2, hours: 14, minutes: 35, seconds: 50 });

  useEffect(() => {
    const target = Date.now() + ((2 * 24 + 14) * 3600 + 35 * 60 + 50) * 1000;
    const timer = setInterval(() => {
      const diff = Math.max(0, target - Date.now());
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setCountdown({ days, hours, minutes, seconds });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [featuredRes, newRes, categoriesRes, publicRes] = await Promise.allSettled([
          api.get('/api/products/featured'),
          api.get('/api/products/new'),
          api.get('/api/categories/public'),
          api.get('/api/products/public'),
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
        if (publicRes.status === 'fulfilled' && Array.isArray(publicRes.value)) {
          const allPublic = publicRes.value;
          const discounted = allPublic
            .filter((p) => p.discount && Number(p.discount.value) > 0)
            .slice(0, 8);
          setBlackFridayProducts(discounted);

          const nonDiscounted = allPublic.filter(
            (p) => !discounted.some((d) => d.id === p.id)
          );
          setBestSellers(
            (nonDiscounted.length >= 4 ? nonDiscounted : allPublic).slice(0, 4)
          );
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
    <div className="space-y-8 sm:space-y-12 lg:space-y-16 pb-16 bg-slate-50/50">
      {/* Banner Principal Sobrio y Profesional con HP-banner_v2 */}
      <section className="relative w-full bg-slate-900 border-b border-slate-200">
        <div className="relative min-h-[260px] sm:min-h-[420px] lg:min-h-[460px] flex items-center">
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
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 w-full z-20">
            <div className="max-w-2xl space-y-4 sm:space-y-6">
              <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/10 backdrop-blur-md border border-white/20 text-teal-300 text-xs font-semibold tracking-wide">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                <span className="uppercase tracking-wider">Normas ISO / ANMAT</span>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                  Precisión analítica para su{' '}
                  <span className="text-teal-400">laboratorio.</span>
                </h1>
                <p className="text-xs sm:text-base text-slate-200 font-normal leading-relaxed max-w-xl">
                  Instrumental, reactivos y consumibles certificados.
                </p>
              </div>

              {/* Buscador reactivo en vivo sobre el banner */}
              <div className="relative z-30 bg-white/95 p-1 sm:p-2 rounded-xl sm:rounded-2xl shadow-2xl max-w-xl border border-slate-200/60">
                <LiveSearchDropdown
                  placeholder="Buscar equipo, reactivo o SKU..."
                  inputClassName="w-full pl-9 sm:pl-10 pr-20 py-2 sm:py-2.5 rounded-xl bg-transparent text-slate-800 placeholder:text-slate-400 text-xs sm:text-sm focus:outline-hidden"
                  buttonText="Buscar"
                  buttonClassName="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm transition cursor-pointer shrink-0"
                />
              </div>

              {/* Accesos Rápidos Sobrios (ocultos en mobile para priorizar buscador y contenido) */}
              <div className="hidden sm:flex flex-wrap items-center gap-2 text-xs pt-1">
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

      {/* Franja de Respaldo Técnico y Garantías (compacta 2x2 en mobile) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 sm:-mt-8 relative z-0">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-100">
          <div className="p-3 sm:p-5 flex items-center gap-2.5 sm:gap-4">
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-slate-50 text-teal-700 flex items-center justify-center shrink-0 border border-slate-200">
              <FileCheck className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-[11px] sm:text-sm leading-tight">Certificación ISO</h4>
              <p className="hidden sm:block text-[11px] text-slate-500 mt-0.5">Trazabilidad ANMAT e ISO 8655</p>
            </div>
          </div>

          <div className="p-3 sm:p-5 flex items-center gap-2.5 sm:gap-4">
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-slate-50 text-teal-700 flex items-center justify-center shrink-0 border border-slate-200">
              <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-[11px] sm:text-sm leading-tight">Envíos Seguros</h4>
              <p className="hidden sm:block text-[11px] text-slate-500 mt-0.5">Embalaje reforzado para vidrio y óptica</p>
            </div>
          </div>

          <div className="p-3 sm:p-5 flex items-center gap-2.5 sm:gap-4">
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-slate-50 text-teal-700 flex items-center justify-center shrink-0 border border-slate-200">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-[11px] sm:text-sm leading-tight">Marcas Líderes</h4>
              <p className="hidden sm:block text-[11px] text-slate-500 mt-0.5">Soporte oficial homologado</p>
            </div>
          </div>

          <div className="p-3 sm:p-5 flex items-center gap-2.5 sm:gap-4">
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-slate-50 text-teal-700 flex items-center justify-center shrink-0 border border-slate-200">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-[11px] sm:text-sm leading-tight">Garantía Oficial</h4>
              <p className="hidden sm:block text-[11px] text-slate-500 mt-0.5">Asesoramiento técnico continuo</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bloques Directos por Categoría */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
          <div className="flex items-end justify-between mb-5 pb-3 border-b border-slate-200">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 block mb-0.5">
                Explorar por Rubro
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Elegí una Categoría
              </h2>
            </div>
            <Link
              to="/catalogo"
              className="text-xs sm:text-sm font-bold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1 shrink-0 group"
            >
              <span>Ver todo</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {categories.map((cat) => {
              const imgUrl = cat.image
                ? cat.image.startsWith('http') || cat.image.startsWith('/')
                  ? cat.image
                  : `/uploads/${cat.image}`
                : null;

              return (
                <Link
                  key={cat.id}
                  to={`/catalogo?categoria=${cat.id}`}
                  className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 hover:border-teal-500 shadow-xs hover:shadow-lg transition-all duration-300 aspect-4/3 sm:aspect-16/10 flex items-end"
                >
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={cat.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-600">
                      <FlaskConical className="w-10 h-10 stroke-1" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
                  <div className="relative z-10 p-3.5 sm:p-5 w-full flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-teal-300 transition leading-snug">
                        {cat.name}
                      </h3>
                    </div>
                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/15 group-hover:bg-teal-600 text-white flex items-center justify-center shrink-0 transition">
                      <ArrowUpRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Sección Black Friday: 8 Productos en Grilla 4x2 */}
      {blackFridayProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-100/80 rounded-2xl py-8 sm:py-10 px-5 sm:px-8 border border-slate-200/90">
            {/* Header de la sección */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-200">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span>Black Friday</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Ofertas Exclusivas de Laboratorio
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
                  Descuentos por tiempo limitado en instrumental analítico, equipamiento e insumos certificados.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4 sm:gap-6">
                {/* Contador regresivo minimalista */}
                <div className="flex items-center gap-2">
                  {[
                    { label: 'Días', value: countdown.days },
                    { label: 'Hrs', value: countdown.hours },
                    { label: 'Min', value: countdown.minutes },
                    { label: 'Seg', value: countdown.seconds },
                  ].map((unit) => (
                    <div
                      key={unit.label}
                      className="bg-white border border-slate-200 rounded-xl px-2.5 sm:px-3 py-2 min-w-[48px] sm:min-w-[54px] text-center shadow-2xs"
                    >
                      <span className="text-base sm:text-lg font-extrabold text-slate-900 tabular-nums block leading-none">
                        {String(unit.value).padStart(2, '0')}
                      </span>
                      <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-500 font-semibold block mt-1">
                        {unit.label}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  to="/catalogo"
                  className="text-xs sm:text-sm font-bold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1.5 whitespace-nowrap group transition"
                >
                  <span>Ver todo el catálogo</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Grilla 4x2 (8 productos) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
              {blackFridayProducts.map((prod) => (
                <BlackFridayCard
                  key={prod.id}
                  product={prod}
                  onInquire={(p) => setSelectedProductForInquiry(p)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Productos Más Vendidos */}
      {bestSellers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-6 pb-3 border-b border-slate-200">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-teal-700 mb-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Elegidos por Laboratorios</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Productos Más Vendidos
              </h2>
            </div>
            <Link
              to="/catalogo"
              className="text-xs sm:text-sm font-bold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1 shrink-0 group"
            >
              <span>Ver todos</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestSellers.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onInquire={(p) => setSelectedProductForInquiry(p)}
              />
            ))}
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
