import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/incapacidades.css';
import '../styles/autocomplete.css';
import { getParametrosEPS, getParametrosDiagnostico, getCausasIncapacidad, getParametrosServicio } from '../services/parametrosHijos';
import { getTiposIncapacidad } from '../services/tipoIncapacidad';
import { createIncapacidad, notifyAdminsNuevaIncapacidad, buildIncapacidadPayloadFromFormState } from '../services/incapacidades';
import { getArchivosPorTipo } from '../services/relacion';
import { uploadIncapacidadArchivo } from '../services/upload';
import DiagnosticoAutocomplete from '../components/DiagnosticoAutocomplete';
import { useAuth } from '../contexts/AuthContext';

export default function IncapacidadesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tiposIncapacidad, setTiposIncapacidad] = useState([]);
  const rolId = Number(user?.rol_id ?? user?.rol ?? 0);
  const isAdminUser = rolId === 10;
  const descargasPath = isAdminUser ? '/admin/descargas' : '/descargas';
  const [causasIncapacidad, setCausasIncapacidad] = useState([]);
  const [parametrosEPS, setParametrosEPS] = useState([]);
  const [parametrosDiagnostico, setParametrosDiagnostico] = useState([]);
  const [parametrosServicio, setParametrosServicio] = useState([]);
  const [archivosRequeridos, setArchivosRequeridos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDependientes, setLoadingDependientes] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const getParametroDisplay = (item) => {
    const raw = (item && (item.nombre || item.descripcion || item.valor || item.texto || item.servicio)) || '';
    let text = String(raw).replace(/<[^>]*>/g, '').trim();
    // Evitar data URLs o imágenes en base64
    if (/^data:image\//i.test(text)) text = '';
    return text;
  };
  const [formData, setFormData] = useState({
    causa_incapacidad: '',
    fecha_inicio: '',
    fecha_fin: '',
    salario: '',
    tipo_incapacidad: '',
    eps: '',
    servicio: '',
    diagnostico: '',
    documento_incapacidad: null,
    documento_historia_clinica: null,
    documento_furat: null,
    documento_no_at: null
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cargar únicamente los tipos al entrar a la página
      const tiposData = await getTiposIncapacidad();
      setTiposIncapacidad(tiposData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarDatosDependientes = async () => {
    try {
      setLoadingDependientes(true);
      const [epsData, diagnosticoData, causasData, servicioData] = await Promise.all([
        getParametrosEPS(),
        getParametrosDiagnostico(),
        getCausasIncapacidad(),
        getParametrosServicio()
      ]);
      setParametrosEPS(epsData);
      setParametrosDiagnostico(diagnosticoData);
      setCausasIncapacidad(causasData);
      setParametrosServicio(servicioData);
    } catch (_) {
      // silencioso para no interrumpir UX; botón Reintentar está en error inicial
    } finally {
      setLoadingDependientes(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Al cambiar el tipo de incapacidad, cargar archivos requeridos por tipo
    if (name === 'tipo_incapacidad') {
      const tipoId = String(value || '');
      // Resetear campos dependientes y archivos
      setFormData(prev => ({
        ...prev,
        causa_incapacidad: '',
        eps: '',
        servicio: '',
        diagnostico: '',
        documento_incapacidad: null,
        documento_historia_clinica: null,
        documento_furat: null,
        documento_no_at: null
      }));
      if (!tipoId) { setArchivosRequeridos([]); return; }
      // Cargar combos dependientes al seleccionar un tipo
      cargarDatosDependientes();
      // ID tipo seleccionado disponible en tipoId
      getArchivosPorTipo(tipoId)
        .then(list => {
          setArchivosRequeridos(Array.isArray(list) ? list : []);
        })
        .catch(() => setArchivosRequeridos([]));

      // Nota: evitamos llamadas extra para no sobrecargar la página
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files && files[0] ? files[0] : null;
    const allowed = ['application/pdf', 'image/png', 'image/jpeg'];
    if (file && !allowed.includes((file.type || '').toLowerCase())) {
      alert('Formato no permitido. Use PDF, PNG o JPG');
      e.target.value = '';
      return;
    }
    setFormData(prev => ({
      ...prev,
      [name]: file || null
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.tipo_incapacidad) { alert('Por favor seleccione el tipo de incapacidad'); return; }
    if (!formData.causa_incapacidad) { alert('Por favor selecciona la causa de la incapacidad'); return; }
    if (!formData.fecha_inicio) { alert('Ingrese la fecha de inicio'); return; }
    if (!formData.fecha_fin) { alert('Ingrese la fecha de fin'); return; }
    if (!formData.salario) { alert('Ingrese el salario'); return; }
    if (!formData.eps) { alert('Seleccione la EPS'); return; }
    if (!formData.servicio) { alert('Ingrese el servicio'); return; }
    if (!formData.diagnostico) { alert('Seleccione el diagnóstico'); return; }

    // Validar documentos obligatorios por tipo seleccionado
    if (Array.isArray(archivosRequeridos) && archivosRequeridos.length > 0) {
      for (const a of archivosRequeridos) {
        const archivoId = a?.id_archivo;
        if (!archivoId) continue;
        const labelA = String(a?.nombre || a?.descripcion || '').toLowerCase();
        const esHistoriaClinica = labelA.includes('historia') && labelA.includes('clin');
        if (esHistoriaClinica) continue; // Historia clínica no es obligatoria
        const key = `archivo_${archivoId}`;
        const file = formData[key];
        if (!file) {
          alert(`Falta adjuntar el documento obligatorio: ${(a.nombre || a.descripcion || `Archivo ${archivoId}`)}.`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      // Construir payload JSON esperado por backend
      const payload = buildIncapacidadPayloadFromFormState(formData);
      const resp = await createIncapacidad(payload);
      const nuevaId = resp?.id_incapacidad || resp?.id || resp?.incapacidad?.id || resp?.data?.id;
      // Subir documentos asociados (obligatorios validados arriba)
      if (nuevaId && Array.isArray(archivosRequeridos) && archivosRequeridos.length > 0) {
        const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : '';
        for (const a of archivosRequeridos) {
          const archivoId = a?.id_archivo;
          if (!archivoId) continue;
          const key = `archivo_${archivoId}`;
          const file = formData[key];
          if (!file) { continue; }
          try {
            await uploadIncapacidadArchivo({ file, incapacidadId: nuevaId, archivoId, token });
          } catch (err) {
            alert(`Error subiendo documento ${(a.nombre || a.descripcion || `Archivo ${archivoId}`)}: ${err?.message || ''}`);
            setSubmitting(false);
            return;
          }
        }
      }
      if (nuevaId) { notifyAdminsNuevaIncapacidad(nuevaId); }
      alert('Incapacidad registrada exitosamente');
      // Redirigir a la página de administración para completar campos
      try {
        navigate('/admin/incapacidades-Nuevas', { replace: true, state: { nuevaId } });
      } catch (_) {
        // fallback a home admin si la ruta específica no existe
        navigate('/admin', { replace: true });
      }
      
      // Limpiar formulario
      setFormData({
        causa_incapacidad: '',
        fecha_inicio: '',
        fecha_fin: '',
        salario: '',
        tipo_incapacidad: '',
        eps: '',
        servicio: '',
        diagnostico: '',
        documento_incapacidad: null,
        documento_historia_clinica: null,
        documento_furat: null,
        documento_no_at: null
      });
    } catch (e) {
      alert('Error al registrar incapacidad: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="pad-20">
        <h1>Incapacidades</h1>
        <p>Cargando tipos de incapacidad...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pad-20">
        <h1>Incapacidades</h1>
        <p className="text-error">Error: {error}</p>
        <button onClick={loadData}>Reintentar</button>
      </div>
    );
  }

  return (
    <div className="incapacidades-container">
      <h1 className="incapacidades-title">REGISTRAR INCAPACIDAD</h1>
      
      <form onSubmit={handleSubmit} className="incapacidades-form">
        {/* Paso 1: Solo tipo de incapacidad */}
        <div className="row">
          <div className="col-12 field-card resizable field-card--primary">
            <label className="label label--light">Tipos de incapacidades:</label>
            <select
              className="select"
              name="tipo_incapacidad"
              value={formData.tipo_incapacidad}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione un tipo de incapacidad</option>
              {tiposIncapacidad
                .map(tipo => ({ key: tipo.id || tipo.id_tipo_incapacidad, label: getParametroDisplay(tipo) || tipo.nombre || tipo.tipo_incapacidad }))
                .filter(opt => opt.label && opt.label.length > 0)
                .map(opt => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
            </select>
            {/* Aviso para Accidente de Tránsito */}
            {(() => {
              const selected = tiposIncapacidad.find(t => String(t.id || t.id_tipo_incapacidad) === String(formData.tipo_incapacidad));
              const label = (selected && (getParametroDisplay(selected) || selected.nombre || selected.tipo_incapacidad)) || '';
              const lc = label.toLowerCase();
              const norm = lc.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
              const esAccidenteTransito = norm.includes('accidente') && norm.includes('transito');
              if (!esAccidenteTransito) return null;
              return (
                <div style={{ marginTop: 10, background: '#fff7e6', border: '1px solid #ffd591', color: '#ad6800', padding: 12, borderRadius: 6 }}>
                  Si usted es afiliado a EPS <b>Sanitas</b> o <b>Salud Total</b>, diríjase a
                  {' '}<Link to={descargasPath} style={{ textDecoration: 'underline' }}>Descargas</Link>{' '}para obtener el formato <b>NO AT (No Accidente de Trabajo)</b>,
                  diligenciarlo y luego subir el documento en esta página.
                </div>
              );
            })()}
          </div>
        </div>

        {/* Paso 2: Mostrar el resto solo si ya escogió un tipo */}
        {formData.tipo_incapacidad && (
          <>
            {/* Subida de documentos (dinámicos y, si aplica, AT) */}
            <h3 className="section-title">Subir documentos</h3>

            {/* Archivos dinámicos según tipo seleccionado */}
            {Array.isArray(archivosRequeridos) && archivosRequeridos.length > 0 && (
              <div className="upload-grid">
                {archivosRequeridos.map((a) => {
                  const label = (a && (a.nombre || a.descripcion)) || getParametroDisplay(a) || `Archivo ${a?.id_archivo || ''}`;
                  const key = `archivo_${a?.id_archivo || 'x'}`; // clave alineada al backend por id
                  const inputName = key; // usamos misma clave para fácil mapeo
                  const labelLc = String(label).toLowerCase();
                  const norm = labelLc.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                  const esHistoriaClinica = labelLc.includes('historia') && labelLc.includes('clin');
                  const esNoAT = norm.includes('no at') || norm.includes('no accidente de trabajo');
                  const required = !esHistoriaClinica && !esNoAT; // Historia clínica y NO AT no son obligatorios
                  return (
                    <div key={key}>
                      <label className="upload-label">
                        {label}{required ? ' *' : ''}
                      </label>
                      <input required={required} type="file" name={inputName} onChange={handleFileChange} accept=".pdf,application/pdf,.png,image/png,.jpg,.jpeg,image/jpeg" className="file-input-custom" />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Si es accidente de tránsito, mostrar FURAT y NO AT */}
            {null}

            {/* Campos de entrada */}
            <div className="row row--mb-20">
              <div className="col-6 field-card">
                <label className="label">Fecha de Inicio *</label>
                <input className="input" type="date" name="fecha_inicio" value={formData.fecha_inicio} onChange={handleChange} required />
              </div>
              <div className="col-6 field-card">
                <label className="label">Fecha de Fin *</label>
                <input className="input" type="date" name="fecha_fin" value={formData.fecha_fin} onChange={handleChange} required />
              </div>
            </div>

            <div className="row" style={{ marginBottom: 20 }}>
              <div className="col-6 field-card resizable">
                <label className="label">Ingrese su salario:</label>
                <input className="input" type="number" name="salario" value={formData.salario} onChange={handleChange} placeholder="Ej: 1500000" required />
              </div>
              <div className="col-6 field-card resizable">
                <label className="label">Causa de incapacidad:</label>
                <select className="select" name="causa_incapacidad" value={formData.causa_incapacidad} onChange={handleChange} required>
                  <option value="">Seleccione la causa de incapacidad</option>
                  {causasIncapacidad
                    .map(causa => ({ key: causa.id_parametrohijo || causa.id, label: getParametroDisplay(causa) }))
                    .filter(opt => opt.label && opt.label.length > 0)
                    .map(opt => (
                      <option key={opt.key} value={opt.key}>{opt.label}</option>
                    ))}
                </select>
              </div>
            </div>

            <div className="row row--mb-30">
              <div className="col-4 field-card resizable">
                <label className="label">Ingrese su EPS:</label>
                <select className="select" name="eps" value={formData.eps} onChange={handleChange} required>
                  <option value="">Seleccione su EPS</option>
                  {parametrosEPS
                    .map(eps => ({ key: eps.id_parametrohijo || eps.id, label: getParametroDisplay(eps) }))
                    .filter(opt => opt.label && opt.label.length > 0)
                    .map(opt => (
                      <option key={opt.key} value={opt.key}>{opt.label}</option>
                    ))}
                </select>
              </div>
              <div className="col-4 field-card resizable">
                <label className="label">Ingrese su servicio:</label>
                {Array.isArray(parametrosServicio) && parametrosServicio.length > 0 ? (
                  <select className="select" name="servicio" value={formData.servicio} onChange={handleChange} required>
                    <option value="">Seleccione el servicio</option>
                    {parametrosServicio
                      .map(s => ({ key: s.id_parametrohijo || s.id, label: getParametroDisplay(s) }))
                      .filter(opt => opt.label && opt.label.length > 0)
                      .map(opt => (
                        <option key={opt.key} value={opt.key}>{opt.label}</option>
                      ))}
                  </select>
                ) : (
                  <input className="input" type="text" name="servicio" value={formData.servicio} onChange={handleChange} placeholder="Ej: Medicina general" required />
                )}
              </div>
              <div className="col-4 field-card resizable">
                <label className="label">Ingrese el diagnóstico:</label>
                <DiagnosticoAutocomplete
                  value={formData.diagnostico}
                  onChange={(value) => setFormData(prev => ({ ...prev, diagnostico: value }))}
                  diagnosticos={parametrosDiagnostico}
                  placeholder="Buscar diagnóstico..."
                  required={true}
                />
              </div>
            </div>

            {/* Botón Enviar */}
            <div className="actions-right">
              <button
                type="submit"
                disabled={submitting}
                className={`btn-submit ${submitting ? 'is-loading' : ''}`}
              >
                {submitting ? 'Enviando...' : 'Enviar'}
                {!submitting && <span>👆</span>}
              </button>
            </div>
          </>
        )}

        
      </form>
    </div>
  );
}
