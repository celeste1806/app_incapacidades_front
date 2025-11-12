import React, { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import '../styles/register.css'; // reutiliza estilos
const ADMINS = [];

const initialState = { correo_electronico: '', password: '' };

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const canSubmit = useMemo(() =>
    form.correo_electronico.trim() !== '' && form.password.trim() !== ''
  , [form]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setMsg(null);
    if (!canSubmit) { setMsg({ type: 'error', text: 'Complete correo y contraseña.' }); return; }
    setLoading(true);
    try {
      const data = await login({
        correo_electronico: form.correo_electronico.trim(),
        password: form.password
      });
      setMsg({ type: 'success', text: 'Inicio de sesión exitoso' });
      const correo = String(data?.user?.correo_electronico || '').toLowerCase();
      const rol = data?.user?.rol;
      const isAdmin = ADMINS.includes(correo) || String(rol || '').toLowerCase() === 'admin' || Number(rol) === 10;
      navigate(isAdmin ? '/admin' : '/inicio');
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-hero" style={{ background: "url('/umit_0.jpeg') center/cover no-repeat" }} />
      <div className="auth-panel">
        <div className="card auth-card-float">
          <h2 className="title">Iniciar sesión</h2>
          <form onSubmit={onSubmit} className="form-grid">
            <div className="field">
              <div className="control with-icon">
                <span className="icon"><FiMail size={20} /></span>
                <input
                  id="correo_electronico"
                  name="correo_electronico"
                  className="input"
                  type="email"
                  placeholder="Correo electrónico"
                  value={form.correo_electronico}
                  onChange={onChange}
                />
              </div>
            </div>
            <div className="field">
              <div className="control with-icon with-toggle">
                <span className="icon"><FiLock size={20} /></span>
                <input
                  id="password"
                  name="password"
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Contraseña"
                  value={form.password}
                  onChange={onChange}
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setShowPassword(v => !v)}
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            </div>
            {/* Indicador simple de validez: al menos 6 caracteres */}
            {form.password && (
              <div className="row" style={{ justifyContent: 'flex-start', marginTop: -8 }}>
                {form.password.length >= 6 ? (
                  <span className="helper" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--success)' }}>
                    <FiCheckCircle /> Contraseña válida
                  </span>
                ) : (
                  <span className="helper" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--danger)' }}>
                    <FiAlertCircle /> Mínimo 6 caracteres
                  </span>
                )}
              </div>
            )}
            <div className="row actions">
              <button className="btn" type="submit" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
              {msg && (
                <span className={`helper message ${msg.type === 'error' ? 'error' : 'success'}`}>
                  {msg.text}
                </span>
              )}
            </div>
          </form>
          <div style={{ marginTop: 8 }}>
            <Link to="/recuperar" style={{ color: '#0ea5e9' }}>¿Olvidaste tu contraseña?</Link>
          </div>
        </div>
      </div>
    </div>
  );
}