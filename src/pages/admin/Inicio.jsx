import React, { useEffect, useState } from 'react';
import { getAllIncapacidades } from '../../services/incapacidades';
import '../../styles/admin-inicio.css';

export default function Inicio() {
  const [stats, setStats] = useState({ total: 0, aprobadas: 0, rechazadas: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAllIncapacidades();
        const rows = Array.isArray(data) ? data : [];
        const total = rows.length;
        const aprobadas = rows.filter(r => {
          const estado = r.estado;
          // Estados aprobados: 12 (realizada), 40 (pagas), 44 (no pagas)
          return estado === 12 || estado === 40 || estado === 44;
        }).length;
        const rechazadas = rows.filter(r => {
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

  if (loading) {
    return (
      <div className="admin-inicio-container">
        <div className="admin-inicio-loading">
          <h1>PANEL DE ADMINISTRACIÓN</h1>
          <p>Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-inicio-container">
        <div className="admin-inicio-error">
          <h1>PANEL DE ADMINISTRACIÓN</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-inicio-container">
      <h1 className="admin-inicio-title">PANEL DE ADMINISTRACIÓN</h1>
      
      <div className="admin-inicio-content">
        <div className="admin-inicio-welcome">
          
        </div>
        
        <div className="admin-inicio-stats-grid">
          <div className="admin-inicio-stat-card admin-inicio-stat-card--total">
            <span className="admin-inicio-stat-icon admin-inicio-stat-icon--total">📊</span>
            <h3 className="admin-inicio-stat-title admin-inicio-stat-title--total">Total</h3>
            <div className="admin-inicio-stat-number admin-inicio-stat-number--total">
              {stats.total}
            </div>
            <p className="admin-inicio-stat-description admin-inicio-stat-description--total">
              Incapacidades registradas
            </p>
          </div>

          <div className="admin-inicio-stat-card admin-inicio-stat-card--aprobadas">
            <span className="admin-inicio-stat-icon admin-inicio-stat-icon--aprobadas">✅</span>
            <h3 className="admin-inicio-stat-title admin-inicio-stat-title--aprobadas">Aprobadas</h3>
            <div className="admin-inicio-stat-number admin-inicio-stat-number--aprobadas">
              {stats.aprobadas}
            </div>
            <p className="admin-inicio-stat-description admin-inicio-stat-description--aprobadas">
              Incapacidades aprobadas
            </p>
          </div>

          <div className={`admin-inicio-stat-card admin-inicio-stat-card--rechazadas ${stats.rechazadas === 0 ? 'admin-inicio-stat-card--empty' : ''}`}>
            <span className="admin-inicio-stat-icon admin-inicio-stat-icon--rechazadas">❌</span>
            <h3 className="admin-inicio-stat-title admin-inicio-stat-title--rechazadas">Rechazadas</h3>
            <div className="admin-inicio-stat-number admin-inicio-stat-number--rechazadas">
              {stats.rechazadas}
            </div>
            <p className="admin-inicio-stat-description admin-inicio-stat-description--rechazadas">
              Incapacidades rechazadas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


