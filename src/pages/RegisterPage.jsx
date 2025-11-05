import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiUser, FiCreditCard, FiMail, FiBriefcase, FiEye, FiEyeOff, FiPhone } from 'react-icons/fi';
import { postRegister } from '../services/auth';
import { getParametrosHijosByPapa } from '../services/parametros';
import CargoAutocomplete from '../components/CargoAutocomplete';
import '../styles/register.css';
const ADMINS = ['talentohumano@umit.com.co', 'saludlaboral@umit.com.co'];

const initialState = {
  primer_nombre: '',
  segundo_nombre: '',
  primer_apellido: '',
  segundo_apellido: '',
  numero_identificacion: '',
  tipo_identificacion_id: '',
  tipo_empleador_id: '5', // ID de "Empleado de planta"
  cargo_interno: '',
  correo_electronico: '',
  telefono: '',
  password: '',
  confirm_password: '',
};

export default function RegisterPage() {
  const [formValues, setFormValues] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverMessage, setServerMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tipoIdOptions, setTipoIdOptions] = useState([]);
  const [loadingTipos, setLoadingTipos] = useState(false);
  const [tipoEmpleadorOptions, setTipoEmpleadorOptions] = useState([]);
  const [loadingEmpleadores, setLoadingEmpleadores] = useState(false);
  const [cargoOptions, setCargoOptions] = useState([]);
  const [loadingCargos, setLoadingCargos] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadTipos() {
      setLoadingTipos(true);
      try {
        const data = await getParametrosHijosByPapa(2);
        if (mounted) setTipoIdOptions(Array.isArray(data) ? data : []);
      } catch (e) {
        // Opcional: podríamos mostrar un mensaje, pero no bloquea el registro
        if (mounted) setTipoIdOptions([]);
      } finally {
        if (mounted) setLoadingTipos(false);
      }
    }
    loadTipos();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadEmpleadores() {
      setLoadingEmpleadores(true);
      try {
        const data = await getParametrosHijosByPapa(3);
        if (mounted) setTipoEmpleadorOptions(Array.isArray(data) ? data : []);
      } catch (e) {
        if (mounted) setTipoEmpleadorOptions([]);
      } finally {
        if (mounted) setLoadingEmpleadores(false);
      }
    }
    loadEmpleadores();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadCargos() {
      setLoadingCargos(true);
      try {
        const data = await getParametrosHijosByPapa(4);
        if (mounted) setCargoOptions(Array.isArray(data) ? data : []);
      } catch (e) {
        if (mounted) setCargoOptions([]);
      } finally {
        if (mounted) setLoadingCargos(false);
      }
    }
    loadCargos();
    return () => {
      mounted = false;
    };
  }, []);

  const canSubmit = useMemo(() => {
    return (
      formValues.primer_nombre.trim() !== '' &&
      formValues.primer_apellido.trim() !== '' &&
      formValues.numero_identificacion.trim() !== '' &&
      String(formValues.tipo_identificacion_id).trim() !== '' &&
      String(formValues.tipo_empleador_id).trim() !== '' &&
      String(formValues.cargo_interno).trim() !== '' &&
      formValues.correo_electronico.trim() !== '' &&
      formValues.password.trim() !== '' &&
      formValues.confirm_password.trim() !== '' &&
      formValues.password === formValues.confirm_password
    );
  }, [formValues]);

  function handleChange(e) {
    const { name, value } = e.target;
    
    // Filtrar solo números para el campo teléfono
    if (name === 'telefono') {
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormValues((prev) => ({ ...prev, [name]: numericValue }));
    } else if (name === 'correo_electronico') {
      // Para el correo electrónico, mantener minúsculas
      setFormValues((prev) => ({ ...prev, [name]: value.toLowerCase() }));
    } else if (name === 'password' || name === 'confirm_password') {
      // Para contraseñas, respetar exactamente lo que escribe el usuario
      setFormValues((prev) => ({ ...prev, [name]: value }));
    } else {
      // Para todos los demás campos de texto, convertir a mayúsculas
      setFormValues((prev) => ({ ...prev, [name]: value.toUpperCase() }));
    }
  }

  function validate(values) {
    const nextErrors = {};
    if (!values.primer_nombre) nextErrors.primer_nombre = 'Complete el campo Primer nombre';
    if (!values.primer_apellido) nextErrors.primer_apellido = 'Complete el campo Primer apellido';
    if (!values.segundo_apellido) nextErrors.segundo_apellido = 'Complete el campo Segundo apellido';
    if (!values.numero_identificacion) nextErrors.numero_identificacion = 'Complete el campo Número identificación';
    if (!values.tipo_identificacion_id) nextErrors.tipo_identificacion_id = 'Complete el campo Tipo identificación';
    if (!values.tipo_empleador_id) nextErrors.tipo_empleador_id = 'Complete el campo Tipo empleador';
    if (!values.cargo_interno) nextErrors.cargo_interno = 'Complete el campo Cargo interno';
    if (!values.correo_electronico) nextErrors.correo_electronico = 'Complete el campo Correo electrónico';
    if (values.correo_electronico && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.correo_electronico)) {
      nextErrors.correo_electronico = 'Correo inválido';
    }
    if (values.telefono) {
      const tel = String(values.telefono).trim();
      if (!/^[0-9]{10}$/.test(tel)) {
        nextErrors.telefono = 'El número telefónico debe tener exactamente 10 dígitos';
      }
    }
    if (!values.password) nextErrors.password = 'Complete el campo Contraseña';
    if (!values.confirm_password) nextErrors.confirm_password = 'Complete el campo Confirmar contraseña';
    if (values.password && values.confirm_password && values.password !== values.confirm_password) {
      nextErrors.confirm_password = 'Las contraseñas no coinciden';
    }
    return nextErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerMessage(null);
    const nextErrors = validate(formValues);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setServerMessage({ type: 'error', text: 'Por favor completa los campos requeridos y corrige los errores.' });
      return;
    }

    setLoading(true);
    try {
      const correo = String(formValues.correo_electronico || '').trim().toLowerCase();
      const esAdmin = ADMINS.includes(correo);
      const payload = {
        nombre_completo: [
          formValues.primer_nombre,
          // segundo nombre es opcional
          formValues.segundo_nombre,
          formValues.primer_apellido,
          formValues.segundo_apellido,
        ]
          .map((s) => String(s || '').trim())
          .filter((s) => s !== '')
          .join(' '),
        numero_identificacion: formValues.numero_identificacion.trim(),
        tipo_identificacion_id: Number(formValues.tipo_identificacion_id),
        tipo_empleador_id: Number(formValues.tipo_empleador_id),
        cargo_interno: Number(formValues.cargo_interno),
        correo_electronico: formValues.correo_electronico.trim(),
        // teléfono opcional aún no soportado por backend; se omite en payload
        telefono: formValues.telefono ? String(formValues.telefono).trim() : undefined,
        password: formValues.password,
        rol_id: esAdmin ? 10 : 9,
      };

      const data = await postRegister(payload);
      setServerMessage({ type: 'success', text: 'Registro exitoso' });
      setFormValues(initialState);
    } catch (error) {
      setServerMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2 className="title">Registro</h2>
      <form onSubmit={handleSubmit} className="form-grid">
        <div className="field field--primer-nombre">
          <div className="control with-icon">
            <span className="icon"><FiUser size={20} /></span>
            <input id="primer_nombre" name="primer_nombre" className="input" value={formValues.primer_nombre ?? ''} onChange={handleChange} placeholder="Primer nombre" />
          </div>
          {errors.primer_nombre && <div className="error-text">{errors.primer_nombre}</div>}
        </div>

        <div className="field field--segundo-nombre">
          <div className="control with-icon">
            <span className="icon"><FiUser size={20} /></span>
            <input id="segundo_nombre" name="segundo_nombre" className="input" value={formValues.segundo_nombre ?? ''} onChange={handleChange} placeholder="Segundo nombre" />
          </div>
          {errors.segundo_nombre && <div className="error-text">{errors.segundo_nombre}</div>}
        </div>

        <div className="field field--primer-apellido">
          <div className="control with-icon">
            <span className="icon"><FiUser size={20} /></span>
            <input id="primer_apellido" name="primer_apellido" className="input" value={formValues.primer_apellido ?? ''} onChange={handleChange} placeholder="Primer apellido" />
          </div>
          {errors.primer_apellido && <div className="error-text">{errors.primer_apellido}</div>}
        </div>

        <div className="field field--segundo-apellido">
          <div className="control with-icon">
            <span className="icon"><FiUser size={20} /></span>
            <input id="segundo_apellido" name="segundo_apellido" className="input" value={formValues.segundo_apellido ?? ''} onChange={handleChange} placeholder="Segundo apellido" />
          </div>
          {errors.segundo_apellido && <div className="error-text">{errors.segundo_apellido}</div>}
        </div>

        <div className="field field--numero-id">
          <div className="control with-icon">
            <span className="icon"><FiCreditCard size={20} /></span>
            <input id="numero_identificacion" name="numero_identificacion" className="input" value={formValues.numero_identificacion ?? ''} onChange={handleChange} placeholder="Número identificación" />
          </div>
          {errors.numero_identificacion && <div className="error-text">{errors.numero_identificacion}</div>}
        </div>

        <div className="field field--tipo-identificacion">
          <div className="control with-icon">
            <span className="icon"><FiUser size={20} /></span>
            <select
          id="tipo_identificacion_id"
          name="tipo_identificacion_id"
          className="select"
          value={formValues.tipo_identificacion_id ?? ''}
          onChange={handleChange}
          > 
          <option value="">Seleccione un tipo de identificación</option>
          {loadingTipos && (
            <option value="" disabled>Cargando tipos...</option>
          )}
          {!loadingTipos && tipoIdOptions
            .filter((opt) => opt && opt.estado)
            .map((opt) => (
              <option key={opt.id_parametrohijo} value={opt.id_parametrohijo}>
                {opt.nombre}
              </option>
            ))}
          </select>
          </div>
          {errors.tipo_identificacion_id && <div className="error-text">{errors.tipo_identificacion_id}</div>}
        </div>

        <input type="hidden" name="tipo_empleador_id" value="5" />

        <div className="field field--cargo">
          <div className="control">
            <CargoAutocomplete
              value={formValues.cargo_interno}
              onChange={(value) => setFormValues(prev => ({ ...prev, cargo_interno: value }))}
              cargos={cargoOptions}
              placeholder="Buscar cargo..."
              required={true}
            />
          </div>
          {errors.cargo_interno && <div className="error-text">{errors.cargo_interno}</div>}
        </div>

        <div className="field field--correo">
          <div className="control with-icon">
            <span className="icon"><FiMail size={20} /></span>
            <input id="correo_electronico" name="correo_electronico" type="email" className="input" value={formValues.correo_electronico ?? ''} onChange={handleChange} placeholder="Correo electrónico" />
          </div>
          {errors.correo_electronico && <div className="error-text">{errors.correo_electronico}</div>}
        </div>

        <div className="field field--telefono">
          <div className="control with-icon">
            <span className="icon"><FiPhone size={20} /></span>
            <input id="telefono" name="telefono" className="input" value={formValues.telefono ?? ''} onChange={handleChange} placeholder="Número telefónico (10 dígitos)" maxLength="10" pattern="[0-9]{10}" />
          </div>
          {errors.telefono && <div className="error-text">{errors.telefono}</div>}
        </div>

        <div className="field field--password">
          <div className="control with-icon with-toggle">
            <span className="icon"><FiUser size={20} /></span>
            <input id="password" name="password" type={showPassword ? 'text' : 'password'} className="input" value={formValues.password ?? ''} onChange={handleChange} placeholder="Contraseña" />
            <button type="button" className="toggle-visibility" onClick={() => setShowPassword((v) => !v)} aria-label="Mostrar u ocultar contraseña">
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
          {errors.password && <div className="error-text">{errors.password}</div>}
        </div>

        <div className="field field--confirm-password">
          <div className="control with-icon with-toggle">
            <span className="icon"><FiUser size={20} /></span>
            <input id="confirm_password" name="confirm_password" type={showConfirmPassword ? 'text' : 'password'} className="input" value={formValues.confirm_password ?? ''} onChange={handleChange} placeholder="Confirmar contraseña" />
            <button type="button" className="toggle-visibility" onClick={() => setShowConfirmPassword((v) => !v)} aria-label="Mostrar u ocultar confirmar contraseña">
              {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
          {errors.confirm_password && <div className="error-text">{errors.confirm_password}</div>}
        </div>

        

        <div className="row actions">
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Enviando...' : 'Registrarme'}
          </button>
          {serverMessage && (
            <span className={`helper message ${serverMessage.type === 'error' ? 'error' : 'success'}`}>
              {serverMessage.text}
            </span>
          )}
        </div>
      </form>
      <div style={{ marginTop: 12 }}>
        <span>¿Ya tienes cuenta? </span>
        <Link to="/login">Inicia sesión</Link>
      </div>
    </div>
  );
}


