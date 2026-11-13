import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from '../components/layout/PublicLayout';
import AdminLayout from '../components/layout/AdminLayout';
import ProtectedRoute from './ProtectedRoute';

// Páginas Públicas
import Home from '../pages/public/Home';
import Catalog from '../pages/public/Catalog';
import ProductDetail from '../pages/public/ProductDetail';
import Contact from '../pages/public/Contact';
import About from '../pages/public/About';
import Login from '../pages/public/Login';
import Register from '../pages/public/Register';
import ForgotPassword from '../pages/public/ForgotPassword';
import ResetPassword from '../pages/public/ResetPassword';

// Páginas de Administración
import Dashboard from '../pages/admin/Dashboard';
import ProductsAdmin from '../pages/admin/ProductsAdmin';
import CategoriesAdmin from '../pages/admin/CategoriesAdmin';
import InquiriesAdmin from '../pages/admin/InquiriesAdmin';
import StoreInfoAdmin from '../pages/admin/StoreInfoAdmin';
import ProfileAdmin from '../pages/admin/ProfileAdmin';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Rutas Públicas para Visitantes */}
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="catalogo" element={<Catalog />} />
        <Route path="productos/:id" element={<ProductDetail />} />
        <Route path="contacto" element={<Contact />} />
        <Route path="nosotros" element={<About />} />
        <Route path="login" element={<Login />} />
        <Route path="registro" element={<Register />} />
        <Route path="olvide-clave" element={<ForgotPassword />} />
        <Route path="restablecer-clave" element={<ResetPassword />} />
      </Route>

      {/* Rutas Privadas del Panel de Administración */}
      <Route
        path="admin"
        element={
          <ProtectedRoute adminOnly={true}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="productos" element={<ProductsAdmin />} />
        <Route path="categorias" element={<CategoriesAdmin />} />
        <Route path="consultas" element={<InquiriesAdmin />} />
        <Route path="tienda" element={<StoreInfoAdmin />} />
        <Route path="perfil" element={<ProfileAdmin />} />
      </Route>

      {/* Redirección 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

