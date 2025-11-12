import React, { useEffect, useState } from 'react';
import { getIncapacidadesPendientes, getIncapacidadesRealizadas, getIncapacidadesPagas, getIncapacidadesNoPagas, getIncapacidadesRechazadas, getEstadosIncapacidad, cambiarEstadoIncapacidad } from '../../services/incapacidades';
import { getCausasIncapacidad } from '../../services/parametrosHijos';
import '../../styles/admin-parametros.css';
import '../../styles/historial.css';
import '../../styles/admin-pages-blue.css';

const formatDate = (s) => (s ? new Date(s).toLocaleDateString('es-ES') : '');
const formatDateTime = (s) => {
  if (!s) return '';
  const date = new Date(s);
  return date.toLocaleString('es-ES', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};
const estadoText = (estado) => ({11:'Pendiente',12:'Trámite',40:'Pagas',44:'No pagas',50:'Rechazada'})[Number(estado)] || `Estado ${estado}`;

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

export default function AdminIncapacidadesHistorial() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [causasMap, setCausasMap] = useState({});
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [showChangeState, setShowChangeState] = useState(false);
  const [estadosIncapacidad, setEstadosIncapacidad] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedNewState, setSelectedNewState] = useState('');
  const [mensajeRechazo, setMensajeRechazo] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError('');
        
        const [pend, real, pagas, nopagas, rech, causas] = await Promise.all([
          getIncapacidadesPendientes(),
          getIncapacidadesRealizadas(),
          getIncapacidadesPagas(),
          getIncapacidadesNoPagas(),
          getIncapacidadesRechazadas(),
          getCausasIncapacidad(),
        ]);
        
        // Manejar nueva estructura de respuesta del backend
        const pendData = Array.isArray(pend) ? pend : (pend?.incapacidades || []);
        const realData = Array.isArray(real) ? real : (real?.incapacidades || []);
        const pagasData = Array.isArray(pagas) ? pagas : (pagas?.incapacidades || []);
        const nopagasData = Array.isArray(nopagas) ? nopagas : (nopagas?.incapacidades || []);
        const rechData = Array.isArray(rech) ? rech : (rech?.incapacidades || []);
        
        const all = [...(pendData||[]), ...(realData||[]), ...(pagasData||[]), ...(nopagasData||[]), ...(rechData||[])];
        setRows(all);

        // Construir mapa de causas: id -> nombre/descripcion
        const map = {};
        (Array.isArray(causas) ? causas : []).forEach((c) => {
          const id = c?.id_parametrohijo || c?.id;
          const nombre = c?.nombre || c?.descripcion || c?.valor || c?.texto || '';
          if (id != null && String(id) !== '' && nombre) {
            map[String(id)] = String(nombre);
          }
        });
        setCausasMap(map);
      } catch (e) {
        setError(e.message || 'Error cargando historial');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="admin-container"><div className="admin-header"><h1>📚 Historial de Incapacidades</h1></div><p style={{padding:16}}>Cargando...</p></div>;
  if (error) return <div className="admin-container"><div className="admin-header"><h1>📚 Historial de Incapacidades</h1></div><p style={{padding:16,color:'red'}}>{error}</p></div>;

  // Filtrar incapacidades por nombre, estado y por rango de fechas (fecha_inicio)
  const filteredRows = rows.filter(row => {
    const nombre = (row.usuario_nombre || row.usuario || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    if (!nombre.includes(query)) return false;

    // Filtrado por estado si aplica
    if (estadoFilter !== '') {
      const estadoNum = Number(estadoFilter);
      if (Number(row.estado) !== estadoNum) return false;
    }

    // Filtrado por fecha (se usa fecha_inicio). Si no hay filtros de fecha, pasa.
    const fi = row && row.fecha_inicio ? new Date(row.fecha_inicio) : null;
    if (dateFrom) {
      const from = new Date(dateFrom);
      // Normalizar a inicio del día
      from.setHours(0,0,0,0);
      if (!fi || fi < from) return false;
    }
    if (dateTo) {
      const to = new Date(dateTo);
      // Normalizar a final del día
      to.setHours(23,59,59,999);
      if (!fi || fi > to) return false;
    }
    return true;
  });

  // Paginación
  const totalItems = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageRows = filteredRows.slice(startIndex, endIndex);

  return (
    <div className="admin-pages-container">
      <h1 className="admin-pages-title">HISTORIAL DE INCAPACIDADES</h1>
      <div className="admin-pages-content">
        {error && <div className="admin-error"><h1>HISTORIAL DE INCAPACIDADES</h1><p>{error}</p></div>}
        
        <div className="admin-filter-container" style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="🔍 Buscar por nombre de usuario..."
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
            <label style={{ color: '#e2e8f0', fontSize: 12 }}>Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="elegant-input"
              style={{ padding: '8px 10px' }}
            />
            <label style={{ color: '#e2e8f0', fontSize: 12 }}>Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="elegant-input"
              style={{ padding: '8px 10px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ color: '#e2e8f0', fontSize: 12 }}>Estado</label>
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="elegant-input"
              style={{ padding: '8px 10px' }}
            >
              <option value="">Todos</option>
              <option value="11">Pendiente</option>
              <option value="12">Trámite</option>
              <option value="40">Pagas</option>
              <option value="44">No Pagas</option>
              <option value="50">Rechazada</option>
            </select>
            {estadoFilter !== '' && (
              <button
                onClick={() => setEstadoFilter('')}
                style={{
                  padding: '8px 12px',
                  background: '#64748b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                Limpiar
              </button>
            )}
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
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
              Limpiar
            </button>
          )}
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              style={{
                padding: '8px 16px',
                background: '#475569',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Limpiar fechas
            </button>
          )}
        </div>
        
        {loading ? (
          <div className="admin-loading">
            <h1>HISTORIAL DE INCAPACIDADES</h1>
            <p>Cargando...</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Tipo</th>
                <th>Causa de incapacidad</th>
                <th>Estado</th>
                <th>Motivo No Pagas</th>
                <th>Fecha Inicio</th>
                <th>Fecha Final</th>
                <th>Días</th>
                <th>Fecha de Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 && searchQuery && (
                <tr>
                  <td colSpan={7} className="muted" style={{ padding: 16, textAlign: 'center' }}>
                    No se encontraron incapacidades con el nombre "{searchQuery}"
                  </td>
                </tr>
              )}
              {filteredRows.length === 0 && !searchQuery && (
                <tr>
                  <td colSpan={7} className="muted" style={{ padding: 16, textAlign: 'center' }}>
                    No hay incapacidades registradas
                  </td>
                </tr>
              )}
              {pageRows.map(row => (
                <tr key={row.id_incapacidad}>
                  <td>{row.usuario_nombre || row.usuario || 'N/A'}</td>
                  <td>{getTipoIncapacidadNombre(row)}</td>
                  <td>{(() => {
                    const candidateId =
                      row.causa_id || row.causa_incapacidad_id || row.clase_id || row.clase_incapcidad_id || row.causa_incapacidad;
                    const idStr = candidateId != null ? String(candidateId) : '';
                    const nombre = (idStr && causasMap[idStr]) || row.causa_incapacidad || row.causa_nombre || '';
                    return nombre || '';
                  })()}</td>
                  <td>{estadoText(row.estado)}</td>
                  <td>
                    {Number(row.estado) === 44
                      ? (row.motivo_no_pagas || 'Sin motivo registrado')
                      : '—'}
                  </td>
                  <td>{formatDate(row.fecha_inicio)}</td>
                  <td>{formatDate(row.fecha_final)}</td>
                  <td>{row.dias || 'N/A'}</td>
                  <td>{formatDateTime(row.fecha_registro)}</td>
                  <td>
                    <button
                      className="admin-btn admin-btn-primary"
                      onClick={async () => {
                        setSelectedRow(row);
                        setSelectedNewState('');
                        setMensajeRechazo('');
                        try {
                          const estados = await getEstadosIncapacidad();
                          setEstadosIncapacidad(Array.isArray(estados) ? estados : []);
                        } catch (_) {
                          setEstadosIncapacidad([]);
                        }
                        setShowChangeState(true);
                      }}
                    >
                      Cambiar estado
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filteredRows.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            <div style={{ color: '#94a3b8', fontSize: 12 }}>
              Mostrando {startIndex + 1}-{Math.min(endIndex, totalItems)} de {totalItems}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="admin-btn admin-btn-secondary"
                style={{ padding: '6px 10px' }}
              >
                « Anterior
              </button>
              <span style={{ color: '#e2e8f0', fontSize: 13 }}>Página {currentPage} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="admin-btn admin-btn-secondary"
                style={{ padding: '6px 10px' }}
              >
                Siguiente »
              </button>
            </div>
          </div>
        )}
      </div>
      {showChangeState && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setShowChangeState(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#0b1a2b', border: '1px solid #1f334a', padding: 16, borderRadius: 8, width: 420, color: '#e2e8f0' }}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Cambiar estado</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4 }}>Nuevo estado</label>
                <select className="elegant-input" value={selectedNewState} onChange={(e) => setSelectedNewState(Number(e.target.value))} style={{ width: '100%' }}>
                  <option value="">Seleccione</option>
                  {estadosIncapacidad.map(est => (
                    <option key={est.id_estado || est.id} value={est.id_estado || est.id}>{est.nombre || est.estado}</option>
                  ))}
                </select>
              </div>
              {Number(selectedNewState) === 50 && (
                <div>
                  <label style={{ display: 'block', marginBottom: 4 }}>Motivo rechazo</label>
                  <textarea className="elegant-input" rows={3} value={mensajeRechazo} onChange={e => setMensajeRechazo(e.target.value)} style={{ width: '100%' }} />
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="admin-btn admin-btn-secondary" onClick={() => setShowChangeState(false)}>Cancelar</button>
                <button className="admin-btn admin-btn-success" onClick={async () => {
                  if (!selectedRow || !selectedNewState) { alert('Seleccione un estado'); return; }
                  try {
                    await cambiarEstadoIncapacidad(selectedRow.id_incapacidad, selectedNewState, mensajeRechazo || null);
                    // refrescar estado en tabla
                    setRows(prev => prev.map(r => r.id_incapacidad === selectedRow.id_incapacidad ? { ...r, estado: selectedNewState, mensaje_rechazo: mensajeRechazo } : r));
                    setShowChangeState(false);
                  } catch (e) {
                    alert('Error cambiando estado: ' + (e?.message || ''));
                  }
                }}>Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}