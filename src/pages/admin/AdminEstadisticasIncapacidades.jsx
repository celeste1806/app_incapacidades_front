import React, { useState, useEffect } from 'react';
import { getAllIncapacidades } from '../../services/incapacidades';
import { getParametrosServicio, getParametrosEPS } from '../../services/parametrosHijos';
import '../../styles/admin-parametros.css';
import '../../styles/admin-estadisticas.css';
import '../../styles/admin-pages-blue.css';

export default function AdminEstadisticasIncapacidades() {
  const [incapacidades, setIncapacidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Filtros avanzados
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [servicioSeleccionado, setServicioSeleccionado] = useState('');
  const [serviciosCatalogo, setServiciosCatalogo] = useState([]);
  const [epsCatalogo, setEpsCatalogo] = useState([]);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState('');
  const [epsSeleccionada, setEpsSeleccionada] = useState('');
  const [empleadoQuery, setEmpleadoQuery] = useState('');

  const getParametroDisplay = (item) => {
    const raw = (item && (item.nombre || item.descripcion || item.valor || item.texto || item.servicio)) || '';
    let text = String(raw).replace(/<[^>]*>/g, '').trim();
    if (/^data:image\//i.test(text)) text = '';
    return text;
  };

  const parseLocalInputDate = (value) => {
    if (!value) return null;
    const parts = value.split('-').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
    const [year, month, day] = parts;
    return new Date(year, month - 1, day);
  };

  const dateFromParsed = parseLocalInputDate(dateFrom);
  const dateToParsed = parseLocalInputDate(dateTo);

  // Función para obtener headers de autenticación
  const getAuthHeaders = () => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      return {};
    }
    return {
      'Authorization': `Bearer ${token}`
    };
  };

  useEffect(() => {
    loadIncapacidades();
    (async () => {
      try {
        const servicios = await getParametrosServicio();
        setServiciosCatalogo(Array.isArray(servicios) ? servicios : []);
      } catch (_) {
        setServiciosCatalogo([]);
      }
      try {
        const eps = await getParametrosEPS();
        setEpsCatalogo(Array.isArray(eps) ? eps : []);
      } catch (_) {
        setEpsCatalogo([]);
      }
    })();
  }, []);

  const loadIncapacidades = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAllIncapacidades();
      setIncapacidades(data);
    } catch (e) {
      setError(e.message || 'Error cargando incapacidades');
    } finally {
      setLoading(false);
    }
  };

  const getEstadisticasMensuales = () => {
    // Filtrado base por fecha
    const incapacidadesFiltradas = incapacidades.filter(inc => {
      const fi = inc.fecha_inicio ? new Date(inc.fecha_inicio) : null;
      if (!fi) return false;
      // Filtro por rango
      const dFrom = parseLocalInputDate(dateFrom);
      if (dFrom && fi < dFrom) return false;

      const dTo = parseLocalInputDate(dateTo);
      if (dTo) {
        dTo.setHours(23,59,59,999);
        if (fi > dTo) return false;
      }
      return true;
    })
    .filter(inc => {
      // Filtro por empleado por nombre (texto)
      if (!empleadoQuery) return true;
      const nombre = (inc.usuario?.nombre_completo || inc.usuario?.nombre || inc.usuario_nombre || '').toLowerCase();
      return nombre.includes(empleadoQuery.toLowerCase());
    })
    .filter(inc => {
      // Filtro por servicio seleccionado
      if (!servicioSeleccionado) return true;
      const idInc = inc.servicio_id || inc.servicio || inc.id_servicio;
      if (idInc && String(idInc) === String(servicioSeleccionado)) return true;
      const nom = (inc.servicio_nombre || inc.servicio || '').toLowerCase();
      const selectedName = (serviciosCatalogo.find(s => String(s.id_parametrohijo || s.id) === String(servicioSeleccionado))?.nombre || '').toLowerCase();
      return selectedName && nom === selectedName;
    })
    .filter(inc => {
      // Filtro por estado
      if (!estadoSeleccionado) return true;
      return String(inc.estado) === String(estadoSeleccionado);
    })
    .filter(inc => {
      // Filtro por EPS
      if (!epsSeleccionada) return true;
      const idInc = inc.eps_afiliado_id || inc.eps || inc.id_eps;
      if (idInc && String(idInc) === String(epsSeleccionada)) return true;
      const nom = (inc.eps_afiliado_nombre || inc.eps_nombre || '').toLowerCase();
      const selectedName = (epsCatalogo.find(e => String(e.id_parametrohijo || e.id) === String(epsSeleccionada))?.nombre || '').toLowerCase();
      return selectedName && nom === selectedName;
    })
    ;

    const incapacidadesDelMes = incapacidadesFiltradas;

    const estadisticas = {
      total: incapacidadesDelMes.length,
      accidenteTransito: 0,
      enfermedadLaboral: 0,
      enfermedadGeneral: 0,
      accidenteLaboral: 0,
      licenciaPaternidad: 0,
      licenciaMaternidad: 0,
      otros: 0
    };

    incapacidadesDelMes.forEach(inc => {
      const tipoNombre = inc.tipo_incapacidad?.nombre?.toLowerCase() || '';
      
      if (tipoNombre.includes('accidente') && tipoNombre.includes('transito')) {
        estadisticas.accidenteTransito++;
      } else if (tipoNombre.includes('enfermedad') && tipoNombre.includes('laboral')) {
        estadisticas.enfermedadLaboral++;
      } else if (tipoNombre.includes('enfermedad') && tipoNombre.includes('general')) {
        estadisticas.enfermedadGeneral++;
      } else if (tipoNombre.includes('accidente') && tipoNombre.includes('laboral')) {
        estadisticas.accidenteLaboral++;
      } else if (tipoNombre.includes('paternidad')) {
        estadisticas.licenciaPaternidad++;
      } else if (tipoNombre.includes('maternidad')) {
        estadisticas.licenciaMaternidad++;
      } else {
        estadisticas.otros++;
      }
    });

    return estadisticas;
  };

  const getNombreMes = (mes) => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes - 1];
  };

  const getEstadoNombre = (estadoId) => {
    const estadoMap = {
      11: 'Pendiente',
      12: 'Trámite',
      40: 'Pagas',
      44: 'No Pagas',
      50: 'Rechazada'
    };
    return estadoMap[estadoId] || `Estado ${estadoId}` || 'N/A';
  };

  const generarAños = () => {
    const años = [];
    const añoActual = new Date().getFullYear();
    for (let i = añoActual; i >= añoActual - 5; i--) {
      años.push(i);
    }
    return años;
  };

  const estadisticas = getEstadisticasMensuales();

  const descargarEstadisticasExcelMulti = async () => {
    const ahora = new Date();
    // Nombres de hoja: Excel prohibe caracteres como ':' '/' '\\' '?' '*' '[' ']'. Usamos HHmm.
    const horaFmt = (d) => `${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}`;
    const addHours = (d, h) => new Date(d.getTime() + h * 3600 * 1000);

    const incapacidadesDelMes = getEstadisticasMensuales && Array.isArray(incapacidades)
      ? incapacidades.filter(inc => {
          const fi = inc.fecha_inicio ? new Date(inc.fecha_inicio) : null;
          if (!fi) return false;
          const dFrom = parseLocalInputDate(dateFrom);
          if (dFrom && fi < dFrom) return false;
          const dTo = parseLocalInputDate(dateTo);
          if (dTo) {
            dTo.setHours(23,59,59,999);
            if (fi > dTo) return false;
          }
          return true;
        })
        .filter(inc => {
          if (!empleadoQuery) return true;
          const nombre = (inc.usuario?.nombre_completo || inc.usuario?.nombre || inc.usuario_nombre || '').toLowerCase();
          return nombre.includes(empleadoQuery.toLowerCase());
        })
        .filter(inc => {
          if (!servicioSeleccionado) return true;
          const idInc = inc.servicio_id || inc.servicio || inc.id_servicio;
          if (idInc && String(idInc) === String(servicioSeleccionado)) return true;
          const nom = (inc.servicio_nombre || inc.servicio || '').toLowerCase();
          const selectedName = (serviciosCatalogo.find(s => String(s.id_parametrohijo || s.id) === String(servicioSeleccionado))?.nombre || '').toLowerCase();
          return selectedName && nom === selectedName;
        })
        .filter(inc => {
          if (!estadoSeleccionado) return true;
          return String(inc.estado) === String(estadoSeleccionado);
        })
        .filter(inc => {
          if (!epsSeleccionada) return true;
          const idInc = inc.eps_afiliado_id || inc.eps || inc.id_eps;
          if (idInc && String(idInc) === String(epsSeleccionada)) return true;
          const nom = (inc.eps_afiliado_nombre || inc.eps_nombre || '').toLowerCase();
          const selectedName = (epsCatalogo.find(e => String(e.id_parametrohijo || e.id) === String(epsSeleccionada))?.nombre || '').toLowerCase();
          return selectedName && nom === selectedName;
        })
        
      : [];

    // Cargar catálogo de usuarios para enriquecer con nombres y datos
    const usuariosCompletos = {};
    try {
      const resp = await fetch('/api/auth/usuarios/human?limit=2000', { headers: { 'Accept': 'application/json', ...getAuthHeaders() } });
      if (resp.ok) {
        const lista = await resp.json();
        (Array.isArray(lista) ? lista : []).forEach(u => { usuariosCompletos[u.id_usuario] = u; });
      }
    } catch (_) {}

    // Construir datos de hojas
    // Sumar días por tipo para el resumen
    const diasPorTipo = {
      accidenteTransito: 0,
      enfermedadLaboral: 0,
      enfermedadGeneral: 0,
      accidenteLaboral: 0,
      licenciaPaternidad: 0,
      licenciaMaternidad: 0,
      otros: 0,
      total: 0
    };
    const personasPorTipo = {
      accidenteTransito: new Set(),
      enfermedadLaboral: new Set(),
      enfermedadGeneral: new Set(),
      accidenteLaboral: new Set(),
      licenciaPaternidad: new Set(),
      licenciaMaternidad: new Set(),
      otros: new Set()
    };
    const personasTotales = new Set();
    incapacidadesDelMes.forEach(inc => {
      const d = Number(inc.dias || 0);
      diasPorTipo.total += d;
      const tipoNombre = (inc.tipo_incapacidad?.nombre || inc.tipo_nombre || '').toLowerCase();
      const uid = inc.usuario?.id_usuario || inc.usuario_id || inc.id_usuario;
      if (uid != null) { personasTotales.add(String(uid)); }
      if (tipoNombre.includes('accidente') && tipoNombre.includes('transito')) {
        diasPorTipo.accidenteTransito += d;
        if (uid != null) personasPorTipo.accidenteTransito.add(String(uid));
      } else if (tipoNombre.includes('enfermedad') && tipoNombre.includes('laboral')) {
        diasPorTipo.enfermedadLaboral += d;
        if (uid != null) personasPorTipo.enfermedadLaboral.add(String(uid));
      } else if (tipoNombre.includes('enfermedad') && tipoNombre.includes('general')) {
        diasPorTipo.enfermedadGeneral += d;
        if (uid != null) personasPorTipo.enfermedadGeneral.add(String(uid));
      } else if (tipoNombre.includes('accidente') && tipoNombre.includes('laboral')) {
        diasPorTipo.accidenteLaboral += d;
        if (uid != null) personasPorTipo.accidenteLaboral.add(String(uid));
      } else if (tipoNombre.includes('paternidad')) {
        diasPorTipo.licenciaPaternidad += d;
        if (uid != null) personasPorTipo.licenciaPaternidad.add(String(uid));
      } else if (tipoNombre.includes('maternidad')) {
        diasPorTipo.licenciaMaternidad += d;
        if (uid != null) personasPorTipo.licenciaMaternidad.add(String(uid));
      } else {
        diasPorTipo.otros += d;
        if (uid != null) personasPorTipo.otros.add(String(uid));
      }
    });
    const parsedFrom = parseLocalInputDate(dateFrom);
    const parsedTo = parseLocalInputDate(dateTo);
    const periodoTexto = parsedFrom && parsedTo 
      ? `${parsedFrom.toLocaleDateString('es-ES')} - ${parsedTo.toLocaleDateString('es-ES')}`
      : parsedFrom 
        ? `Desde ${parsedFrom.toLocaleDateString('es-ES')}`
        : parsedTo
          ? `Hasta ${parsedTo.toLocaleDateString('es-ES')}`
          : 'Todas las incapacidades';
    
    const sheetResumenTipos = [
      ['ESTADÍSTICAS DE INCAPACIDADES'],
      [`Período: ${periodoTexto}`],
      [''],
      ['TIPO DE INCAPACIDAD', 'CANTIDAD', 'PORCENTAJE', 'DÍAS', 'PERSONAS'],
      ['Accidente de Tránsito', estadisticas.accidenteTransito, `${estadisticas.total > 0 ? ((estadisticas.accidenteTransito / estadisticas.total) * 100).toFixed(1) : 0}%`, diasPorTipo.accidenteTransito, personasPorTipo.accidenteTransito.size],
      ['Enfermedad Laboral', estadisticas.enfermedadLaboral, `${estadisticas.total > 0 ? ((estadisticas.enfermedadLaboral / estadisticas.total) * 100).toFixed(1) : 0}%`, diasPorTipo.enfermedadLaboral, personasPorTipo.enfermedadLaboral.size],
      ['Enfermedad General', estadisticas.enfermedadGeneral, `${estadisticas.total > 0 ? ((estadisticas.enfermedadGeneral / estadisticas.total) * 100).toFixed(1) : 0}%`, diasPorTipo.enfermedadGeneral, personasPorTipo.enfermedadGeneral.size],
      ['Accidente Laboral', estadisticas.accidenteLaboral, `${estadisticas.total > 0 ? ((estadisticas.accidenteLaboral / estadisticas.total) * 100).toFixed(1) : 0}%`, diasPorTipo.accidenteLaboral, personasPorTipo.accidenteLaboral.size],
      ['Licencia de Paternidad', estadisticas.licenciaPaternidad, `${estadisticas.total > 0 ? ((estadisticas.licenciaPaternidad / estadisticas.total) * 100).toFixed(1) : 0}%`, diasPorTipo.licenciaPaternidad, personasPorTipo.licenciaPaternidad.size],
      ['Licencia de Maternidad', estadisticas.licenciaMaternidad, `${estadisticas.total > 0 ? ((estadisticas.licenciaMaternidad / estadisticas.total) * 100).toFixed(1) : 0}%`, diasPorTipo.licenciaMaternidad, personasPorTipo.licenciaMaternidad.size],
      ['Otros', estadisticas.otros, `${estadisticas.total > 0 ? ((estadisticas.otros / estadisticas.total) * 100).toFixed(1) : 0}%`, diasPorTipo.otros, personasPorTipo.otros.size],
      [''],
      ['TOTAL', estadisticas.total, '100%', diasPorTipo.total, personasTotales.size]
    ];

    const sheetDetalle = [
      ['DETALLE DE INCAPACIDADES'],
      ['Usuario', 'Tipo ID', 'Número ID', 'Cargo', 'Email', 'Teléfono', 'Tipo Incapacidad', 'Fecha Inicio', 'Fecha Fin', 'Días', 'Estado'],
      ...incapacidadesDelMes.map(inc => {
        const uid = inc.usuario?.id_usuario || inc.usuario_id;
        const u = uid ? usuariosCompletos[uid] : null;
        return [
          (u?.nombre || u?.nombre_completo || inc.usuario?.nombre || inc.usuario_nombre || 'N/A'),
          (u?.tipo_identificacion || u?.tipo_identificacion_nombre || 'N/A'),
          (u?.numero_identificacion || 'N/A'),
          (u?.cargo_interno || 'N/A'),
          (u?.correo_electronico || 'N/A'),
          (u?.telefono || 'N/A'),
          (inc.tipo_incapacidad?.nombre || inc.tipo_nombre || 'N/A'),
          inc.fecha_inicio ? new Date(inc.fecha_inicio).toLocaleDateString() : 'N/A',
          inc.fecha_final ? new Date(inc.fecha_final).toLocaleDateString() : 'N/A',
          inc.dias || 0,
          getEstadoNombre(inc.estado)
        ];
      })
    ];

    const usuariosIds = Array.from(new Set(incapacidadesDelMes.map(inc => inc.usuario?.id_usuario || inc.usuario_id))).filter(Boolean);
    const sheetResumenUsuarios = [
      ['RESUMEN DE USUARIOS CON INCAPACIDADES'],
      ['Usuario', 'Tipo ID', 'Número ID', 'Cargo', 'Email', 'Teléfono', 'Total Incapacidades', 'Días Totales'],
      ...usuariosIds.map(userId => {
        const userIncs = incapacidadesDelMes.filter(inc => (inc.usuario?.id_usuario || inc.usuario_id) === userId);
        const user = usuariosCompletos[userId] || userIncs[0]?.usuario || {};
        const totalDias = userIncs.reduce((sum, r) => sum + (r.dias || 0), 0);
        return [
          user.nombre || user.nombre_completo || 'N/A',
          user.tipo_identificacion || user.tipo_identificacion_nombre || 'N/A',
          user.numero_identificacion || 'N/A',
          user.cargo_interno || 'N/A',
          user.correo_electronico || 'N/A',
          user.telefono || 'N/A',
          userIncs.length,
          totalDias
        ];
      })
    ];

    // Helper para construir XML SpreadsheetML
    const toXmlCell = (value) => {
      const v = value == null ? '' : String(value);
      const type = /^-?\d+(\.\d+)?$/.test(v) ? 'Number' : 'String';
      return `<Cell><Data ss:Type="${type}">${v.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</Data></Cell>`;
    };
    const toXmlRows = (rows) => rows.map(r => `<Row>${r.map(toXmlCell).join('')}</Row>`).join('');
    const sheetXml = (name, rows) => `
      <Worksheet ss:Name="${name}">
        <Table>
          ${toXmlRows(rows)}
        </Table>
      </Worksheet>
    `;

    const hora1 = horaFmt(ahora);
    const hora2 = horaFmt(addHours(ahora, 1));
    const hora3 = horaFmt(addHours(ahora, 2));

    const workbookXml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  ${sheetXml(`ResumenTipos ${hora1}`, sheetResumenTipos)}
  ${sheetXml(`Detalle ${hora2}`, sheetDetalle)}
  ${sheetXml(`ResumenUsuarios ${hora3}`, sheetResumenUsuarios)}
</Workbook>`;

    const blob = new Blob([workbookXml], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const fechaDescarga = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `estadisticas_incapacidades_${fechaDescarga}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const descargarEstadisticasExcel = async () => {
    const incapacidadesDelMes = incapacidades.filter(inc => {
      const fi = inc.fecha_inicio ? new Date(inc.fecha_inicio) : null;
      if (!fi) return false;
      const dFrom = parseLocalInputDate(dateFrom);
      if (dFrom && fi < dFrom) return false;
      const dTo = parseLocalInputDate(dateTo);
      if (dTo) {
        dTo.setHours(23,59,59,999);
        if (fi > dTo) return false;
      }
      return true;
    });

    // Obtener información completa de usuarios únicos
    const usuariosUnicos = [...new Set(incapacidadesDelMes.map(inc => inc.usuario_id))];
    const usuariosCompletos = {};
    
    try {
      // Obtener información de usuarios desde el endpoint de usuarios
      const response = await fetch('/api/auth/usuarios/human?limit=1000', {
        headers: { 'Accept': 'application/json', ...getAuthHeaders() }
      });
      if (response.ok) {
        const usuarios = await response.json();
        usuarios.forEach(user => {
          usuariosCompletos[user.id_usuario] = user;
        });
      }
    } catch (error) {
      console.warn('No se pudieron obtener datos completos de usuarios:', error);
    }

    // Crear datos para Excel con formato mejorado
    const parsedFrom = parseLocalInputDate(dateFrom);
    const parsedTo = parseLocalInputDate(dateTo);
    const periodoTexto = parsedFrom && parsedTo 
      ? `${parsedFrom.toLocaleDateString('es-ES')} - ${parsedTo.toLocaleDateString('es-ES')}`
      : parsedFrom 
        ? `Desde ${parsedFrom.toLocaleDateString('es-ES')}`
        : parsedTo
          ? `Hasta ${parsedTo.toLocaleDateString('es-ES')}`
          : 'Todas las incapacidades';
    
    const datosExcel = [
      ['ESTADÍSTICAS DE INCAPACIDADES'],
      [`Período: ${periodoTexto}`],
      [''],
      ['TIPO DE INCAPACIDAD', 'CANTIDAD', 'PORCENTAJE'],
      ['Accidente de Tránsito', estadisticas.accidenteTransito, `${estadisticas.total > 0 ? ((estadisticas.accidenteTransito / estadisticas.total) * 100).toFixed(1) : 0}%`],
      ['Enfermedad Laboral', estadisticas.enfermedadLaboral, `${estadisticas.total > 0 ? ((estadisticas.enfermedadLaboral / estadisticas.total) * 100).toFixed(1) : 0}%`],
      ['Enfermedad General', estadisticas.enfermedadGeneral, `${estadisticas.total > 0 ? ((estadisticas.enfermedadGeneral / estadisticas.total) * 100).toFixed(1) : 0}%`],
      ['Accidente Laboral', estadisticas.accidenteLaboral, `${estadisticas.total > 0 ? ((estadisticas.accidenteLaboral / estadisticas.total) * 100).toFixed(1) : 0}%`],
      ['Licencia de Paternidad', estadisticas.licenciaPaternidad, `${estadisticas.total > 0 ? ((estadisticas.licenciaPaternidad / estadisticas.total) * 100).toFixed(1) : 0}%`],
      ['Licencia de Maternidad', estadisticas.licenciaMaternidad, `${estadisticas.total > 0 ? ((estadisticas.licenciaMaternidad / estadisticas.total) * 100).toFixed(1) : 0}%`],
      ['Otros', estadisticas.otros, `${estadisticas.total > 0 ? ((estadisticas.otros / estadisticas.total) * 100).toFixed(1) : 0}%`],
      [''],
      ['TOTAL', estadisticas.total, '100%'],
      [''],
      ['DETALLE DE INCAPACIDADES'],
      ['ID Incapacidad', 'Usuario', 'Tipo ID', 'Número ID', 'Cargo', 'Email', 'Teléfono', 'Tipo Incapacidad', 'Fecha Inicio', 'Fecha Fin', 'Días', 'Estado'],
      ...incapacidadesDelMes.map(inc => {
        const usuarioCompleto = usuariosCompletos[inc.usuario_id] || {};
        return [
          inc.id_incapacidad || '',
          inc.usuario_nombre || usuarioCompleto.nombre || 'N/A',
          usuarioCompleto.tipo_identificacion || 'N/A',
          usuarioCompleto.numero_identificacion || 'N/A',
          usuarioCompleto.cargo_interno || 'N/A',
          usuarioCompleto.correo_electronico || 'N/A',
          usuarioCompleto.telefono || 'N/A',
          inc.tipo_nombre || inc.tipo_incapacidad?.nombre || 'N/A',
          inc.fecha_inicio ? new Date(inc.fecha_inicio).toLocaleDateString() : 'N/A',
          inc.fecha_final ? new Date(inc.fecha_final).toLocaleDateString() : 'N/A',
          inc.dias || 0,
          getEstadoNombre(inc.estado)
        ];
      }),
      [''],
      ['RESUMEN DE USUARIOS CON INCAPACIDADES'],
      ['Usuario', 'Tipo ID', 'Número ID', 'Cargo', 'Email', 'Teléfono', 'Total Incapacidades', 'Días Totales'],
      ...Array.from(new Set(incapacidadesDelMes.map(inc => inc.usuario_id))).map(userId => {
        const userIncapacidades = incapacidadesDelMes.filter(inc => inc.usuario_id === userId);
        const usuarioCompleto = usuariosCompletos[userId] || {};
        const totalDias = userIncapacidades.reduce((sum, inc) => sum + (inc.dias || 0), 0);
        
        return [
          usuarioCompleto.nombre || userIncapacidades[0]?.usuario_nombre || 'N/A',
          usuarioCompleto.tipo_identificacion || 'N/A',
          usuarioCompleto.numero_identificacion || 'N/A',
          usuarioCompleto.cargo_interno || 'N/A',
          usuarioCompleto.correo_electronico || 'N/A',
          usuarioCompleto.telefono || 'N/A',
          userIncapacidades.length,
          totalDias
        ];
      })
    ];

    // Crear contenido HTML para Excel
    let htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <meta name="ExcelCreated" content="true">
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
          .section { margin-top: 20px; }
        </style>
      </head>
      <body>
        <table>
    `;

    datosExcel.forEach((row, index) => {
      const firstCell = String(row[0] || '');
      
      if (row.length === 1 && (firstCell.includes('ESTADÍSTICAS') || firstCell.includes('DETALLE') || firstCell.includes('RESUMEN'))) {
        htmlContent += `<tr><td colspan="12" class="title">${firstCell}</td></tr>`;
      } else if (row.length === 1 && firstCell.includes('Período:')) {
        htmlContent += `<tr><td colspan="12">${firstCell}</td></tr>`;
      } else if (row.length === 1) {
        htmlContent += `<tr><td colspan="12"></td></tr>`;
      } else {
        htmlContent += '<tr>';
        row.forEach(cell => {
          htmlContent += `<td>${String(cell || '')}</td>`;
        });
        htmlContent += '</tr>';
      }
    });

    htmlContent += `
        </table>
      </body>
      </html>
    `;

    // Crear y descargar archivo Excel
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const fechaDescarga = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `estadisticas_incapacidades_${fechaDescarga}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const descargarEstadisticas = () => {
    const incapacidadesDelMes = incapacidades.filter(inc => {
      const fi = inc.fecha_inicio ? new Date(inc.fecha_inicio) : null;
      if (!fi) return false;
      const dFrom = parseLocalInputDate(dateFrom);
      if (dFrom && fi < dFrom) return false;
      const dTo = parseLocalInputDate(dateTo);
      if (dTo) {
        dTo.setHours(23,59,59,999);
        if (fi > dTo) return false;
      }
      return true;
    });

    // Crear datos para Excel
    const parsedFromCsv = parseLocalInputDate(dateFrom);
    const parsedToCsv = parseLocalInputDate(dateTo);
    const periodoTexto = parsedFromCsv && parsedToCsv 
      ? `${parsedFromCsv.toLocaleDateString('es-ES')} - ${parsedToCsv.toLocaleDateString('es-ES')}`
      : parsedFromCsv 
        ? `Desde ${parsedFromCsv.toLocaleDateString('es-ES')}`
        : parsedToCsv
          ? `Hasta ${parsedToCsv.toLocaleDateString('es-ES')}`
          : 'Todas las incapacidades';
    
    const datosExcel = [
      ['ESTADÍSTICAS DE INCAPACIDADES', '', '', ''],
      [`Período: ${periodoTexto}`, '', '', ''],
      ['', '', '', ''],
      ['TIPO DE INCAPACIDAD', 'CANTIDAD', 'PORCENTAJE', ''],
      ['Accidente de Tránsito', estadisticas.accidenteTransito, `${estadisticas.total > 0 ? ((estadisticas.accidenteTransito / estadisticas.total) * 100).toFixed(1) : 0}%`, ''],
      ['Enfermedad Laboral', estadisticas.enfermedadLaboral, `${estadisticas.total > 0 ? ((estadisticas.enfermedadLaboral / estadisticas.total) * 100).toFixed(1) : 0}%`, ''],
      ['Enfermedad General', estadisticas.enfermedadGeneral, `${estadisticas.total > 0 ? ((estadisticas.enfermedadGeneral / estadisticas.total) * 100).toFixed(1) : 0}%`, ''],
      ['Accidente Laboral', estadisticas.accidenteLaboral, `${estadisticas.total > 0 ? ((estadisticas.accidenteLaboral / estadisticas.total) * 100).toFixed(1) : 0}%`, ''],
      ['Licencia de Paternidad', estadisticas.licenciaPaternidad, `${estadisticas.total > 0 ? ((estadisticas.licenciaPaternidad / estadisticas.total) * 100).toFixed(1) : 0}%`, ''],
      ['Licencia de Maternidad', estadisticas.licenciaMaternidad, `${estadisticas.total > 0 ? ((estadisticas.licenciaMaternidad / estadisticas.total) * 100).toFixed(1) : 0}%`, ''],
      ['Otros', estadisticas.otros, `${estadisticas.total > 0 ? ((estadisticas.otros / estadisticas.total) * 100).toFixed(1) : 0}%`, ''],
      ['', '', '', ''],
      ['TOTAL', estadisticas.total, '100%', ''],
      ['', '', '', ''],
      ['DETALLE DE INCAPACIDADES', '', '', '', '', '', '', '', '', '', '', ''],
      ['ID Incapacidad', 'Usuario', 'Tipo ID', 'Número ID', 'Cargo', 'Email', 'Teléfono', 'Tipo Incapacidad', 'Fecha Inicio', 'Fecha Fin', 'Días', 'Estado'],
      ...incapacidadesDelMes.map(inc => [
        inc.id_incapacidad || '',
        inc.usuario?.nombre_completo || inc.usuario?.nombre || 'N/A',
        inc.usuario?.tipo_identificacion || 'N/A',
        inc.usuario?.numero_identificacion || 'N/A',
        inc.usuario?.cargo_interno || 'N/A',
        inc.usuario?.correo_electronico || 'N/A',
        inc.usuario?.telefono || 'N/A',
        inc.tipo_incapacidad?.nombre || 'N/A',
        inc.fecha_inicio ? new Date(inc.fecha_inicio).toLocaleDateString() : 'N/A',
        inc.fecha_final ? new Date(inc.fecha_final).toLocaleDateString() : 'N/A',
        inc.dias || 0,
        getEstadoNombre(inc.estado)
      ]),
      ['', '', '', '', '', '', '', '', '', '', '', ''],
      ['RESUMEN DE USUARIOS CON INCAPACIDADES', '', '', '', '', '', '', '', '', '', '', ''],
      ['Usuario', 'Tipo ID', 'Número ID', 'Cargo', 'Email', 'Teléfono', 'Total Incapacidades', 'Días Totales', '', '', '', ''],
      ...Array.from(new Set(incapacidadesDelMes.map(inc => inc.usuario?.id_usuario))).map(userId => {
        const userIncapacidades = incapacidadesDelMes.filter(inc => inc.usuario?.id_usuario === userId);
        const user = userIncapacidades[0]?.usuario;
        const totalDias = userIncapacidades.reduce((sum, inc) => sum + (inc.dias || 0), 0);
        
        return [
          user?.nombre_completo || user?.nombre || 'N/A',
          user?.tipo_identificacion || 'N/A',
          user?.numero_identificacion || 'N/A',
          user?.cargo_interno || 'N/A',
          user?.correo_electronico || 'N/A',
          user?.telefono || 'N/A',
          userIncapacidades.length,
          totalDias,
          '', '', '', ''
        ];
      })
    ];

    // Convertir a CSV con mejor formato
    const csvContent = datosExcel.map(row => 
      row.map(cell => {
        // Escapar comillas dobles y envolver en comillas si contiene comas, saltos de línea o comillas
        const cellStr = String(cell || '');
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ).join('\n');

    // Agregar BOM para UTF-8 para mejor compatibilidad con Excel
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;

    // Crear y descargar archivo
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const fechaDescarga = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `estadisticas_incapacidades_${fechaDescarga}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="admin-header">
          <h1>📊 Estadísticas de Incapacidades</h1>
        </div>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-container">
        <div className="admin-header">
          <h1>📊 Estadísticas de Incapacidades</h1>
        </div>
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={loadIncapacidades} className="btn btn-primary">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-pages-container">
      <h1 className="admin-pages-title">ESTADÍSTICAS DE INCAPACIDADES</h1>
      <div className="admin-pages-content">
        {error && <div className="admin-error"><h1>ESTADÍSTICAS DE INCAPACIDADES</h1><p>{error}</p></div>}
        
        <div className="admin-filter-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(200px, 1fr))', columnGap: 24, rowGap: 16, alignItems: 'end' }}>
          <div className="filter-group">
            <label>Desde:</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="admin-filter-select" style={{ width: '100%' }} />
          </div>
          <div className="filter-group">
            <label>Hasta:</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="admin-filter-select" style={{ width: '100%' }} />
          </div>
          
          <div className="filter-group">
            <label>Servicio:</label>
            <select
              value={servicioSeleccionado}
              onChange={(e) => setServicioSeleccionado(e.target.value)}
              className="admin-filter-select"
              style={{ width: '100%' }}
            >
              <option value="">Todos</option>
              {Array.isArray(serviciosCatalogo) && serviciosCatalogo
                .map(s => ({ key: String(s.id_parametrohijo || s.id), label: getParametroDisplay(s) }))
                .filter(opt => opt.label)
                .map(opt => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Empleado:</label>
            <input
              type="text"
              placeholder="Buscar por nombre"
              value={empleadoQuery}
              onChange={(e) => setEmpleadoQuery(e.target.value)}
              className="admin-filter-select"
              style={{ width: '100%' }}
              list="empleado-options"
            />
            <datalist id="empleado-options">
              {Array.from(new Set((incapacidades || []).map(i => (i?.usuario?.nombre_completo || i?.usuario?.nombre || i?.usuario_nombre || '').trim()).filter(Boolean)))
                .sort((a,b) => a.localeCompare(b, 'es'))
                .map(name => (
                  <option key={name} value={name} />
                ))}
            </datalist>
          </div>
          <div className="filter-group">
            <label>Estado:</label>
            <select value={estadoSeleccionado} onChange={(e) => setEstadoSeleccionado(e.target.value)} className="admin-filter-select" style={{ width: '100%' }}>
              <option value="">Todos</option>
              <option value="11">Pendiente</option>
              <option value="12">Realizada</option>
              <option value="40">Pagas</option>
              <option value="44">No Pagas</option>
              <option value="50">Rechazada</option>
            </select>
          </div>
          <div className="filter-group">
            <label>EPS:</label>
            <select value={epsSeleccionada} onChange={(e) => setEpsSeleccionada(e.target.value)} className="admin-filter-select" style={{ width: '100%' }}>
              <option value="">Todas</option>
              {Array.isArray(epsCatalogo) && epsCatalogo
                .map(e => ({ key: String(e.id_parametrohijo || e.id), label: getParametroDisplay(e) }))
                .filter(opt => opt.label)
                .map(opt => (<option key={opt.key} value={opt.key}>{opt.label}</option>))}
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="admin-loading">
            <h1>ESTADÍSTICAS DE INCAPACIDADES</h1>
            <p>Cargando estadísticas...</p>
          </div>
        ) : (
          <div className="estadisticas-content">
            {/* Resumen general */}
            <div className="stats-summary">
              <div className="summary-card">
                <div className="summary-icon">📈</div>
                <div className="summary-content">
                  <h3>Resumen General</h3>
                  <p className="summary-period">
                    {dateFromParsed && dateToParsed 
                      ? `${dateFromParsed.toLocaleDateString('es-ES')} - ${dateToParsed.toLocaleDateString('es-ES')}`
                      : dateFromParsed 
                        ? `Desde ${dateFromParsed.toLocaleDateString('es-ES')}`
                        : dateToParsed
                          ? `Hasta ${dateToParsed.toLocaleDateString('es-ES')}`
                          : 'Todas las incapacidades'}
                  </p>
                  <div className="summary-number">{estadisticas.total}</div>
                  <div className="summary-label">Total de Incapacidades</div>
                </div>
              </div>
            </div>

            {/* Gráfico de barras */}
            <div className="chart-container">
              <div className="chart-header">
                <h3>📊 Distribución por Tipo de Incapacidad</h3>
              </div>
              <div className="bar-chart">
                <div className="chart-item">
                  <div className="chart-label">Accidente de Tránsito</div>
                  <div className="chart-bar-container">
                    <div 
                      className="chart-bar" 
                      style={{ 
                        width: `${estadisticas.total > 0 ? (estadisticas.accidenteTransito / estadisticas.total) * 100 : 0}%`,
                        backgroundColor: '#e74c3c'
                      }}
                    ></div>
                    <span className="chart-value">{estadisticas.accidenteTransito}</span>
                  </div>
                </div>

                <div className="chart-item">
                  <div className="chart-label">Enfermedad Laboral</div>
                  <div className="chart-bar-container">
                    <div 
                      className="chart-bar" 
                      style={{ 
                        width: `${estadisticas.total > 0 ? (estadisticas.enfermedadLaboral / estadisticas.total) * 100 : 0}%`,
                        backgroundColor: '#f39c12'
                      }}
                    ></div>
                    <span className="chart-value">{estadisticas.enfermedadLaboral}</span>
                  </div>
                </div>

                <div className="chart-item">
                  <div className="chart-label">Enfermedad General</div>
                  <div className="chart-bar-container">
                    <div 
                      className="chart-bar" 
                      style={{ 
                        width: `${estadisticas.total > 0 ? (estadisticas.enfermedadGeneral / estadisticas.total) * 100 : 0}%`,
                        backgroundColor: '#3498db'
                      }}
                    ></div>
                    <span className="chart-value">{estadisticas.enfermedadGeneral}</span>
                  </div>
                </div>

                <div className="chart-item">
                  <div className="chart-label">Accidente Laboral</div>
                  <div className="chart-bar-container">
                    <div 
                      className="chart-bar" 
                      style={{ 
                        width: `${estadisticas.total > 0 ? (estadisticas.accidenteLaboral / estadisticas.total) * 100 : 0}%`,
                        backgroundColor: '#9b59b6'
                      }}
                    ></div>
                    <span className="chart-value">{estadisticas.accidenteLaboral}</span>
                  </div>
                </div>

                <div className="chart-item">
                  <div className="chart-label">Licencia de Paternidad</div>
                  <div className="chart-bar-container">
                    <div 
                      className="chart-bar" 
                      style={{ 
                        width: `${estadisticas.total > 0 ? (estadisticas.licenciaPaternidad / estadisticas.total) * 100 : 0}%`,
                        backgroundColor: '#2ecc71'
                      }}
                    ></div>
                    <span className="chart-value">{estadisticas.licenciaPaternidad}</span>
                  </div>
                </div>

                <div className="chart-item">
                  <div className="chart-label">Licencia de Maternidad</div>
                  <div className="chart-bar-container">
                    <div 
                      className="chart-bar" 
                      style={{ 
                        width: `${estadisticas.total > 0 ? (estadisticas.licenciaMaternidad / estadisticas.total) * 100 : 0}%`,
                        backgroundColor: '#1abc9c'
                      }}
                    ></div>
                    <span className="chart-value">{estadisticas.licenciaMaternidad}</span>
                  </div>
                </div>

                {estadisticas.otros > 0 && (
                  <div className="chart-item">
                    <div className="chart-label">Otros</div>
                    <div className="chart-bar-container">
                      <div 
                        className="chart-bar" 
                        style={{ 
                          width: `${estadisticas.total > 0 ? (estadisticas.otros / estadisticas.total) * 100 : 0}%`,
                          backgroundColor: '#95a5a6'
                        }}
                      ></div>
                      <span className="chart-value">{estadisticas.otros}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Botones de descarga */}
            <div className="admin-filter-container">
              <button onClick={loadIncapacidades} className="admin-btn admin-btn-secondary">
                🔄 Actualizar
              </button>
              <button onClick={descargarEstadisticasExcelMulti} className="admin-btn admin-btn-success">
                📊 Descargar Excel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
