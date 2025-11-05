import React, { useEffect, useState } from 'react';
import { getArchivosCatalog } from '../services/archivos';

export default function DescargasPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Entradas fijas solicitadas
  const fixed = [
    { id: 'sanitas', nombre: 'Sanitas', descripcion: 'EPS Sanitas', url: '/FORMATO%20DE%20INVESTIGACION%20SANITAS.pdf' },
    { id: 'salud_total', nombre: 'Salud Total', descripcion: 'EPS Salud Total', url: '/FORMATO%20ACCIDENTE%20SALUD%20TOTAL.pdf' },
  ];

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getArchivosCatalog();
        const arr = Array.isArray(data) ? data : [];
        // Tomar solo SANITAS y SALUD TOTAL del catálogo (si existen) y mezclar con las fijas
        const onlyAllowed = arr.filter(it => {
          const n = (it?.nombre || it?.descripcion || '').toLowerCase();
          return n.includes('sanitas') || n.includes('salud total');
        });
        // Normalizar a mapa por nombre en minúsculas
        const mapByName = {};
        onlyAllowed.forEach(it => {
          const key = (it?.nombre || it?.descripcion || '').toLowerCase().trim();
          if (key) mapByName[key] = it;
        });
        const merged = fixed.map(f => {
          const key = (f.nombre || '').toLowerCase().trim();
          const match = key ? (key in mapByName ? mapByName[key] : null) : null;
          return match ? { ...f, ...match } : f;
        });
        setItems(merged);
      } catch (e) {
        setError(e.message || 'Error cargando archivos');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const resolveName = (it) => it?.nombre || it?.descripcion || it?.titulo || it?.texto || `Archivo ${it?.id_archivo || it?.id || ''}`;
  const resolveUrl = (it) => {
    const direct = it?.url || it?.enlace || it?.link || it?.ruta || it?.archivo_url || it?.gdrive_url;
    if (typeof direct === 'string' && direct.trim()) return direct;
    const candidate = it?.nombre_archivo || it?.archivo || '';
    if (candidate) return `/uploads/${candidate}`;
    return null;
  };

  const list = items;

  if (loading) return <div className="admin-container"><div className="admin-header"><h1>Descargas</h1></div><p style={{padding:16}}>Cargando...</p></div>;
  if (error) return <div className="admin-container"><div className="admin-header"><h1>Descargas</h1></div><p style={{padding:16,color:'red'}}>{error}</p></div>;

  return (
    <div className="admin-pages-container">
      <h1 className="admin-pages-title">DESCARGAS</h1>
      <div className="admin-pages-content">

        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Descargar</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={3} className="muted" style={{ padding: 16, textAlign: 'center' }}>Sin archivos</td>
              </tr>
            )}
            {list.map((it, idx) => {
              const name = resolveName(it);
              const url = resolveUrl(it);
              const descripcion = it?.descripcion || '';
              return (
                <tr key={it?.id_archivo || it?.id || idx}>
                  <td>{name}</td>
                  <td>{descripcion}</td>
                  <td>
                    {url ? (
                      <a href={url} target="_blank" rel="noreferrer" className="admin-btn admin-btn-primary">Descargar</a>
                    ) : (
                      <span className="muted">No disponible</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


