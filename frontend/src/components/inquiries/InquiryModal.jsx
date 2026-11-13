import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { X, Send, Loader2, CheckCircle2, FlaskConical } from 'lucide-react';

export default function InquiryModal({ product, selectedVariant, isOpen, onClose }) {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    variantId: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (product) {
      const initialVariantId = selectedVariant?.id || (product.variants?.[0]?.id ?? '');
      setFormData((prev) => ({
        ...prev,
        variantId: initialVariantId ? String(initialVariantId) : '',
        subject: `Cotización / Consulta técnica: ${product.name} (${product.sku})`,
      }));
    }
  }, [product, selectedVariant]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'El nombre o razón social es obligatorio';
    if (!formData.email.trim()) {
      errs.email = 'El correo electrónico es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Ingresá un correo electrónico válido';
    }
    if (!formData.message.trim()) {
      errs.message = 'La consulta no puede estar vacía';
    } else if (formData.message.trim().length < 5) {
      errs.message = 'Detallá tu consulta (mínimo 5 caracteres)';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        subject:
          formData.subject.trim() ||
          (product ? `Consulta sobre ${product.name}` : 'Consulta técnica UALab'),
        message: formData.message.trim(),
        productId: product ? product.id : undefined,
        variantId: product && formData.variantId ? formData.variantId : undefined,
      };

      await api.post('/api/inquiries', payload);
      setSubmitted(true);
      addToast('¡Solicitud enviada! Nuestro equipo técnico responderá a la brevedad.', 'success');
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2000);
    } catch (err) {
      addToast(err.message || 'Error al enviar la consulta. Reintentá.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Header Clínico */}
        <div className="p-6 bg-linear-to-r from-teal-700 to-cyan-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <FlaskConical className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">Solicitud de Cotización / Consulta</h3>
              <p className="text-xs text-teal-100 mt-0.5 line-clamp-1">
                {product ? `${product.name} — SKU: ${product.sku}` : 'Asesoramiento Técnico UALab'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-800">¡Consulta Registrada!</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
              Tu consulta técnica quedó asentada en nuestro sistema y enviamos una copia a tu correo.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Selector de variante si el producto tiene presentaciones */}
            {product && Array.isArray(product.variants) && product.variants.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Presentación / Volumen a Cotizar
                </label>
                <select
                  value={formData.variantId}
                  onChange={(e) => setFormData({ ...formData, variantId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-teal-600"
                >
                  {product.variants.map((v) => (
                    <option key={v.id} value={String(v.id)}>
                      {v.name} — SKU: {v.sku} (${Number(v.price).toLocaleString('es-AR')})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nombre / Laboratorio o Farmacia *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Dra. María López - Laboratorio BioSur"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition focus:outline-hidden focus:ring-2 ${
                  errors.name
                    ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                    : 'border-slate-200 focus:border-teal-600 focus:ring-teal-100'
                }`}
              />
              {errors.name && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="compras@laboratorio.com.ar"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition focus:outline-hidden focus:ring-2 ${
                    errors.email
                      ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-200 focus:border-teal-600 focus:ring-teal-100'
                  }`}
                />
                {errors.email && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Teléfono / Interno (opcional)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="011 4555-0000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 focus:ring-teal-100 text-sm transition focus:outline-hidden focus:ring-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Detalle del Pedido o Consulta Técnica *
              </label>
              <textarea
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Indicá cantidad requerida, si necesitás certificado de lote/calibración o envío..."
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition focus:outline-hidden focus:ring-2 resize-none ${
                  errors.message
                    ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                    : 'border-slate-200 focus:border-teal-600 focus:ring-teal-100'
                }`}
              />
              {errors.message && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.message}</p>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar Solicitud</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
