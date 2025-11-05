function getAuthHeaders() {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (_) {
    return {};
  }
}

export async function getArchivosByIncapacidad(incapacidadId) {
  const res = await fetch(`/api/archivo?incapacidad_id=${encodeURIComponent(incapacidadId)}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'omit',
  });
  let data;
  try { data = await res.json(); } catch (_) { data = null; }
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || `Error al cargar archivos (${res.status})`;
    throw new Error(message);
  }
  return Array.isArray(data) ? data : [];
}

export async function uploadArchivo({ incapacidadId, tipoArchivoId, file }) {
  const form = new FormData();
  form.append('incapacidad_id', incapacidadId);
  form.append('tipo_archivo_id', tipoArchivoId); // Ajusta si tu backend usa otro nombre
  form.append('archivo', file);

  const res = await fetch(`/api/archivo/`, {
    method: 'POST',
    headers: { 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'omit',
    body: form,
  });
  let data;
  try { data = await res.json(); } catch (_) {
    try { data = { error: await res.text() }; } catch (_) { data = { error: '' }; }
  }
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || 'Error al subir archivo';
    // eslint-disable-next-line no-console
    console.error('Error POST /api/archivo/', { status: res.status, data });
    throw new Error(message);
  }
  return data;
}

export async function deleteArchivo(archivoId) {
  const res = await fetch(`/api/archivo/${encodeURIComponent(archivoId)}`, {
    method: 'DELETE',
    headers: { 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'omit',
  });
  if (!res.ok) {
    let data;
    try { data = await res.json(); } catch (_) { data = null; }
    const message = (data && (data.message || data.error)) || `Error al eliminar archivo (${res.status})`;
    throw new Error(message);
  }
  return true;
}

// Catálogo de tipos/entradas de archivo (id, nombre, descripcion) - operaciones JSON
export async function getArchivosCatalog() {
  const res = await fetch(`/api/archivo/`, {
    method: 'GET',
    headers: { 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'omit',
  });
  let data;
  try { data = await res.json(); } catch (_) { data = null; }
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || 'Error al cargar archivos';
    throw new Error(message);
  }
  return Array.isArray(data) ? data : [];
}

export async function createArchivoCatalog(payload) {
  const res = await fetch(`/api/archivo/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'omit',
    body: JSON.stringify(payload),
  });
  let data;
  try { data = await res.json(); } catch (_) { data = null; }
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || 'Error al crear archivo';
    throw new Error(message);
  }
  return data;
}

export async function updateArchivoCatalog(id, payload) {
  const res = await fetch(`/api/archivo/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'omit',
    body: JSON.stringify(payload),
  });
  let data;
  try { data = await res.json(); } catch (_) { data = null; }
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || 'Error al actualizar archivo';
    throw new Error(message);
  }
  return data;
}

