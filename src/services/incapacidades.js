function getAuthHeaders() {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (_) {
    return {};
  }
}

export async function getIncapacidadesUsuario() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (!token) {
    throw new Error('No hay token de autenticación');
  }
  
  const res = await fetch(`/api/incapacidad/`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'omit',
  });
  
  if (!res.ok) {
    let body;
    try {
      body = await res.json();
    } catch (_) {
      try { body = await res.text(); } catch (_) { body = ''; }
    }
    // eslint-disable-next-line no-console
    console.error('Error GET /api/incapacidad/', { status: res.status, body });
    const message = (body && (body.message || body.error)) || `Error al cargar incapacidades (${res.status})`;
    throw new Error(message);
  }
  
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

// Obtener todas las incapacidades para estadísticas (sin filtro de estado)
export async function getAllIncapacidades() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (!token) {
    throw new Error('No hay token de autenticación');
  }
  
  const res = await fetch(`/api/incapacidad/`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'omit',
  });
  
  if (!res.ok) {
    let body;
    try {
      body = await res.json();
    } catch (_) {
      try { body = await res.text(); } catch (_) { body = ''; }
    }
    console.error('Error GET /api/incapacidad/', { status: res.status, body });
    const message = (body && (body.message || body.error)) || `Error al cargar todas las incapacidades (${res.status})`;
    throw new Error(message);
  }
  
  const data = await res.json();
  console.log('🔍 DEBUG getAllIncapacidades - Datos recibidos:', data);
  console.log('🔍 DEBUG getAllIncapacidades - Tipo:', typeof data);
  console.log('🔍 DEBUG getAllIncapacidades - Es array:', Array.isArray(data));
  
  // Manejar nueva estructura de respuesta del backend
  if (data && typeof data === 'object' && 'incapacidades' in data) {
    console.log('🔍 DEBUG getAllIncapacidades - Estructura nueva detectada, extraer incapacidades');
    const incapacidades = data.incapacidades || [];
    console.log('🔍 DEBUG getAllIncapacidades - Incapacidades extraídas:', incapacidades.length);
    return incapacidades;
  } else {
    console.log('🔍 DEBUG getAllIncapacidades - Estructura antigua detectada (array directo)');
    return Array.isArray(data) ? data : [];
  }
}

// Obtener todas las incapacidades pendientes (estado 11) para administradores
export async function getIncapacidadesPendientes() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (!token) {
    throw new Error('No hay token de autenticación');
  }
  
  const res = await fetch(`/api/incapacidad/?estado=11&limit=1000`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'omit',
  });
  
  if (!res.ok) {
    let body;
    try {
      body = await res.json();
    } catch (_) {
      try { body = await res.text(); } catch (_) { body = ''; }
    }
    // eslint-disable-next-line no-console
    console.error('Error GET /api/incapacidad/?estado=11', { status: res.status, body });
    const message = (body && (body.message || body.error)) || `Error al cargar incapacidades pendientes (${res.status})`;
    throw new Error(message);
  }
  
  const data = await res.json();
  console.log('🔍 DEBUG getIncapacidadesPendientes - Datos recibidos del backend:', data);
  console.log('🔍 DEBUG getIncapacidadesPendientes - Tipo de datos:', typeof data);
  console.log('🔍 DEBUG getIncapacidadesPendientes - Es array?', Array.isArray(data));
  
  // Manejar nueva estructura de respuesta del backend
  if (data && typeof data === 'object' && 'incapacidades' in data) {
    console.log('🔍 DEBUG getIncapacidadesPendientes - Estructura nueva detectada');
    console.log('🔍 DEBUG getIncapacidadesPendientes - Estados disponibles:', data.estados_disponibles);
    return data; // Retornar objeto completo con incapacidades y estados_disponibles
  } else {
    // Fallback para estructura antigua (array directo)
    console.log('🔍 DEBUG getIncapacidadesPendientes - Estructura antigua detectada');
    return Array.isArray(data) ? data : [];
  }
}

