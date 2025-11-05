import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { getMisIncapacidades } from '../services/incapacidades';
import { getParametrosEPS, getParametrosDiagnostico, getCausasIncapacidad, getParametrosServicio } from '../services/parametrosHijos';
import { getTiposIncapacidad } from '../services/tipoIncapacidad';
import { getArchivosPorTipo } from '../services/relacion';
import '../styles/historial.css';

// Sistema de caché simple para mejorar rendimiento
const cache = {
  catalogos: null,
  archivosPorTipo: {},
  lastFetch: null,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
};

// Componente de skeleton loading
const SkeletonRow = () => (
  <div className="historial-table-row historial-skeleton">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="historial-table-cell">
        <div className="skeleton-placeholder"></div>
      </div>
    ))}
  </div>
);

const SkeletonLoading = () => (
  <div className="historial-container">
    <h1 className="historial-title">HISTORIAL DE INCAPACIDADES</h1>
    <div className="historial-content">
      <div className="historial-header">Mis incapacidades</div>
      <div className="historial-body">
        <div className="historial-table">
          <div className="historial-table-header">
            <div>Fecha creación</div>
            <div>Tipo de incapacidad</div>
            <div>Causa</div>
            <div>Diagnóstico</div>
            <div>Fecha inicio</div>
            <div>Fecha final</div>
            <div>Días</div>
            <div>Documentos</div>
          </div>
          <div>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function HistorialPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingDocsId, setLoadingDocsId] = useState(null);
  const [docsById, setDocsById] = useState({}); // id_incapacidad -> { documentos, documentos_cumplimiento }
  const [modal, setModal] = useState({ open: false, id: null });
  const [rowsDetailed, setRowsDetailed] = useState([]);
  const [catalogosLoaded, setCatalogosLoaded] = useState(false);

  // catálogos para mapear IDs a nombres
  const [tiposMap, setTiposMap] = useState({});
  const [causasMap, setCausasMap] = useState({});
  const [epsMap, setEpsMap] = useState({});
  const [servicioMap, setServicioMap] = useState({});
  const [diagMap, setDiagMap] = useState({});
  const [archivosByTipoMap, setArchivosByTipoMap] = useState({}); // tipoId -> { archivo_id: nombre }

  // Función para crear mapas de catálogos
  const toMap = useCallback((arr, idKey, nameKeys) => {
    const m = {};
    (arr || []).forEach(it => {
      const id = it[idKey] || it.id;
      const name = nameKeys.map(k => it[k]).find(v => v && String(v).trim().length > 0) || '';
      if (id != null) m[id] = String(name);
    });
    return m;
  }, []);

  // Función para cargar catálogos con caché
  const loadCatalogos = useCallback(async () => {
    const now = Date.now();
    if (cache.catalogos && cache.lastFetch && (now - cache.lastFetch) < cache.CACHE_DURATION) {
      return cache.catalogos;
    }

    try {
      const [tipos, causas, eps, servis, diags] = await Promise.all([
        getTiposIncapacidad(),
        getCausasIncapacidad(),
        getParametrosEPS(),
        getParametrosServicio(),
        getParametrosDiagnostico(),
      ]);

      const catalogos = {
        tiposMap: toMap(tipos, 'id_tipo_incapacidad', ['nombre', 'tipo_incapacidad']),
        causasMap: toMap(causas, 'id_parametrohijo', ['nombre', 'descripcion', 'valor', 'texto']),
        epsMap: toMap(eps, 'id_parametrohijo', ['nombre', 'descripcion', 'valor', 'texto']),
        servicioMap: toMap(servis, 'id_parametrohijo', ['nombre', 'descripcion', 'valor', 'texto']),
        diagMap: toMap(diags, 'id_parametrohijo', ['nombre', 'descripcion', 'valor', 'texto']),
      };

      cache.catalogos = catalogos;
      cache.lastFetch = now;
      return catalogos;
    } catch (error) {
      console.error('Error cargando catálogos:', error);
      throw error;
    }
  }, [toMap]);

  // Función para cargar incapacidades con detalles (optimizada)
  const loadIncapacidadesConDetalles = useCallback(async (baseRows) => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : '';
    
    // Cargar detalles en lotes más pequeños para mejor responsividad
    const batchSize = 3;
    const batches = [];
    for (let i = 0; i < baseRows.length; i += batchSize) {
      batches.push(baseRows.slice(i, i + batchSize));
    }

    const detalles = [];
    
    // Procesar lotes con delay para no bloquear la UI
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchPromises = batch.map(async (r) => {
        const id = r.id_incapacidad || r.id;
        try {
          const resp = await fetch(`/api/incapacidad/mias/${encodeURIComponent(id)}`, {
            method: 'GET', 
            headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }, 
            credentials: 'omit'
          });
          if (!resp.ok) throw new Error('');
          const det = await resp.json();
          return { id, detalle: det };
        } catch (_) {
          return { id, detalle: null };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      detalles.push(...batchResults);
      
      // Pequeño delay entre lotes para mantener la UI responsiva
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    const idToDetalle = Object.fromEntries(detalles.map(d => [d.id, d.detalle]));
    return baseRows.map(r => {
      const id = r.id_incapacidad || r.id;
      const det = idToDetalle[id] || {};
      return {
        ...r,
        fecha_registro: det.fecha_registro || r.fecha_registro,
      };
    });
  }, []);

  // Función para cargar archivos por tipo con caché
  const loadArchivosPorTipo = useCallback(async (tiposUnicos) => {
    const mapaArchivos = {};
    
    for (const t of tiposUnicos) {
      if (cache.archivosPorTipo[t]) {
        mapaArchivos[t] = cache.archivosPorTipo[t];
        continue;
      }

      try {
        const list = await getArchivosPorTipo(String(t));
        const m = {};
        (Array.isArray(list) ? list : []).forEach(a => {
          const idA = a.id_archivo || a.archivo_id || a.id;
          const nombre = a.nombre || a.descripcion || `Archivo ${idA}`;
          if (idA != null) m[idA] = String(nombre);
        });
        mapaArchivos[t] = m;
        cache.archivosPorTipo[t] = m;
      } catch (_) {
        mapaArchivos[t] = {};
      }
    }
    
    return mapaArchivos;
  }, []);

  // Carga inicial optimizada con carga progresiva
  useEffect(() => {
    (async () => {
      try {
        setInitialLoading(true);
        setError('');
        
        // Paso 1: Cargar incapacidades básicas primero (más rápido)
        const rows = await getMisIncapacidades();
        const baseRows = Array.isArray(rows) ? rows : [];
        setData(baseRows);
        
        // Mostrar datos básicos inmediatamente
        setRowsDetailed(baseRows);
        setInitialLoading(false);
        
        // Paso 2: Cargar catálogos en paralelo (sin bloquear la UI)
        loadCatalogos().then(catalogos => {
          setTiposMap(catalogos.tiposMap);
          setCausasMap(catalogos.causasMap);
          setEpsMap(catalogos.epsMap);
          setServicioMap(catalogos.servicioMap);
          setDiagMap(catalogos.diagMap);
          setCatalogosLoaded(true);
        }).catch(e => console.error('Error cargando catálogos:', e));
        
        // Paso 3: Cargar detalles de incapacidades en background
        if (baseRows.length > 0) {
          setLoading(true);
          try {
            const rowsConDetalles = await loadIncapacidadesConDetalles(baseRows);
            setRowsDetailed(rowsConDetalles);
          } catch (e) {
            console.error('Error cargando detalles:', e);
          } finally {
            setLoading(false);
          }
        }
        
        // Paso 4: Cargar archivos por tipo (en background, no crítico)
        if (baseRows.length > 0) {
          const tiposUnicos = Array.from(new Set(baseRows.map(r => r.tipo_incapacidad_id).filter(Boolean)));
          loadArchivosPorTipo(tiposUnicos).then(mapaArchivos => {
            setArchivosByTipoMap(mapaArchivos);
          }).catch(e => console.error('Error cargando archivos:', e));
        }
        
      } catch (e) {
        setError(e.message || 'Error cargando historial');
        setInitialLoading(false);
      }
    })();
  }, [loadCatalogos, loadIncapacidadesConDetalles, loadArchivosPorTipo]);

  const resolve = useCallback((map, id) => (id != null ? (map[id] || id) : ''), []);

  const verDocumentos = useCallback(async (id) => {
    // Verificar si ya tenemos los documentos en caché
    if (docsById[id]) {
      setModal({ open: true, id });
      return;
    }

    try {
      setLoadingDocsId(id);
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : '';
      
      // Intentar primero el endpoint específico del usuario
      let resp = await fetch(`/api/incapacidad/mias/${encodeURIComponent(id)}`, {
        method: 'GET', 
        headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }, 
        credentials: 'omit'
      });
      
      let inc = null;
      if (resp.ok) {
        inc = await resp.json();
      }
      
      // Fallback: si no vienen documentos, consulta el endpoint general
      if (!inc || !Array.isArray(inc.documentos) || inc.documentos.length === 0) {
        try {
          resp = await fetch(`/api/incapacidad/${encodeURIComponent(id)}`, {
            method: 'GET', 
            headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }, 
            credentials: 'omit'
          });
          if (resp.ok) {
            const adminInc = await resp.json();
            if (adminInc && Array.isArray(adminInc.documentos)) {
              inc = { ...inc, documentos: adminInc.documentos };
            }
          }
        } catch (_) {}
      }
      
      setDocsById(prev => ({ 
        ...prev, 
        [id]: { 
          documentos: inc?.documentos || [], 
          documentos_cumplimiento: inc?.documentos_cumplimiento || [] 
        } 
      }));
      setModal({ open: true, id });
    } catch (_) {
      setDocsById(prev => ({ 
        ...prev, 
        [id]: { documentos: [], documentos_cumplimiento: [] } 
      }));
    } finally {
      setLoadingDocsId(null);
    }
  }, [docsById]);

  // Memoizar las filas procesadas para evitar recálculos innecesarios
  const processedRows = useMemo(() => {
    if (!rowsDetailed.length) return [];
    
    return rowsDetailed.map((row) => {
      const fechaCreacion = row.fecha_registro ? new Date(row.fecha_registro) : null;
      const fechaInicio = row.fecha_inicio ? new Date(row.fecha_inicio) : null;
      const fechaFinal = row.fecha_final ? new Date(row.fecha_final) : null;
      const id = row.id_incapacidad || row.id;
      
      // Usar catálogos si están disponibles, sino mostrar IDs
      const causaNombre = catalogosLoaded ? (
        resolve(causasMap, row.causa_id) ||
        resolve(causasMap, row.causa_incapacidad_id) ||
        resolve(causasMap, row.clase_id) ||
        resolve(causasMap, row.clase_incapcidad_id) ||
        ''
      ) : (row.causa_id || row.causa_incapacidad_id || row.clase_id || '');
      
      return {
        id,
        fechaCreacion,
        fechaInicio,
        fechaFinal,
        causaNombre,
        row
      };
    });
  }, [rowsDetailed, catalogosLoaded, causasMap, resolve]);

  // Mostrar skeleton loading durante la carga inicial
  if (initialLoading) return <SkeletonLoading />;
  
  if (error) return <div className="historial-error"><h1>Historial de incapacidades</h1><p>{error}</p></div>;

  const content = (
    <div className="historial-container">
      <h1 className="historial-title">HISTORIAL DE INCAPACIDADES</h1>
      <div className="historial-content">
        <div className="historial-header">
          Mis incapacidades
          {loading && <span className="historial-loading-indicator">Cargando detalles...</span>}
          {!catalogosLoaded && !loading && <span className="historial-loading-indicator">Cargando catálogos...</span>}
        </div>

        <div className="historial-body">
          {(!data || data.length === 0) && !loading && (
            <div className="historial-empty">No tienes incapacidades registradas.</div>
          )}

          {processedRows && processedRows.length > 0 && (
            <div className="historial-table">
              {/* Header */}
              <div className="historial-table-header">
                <div>Fecha creación</div>
                <div>Tipo de incapacidad</div>
                <div>Causa</div>
                <div>Diagnóstico</div>
                <div>Fecha inicio</div>
                <div>Fecha final</div>
                <div>Días</div>
                <div>Documentos</div>
              </div>
              {/* Rows */}
              <div>
                {processedRows.map(({ id, fechaCreacion, fechaInicio, fechaFinal, causaNombre, row }) => (
                  <div key={id} className="historial-table-row">
                    <div className="historial-table-cell">{fechaCreacion ? fechaCreacion.toLocaleDateString() : ''}</div>
                    <div className="historial-table-cell">
                      {catalogosLoaded ? resolve(tiposMap, row.tipo_incapacidad_id) : (row.tipo_incapacidad_id || '')}
                    </div>
                    <div className="historial-table-cell">{causaNombre || '—'}</div>
                    <div className="historial-table-cell">
                      {catalogosLoaded ? resolve(diagMap, row.diagnostico_id) : (row.diagnostico_id || '')}
                    </div>
                    <div className="historial-table-cell">{fechaInicio ? fechaInicio.toLocaleDateString() : ''}</div>
                    <div className="historial-table-cell">{fechaFinal ? fechaFinal.toLocaleDateString() : ''}</div>
                    <div className="historial-table-cell">{row.dias}</div>
                    <div className="historial-table-cell">
                      <button 
                        onClick={() => verDocumentos(id)} 
                        disabled={loadingDocsId === id} 
                        className="historial-btn-docs"
                      >
                        {loadingDocsId === id ? 'Cargando...' : 'Ver'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mostrar skeleton rows mientras se cargan los detalles */}
          {loading && processedRows.length === 0 && data.length > 0 && (
            <div className="historial-table">
              <div className="historial-table-header">
                <div>Fecha creación</div>
                <div>Tipo de incapacidad</div>
                <div>Causa</div>
                <div>Diagnóstico</div>
                <div>Fecha inicio</div>
                <div>Fecha final</div>
                <div>Días</div>
                <div>Documentos</div>
              </div>
              <div>
                {Array.from({ length: Math.min(data.length, 3) }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Modal para ver documentos
  return (
    <>
      {content}
      {modal.open && (
        <div className="historial-modal-overlay" onClick={() => setModal({ open: false, id: null })}>
          <div className="historial-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="historial-modal-header">
              <div className="historial-modal-title">Documentos de la incapacidad N {modal.id}</div>
              <button onClick={() => setModal({ open: false, id: null })} className="historial-modal-close">✕</button>
            </div>
            <div className="historial-modal-body">
              {(() => {
                const info = docsById[modal.id] || { documentos: [], documentos_cumplimiento: [] };
                const docs = Array.isArray(info.documentos) ? info.documentos : [];
                const comp = Array.isArray(info.documentos_cumplimiento) ? info.documentos_cumplimiento : [];
                return (
                  <>
                    <div className="historial-modal-section-title">Archivos subidos</div>
                    {docs.length === 0 && <div className="historial-modal-empty">No hay documentos subidos.</div>}
                    {docs.length > 0 && (
                      <ul className="historial-modal-list">
                        {docs.map((d, i) => {
                          const name = d.url_documento || d.url || d.location || `archivo_${i+1}`;
                          const backendBase = (typeof window !== 'undefined' ? window.location.origin.replace(':3000', ':8000') : 'http://localhost:8000');
                          const href = name && !/^https?:/i.test(name) ? `${backendBase}/uploads/${name}` : name;
                          const archivoId = d.archivo_id;
                          const tipoId = rowsDetailed.find(r => (r.id_incapacidad || r.id) === modal.id)?.tipo_incapacidad_id;
                          const nombreAmigable = (tipoId && archivosByTipoMap[tipoId] && archivoId) ? (archivosByTipoMap[tipoId][archivoId] || name) : name;
                          return (
                            <li key={i} className="historial-modal-list-item">
                              <a href={href} target="_blank" rel="noreferrer" className="historial-modal-link">{nombreAmigable}</a>
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    {/* Cumplimiento oculto a petición del usuario */}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}


