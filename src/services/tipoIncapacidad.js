const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

function getAuthHeaders() {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (_) {
    return {};
  }
}

export async function getTiposIncapacidad() {
  const res = await fetch(`/api/tipo_incapacidad/`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'omit',
  });
  let data = null;
  try { data = await res.json(); } catch (_) { data = null; }
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || 'Error al cargar tipos de incapacidad';
    throw new Error(message);
  }
  return Array.isArray(data) ? data : [];
}

export async function createTipoIncapacidad(payload) {
  const res = await fetch(`/api/tipo_incapacidad/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'omit',
    body: JSON.stringify(payload),
  });
  let data = null;
  try { data = await res.json(); } catch (_) { data = null; }
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || 'Error al crear tipo de incapacidad';
    throw new Error(message);
  }
  return data;
}

export async function updateTipoIncapacidad(id, payload) {
  const res = await fetch(`/api/tipo_incapacidad/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'omit',
    body: JSON.stringify(payload),
  });
  let data = null;
  try { data = await res.json(); } catch (_) { data = null; }
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || 'Error al actualizar tipo de incapacidad';
    throw new Error(message);
  }
  return data;
}

export async function deleteTipoIncapacidad(id) {
  const res = await fetch(`/api/tipo_incapacidad/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'omit',
  });
  if (!res.ok) {
    let data = null;
    try { data = await res.json(); } catch (_) { data = null; }
    const message = (data && (data.message || data.error)) || 'Error al eliminar tipo de incapacidad';
    throw new Error(message);
  }
  return true;
}



