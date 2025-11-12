import React, { useState, useEffect } from 'react';
import { getIncapacidadesRechazadas, cambiarEstadoIncapacidad } from '../../services/incapacidades';
// import { actualizarIncapacidadFormulario } from '../../services/incapacidades';
// import ScrollableModal from '../../shared/components/ScrollableModal';
import '../../styles/admin-parametros.css';
import '../../styles/admin-pages-blue.css';

export default function AdminIncapacidadesRechazadas() {
  const [incapacidades, setIncapacidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cambiandoEstado, setCambiandoEstado] = useState({});
  const [dropdownAbierto, setDropdownAbierto] = useState({});
  const [estadosIncapacidad, setEstadosIncapacidad] = useState([]);
  // Variables no utilizadas actualmente (comentadas para uso futuro)
  // const [selectedIncapacidad, setSelectedIncapacidad] = useState(null);
  // const [showModal, setShowModal] = useState(false);
  // const [showFormModal, setShowFormModal] = useState(false);
  // const [loadingForm, setLoadingForm] = useState(false);
  // const [saving, setSaving] = useState(false);
  // const [savingForm, setSavingForm] = useState(false);
  // const [editData, setEditData] = useState({});
  // const [editFormData, setEditFormData] = useState({});
  

  useEffect(() => {
    loadIncapacidadesRechazadas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleCambiarEstado = async (incapacidadId, nuevoEstado) => {
    try {
      setCambiandoEstado(prev => ({ ...prev, [incapacidadId]: true }));
      setDropdownAbierto(prev => ({ ...prev, [incapacidadId]: false }));

      let mensajeRechazo = null;
      
      // Si es rechazo, pedir mensaje
      if (nuevoEstado === 50) {
        mensajeRechazo = prompt('❌ RECHAZAR INCAPACIDAD\n\nIngrese el motivo del rechazo:\n(Este mensaje se enviará por correo al empleado)');
        if (!mensajeRechazo || mensajeRechazo.trim() === '') {
          alert('❌ Debe ingresar un motivo para rechazar la incapacidad.\nEl empleado necesita saber por qué fue rechazada.');
          setCambiandoEstado(prev => ({ ...prev, [incapacidadId]: false }));
          return;
        }
      }

      const resp = await cambiarEstadoIncapacidad(incapacidadId, nuevoEstado, mensajeRechazo);
      
      // Construir mensaje desde backend (message + warning opcional)
      const baseMsg = resp && resp.message ? resp.message : `Estado cambiado a ${getEstadoText(nuevoEstado)}`;
      const warning = resp && resp.warning ? `\n\n⚠️ ${resp.warning}` : '';
      
      // Mensaje específico según el estado
      if (nuevoEstado === 50) {
        alert(`✅ ${baseMsg}\n📧 Se intentó enviar notificación por correo al empleado.${warning}`);
      } else {
        alert(`✅ ${baseMsg}`);
      }
      
      // Recargar la lista
      await loadIncapacidadesRechazadas();
    } catch (e) {
      alert('Error al cambiar estado: ' + e.message);
    } finally {
      setCambiandoEstado(prev => ({ ...prev, [incapacidadId]: false }));
    }
  };

  const toggleDropdown = (incapacidadId, event) => {
    // Cerrar otros dropdowns primero
    setDropdownAbierto(prev => {
      const nuevoEstado = {
        ...prev,
        [incapacidadId]: !prev[incapacidadId]
      };
      return nuevoEstado;
    });

    // Posicionar el dropdown si se está abriendo
    if (!dropdownAbierto[incapacidadId]) {
      setTimeout(() => {
        const button = event.target;
        const dropdown = button.nextElementSibling;
        if (dropdown) {
          const rect = button.getBoundingClientRect();
          dropdown.style.position = 'fixed';
          dropdown.style.top = `${rect.bottom + 5}px`;
          dropdown.style.left = `${rect.left}px`;
          dropdown.style.zIndex = '9999';
        }
      }, 0);
    }
  };

  const loadIncapacidadesRechazadas = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Iniciando carga de incapacidades Rechazadas...');
      const response = await getIncapacidadesRechazadas();
      console.log('📡 Respuesta completa del servicio:', response);
      console.log('📡 Tipo de respuesta:', typeof response);
      console.log('📡 Es array?', Array.isArray(response));
      console.log('📡 Tiene incapacidades?', 'incapacidades' in response);
      console.log('📡 Tiene estados_disponibles?', 'estados_disponibles' in response);
      
      // Manejar nueva estructura de respuesta
      if (response && typeof response === 'object' && 'incapacidades' in response) {
        const incapacidadesData = response.incapacidades || [];
        const estadosDisponibles = response.estados_disponibles || [];
        
        console.log('📊 Total de incapacidades Rechazadas:', incapacidadesData.length);
        console.log('📋 Estados disponibles:', estadosDisponibles.length);
        console.log('📋 Estados cargados:', estadosDisponibles);
        
        setIncapacidades(incapacidadesData);
        setEstadosIncapacidad(estadosDisponibles);
        
        if (incapacidadesData.length > 0) {
          console.log('Primera incapacidad:', incapacidadesData[0]);
          console.log('Campos disponibles:', Object.keys(incapacidadesData[0]));
          console.log('🔍 DEBUG AdminIncapacidadesRechazadas - Tipo de incapacidad:', {
            tipo_incapacidad_nombre: incapacidadesData[0].tipo_incapacidad_nombre,
            tipo_nombre: incapacidadesData[0].tipo_nombre,
            tipo_incapacidad: incapacidadesData[0].tipo_incapacidad,
            tipo_incapacidad_id: incapacidadesData[0].tipo_incapacidad_id
          });
          console.log('🔍 DEBUG AdminIncapacidadesRechazadas - Motivo de rechazo:', {
            mensaje_rechazo: incapacidadesData[0].mensaje_rechazo,
            motivo_rechazo: incapacidadesData[0].motivo_rechazo
          });
          console.log('🔍 DEBUG AdminIncapacidadesRechazadas - Resultado función helper:', getTipoIncapacidadNombre(incapacidadesData[0]));
        }
      } else {
        // Fallback para estructura antigua
        console.log('📊 Total de incapacidades Rechazadas:', response.length);
        setIncapacidades(response);
      }
    } catch (e) {
      console.error('Error al cargar incapacidades Rechazadas:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Formateo simple de fechas
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try { return new Date(dateString).toLocaleDateString('es-ES'); } catch (_) { return 'N/A'; }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-ES', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (_) {
      return 'N/A';
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

  
  // Acciones deshabilitadas: no se permite modificar/gestionar desde este cuadro

  // Función para ver formulario (no utilizada actualmente)
  // const handleVerFormulario = async (incapacidad) => {
  //   try {
  //     setLoadingForm(true);
  //     // Obtener detalles completos incluyendo documentos
  //     const detalles = await getIncapacidadDetalle(incapacidad.id_incapacidad);
  //     console.log('Datos recibidos del backend:', detalles);
  //     console.log('EPS fields:', {
  //       Eps_id: detalles.Eps_id,
  //       eps_afiliado_nombre: detalles.eps_afiliado_nombre
  //     });
  //     console.log('Servicio fields:', {
  //       servicio_id: detalles.servicio_id,
  //       servicio_nombre: detalles.servicio_nombre
  //     });
  //     console.log('Diagnóstico fields:', {
  //       diagnostico_id: detalles.diagnostico_id,
  //       diagnostico_nombre: detalles.diagnostico_nombre
  //     });
  //     console.log('Valor final EPS:', detalles.eps_afiliado_nombre || 'No especificado');
  //     console.log('selectedIncapacidad después de setSelectedIncapacidad:', selectedIncapacidad);
  //     setSelectedIncapacidad(detalles);
  //     setEditFormData({
  //       fecha_inicio: detalles.fecha_inicio ? detalles.fecha_inicio.split('T')[0] : '',
  //       fecha_final: detalles.fecha_final ? detalles.fecha_final.split('T')[0] : '',
  //       dias: detalles.dias || '',
  //       salario: detalles.salario || '',
  //       eps_afiliado: detalles.eps_afiliado_nombre || detalles.eps_afiliado || '',
  //       servicio: detalles.servicio_nombre || detalles.servicio || '',
  //       diagnostico: detalles.diagnostico_nombre || detalles.diagnostico || ''
  //     });
  //     setShowFormModal(true);
  //   } catch (e) {
  //     alert('Error al cargar detalles: ' + e.message);
  //   } finally {
  //     setLoadingForm(false);
  //   }
  // };

  // const handleSave = async () => {}; // no usado

  // Función para guardar cambios del formulario (no utilizada actualmente)
  // const handleSaveFormChanges = async () => {
  //   try {
  //     setSavingForm(true);
      
  //     const payload = {
  //       fecha_inicio: editFormData.fecha_inicio ? new Date(editFormData.fecha_inicio).toISOString() : null,
  //       fecha_final: editFormData.fecha_final ? new Date(editFormData.fecha_final).toISOString() : null,
  //       dias: parseInt(editFormData.dias) || null,
  //       salario: parseFloat(editFormData.salario) || null,
  //       eps_afiliado_id: null, // TODO: Implementar búsqueda por nombre si es necesario
  //       servicio_id: null, // TODO: Implementar búsqueda por nombre si es necesario
  //       diagnostico_id: null // TODO: Implementar búsqueda por nombre si es necesario
  //     };
      
  //     // Filtrar valores nulos
  //     const filteredPayload = Object.fromEntries(
  //       Object.entries(payload).filter(([_, value]) => value !== null)
  //     );
      
  //     await actualizarIncapacidadFormulario(selectedIncapacidad.id_incapacidad, filteredPayload);
  //     alert('Datos del formulario actualizados correctamente');
      
  //     // Recargar la lista
  //     await loadIncapacidadesRechazadas();
  //     setShowFormModal(false);
  //   } catch (e) {
  //     alert('Error al guardar cambios del formulario: ' + e.message);
  //   } finally {
  //     setSavingForm(false);
  //   }
  // };

  

  // const cerrarDropdown = () => {}; // no usado

  // Componente FormularioModal (no utilizado actualmente)
  // const FormularioModal = () => {
  //   if (!showFormModal || !selectedIncapacidad) return null;

  //   return (
  //     <ScrollableModal
  //       isOpen={showFormModal}
  //       onClose={() => setShowFormModal(false)}
  //       title="Datos del Formulario Original"
  //       maxWidth="800px"
  //     >
  //       <div className="form-grid">
  //         <div className="field">
  //           <label>Fecha de Inicio</label>
  //           <input
  //             type="date"
  //             value={editFormData.fecha_inicio}
  //             onChange={(e) => setEditFormData(prev => ({ ...prev, fecha_inicio: e.target.value }))}
  //             className="input"
  //           />
  //         </div>
          
  //         <div className="field">
  //           <label>Fecha de Fin</label>
  //           <input
  //             type="date"
  //             value={editFormData.fecha_final}
  //             onChange={(e) => setEditFormData(prev => ({ ...prev, fecha_final: e.target.value }))}
  //             className="input"
  //           />
  //         </div>
          
  //         <div className="field">
  //           <label>Días</label>
  //           <input
  //             type="number"
  //             value={editFormData.dias}
  //             onChange={(e) => setEditFormData(prev => ({ ...prev, dias: e.target.value }))}
  //             className="input"
  //           />
  //         </div>
          
  //         <div className="field">
  //           <label>Salario</label>
  //           <input
  //             type="number"
  //             step="0.01"
  //             value={editFormData.salario}
  //             onChange={(e) => setEditFormData(prev => ({ ...prev, salario: e.target.value }))}
  //             className="input"
  //           />
  //         </div>
          
  //         <div className="field">
  //           <label>EPS</label>
  //           <input
  //             type="text"
  //             value={editFormData.eps_afiliado}
  //             onChange={(e) => setEditFormData(prev => ({ ...prev, eps_afiliado: e.target.value }))}
  //             className="input"
  //           />
  //         </div>
          
  //         <div className="field">
  //           <label>Servicio</label>
  //           <input
  //             type="text"
  //             value={editFormData.servicio}
  //             onChange={(e) => setEditFormData(prev => ({ ...prev, servicio: e.target.value }))}
  //             className="input"
  //           />
  //         </div>
          
  //         <div className="field">
  //           <label>Diagnóstico</label>
  //           <input
  //             type="text"
  //             value={editFormData.diagnostico}
  //             onChange={(e) => setEditFormData(prev => ({ ...prev, diagnostico: e.target.value }))}
  //             className="input"
  //           />
  //         </div>
  //       </div>
        
  //       <div className="form-actions">
  //         <button
  //           className="btn btn-secondary"
  //           onClick={() => setShowFormModal(false)}
  //           disabled={savingForm}
  //         >
  //           Cancelar
  //         </button>
  //         <button
  //           className="btn btn-save"
  //           onClick={handleSaveFormChanges}
  //           disabled={savingForm}
  //         >
  //           {savingForm ? 'Guardando...' : '💾 Guardar Cambios del Formulario'}
  //         </button>
  //       </div>
  //     </ScrollableModal>
  //   );
  // };

  if (loading) {
    return (
      <div className="container">
        <div className="elegant-card">
          <div className="elegant-header">
            <h1>Incapacidades Rechazadas</h1>
          </div>
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-icon">⏳</div>
              <p className="empty-text">Cargando incapacidades rechazadas...</p>
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
            <h1>Incapacidades Rechazadas</h1>
          </div>
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-icon">❌</div>
              <p className="empty-text">Error: {error}</p>
              <button className="btn btn-primary" onClick={loadIncapacidadesRechazadas}>
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
      <h1 className="admin-pages-title">INCAPACIDADES RECHAZADAS</h1>
      <div className="admin-pages-content">
        {error && <div className="admin-error"><h1>INCAPACIDADES RECHAZADAS</h1><p>{error}</p></div>}
        
        <div className="admin-filter-container">
        </div>
        
        {loading ? (
          <div className="admin-loading">
            <h1>INCAPACIDADES RECHAZADAS</h1>
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
                <th>Motivo de Rechazo</th>
                <th>Fecha de Registro</th>
                <th></th>
                    </tr>
                  </thead>
                  <tbody>
              {incapacidades.length === 0 && (
                <tr>
                  <td colSpan={8} className="muted" style={{ padding: 16, textAlign: 'center' }}>
                    No hay incapacidades rechazadas
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
                  <td style={{ maxWidth: '200px', wordWrap: 'break-word' }}>
                    {incapacidad.mensaje_rechazo || incapacidad.motivo_rechazo || 'Sin motivo especificado'}
                  </td>
                  <td>{formatDateTime(incapacidad.fecha_registro)}</td>
                  <td></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
          )}
      </div>
    </div>
  );
}
