import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { StoreInfoProvider } from './context/StoreInfoContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <StoreInfoProvider>
            <AppRoutes />
          </StoreInfoProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
