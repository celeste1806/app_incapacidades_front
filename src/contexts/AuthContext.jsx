import React, { createContext, useContext, useState, useEffect } from 'react';
import { postLogin, postLogout as apiLogout, refreshToken as apiRefresh, getCurrentUser } from '../services/auth';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(() => {
    try {
      return localStorage.getItem('accessToken') || null;
    } catch (_) {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Verificar si hay sesión activa al cargar la app
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    // Solo verificar si hay token disponible
    if (!accessToken) {
      setLoading(false);
      return;
    }
    
    try {
      const data = await getCurrentUser();
      setUser(data.user);
      setAccessToken(data.accessToken);
      try { localStorage.setItem('accessToken', data.accessToken || ''); } catch (_) {}
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      setUser(null);
      setAccessToken(null);
      try { localStorage.removeItem('accessToken'); } catch (_) {}
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const data = await postLogin(credentials);
      setUser(data.user);
      setAccessToken(data.accessToken);
      try { localStorage.setItem('accessToken', data.accessToken || ''); } catch (_) {}
      // Debug: verificar almacenamiento del token
      try {
        // Muestra el token recibido y el que quedó en localStorage
        // Nota: evita dejar logs sensibles en producción
        // eslint-disable-next-line no-console
        console.log('AccessToken recibido:', data.accessToken);
        // eslint-disable-next-line no-console
        console.log('AccessToken en localStorage:', localStorage.getItem('accessToken'));
      } catch (_) {}
      
      return data;
    } catch (error) {
      throw error;
    }
  };

  const reloadUser = async () => {
    try {
      const data = await getCurrentUser();
      setUser(data.user);
      if (data.accessToken) {
        setAccessToken(data.accessToken);
        try { localStorage.setItem('accessToken', data.accessToken || ''); } catch (_) {}
      }
    } catch (error) {
      console.error('Error recargando usuario:', error);
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      // Limpiar estado local independientemente del resultado del servidor
      setUser(null);
      setAccessToken(null);
      try { localStorage.removeItem('accessToken'); } catch (_) {}
    }
  };

  const refreshAccessToken = async () => {
    try {
      const data = await apiRefresh();
      setAccessToken(data.accessToken);
      try { localStorage.setItem('accessToken', data.accessToken || ''); } catch (_) {}
      return data.accessToken;
    } catch (error) {
      // Si falla el refresh, hacer logout
      await logout();
      throw error;
    }
  };

  const getAuthHeaders = () => {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    
    return headers;
  };

  const value = {
    user,
    accessToken,
    loading,
    login,
    logout,
    refreshAccessToken,
    getAuthHeaders,
    reloadUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
