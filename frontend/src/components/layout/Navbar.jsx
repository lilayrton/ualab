import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStoreInfo } from '../../context/StoreInfoContext';
import { useToast } from '../../context/ToastContext';
import {
  Menu,
  X,
  Shield,
  LogOut,
  ChevronDown,
  Search,
  Phone,
  Clock,
  ShieldCheck,
  User,
} from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');
  const { user, isAdmin, logout } = useAuth();
  const { storeInfo } = useStoreInfo();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      addToast('Sesión cerrada correctamente', 'info');
      setUserMenuOpen(false);
      navigate('/');
    } catch {
      addToast('Error al cerrar sesión', 'error');
    }
  };

  const handleQuickSearch = (e) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      navigate(`/catalogo?q=${encodeURIComponent(quickSearch.trim())}`);
      setQuickSearch('');
      setMobileMenuOpen(false);
    } else {
      navigate('/catalogo');
    }
  };

  const navItemClass = ({ isActive }) =>
    `px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
      isActive
        ? 'text-teal-700 border-b-2 border-teal-700'
        : 'text-slate-600 hover:text-slate-950 border-b-2 border-transparent'
    }`;

  // Extraer el nombre de usuario o primera parte del email
  const userDisplayName = user?.email ? user.email.split('@')[0] : 'Usuario';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      {/* Barra Superior Institucional (Estilo OneLab) */}
      <div className="bg-slate-900 text-slate-300 text-[11px] py-1.5 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="tracking-wide">
              Distribuidora Científica & Farmacéutica Oficial · Certificaciones ISO 8655 / ANMAT
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-slate-300">
            {storeInfo?.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-teal-400" />
                <span>Atención técnica: <strong className="text-white font-mono">{storeInfo.phone}</strong></span>
              </span>
            )}
            {(storeInfo?.hours || storeInfo?.businessHours) && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-teal-400" />
                <span>{storeInfo.hours || storeInfo.businessHours}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Barra Principal de Navegación */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4 lg:gap-8">
          {/* Logo Limpio: solo el logo gráfico sin textos extra */}
          <Link to="/" className="shrink-0 flex items-center group py-2" title="UALab - Farmacia & Equipamiento">
            <img
              src="/ualab-logo.jpg"
              alt="UALab Farmacia & Equipamiento"
              className="h-12 sm:h-14 w-auto object-contain rounded-md group-hover:opacity-95 transition-opacity"
            />
          </Link>

          {/* Menú de Navegación en el Centro */}
          <nav className="hidden lg:flex items-center gap-2">
            <NavLink to="/" end className={navItemClass}>
              Inicio
            </NavLink>
            <NavLink to="/catalogo" className={navItemClass}>
              Catálogo
            </NavLink>
            <NavLink to="/nosotros" className={navItemClass}>
              Institucional
            </NavLink>
            <NavLink to="/contacto" className={navItemClass}>
              Cotizaciones
            </NavLink>
          </nav>

          {/* Lado Derecho: Buscador Compacto + Acceso de Usuario */}
          <div className="flex items-center gap-3 sm:gap-4 ml-auto">
            {/* Buscador Técnico ubicado a la derecha */}
            <form
              onSubmit={handleQuickSearch}
              className="hidden md:flex items-center relative w-56 lg:w-72"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder="Buscar equipo o SKU..."
                className="w-full pl-9 pr-16 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-slate-800 text-xs text-slate-900 placeholder:text-slate-400 transition focus:outline-hidden"
              />
              <button
                type="submit"
                className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold uppercase transition cursor-pointer"
              >
                Ir
              </button>
            </form>

            {/* Menú de Usuario Compacto */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-400 bg-white text-xs font-semibold text-slate-800 transition cursor-pointer shadow-2xs"
                  title={user.email}
                >
                  <div className="w-6 h-6 rounded-md bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-bold text-xs">
                    {userDisplayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[90px] truncate text-xs font-medium hidden sm:inline">
                    {userDisplayName}
                  </span>
                  {isAdmin && (
                    <span className="bg-slate-900 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase">
                      Admin
                    </span>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-20">
                      <div className="px-3 py-2 border-b border-slate-100">
                        <p className="text-[10px] text-slate-400 font-mono">Conectado como</p>
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {user.email}
                        </p>
                      </div>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-teal-800 hover:bg-teal-50 font-bold transition"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          Panel Admin
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 font-bold transition text-left cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Cerrar Sesión
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 transition"
                >
                  Ingresar
                </Link>
                <Link
                  to="/registro"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition shadow-xs"
                >
                  Registrarse
                </Link>
              </div>
            )}

            {/* Botón Menú Mobile */}
            <div className="flex items-center lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-hidden"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Menú Mobile */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <form onSubmit={handleQuickSearch} className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              placeholder="Buscar insumo o código SKU..."
              className="w-full pl-10 pr-20 py-2 rounded-lg border border-slate-300 text-xs focus:outline-hidden"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 rounded bg-slate-900 text-white text-xs font-bold"
            >
              Buscar
            </button>
          </form>

          <NavLink
            to="/"
            end
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded"
          >
            Inicio
          </NavLink>
          <NavLink
            to="/catalogo"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded"
          >
            Catálogo
          </NavLink>
          <NavLink
            to="/nosotros"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded"
          >
            Institucional
          </NavLink>
          <NavLink
            to="/contacto"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded"
          >
            Cotizaciones
          </NavLink>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {user ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-center py-2 rounded-lg bg-teal-50 text-teal-800 text-xs font-bold"
                  >
                    Panel Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-center py-2 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 rounded-lg border border-slate-200 text-slate-800 text-xs font-bold"
                >
                  Ingresar
                </Link>
                <Link
                  to="/registro"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 rounded-lg bg-slate-900 text-white text-xs font-bold"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