// Obtener todas las incapacidades rechazadas (estado 50) para administradores
export async function getIncapacidadesRechazadas() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (!token) {
    throw new Error('No hay token de autenticación');
  }
  
  const res = await fetch(`/api/incapacidad/?estado=50&limit=1000`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'omit',
  });
  
  if (!res.ok) {
    let body;
    try {
      body = await res.json();
    } catch (_) {
      try { body = await res.text(); } catch (_) { body = ''; }
    }
    // eslint-disable-next-line no-console
    console.error('Error GET /api/incapacidad/?estado=50', { status: res.status, body });
    const message = (body && (body.message || body.error)) || `Error al cargar incapacidades rechazadas (${res.status})`;
    throw new Error(message);
  }
  
  const data = await res.json();
  console.log('🔍 DEBUG getIncapacidadesRechazadas - Datos recibidos:', data);
  
  // Manejar nueva estructura de respuesta del backend
  if (data && typeof data === 'object' && 'incapacidades' in data) {
    console.log('🔍 DEBUG getIncapacidadesRechazadas - Estructura nueva detectada');
    return data; // Retornar objeto completo con incapacidades y estados_disponibles
  } else {
    // Fallback para estructura antigua (array directo)
    console.log('🔍 DEBUG getIncapacidadesRechazadas - Estructura antigua detectada');
    if (data.length > 0) {
      console.log('🔍 DEBUG getIncapacidadesRechazadas - Primera incapacidad:', data[0]);
      console.log('🔍 DEBUG getIncapacidadesRechazadas - Campos disponibles:', Object.keys(data[0]));
    }
    return Array.isArray(data) ? data : [];
  }
}

// Obtener todas las incapacidades No Pagas (estado 44) para administradores
export async function getIncapacidadesNoPagas() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (!token) {
    throw new Error('No hay token de autenticación');
  }
  
  const res = await fetch(`/api/incapacidad/?estado=44&limit=1000`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'omit',
  });
  
  if (!res.ok) {
    let body;
    try {
      body = await res.json();
    } catch (_) {
      try { body = await res.text(); } catch (_) { body = ''; }
    }
    // eslint-disable-next-line no-console
    console.error('Error GET /api/incapacidad/?estado=44', { status: res.status, body });
    const message = (body && (body.message || body.error)) || `Error al cargar incapacidades No Pagas (${res.status})`;
    throw new Error(message);
  }
  
  const data = await res.json();
  
  // Manejar nueva estructura de respuesta del backend
  if (data && typeof data === 'object' && 'incapacidades' in data) {
    return data; // Retornar objeto completo con incapacidades y estados_disponibles
  } else {
    // Fallback para estructura antigua (array directo)
    return Array.isArray(data) ? data : [];
  }
}

// Obtener todas las incapacidades Pagas (estado 40) para administradores
export async function getIncapacidadesPagas() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (!token) {
    throw new Error('No hay token de autenticación');
  }
  
  const res = await fetch(`/api/incapacidad/?estado=40&limit=1000`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'omit',
  });
  
  if (!res.ok) {
    let body;
    try {
      body = await res.json();
    } catch (_) {
      try { body = await res.text(); } catch (_) { body = ''; }
    }
    // eslint-disable-next-line no-console
    console.error('Error GET /api/incapacidad/?estado=40', { status: res.status, body });
    const message = (body && (body.message || body.error)) || `Error al cargar incapacidades Pagas (${res.status})`;
    throw new Error(message);
  }
  
  const data = await res.json();
  
  // Manejar nueva estructura de respuesta del backend
  if (data && typeof data === 'object' && 'incapacidades' in data) {
    return data; // Retornar objeto completo con incapacidades y estados_disponibles
  } else {
    // Fallback para estructura antigua (array directo)
    return Array.isArray(data) ? data : [];
  }
}

// Obtener todas las incapacidades en "Trámite de EPS" (estado 12) para administradores
export async function getIncapacidadesRealizadas() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (!token) {
    throw new Error('No hay token de autenticación');
  }
  
  const res = await fetch(`/api/incapacidad/?estado=12&limit=1000`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'omit',
  });
  
  if (!res.ok) {
    let body;
    try {
      body = await res.json();
    } catch (_) {
      try { body = await res.text(); } catch (_) { body = ''; }
    }
    // eslint-disable-next-line no-console
    console.error('Error GET /api/incapacidad/?estado=12', { status: res.status, body });
    const message = (body && (body.message || body.error)) || `Error al cargar Trámite de EPS (${res.status})`;
    throw new Error(message);
  }
  
  const data = await res.json();
  
  // Manejar nueva estructura de respuesta del backend
  if (data && typeof data === 'object' && 'incapacidades' in data) {
    return data; // Retornar objeto completo con incapacidades y estados_disponibles
  } else {
    // Fallback para estructura antigua (array directo)
    return Array.isArray(data) ? data : [];
  }
}

// Alias para mantener consistencia con el nuevo nombre de la página
export { getIncapacidadesRealizadas as getIncapacidadesTramiteDeEps };

