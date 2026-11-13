import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { Search, Loader2, ArrowRight, Tag, X } from 'lucide-react';

export default function LiveSearchDropdown({
  placeholder = 'Buscar producto, reactivo o SKU...',
  className = '',
  inputClassName = '',
  buttonText = 'Buscar',
  buttonClassName = '',
  showButton = true,
  onSelectProduct = null,
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Búsqueda en vivo con debounce de 200ms
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/api/products/search?q=${encodeURIComponent(query.trim())}&limit=5`);
        const items = Array.isArray(res) ? res : res?.items || [];
        setResults(items);
        setIsOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Cerrar al clickear afuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      navigate(`/catalogo?q=${encodeURIComponent(query.trim())}`);
    } else {
      navigate('/catalogo');
    }
  };

  const handleSelect = (productId) => {
    setIsOpen(false);
    setQuery('');
    if (onSelectProduct) {
      onSelectProduct(productId);
    } else {
      navigate(`/productos/${productId}`);
    }
  };

  const formatPrice = (val) => {
    const num = Number(val) || 0;
    return num > 0
      ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(num)
      : null;
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative flex items-center w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length >= 2) setIsOpen(true);
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className={inputClassName}
        />

        {loading ? (
          <Loader2 className="absolute right-14 sm:right-16 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600 animate-spin" />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-14 sm:right-16 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}

        {showButton && (
          <button type="submit" className={buttonClassName}>
            {buttonText}
          </button>
        )}
      </form>

      {/* Menú flotante con resultados en tiempo real */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Resultados para "{query}"</span>
            {results.length > 0 && <span>{results.length} coincidencias</span>}
          </div>

          {results.length > 0 ? (
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {results.map((prod) => {
                const img = Array.isArray(prod.images) && prod.images[0] ? prod.images[0] : null;
                const imgSrc = img?.startsWith('http') || img?.startsWith('/') ? img : img ? `/uploads/${img}` : null;
                const price = formatPrice(prod.price);

                return (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => handleSelect(prod.id)}
                    className="w-full p-2.5 flex items-center gap-3 hover:bg-teal-50/60 transition text-left cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {imgSrc ? (
                        <img src={imgSrc} alt={prod.name} className="w-full h-full object-cover" />
                      ) : (
                        <Tag className="w-4 h-4 text-slate-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 group-hover:text-teal-700 truncate">
                          {prod.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 font-mono">
                        {prod.sku && <span>SKU: {prod.sku}</span>}
                        {prod.categories?.[0]?.name && (
                          <span className="text-teal-700 bg-teal-50 px-1 rounded">
                            {prod.categories[0].name}
                          </span>
                        )}
                      </div>
                    </div>

                    {price && (
                      <span className="text-xs font-bold text-slate-800 shrink-0 font-mono">
                        {price}
                      </span>
                    )}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={handleSubmit}
                className="w-full p-2.5 text-center text-xs font-bold text-teal-700 hover:text-teal-800 hover:bg-teal-50 transition flex items-center justify-center gap-1.5"
              >
                <span>Ver todos los resultados en el catálogo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : !loading ? (
            <div className="p-4 text-center text-xs text-slate-500">
              No se encontraron productos para <strong className="text-slate-800">"{query}"</strong>.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

