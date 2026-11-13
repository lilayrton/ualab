import React from 'react';
import { Link } from 'react-router-dom';
import { useStoreInfo } from '../../context/StoreInfoContext';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageCircle,
  ShieldCheck,
  Award,
  FileCheck,
} from 'lucide-react';
import { InstagramIcon, FacebookIcon } from '../common/SocialIcons';

export default function Footer() {
  const { storeInfo } = useStoreInfo();
  const social = storeInfo?.social || storeInfo?.socials || {};
  const whatsappNumber = storeInfo?.whatsapp || social?.whatsapp || '';
  const hoursText = storeInfo?.hours || storeInfo?.businessHours || 'Lunes a Viernes de 8:30 a 19:00 hs';

  const formatSocialUrl = (base, val) => {
    if (!val) return '#';
    return val.startsWith('http') ? val : `${base}/${val.replace(/^@/, '')}`;
  };

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800">
      {/* Cinta Superior de Garantía Científica */}
      <div className="border-b border-slate-900 bg-slate-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0" />
            <span>Trazabilidad de lote y cumplimiento normativo ANMAT e ISO</span>
          </div>
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-teal-400 shrink-0" />
            <span>Calibración individual certificada en instrumental analítico</span>
          </div>
          <div className="flex items-center gap-3">
            <FileCheck className="w-5 h-5 text-teal-400 shrink-0" />
            <span>Atención técnica a laboratorios, farmacias, clínicas y universidades</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Columna 1: Info General y Logo Oficial */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <img
                src="/ualab-logo.jpg"
                alt="UALab Farmacia & Equipamiento"
                className="h-12 w-auto object-contain rounded-md"
              />
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              {storeInfo?.description ||
                'Distribuidora especializada en equipamiento e instrumental para laboratorios, insumos farmacéuticos magistrales, material de vidrio borosilicato 3.3 y consumibles estériles.'}
            </p>
            {/* Redes Sociales */}
            <div className="flex items-center gap-2 pt-1">
              {social.instagram && (
                <a
                  href={formatSocialUrl('https://instagram.com', social.instagram)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-teal-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-800"
                  aria-label="Instagram"
                >
                  <InstagramIcon className="w-3.5 h-3.5" />
                </a>
              )}
              {social.facebook && (
                <a
                  href={formatSocialUrl('https://facebook.com', social.facebook)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-teal-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-800"
                  aria-label="Facebook"
                >
                  <FacebookIcon className="w-3.5 h-3.5" />
                </a>
              )}
              {whatsappNumber && (
                <a
                  href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-teal-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-800"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Columna 2: Líneas de Productos */}
          <div>
            <h3 className="text-white text-xs font-bold tracking-wider uppercase mb-4 font-mono">
              Líneas Especializadas
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/catalogo" className="hover:text-white transition">
                  Catálogo General
                </Link>
              </li>
              <li>
                <Link to="/catalogo?q=micropipeta" className="hover:text-white transition">
                  Manejo de Líquidos (ISO 8655)
                </Link>
              </li>
              <li>
                <Link to="/catalogo?q=balanza" className="hover:text-white transition">
                  Pesaje Analítico y Equipamiento
                </Link>
              </li>
              <li>
                <Link to="/catalogo?q=capsulas" className="hover:text-white transition">
                  Insumos Farmacéuticos Magistrales
                </Link>
              </li>
              <li>
                <Link to="/nosotros" className="hover:text-white transition">
                  Respaldo Técnico Institucional
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Contacto Técnico */}
          <div>
            <h3 className="text-white text-xs font-bold tracking-wider uppercase mb-4 font-mono">
              Contacto y Sede
            </h3>
            <ul className="space-y-3 text-xs text-slate-400">
              {storeInfo?.address && (
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>{storeInfo.address}</span>
                </li>
              )}
              {storeInfo?.phone && (
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-teal-400 shrink-0" />
                  <span className="font-mono text-slate-300">{storeInfo.phone}</span>
                </li>
              )}
              {storeInfo?.email && (
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>{storeInfo.email}</span>
                </li>
              )}
              {hoursText && (
                <li className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>{hoursText}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Columna 4: Accesos Rápidos */}
          <div>
            <h3 className="text-white text-xs font-bold tracking-wider uppercase mb-4 font-mono">
              Acceso Institucional
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Gestión de pedidos de cotización, especificaciones técnicas y área de administración autorizada.
            </p>
            <div className="space-y-2">
              <Link
                to="/contacto"
                className="block text-center py-2 px-3 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold transition shadow-2xs"
              >
                Solicitar Cotización Formal
              </Link>
              <Link
                to="/login"
                className="block text-center py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition"
              >
                Acceso Administrador
              </Link>
            </div>
          </div>
        </div>

        {/* Barra Inferior */}
        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} UALab Farmacia & Equipamiento. Todos los derechos reservados.</p>
          <p className="text-slate-400">
            Trabajo Práctico Obligatorio · Aplicaciones Interactivas
          </p>
        </div>
      </div>
    </footer>
  );
}
