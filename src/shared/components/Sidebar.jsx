import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/admin-sidebar.css';

export default function Sidebar() {
  const { logout, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const linkClass = ({ isActive }) => `admin-sidebar__link${isActive ? ' is-active' : ''}`;

  async function onLogout() {
    try { await logout(); } finally { navigate('/login'); }
  }

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__header">
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', minHeight: 64, flexDirection: 'column', gap: 4 }}>
          <div style={{ position: 'absolute', left: 0, top: 0, background: '#ffffff', padding: 4, borderRadius: 6, boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>
            <img src={process.env.PUBLIC_URL + '/logo-umit.png'} alt="UMIT" style={{ height: 44, width: 'auto', display: 'block' }} />
          </div>
          <h3 className="admin-sidebar__title" style={{ margin: 0, width: '100%', textAlign: 'center', fontSize: 22 }}>Bienvenido</h3>
          {isAuthenticated && (
            <div style={{ width: '100%', textAlign: 'center', fontWeight: 700, fontSize: 16, color: '#ffffff', marginTop: 20 }}>
              {user?.nombre || user?.correo_electronico}
            </div>
          )}
        </div>
      </div>
      <nav className="admin-sidebar__nav">
        <NavLink to="/inicio" className={linkClass} end>Inicio</NavLink>
        <NavLink to="/perfil" className={linkClass}>Perfil</NavLink>
        <NavLink to="/incapacidades" className={linkClass}>Incapacidades</NavLink>
        <NavLink to="/historial" className={linkClass}>Historial de incapacidades</NavLink>
        <NavLink to="/incapacidades-rechazadas" className={linkClass}>Incapacidades rechazadas</NavLink>
        <NavLink to="/descargas" className={linkClass}>Descargas</NavLink>
      </nav>
      {isAuthenticated && (
        <div className="admin-sidebar__logout">
          <button onClick={onLogout} className="admin-sidebar__logoutBtn">Cerrar sesión</button>
        </div>
      )}
    </aside>
  );
}


