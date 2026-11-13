import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { User, Lock, Save, KeyRound, Loader2, ShieldCheck } from 'lucide-react';

export default function ProfileAdmin() {
  const { user } = useAuth();
  const { addToast } = useToast();

  // Estado del Perfil
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dni: '',
    isCompany: false,
    cuit: '',
    companyName: '',
  });
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  // Estado de Cambio de Contraseña
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await api.get('/api/profile');
        if (data) {
          setProfileData({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            phone: data.phone || '',
            dni: data.dni || '',
            isCompany: Boolean(data.isCompany),
            cuit: data.cuit || '',
            companyName: data.companyName || '',
          });
          setHasExistingProfile(true);
        }
      } catch {
        setHasExistingProfile(false);
      } finally {
        setProfileLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileData.firstName.trim() || !profileData.lastName.trim()) {
      addToast('Nombre y apellido son obligatorios', 'error');
      return;
    }

    setSavingProfile(true);
    try {
      const payload = {
        firstName: profileData.firstName.trim(),
        lastName: profileData.lastName.trim(),
        phone: profileData.phone.trim() || undefined,
        isCompany: profileData.isCompany,
        dni: !profileData.isCompany ? profileData.dni.trim() || '11111111' : undefined,
        cuit: profileData.isCompany ? profileData.cuit.trim() : undefined,
        companyName: profileData.isCompany ? profileData.companyName.trim() : undefined,
      };

      if (hasExistingProfile) {
        await api.put('/api/profile', payload);
      } else {
        await api.post('/api/profile', payload);
        setHasExistingProfile(true);
      }
      addToast('Datos personales del profesional actualizados con éxito', 'success');
    } catch (err) {
      addToast(err.message || 'Error al actualizar el perfil', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordData.currentPassword) {
      addToast('Ingresá tu contraseña actual', 'error');
      return;
    }
    if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
      addToast('La nueva contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      addToast('Las nuevas contraseñas no coinciden', 'error');
      return;
    }

    setChangingPassword(true);
    try {
      await api.post('/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      addToast('Contraseña de acceso actualizada con éxito', 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      addToast(err.message || 'Error al cambiar contraseña', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Mi Perfil & Seguridad
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Actualizá tus datos de administrador responsable y administrá tu clave de acceso a UALab.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Formulario Datos Personales */}
        <form
          onSubmit={handleProfileSubmit}
          className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Datos Personales y Profesionales</h2>
              <p className="text-xs text-slate-400">Información asociada a tu cuenta ({user?.email})</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nombre *
              </label>
              <input
                type="text"
                value={profileData.firstName}
                onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                placeholder="Juan"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 text-sm focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Apellido *
              </label>
              <input
                type="text"
                value={profileData.lastName}
                onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                placeholder="Pérez"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 text-sm focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Teléfono de Contacto
              </label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                placeholder="+54 11 5555 1234"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 text-sm focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                DNI / Documento Profesional
              </label>
              <input
                type="text"
                value={profileData.dni}
                onChange={(e) => setProfileData({ ...profileData, dni: e.target.value })}
                placeholder="35000111"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 text-sm focus:outline-hidden"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-900/10 transition disabled:opacity-50 cursor-pointer"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Datos</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Formulario Cambio de Contraseña */}
        <form
          onSubmit={handlePasswordSubmit}
          className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Seguridad & Contraseña</h2>
              <p className="text-xs text-slate-400">Actualizá tu clave para mantener tu cuenta protegida</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Contraseña Actual *
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 text-sm focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nueva Contraseña *
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 text-sm focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirmar Nueva Contraseña *
                </label>
                <input
                  type="password"
                  value={passwordData.confirmNewPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })
                  }
                  placeholder="Repetir nueva clave"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 text-sm focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={changingPassword}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-teal-600 text-white font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {changingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Actualizando...</span>
                </>
              ) : (
                <span>Actualizar Contraseña</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
