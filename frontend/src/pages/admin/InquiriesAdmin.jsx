import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import {
  Mail,
  Eye,
  Trash2,
  X,
  Loader2,
  AlertTriangle,
  User,
  Phone,
  Tag,
  Calendar,
  Layers,
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'todos', label: 'Todas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'read', label: 'Leídas' },
  { value: 'replied', label: 'Respondidas' },
];

const STATUS_LABELS = {
  pending: 'Pendiente',
  read: 'Leída',
  replied: 'Respondida',
};

export default function InquiriesAdmin() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('todos');

  // Modales
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [deleteConfirmInquiry, setDeleteConfirmInquiry] = useState(null);

  const { addToast } = useToast();

  const loadInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const url =
        filterStatus === 'todos'
          ? '/api/inquiries'
          : `/api/inquiries?status=${filterStatus}`;
      const data = await api.get(url);

      if (Array.isArray(data)) {
        setInquiries(data);
      } else if (data && Array.isArray(data.items)) {
        setInquiries(data.items);
      } else {
        setInquiries([]);
      }
    } catch {
      addToast('Error al cargar consultas', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, addToast]);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  const handleUpdateStatus = async (inquiryId, newStatus) => {
    try {
      await api.patch(`/api/inquiries/${inquiryId}/status`, { status: newStatus });
      addToast(`Consulta marcada como "${STATUS_LABELS[newStatus] || newStatus}"`, 'success');
      if (selectedInquiry && selectedInquiry.id === inquiryId) {
        setSelectedInquiry({ ...selectedInquiry, status: newStatus });
      }
      loadInquiries();
    } catch (err) {
      addToast(err.message || 'Error al cambiar estado', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmInquiry) return;
    try {
      await api.delete(`/api/inquiries/${deleteConfirmInquiry.id}`);
      addToast('Consulta eliminada correctamente', 'success');
      setDeleteConfirmInquiry(null);
      if (selectedInquiry?.id === deleteConfirmInquiry.id) {
        setSelectedInquiry(null);
      }
      loadInquiries();
    } catch (err) {
      addToast(err.message || 'Error al eliminar', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Consultas y Cotizaciones
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gestión y seguimiento de solicitudes técnicas enviadas desde la web de UALab.
          </p>
        </div>

        {/* Filtros por pestaña de estado */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs self-start sm:self-auto">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterStatus(opt.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterStatus === opt.value
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bandeja de Consultas */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            <span className="text-xs text-slate-500 mt-2">Cargando consultas...</span>
          </div>
        ) : inquiries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Remitente</th>
                  <th className="py-3 px-4">Asunto & Mensaje</th>
                  <th className="py-3 px-4">Insumo / Equipo Asociado</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {inquiries.map((inq) => (
                  <tr
                    key={inq.id}
                    className={`hover:bg-slate-50/50 transition ${
                      inq.status === 'pending' ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 space-y-0.5">
                      <span className="font-bold text-slate-800 block">{inq.name}</span>
                      <span className="text-[11px] text-slate-400 font-mono block">
                        {inq.email}
                      </span>
                      {inq.phone && (
                        <span className="text-[11px] text-slate-500 block">{inq.phone}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 max-w-sm space-y-1">
                      <span className="font-bold text-slate-800 block line-clamp-1">
                        {inq.subject}
                      </span>
                      <p className="text-slate-500 line-clamp-1">{inq.message}</p>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {inq.productName ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 border border-teal-100 text-[11px] font-semibold">
                            <Tag className="w-3 h-3 shrink-0" />
                            <span className="line-clamp-1">{inq.productName}</span>
                          </span>
                          {inq.variantName && (
                            <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono pl-1">
                              <Layers className="w-3 h-3 text-slate-400" />
                              {inq.variantName}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">General / Institucional</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={inq.status || 'pending'}
                        onChange={(e) => handleUpdateStatus(inq.id, e.target.value)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase focus:outline-hidden cursor-pointer ${
                          inq.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : inq.status === 'replied'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-teal-100 text-teal-800 border-teal-200'
                        }`}
                      >
                        <option value="pending">Pendiente</option>
                        <option value="read">Leída</option>
                        <option value="replied">Respondida</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => setSelectedInquiry(inq)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-slate-100 transition cursor-pointer"
                        title="Ver detalle del mensaje"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmInquiry(inq)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Eliminar consulta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-400">
            No se encontraron consultas en este estado.
          </div>
        )}
      </div>

      {/* Modal Detalle de Consulta */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-teal-600 tracking-wider">
                  Detalle de la Solicitud Técnica
                </span>
                <h3 className="font-bold text-slate-900 text-lg">{selectedInquiry.subject}</h3>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Datos del Cliente */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl text-xs border border-slate-100">
              <div className="flex items-center gap-2 text-slate-700">
                <User className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="font-semibold">{selectedInquiry.name}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Mail className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="truncate">{selectedInquiry.email}</span>
              </div>
              {selectedInquiry.phone && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>{selectedInquiry.phone}</span>
                </div>
              )}
              {selectedInquiry.createdAt && (
                <div className="flex items-center gap-2 text-slate-500">
                  <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>{new Date(selectedInquiry.createdAt).toLocaleDateString('es-AR')}</span>
                </div>
              )}
            </div>

            {/* Producto asociado si existe */}
            {selectedInquiry.productName && (
              <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-100 text-xs flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase text-teal-700 block">
                    Insumo / Equipo Consultado
                  </span>
                  <span className="font-bold text-slate-900">{selectedInquiry.productName}</span>
                  {selectedInquiry.variantName && (
                    <span className="block text-[11px] text-teal-800 mt-0.5">
                      Presentación: <strong>{selectedInquiry.variantName}</strong>
                    </span>
                  )}
                </div>
                {selectedInquiry.productSku && (
                  <span className="font-mono text-[10px] font-bold bg-white px-2.5 py-1 rounded border border-teal-200 text-slate-700">
                    SKU: {selectedInquiry.variantSku || selectedInquiry.productSku}
                  </span>
                )}
              </div>
            )}

            {/* Mensaje */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Mensaje del Profesional / Cliente:
              </span>
              <div className="p-4 rounded-2xl bg-slate-100 text-slate-700 text-xs leading-relaxed whitespace-pre-line">
                {selectedInquiry.message}
              </div>
            </div>

            {/* Cambiar Estado */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Estado:</span>
                <select
                  value={selectedInquiry.status || 'pending'}
                  onChange={(e) => handleUpdateStatus(selectedInquiry.id, e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-white cursor-pointer"
                >
                  <option value="pending">Pendiente</option>
                  <option value="read">Leída</option>
                  <option value="replied">Respondida</option>
                </select>
              </div>

              <button
                onClick={() => setSelectedInquiry(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Eliminación */}
      {deleteConfirmInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">¿Eliminar consulta?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Se eliminará el mensaje de {deleteConfirmInquiry.name}.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmInquiry(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-md transition cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
