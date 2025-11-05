import React, { useState, useEffect } from 'react';
import { getMisIncapacidades } from '../services/incapacidades';
import '../styles/inicio.css';

export default function InicioPage() {
  const [incapacidades, setIncapacidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Vista de inicio: solo contador informativo de rechazadas (sin acciones/modificaciones)

  useEffect(() => {
    loadIncapacidades();
  }, []);

  const loadIncapacidades = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMisIncapacidades();
      console.log('🔍 DEBUG InicioPage - Datos recibidos de getMisIncapacidades:', data);
      console.log('🔍 DEBUG InicioPage - Total incapacidades:', data.length);
      console.log('🔍 DEBUG InicioPage - Estados encontrados:', data.map(inc => ({ id: inc.id_incapacidad, estado: inc.estado })));
      setIncapacidades(data);
    } catch (e) {
      console.error('Error cargando incapacidades:', e);
      setError(e.message);
      setIncapacidades([]);
    } finally {
      setLoading(false);
    }
  };

  // Calcular estadísticas
  const estadisticas = {
    total: incapacidades.length,
    aprobadas: incapacidades.filter(inc => {
      const estado = inc.estado;
      // Estados aprobados: 12 (realizada), 40 (pagas), 44 (no pagas)
      return estado === 12 || estado === 40 || estado === 44;
    }).length,
    rechazadas: incapacidades.filter(inc => {
      const estado = inc.estado;
      // Estado rechazado: 50
      return estado === 50;
    }).length,
  };

  // En inicio NO se listan ni se corrigen rechazadas; solo se muestra el conteo.

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getEstadoText = (estado) => {
    switch (estado) {
      case 11: return 'Pendiente';
      case 12: return 'Realizada';
      case 40: return 'Pagas';
      case 44: return 'No Pagas';
      case 50: return 'Rechazada';
      default: return `Estado ${estado}`;
    }
  };

  // const getEstadoClass = (estado) => {
  //   switch (estado) {
  //     case 11: return 'estado-pendiente';
  //     case 12: return 'estado-realizada';
  //     case 40: return 'estado-pagas';
  //     case 44: return 'estado-no-pagas';
  //     case 50: return 'estado-rechazada';
  //     default: return 'estado-desconocido';
  //   }
  // };

  if (loading) {
    return (
      <div className="inicio-loading">
        <h1>Inicio</h1>
        <p>Cargando estadísticas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="inicio-error">
        <h1>Inicio</h1>
        <p>Error: {error}</p>
        <button onClick={loadIncapacidades} className="inicio-error-button">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="inicio-container">
      <h1 className="inicio-title">PANEL DE INICIO</h1>
      
      <div className="inicio-content">
        <div className="inicio-welcome">
          Bienvenido al sistema de gestión de incapacidades
        </div>
        
        <div className="inicio-stats-grid">
          <div className="inicio-stat-card inicio-stat-card--total">
            <span className="inicio-stat-icon inicio-stat-icon--total">📊</span>
            <h3 className="inicio-stat-title inicio-stat-title--total">Total</h3>
            <div className="inicio-stat-number inicio-stat-number--total">
              {estadisticas.total}
            </div>
            <p className="inicio-stat-description inicio-stat-description--total">
              Incapacidades registradas
            </p>
          </div>

          <div className="inicio-stat-card inicio-stat-card--aprobadas">
            <span className="inicio-stat-icon inicio-stat-icon--aprobadas">✅</span>
            <h3 className="inicio-stat-title inicio-stat-title--aprobadas">Aprobadas</h3>
            <div className="inicio-stat-number inicio-stat-number--aprobadas">
              {estadisticas.aprobadas}
            </div>
            <p className="inicio-stat-description inicio-stat-description--aprobadas">
              Incapacidades aprobadas
            </p>
          </div>

          <div className={`inicio-stat-card inicio-stat-card--rechazadas ${estadisticas.rechazadas === 0 ? 'inicio-stat-card--empty' : ''}`}>
            <span className="inicio-stat-icon inicio-stat-icon--rechazadas">❌</span>
            <h3 className="inicio-stat-title inicio-stat-title--rechazadas">Rechazadas</h3>
            <div className="inicio-stat-number inicio-stat-number--rechazadas">
              {estadisticas.rechazadas}
            </div>
            <p className="inicio-stat-description inicio-stat-description--rechazadas">
              Incapacidades rechazadas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


