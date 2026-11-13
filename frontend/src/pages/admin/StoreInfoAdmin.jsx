import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useStoreInfo } from '../../context/StoreInfoContext';
import { useToast } from '../../context/ToastContext';
import {
  FlaskConical,
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageCircle,
  Save,
  Loader2,
  Upload,
} from 'lucide-react';
import { InstagramIcon, FacebookIcon } from '../../components/common/SocialIcons';

export default function StoreInfoAdmin() {
  const { storeInfo, fetchStoreInfo } = useStoreInfo();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    whatsapp: '',
    hours: '',
    social: {
      instagram: '',
      facebook: '',
      twitter: '',
      linkedin: '',
    },
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (storeInfo) {
      setFormData({
        name: storeInfo.name || '',
        description: storeInfo.description || '',
        address: storeInfo.address || '',
        phone: storeInfo.phone || '',
        email: storeInfo.email || '',
        whatsapp: storeInfo.whatsapp || '',
        hours: storeInfo.hours || '',
        social: {
          instagram: storeInfo.social?.instagram || '',
          facebook: storeInfo.social?.facebook || '',
          twitter: storeInfo.social?.twitter || '',
          linkedin: storeInfo.social?.linkedin || '',
        },
      });
      if (storeInfo.logo) {
        setLogoPreview(
          storeInfo.logo.startsWith('http') || storeInfo.logo.startsWith('/')
            ? storeInfo.logo
            : `/uploads/${storeInfo.logo}`
        );
      }
    }
  }, [storeInfo]);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast('El nombre del laboratorio / comercio es obligatorio', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Guardar info institucional compatible con StoreInfoController
      await api.put('/api/store-info', {
        name: formData.name.trim(),
        description: formData.description.trim(),
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        whatsapp: formData.whatsapp.trim(),
        hours: formData.hours.trim(),
        social: formData.social,
      });

      // 2. Si seleccionó un archivo de logo, subirlo
      if (logoFile) {
        const uploadData = new FormData();
        uploadData.append('logo', logoFile);
        await api.post('/api/store-info/logo', uploadData);
      }

      addToast('Información institucional de UALab guardada con éxito', 'success');
      await fetchStoreInfo();
    } catch (err) {
      addToast(err.message || 'Error al guardar la información', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Información Institucional
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Actualizá los datos comerciales, dirección técnica, horarios y canales de contacto de UALab.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-10 space-y-6"
      >
        {/* Logo del Comercio */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
          <div className="w-20 h-20 rounded-2xl bg-teal-50 border-2 border-dashed border-teal-300 flex items-center justify-center overflow-hidden shrink-0">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <FlaskConical className="w-8 h-8 text-teal-600" />
            )}
          </div>
          <div className="space-y-2 text-center sm:text-left">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Logo Institucional
            </span>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer">
              <Upload className="w-4 h-4 text-slate-500" />
              <span>Seleccionar Imagen</span>
              <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
            </label>
            <p className="text-[11px] text-slate-400">Formatos recomendados: PNG o JPG transparente</p>
          </div>
        </div>

        {/* Campos Principales */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nombre del Establecimiento *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: UALab Insumos Farmacéuticos & Laboratorio"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 text-sm focus:outline-hidden font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Descripción Institucional y Certificaciones
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Breve reseña sobre la droguería / proveeduría científica..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 text-sm focus:outline-hidden resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Dirección Física / Sede Central
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Lima 757, Monserrat, CABA"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 text-sm focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Horarios de Atención Comercial
              </label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  placeholder="Lunes a Viernes de 08:30 a 18:00 hs"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 text-sm focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Teléfono de Contacto
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+54 11 4000-7600"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 text-sm focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                WhatsApp Técnico / Ventas
              </label>
              <div className="relative">
                <MessageCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="+5491140007600"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 text-sm focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ventas@ualab.com.ar"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 text-sm focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Redes Sociales */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Redes Sociales
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Instagram (URL o usuario)
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <InstagramIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={formData.social.instagram}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      social: { ...formData.social, instagram: e.target.value },
                    })
                  }
                  placeholder="https://instagram.com/ualab.insumos"
                  className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-teal-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Facebook (URL o página)
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <FacebookIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={formData.social.facebook}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      social: { ...formData.social, facebook: e.target.value },
                    })
                  }
                  placeholder="https://facebook.com/ualab.ar"
                  className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-teal-600"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-900/10 transition disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
