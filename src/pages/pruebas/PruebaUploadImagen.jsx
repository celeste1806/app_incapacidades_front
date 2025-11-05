import React, { useState } from 'react';
import { uploadIncapacidadArchivo } from '../../services/upload';

export default function PruebaUploadImagen() {
  const [file, setFile] = useState(null);
  const [incapacidadId, setIncapacidadId] = useState('');
  const [archivoId, setArchivoId] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null);
  const [token, setToken] = useState('');

  const onFile = (e) => {
    const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    // Permitidos: pdf, png, jpg
    setFile(f);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResultado(null);
    try {
      setSubiendo(true);
      const data = await uploadIncapacidadArchivo({ file, incapacidadId, archivoId, token });
      setResultado(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendo(false);
    }
  };

  const urlDocumento = resultado && (resultado.url_documento || resultado.url || resultado.location);

  return (
    <div style={{ padding: 24 }}>
      <h2>Prueba: POST /api/incapacidad/archivo</h2>
      <form onSubmit={onSubmit} style={{ maxWidth: 520 }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6 }}>Token (Bearer)</label>
          <input type="text" value={token} onChange={(e) => setToken(e.target.value)} placeholder="pega aquí tu JWT" style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6 }}>incapacidad_id (entero)</label>
          <input type="number" value={incapacidadId} onChange={(e) => setIncapacidadId(e.target.value)} placeholder="123" style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6 }}>archivo_id (entero)</label>
          <input type="number" value={archivoId} onChange={(e) => setArchivoId(e.target.value)} placeholder="5" style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6 }}>Archivo (pdf/png/jpg)</label>
          <input type="file" accept=".pdf,application/pdf,.png,image/png,.jpg,.jpeg,image/jpeg" onChange={onFile} />
        </div>
        <button type="submit" disabled={subiendo}>
          {subiendo ? 'Subiendo...' : 'Subir'}
        </button>
      </form>

      {error && (
        <p style={{ color: 'red', marginTop: 12 }}>{error}</p>
      )}

      {resultado && (
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 8 }}>Respuesta:</div>
          <pre style={{ background: '#f3f4f6', padding: 12, overflow: 'auto' }}>{JSON.stringify(resultado, null, 2)}</pre>
          {urlDocumento && (
            <div style={{ marginTop: 8 }}>
              <a href={urlDocumento} target="_blank" rel="noreferrer">Ver documento subido</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


