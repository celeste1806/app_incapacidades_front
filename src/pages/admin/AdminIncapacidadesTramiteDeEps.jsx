
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIncapacidadesTramiteDeEps, getIncapacidadDetalle, cambiarEstadoIncapacidad, actualizarIncapacidadAdministrativa } from '../../services/incapacidades';
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
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
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
  const [motivoNoPagas, setMotivoNoPagas] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 7;

  useEffect(() => {
    loadIncapacidadesTramiteDeEps();
  }, []);

  // Resetear página cuando cambien filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateFrom, dateTo]);

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

  const parseLocalInputDate = (value) => {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
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

  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const openAdminModal = async (incapacidad) => {
    try {
      const detalles = await getIncapacidadDetalle(incapacidad.id_incapacidad);
      setSelectedIncapacidad(detalles);
      setEditData({
        numero_radicado: detalles.numero_radicado || '',
        fecha_radicado: detalles.fecha_radicado ? detalles.fecha_radicado.split('T')[0] : '',
        fecha_pago: detalles.fecha_pago ? detalles.fecha_pago.split('T')[0] : '',
        valor_pagado: detalles.valor_pago != null ? String(detalles.valor_pago) : '',
        estado: detalles.estado != null ? detalles.estado : ''
      });
      setShowAdminModal(true);
    } catch (e) {
      alert('Error al cargar datos administrativos: ' + e.message);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      const allowedKeys = ['valor_pago', 'numero_radicado', 'fecha_radicado', 'fecha_pago', 'estado'];
      const payloadRaw = Object.fromEntries(
        Object.entries({
          ...editData,
          fecha_radicado: editData.fecha_radicado ? new Date(editData.fecha_radicado).toISOString() : undefined,
          fecha_pago: editData.fecha_pago ? new Date(editData.fecha_pago).toISOString() : undefined,
          valor_pago: editData.valor_pagado !== '' && editData.valor_pagado != null ? Number(editData.valor_pagado) : undefined,
        }).filter(([k]) => allowedKeys.includes(k))
      );
      const payload = Object.fromEntries(
        Object.entries(payloadRaw).filter(([_, v]) => v !== null && v !== undefined && v !== '')
      );
      await actualizarIncapacidadAdministrativa(selectedIncapacidad.id_incapacidad, payload);
      alert('Campos administrativos actualizados correctamente');
      await loadIncapacidadesTramiteDeEps();
      setShowAdminModal(false);
    } catch (e) {
      alert('Error al guardar cambios: ' + e.message);
    } finally {
      setSaving(false);
    }
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
      // Forzar etiqueta por ID (independiente del nombre en BD)
      if (estado === 12) return 'Trámite';
      if (estado === 11) return 'Pendiente';
      if (estado === 40) return 'Pagas';
      if (estado === 44) return 'No Pagas';
      if (estado === 50) return 'Rechazada';
      return estadoEncontrado.nombre;
    }
    
    // Fallback a valores hardcodeados si no se han cargado los estados
    switch (estado) {
      case 11: return 'Pendiente';
      case 12: return 'Trámite';
      case 40: return 'Pagas';
      case 44: return 'No Pagas';
      case 50: return 'Rechazada';
      default: return `Estado ${estado}`;
    }
  };

  const getEstadoClass = (estado) => {
    switch (estado) {
      case 11: return 'estado-pendiente';
      case 12: return 'estado-tramite';
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
    setMotivoNoPagas('');
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
      
      let motivoNoPagasValue = null;
      if (selectedNewState === 44) {
        if (!motivoNoPagas || motivoNoPagas.trim() === '') {
          alert('Debe ingresar un motivo por el cual no están pagas');
          setCambiandoEstado(prev => ({ ...prev, [incapacidadId]: false }));
          return;
        }
        motivoNoPagasValue = motivoNoPagas;
      }
      
      console.log('📡 Llamando a cambiarEstadoIncapacidad:', { incapacidadId, nuevoEstado: selectedNewState, mensajeRechazo: mensajeRechazoValue, motivoNoPagas: motivoNoPagasValue });
      const resp = await cambiarEstadoIncapacidad(incapacidadId, selectedNewState, mensajeRechazoValue, motivoNoPagasValue);
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
        setMotivoNoPagas('');
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
                {/* Campos Administrativos integrados en el formulario */}
                {(() => {
                  const vp = (selectedIncapacidad.valor_pago ?? selectedIncapacidad.valor_pagado ?? (typeof editData !== 'undefined' ? editData.valor_pagado : undefined));
                  const hasAdminData = Boolean(
                    selectedIncapacidad.numero_radicado ||
                    selectedIncapacidad.fecha_radicado ||
                    selectedIncapacidad.fecha_pago ||
                    (vp !== null && vp !== undefined && vp !== '')
                  );
                  if (!hasAdminData) return null;
                  return (
                    <>
                      <div className="form-field">
                  <label className="field-label">🔢 Número Radicado</label>
                  <div className="field-value">{selectedIncapacidad.numero_radicado || 'No definido'}</div>
                </div>
                      <div className="form-field">
                  <label className="field-label">📅 Fecha Radicado</label>
                  <div className="field-value">{selectedIncapacidad.fecha_radicado ? formatDate(selectedIncapacidad.fecha_radicado) : 'No definido'}</div>
                </div>
                      <div className="form-field">
                  <label className="field-label">💳 Fecha de Pago</label>
                  <div className="field-value">{selectedIncapacidad.fecha_pago ? formatDate(selectedIncapacidad.fecha_pago) : 'No definido'}</div>
                </div>
                      <div className="form-field">
                  <label className="field-label">💰 Valor pagado</label>
                        <div className="field-value">{(vp !== null && vp !== undefined && vp !== '') ? `$${Number(vp).toLocaleString()}` : 'N/A'}</div>
                  </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Se eliminó la tarjeta de Campos Administrativos dentro del formulario (solo lectura) */}

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
        
        <div className="admin-filter-container" style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="🔍 Buscar por nombre de empleado..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              maxWidth: '400px',
              padding: '12px 16px',
              fontSize: '14px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#2563eb'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ color: '#94a3b8', fontSize: 12 }}>Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="admin-filter-select"
              style={{ padding: '8px 10px' }}
            />
            <label style={{ color: '#94a3b8', fontSize: 12 }}>Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="admin-filter-select"
              style={{ padding: '8px 10px' }}
            />
            {(searchQuery || dateFrom || dateTo) && (
              <button
                onClick={() => { setSearchQuery(''); setDateFrom(''); setDateTo(''); }}
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
        </div>
        
        {loading ? (
          <div className="admin-loading">
            <h1>TRÁMITE DE EPS</h1>
            <p>Cargando...</p>
            </div>
          ) : (
            <>
              {(() => {
                // Filtrar incapacidades por nombre de empleado
                const filteredIncapacidades = incapacidades.filter(incapacidad => {
                  const nombre = (incapacidad.usuario_nombre || incapacidad.usuario || '').toLowerCase();
                  const query = searchQuery.toLowerCase();
                  if (!nombre.includes(query)) {
                    return false;
                  }

                  const fechaInicio = incapacidad.fecha_inicio ? new Date(incapacidad.fecha_inicio) : null;
                  const from = parseLocalInputDate(dateFrom);
                  const to = parseLocalInputDate(dateTo);

                  if (from) {
                    if (!fechaInicio || fechaInicio < from) {
                      return false;
                    }
                  }

                  if (to) {
                    if (!fechaInicio) return false;
                    const toEnd = new Date(to.getTime());
                    toEnd.setHours(23, 59, 59, 999);
                    if (fechaInicio > toEnd) {
                      return false;
                    }
                  }

                  return true;
                });
                
                // Paginación
                const totalPages = Math.max(1, Math.ceil(filteredIncapacidades.length / ITEMS_PER_PAGE));
                const safeCurrentPage = Math.min(currentPage, totalPages);
                const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
                const paginatedIncapacidades = filteredIncapacidades.slice(startIndex, startIndex + ITEMS_PER_PAGE);
                const showingFrom = filteredIncapacidades.length === 0 ? 0 : startIndex + 1;
                const showingTo = startIndex + paginatedIncapacidades.length;
                
                return (
                  <>
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
                        {filteredIncapacidades.length === 0 && (searchQuery || dateFrom || dateTo) && (
                          <tr>
                            <td colSpan={7} className="muted" style={{ padding: 16, textAlign: 'center' }}>
                              No se encontraron trámites de EPS con los filtros seleccionados
                            </td>
                          </tr>
                        )}
                        {filteredIncapacidades.length === 0 && !searchQuery && !dateFrom && !dateTo && (
                          <tr>
                            <td colSpan={7} className="muted" style={{ padding: 16, textAlign: 'center' }}>
                              No hay trámites de EPS
                            </td>
                          </tr>
                        )}
                        {paginatedIncapacidades.map(incapacidad => (
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
                        className="admin-btn admin-btn-outline admin-btn-sm"
                        onClick={() => openAdminModal(incapacidad)}
                        style={{ marginRight: 8 }}
                      >
                        Campo Admin
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
                    {filteredIncapacidades.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                        <div style={{ color: '#94a3b8', fontSize: 12 }}>
                          Mostrando {showingFrom}-{showingTo} de {filteredIncapacidades.length}
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <button
                            onClick={() => {
                              setCurrentPage(p => Math.max(1, p - 1));
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            disabled={safeCurrentPage === 1}
                            className="admin-btn admin-btn-secondary"
                            style={{ padding: '6px 10px' }}
                          >
                            « Anterior
                          </button>
                          <span style={{ color: '#e2e8f0', fontSize: 13 }}>Página {safeCurrentPage} / {totalPages}</span>
                          <button
                            onClick={() => {
                              setCurrentPage(p => Math.min(totalPages, p + 1));
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            disabled={safeCurrentPage === totalPages}
                            className="admin-btn admin-btn-secondary"
                            style={{ padding: '6px 10px' }}
                          >
                            Siguiente »
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          )}
      </div>

      <FormularioModal />
      {showAdminModal && selectedIncapacidad && (
        <ScrollableModal
          open={showAdminModal}
          title="⚙️ Campos Administrativos"
          onClose={() => setShowAdminModal(false)}
          maxWidth="700px"
        >
          <div className="modal-content-wrapper">
            <div className="card elegant-card">
              <div className="card-body">
                <div className="admin-grid">
                  <div className="admin-field">
                    <label className="field-label">🔢 Número Radicado</label>
                    <input
                      type="text"
                      value={editData.numero_radicado || ''}
                      onChange={(e) => handleEditChange('numero_radicado', e.target.value)}
                      className="input elegant-input"
                      placeholder="Ej: RAD-2024-001"
                    />
                  </div>
                  <div className="admin-field">
                    <label className="field-label">📅 Fecha Radicado</label>
                    <input
                      type="date"
                      value={editData.fecha_radicado || ''}
                      onChange={(e) => handleEditChange('fecha_radicado', e.target.value)}
                      className="input elegant-input"
                    />
                  </div>
                  <div className="admin-field">
                    <label className="field-label">📅 Fecha de Pago</label>
                    <input
                      type="date"
                      value={editData.fecha_pago || ''}
                      onChange={(e) => handleEditChange('fecha_pago', e.target.value)}
                      className="input elegant-input"
                    />
                  </div>
                  <div className="admin-field">
                    <label className="field-label">💰 Valor pagado</label>
                    <input
                      type="number"
                      value={editData.valor_pagado || ''}
                      onChange={(e) => handleEditChange('valor_pagado', e.target.value === '' ? '' : Number(e.target.value))}
                      className="input elegant-input"
                      min="0"
                      step="0.01"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="form-actions" style={{ marginTop: 16 }}>
                  <button 
                    className="btn btn-primary btn-save"
                    onClick={handleSaveChanges}
                    disabled={saving}
                  >
                    {saving ? '⏳ Guardando...' : '💾 Guardar'}
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setShowAdminModal(false)}
                  >
                    ❌ Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ScrollableModal>
      )}
      
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
            setMotivoNoPagas('');
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
                  {selectedNewState === 44 && (
                    <div className="form-field full-width">
                      <label className="field-label">📝 Motivo por el cual no están pagas *</label>
                      <textarea
                        value={motivoNoPagas}
                        onChange={(e) => setMotivoNoPagas(e.target.value)}
                        className="input elegant-input"
                        placeholder="Ingrese el motivo por el cual no están pagas"
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
                      setMotivoNoPagas('');
                    }}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="btn-confirm-state"
                    onClick={handleConfirmStateChange}
                    disabled={!selectedNewState || (selectedNewState === 50 && !mensajeRechazo.trim()) || (selectedNewState === 44 && !motivoNoPagas.trim())}
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


