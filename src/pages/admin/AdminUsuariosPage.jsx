import React, { useState, useEffect } from 'react';
import { getAllUsers, changeUserStatus, changeUserRole, updateUserAdmin } from '../../services/users';
import { getParametrosHijosByPapa } from '../../services/parametros';
import '../../styles/admin-parametros.css';
import '../../styles/admin-usuarios.css';
import '../../styles/admin-pages-blue.css';
import Modal from '../../shared/components/Modal';

const normalizeRolId = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase();
    if (trimmed === 'administrador' || trimmed === 'admin') return 10;
    if (trimmed === 'empleado' || trimmed === 'employee') return 9;
    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? null : parsed;
  }
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

const getRolNombreNormalizado = (rolVal) => {
  switch (rolVal) {
    case 10:
      return 'Administrador';
    case 9:
      return 'Empleado';
    default:
      return rolVal != null ? `Rol ${rolVal}` : 'Sin rol';
  }
};

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cambiandoEstado, setCambiandoEstado] = useState({});
  const [cambiandoRol, setCambiandoRol] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [rolFiltro, setRolFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [tipoIdentOptions, setTipoIdentOptions] = useState([]);
  const [tipoEmpleadorOptions, setTipoEmpleadorOptions] = useState([]);
  const [cargoOptions, setCargoOptions] = useState([]);
  const [loadingUserOptions, setLoadingUserOptions] = useState(false);
  const [userOptionsError, setUserOptionsError] = useState('');

  useEffect(() => {
    loadUsuarios();
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadUserOptions() {
      setLoadingUserOptions(true);
      setUserOptionsError('');
      try {
        const [tiposIdent, tiposEmpleador, cargos] = await Promise.all([
          getParametrosHijosByPapa(2),
          getParametrosHijosByPapa(3),
          getParametrosHijosByPapa(4),
        ]);
        if (!mounted) return;
        setTipoIdentOptions(Array.isArray(tiposIdent) ? tiposIdent : []);
        setTipoEmpleadorOptions(Array.isArray(tiposEmpleador) ? tiposEmpleador : []);
        setCargoOptions(Array.isArray(cargos) ? cargos : []);
      } catch (err) {
        if (mounted) {
          setUserOptionsError(err?.message || 'Error cargando catálogos');
        }
      } finally {
        if (mounted) {
          setLoadingUserOptions(false);
        }
      }
    }
    loadUserOptions();
    return () => {
      mounted = false;
    };
  }, []);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAllUsers(0, 1000);
      const normalizados = (Array.isArray(data) ? data : []).map(u => {
        const rawRol = u.rol_id ?? u.rol ?? u.id_rol ?? u.role_id ?? u.role;
        const rolId = normalizeRolId(rawRol);
        return {
          ...u,
          rol_id: rolId,
          rol_nombre_normalizado: getRolNombreNormalizado(rolId),
        };
      });
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

  const handleToggleRol = async (usuario) => {
    const currentRol = normalizeRolId(usuario.rol_id);
    if (currentRol == null) {
      alert('No se pudo determinar el rol actual del usuario.');
      return;
    }
    const nuevoRol = currentRol === 10 ? 9 : 10;
    try {
      setCambiandoRol((prev) => ({ ...prev, [usuario.id_usuario]: true }));
      await changeUserRole(usuario.id_usuario, nuevoRol);
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id_usuario === usuario.id_usuario
            ? {
                ...u,
                rol_id: nuevoRol,
                rol_nombre_normalizado: getRolNombreNormalizado(nuevoRol),
              }
            : u
        )
      );
      const mensaje =
        nuevoRol === 10 ? 'Usuario cambiado a Administrador' : 'Usuario cambiado a Empleado';
      alert(mensaje);
    } catch (err) {
      alert('Error al cambiar rol: ' + (err?.message || ''));
    } finally {
      setCambiandoRol((prev) => ({ ...prev, [usuario.id_usuario]: false }));
    }
  };

  const openEditUser = (usuario) => {
    const rolVal = normalizeRolId(usuario.rol_id ?? usuario.rol ?? usuario.id_rol ?? usuario.role_id ?? usuario.role);
    setEditingUser(usuario);
    setEditForm({
      nombre_completo: usuario.nombre ?? usuario.nombre_completo ?? '',
      numero_identificacion: usuario.numero_identificacion ?? '',
      tipo_identificacion_id: usuario.tipo_identificacion_id ?? '',
      tipo_empleador_id: usuario.tipo_empleador_id ?? '',
      cargo_interno: usuario.cargo_interno_id ?? '',
      correo_electronico: usuario.correo_electronico ?? '',
      telefono: usuario.telefono ?? '',
      rol_id: rolVal ?? '',
      estado: usuario.estado === true || usuario.estado === 1,
    });
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setEditForm(null);
    setEditSaving(false);
  };

  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;
    setEditForm((prev) => ({ ...prev, [name]: finalValue }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser || !editForm) return;
    setEditSaving(true);
    try {
      const payloadRaw = {
        nombre_completo: editForm.nombre_completo?.trim(),
        numero_identificacion: editForm.numero_identificacion?.trim(),
        tipo_identificacion_id: editForm.tipo_identificacion_id ? Number(editForm.tipo_identificacion_id) : null,
        tipo_empleador_id: editForm.tipo_empleador_id ? Number(editForm.tipo_empleador_id) : null,
        cargo_interno: editForm.cargo_interno ? Number(editForm.cargo_interno) : null,
        correo_electronico: editForm.correo_electronico?.trim(),
        telefono: editForm.telefono?.trim() || null,
        rol_id: editForm.rol_id === '' || editForm.rol_id === null ? null : Number(editForm.rol_id),
        estado: typeof editForm.estado === 'string' ? editForm.estado === 'true' : !!editForm.estado,
      };
      const payload = Object.fromEntries(
        Object.entries(payloadRaw).filter(([_, v]) => v !== null && v !== undefined && v !== '')
      );
      await updateUserAdmin(editingUser.id_usuario, payload);
      await loadUsuarios();
      alert('Usuario actualizado correctamente');
      closeEditModal();
    } catch (err) {
      alert(err?.message || 'Error al actualizar usuario');
    } finally {
      setEditSaving(false);
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

  const getRolNombre = (rolId, fallbackNombre) => {
    const rolVal = normalizeRolId(rolId);
    if (rolVal === 10) return 'Administrador';
    if (rolVal === 9) return 'Empleado';
    if (fallbackNombre) return fallbackNombre;
    return rolVal != null ? `Rol ${rolVal}` : 'Sin rol';
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

  const filteredUsuarios = usuarios
    .filter((u) => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;
      const nombre = (u.nombre || u.nombre_completo || '').toLowerCase();
      const correo = (u.correo_electronico || '').toLowerCase();
      const cargo = (u.cargo_interno || '').toLowerCase();
      return nombre.includes(query) || correo.includes(query) || cargo.includes(query);
    })
    .filter((u) => {
      if (!rolFiltro) return true;
      const rolVal = normalizeRolId(u.rol_id ?? u.rol ?? u.id_rol ?? u.role_id ?? u.role);
      if (rolVal == null) return false;
      if (rolFiltro === 'admin') return rolVal === 10;
      if (rolFiltro === 'empleado') return rolVal === 9;
      return false;
    })
    .filter((u) => {
      if (!estadoFiltro) return true;
      const activo = u.estado === true || u.estado === 1;
      if (estadoFiltro === 'activo') return activo;
      if (estadoFiltro === 'inactivo') return !activo;
      return true;
    })
    .sort((a, b) => {
      const nombreA = (a.nombre || a.nombre_completo || '').toLowerCase();
      const nombreB = (b.nombre || b.nombre_completo || '').toLowerCase();
      return nombreA.localeCompare(nombreB, 'es');
    });

  return (
    <div className="admin-pages-container">
      <h1 className="admin-pages-title">GESTIÓN DE USUARIOS</h1>
      <div className="admin-pages-content" style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto', marginLeft: -80 }}>
        {error && <div className="admin-error"><h1>GESTIÓN DE USUARIOS</h1><p>{error}</p></div>}
        
          <div className="admin-filter-container" style={{ marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="🔍 Buscar por nombre, correo o cargo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: '1 1 280px',
                minWidth: 220,
                padding: '12px 16px',
                fontSize: '14px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
              onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
            />
            <select
              className="admin-filter-select"
              value={rolFiltro}
              onChange={(e) => setRolFiltro(e.target.value)}
              style={{ minWidth: 160 }}
            >
              <option value="">Todos los roles</option>
              <option value="admin">Administrador</option>
              <option value="empleado">Empleado</option>
            </select>
            <select
              className="admin-filter-select"
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              style={{ minWidth: 160 }}
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
            {(searchQuery || rolFiltro || estadoFiltro) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setRolFiltro('');
                  setEstadoFiltro('');
                }}
                style={{
                  padding: '8px 16px',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Limpiar filtros
              </button>
            )}
          </div>

          <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 10 }}>
            Mostrando {filteredUsuarios.length} de {usuarios.length} usuarios
          </div>
        
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
              {filteredUsuarios.length === 0 && (
                <tr>
                  <td colSpan={7} className="muted" style={{ padding: 16, textAlign: 'center' }}>
                    {usuarios.length === 0
                      ? 'No hay usuarios registrados'
                      : 'No se encontraron usuarios con los filtros seleccionados'}
                  </td>
                </tr>
              )}
              {filteredUsuarios.map((usuario) => {
                const rolActual = normalizeRolId(usuario.rol_id ?? usuario.rol ?? usuario.id_rol ?? usuario.role_id ?? usuario.role);
                return (
                  <tr key={usuario.id_usuario}>
               
                  <td style={{ minWidth: 220 }}>{usuario.nombre || 'N/A'}</td>
                  <td>{usuario.correo_electronico || 'N/A'}</td>
                  <td>{usuario.telefono || 'N/A'}</td>
                  <td>{usuario.cargo_interno || 'N/A'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {(() => {
                        const esAdmin = rolActual === 10;
                        const proximoRolNombre = esAdmin ? 'Empleado' : 'Administrador';
                        const buttonClass = esAdmin ? 'admin-btn admin-btn-secondary' : 'admin-btn admin-btn-primary';
                        return (
                          <button
                            className={buttonClass}
                            onClick={() => handleToggleRol(usuario)}
                            disabled={!!cambiandoRol[usuario.id_usuario]}
                            title={`Cambiar a ${proximoRolNombre}`}
                          >
                            Cambiar a {proximoRolNombre}
                          </button>
                        );
                      })()}
                    </div>
                  </td>
                  <td>
                    <span className={`admin-status admin-status-${usuario.estado ? 'active' : 'inactive'}`}>
                      {usuario.estado ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="admin-action-buttons">
                      <button
                        className="admin-btn admin-btn-dark"
                        style={{ marginRight: 8 }}
                        onClick={() => openEditUser(usuario)}
                      >
                        Editar
                      </button>
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
                );
              })}
            </tbody>
          </table>
        )}
        </div>
      </div>
      {editingUser && editForm && (
        <Modal
          open={!!editingUser}
          title={`Editar usuario`}
          onClose={closeEditModal}
        >
          <div className="admin-card">
            <div className="admin-card-header">Editar usuario</div>
            <div className="admin-card-body">
              {userOptionsError && (
                <div className="admin-error" style={{ marginBottom: 12 }}>
                  {userOptionsError}
                </div>
              )}
              <form onSubmit={handleEditSubmit} className="admin-form-grid">
                <div className="admin-form-field">
                  <label className="admin-form-label">Nombre completo</label>
                  <input
                    className="admin-form-input"
                    name="nombre_completo"
                    value={editForm.nombre_completo}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">Número identificación</label>
                  <input
                    className="admin-form-input"
                    name="numero_identificacion"
                    value={editForm.numero_identificacion}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">Tipo identificación</label>
                  <select
                    className="admin-form-input"
                    name="tipo_identificacion_id"
                    value={editForm.tipo_identificacion_id ?? ''}
                    onChange={handleEditFormChange}
                    disabled={loadingUserOptions}
                  >
                    <option value="">Seleccione</option>
                    {renderOptionList(tipoIdentOptions)}
                  </select>
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">Tipo empleador</label>
                  <select
                    className="admin-form-input"
                    name="tipo_empleador_id"
                    value={editForm.tipo_empleador_id ?? ''}
                    onChange={handleEditFormChange}
                    disabled={loadingUserOptions}
                  >
                    <option value="">Seleccione</option>
                    {renderOptionList(tipoEmpleadorOptions)}
                  </select>
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">Cargo interno</label>
                  <select
                    className="admin-form-input"
                    name="cargo_interno"
                    value={editForm.cargo_interno ?? ''}
                    onChange={handleEditFormChange}
                    disabled={loadingUserOptions}
                  >
                    <option value="">Seleccione</option>
                    {renderOptionList(cargoOptions)}
                  </select>
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">Correo electrónico</label>
                  <input
                    className="admin-form-input"
                    type="email"
                    name="correo_electronico"
                    value={editForm.correo_electronico}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">Teléfono</label>
                  <input
                    className="admin-form-input"
                    name="telefono"
                    value={editForm.telefono ?? ''}
                    onChange={handleEditFormChange}
                    maxLength={10}
                  />
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">Rol</label>
                  <select
                    className="admin-form-input"
                    name="rol_id"
                    value={editForm.rol_id ?? ''}
                    onChange={handleEditFormChange}
                  >
                    <option value="">Seleccione</option>
                    <option value="10">Administrador</option>
                    <option value="9">Empleado</option>
                  </select>
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">Estado</label>
                  <select
                    className="admin-form-input"
                    name="estado"
                    value={String(editForm.estado)}
                    onChange={handleEditFormChange}
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
                <div className="admin-form-actions">
                  <button type="button" className="admin-btn admin-btn-dark" onClick={closeEditModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="admin-btn admin-btn-primary" disabled={editSaving}>
                    {editSaving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function renderOptionList(options) {
  return options
    .filter((opt) => opt && opt.estado !== false)
    .map((opt) => (
      <option key={opt.id_parametrohijo ?? opt.id} value={opt.id_parametrohijo ?? opt.id}>
        {opt.nombre ?? opt.descripcion ?? ''}
      </option>
    ));
}
