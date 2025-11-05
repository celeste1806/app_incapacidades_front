import React, { useEffect, useState } from 'react';
import { getMisIncapacidades } from '../../services/incapacidades';

const formatDate = (s) => (s ? new Date(s).toLocaleDateString('es-ES') : '');

export default function AdminMisIncapacidadesRechazadas() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getMisIncapacidades();
        const arr = Array.isArray(data) ? data : [];
        const rechazadas = arr.filter(r => Number(r.estado) === 50);
        setRows(rechazadas);
      } catch (e) {
        setError(e.message || 'Error cargando mis incapacidades rechazadas');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="admin-container"><div className="admin-header"><h1>Mis incapacidades rechazadas</h1></div><p style={{padding:16}}>Cargando...</p></div>;
  if (error) return <div className="admin-container"><div className="admin-header"><h1>Mis incapacidades rechazadas</h1></div><p style={{padding:16,color:'red'}}>{error}</p></div>;

  return (
    <div className="admin-pages-container">
      <h1 className="admin-pages-title">MIS INCAPACIDADES RECHAZADAS</h1>
      <div className="admin-pages-content">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Fecha Inicio</th>
              <th>Fecha Final</th>
              <th>Días</th>
              <th>Motivo Rechazo</th>
              <th>Fecha Registro</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="muted" style={{ padding: 16, textAlign: 'center' }}>
                  No tienes incapacidades rechazadas
                </td>
              </tr>
            )}
            {rows.map(r => (
              <tr key={r.id_incapacidad}>
                <td>{r.tipo_incapacidad_nombre || r.tipo_nombre || r.tipo || 'Sin especificar'}</td>
                <td>{formatDate(r.fecha_inicio)}</td>
                <td>{formatDate(r.fecha_final)}</td>
                <td>{r.dias || ''}</td>
                <td>{r.motivo_rechazo || r.mensaje_rechazo || ''}</td>
                <td>{formatDate(r.fecha_registro)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


