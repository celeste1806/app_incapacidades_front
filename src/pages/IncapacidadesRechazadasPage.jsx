import React, { useEffect, useState } from 'react';
import { getMisIncapacidades } from '../services/incapacidades';
import { getArchivosPorTipo } from '../services/relacion';
import { uploadIncapacidadArchivo } from '../services/upload';
import '../styles/rechazadas-modal.css';
import '../styles/rechazadas.css';

export default function IncapacidadesRechazadasPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [requiredFiles, setRequiredFiles] = useState([]); // catálogo de archivos requeridos por tipo
  const [filesToUpload, setFilesToUpload] = useState({}); // archivo_id -> File
  

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError('');
        const mis = await getMisIncapacidades();
        console.log('🔍 DEBUG IncapacidadesRechazadasPage - Datos recibidos de getMisIncapacidades:', mis);
        console.log('🔍 DEBUG IncapacidadesRechazadasPage - Total incapacidades:', mis.length);
        console.log('🔍 DEBUG IncapacidadesRechazadasPage - Estados encontrados:', mis.map(inc => ({ id: inc.id_incapacidad, estado: inc.estado })));
        // Filtrar solo las incapacidades rechazadas (estado 50)
        const rechazadas = Array.isArray(mis) ? mis.filter(inc => inc.estado === 50) : [];
        console.log('🔍 DEBUG IncapacidadesRechazadasPage - Incapacidades rechazadas filtradas:', rechazadas.length);
        setRows(rechazadas);
      } catch (e) {
        setError(e.message || 'Error cargando incapacidades rechazadas');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const formatDate = (s) => (s ? new Date(s).toLocaleDateString('es-ES') : '');

  const onOpenEdit = (row) => {
    setSelected(row);
    // cargar requeridos por tipo
    (async () => {
      try {
        const list = await getArchivosPorTipo(row.tipo_incapacidad_id);
        setRequiredFiles(Array.isArray(list) ? list : []);
      } catch (_) { setRequiredFiles([]); }
    })();
    setShowModal(true);
  };

  const onSubmit = async () => {
    if (!selected) return;
    
    // Validar que hay al menos un archivo seleccionado
    const tieneArchivos = Object.keys(filesToUpload).some(key => filesToUpload[key]);
    if (!tieneArchivos) {
      alert('⚠️ Debes seleccionar al menos un archivo para modificar antes de enviar.');
      return;
    }
    
    try {
      setSubmitting(true);
      const incapacidadId = selected.id_incapacidad || selected.id;
      
      // 1. Subir documentos si hay archivos nuevos seleccionados
      let archivosSubidos = 0;
      console.log('📤 Iniciando subida de archivos...');
      console.log('📦 Archivos a subir:', Object.keys(filesToUpload));
      console.log('📋 Archivos requeridos:', requiredFiles);
      
      for (const req of requiredFiles) {
        const archivoId = req.id_archivo || req.archivo_id || req.id;
        const file = filesToUpload[archivoId];
        console.log(`📄 Procesando archivo ${archivoId}:`, file ? file.name : 'No seleccionado');
        if (archivoId && file) {
          try {
            console.log(`⬆️ Subiendo archivo ${archivoId} (${file.name})...`);
            const result = await uploadIncapacidadArchivo({ file, incapacidadId, archivoId });
            console.log('✅ Archivo subido exitosamente:', archivoId, result);
            archivosSubidos++;
          } catch (e) {
            console.error('❌ Error al subir archivo:', archivoId, e);
            // continuar con los demás
          }
        }
      }
      
      console.log(`📊 Total de archivos subidos: ${archivosSubidos}`);
      
      // 2. Reenviar la incapacidad (cambiar estado de 50 a 11) solo si se subieron archivos
      if (archivosSubidos > 0) {
        try {
          // Llamar al endpoint POST /api/incapacidad/mias/{id}/reenviar que solo cambia el estado
          const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
          console.log('📤 Reenviando incapacidad:', incapacidadId);
          
          const response = await fetch(`/api/incapacidad/mias/${incapacidadId}/reenviar`, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({}),
          });
          
          console.log('📥 Respuesta del reenvío:', response.status, response.statusText);
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Error al reenviar:', errorData);
            throw new Error(errorData.detail || 'Error al reenviar la incapacidad');
          }
          
          const responseData = await response.json();
          console.log('✅ Incapacidad reenviada:', responseData);
          
          alert(`✅ ${archivosSubidos} archivo(s) actualizado(s) e incapacidad reenviada exitosamente.`);
        } catch (e) {
          console.error('Error al reenviar incapacidad:', e);
          alert('Error al reenviar la incapacidad: ' + (e.message || 'Error desconocido'));
          return;
        }
      } else {
        alert('⚠️ No se pudieron subir los archivos. Por favor, intenta nuevamente.');
        return;
      }
      
      setShowModal(false);
      setFilesToUpload({});
      
      // Recargar la lista para remover la incapacidad reenviada
      const mis = await getMisIncapacidades();
      const rechazadas = Array.isArray(mis) ? mis.filter(inc => inc.estado === 50) : [];
      setRows(rechazadas);
    } catch (e) {
      alert('Error al enviar: ' + (e.message || 'Error desconocido'));
    } finally {
      setSubmitting(false);
    }
  };

  // Vista simplificada: sin modal ni carga de documentos adicionales

  if (loading) return <div className="rechazadas-loading"><h1>Incapacidades Rechazadas</h1><p>Cargando...</p></div>;
  if (error) return <div className="rechazadas-error"><h1>Incapacidades Rechazadas</h1><p>{error}</p></div>;

  const content = (
    <div className="rechazadas-container">
      <h1 className="rechazadas-title">INCAPACIDADES RECHAZADAS</h1>
      <div className="rechazadas-content">
        <div className="rechazadas-header">
          Incapacidades rechazadas por el administrador
        </div>

        <div className="rechazadas-body">
          
          {(!rows || rows.length === 0) && (
            <div className="rechazadas-empty">
              <div className="rechazadas-empty-icon">✅</div>
              <div className="rechazadas-empty-title">No tienes incapacidades rechazadas</div>
              <div className="rechazadas-empty-subtitle">Todas tus incapacidades han sido aprobadas o están en proceso</div>
            </div>
          )}

          {rows && rows.length > 0 && (
            <div className="rechazadas-table">
              <div className="rechazadas-table-header">
                <div>Fecha creación</div>
                <div>Diagnóstico</div>
                <div>Inicio</div>
                <div>Fin</div>
                <div>Días</div>
                <div>Motivo de rechazo / Acciones</div>
              </div>
              <div>
                {rows.map((row) => {
                  const id = row.id_incapacidad || row.id;
                  return (
                    <div key={id} className="rechazadas-table-row">
                      <div className="rechazadas-table-cell">{formatDate(row.fecha_registro)}</div>
                      <div className="rechazadas-table-cell">{row.diagnostico || row.diagnostico_id || ''}</div>
                      <div className="rechazadas-table-cell">{formatDate(row.fecha_inicio)}</div>
                      <div className="rechazadas-table-cell">{formatDate(row.fecha_final)}</div>
                      <div className="rechazadas-table-cell">{row.dias}</div>
                      <div className="rechazadas-table-cell">
                        <div className="rechazadas-actions-container">
                          <div className="rechazadas-motivo">{row.mensaje_rechazo || row.motivo_rechazo || row.motivo || row.mensaje || ''}</div>
                          <button 
                            onClick={() => onOpenEdit(row)} 
                            className="rechazadas-btn-modify"
                          >
                            📝 Modificar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  return (
    <>
      {content}
      {showModal && selected && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Modificar archivos</h3>
              <button onClick={() => setShowModal(false)} className="modal-close">✕</button>
            </div>
            <div className="modal-body">
              {/* Solo archivos: ocultamos edición de fechas/días/salario */}
              <div className="files-title">Subir/Actualizar documentos</div>
              {(!requiredFiles || requiredFiles.length === 0) ? (
                <div style={{ color: '#64748b' }}>No hay documentos requeridos para este tipo.</div>
              ) : (
                <div className="files-grid">
                  {requiredFiles.map((req) => {
                    const archivoId = req.id_archivo || req.archivo_id || req.id;
                    const nombre = req.nombre || req.descripcion || `Archivo ${archivoId}`;
                    const archivoSeleccionado = filesToUpload[archivoId];
                    return (
                      <div key={archivoId} className="file-field">
                        <label>
                          <span>{nombre}</span>
                          <input 
                            className="file-input" 
                            type="file" 
                            accept=".pdf,.png,.jpg,.jpeg" 
                            onChange={(e) => {
                              const file = e.target.files && e.target.files[0];
                              setFilesToUpload(prev => ({ ...prev, [archivoId]: file }));
                            }} 
                          />
                        </label>
                        {archivoSeleccionado && (
                          <div style={{ fontSize: '12px', color: '#059669', marginTop: '5px' }}>
                            ✓ {archivoSeleccionado.name}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
              <button onClick={onSubmit} disabled={submitting} className="btn-primary">{submitting ? 'Enviando...' : '📤 Enviar Modificación'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
