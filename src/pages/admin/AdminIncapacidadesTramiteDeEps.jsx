
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIncapacidadesTramiteDeEps, getIncapacidadDetalle, cambiarEstadoIncapacidad } from '../../services/incapacidades';
// import { getParametrosHijosByPapa } from '../../services/parametros';
import ScrollableModal from '../../shared/components/ScrollableModal';
import '../../styles/admin-parametros.css';
import '../../styles/admin-pages-blue.css';

export default function AdminIncapacidadesTramiteDeEps() {
  const navigate = useNavigate();
  const [incapacidades, setIncapacidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedIncapacidad, setSelectedIncapacidad] = useState(null);
  const [, setLoadingForm] = useState(false);
  // const [isEditing, setIsEditing] = useState(false);
  // const [editData, setEditData] = useState({});
  // const [saving, setSaving] = useState(false);
  // const [isEditingForm, setIsEditingForm] = useState(false);
  // const [editFormData, setEditFormData] = useState({});
  // const [savingForm, setSavingForm] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState({});
  const [dropdownAbierto, setDropdownAbierto] = useState({});
  const [estadosIncapacidad, setEstadosIncapacidad] = useState([]);
  const [loadingEstados] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);
  const [selectedIncapacidadForState, setSelectedIncapacidadForState] = useState(null);
  const [selectedNewState, setSelectedNewState] = useState(null);
  const [mensajeRechazo, setMensajeRechazo] = useState('');

  useEffect(() => {
    loadIncapacidadesTramiteDeEps();
  }, []);

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Mantener abierto si el clic ocurre dentro del dropdown del admin
      if (!event.target.closest('.admin-dropdown') && !event.target.closest('.admin-dropdown-container')) {
        setDropdownAbierto({});
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Debug: Verificar datos de selectedIncapacidad cuando cambie
  useEffect(() => {
    if (selectedIncapacidad) {
      console.log('selectedIncapacidad actualizado:', selectedIncapacidad);
      console.log('EPS en selectedIncapacidad:', {
        Eps_id: selectedIncapacidad.Eps_id,
        eps_afiliado_nombre: selectedIncapacidad.eps_afiliado_nombre,
        valor_final: selectedIncapacidad.eps_afiliado_nombre || 'No especificado'
      });
      console.log('Servicio en selectedIncapacidad:', {
        servicio_id: selectedIncapacidad.servicio_id,
        servicio_nombre: selectedIncapacidad.servicio_nombre,
        valor_final: selectedIncapacidad.servicio_nombre || 'No especificado'
      });
      console.log('Diagnóstico en selectedIncapacidad:', {
        diagnostico_id: selectedIncapacidad.diagnostico_id,
        diagnostico_nombre: selectedIncapacidad.diagnostico_nombre,
        valor_final: selectedIncapacidad.diagnostico_nombre || 'No especificado'
      });
    }
  }, [selectedIncapacidad]);

  const loadIncapacidadesTramiteDeEps = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Iniciando carga de Trámite de EPS...');
      const response = await getIncapacidadesTramiteDeEps();
      
      // Manejar nueva estructura de respuesta
      if (response && typeof response === 'object' && 'incapacidades' in response) {
        const incapacidades = response.incapacidades || [];
        const estadosDisponibles = response.estados_disponibles || [];
        
        console.log('📊 Total en Trámite de EPS:', incapacidades.length);
        console.log('📋 Estados disponibles:', estadosDisponibles.length);
        
        setIncapacidades(incapacidades);
        setEstadosIncapacidad(estadosDisponibles);
        
        if (incapacidades.length > 0) {
          console.log('Primera incapacidad:', incapacidades[0]);
          console.log('Campos disponibles:', Object.keys(incapacidades[0]));
        }
      } else {
        // Fallback para estructura antigua
        console.log('📊 Total en Trámite de EPS:', response.length);
        setIncapacidades(response);
      }
    } catch (e) {
      console.error('Error al cargar Trámite de EPS:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Función helper para obtener el nombre del tipo de incapacidad
  const getTipoIncapacidadNombre = (incapacidad) => {
    // El backend ya envía los nombres resueltos, usar directamente
    if (incapacidad.tipo_incapacidad_nombre) {
      return incapacidad.tipo_incapacidad_nombre;
    }
    if (incapacidad.tipo_nombre) {
      return incapacidad.tipo_nombre;
    }
    if (incapacidad.tipo_incapacidad && incapacidad.tipo_incapacidad.nombre) {
      return incapacidad.tipo_incapacidad.nombre;
    }
    // Fallback: mostrar el ID si no hay nombre
    return `Tipo ${incapacidad.tipo_incapacidad_id || 'N/A'}`;
  };

  const getEstadoText = (estado) => {
    // Buscar el estado en la lista cargada del backend
    const estadoEncontrado = estadosIncapacidad.find(e => e.id_parametrohijo === estado);
    if (estadoEncontrado) {
      return estadoEncontrado.nombre;
    }
    
    // Fallback a valores hardcodeados si no se han cargado los estados
    switch (estado) {
      case 11: return 'Pendiente';
      case 12: return 'Realizada';
      case 40: return 'Pagas';
      case 44: return 'No Pagas';
      case 50: return 'Rechazada';
      default: return `Estado ${estado}`;
    }
  };

  const getEstadoClass = (estado) => {
    switch (estado) {
      case 11: return 'estado-pendiente';
      case 12: return 'estado-realizada';
      case 40: return 'estado-pagas';
      case 44: return 'estado-no-pagas';
      case 50: return 'estado-rechazada';
      default: return 'estado-desconocido';
    }
  };

  const handleVerFormulario = async (incapacidad) => {
    try {
      console.log('🔍 Iniciando handleVerFormulario para incapacidad:', incapacidad);
      setLoadingForm(true);
      console.log('📡 Llamando a getIncapacidadDetalle con ID:', incapacidad.id_incapacidad);
      const detalles = await getIncapacidadDetalle(incapacidad.id_incapacidad);
      console.log('✅ Datos recibidos del backend:', detalles);
      setSelectedIncapacidad(detalles);
      // setEditData({
      //   clase_administrativa: detalles.clase_administrativa || '',
      //   numero_radicado: detalles.numero_radicado || '',
      //   fecha_radicado: detalles.fecha_radicado ? detalles.fecha_radicado.split('T')[0] : '',
      //   fecha_pago: detalles.fecha_pago ? detalles.fecha_pago.split('T')[0] : '',
      //   paga: detalles.paga || false,
      //   estado_administrativo: detalles.estado_administrativo || ''
      // });
      // setEditFormData({
      //   fecha_inicio: detalles.fecha_inicio ? detalles.fecha_inicio.split('T')[0] : '',
      //   fecha_final: detalles.fecha_final ? detalles.fecha_final.split('T')[0] : '',
      //   dias: detalles.dias || 0,
      //   salario: detalles.salario || 0,
      //   eps_afiliado: detalles.eps_afiliado_nombre || '',
      //   servicio: detalles.servicio_nombre || '',
      //   diagnostico: detalles.diagnostico_nombre || ''
      // });
      // setIsEditing(false);
      // setIsEditingForm(false);
      console.log('🎯 Estableciendo showFormModal a true');
      setShowFormModal(true);
      console.log('✅ Modal debería estar visible ahora');
    } catch (e) {
      console.error('❌ Error en handleVerFormulario:', e);
      alert('Error al cargar detalles: ' + e.message);
    } finally {
      setLoadingForm(false);
    }
  };

  // const handleSaveChanges = async () => {
  //   try {
  //     setSaving(true);
  //     
  //     const payload = {
  //       clase_administrativa: editData.clase_administrativa || null,
  //       numero_radicado: editData.numero_radicado || null,
  //       fecha_radicado: editData.fecha_radicado ? new Date(editData.fecha_radicado).toISOString() : null,
  //       fecha_pago: editData.fecha_pago ? new Date(editData.fecha_pago).toISOString() : null,
  //       paga: editData.paga,
  //       estado_administrativo: editData.estado_administrativo || null
  //     };
  //     
  //     // Filtrar valores nulos
  //     const filteredPayload = Object.fromEntries(
  //       Object.entries(payload).filter(([_, value]) => value !== null)
  //     );
  //     
  //     await actualizarIncapacidadAdministrativa(selectedIncapacidad.id_incapacidad, filteredPayload);
  //     alert('Datos administrativos actualizados correctamente');
  //     
  //     // Recargar la lista
  //     await loadIncapacidadesRealizadas();
  //     setShowFormModal(false);
  //   } catch (e) {
  //     alert('Error al guardar cambios: ' + e.message);
  //   } finally {
  //     setSaving(false);
  //   }
  // };

  // const handleSaveFormChanges = async () => {
  //   try {
  //     setSavingForm(true);
  //     
  //     const payload = {
  //       fecha_inicio: editFormData.fecha_inicio ? new Date(editFormData.fecha_inicio).toISOString() : null,
  //       fecha_final: editFormData.fecha_final ? new Date(editFormData.fecha_final).toISOString() : null,
  //       dias: parseInt(editFormData.dias) || null,
  //       salario: parseFloat(editFormData.salario) || null,
  //       eps_afiliado_id: null, // TODO: Implementar búsqueda por nombre si es necesario
  //       servicio_id: null, // TODO: Implementar búsqueda por nombre si es necesario
  //       diagnostico_id: null // TODO: Implementar búsqueda por nombre si es necesario
  //     };
  //     
  //     // Filtrar valores nulos
  //     const filteredPayload = Object.fromEntries(
  //       Object.entries(payload).filter(([_, value]) => value !== null)
  //     );
  //     
  //     await actualizarIncapacidadFormulario(selectedIncapacidad.id_incapacidad, filteredPayload);
  //     alert('Datos del formulario actualizados correctamente');
  //     
  //     // Recargar la lista
  //     await loadIncapacidadesRealizadas();
  //     setShowFormModal(false);
  //   } catch (e) {
  //     alert('Error al guardar cambios del formulario: ' + e.message);
  //   } finally {
  //     setSavingForm(false);
  //   }
  // };

  const handleOpenStateModal = async (incapacidad) => {
    setSelectedIncapacidadForState(incapacidad);
    setSelectedNewState(null);
    setMensajeRechazo('');
    setShowStateModal(true);
  };

  const handleConfirmStateChange = async () => {
    if (!selectedNewState) {
      alert('Por favor seleccione un estado');
      return;
    }
    
    const incapacidadId = selectedIncapacidadForState.id_incapacidad;
    
    try {
      setCambiandoEstado(prev => ({ ...prev, [incapacidadId]: true }));
      
      let mensajeRechazoValue = null;
      if (selectedNewState === 50) {
        if (!mensajeRechazo || !mensajeRechazo.trim()) {
          alert('Por favor ingrese un motivo de rechazo');
          setCambiandoEstado(prev => ({ ...prev, [incapacidadId]: false }));
          return;
        }
        mensajeRechazoValue = mensajeRechazo;
      }
      
      console.log('📡 Llamando a cambiarEstadoIncapacidad:', { incapacidadId, nuevoEstado: selectedNewState, mensajeRechazo: mensajeRechazoValue });
      const resp = await cambiarEstadoIncapacidad(incapacidadId, selectedNewState, mensajeRechazoValue);
      console.log('✅ Respuesta recibida:', resp);
      
      const estadoTextStr = getEstadoText(selectedNewState);
      alert(`Estado cambiado a ${estadoTextStr}`);
      
      // Regla: si se marca "No Pagas" (44), decidir navegación según días
      if (selectedNewState === 44) {
        const dias = Number(selectedIncapacidadForState.dias) || 0;
        if (dias > 2) {
          // Ya estamos en Trámite de EPS; mantener aquí
          // solo recargar
          await loadIncapacidadesTramiteDeEps();
        } else {
          navigate('/admin/incapacidades-historial');
        }
      } else {
        // Cerrar modal y recargar lista
        setShowStateModal(false);
        setSelectedIncapacidadForState(null);
        setSelectedNewState(null);
        setMensajeRechazo('');
        await loadIncapacidadesTramiteDeEps();
      }
    } catch (e) {
      console.error('❌ Error en handleConfirmStateChange:', e);
      alert('Error al cambiar estado: ' + e.message);
    } finally {
      setCambiandoEstado(prev => ({ ...prev, [incapacidadId]: false }));
    }
  };

  // Eliminado toggleDropdown (no usado)

  const FormularioModal = () => {
    if (!selectedIncapacidad) return null;

    const documentos = selectedIncapacidad.documentos || [];

    return (
      <ScrollableModal 
        open={showFormModal} 
        title={`📋 Formulario de Incapacidad - ID: ${selectedIncapacidad.id_incapacidad}`}
        onClose={() => setShowFormModal(false)}
        maxWidth="95vw"
        maxHeight="90vh"
      >
        <div className="modal-content-wrapper">
          {/* Datos del Formulario Original */}
          <div className="card elegant-card">
            <div className="card-header elegant-header">
              <div className="header-content">
                <h3 className="card-title">📋 Datos del Formulario Original</h3>
                <span className="readonly-badge" style={{ 
                  background: '#e3f2fd', 
                  color: '#1976d2', 
                  padding: '4px 8px', 
                  borderRadius: '4px', 
                  fontSize: '12px',
                  fontWeight: '500'
                }}>📖 Solo Lectura</span>
              </div>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <div className="form-field">
                  <label className="field-label">👤 Empleado</label>
                  <div className="field-value">{selectedIncapacidad.usuario_nombre || selectedIncapacidad.usuario?.nombre_completo || selectedIncapacidad.usuario?.nombre || `Usuario ${selectedIncapacidad.usuario_id}`}</div>
                </div>
                <div className="form-field">
                  <label className="field-label">🏥 Tipo de Incapacidad</label>
                  <div className="field-value">{selectedIncapacidad.tipo_incapacidad_nombre || selectedIncapacidad.tipo_incapacidad?.nombre || `Tipo ${selectedIncapacidad.tipo_incapacidad_id}`}</div>
                </div>
                <div className="form-field">
                  <label className="field-label">📅 Fecha de Inicio</label>
                  <div className="field-value">{formatDate(selectedIncapacidad.fecha_inicio)}</div>
                </div>
                <div className="form-field">
                  <label className="field-label">📅 Fecha de Fin</label>
                  <div className="field-value">{formatDate(selectedIncapacidad.fecha_final)}</div>
                </div>
                <div className="form-field">
                  <label className="field-label">📊 Días</label>
                  <div className="field-value">{selectedIncapacidad.dias}</div>
                </div>
                <div className="form-field">
                  <label className="field-label">💰 Salario</label>
                  <div className="field-value">{selectedIncapacidad.salario ? `$${selectedIncapacidad.salario.toLocaleString()}` : 'N/A'}</div>
                </div>
                <div className="form-field">
                  <label className="field-label">🏥 EPS</label>
                  <div className="field-value">{selectedIncapacidad.eps_afiliado_nombre || selectedIncapacidad.eps_afiliado || 'No especificado'}</div>
                </div>
                <div className="form-field">
                  <label className="field-label">🔧 Servicio</label>
                  <div className="field-value">{selectedIncapacidad.servicio_nombre || selectedIncapacidad.servicio || 'No especificado'}</div>
                </div>
                <div className="form-field">
                  <label className="field-label">🩺 Diagnóstico</label>
                  <div className="field-value">{selectedIncapacidad.diagnostico_nombre || selectedIncapacidad.diagnostico || 'No especificado'}</div>
                </div>
                <div className="form-field">
                  <label className="field-label">📅 Fecha de Registro</label>
                  <div className="field-value">{formatDate(selectedIncapacidad.fecha_registro)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Datos Administrativos */}
          <div className="card elegant-card">
            <div className="card-header elegant-header">
              <div className="header-content">
                <h3 className="card-title">⚙️ Datos Administrativos</h3>
                <span className="readonly-badge" style={{ 
                  background: '#e3f2fd', 
                  color: '#1976d2', 
                  padding: '4px 8px', 
                  borderRadius: '4px', 
                  fontSize: '12px',
                  fontWeight: '500'
                }}>📖 Solo Lectura</span>
              </div>
            </div>
            <div className="card-body">
              <div className="admin-grid">
                <div className="admin-field">
                  <label className="field-label">🔢 Número Radicado</label>
                  <div className="field-value">{selectedIncapacidad.numero_radicado || 'No definido'}</div>
                </div>
                <div className="admin-field">
                  <label className="field-label">📅 Fecha Radicado</label>
                  <div className="field-value">{selectedIncapacidad.fecha_radicado ? formatDate(selectedIncapacidad.fecha_radicado) : 'No definido'}</div>
                </div>
                <div className="admin-field">
                  <label className="field-label">💳 Fecha de Pago</label>
                  <div className="field-value">{selectedIncapacidad.fecha_pago ? formatDate(selectedIncapacidad.fecha_pago) : 'No definido'}</div>
                </div>
                <div className="admin-field">
                  <label className="field-label">💰 Valor pagado</label>
                  <div className="field-value">
                    {typeof selectedIncapacidad.valor_pagado === 'number'
                      ? `$${selectedIncapacidad.valor_pagado.toLocaleString()}`
                      : (selectedIncapacidad.paga === true
                          ? '✅ Sí'
                          : selectedIncapacidad.paga === false
                            ? '❌ No'
                            : 'N/A')}
                  </div>
                </div>
                <div className="admin-field">
                  <label className="field-label">📊 Estado</label>
                  <div className="field-value">
                    <span className={`estado-badge ${getEstadoClass(selectedIncapacidad.estado)}`}>
                      {getEstadoText(selectedIncapacidad.estado)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Documentos */}
          {documentos.length > 0 && (
            <div className="card elegant-card">
              <div className="card-header elegant-header">
                <h3 className="card-title">📄 Documentos Adjuntos</h3>
              </div>
              <div className="card-body">
                <div className="documentos-grid">
                  {documentos.map((doc, index) => {
                    const nombreDoc = doc.nombre_archivo || doc.archivo_nombre || doc.nombre || (doc.archivo_id === 1 ? 'historia clínica' : (doc.archivo_id === 2 ? 'incapacidad' : `Documento ${index + 1}`));
                    return (
                      <div key={index} className="documento-item">
                        <div className="documento-info">
                          <span className="documento-nombre" style={{ textTransform: 'capitalize' }}>📄 {nombreDoc}</span>
                          <span className="documento-fecha">{formatDate(doc.fecha_subida)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="modal-actions">
            <button 
              className="btn btn-secondary btn-large"
              onClick={() => setShowFormModal(false)}
            >
              ❌ Cerrar
            </button>
          </div>
        </div>
      </ScrollableModal>
    );
  };

  if (loading) {
    return (
      <div className="container">
        <div className="elegant-card">
          <div className="elegant-header">
            <h1>Trámite de EPS</h1>
          </div>
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-icon">⏳</div>
              <p className="empty-text">Cargando Trámite de EPS...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="elegant-card">
          <div className="elegant-header">
            <h1>Trámite de EPS</h1>
          </div>
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-icon">❌</div>
              <p className="empty-text">Error: {error}</p>
              <button className="btn btn-primary" onClick={loadIncapacidadesTramiteDeEps}>
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-pages-container">
      <h1 className="admin-pages-title">TRÁMITE DE EPS</h1>
      <div className="admin-pages-content">
        {error && <div className="admin-error"><h1>TRÁMITE DE EPS</h1><p>{error}</p></div>}
        
        <div className="admin-filter-container">
        </div>
        
        {loading ? (
          <div className="admin-loading">
            <h1>TRÁMITE DE EPS</h1>
            <p>Cargando...</p>
            </div>
          ) : (
          <table className="admin-table">
                <thead>
                  <tr>
                
                <th>Usuario</th>
                <th>Tipo</th>
                <th>Fecha Inicio</th>
                <th>Fecha Final</th>
                <th>Días</th>
                <th>Fecha de Registro</th>
                <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
              {incapacidades.length === 0 && (
                <tr>
                  <td colSpan={7} className="muted" style={{ padding: 16, textAlign: 'center' }}>
                    No hay trámites de EPS
                  </td>
                </tr>
              )}
              {incapacidades.map(incapacidad => (
                <tr key={incapacidad.id_incapacidad}>
                  <td>{incapacidad.usuario_nombre || incapacidad.usuario || 'N/A'}</td>
                  <td>{getTipoIncapacidadNombre(incapacidad)}</td>
                  <td>{formatDate(incapacidad.fecha_inicio)}</td>
                  <td>{formatDate(incapacidad.fecha_final)}</td>
                  <td>{incapacidad.dias || 'N/A'}</td>
                  <td>{formatDateTime(incapacidad.fecha_registro)}</td>
                  <td>
                    <div className="admin-actions">
                      <button 
                        className="admin-btn admin-btn-primary admin-btn-sm"
                        onClick={() => handleVerFormulario(incapacidad)}
                        style={{ marginRight: 8 }}
                      >
                        Ver Detalle
                      </button>
                      
                      <button 
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                        onClick={() => handleOpenStateModal(incapacidad)}
                        disabled={cambiandoEstado[incapacidad.id_incapacidad]}
                      >
                        {cambiandoEstado[incapacidad.id_incapacidad] ? 'Cambiando...' : 'Cambiar Estado'}
                      </button>
                    </div>
                  </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          )}
      </div>

      <FormularioModal />
      
      {/* Modal de Cambio de Estado */}
      {showStateModal && selectedIncapacidadForState && (
        <ScrollableModal
          open={showStateModal}
          title="🔄 Cambiar Estado de Incapacidad"
          onClose={() => {
            setShowStateModal(false);
            setSelectedIncapacidadForState(null);
            setSelectedNewState(null);
            setMensajeRechazo('');
          }}
          maxWidth="500px"
        >
          <div className="modal-content-wrapper">
            <div className="card elegant-card">
              <div className="card-body">
                <div className="form-grid">
                  <div className="form-field full-width">
                    <label className="field-label">🔄 Nuevo Estado *</label>
                    {loadingEstados ? (
                      <div className="field-value">Cargando estados...</div>
                    ) : (
                      <select
                        value={selectedNewState || ''}
                        onChange={(e) => setSelectedNewState(Number(e.target.value))}
                        className="input elegant-input"
                        required
                      >
                        <option value="">Seleccione un estado</option>
                        {estadosIncapacidad
                          .filter(estado => estado.id_parametrohijo !== selectedIncapacidadForState.estado)
                          .sort((a, b) => a.nombre.localeCompare(b.nombre))
                          .map(estado => (
                            <option key={estado.id_parametrohijo} value={estado.id_parametrohijo}>
                              {estado.nombre}
                            </option>
                          ))}
                      </select>
                    )}
                  </div>
                  {selectedNewState === 50 && (
                    <div className="form-field full-width">
                      <label className="field-label">📝 Motivo de Rechazo *</label>
                      <textarea
                        value={mensajeRechazo}
                        onChange={(e) => setMensajeRechazo(e.target.value)}
                        className="input elegant-input"
                        placeholder="Ingrese el motivo por el cual rechaza esta incapacidad"
                        rows="4"
                        required
                      />
                    </div>
                  )}
                </div>
                
                <div className="state-modal-actions">
                  <button 
                    className="btn-cancel-state"
                    onClick={() => {
                      setShowStateModal(false);
                      setSelectedIncapacidadForState(null);
                      setSelectedNewState(null);
                      setMensajeRechazo('');
                    }}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="btn-confirm-state"
                    onClick={handleConfirmStateChange}
                    disabled={!selectedNewState || (selectedNewState === 50 && !mensajeRechazo.trim())}
                  >
                    Confirmar Cambio
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ScrollableModal>
      )}
    </div>
  );
}


