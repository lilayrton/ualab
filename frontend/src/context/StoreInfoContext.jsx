import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const StoreInfoContext = createContext(null);

export function StoreInfoProvider({ children }) {
  const [storeInfo, setStoreInfo] = useState({
    name: 'UALab Insumos Farmacéuticos & Laboratorio',
    description:
      'Distribuidora integral de equipamiento científico, instrumental analítico, reactivos e insumos farmacéuticos para laboratorios, farmacias, clínicas y centros de investigación.',
    address: 'Lima 757, Ciudad Autónoma de Buenos Aires',
    phone: '0800-122-8233',
    email: 'contacto@uade.edu.ar',
    whatsapp: '+54 9 11 7662-5199',
    hours: 'Lunes a Viernes de 8:30 a 19:00 hs | Sábados de 9:00 a 13:00 hs',
    logo: '',
    social: {
      facebook: 'https://www.facebook.com/UADEOficial',
      instagram: 'https://www.instagram.com/uadeoficial',
      twitter: 'https://x.com/UADEoficial',
      linkedin: 'https://www.linkedin.com/school/uade/',
    },
  });
  const [loading, setLoading] = useState(true);

  const fetchStoreInfo = async () => {
    try {
      const data = await api.get('/api/store-info');
      if (data) {
        setStoreInfo((prev) => ({
          ...prev,
          ...data,
          social: {
            ...prev.social,
            ...(data.social || {}),
          },
        }));
      }
    } catch {
      // Fallback a los valores por defecto
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreInfo();
  }, []);

  return (
    <StoreInfoContext.Provider value={{ storeInfo, setStoreInfo, fetchStoreInfo, loading }}>
      {children}
    </StoreInfoContext.Provider>
  );
}

export function useStoreInfo() {
  const context = useContext(StoreInfoContext);
  if (!context) {
    throw new Error('useStoreInfo debe ser utilizado dentro de StoreInfoProvider');
  }
  return context;
}
