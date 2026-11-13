import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import InquiryModal from '../../components/inquiries/InquiryModal';
import {
  ArrowLeft,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Truck,
  Loader2,
  FlaskConical,
  FileCheck,
  Layers,
} from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get(`/api/products/${id}`);
        setProduct(data);
        if (Array.isArray(data.variants) && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        } else {
          setSelectedVariant(null);
        }
      } catch (err) {
        setError(err.message || 'No pudimos encontrar el insumo o equipo solicitado.');
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500 mt-2">Cargando ficha técnica...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Insumo o Equipo no encontrado</h2>
        <p className="text-sm text-slate-500 mt-2">
          {error || 'El producto solicitado no se encuentra activo en el catálogo.'}
        </p>
        <Link
          to="/catalogo"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-teal-600 text-white font-bold text-xs shadow-md transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Catálogo Técnico</span>
        </Link>
      </div>
    );
  }

  const {
    name,
    sku,
    price,
    shortDescription,
    longDescription,
    images = [],
    categories = [],
    isEnabled,
    isFeatured,
    isNew,
    stock,
    discount,
    variants = [],
  } = product;

  const imagesList = Array.isArray(images) && images.length > 0 ? images : [];
  const activeImage = imagesList[activeImageIndex] || null;
  const activeImageUrl = activeImage
    ? activeImage.startsWith('http') || activeImage.startsWith('/')
      ? activeImage
      : `/uploads/${activeImage}`
    : null;

  const currentPrice = selectedVariant ? Number(selectedVariant.price) : Number(price);
  const currentSku = selectedVariant ? selectedVariant.sku : sku;
  const currentStock = selectedVariant ? selectedVariant.stock : stock;

  let finalPrice = currentPrice;
  let discountLabel = null;
  if (discount && discount.value > 0) {
    if (discount.type === 'percent') {
      finalPrice = Math.max(0, currentPrice * (1 - discount.value / 100));
      discountLabel = `${discount.name} (-${discount.value}%)`;
    } else if (discount.type === 'amount') {
      finalPrice = Math.max(0, currentPrice - discount.value);
      discountLabel = `${discount.name} (-$${Number(discount.value).toLocaleString('es-AR')})`;
    }
  }

  const formatARS = (val) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(val);

  const isAvailable = isEnabled !== false && (currentStock === undefined || currentStock > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb Técnico */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/catalogo"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-teal-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Catálogo de Laboratorio</span>
        </Link>
        <span className="text-xs font-mono font-bold text-slate-500 bg-white px-3 py-1 rounded-lg border border-slate-200">
          REF SKU: {currentSku}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-xs">
        {/* Galería de Imágenes */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-2xl bg-slate-100 overflow-hidden border border-slate-200">
            {activeImageUrl ? (
              <img src={activeImageUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-linear-to-br from-slate-50 to-teal-50/40">
                <FlaskConical className="w-16 h-16 stroke-1 text-teal-600/40 mb-2" />
                <span className="text-sm font-medium text-slate-400">Imagen Técnica UALab</span>
              </div>
            )}

            {/* Badges sobre la foto */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              {discountLabel && (
                <span className="bg-rose-600 text-white text-xs font-extrabold px-3 py-1 rounded-lg uppercase shadow-md">
                  {discountLabel}
                </span>
              )}
              {isFeatured && (
                <span className="bg-teal-700 text-white text-xs font-bold px-3 py-1 rounded-lg uppercase shadow-md">
                  Destacado
                </span>
              )}
              {isNew && (
                <span className="bg-sky-600 text-white text-xs font-bold px-3 py-1 rounded-lg uppercase shadow-md">
                  Nuevo Ingreso
                </span>
              )}
            </div>
          </div>

          {imagesList.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {imagesList.map((img, idx) => {
                const thumbUrl =
                  img.startsWith('http') || img.startsWith('/') ? img : `/uploads/${img}`;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition shrink-0 cursor-pointer ${
                      activeImageIndex === idx
                        ? 'border-teal-600 shadow-md ring-2 ring-teal-100'
                        : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Columna de Especificaciones y Compra / Cotización */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Categorías */}
            <div className="flex flex-wrap items-center gap-2">
              {Array.isArray(categories) && categories.length > 0 ? (
                categories.map((c) => (
                  <Link
                    key={c.id}
                    to={`/catalogo?categoria=${c.id}`}
                    className="bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/70 text-xs font-bold px-3 py-1 rounded-lg transition"
                  >
                    {c.name}
                  </Link>
                ))
              ) : (
                <span className="bg-teal-50 text-teal-800 text-xs font-bold px-3 py-1 rounded-lg">
                  Equipamiento e Insumos
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
              {name}
            </h1>

            {shortDescription && (
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                {shortDescription}
              </p>
            )}

            {/* Bloque de Precio y Disponibilidad */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[10px] text-teal-300 uppercase font-bold tracking-wider block">
                  Precio Profesional / Laboratorio
                </span>
                {discountLabel ? (
                  <div className="flex items-baseline gap-2.5 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-black text-white">
                      {formatARS(finalPrice)}
                    </span>
                    <span className="text-sm text-slate-400 line-through">
                      {formatARS(currentPrice)}
                    </span>
                  </div>
                ) : (
                  <span className="text-2xl sm:text-3xl font-black text-white mt-0.5 block">
                    {currentPrice > 0 ? formatARS(currentPrice) : 'Consultar Cotización'}
                  </span>
                )}
              </div>

              <div className="text-right">
                {isAvailable ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>En Stock ({currentStock} u.)</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-400/30">
                    <XCircle className="w-4 h-4" />
                    <span>Sin Stock / A pedido</span>
                  </div>
                )}
              </div>
            </div>

            {/* Selector Interactivo de Presentaciones / Variantes */}
            {Array.isArray(variants) && variants.length > 0 && (
              <div className="pt-2 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-teal-600" />
                  <span>Seleccionar Presentación / Rango Volumétrico:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {variants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          isSelected
                            ? 'border-teal-600 bg-teal-50/70 ring-2 ring-teal-100'
                            : 'border-slate-200 hover:border-teal-300 bg-white'
                        }`}
                      >
                        <span className="font-bold text-xs text-slate-900 block">{v.name}</span>
                        <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                          SKU: {v.sku}
                        </span>
                        <span className="text-xs font-extrabold text-teal-700 mt-1 block">
                          {formatARS(v.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Descripción Técnica Detallada */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Especificaciones Técnicas y Aplicación
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {longDescription || shortDescription || 'Producto certificado para uso en laboratorio.'}
              </p>
            </div>

            {/* Tabla Resumen de Trazabilidad */}
            <div className="grid grid-cols-2 gap-2.5 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Código Técnico
                </span>
                <span className="font-mono font-bold text-slate-800">{currentSku}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Certificación
                </span>
                <span className="font-bold text-slate-800">ISO / ANMAT Trazable</span>
              </div>
            </div>
          </div>

          {/* Botón de Cotización / Consulta */}
          <div className="pt-6 border-t border-slate-100 space-y-4">
            <button
              onClick={() => setInquiryModalOpen(true)}
              className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-sm shadow-lg shadow-teal-600/20 transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Solicitar Cotización o Consulta Técnica</span>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Emitimos Factura A y certificado de lote</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Envíos seguros a laboratorios de todo el país</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Consulta */}
      <InquiryModal
        product={product}
        selectedVariant={selectedVariant}
        isOpen={inquiryModalOpen}
        onClose={() => setInquiryModalOpen(false)}
      />
    </div>
  );
}
