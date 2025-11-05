import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import '../styles/register.css';
import { resetPassword } from '../services/auth';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg(null);
    if (!password || password !== confirm) { setMsg({ type: 'error', text: 'Las contraseñas no coinciden.' }); return; }
    setLoading(true);
    try {
      await resetPassword(token, password);
      setMsg({ type: 'success', text: 'Contraseña actualizada. Ahora puedes iniciar sesión.' });
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-panel" style={{ minHeight: 'calc(100vh - 48px)' }}>
      <div className="card auth-card-float" style={{ width: 520, maxWidth: '90vw' }}>
        <h2 className="title">Restablecer contraseña</h2>
        <form onSubmit={onSubmit} className="form-grid">
          <div className="field">
            <div className="control">
              <input className="input" type="password" placeholder="Nueva contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <div className="control">
              <input className="input" type="password" placeholder="Confirmar contraseña" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
          </div>
          <div className="row actions">
            <button className="btn" type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar contraseña'}</button>
            {msg && (
              <span className={`helper message ${msg.type === 'error' ? 'error' : 'success'}`}>{msg.text}</span>
            )}
          </div>
        </form>
        <div style={{ marginTop: 12 }}>
          <Link to="/login">Volver al inicio de sesión</Link>
        </div>
      </div>
    </div>
  );
}


