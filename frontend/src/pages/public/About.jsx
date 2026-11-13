import React from 'react';
import { useStoreInfo } from '../../context/StoreInfoContext';
import { Link } from 'react-router-dom';
import {
  FlaskConical,
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  Award,
  Microscope,
  ArrowRight,
  FileCheck,
} from 'lucide-react';

export default function About() {
  const { storeInfo } = useStoreInfo();
  const hoursText =
    storeInfo?.hours || storeInfo?.businessHours || 'Lunes a Viernes de 8:30 a 19:00 hs';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
      {/* Cabecera Institucional */}
      <div className="max-w-3xl">
        <span className="text-xs font-extrabold text-teal-700 uppercase tracking-widest block mb-1">
          Respaldo Científico y Farmacéutico
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Excelencia en Equipamiento e Insumos en{' '}
          <span className="text-teal-700">{storeInfo?.name || 'UALab'}</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-4 leading-relaxed">
          {storeInfo?.description ||
            'Somos un distribuidor especializado en equipamiento científico, instrumental analítico, reactivos pro-análisis, vidriería borosilicato Clase A y descartables estériles para laboratorios clínicos, farmacias magistrales, universidades e industrias.'}
        </p>
      </div>

      {/* Pilares de Calidad */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <FileCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Trazabilidad y Normativa</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Todos nuestros insumos farmacéuticos, reactivos y equipos cuentan con certificación de lote, vencimiento y calibración bajo estándares ISO y habilitaciones correspondientes.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
            <Microscope className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Asesoramiento Especializado</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Nuestro equipo técnico asiste a bioquímicos, farmacéuticos e investigadores en la selección del instrumental adecuado para cada protocolo analítico.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Garantía y Servicio Técnico</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Ofrecemos garantía oficial, provisión continua de consumibles compatibles y servicio de calibración y mantenimiento preventivo.
          </p>
        </div>
      </div>

      {/* Información de Sede Central y Despacho */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">Sede Comercial y Depósito Técnico</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Podés retirar tus pedidos de insumos en nuestra sede central o coordinar envíos refrigerados y estándar a todo el país.
          </p>

          <div className="space-y-4 text-xs text-slate-600">
            {storeInfo?.address && (
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-teal-600 shrink-0" />
                <span>{storeInfo.address}</span>
              </div>
            )}
            {storeInfo?.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-teal-600 shrink-0" />
                <span>{storeInfo.phone}</span>
              </div>
            )}
            {storeInfo?.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-teal-600 shrink-0" />
                <span>{storeInfo.email}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-teal-600 shrink-0" />
              <span>{hoursText}</span>
            </div>
          </div>
        </div>

        <div className="p-8 rounded-2xl bg-linear-to-br from-teal-50 to-cyan-50 border border-teal-100 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-700 text-white flex items-center justify-center shadow-lg shadow-teal-900/15">
            <FlaskConical className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-black text-base text-slate-900">{storeInfo?.name || 'UALab'}</h4>
            <p className="text-xs text-slate-600 mt-1 max-w-xs">
              Equipando laboratorios de análisis clínicos, farmacias magistrales y centros de I+D.
            </p>
          </div>
          <Link
            to="/contacto"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition"
          >
            <span>Solicitar Cotización Institucional</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
