export async function uploadImagen({ file, incapacidadId, token }) {
  if (!file) throw new Error('Archivo requerido');
  if (file.type !== 'image/png') throw new Error('El archivo debe ser PNG');
  const idNum = Number(incapacidadId);
  if (!Number.isInteger(idNum)) throw new Error('incapacidad_id debe ser entero');

  const form = new FormData();
  form.append('file', file);
  form.append('incapacidad_id', String(idNum));

  const resp = await fetch('/api/upload/imagen', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token || ''}`
      // Content-Type NO se pone manualmente en multipart/form-data con FormData
    },
    body: form
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(text || `Error ${resp.status}`);
  }
  // Se asume respuesta JSON que incluye url_documento
  const data = await resp.json().catch(() => ({}));
  return data;
}


export async function uploadIncapacidadArchivo({ file, incapacidadId, archivoId, token }) {
  if (!file) throw new Error('Archivo requerido');
  const allowed = ['application/pdf', 'image/png', 'image/jpeg'];
  const type = (file.type || '').toLowerCase();
  if (!allowed.includes(type)) throw new Error('Formato no permitido (pdf/png/jpg)');
  const incId = Number(incapacidadId);
  const arcId = Number(archivoId);
  if (!Number.isInteger(incId)) throw new Error('incapacidad_id debe ser entero');
  if (!Number.isInteger(arcId)) throw new Error('archivo_id debe ser entero');

  // Obtener el token del localStorage si no se proporciona
  const authToken = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null);
  
  const form = new FormData();
  form.append('incapacidad_id', String(incId));
  form.append('archivo_id', String(arcId));
  form.append('file', file);
  
  console.log('📤 Subiendo archivo:', {
    incapacidadId: incId,
    archivoId: arcId,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size
  });

  const resp = await fetch('/api/incapacidad/archivo', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken || ''}`,
    },
    body: form,
  });

  let text = '';
  try { text = await resp.text(); } catch (_) {}
  if (!resp.ok) {
    throw new Error(text || `Error ${resp.status}`);
  }
  try { return JSON.parse(text); } catch (_) { return {}; }
}

