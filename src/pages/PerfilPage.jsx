import React, { useEffect, useMemo, useState } from 'react';
import { FiEdit } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { getMyProfile, updateMyProfile } from '../services/users';
import { getParametrosHijosByPapa } from '../services/parametros';
import '../styles/profile.css';
import '../styles/perfil.css';

const emptyForm = {
  nombre: '',
  numero_identificacion: '',
  tipo_empleador_id: '',
  cargo_interno: '',
  correo_electronico: '',
  telefono: '',
};

export default function PerfilPage({ lockCargo = false, lockCorreo = false, lockTipoEmpleador = true, renderReadOnlyAsText = false, forceEditNombre = true }) {
  const { isAuthenticated, getAuthHeaders, reloadUser } = useAuth();
  const [formValues, setFormValues] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  
  const [rawProfile, setRawProfile] = useState(null);
  const [tipoEmpleadorOptions, setTipoEmpleadorOptions] = useState([]);
  const [cargoOptions, setCargoOptions] = useState([]);
  const [editableFields, setEditableFields] = useState(() => {
    const initial = new Set();
    if (forceEditNombre) initial.add('nombre');
    // Habilitar edición de correo por defecto
    initial.add('correo_electronico');
    // Tipo de empleador queda bloqueado por defecto (no se añade a editables)
    return initial;
  });
  const canSubmit = useMemo(() => {
    const hasNombre = formValues.nombre.trim() !== '';
    const hasCorreo = formValues.correo_electronico.trim() !== '';
    const hasTipoEmpleador = lockTipoEmpleador ? true : String(formValues.tipo_empleador_id).trim() !== '';
    const hasCargo = lockCargo ? true : String(formValues.cargo_interno).trim() !== '';
    return hasNombre && hasCorreo && hasTipoEmpleador && hasCargo;
  }, [formValues, lockCargo, lockTipoEmpleador]);

  useEffect(() => {
    let mounted = true;
    async function loadOptions() {
      try {
        const [empleadores, cargos] = await Promise.all([
          getParametrosHijosByPapa(3),
          getParametrosHijosByPapa(4),
        ]);
        if (!mounted) return;
        setTipoEmpleadorOptions(Array.isArray(empleadores) ? empleadores : []);
        setCargoOptions(Array.isArray(cargos) ? cargos : []);
      } catch (_) {
        if (!mounted) return;
        setTipoEmpleadorOptions([]);
        setCargoOptions([]);
      }
    }
    loadOptions();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      setLoading(true);
      setMsg(null);
      try {
        const headers = getAuthHeaders();
        const data = await getMyProfile(headers);
        if (!mounted) return;
        setRawProfile(data);
        // Mapear a formulario simplificado
        const next = { ...emptyForm };
        next.nombre = String(data.nombre || '').trim();
        next.numero_identificacion = data.numero_identificacion ?? '';
        next.tipo_empleador_id = '';
        next.cargo_interno = '';
        next.correo_electronico = data.correo_electronico ?? data.email ?? '';
        next.telefono = data.telefono || '';
        setFormValues(next);
      } catch (e) {
        if (!mounted) return;
        setMsg({ type: 'error', text: e.message });
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (isAuthenticated) {
      loadProfile();
    } else {
      setLoading(false);
    }
    return () => { mounted = false; };
  }, [isAuthenticated, getAuthHeaders]);

  function onChange(e) {
    const { name, value } = e.target;
    
    // Filtrar solo números para el campo teléfono
    if (name === 'telefono') {
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormValues(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setFormValues(prev => ({ ...prev, [name]: value }));
    }
  }

  

  function toggleEdit(field) {
    if (lockCargo && field === 'cargo_interno') return;
    if (lockCorreo && field === 'correo_electronico') return;
    setEditableFields(prev => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field); else next.add(field);
      return next;
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setMsg(null);
    if (!canSubmit) { setMsg({ type: 'error', text: 'Complete los campos requeridos.' }); return; }
    setSaving(true);
    try {
      const headers = getAuthHeaders();
      const payload = {
        nombre: String(formValues.nombre || '').trim(),
        numero_identificacion: formValues.numero_identificacion,
        // Solo enviar IDs cuando no están bloqueados y hay valor
        ...(lockTipoEmpleador ? {} : { tipo_empleador_id: Number(formValues.tipo_empleador_id) || undefined }),
        ...(lockCargo ? {} : { cargo_interno: Number(formValues.cargo_interno) || undefined }),
        correo_electronico: String(formValues.correo_electronico || '').trim(),
        telefono: String(formValues.telefono || '').trim() || undefined,
      };
      await updateMyProfile(payload, headers);
      // Refrescar datos en contexto para reflejar el nuevo nombre en toda la app
      try { await reloadUser(); } catch (_) {}
      setMsg({ type: 'success', text: 'Perfil actualizado' });
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setSaving(false);
    }
  }

  // Cuando se carguen opciones y rawProfile, mapear nombres a IDs en selects
  useEffect(() => {
    if (!rawProfile) return;
    const byName = (options, targetName) => {
      if (!Array.isArray(options)) return '';
      const t = String(targetName || '').trim().toLowerCase();
      const match = options.find(opt => String(opt.nombre || '').trim().toLowerCase() === t);
      return match ? String(match.id_parametrohijo) : '';
    };
    setFormValues(prev => ({
      ...prev,
      tipo_empleador_id: prev.tipo_empleador_id || byName(tipoEmpleadorOptions, rawProfile.tipo_empleador),
      cargo_interno: prev.cargo_interno || byName(cargoOptions, rawProfile.cargo_interno),
    }));
  }, [rawProfile, tipoEmpleadorOptions, cargoOptions]);

  if (!isAuthenticated) {
    return <div className="perfil-not-authenticated">No has iniciado sesión.</div>;
  }

  if (loading) {
    return <div className="perfil-loading">Cargando perfil...</div>;
  }

  return (
    <div className="perfil-container">
      <h1 className="perfil-title">PERFIL DE USUARIO</h1>
      <div className="perfil-content">
        <div className="perfil-header">
          Información personal
        </div>
        
        <div className="perfil-body">
          <form onSubmit={onSubmit} className="perfil-form">
            
            <div className="perfil-field perfil-field--nombre">
              <label htmlFor="nombre" className="perfil-label">Nombre completo</label>
              <input 
                id="nombre" 
                name="nombre" 
                className="perfil-input" 
                value={formValues.nombre} 
                onChange={onChange} 
                disabled={!editableFields.has('nombre')} 
              />
            </div>

            <div className="perfil-field perfil-field--numero-id">
              <label htmlFor="numero_identificacion" className="perfil-label">Número identificación</label>
              <input 
                id="numero_identificacion" 
                name="numero_identificacion" 
                className="perfil-input" 
                value={formValues.numero_identificacion} 
                onChange={onChange} 
              />
            </div>

            <div className="perfil-field perfil-field--cargo">
              <label htmlFor="cargo_interno" className="perfil-label">Cargo interno</label>
              {lockCargo ? (
                (() => {
                  const id = String(formValues.cargo_interno || '');
                  const opt = cargoOptions.find(o => String(o?.id_parametrohijo) === id);
                  const display = opt ? opt.nombre : '';
                  return (
                    <input className="perfil-input" value={display} disabled />
                  );
                })()
              ) : (
                <select 
                  id="cargo_interno" 
                  name="cargo_interno" 
                  className="perfil-select" 
                  value={formValues.cargo_interno} 
                  onChange={onChange} 
                  disabled={lockCargo || !editableFields.has('cargo_interno')}
                >
                  <option value="">Seleccione un cargo interno</option>
                  {cargoOptions
                    .filter(opt => opt && opt.estado)
                    .map(opt => (
                      <option key={opt.id_parametrohijo} value={opt.id_parametrohijo}>{opt.nombre}</option>
                    ))}
                </select>
              )}
            </div>

            <div className="perfil-field perfil-field--tipo-empleador">
              <label htmlFor="tipo_empleador_id" className="perfil-label">Tipo empleador</label>
              <input 
                className="perfil-input" 
                value="Empleado de planta" 
                disabled 
                style={{ backgroundColor: '#f8fafc', color: '#64748b' }}
              />
            </div>

            <div className="perfil-field perfil-field--correo">
              <label htmlFor="correo_electronico" className="perfil-label">Correo electrónico</label>
              {lockCorreo && renderReadOnlyAsText ? (
                <input 
                  id="correo_electronico" 
                  name="correo_electronico" 
                  type="email" 
                  className="perfil-input" 
                  value={formValues.correo_electronico} 
                  disabled 
                />
              ) : (
                <input 
                  id="correo_electronico" 
                  name="correo_electronico" 
                  type="email" 
                  className="perfil-input" 
                  value={formValues.correo_electronico} 
                  onChange={onChange} 
                  disabled={lockCorreo || !editableFields.has('correo_electronico')} 
                />
              )}
            </div>

            <div className="perfil-field perfil-field--telefono">
              <label htmlFor="telefono" className="perfil-label">Número telefónico</label>
              <input 
                id="telefono" 
                name="telefono" 
                className="perfil-input" 
                value={formValues.telefono} 
                onChange={onChange} 
                placeholder="Número telefónico (10 dígitos)" 
                maxLength="10" 
                pattern="[0-9]{10}" 
              />
            </div>

            <div className="perfil-actions">
              <button className="perfil-btn-save" type="submit" disabled={!canSubmit || saving}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
              {msg && (
                <div className={`perfil-message perfil-message--${msg.type === 'error' ? 'error' : 'success'}`}>
                  {msg.text}
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


