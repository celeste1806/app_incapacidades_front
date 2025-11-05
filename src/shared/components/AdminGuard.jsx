import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Guard de administrador basado en rol_id del backend
export default function AdminGuard() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  const rolId = Number(user?.rol_id ?? user?.rol ?? 0);
  const isAdmin = isAuthenticated && rolId === 10;

  if (!isAdmin) {
    return <Navigate to="/inicio" state={{ from: location }} replace />;
  }

  return <Outlet />;
}


