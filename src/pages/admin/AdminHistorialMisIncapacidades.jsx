import React, { useEffect, useState } from 'react';
import { getMisIncapacidades, getIncapacidadDetalle } from '../../services/incapacidades';
import { getCausasIncapacidad, getParametrosDiagnostico } from '../../services/parametrosHijos';
import { getTiposIncapacidad } from '../../services/tipoIncapacidad';

const formatDate = (s) => (s ? new Date(s).toLocaleDateString('es-ES') : '');
// estadoText no usado en esta vista

export default function AdminHistorialMisIncapacidades() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tiposMap, setTiposMap] = useState({});
  const [causasMap, setCausasMap] = useState({});
  const [diagnosticosMap, setDiagnosticosMap] = useState({});
  const [dateFrom] = useState('');
  const [dateTo] = useState('');
  const [docsModal, setDocsModal] = useState({ open: false, id: null, documentos: [] });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError('');
        const [data, tiposLista, causasLista, diagnosticosLista] = await Promise.all([
          getMisIncapacidades(), getTiposIncapacidad(), getCausasIncapacidad(), getParametrosDiagnostico()
        ]);
        setRows(Array.isArray(data) ? data : []);
        // Mapas id->nombre
        const tipos = {};
        (tiposLista || []).forEach(t => {
          const id = t?.id_tipo_incapacidad || t?.id;
          const nombre = t?.nombre || t?.descripcion || '';
          if (id != null && String(id) !== '' && nombre) {
            tipos[String(id)] = String(nombre);
          }
        });
        setTiposMap(tipos);
        const causas = {};
        (causasLista || []).forEach(c => {
          causas[String(c.id_parametrohijo || c.id || c.valor)] = c.nombre || c.descripcion || c.valor;
        });
        setCausasMap(causas);
        const diagnos = {};
        (diagnosticosLista || []).forEach(d => {
          diagnos[String(d.id_parametrohijo || d.id || d.valor)] = d.nombre || d.descripcion || d.valor;
        });
        setDiagnosticosMap(diagnos);
      } catch (e) {
        setError(e.message || 'Error cargando mi historial de incapacidades');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Resuelve siempre nombre desde backend y catálogos, nunca el id
  const getTipoText = (r) =>
    r.tipo_incapacidad_nombre || r.tipo_nombre ||
    (typeof r.tipo_incapacidad_id !== 'undefined' && tiposMap[String(r.tipo_incapacidad_id)]) ||
    '';
  const getCausaText = (r) =>
    r.causa_incapacidad_nombre || r.causa_nombre ||
    (typeof r.causa_id !== 'undefined' && causasMap[String(r.causa_id)]) ||
    (r.causa && r.causa.nombre) || '';
  const getDiagnosticoText = (r) =>
    r.diagnostico_nombre ||
    (typeof r.diagnostico_id !== 'undefined' && diagnosticosMap[String(r.diagnostico_id)]) ||
    (r.diagnostico && (r.diagnostico.nombre || r.diagnostico.descripcion)) ||
    r.diagnostico || '';

  const abrirDocumentos = async (id) => {
    try {
      // Intentar usar los documentos si ya vienen en la fila
      const row = rows.find(x => x.id_incapacidad === id);
      let documentos = Array.isArray(row?.documentos) ? row.documentos : [];
      if (!documentos || documentos.length === 0) {
        const detalle = await getIncapacidadDetalle(id);
        documentos = Array.isArray(detalle?.documentos) ? detalle.documentos : [];
      }
      setDocsModal({ open: true, id, documentos });
    } catch (_) {
      setDocsModal({ open: true, id, documentos: [] });
    }
  };
  const cerrarModal = () => setDocsModal({ open: false, id: null, documentos: [] });

  if (loading) return <div className="historial-loading">Cargando tu historial...</div>;
  if (error) return <div className="historial-error">{error}</div>;

  // Filtrado por rango de fechas usando fecha_inicio
  const filteredRows = rows.filter(r => {
    const rowDate = r.fecha_inicio ? new Date(r.fecha_inicio) : null;
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;
    const matchesFrom = !from || (rowDate && rowDate >= from);
    const matchesTo = !to || (rowDate && rowDate <= to);
    return matchesFrom && matchesTo;
  });

  return (
    <div className="historial-container">
      <h1 className="historial-title">Mis incapacidades</h1>
      <div className="historial-content">
        <div className="historial-header">MIS INCAPACIDADES</div>
        <div className="historial-body">
          {filteredRows.length === 0 ? (
            <div className="historial-empty">No tienes incapacidades registradas</div>
          ) : (
            <>
              {/* Header grid */}
              <div className="historial-table-header">
                <div>FECHA CREACIÓN</div>
                <div>TIPO DE INCAPACIDAD</div>
                <div>CAUSA</div>
                <div>DIAGNÓSTICO</div>
                <div>FECHA INICIO</div>
                <div>FECHA FINAL</div>
                <div>DÍAS</div>
                <div>DOCUMENTOS</div>
              </div>
              {filteredRows.map(r => (
                <div className="historial-table-row" key={r.id_incapacidad}>
                  <div className="historial-table-cell">{formatDate(r.fecha_registro)}</div>
                  <div className="historial-table-cell">{getTipoText(r)}</div>
                  <div className="historial-table-cell">{getCausaText(r)}</div>
                  <div className="historial-table-cell">{getDiagnosticoText(r)}</div>
                  <div className="historial-table-cell">{formatDate(r.fecha_inicio)}</div>
                  <div className="historial-table-cell">{formatDate(r.fecha_final)}</div>
                  <div className="historial-table-cell">{r.dias || ''}</div>
                  <div className="historial-table-cell">
                    <button className="historial-btn-docs" onClick={() => abrirDocumentos(r.id_incapacidad)}>
                      VER
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
        {docsModal.open && (
          <div className="historial-modal-overlay" onClick={cerrarModal}>
            <div className="historial-modal-content" onClick={e => e.stopPropagation()}>
              <div className="historial-modal-header">
                <span className="historial-modal-title">Documentos de la incapacidad {docsModal.id}</span>
                <button className="historial-modal-close" onClick={cerrarModal}>✕</button>
              </div>
              <div className="historial-modal-body">
                {(!docsModal.documentos || docsModal.documentos.length === 0) && (
                  <div className="historial-modal-empty">No hay documentos disponibles.</div>
                )}
                {Array.isArray(docsModal.documentos) && docsModal.documentos.length > 0 && (
                  <ul className="historial-modal-list">
                    {docsModal.documentos.map((doc, idx) => {
                      const name = doc.nombre_archivo || doc.url_documento || `Documento ${idx+1}`;
                      const href = /^https?:\/\//.test(doc.url_documento || '') ? (doc.url_documento) : (doc.url_documento ? `/uploads/${doc.url_documento}` : '#');
                      return (
                        <li key={idx} className="historial-modal-list-item">
                          {href === '#' ? (
                            <span>{name}</span>
                          ) : (
                            <a href={href} target="_blank" rel="noreferrer" className="historial-modal-link">{name}</a>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
