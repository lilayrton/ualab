import React, { useState } from 'react';
import { api } from '../../api/client';
import { useStoreInfo } from '../../context/StoreInfoContext';
import { useToast } from '../../context/ToastContext';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  Loader2,
  CheckCircle2,
  FlaskConical,
} from 'lucide-react';
import { InstagramIcon, FacebookIcon } from '../../components/common/SocialIcons';

export default function Contact() {
  const { storeInfo } = useStoreInfo();
  const { addToast } = useToast();
  const social = storeInfo?.social || storeInfo?.socials || {};
  const hoursText =
    storeInfo?.hours || storeInfo?.businessHours || 'Lunes a Viernes de 8:30 a 19:00 hs';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'El nombre o institución es obligatorio';
    if (!formData.email.trim()) {
      errs.email = 'El correo electrónico es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Ingresá un correo electrónico válido';
    }
    if (!formData.subject.trim()) {
      errs.subject = 'El asunto o rubro es obligatorio';
    }
    if (!formData.message.trim()) {
      errs.message = 'El mensaje no puede estar vacío';
    } else if (formData.message.trim().length < 5) {
      errs.message = 'El mensaje debe tener al menos 5 caracteres';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await api.post('/api/inquiries', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      });

      setSubmitted(true);
      addToast('¡Solicitud enviada! Recibirás confirmación en tu correo.', 'success');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      addToast(err.message || 'Error al enviar el mensaje. Intente nuevamente.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatSocialUrl = (base, val) => {
    if (!val) return '#';
    return val.startsWith('http') ? val : `${base}/${val.replace(/^@/, '')}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="max-w-3xl mb-12">
        <span className="text-xs font-extrabold text-teal-700 uppercase tracking-widest block mb-1">
          Mesa de Entradas & Asesoramiento Científico
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Cotizaciones y Consultas Técnicas
        </h1>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          ¿Solicitás presupuesto formal para tu farmacia, laboratorio clínico o licitación? Completá el formulario detallando los códigos SKU o volúmenes requeridos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Tarjeta de Contacto Técnico */}
        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl flex flex-col justify-between space-y-8 border border-teal-900/40">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white">
                <FlaskConical className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold">Canales de Atención</h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Nuestro departamento técnico y comercial responde consultas de stock, certificados de lote y presupuestos dentro del horario hábil.
            </p>

            <div className="space-y-4 pt-2 text-xs">
              {storeInfo?.address && (
                <div className="flex items-start gap-3 text-slate-300">
                  <MapPin className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-white">Sede y Retiro de Pedidos</span>
                    <span>{storeInfo.address}</span>
                  </div>
                </div>
              )}

              {storeInfo?.phone && (
                <div className="flex items-start gap-3 text-slate-300">
                  <Phone className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-white">Atención Telefónica</span>
                    <span>{storeInfo.phone}</span>
                  </div>
                </div>
              )}

              {storeInfo?.email && (
                <div className="flex items-start gap-3 text-slate-300">
                  <Mail className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-white">Correo Comercial</span>
                    <span>{storeInfo.email}</span>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 text-slate-300">
                <Clock className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-white">Horarios de Atención</span>
                  <span>{hoursText}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
              Redes Institucionales
            </span>
            <div className="flex items-center gap-3">
              {social.instagram && (
                <a
                  href={formatSocialUrl('https://instagram.com', social.instagram)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-teal-600 text-white flex items-center justify-center transition"
                >
                  <InstagramIcon className="w-4 h-4" />
                </a>
              )}
              {social.facebook && (
                <a
                  href={formatSocialUrl('https://facebook.com', social.facebook)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-teal-600 text-white flex items-center justify-center transition"
                >
                  <FacebookIcon className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Formulario de Consultas */}
        <div className="lg:col-span-2 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/90 shadow-xs">
          {submitted ? (
            <div className="py-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                ¡Tu solicitud técnica fue registrada!
              </h3>
              <p className="text-sm text-slate-500 mt-2 max-w-md">
                Almacenamos tu consulta y te enviamos un correo automático de confirmación. Un asesor se comunicará a la brevedad.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-6 px-6 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition cursor-pointer"
              >
                Enviar otra consulta
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nombre / Laboratorio o Farmacia *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Dra. Laura Gómez - Lab Central"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition focus:outline-hidden focus:ring-2 ${
                      errors.name
                        ? 'border-rose-300 focus:ring-rose-100 bg-rose-50/20'
                        : 'border-slate-200 focus:border-teal-600 focus:ring-teal-100'
                    }`}
                  />
                  {errors.name && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="compras@laboratorio.com.ar"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition focus:outline-hidden focus:ring-2 ${
                      errors.email
                        ? 'border-rose-300 focus:ring-rose-100 bg-rose-50/20'
                        : 'border-slate-200 focus:border-teal-600 focus:ring-teal-100'
                    }`}
                  />
                  {errors.email && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Teléfono / Interno (opcional)
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="011 4555-1234"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 text-sm transition focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Motivo / Asunto *
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Ej: Cotización de Micropipetas y Reactivos"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition focus:outline-hidden focus:ring-2 ${
                      errors.subject
                        ? 'border-rose-300 focus:ring-rose-100 bg-rose-50/20'
                        : 'border-slate-200 focus:border-teal-600 focus:ring-teal-100'
                    }`}
                  />
                  {errors.subject && (
                    <p className="text-xs text-rose-500 mt-1 font-medium">{errors.subject}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Detalle del Pedido o Consulta Técnica *
                </label>
                <textarea
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Indicá productos, cantidades, si requerís Factura A o envío al interior..."
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm transition focus:outline-hidden focus:ring-2 resize-none ${
                    errors.message
                      ? 'border-rose-300 focus:ring-rose-100 bg-rose-50/20'
                      : 'border-slate-200 focus:border-teal-600 focus:ring-teal-100'
                  }`}
                />
                {errors.message && (
                  <p className="text-xs text-rose-500 mt-1 font-medium">{errors.message}</p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-lg shadow-teal-600/15 transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Enviando consulta...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Enviar Solicitud Técnica</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
