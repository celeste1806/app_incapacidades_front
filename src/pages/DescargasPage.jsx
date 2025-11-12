import React, { useEffect, useState } from 'react';
import { getParametrosPadre, getParametrosHijosByPapa } from '../services/parametros';

// ID del parámetro padre para "Archivos de Descarga"
// Si no existe, se buscará por nombre "Archivos de Descarga" o "Descargas"
const PARAMETRO_DESCARGAS_ID = null; // null = buscar por nombre, o poner el ID específico

export default function DescargasPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError('');
        
        // Obtener el ID del parámetro padre de descargas
        let parametroDescargasId = PARAMETRO_DESCARGAS_ID;
        
        if (!parametroDescargasId) {
          // Buscar el parámetro padre por nombre
          const parametrosPadre = await getParametrosPadre();
          const parametroDescargas = parametrosPadre.find(p => {
            const nombre = (p?.nombre || '').toLowerCase();
            return nombre.includes('descarga') || nombre.includes('archivo de descarga');
          });
          
          if (!parametroDescargas) {
            throw new Error('No se encontró el parámetro "Archivos de Descarga". Por favor, créalo en la página de Parámetros.');
          }
          
          parametroDescargasId = parametroDescargas.id_parametro || parametroDescargas.id || parametroDescargas.idparametro;
        }
        
        // Obtener los parámetros hijos (archivos descargables)
        const parametrosHijos = await getParametrosHijosByPapa(parametroDescargasId);
        
        // Convertir parámetros hijos a formato de items
        const itemsList = parametrosHijos
          .filter(ph => ph.estado !== false) // Solo activos
          .map(ph => {
            // La descripción puede contener la URL completa o el nombre del archivo
            const descripcion = ph.descripcion || '';
            // Intentar extraer URL de la descripción o construirla
            let url = null;
            
            // Si la descripción parece una URL completa (http/https), usarla directamente
            if (descripcion.startsWith('http://') || descripcion.startsWith('https://')) {
              url = descripcion;
            }
            // Si empieza con /, es una ruta relativa, usarla directamente
            else if (descripcion.startsWith('/')) {
              url = descripcion;
            }
            // Si contiene extensión de archivo (.pdf, .doc, etc.), construir ruta desde public
            else if (descripcion.includes('.pdf') || descripcion.includes('.doc') || descripcion.includes('.docx') || descripcion.includes('.xls') || descripcion.includes('.xlsx')) {
              // Archivos en public se acceden desde la raíz, codificar espacios
              const nombreArchivo = descripcion.replace(/\s+/g, '%20');
              url = `/${nombreArchivo}`;
            }
            // Si no tiene extensión pero tiene contenido, intentar construir desde el nombre del parámetro
            else if (descripcion.trim()) {
              // Asumir que es un nombre de archivo sin extensión, agregar .pdf por defecto
              const nombreArchivo = descripcion.replace(/\s+/g, '%20');
              url = `/${nombreArchivo}.pdf`;
            }
            // Si no hay descripción, intentar construir desde el nombre del parámetro
            else {
              const nombreArchivo = (ph.nombre || '').replace(/\s+/g, '%20');
              if (nombreArchivo) {
                url = `/${nombreArchivo}.pdf`; // Asumir PDF por defecto
              }
            }
            
            return {
              id: ph.id_parametrohijo || ph.id,
              nombre: ph.nombre || 'Sin nombre',
              descripcion: descripcion || ph.nombre || '',
              url: url
            };
          });
        
        setItems(itemsList);
      } catch (e) {
        setError(e.message || 'Error cargando archivos');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const resolveName = (it) => it?.nombre || it?.descripcion || 'Sin nombre';
  const resolveUrl = (it) => {
    // La URL ya viene en el objeto desde el mapeo
    return it?.url || null;
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
                <tr key={it?.id || idx}>
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


