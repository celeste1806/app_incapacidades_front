import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

// Es el layout para las rutas protegidas por AdminGuard
export default function AdminLayout() {
  return (
    <div className="admin-layout" style={{ display: 'flex', minHeight: '100vh', background: 'transparent' }}>
      <AdminSidebar />
      <main style={{ flex: 1, padding: 16, background: 'transparent' }}>
        <Outlet />
      </main>
    </div>
  );
}


