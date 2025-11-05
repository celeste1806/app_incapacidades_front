function getAuthHeaders() {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (_) { return {}; }
}

// GET api/relacion
export async function getRelaciones() {
  const res = await fetch(`/api/relacion`, {
    method: 'GET',
    headers: { 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'omit',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data && (data.message || data.error)) || 'Error al listar relaciones');
  }
  // eslint-disable-next-line no-console
  console.log('GET /api/relacion ->', data);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.relaciones)) return data.relaciones;
  // tomar el primer valor que sea array
  for (const v of Object.values(data || {})) {
    if (Array.isArray(v)) return v;
  }
  return [];
}

// GET api/relacion/por_tipo/{tipo_incapacidad_id}
export async function getRelacionesPorTipo(tipoId) {
  const res = await fetch(`/api/relacion/por_tipo/${encodeURIComponent(tipoId)}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'omit',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data && (data.message || data.error)) || 'Error al listar relaciones por tipo');
  }
  // eslint-disable-next-line no-console
  console.log('GET /api/relacion/por_tipo ->', data);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.relaciones)) return data.relaciones;
  for (const v of Object.values(data || {})) {
    if (Array.isArray(v)) return v;
  }
  return [];
}

// GET api/relacion/por_tipo/{tipo_incapacidad_id}/archivos
export async function getArchivosPorTipo(tipoId) {
  const res = await fetch(`/api/relacion/por_tipo/${encodeURIComponent(tipoId)}/archivos`, {
    method: 'GET',
    headers: { 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'omit',
  });
  let data;
  try { data = await res.json(); } catch (_) { data = null; }
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || 'Error al cargar archivos por tipo';
    throw new Error(message);
  }
  // Normalizar posibles formas de entregar el arreglo
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  for (const v of Object.values(data || {})) {
    if (Array.isArray(v)) return v;
  }
  return [];
}

// POST api/relacion
export async function createRelacion(payload) {
  const res = await fetch(`/api/relacion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'omit',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Error al crear relación');
  }
  return data;
}

// DELETE api/relacion
export async function deleteRelacion(id) {
  const res = await fetch(`/api/relacion/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'omit',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || data.error || 'Error al eliminar relación');
  }
  return true;
}


// DELETE api/relacion?tipo_incapacidad_id=...&archivo_id=...
export async function deleteRelacionByComposite(tipoIncapacidadId, archivoId) {
  const url = `/api/relacion?tipo_incapacidad_id=${encodeURIComponent(tipoIncapacidadId)}&archivo_id=${encodeURIComponent(archivoId)}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'omit',
  });
  if (!res.ok) {
    let data;
    try { data = await res.json(); } catch (_) { data = {}; }
    throw new Error((data && (data.message || data.error)) || 'Error al eliminar relación');
  }
  return true;
}


