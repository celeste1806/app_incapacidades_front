import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'transparent' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 16, background: 'transparent' }}>
        <Outlet />
      </main>
    </div>
  );
}


