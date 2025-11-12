import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getIncapacidadesPendientes, getIncapacidadDetalle, actualizarIncapacidadAdministrativa, cambiarEstadoIncapacidad, actualizarIncapacidadFormulario } from '../../services/incapacidades';
import { getEstadosIncapacidad } from '../../services/parametros';
import ScrollableModal from '../../shared/components/ScrollableModal';
import '../../styles/admin-parametros.css';
import '../../styles/admin-pages-blue.css';

export default function AdminIncapacidadesPendientes() {
  const ITEMS_PER_PAGE = 6;
  const [incapacidades, setIncapacidades] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedIncapacidad, setSelectedIncapacidad] = useState(null);
  const [, setLoadingForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [isEditingForm, setIsEditingForm] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [savingForm, setSavingForm] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState({});
  // Nuevo: modal separado para campos administrativos
  const [showAdminModal, setShowAdminModal] = useState(false);
  // Eliminado: dropdownAbierto no se usa
  const [estadosIncapacidad, setEstadosIncapacidad] = useState([]);
  const [showChangeStateModal, setShowChangeStateModal] = useState(false);
  const [selectedIncapacidadForState, setSelectedIncapacidadForState] = useState(null);
  const [selectedNewState, setSelectedNewState] = useState(null);
  const [mensajeRechazo, setMensajeRechazo] = useState('');
  const [motivoNoPagas, setMotivoNoPagas] = useState('');
  const [loadingEstados, setLoadingEstados] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    loadIncapacidadesPendientes();
  }, []);

  // Eliminado: lógica de cierre de dropdowns no usada

  // Eliminado: cierre de dropdown por navegación

  // Eliminado: cierre de dropdown por scroll

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

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(incapacidades.length / ITEMS_PER_PAGE));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [incapacidades.length, currentPage, ITEMS_PER_PAGE]);

  const loadIncapacidadesPendientes = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Iniciando carga de incapacidades nuevas...');
      const response = await getIncapacidadesPendientes();
      console.log('📡 Respuesta completa del servicio:', response);
      console.log('📡 Tipo de respuesta:', typeof response);
      console.log('📡 Es array?', Array.isArray(response));
      console.log('📡 Tiene incapacidades?', 'incapacidades' in response);
      console.log('📡 Tiene estados_disponibles?', 'estados_disponibles' in response);
      
      // Manejar nueva estructura de respuesta
      if (response && typeof response === 'object' && 'incapacidades' in response) {
        const incapacidades = response.incapacidades || [];
        const estadosDisponibles = response.estados_disponibles || [];
        
        console.log('📊 Total de incapacidades Nuevas:', incapacidades.length);
        console.log('📋 Estados disponibles:', estadosDisponibles.length);
        console.log('📋 Estados cargados:', estadosDisponibles);
        
        setIncapacidades(incapacidades);
        setCurrentPage(1);
        setEstadosIncapacidad(estadosDisponibles);
        
        if (incapacidades.length > 0) {
          console.log('Primera incapacidad:', incapacidades[0]);
          console.log('Campos disponibles:', Object.keys(incapacidades[0]));
        }
      } else {
        // Fallback para estructura antigua
        console.log('📊 Total de incapacidades Nuevas:', response.length);
        setIncapacidades(response);
        setCurrentPage(1);
      }
    } catch (e) {
      console.error('Error al cargar incapacidades Nuevas:', e);
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


  const handleVerFormulario = async (incapacidad) => {
    try {
      setLoadingForm(true);
      // Abrir modal del formulario
      // Obtener detalles completos incluyendo documentos
      const detalles = await getIncapacidadDetalle(incapacidad.id_incapacidad);
      console.log('📥 Datos recibidos del backend:', detalles);
      console.log('📄 Documentos recibidos:', detalles.documentos);
      console.log('🔢 Cantidad de documentos:', detalles.documentos?.length || 0);
      if (detalles.documentos && detalles.documentos.length > 0) {
        console.log('📝 URLs de documentos:', detalles.documentos.map(d => d.url_documento));
      }
      console.log('EPS fields:', {
        Eps_id: detalles.Eps_id,
        eps_afiliado_nombre: detalles.eps_afiliado_nombre
      });
      console.log('Servicio fields:', {
        servicio_id: detalles.servicio_id,
        servicio_nombre: detalles.servicio_nombre
      });
      console.log('Diagnóstico fields:', {
        diagnostico_id: detalles.diagnostico_id,
        diagnostico_nombre: detalles.diagnostico_nombre
      });
      console.log('Valor final EPS:', detalles.eps_afiliado_nombre || 'No especificado');
      console.log('selectedIncapacidad después de setSelectedIncapacidad:', selectedIncapacidad);
      setSelectedIncapacidad(detalles);
      setEditData({
        clase_administrativa: detalles.clase_administrativa || '',
        numero_radicado: detalles.numero_radicado || '',
        fecha_radicado: detalles.fecha_radicado ? detalles.fecha_radicado.split('T')[0] : '',
        fecha_pago: detalles.fecha_pago ? detalles.fecha_pago.split('T')[0] : '',
        valor_pagado: detalles.valor_pago != null ? String(detalles.valor_pago) : '',
        estado: detalles.estado != null ? detalles.estado : ''
      });
      setEditFormData({
        fecha_inicio: detalles.fecha_inicio ? detalles.fecha_inicio.split('T')[0] : '',
        fecha_final: detalles.fecha_final ? detalles.fecha_final.split('T')[0] : '',
        dias: detalles.dias || 0,
        salario: detalles.salario || 0,
        eps_afiliado: detalles.eps_afiliado_nombre || '',
        servicio: detalles.servicio_nombre || '',
        diagnostico: detalles.diagnostico_nombre || ''
      });
      setIsEditing(false);
      setIsEditingForm(false);
      setShowFormModal(true);
    } catch (e) {
      alert('Error al cargar el formulario: ' + e.message);
    } finally {
      setLoadingForm(false);
    }
  };

  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleFormEditChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      // Enviar solo campos soportados por backend para administrativo (según columnas reales)
      // Backend espera 'valor_pago'
      const allowedKeys = ['valor_pago', 'numero_radicado', 'fecha_radicado', 'fecha_pago', 'estado'];
      const payloadRaw = Object.fromEntries(
        Object.entries({
          ...editData,
          fecha_radicado: editData.fecha_radicado ? new Date(editData.fecha_radicado).toISOString() : undefined,
          fecha_pago: editData.fecha_pago ? new Date(editData.fecha_pago).toISOString() : undefined,
          valor_pago: editData.valor_pagado !== '' && editData.valor_pagado != null ? Number(editData.valor_pagado) : undefined,
        }).filter(([k]) => allowedKeys.includes(k))
      );
      // Normalizar: remover llaves no usadas
      delete payloadRaw.paga;
      // mantener valor_pagado si existe
      delete payloadRaw.estado_administrativo;
      // Filtrar vacíos/undefined/null
      const payload = Object.fromEntries(
        Object.entries(payloadRaw).filter(([_, v]) => v !== null && v !== undefined && v !== '')
      );
      
      await actualizarIncapacidadAdministrativa(selectedIncapacidad.id_incapacidad, payload);
      alert('Incapacidad actualizada correctamente');
      
      // Recargar la lista
      await loadIncapacidadesPendientes();
      setShowFormModal(false);
    } catch (e) {
      alert('Error al guardar cambios: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // Abrir modal de campos administrativos desde la tabla principal
  const openAdminModal = async (incapacidad) => {
    try {
      // Cargar detalles para tener datos frescos
      const detalles = await getIncapacidadDetalle(incapacidad.id_incapacidad);
      setSelectedIncapacidad(detalles);
      setEditData({
        clase_administrativa: detalles.clase_administrativa || '',
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

  const handleSaveFormChanges = async () => {
    try {
      setSavingForm(true);
      
      const payload = {
        fecha_inicio: editFormData.fecha_inicio ? new Date(editFormData.fecha_inicio).toISOString() : null,
        fecha_final: editFormData.fecha_final ? new Date(editFormData.fecha_final).toISOString() : null,
        dias: parseInt(editFormData.dias) || null,
        salario: parseFloat(editFormData.salario) || null,
        eps_afiliado_id: null, // TODO: Implementar búsqueda por nombre si es necesario
        servicio_id: null, // TODO: Implementar búsqueda por nombre si es necesario
        diagnostico_id: null // TODO: Implementar búsqueda por nombre si es necesario
      };
      
      // Filtrar valores nulos
      const filteredPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, value]) => value !== null)
      );
      
      await actualizarIncapacidadFormulario(selectedIncapacidad.id_incapacidad, filteredPayload);
      alert('Datos del formulario actualizados correctamente');
      
      // Recargar la lista
      await loadIncapacidadesPendientes();
      setShowFormModal(false);
    } catch (e) {
      alert('Error al guardar cambios del formulario: ' + e.message);
    } finally {
      setSavingForm(false);
    }
  };

  const handleOpenChangeStateModal = async (incapacidad) => {
    setSelectedIncapacidadForState(incapacidad);
    setSelectedNewState(null);
    setMensajeRechazo('');
    setMotivoNoPagas('');
    
    // Cargar estados disponibles
    try {
      setLoadingEstados(true);
      const estados = await getEstadosIncapacidad();
      setEstadosIncapacidad(estados);
      console.log('Estados cargados:', estados);
    } catch (e) {
      console.error('Error al cargar estados:', e);
      alert('Error al cargar estados: ' + e.message);
    } finally {
      setLoadingEstados(false);
    }
    
    setShowChangeStateModal(true);
  };

  const handlePageChange = (page) => {
    const totalPages = Math.max(1, Math.ceil(incapacidades.length / ITEMS_PER_PAGE));
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
        if (!mensajeRechazo || mensajeRechazo.trim() === '') {
          alert('Debe ingresar un motivo para rechazar la incapacidad');
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
      
      const estadoAEnviar = selectedNewState;
      const diasParaRegla = Number(selectedIncapacidadForState.dias) || 0;

      console.log('📡 Llamando a cambiarEstadoIncapacidad...', { estadoAEnviar });
      const resp = await cambiarEstadoIncapacidad(incapacidadId, estadoAEnviar, mensajeRechazoValue, motivoNoPagasValue);
      console.log('✅ Respuesta recibida:', resp);
      
      // Construir mensaje desde backend (message + warning opcional)
      const baseMsg = resp && resp.message ? resp.message : `Estado cambiado exitosamente`;
      const warning = resp && resp.warning ? `\n\n⚠️ ${resp.warning}` : '';
      
      // Mensaje específico según el estado
      if (estadoAEnviar === 50) {
        alert(`✅ ${baseMsg}\n📧 Se intentó enviar notificación por correo al empleado.${warning}`);
      } else {
        alert(`✅ ${baseMsg}`);
      }
      
      // Navegación según el estado seleccionado
      if (estadoAEnviar === 12) {
          navigate('/admin/incapacidades-tramite-de-eps');
          return;
      } else if (estadoAEnviar === 44) {
          navigate('/admin/incapacidades-historial');
          return;
      }

      // Cerrar modal y recargar lista
      setShowChangeStateModal(false);
      setSelectedIncapacidadForState(null);
      setSelectedNewState(null);
      setMensajeRechazo('');
      
      // Recargar la lista
      console.log('🔄 Recargando incapacidades...');
      await loadIncapacidadesPendientes();
    } catch (e) {
      console.error('❌ Error en handleConfirmStateChange:', e);
      alert('Error al cambiar estado: ' + e.message);
    } finally {
      setCambiandoEstado(prev => ({ ...prev, [incapacidadId]: false }));
    }
  };

  // Eliminado handleCambiarEstado (no usado)

  // Eliminado toggleDropdown (no usado)

  // Nota: manejamos cierre de dropdowns con los listeners globales y setDropdownAbierto({})

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
                <button 
                  className="btn btn-sm btn-outline"
                  onClick={() => setIsEditingForm(!isEditingForm)}
                >
                  {isEditingForm ? '❌ Cancelar' : '✏️ Editar'}
                </button>
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
                  {isEditingForm ? (
                    <input
                      type="date"
                      value={editFormData.fecha_inicio}
                      onChange={(e) => handleFormEditChange('fecha_inicio', e.target.value)}
                      className="input elegant-input"
                    />
                  ) : (
                    <div className="field-value">{formatDate(selectedIncapacidad.fecha_inicio)}</div>
                  )}
                </div>
                <div className="form-field">
                  <label className="field-label">📅 Fecha de Fin</label>
                  {isEditingForm ? (
                    <input
                      type="date"
                      value={editFormData.fecha_final}
                      onChange={(e) => handleFormEditChange('fecha_final', e.target.value)}
                      className="input elegant-input"
                    />
                  ) : (
                    <div className="field-value">{formatDate(selectedIncapacidad.fecha_final)}</div>
                  )}
                </div>
                <div className="form-field">
                  <label className="field-label">📊 Días</label>
                  {isEditingForm ? (
                    <input
                      type="number"
                      value={editFormData.dias}
                      onChange={(e) => handleFormEditChange('dias', e.target.value)}
                      className="input elegant-input"
                      min="1"
                    />
                  ) : (
                    <div className="field-value">{selectedIncapacidad.dias}</div>
                  )}
                </div>
                <div className="form-field">
                  <label className="field-label">💰 Salario</label>
                  {isEditingForm ? (
                    <input
                      type="number"
                      value={editFormData.salario}
                      onChange={(e) => handleFormEditChange('salario', e.target.value)}
                      className="input elegant-input"
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    <div className="field-value">${selectedIncapacidad.salario ? Number(selectedIncapacidad.salario).toLocaleString() : '0'}</div>
                  )}
                </div>
                <div className="form-field">
                  <label className="field-label">🏥 EPS</label>
                  {isEditingForm ? (
                    <input
                      type="text"
                      value={editFormData.eps_afiliado}
                      onChange={(e) => handleFormEditChange('eps_afiliado', e.target.value)}
                      className="input elegant-input"
                      placeholder="EPS del empleado"
                    />
                  ) : (
                    <div className="field-value">
                      {selectedIncapacidad.eps_afiliado_nombre || 'No especificado'}
                    </div>
                  )}
                </div>
                <div className="form-field">
                  <label className="field-label">🔬 Servicio</label>
                  {isEditingForm ? (
                    <input
                      type="text"
                      value={editFormData.servicio}
                      onChange={(e) => handleFormEditChange('servicio', e.target.value)}
                      className="input elegant-input"
                      placeholder="Servicio médico"
                    />
                  ) : (
                    <div className="field-value">
                      {selectedIncapacidad.servicio_nombre || 'No especificado'}
                    </div>
                  )}
                </div>
                <div className="form-field full-width">
                  <label className="field-label">🩺 Diagnóstico</label>
                  {isEditingForm ? (
                    <textarea
                      value={editFormData.diagnostico}
                      onChange={(e) => handleFormEditChange('diagnostico', e.target.value)}
                      className="input elegant-input"
                      placeholder="Diagnóstico médico"
                      rows="3"
                    />
                  ) : (
                    <div className="field-value">
                      {selectedIncapacidad.diagnostico_nombre || 'No especificado'}
                    </div>
                  )}
                </div>
                <div className="form-field">
                  <label className="field-label">📊 Estado</label>
                  <div className="field-value">
                    <span className={`status-${selectedIncapacidad.estado}`}>{getEstadoText(selectedIncapacidad.estado)}</span>
                  </div>
                </div>
                <div className="form-field">
                  <label className="field-label">📅 Fecha de Registro</label>
                  <div className="field-value">{formatDate(selectedIncapacidad.fecha_registro)}</div>
                </div>
                {selectedIncapacidad.causa_incapacidad && (
                  <div className="form-field">
                    <label className="field-label">🔍 Causa de Incapacidad</label>
                    <div className="field-value">{selectedIncapacidad.causa_incapacidad}</div>
                  </div>
                )}
                {selectedIncapacidad.clase && (
                  <div className="form-field">
                    <label className="field-label">📋 Clase</label>
                    <div className="field-value">{selectedIncapacidad.clase}</div>
                  </div>
                )}
                {selectedIncapacidad.numero_radicado && (
                  <div className="form-field">
                    <label className="field-label">🔢 Número Radicado</label>
                    <div className="field-value">{selectedIncapacidad.numero_radicado}</div>
                  </div>
                )}
                {selectedIncapacidad.fecha_radicado && (
                  <div className="form-field">
                    <label className="field-label">📅 Fecha Radicado</label>
                    <div className="field-value">{formatDate(selectedIncapacidad.fecha_radicado)}</div>
                  </div>
                )}
                <div className="form-field">
                  <label className="field-label">💰 Valor pagado</label>
                  <div className="field-value">
                    {(() => {
                      const vp = (selectedIncapacidad.valor_pago ?? selectedIncapacidad.valor_pagado ?? (typeof editData !== 'undefined' ? editData.valor_pagado : undefined));
                      return (vp !== null && vp !== undefined && vp !== '')
                        ? `$${Number(vp).toLocaleString()}`
                        : (selectedIncapacidad.paga ? '✅ Sí' : '❌ No');
                    })()}
                  </div>
                </div>
              </div>

              {isEditingForm && (
                <div className="form-actions">
                  <button 
                    className="btn btn-primary btn-save"
                    onClick={handleSaveFormChanges}
                    disabled={savingForm}
                  >
                    {savingForm ? '⏳ Guardando...' : '💾 Guardar Cambios del Formulario'}
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setIsEditingForm(false)}
                  >
                    ❌ Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Documentos Subidos */}
          <div className="card elegant-card">
            <div className="card-header elegant-header">
              <div className="header-content">
                <h3 className="card-title">📄 Documentos Subidos por el Empleado</h3>
                <span className="document-count">{documentos.length} documento{documentos.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <div className="card-body">
              {documentos.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📁</div>
                  <p className="empty-text">No hay documentos subidos</p>
                </div>
              ) : (
                <div className="documents-grid">
                  {documentos.map((doc, index) => {
                    // Si url_documento empieza con http/https, es una URL completa (Google Drive), usarla directamente
                    // Si no, asumir que es un path local y construir la URL completa
                    let href = '#';
                    if (doc.url_documento) {
                      if (doc.url_documento.startsWith('http://') || doc.url_documento.startsWith('https://')) {
                        href = doc.url_documento; // URL completa de Google Drive
                      } else {
                    const backendBase = window.location.origin.replace(':3000', ':8000');
                        href = `${backendBase}/uploads/${doc.url_documento}`;
                      }
                    }
                    
                    // Determinar nombre legible del tipo de documento
                    const nombreArchivoCrudo = doc.url_documento 
                      ? doc.url_documento.split('/').pop() || doc.url_documento.split('\\').pop() || doc.url_documento
                      : `documento_${index + 1}`;
                    const nombreDocumento =
                      doc.nombre_archivo ||
                      doc.archivo_nombre ||
                      doc.nombre ||
                      (doc.archivo_id === 1 ? 'historia clínica' : (doc.archivo_id === 2 ? 'incapacidad' : nombreArchivoCrudo));
                    
                    return (
                      <div key={index} className="document-card">
                        <div className="document-icon">📄</div>
                        <div className="document-info">
                          <h4 className="document-name" style={{ textTransform: 'capitalize' }}>{nombreDocumento}</h4>
                          <p className="document-date">📅 Subido: {formatDate(doc.fecha_subida)}</p>
                        </div>
                        <div className="document-actions">
                          <a 
                            href={href} 
                            target="_blank" 
                            rel="noreferrer"
                            className="btn btn-sm btn-primary"
                          >
                            👁️ Ver
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Se eliminó la tarjeta de Campos Administrativos dentro del formulario (solo lectura) */}

          {/* Botones de Acción */}
          <div className="modal-actions">
            <button 
              className="btn btn-primary btn-large"
              onClick={() => {
                // TODO: Implementar revisión de incapacidad
                alert('Función de revisión pendiente de implementar');
              }}
            >
              🔍 Revisar Incapacidad
            </button>
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
      <div style={{ padding: 20 }}>
        <h1>Incapacidades Nuevas</h1>
        <p>Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Incapacidades Nuevas</h1>
        <p style={{ color: 'red' }}>Error: {error}</p>
        <button onClick={loadIncapacidadesPendientes} className="btn btn-primary">
          Reintentar
        </button>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(incapacidades.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedIncapacidades = incapacidades.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const showingFrom = incapacidades.length === 0 ? 0 : startIndex + 1;
  const showingTo = startIndex + paginatedIncapacidades.length;

  return (
    <div className="admin-pages-container">
      <h1 className="admin-pages-title">INCAPACIDADES NUEVAS</h1>
      <div className="admin-pages-content">
        {error && <div className="admin-error"><h1>INCAPACIDADES NUEVAS</h1><p>{error}</p></div>}
        
        <div className="admin-filter-container">
      </div>

        {loading ? (
          <div className="admin-loading">
            <h1>INCAPACIDADES NUEVAS</h1>
            <p>Cargando...</p>
          </div>
        ) : (
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
                {incapacidades.length === 0 && (
                  <tr>
                    <td colSpan={7} className="muted" style={{ padding: 16, textAlign: 'center' }}>
                      No hay incapacidades nuevas
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
                        >
                          Ver Detalle
                        </button>
                        <button 
                          className="admin-btn admin-btn-outline admin-btn-sm"
                          onClick={() => openAdminModal(incapacidad)}
                          style={{ marginLeft: 8 }}
                        >
                          Campo Admin
                        </button>
                        
                        {/* Dropdown de cambio de estado */}
                        <div className="admin-dropdown-container">
                          <button 
                            className="admin-btn admin-btn-secondary admin-btn-sm"
                            onClick={() => handleOpenChangeStateModal(incapacidad)}
                            disabled={cambiandoEstado[incapacidad.id_incapacidad]}
                          >
                            {cambiandoEstado[incapacidad.id_incapacidad] ? 'Cambiando...' : 'Cambiar Estado'}
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {incapacidades.length > 0 && (
              <div
                className="pagination-controls"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 16,
                  gap: 12,
                  flexWrap: 'wrap'
                }}
              >
                <span style={{ fontSize: 14, color: '#4b5563' }}>
                  Mostrando {showingFrom}-{showingTo} de {incapacidades.length} incapacidades
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    className="admin-btn admin-btn-outline admin-btn-sm"
                    onClick={() => handlePageChange(safeCurrentPage - 1)}
                    disabled={safeCurrentPage === 1}
                  >
                    ◀️ Anterior
                  </button>
                  <span style={{ fontSize: 14, color: '#374151' }}>
                    Página {safeCurrentPage} de {totalPages}
                  </span>
                  <button
                    className="admin-btn admin-btn-outline admin-btn-sm"
                    onClick={() => handlePageChange(safeCurrentPage + 1)}
                    disabled={safeCurrentPage === totalPages || incapacidades.length === 0}
                  >
                    Siguiente ▶️
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <FormularioModal />
      
      {/* Modal de Cambio de Estado */}
      {showChangeStateModal && selectedIncapacidadForState && (
        <ScrollableModal
          open={showChangeStateModal}
          title="🔄 Cambiar Estado de Incapacidad"
          onClose={() => {
            setShowChangeStateModal(false);
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
                      setShowChangeStateModal(false);
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

      {/* Modal separado: Campos Administrativos */}
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
                    onClick={async () => {
                      await handleSaveChanges();
                      setShowAdminModal(false);
                    }}
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
    </div>
  );
}


