const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

function getAuthHeaders() {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (_) {
    return {};
  }
}

export async function getParametrosHijosByPadreId(padreId) {
  const res = await fetch(`/api/parametro_hijo/papashijos/${padreId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'omit',
  });
  let data = null;
  try { data = await res.json(); } catch (_) { data = null; }
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || `Error al cargar parámetros hijo del padre ${padreId}`;
    throw new Error(message);
  }
  return Array.isArray(data) ? data : [];
}

export async function getParametrosEPS() {
  return getParametrosHijosByPadreId(8); // ID 8 para EPS
}

export async function getParametrosDiagnostico() {
  return getParametrosHijosByPadreId(7); // ID 7 para diagnóstico
}

export async function getTiposIncapacidad() {
  return getParametrosHijosByPadreId(12); // ID 12 para tipo de incapacidad
}

export async function getCausasIncapacidad() {
  return getParametrosHijosByPadreId(11); // ID 11 para causa de incapacidad
}

// Servicio (catálogo). Permite configurar el ID del parámetro padre vía ENV.
// Si no hay ENV, usa un default razonable (por ejemplo 9).
export async function getParametrosServicio() {
  const servicioPadreId = Number(process.env.REACT_APP_PARAM_SERVICIO_ID || 9);
  return getParametrosHijosByPadreId(servicioPadreId);
}