// Lista las incapacidades del usuario autenticado (empleado)
export async function getMisIncapacidades() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (!token) {
    throw new Error('No hay token de autenticación');
  }

  const res = await fetch(`/api/incapacidad/mias`, {
    method: 'GET',
    headers: { 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'omit',
  });

  if (!res.ok) {
    let body;
    try { body = await res.json(); } catch (_) { try { body = await res.text(); } catch (_) { body = ''; } }
    // eslint-disable-next-line no-console
    console.error('Error GET /api/incapacidad/mias', { status: res.status, body });
    const message = (body && (body.message || body.error || body.detail)) || `Error al cargar mis incapacidades (${res.status})`;
    throw new Error(message);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

// Eliminar una incapacidad por id (para administradores)
export async function deleteIncapacidad(id_incapacidad) {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (!token) {
    throw new Error('No hay token de autenticación');
  }
  const res = await fetch(`/api/incapacidad/${encodeURIComponent(id_incapacidad)}`, {
    method: 'DELETE',
    headers: { 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'omit',
  });
  if (!res.ok) {
    let body;
    try { body = await res.json(); } catch (_) { try { body = await res.text(); } catch (_) { body = ''; } }
    console.error('Error DELETE /api/incapacidad/{id}', { status: res.status, body });
    const message = (body && (body.message || body.error || body.detail)) || `Error al eliminar incapacidad (${res.status})`;
    throw new Error(message);
  }
  return true;
}

export async function createIncapacidad(formOrJson, tokenOverride) {
  const token = tokenOverride || (typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null);
  if (!token) {
    throw new Error('No hay token de autenticación');
  }

  // Acepta tanto un objeto JSON ya listo como un FormData desde el cual derivar JSON
  const payload = (() => {
    if (formOrJson && typeof formOrJson === 'object' && !(typeof FormData !== 'undefined' && formOrJson instanceof FormData)) {
      return formOrJson;
    }
    // Convertir FormData a JSON, omitiendo archivos
    const json = {};
    try {
      for (const [key, value] of formOrJson.entries()) {
        if (typeof File !== 'undefined' && value instanceof File) continue;
        json[key] = value;
      }
    } catch (_) {}
    return json;
  })();

  const res = await fetch(`/api/incapacidad/`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    credentials: 'omit',
    body: JSON.stringify(payload),
  });

  const parsed = await res.json().catch(async () => {
    const text = await res.text().catch(() => '');
    return text ? { error: text } : null;
  });

  if (!res.ok) {
    const bodyMsg = (() => {
      if (!parsed) return '';
      if (typeof parsed === 'string') return parsed;
      return parsed.message || parsed.detail || parsed.error || '';
    })();
    const message = `HTTP ${res.status}${bodyMsg ? ` - ${bodyMsg}` : ''}`;
    // eslint-disable-next-line no-console
    console.error('Error POST /api/incapacidad/', { status: res.status, response: parsed });
    throw new Error(message);
  }
  return parsed;
}

// Helper para construir el payload que espera el backend desde el estado del formulario
export function buildIncapacidadPayloadFromFormState(formState) {
  const toDate = (s) => s ? new Date(s) : null;
  const fi = toDate(formState.fecha_inicio);
  const ff = toDate(formState.fecha_fin);
  let dias = 0;
  if (fi && ff) {
    const msPerDay = 24 * 60 * 60 * 1000;
    dias = Math.floor((ff - fi) / msPerDay) + 1;
  }
  return {
    tipo_incapacidad_id: Number(formState.tipo_incapacidad),
    causa_id: Number(formState.causa_incapacidad),
    fecha_inicio: formState.fecha_inicio,
    fecha_final: formState.fecha_fin,
    dias,
    eps_afiliado_id: Number(formState.eps),
    servicio_id: Number(formState.servicio),
    diagnostico_id: Number(formState.diagnostico),
    salario: Number(formState.salario),
  };
}

// Notificar a administradores que se creó una incapacidad
export async function notifyAdminsNuevaIncapacidad(incapacidadId) {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (!token) return;
  try {
    await fetch(`/api/incapacidad/${encodeURIComponent(incapacidadId)}/notify-admins`, {
      method: 'POST',
      headers: { 'Accept': 'application/json', ...getAuthHeaders() },
      credentials: 'omit',
    });
  } catch (_) {
    // Silencioso: la creación no debe fallar si la notificación falla
  }
}

// Obtener detalles completos de una incapacidad (incluye documentos)
export async function getIncapacidadDetalle(id_incapacidad) {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (!token) {
    throw new Error('No hay token de autenticación');
  }
  
  const res = await fetch(`/api/incapacidad/${encodeURIComponent(id_incapacidad)}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json', ...getAuthHeaders() },
    credentials: 'omit',
  });
  
  if (!res.ok) {
    let body;
    try {
      body = await res.json();
    } catch (_) {
      try { body = await res.text(); } catch (_) { body = ''; }
    }
    console.error('Error GET /api/incapacidad/', { status: res.status, body });
    const message = (body && (body.message || body.error || body.detail)) || `Error al cargar incapacidad (${res.status})`;
    throw new Error(message);
  }
  
  return await res.json();
}

// Actualizar campos administrativos de una incapacidad
export async function actualizarIncapacidadAdministrativa(id_incapacidad, payload) {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (!token) {
    throw new Error('No hay token de autenticación');
  }
  
  const res = await fetch(`/api/incapacidad/${encodeURIComponent(id_incapacidad)}/administrativo`, {
    method: 'PUT',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    credentials: 'omit',
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    let body;
    try {
      body = await res.json();
    } catch (_) {
      try { body = await res.text(); } catch (_) { body = ''; }
    }
    console.error('Error PUT /api/incapacidad/administrativo', { status: res.status, body });
    const message = (body && (body.message || body.error || body.detail)) || `Error al actualizar incapacidad (${res.status})`;
    throw new Error(message);
  }
  
  return await res.json();
}

// Cambiar el estado de una incapacidad
export async function cambiarEstadoIncapacidad(id_incapacidad, nuevoEstado, mensajeRechazo = null, motivoNoPagas = null) {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (!token) {
    throw new Error('No hay token de autenticación');
  }
  
  const payload = { estado: nuevoEstado };
  if (mensajeRechazo) {
    payload.mensaje_rechazo = mensajeRechazo;
  }
  if (motivoNoPagas) {
    payload.motivo_no_pagas = motivoNoPagas;
  }
  
  console.log('🔍 DEBUG cambiarEstadoIncapacidad:', {
    id_incapacidad,
    nuevoEstado,
    mensajeRechazo,
    motivoNoPagas,
    payload
  });
  
  const res = await fetch(`/api/incapacidad/${encodeURIComponent(id_incapacidad)}/estado`, {
    method: 'PUT',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    credentials: 'omit',
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    let body;
    try {
      body = await res.json();
    } catch (_) {
      try { body = await res.text(); } catch (_) { body = ''; }
    }
    console.error('❌ Error PUT /api/incapacidad/estado', { status: res.status, body });
    const message = (body && (body.message || body.error || body.detail)) || `Error al cambiar estado de incapacidad (${res.status})`;
    throw new Error(message);
  }
  
  const data = await res.json();
  console.log('✅ Respuesta exitosa:', data);
  return data;
}

// Listar estados de incapacidad (intenta endpoint y tiene fallback)
export async function getEstadosIncapacidad() {
  const headers = { 'Accept': 'application/json', ...getAuthHeaders() };
  try {
    const res = await fetch('/api/incapacidad/estados', { method: 'GET', headers, credentials: 'omit' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
      if (data && Array.isArray(data.estados)) return data.estados;
    }
  } catch (_) {}
  // Fallback a conjunto conocido
  return [
    { id: 11, nombre: 'Pendiente' },
    { id: 12, nombre: 'Trámite' },
    { id: 40, nombre: 'Pagas' },
    { id: 44, nombre: 'No Pagas' },
    { id: 50, nombre: 'Rechazada' }
  ];
}

// Actualizar datos del formulario de una incapacidad
export async function actualizarIncapacidadFormulario(id_incapacidad, payload) {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (!token) {
    throw new Error('No hay token de autenticación');
  }
  
  const res = await fetch(`/api/incapacidad/${encodeURIComponent(id_incapacidad)}/formulario`, {
    method: 'PUT',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    credentials: 'omit',
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    let body;
    try {
      body = await res.json();
    } catch (_) {
      try { body = await res.text(); } catch (_) { body = ''; }
    }
    console.error('Error PUT /api/incapacidad/formulario', { status: res.status, body });
    const message = (body && (body.message || body.error || body.detail)) || `Error al actualizar formulario de incapacidad (${res.status})`;
    throw new Error(message);
  }
  
  return await res.json();
}

// Empleado corrige y reenvía su incapacidad rechazada
export async function actualizarMiIncapacidad(id_incapacidad, payload) {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (!token) {
    throw new Error('No hay token de autenticación');
  }
  // Intentar primero PUT; si el frontend dev server bloquea PUT (405), usar POST alterno /reenviar
  const tryRequest = async (method, path) => {
    const res = await fetch(path, {
      method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      credentials: 'omit',
      body: JSON.stringify(payload),
    });
    return res;
  };
  let res = await tryRequest('PUT', `/api/incapacidad/mias/${encodeURIComponent(id_incapacidad)}`);
  if (res.status === 405) {
    res = await tryRequest('POST', `/api/incapacidad/mias/${encodeURIComponent(id_incapacidad)}/reenviar`);
  }
  if (!res.ok) {
    let body;
    try { body = await res.json(); } catch (_) { try { body = await res.text(); } catch (_) { body = ''; } }
    const message = (body && (body.message || body.error || body.detail)) || `Error al actualizar incapacidad (${res.status})`;
    throw new Error(message);
  }
  return await res.json();
}
