import React, { useState, useEffect } from 'react';
import { getAllUsers, changeUserStatus, changeUserRole } from '../../services/users';
import '../../styles/admin-parametros.css';
import '../../styles/admin-usuarios.css';
import '../../styles/admin-pages-blue.css';

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cambiandoEstado, setCambiandoEstado] = useState({});
  const [cambiandoRol, setCambiandoRol] = useState({});

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAllUsers(0, 1000);
      const normalizados = (Array.isArray(data) ? data : []).map(u => ({
        ...u,
        rol_id: u.rol_id ?? u.rol ?? u.id_rol ?? u.role_id ?? u.role
      }));
      setUsuarios(normalizados);
    } catch (e) {
      setError(e.message || 'Error cargando usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarEstado = async (usuarioId, nuevoEstado) => {
    try {
      setCambiandoEstado(prev => ({ ...prev, [usuarioId]: true }));
      await changeUserStatus(usuarioId, nuevoEstado);
      
      // Actualizar el estado local
      setUsuarios(prev => prev.map(usuario => 
        usuario.id_usuario === usuarioId 
          ? { ...usuario, estado: nuevoEstado }
          : usuario
      ));
      
      alert(`Usuario ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`);
    } catch (e) {
      alert('Error al cambiar estado: ' + e.message);
    } finally {
      setCambiandoEstado(prev => ({ ...prev, [usuarioId]: false }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRolNombre = (rolId) => {
    if (Number(rolId) === 10) return 'Administrador';
    if (Number(rolId) === 9) return 'Empleado';
    return `Rol ${rolId}`;
  };

  const getEstadoBadge = (estado) => {
    if (estado) {
      return <span className="badge badge-success">Activo</span>;
    } else {
      return <span className="badge badge-danger">Inactivo</span>;
    }
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="admin-header">
          <h1>👥 Gestión de Usuarios</h1>
        </div>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-container">
        <div className="admin-header">
          <h1>👥 Gestión de Usuarios</h1>
        </div>
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={loadUsuarios} className="btn btn-primary">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-pages-container">
      <h1 className="admin-pages-title">GESTIÓN DE USUARIOS</h1>
      <div className="admin-pages-content" style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto', marginLeft: -80 }}>
        {error && <div className="admin-error"><h1>GESTIÓN DE USUARIOS</h1><p>{error}</p></div>}
        
          <div className="admin-filter-container" />
        
        {loading ? (
            <div className="admin-loading" style={{ textAlign: 'center' }}>
            <h1>GESTIÓN DE USUARIOS</h1>
            <p>Cargando usuarios...</p>
          </div>
        ) : (
            <table className="admin-table" style={{ width: '100%' }}>
            <thead>
              <tr>
            
                <th style={{ minWidth: 220 }}>Nombre</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Cargo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={7} className="muted" style={{ padding: 16, textAlign: 'center' }}>
                    No hay usuarios registrados
                  </td>
                </tr>
              )}
              {usuarios.map(usuario => (
                <tr key={usuario.id_usuario}>
               
                  <td style={{ minWidth: 220 }}>{usuario.nombre || 'N/A'}</td>
                  <td>{usuario.correo_electronico || 'N/A'}</td>
                  <td>{usuario.telefono || 'N/A'}</td>
                  <td>{usuario.cargo_interno || 'N/A'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {(() => {
                        const rolVal = (usuario.rol_id ?? usuario.rol ?? usuario.id_rol ?? usuario.role_id ?? usuario.role);
                      return (
                          <span className={`admin-status admin-status-${Number(rolVal) === 10 ? 'admin' : 'employee'}`}>
                            {getRolNombre(rolVal)}
                        </span>
                      );
                    })()}
                      <div style={{ display: 'flex', gap: 6, marginLeft: 6 }}>
                        <button
                          className="admin-btn admin-btn-secondary"
                          onClick={async () => {
                            const nuevoRol = 9;
                            try {
                              setCambiandoRol(prev => ({ ...prev, [usuario.id_usuario]: true }));
                              await changeUserRole(usuario.id_usuario, nuevoRol);
                              setUsuarios(prev => prev.map(u => u.id_usuario === usuario.id_usuario ? { ...u, rol_id: nuevoRol } : u));
                            } catch (err) {
                              alert('Error al cambiar rol: ' + (err?.message || ''));
                            } finally {
                              setCambiandoRol(prev => ({ ...prev, [usuario.id_usuario]: false }));
                            }
                          }}
                          disabled={!!cambiandoRol[usuario.id_usuario] || Number(usuario.rol_id) === 9}
                          title="Convertir a Empleado"
                        >
                          Empleado
                        </button>
                        <button
                          className="admin-btn admin-btn-primary"
                          onClick={async () => {
                            const nuevoRol = 10;
                            try {
                              setCambiandoRol(prev => ({ ...prev, [usuario.id_usuario]: true }));
                              await changeUserRole(usuario.id_usuario, nuevoRol);
                              setUsuarios(prev => prev.map(u => u.id_usuario === usuario.id_usuario ? { ...u, rol_id: nuevoRol } : u));
                            } catch (err) {
                              alert('Error al cambiar rol: ' + (err?.message || ''));
                            } finally {
                              setCambiandoRol(prev => ({ ...prev, [usuario.id_usuario]: false }));
                            }
                          }}
                          disabled={!!cambiandoRol[usuario.id_usuario] || Number(usuario.rol_id) === 10}
                          title="Convertir a Administrador"
                        >
                          Admin
                        </button>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`admin-status admin-status-${usuario.estado ? 'active' : 'inactive'}`}>
                      {usuario.estado ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="admin-action-buttons">
                      {usuario.estado ? (
                        <button
                          className="admin-btn admin-btn-danger"
                          onClick={() => handleCambiarEstado(usuario.id_usuario, false)}
                          disabled={cambiandoEstado[usuario.id_usuario]}
                        >
                          {cambiandoEstado[usuario.id_usuario] ? 'Desactivando...' : 'Desactivar'}
                        </button>
                      ) : (
                        <button
                          className="admin-btn admin-btn-success"
                          onClick={() => handleCambiarEstado(usuario.id_usuario, true)}
                          disabled={cambiandoEstado[usuario.id_usuario]}
                        >
                          {cambiandoEstado[usuario.id_usuario] ? 'Activando...' : 'Activar'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        </div>
      </div>
    </div>
  );
}
