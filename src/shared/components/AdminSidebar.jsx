import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/admin-sidebar.css';

export default function AdminSidebar() {
  const { logout, isAuthenticated, user } = useAuth();
  const [showGestion, setShowGestion] = useState(false);
  const [showIncapacidades, setShowIncapacidades] = useState(false);
  const [showRegistro, setShowRegistro] = useState(false);
  const navigate = useNavigate();
  // Ruta fija proporcionada: public/logo-umit.png
  // eliminado array duplicado de logos

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
          <h3 className="admin-sidebar__title" style={{ margin: 0, width: '100%', textAlign: 'center', fontSize: 22 }}>Admin</h3>
          {isAuthenticated && (
            <div style={{ width: '100%', textAlign: 'center', fontWeight: 700, fontSize: 18, color: '#ffffff', marginTop: 20 }}>
              {user?.nombre || user?.correo_electronico}
            </div>
          )}
        </div>
      </div>
      <nav className="admin-sidebar__nav">
        <NavLink to="/admin/inicio" className={linkClass}>Inicio</NavLink>
        <NavLink to="/admin" className={linkClass} end>Perfil</NavLink>
        <button
          type="button"
          className={linkClass({ isActive: false })}
          onClick={() => setShowGestion(v => !v)}
          aria-expanded={showGestion}
          aria-controls="submenu-gestion"
          style={{ textAlign: 'left', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          Gestión
          <span style={{ float: 'right' }}>{showGestion ? '▾' : '▸'}</span>
        </button>
        {showGestion && (
          <div id="submenu-gestion" style={{ paddingLeft: 16 }}>
            <NavLink to="/admin/parametros" className={linkClass}>Parametros</NavLink>
            <NavLink to="/admin/tipos-incapacidad" className={linkClass}>Tipos de incapacidad</NavLink>
            <NavLink to="/admin/archivos" className={linkClass}>Archivos</NavLink>
            <NavLink to="/admin/relacion" className={linkClass}>Relación</NavLink>
          </div>
        )}
        <button
          type="button"
          className={linkClass({ isActive: false })}
          onClick={() => setShowIncapacidades(v => !v)}
          aria-expanded={showIncapacidades}
          aria-controls="submenu-incapacidades"
          style={{ textAlign: 'left', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          Incapacidades
          <span style={{ float: 'right' }}>{showIncapacidades ? '▾' : '▸'}</span>
        </button>
        {showIncapacidades && (
          <div id="submenu-incapacidades" style={{ paddingLeft: 16 }}>
            <NavLink to="/admin/incapacidades-Nuevas" className={linkClass}>Incapacidades Nuevas</NavLink>
            <NavLink to="/admin/incapacidades-rechazadas" className={linkClass}>Incapacidades Rechazadas</NavLink>
            <NavLink to="/admin/incapacidades-tramite-de-eps" className={linkClass}>Trámite de EPS</NavLink>
          </div>
        )}
        {/* Rutas eliminadas: no-pagas y pagas. 'Incapacidades rechazadas' quedó dentro del submenú */}
        <NavLink to="/admin/incapacidades-historial" className={linkClass}>Historial de incapacidades</NavLink>
        <NavLink to="/admin/estadisticas-incapacidades" className={linkClass}>📊 Estadísticas</NavLink>
        <NavLink to="/admin/usuarios" className={linkClass}>Usuarios</NavLink>
        <NavLink to="/admin/crear-usuarios" className={linkClass}>Crear usuarios</NavLink>
        <button
          type="button"
          className={linkClass({ isActive: false })}
          onClick={() => setShowRegistro(v => !v)}
          aria-expanded={showRegistro}
          aria-controls="submenu-registro"
          style={{ textAlign: 'left', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          Registro
          <span style={{ float: 'right' }}>{showRegistro ? '▾' : '▸'}</span>
        </button>
        {showRegistro && (
          <div id="submenu-registro" style={{ paddingLeft: 16 }}>
            <NavLink to="/admin/registrar-incapacidad" className={linkClass}>Registrar incapacidad</NavLink>
            <NavLink to="/admin/mis-incapacidades-rechazadas" className={linkClass}>Mis incapacidades rechazadas</NavLink>
            <NavLink to="/admin/historial-mis-incapacidades" className={linkClass}>Mi historial de incapacidades</NavLink>
            <NavLink to="/admin/descargas" className={linkClass}>Descargas</NavLink>
          </div>
        )}
      </nav>
      {isAuthenticated && (
        <div className="admin-sidebar__logout">
          <button onClick={onLogout} className="admin-sidebar__logoutBtn">Cerrar sesión</button>
        </div>
      )}
    </aside>
  );
}


