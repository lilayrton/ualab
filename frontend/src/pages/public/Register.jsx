import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api/client';
import { UserPlus, Mail, Lock, User, Phone, Loader2, ArrowRight } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!formData.firstName.trim()) errs.firstName = 'El nombre es obligatorio';
    if (!formData.lastName.trim()) errs.lastName = 'El apellido es obligatorio';
    if (!formData.email.trim()) {
      errs.email = 'El correo electrónico es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Ingresá un correo electrónico válido';
    }
    if (!formData.phone.trim()) {
      errs.phone = 'El teléfono es obligatorio';
    }
    if (!formData.password) {
      errs.password = 'La contraseña es obligatoria';
    } else if (formData.password.length < 6) {
      errs.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // 1. Registro de la cuenta en auth
      const authRes = await register(formData.email, formData.password);

      // 2. Guardar perfil con datos personales (TPO: Nombre, Apellido, Teléfono)
      try {
        await api.post('/api/profile', {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone.trim(),
          isCompany: false,
          dni: '11111111',
        });
      } catch {
        // Perfil completable luego
      }

      addToast('¡Cuenta creada con éxito!', 'success');
      if (authRes?.user?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      addToast(err.message || 'Error al registrarse. El correo podría estar en uso.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-2">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Crear una Cuenta</h1>
          <p className="text-xs text-slate-500">
            Registrate para acceder a la cotización de insumos y equipamiento UALab
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nombre *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Juan"
                  className={`w-full pl-10 pr-3 py-2 rounded-xl border text-sm transition focus:outline-hidden focus:ring-2 ${
                    errors.firstName
                      ? 'border-rose-300 focus:ring-rose-100 bg-rose-50/20'
                      : 'border-slate-200 focus:border-teal-600 focus:ring-teal-100'
                  }`}
                />
              </div>
              {errors.firstName && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Apellido *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Pérez"
                className={`w-full px-3.5 py-2 rounded-xl border text-sm transition focus:outline-hidden focus:ring-2 ${
                  errors.lastName
                    ? 'border-rose-300 focus:ring-rose-100 bg-rose-50/20'
                    : 'border-slate-200 focus:border-teal-600 focus:ring-teal-100'
                }`}
              />
              {errors.lastName && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Correo Electrónico *
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="tu@email.com"
                className={`w-full pl-10 pr-4 py-2 rounded-xl border text-sm transition focus:outline-hidden focus:ring-2 ${
                  errors.email
                    ? 'border-rose-300 focus:ring-rose-100 bg-rose-50/20'
                    : 'border-slate-200 focus:border-teal-600 focus:ring-teal-100'
                }`}
              />
            </div>
            {errors.email && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Teléfono *
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="11 5555 1234"
                className={`w-full pl-10 pr-4 py-2 rounded-xl border text-sm transition focus:outline-hidden focus:ring-2 ${
                  errors.phone
                    ? 'border-rose-300 focus:ring-rose-100 bg-rose-50/20'
                    : 'border-slate-200 focus:border-teal-600 focus:ring-teal-100'
                }`}
              />
            </div>
            {errors.phone && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.phone}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Contraseña *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  className={`w-full pl-10 pr-3 py-2 rounded-xl border text-sm transition focus:outline-hidden focus:ring-2 ${
                    errors.password
                      ? 'border-rose-300 focus:ring-rose-100 bg-rose-50/20'
                      : 'border-slate-200 focus:border-teal-600 focus:ring-teal-100'
                  }`}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Confirmar Contraseña *
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Repetir contraseña"
                className={`w-full px-3.5 py-2 rounded-xl border text-sm transition focus:outline-hidden focus:ring-2 ${
                  errors.confirmPassword
                    ? 'border-rose-300 focus:ring-rose-100 bg-rose-50/20'
                    : 'border-slate-200 focus:border-teal-600 focus:ring-teal-100'
                }`}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-900/10 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registrando...</span>
                </>
              ) : (
                <>
                  <span>Crear Cuenta</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="font-bold text-teal-600 hover:text-teal-800">
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
