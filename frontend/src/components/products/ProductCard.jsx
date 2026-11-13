import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ArrowRight, FlaskConical, Layers, CheckCircle2, XCircle } from 'lucide-react';

export default function ProductCard({ product, onInquire }) {
  const {
    id,
    name,
    sku,
    price,
    shortDescription,
    longDescription,
    images,
    categories,
    isFeatured,
    isNew,
    isEnabled,
    stock,
    discount,
    variants = [],
  } = product;

  const firstImage = Array.isArray(images) && images.length > 0 ? images[0] : null;
  const imageUrl = firstImage
    ? firstImage.startsWith('http') || firstImage.startsWith('/')
      ? firstImage
      : `/uploads/${firstImage}`
    : null;

  const categoryName =
    Array.isArray(categories) && categories.length > 0
      ? categories[0].name
      : 'Insumo de Laboratorio';

  // Cálculo de precio con descuento si aplica
  const numPrice = typeof price === 'number' ? price : Number(price) || 0;
  let finalPrice = numPrice;
  let discountLabel = null;

  if (discount && discount.value > 0) {
    if (discount.type === 'percent') {
      finalPrice = Math.max(0, numPrice * (1 - discount.value / 100));
      discountLabel = `-${discount.value}%`;
    } else if (discount.type === 'amount') {
      finalPrice = Math.max(0, numPrice - discount.value);
      discountLabel = `-$${Number(discount.value).toLocaleString('es-AR')}`;
    }
  }

  const formatARS = (val) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(val);

  const available = isEnabled !== false && (stock === undefined || stock > 0);

  return (
    <div className="group bg-white rounded-xl border border-slate-200/90 hover:border-slate-400 hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden">
      {/* Contenedor de Imagen Limpio (Fondo blanco neutro como OneLab) */}
      <div className="relative aspect-square sm:aspect-4/3 bg-white p-4 flex items-center justify-center overflow-hidden border-b border-slate-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-contain group-hover:scale-102 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50 rounded-lg">
            <FlaskConical className="w-10 h-10 stroke-1 text-slate-300 mb-1" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Sin Imagen</span>
          </div>
        )}

        {/* Badges Técnicos Superiores Sutiles */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {discountLabel && (
            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider shadow-xs">
              {discountLabel}
            </span>
          )}
          {isNew && (
            <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider shadow-xs">
              Nuevo
            </span>
          )}
        </div>

        {/* Indicador de presentaciones sutil */}
        {Array.isArray(variants) && variants.length > 0 && (
          <div className="absolute bottom-2 left-2 z-10">
            <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-medium px-1.5 py-0.5 rounded">
              <Layers className="w-3 h-3 text-slate-500" />
              {variants.length} pres.
            </span>
          </div>
        )}

        {/* Estado de Stock Limpio */}
        <div className="absolute bottom-2 right-2 z-10">
          {available ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              En stock
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 text-[10px] font-semibold px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
              Sin stock
            </span>
          )}
        </div>
      </div>

      {/* Cuerpo Técnico */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Categoría y SKU Monospace */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider truncate">
              {categoryName}
            </span>
            {sku && (
              <span className="text-[10px] font-mono text-slate-500 shrink-0">
                {sku}
              </span>
            )}
          </div>

          {/* Nombre del Producto */}
          <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-teal-700 transition line-clamp-2">
            <Link to={`/productos/${id}`}>{name}</Link>
          </h3>

          {/* Breve descripción */}
          <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
            {shortDescription || longDescription || 'Especificación técnica para laboratorio y farmacia.'}
          </p>
        </div>

        {/* Precios y Botones de Acción */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <span className="text-[9px] text-slate-400 uppercase font-semibold block">
              Precio final
            </span>
            {discountLabel ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-extrabold text-slate-900">
                  {formatARS(finalPrice)}
                </span>
                <span className="text-[11px] text-slate-400 line-through">
                  {formatARS(numPrice)}
                </span>
              </div>
            ) : (
              <span className="text-base font-extrabold text-slate-900">
                {numPrice > 0 ? formatARS(numPrice) : 'A cotizar'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {onInquire && (
              <button
                type="button"
                onClick={() => onInquire(product)}
                title="Consultar / Cotizar"
                className="p-2 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            )}
            <Link
              to={`/productos/${id}`}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition"
            >
              <span>Ver ficha</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
