import React, { useEffect, useState } from 'react';
import { getAllIncapacidades } from '../../services/incapacidades';

export default function AdminHomeInicio() {
  const [stats, setStats] = useState({ total: 0, aprobadas: 0, rechazadas: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        // Para admin, se usa el endpoint general y se filtra por estados
        const data = await getAllIncapacidades();
        const lo = Array.isArray(data) ? data : [];
        const total = lo.length;
        const aprobadas = lo.filter(r => {
          const estado = r.estado;
          // Estados aprobados: 12 (realizada), 40 (pagas), 44 (no pagas)
          return estado === 12 || estado === 40 || estado === 44;
        }).length;
        const rechazadas = lo.filter(r => {
          const estado = r.estado;
          // Estado rechazado: 50
          return estado === 50;
        }).length;
        setStats({ total, aprobadas, rechazadas });
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div style={{ padding: 20 }}><h1>Inicio (Admin)</h1><p>Cargando...</p></div>;
  if (error) return <div style={{ padding: 20 }}><h1>Inicio (Admin)</h1><p style={{ color: 'red' }}>{error}</p></div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Inicio (Admin)</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(200px, 1fr))', gap: 16, marginTop: 20 }}>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 20, textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Total</h3>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#3b82f6' }}>{stats.total}</div>
          <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: 14 }}>Incapacidades registradas</p>
        </div>
        <div style={{ background: '#d1fae5', border: '1px solid #10b981', borderRadius: 8, padding: 20, textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#065f46' }}>Aprobadas</h3>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#10b981' }}>{stats.aprobadas}</div>
          <p style={{ margin: '8px 0 0 0', color: '#065f46', fontSize: 14 }}>Aprobadas</p>
        </div>
        <div style={{ background: '#fee2e2', border: '1px solid #ef4444', borderRadius: 8, padding: 20, textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#991b1b' }}>Rechazadas</h3>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#ef4444' }}>{stats.rechazadas}</div>
          <p style={{ margin: '8px 0 0 0', color: '#991b1b', fontSize: 14 }}>Rechazadas</p>
        </div>
      </div>
    </div>
  );
}


