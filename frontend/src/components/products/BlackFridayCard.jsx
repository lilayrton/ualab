import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, FlaskConical } from 'lucide-react';

export default function BlackFridayCard({ product, onInquire }) {
  const {
    id,
    name,
    sku,
    price,
    images,
    categories,
    isEnabled,
    stock,
    discount,
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
      : 'Laboratorio';

  const numPrice = typeof price === 'number' ? price : Number(price) || 0;
  let finalPrice = numPrice;
  let discountLabel = null;

  if (discount && Number(discount.value) > 0) {
    if (discount.type === 'percent') {
      finalPrice = Math.max(0, numPrice * (1 - Number(discount.value) / 100));
      discountLabel = `-${discount.value}%`;
    } else if (discount.type === 'amount') {
      finalPrice = Math.max(0, numPrice - Number(discount.value));
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
    <article className="group h-full flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200/80 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl">
      {/* Zona 1: Imagen (aspect-[4/3]) con máximo 2 badges */}
      <Link
        to={`/productos/${id}`}
        className="relative aspect-4/3 bg-slate-100 overflow-hidden border-b border-slate-100 shrink-0 block"
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
            <FlaskConical className="w-10 h-10 stroke-1" />
          </div>
        )}

        {discountLabel && (
          <span className="absolute top-3 left-3 bg-[#DC2626] text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm z-10">
            {discountLabel}
          </span>
        )}

        <span
          className={`absolute top-3 right-3 bg-white/90 backdrop-blur-xs text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-xs inline-flex items-center gap-1.5 z-10 ${
            available ? 'text-emerald-800' : 'text-rose-700'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              available ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
          />
          {available ? 'En stock' : 'Sin stock'}
        </span>
      </Link>

      {/* Zona 2: Cuerpo de información */}
      <div className="flex-1 flex flex-col p-5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-700 truncate">
            {categoryName}
          </span>
          {sku && (
            <span className="font-mono text-[11px] text-slate-400 shrink-0">
              {sku}
            </span>
          )}
        </div>

        <h3 className="text-sm md:text-base font-bold text-slate-900 leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-teal-700 transition-colors">
          <Link to={`/productos/${id}`}>{name}</Link>
        </h3>

        {/* Zona 3: Footer de precio y acción */}
        <div className="border-t border-slate-100 pt-4 mt-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Precio final
          </span>
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 mt-0.5">
            <span className="text-xl font-extrabold text-slate-950 tabular-nums">
              {formatARS(finalPrice)}
            </span>
            {discountLabel && finalPrice < numPrice && (
              <span className="text-xs text-slate-400 line-through tabular-nums">
                {formatARS(numPrice)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-3">
            <Link
              to={`/productos/${id}`}
              className="flex-1 min-w-0 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 px-4 rounded-xl text-sm text-center transition whitespace-nowrap"
            >
              Ver ficha
            </Link>
            <button
              type="button"
              onClick={() => onInquire?.(product)}
              title="Consultar por este producto"
              className="w-10 h-10 shrink-0 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 flex items-center justify-center transition cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
