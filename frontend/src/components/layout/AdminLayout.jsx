import React, { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStoreInfo } from '../../context/StoreInfoContext';
import { useToast } from '../../context/ToastContext';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Mail,
  Store,
  User,
  LogOut,
  ExternalLink,
  Menu,
  X,
  FlaskConical,
} from 'lucide-react';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { storeInfo } = useStoreInfo();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      addToast('Sesión cerrada correctamente', 'info');
      navigate('/login');
    } catch {
      addToast('Error al cerrar sesión', 'error');
    }
  };

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
    { name: 'Catálogo de Insumos', path: '/admin/productos', icon: Package },
    { name: 'Líneas y Rubros', path: '/admin/categorias', icon: FolderTree },
    { name: 'Consultas Técnicas', path: '/admin/consultas', icon: Mail },
    { name: 'Datos Institucionales', path: '/admin/tienda', icon: Store },
    { name: 'Mi Perfil & Seguridad', path: '/admin/perfil', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Mobile Header Bar */}
      <div className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <FlaskConical className="w-6 h-6 text-teal-400" />
          <span className="font-bold text-base">UALab Gestión</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay para Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Lateral */}
      <aside
        className={`fixed md:sticky top-0 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col z-50 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Cabecera Sidebar */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-600 flex items-center justify-center text-white shadow-md shadow-teal-950 font-bold">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h2 className="font-bold text-white text-sm truncate">
                {storeInfo?.name || 'UALab Administración'}
              </h2>
              <span className="text-[11px] text-teal-400 font-medium">Panel de Gestión</span>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-teal-600 text-white font-semibold shadow-md shadow-teal-950/40'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Enlace al Sitio Público y Perfil de Usuario */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <span className="flex items-center gap-2">
              <Store className="w-4 h-4 text-teal-400" />
              Ver Catálogo Público
            </span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-xs text-white font-medium truncate">{user?.email}</p>
              <span className="text-[10px] text-emerald-400 uppercase font-semibold">
                Administrador
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar Sesión"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Área Principal de Contenido */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
