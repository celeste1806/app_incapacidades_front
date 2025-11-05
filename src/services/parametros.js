/*const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';*/

function getAuthHeaders() {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (_) {
    return {};
  }
}

export async function getParametrosHijosByPapa(padreId) {
  const res = await fetch(`/api/parametro_hijo/papashijos/${padreId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
  });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || 'Error al obtener parámetros';
    throw new Error(message);
  }
  return Array.isArray(data) ? data : [];
}

export async function getEstadosIncapacidad() {
  const res = await fetch(`/api/parametro_hijo/papashijos/6`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
  });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || 'Error al obtener estados de incapacidad';
    throw new Error(message);
  }
  return Array.isArray(data) ? data : [];
}

export async function getParametrosPadre() {
  const res = await fetch(`/api/parametros`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'include',
  });
  let data = null;
  try { data = await res.json(); } catch (_) { data = null; }
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || 'Error al cargar parámetros';
    throw new Error(message);
  }
  return Array.isArray(data) ? data : [];
}

export async function createParametroHijo(payload) {
  const res = await fetch(`/api/parametro_hijo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    console.error('Error response:', { status: res.status, data });
    const message = (data && (data.message || data.error || data.detail)) || `Error al crear detalle (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export async function updateParametroHijo(id, payload) {
  const res = await fetch(`/api/parametro_hijo/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || 'Error al actualizar detalle';
    throw new Error(message);
  }
  return data;
}

export async function deleteParametroHijo(id) {
  const res = await fetch(`/api/parametro_hijo/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'include',
  });
  if (!res.ok) {
    let data = null;
    try { data = await res.json(); } catch (_) { data = null; }
    const message = (data && (data.message || data.error)) || 'Error al eliminar detalle';
    throw new Error(message);
  }
  return true;
}

export async function createParametro(payload) {
  const res = await fetch(`/api/parametros`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || 'Error al crear parámetro';
    throw new Error(message);
  }
  return data;
}

export async function updateParametro(id, payload) {
  const res = await fetch(`/api/parametros/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || 'Error al actualizar parámetro';
    throw new Error(message);
  }
  return data;
}

export async function deleteParametro(id) {
  const res = await fetch(`/api/parametros/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'include',
  });
  if (!res.ok) {
    let data = null;
    try { data = await res.json(); } catch (_) { data = null; }
    const message = (data && (data.message || data.error)) || 'Error al eliminar parámetro';
    throw new Error(message);
  }
  return true;
}


