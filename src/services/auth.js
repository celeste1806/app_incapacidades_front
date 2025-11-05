const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export async function postRegister(payload) {
  const res = await fetch(`/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await safeReadJson(res);
  if (!res.ok) {
    const message = getErrorMessage(data) || 'Error al registrar';
    throw new Error(message);
  }
  return data;
}

export async function postLogin(payload) {
  const mapped = (() => {
    if (payload && typeof payload === 'object') {
      if (payload.email) {
        return { email: payload.email, password: payload.password };
      }
      if (payload.correo_electronico) {
        return { email: payload.correo_electronico, password: payload.password };
      }
    }
    return payload;
  })();
  const res = await fetch(`/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    credentials: 'include', // Importante para cookies HttpOnly
    body: JSON.stringify(mapped),
  });
  const raw = await safeReadJson(res);
  if (!res.ok) {
    const message = getErrorMessage(raw) || 'Credenciales inválidas';
    throw new Error(message);
  }
  // Normalizar respuesta del backend
  const normalized = {
    accessToken: raw && (raw.access_token || raw.accessToken) || '',
    tokenType: raw && (raw.token_type || raw.tokenType) || 'bearer',
    user: raw ? {
      id: raw.id_usuario ?? raw.id ?? null,
      correo_electronico: raw.correo_electronico ?? raw.email ?? '',
      rol: raw.rol ?? raw.role ?? null,
      nombre: raw.nombre ?? raw.name ?? '',
    } : null,
    raw,
  };
  return normalized;
}

export async function postLogout() {
  const res = await fetch(`/api/auth/logout`, {
    method: 'POST',
    credentials: 'include', // Importante para cookies HttpOnly
  });
  if (!res.ok) {
    throw new Error('Error al cerrar sesión');
  }
  return true;
}

export async function refreshToken() {
  const res = await fetch(`/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include', // El refresh token está en la cookie
  });
  const data = await safeReadJson(res);
  if (!res.ok) {
    const message = getErrorMessage(data) || 'Token refresh failed';
    throw new Error(message);
  }
  return data;
}

export async function getCurrentUser() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (!token) {
    throw new Error('Token no proporcionado');
  }
  
  const res = await fetch(`/api/auth/me`, {
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json', 
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    credentials: 'include',
  });
  const data = await safeReadJson(res);
  if (!res.ok) {
    const message = getErrorMessage(data) || 'No hay sesión activa';
    throw new Error(message);
  }
  return data;
}

export async function requestPasswordReset(email) {
  const res = await fetch(`/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email }),
  });
  const data = await safeReadJson(res);
  if (!res.ok) {
    const message = getErrorMessage(data) || 'No se pudo enviar el correo de recuperación';
    throw new Error(message);
  }
  return true;
}

export async function resetPassword(token, password) {
  const res = await fetch(`/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ token, password }),
  });
  const data = await safeReadJson(res);
  if (!res.ok) {
    const message = getErrorMessage(data) || 'No se pudo restablecer la contraseña';
    throw new Error(message);
  }
  return true;
}

async function safeReadJson(res) {
  try {
    return await res.json();
  } catch (e) {
    return null;
  }
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