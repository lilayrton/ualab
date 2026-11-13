import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import {
  Package,
  FolderTree,
  Mail,
  Clock,
  ArrowRight,
  Plus,
  FlaskConical,
} from 'lucide-react';

const STATUS_LABELS = {
  pending: 'Pendiente',
  read: 'Leída',
  replied: 'Respondida',
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    productsCount: 0,
    categoriesCount: 0,
    inquiries: { total: 0, pending: 0, read: 0, replied: 0 },
  });
  const [recentInquiries, setRecentInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [productsRes, categoriesRes, inquiryStatsRes, inquiriesListRes] =
          await Promise.allSettled([
            api.get('/api/products'),
            api.get('/api/categories'),
            api.get('/api/inquiries/stats'),
            api.get('/api/inquiries?limit=5'),
          ]);

        const pCount =
          productsRes.status === 'fulfilled' && Array.isArray(productsRes.value)
            ? productsRes.value.length
            : 0;

        const cCount =
          categoriesRes.status === 'fulfilled' && Array.isArray(categoriesRes.value)
            ? categoriesRes.value.length
            : 0;

        const inqStats =
          inquiryStatsRes.status === 'fulfilled' && inquiryStatsRes.value
            ? inquiryStatsRes.value
            : { total: 0, pending: 0, read: 0, replied: 0 };

        const inqList =
          inquiriesListRes.status === 'fulfilled' && Array.isArray(inquiriesListRes.value)
            ? inquiriesListRes.value.slice(0, 5)
            : inquiriesListRes.status === 'fulfilled' && inquiriesListRes.value?.items
            ? inquiriesListRes.value.items.slice(0, 5)
            : [];

        setStats({
          productsCount: pCount,
          categoriesCount: cCount,
          inquiries: inqStats,
        });
        setRecentInquiries(inqList);
      } catch (err) {
        console.error('Error cargando métricas de dashboard', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Panel de Gestión UALab
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Métricas en tiempo real del vademécum de insumos, categorías y cotizaciones recibidas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/productos"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/15 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Insumo / Equipo</span>
          </Link>
        </div>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Insumos y Equipos
            </span>
            <span className="text-3xl font-black text-slate-900 mt-1 block">
              {loading ? '...' : stats.productsCount}
            </span>
            <span className="text-[11px] text-teal-700 font-semibold mt-1 block">
              Catálogo activo (&ge; 20 req.)
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Especialidades
            </span>
            <span className="text-3xl font-black text-slate-900 mt-1 block">
              {loading ? '...' : stats.categoriesCount}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
              Árbol jerárquico
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
            <FolderTree className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Cotizaciones Pendientes
            </span>
            <span className="text-3xl font-black text-amber-600 mt-1 block">
              {loading ? '...' : stats.inquiries.pending ?? stats.inquiries.pendiente ?? 0}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Sin responder aún
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Consultas Totales
            </span>
            <span className="text-3xl font-black text-slate-900 mt-1 block">
              {loading ? '...' : stats.inquiries.total ?? 0}
            </span>
            <span className="text-[11px] text-teal-600 font-semibold mt-1 block">
              {stats.inquiries.replied ?? stats.inquiries.respondida ?? 0} respondidas
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Mail className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Consultas Recientes & Accesos Rápidos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Últimas Solicitudes y Consultas</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Pedidos de cotización recibidos desde laboratorios y farmacias
              </p>
            </div>
            <Link
              to="/admin/consultas"
              className="text-xs font-bold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1"
            >
              <span>Ver bandeja</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentInquiries.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {recentInquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800">{inq.name}</span>
                      <span className="text-xs text-slate-400 font-mono">({inq.email})</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700">{inq.subject}</p>
                    <p className="text-xs text-slate-500 line-clamp-1">{inq.message}</p>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase shrink-0 ${
                      inq.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : inq.status === 'replied'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-sky-100 text-sky-800'
                    }`}
                  >
                    {STATUS_LABELS[inq.status] || inq.status || 'Pendiente'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              No hay consultas registradas aún.
            </div>
          )}
        </div>

        {/* Acciones Rápidas */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Gestión de Laboratorio</h2>
          <p className="text-xs text-slate-400">Accesos directos a los módulos de administración</p>

          <div className="space-y-2.5 pt-2">
            <Link
              to="/admin/productos"
              className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition">
                  <Package className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-xs text-slate-800 block">
                    ABM de Insumos y Equipos
                  </span>
                  <span className="text-[11px] text-slate-400">Crear, editar o pausar stock</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition" />
            </Link>

            <Link
              to="/admin/categorias"
              className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition">
                  <FolderTree className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-xs text-slate-800 block">Especialidades</span>
                  <span className="text-[11px] text-slate-400">Organizar árbol de rubros</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 transition" />
            </Link>

            <Link
              to="/admin/tienda"
              className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-xs text-slate-800 block">
                    Datos Institucionales
                  </span>
                  <span className="text-[11px] text-slate-400">Horarios, dirección y logo</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
