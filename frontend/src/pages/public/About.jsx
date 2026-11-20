import React from 'react';
import { Link } from 'react-router-dom';
import { useStoreInfo } from '../../context/StoreInfoContext';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  Microscope,
  ArrowRight,
  FileCheck,
  Building2,
  FlaskConical,
  Pill,
  Factory,
  GraduationCap,
} from 'lucide-react';

export default function About() {
  const { storeInfo } = useStoreInfo();

  const address = storeInfo?.address || 'Lima 757, Ciudad Autónoma de Buenos Aires';
  const phone = storeInfo?.phone || '0800-122-8233';
  const email = storeInfo?.email || 'contacto@uade.edu.ar';
  const hoursText =
    storeInfo?.hours ||
    storeInfo?.businessHours ||
    'Lunes a Viernes de 8:30 a 19:00 hs | Sábados de 9:00 a 13:00 hs';

  const mapQuery = encodeURIComponent(address);

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16 sm:space-y-20">
        {/* 1. Hero Institucional Split */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Columna izquierda (60%) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-slate-200/80 text-[11px] font-bold uppercase tracking-widest text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-[#007F6E]" />
              <span>Distribuidora Científica & Farmacéutica</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-slate-900 tracking-tight leading-[1.12]">
              Infraestructura y{' '}
              <span className="text-[#007F6E]">respaldo técnico</span> para
              laboratorios de alta exigencia
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
              Provisión integral de instrumental analítico, reactivos pro-análisis e
              insumos certificados bajo normativa vigente, con trazabilidad garantizada
              en cada operación.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                to="/contacto"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#007F6E] hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold transition cursor-pointer"
              >
                <span>Solicitar cotización B2B</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/catalogo"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 text-xs sm:text-sm font-bold transition cursor-pointer"
              >
                Explorar catálogo
              </Link>
            </div>
          </div>

          {/* Columna derecha (40%): Tablero técnico */}
          <div className="lg:col-span-5">
            <div className="bg-[#0A0F1C] rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Estándares Operativos
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  ACTIVO
                </span>
              </div>

              <div className="grid grid-cols-2 divide-x divide-y divide-white/10">
                <div className="p-5 sm:p-6 space-y-1.5">
                  <span className="text-sm sm:text-base font-extrabold text-white tracking-tight block">
                    ISO 8655 / ANMAT
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Trazabilidad y certificación de lote.
                  </p>
                </div>

                <div className="p-5 sm:p-6 space-y-1.5">
                  <span className="text-sm sm:text-base font-extrabold text-emerald-400 font-mono tracking-tight block">
                    2°C – 8°C
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Logística con cadena de frío controlada.
                  </p>
                </div>

                <div className="p-5 sm:p-6 space-y-1.5">
                  <span className="text-sm sm:text-base font-extrabold text-white font-mono tracking-tight block">
                    24 / 48 hs
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Despacho ágil a todo el país.
                  </p>
                </div>

                <div className="p-5 sm:p-6 space-y-1.5">
                  <span className="text-sm sm:text-base font-extrabold text-white tracking-tight block">
                    Soporte In-House
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Calibración y mantenimiento preventivo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Bento Grid de Pilares Operativos */}
        <section className="space-y-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#007F6E] block mb-1">
              Protocolo de Calidad
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Cómo garantizamos cada entrega
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Card 1 */}
            <div className="lg:col-span-7 bg-[#0A0F1C] text-white rounded-2xl border border-white/10 p-7 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 text-emerald-400 flex items-center justify-center">
                  <FileCheck className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold tracking-tight">
                  Trazabilidad y Cumplimiento Normativo
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                  Cada partida de reactivos, insumos farmacéuticos e instrumental cuenta con
                  certificados de análisis, control estricto de lotes y vencimientos, y
                  documentación verificable bajo estándares ISO y habilitaciones vigentes.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {['Certificado de Lote', 'Cadena de Frío', 'Normativa ANMAT'].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[11px] font-medium text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Card 2 */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-7 sm:p-8 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#007F6E] flex items-center justify-center">
                <Microscope className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Asesoramiento Técnico Especializado
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Equipo de bioquímicos y especialistas técnicos para asistir en la selección
                exacta de instrumental analítico, consumibles y reactivos según protocolo.
              </p>
            </div>

            {/* Card 3 */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-7 sm:p-8 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#007F6E] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Garantía Oficial y Servicio Técnico
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Calibración certificada, provisión continua de repuestos y consumibles
                compatibles, y planes de mantenimiento preventivo para evitar paradas.
              </p>
            </div>

            {/* Card 4 */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-emerald-700/25 p-7 sm:p-8 space-y-3 relative overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#007F6E] flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Operaciones Corporativas y Licitaciones
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
                Atención dedicada a clínicas, universidades y laboratorios industriales con
                cuentas corrientes habilitadas, facturación A y presupuestos formales en
                menos de 24 horas.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Franja "Sectores que Equipamos" */}
        <section className="space-y-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#007F6E] block mb-1">
              Cobertura Sectorial
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Sectores que Equipamos
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: FlaskConical,
                title: 'Laboratorios de Análisis Clínicos',
                desc: 'Instrumental de diagnóstico, centrífugas y descartables estériles.',
              },
              {
                icon: Pill,
                title: 'Farmacias Magistrales y Droguerías',
                desc: 'Balanzas analíticas, encapsuladoras, morteros y frascos ámbar.',
              },
              {
                icon: Factory,
                title: 'Industria Farmacéutica y Alimenticia',
                desc: 'Control de calidad, espectrofotometría y reactivos grado ACS.',
              },
              {
                icon: GraduationCap,
                title: 'Centros de I+D y Universidades',
                desc: 'Equipamiento de mesada, micropipetas y vidriería Clase A.',
              },
            ].map((sector) => {
              const Icon = sector.icon;
              return (
                <div
                  key={sector.title}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-2.5"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-[#007F6E] flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 leading-snug">
                    {sector.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{sector.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. Sede Central, Mapa y Banner de Cotización */}
        <section className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            {/* Izquierda: Datos de contacto */}
            <div className="lg:col-span-5 p-7 sm:p-10 flex flex-col justify-center space-y-6">
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#007F6E] block">
                  Atención Presencial y Despachos
                </span>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Sede Comercial y Depósito Técnico
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Retirá tus pedidos directamente en nuestra sede central o coordiná envíos
                  refrigerados y estándar a todo el país.
                </p>
              </div>

              <div className="space-y-4 pt-2 border-t border-slate-100 text-xs sm:text-sm text-slate-700">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#007F6E] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Dirección
                    </span>
                    <span className="font-medium text-slate-900">{address}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[#007F6E] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Teléfono
                    </span>
                    <span className="font-mono font-medium text-slate-900">{phone}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#007F6E] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Email
                    </span>
                    <span className="font-medium text-slate-900">{email}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-[#007F6E] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Horarios
                    </span>
                    <span className="font-medium text-slate-900">{hoursText}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Derecha: Mapa embebido real */}
            <div className="lg:col-span-7 border-t lg:border-t-0 lg:border-l border-slate-200/80 min-h-[340px]">
              <iframe
                title={`Ubicación ${address}`}
                src={`https://maps.google.com/maps?q=${mapQuery}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                className="w-full h-full min-h-[340px] grayscale-[20%] border-0 block"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          {/* Banner CTA inferior */}
          <div className="bg-[#0A0F1C] bg-linear-to-r from-[#0A0F1C] via-[#0A0F1C] to-emerald-950/60 rounded-2xl p-8 md:p-10 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-2xl">
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                ¿Necesitás equipar un laboratorio o cotizar por volumen?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Atención directa a compras institucionales, licitaciones y pedidos por
                cantidad con respuesta técnica en menos de 24 horas.
              </p>
            </div>
            <Link
              to="/contacto"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#007F6E] hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition shrink-0 whitespace-nowrap"
            >
              <span>Solicitar Cotización Institucional</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
