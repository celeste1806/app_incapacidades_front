function getAuthHeaders() {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (_) {
    return {};
  }
}

export async function getMyProfile(headers = {}) {
  const res = await fetch(`/api/auth/me`, {
    method: 'GET',
    headers: { 'Accept': 'application/json', ...getAuthHeaders(), ...headers },
    credentials: 'include',
  });
  const data = await safeReadJson(res);
  if (!res.ok) {
    throw new Error(getErrorMessage(data) || 'No se pudo cargar el perfil');
  }
  return data;
}

// Eliminado getUserById: no existe endpoint /api/usuario/{id}

export async function updateMyProfile(payload, headers = {}) {
  const isFormData = (typeof FormData !== 'undefined') && (payload instanceof FormData);
  const requestInit = {
    method: 'PUT',
    headers: isFormData ? { 'Accept': 'application/json', ...headers } : { 'Content-Type': 'application/json', 'Accept': 'application/json', ...headers },
    credentials: 'include',
    body: isFormData ? payload : JSON.stringify(payload),
  };
  const res = await fetch(`/api/auth/me`, requestInit);
  const data = await safeReadJson(res);
  if (!res.ok) {
    throw new Error(getErrorMessage(data) || 'No se pudo actualizar el perfil');
  }
  return data;
}

// Obtener todos los usuarios (solo para administradores)
export async function getAllUsers(skip = 0, limit = 100) {
  // Intento 1: endpoint enriquecido (si existe en backend)
  let res = await fetch(`/api/auth/usuarios/human?skip=${skip}&limit=${limit}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'include',
  });
  if (res.status === 404) {
    // Fallback: endpoint original
    res = await fetch(`/api/auth/usuarios?skip=${skip}&limit=${limit}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json', ...getAuthHeaders() },
      credentials: 'include',
    });
  }
  const data = await safeReadJson(res);
  if (!res.ok) {
    throw new Error(getErrorMessage(data) || 'No se pudieron cargar los usuarios');
  }
  return data;
}

// Cambiar estado de un usuario (activar/desactivar)
export async function changeUserStatus(id_usuario, estado) {
  const res = await fetch(`/api/auth/usuarios/${id_usuario}/estado`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'include',
    body: JSON.stringify({ estado }),
  });
  const data = await safeReadJson(res);
  if (!res.ok) {
    throw new Error(getErrorMessage(data) || 'No se pudo cambiar el estado del usuario');
  }
  return data;
}

// Cambiar rol de un usuario (solo admins). rol_id: 10=admin, 9=empleado
export async function changeUserRole(id_usuario, rol_id) {
  const res = await fetch(`/api/auth/usuarios/${id_usuario}/rol`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'include',
    body: JSON.stringify({ rol_id }),
  });
  const data = await safeReadJson(res);
  if (!res.ok) {
    throw new Error(getErrorMessage(data) || 'No se pudo cambiar el rol del usuario');
  }
  return data;
}

export async function updateUserAdmin(id_usuario, payload) {
  const res = await fetch(`/api/auth/usuarios/${id_usuario}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await safeReadJson(res);
  if (!res.ok) {
    throw new Error(getErrorMessage(data) || 'No se pudo actualizar el usuario');
  }
  return data;
}

async function safeReadJson(res) {
  try { return await res.json(); } catch (_) { return null; }
}

function getErrorMessage(data) {
  if (!data) return '';
  if (typeof data === 'string') return data;
  if (data.message) return data.message;
  if (data.detail) return data.detail;
  if (data.error) return data.error;
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const first = data.errors[0];
    return first.msg || first.message || JSON.stringify(first);
  }
  return '';
}


