import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/register.css';
import { requestPasswordReset } from '../services/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg(null);
    if (!email.trim()) { setMsg({ type: 'error', text: 'Ingrese su correo.' }); return; }
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setMsg({ type: 'success', text: 'Si el correo existe, se envió un enlace de recuperación.' });
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-panel" style={{ minHeight: 'calc(100vh - 48px)' }}>
      <div className="card auth-card-float" style={{ width: 520, maxWidth: '90vw' }}>
        <h2 className="title">Recuperar contraseña</h2>
        <form onSubmit={onSubmit} className="form-grid">
          <div className="field">
            <div className="control">
              <input className="input" type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="row actions">
            <button className="btn" type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Enviar enlace'}</button>
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


