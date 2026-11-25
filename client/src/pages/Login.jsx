import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import icono from '../assets/icono-piar.png';

function IconoUsuario() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
    </svg>
  );
}
function IconoCandado() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="10" width="16" height="11" rx="2.5" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /><circle cx="12" cy="15.5" r="1.4" />
    </svg>
  );
}
function IconoOjo({ off }) {
  return off ? (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3l18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.4 5.2A9.6 9.6 0 0 1 12 5c5 0 9 4.5 9 7a12 12 0 0 1-2.2 3M6.3 6.3C3.9 7.7 2 10.1 2 12c0 2.5 4 7 9 7a9.3 9.3 0 0 0 3.3-.6" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}

const ICONOS_A11Y = [
  // Movilidad (silla de ruedas)
  <svg key="m" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="4" r="1.6" /><path d="M9 7v5h5l3 6" /><circle cx="11" cy="16" r="5.5" /><path d="M16.5 16H20" /></svg>,
  // Auditiva (oído)
  <svg key="a" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M7 8a5 5 0 0 1 10 0c0 3-3 3.5-3 6a2.3 2.3 0 0 1-4.5.8" /><path d="M9.5 8a2.5 2.5 0 0 1 5 0" /></svg>,
  // Visual (ojo tachado)
  <svg key="v" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.4 5.2A9.6 9.6 0 0 1 12 5c5 0 9 4.5 9 7a12 12 0 0 1-2.2 3M6.3 6.3C3.9 7.7 2 10.1 2 12c0 2.5 4 7 9 7a9.3 9.3 0 0 0 3.3-.6" /></svg>,
  // Cognitiva (mente)
  <svg key="c" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M15.5 4A4.5 4.5 0 0 1 20 8.5c0 1 .8 1.5 1 2.3.2.7-.4 1.2-1 1.2h-1v2a2 2 0 0 1-2 2h-1v2M9.5 4A5.5 5.5 0 0 0 4 9.5c0 2 1 3 1 4.5 0 2 2 3.5 4 3.5" /><circle cx="11.5" cy="10.5" r="1.3" /></svg>,
  // Lengua de señas (mano)
  <svg key="s" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M8 11V5.5a1.3 1.3 0 0 1 2.6 0V10m0-.5V4.6a1.3 1.3 0 0 1 2.6 0V10m0-.3V6a1.3 1.3 0 0 1 2.6 0v6.5c0 3.5-2 6.5-5.5 6.5-2 0-3.3-.8-4.3-2.3L4 14.4a1.3 1.3 0 0 1 2-1.6l1.4 1.3" /></svg>,
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setError(''); setCargando(true);
    try {
      await login(correo, clave);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={enviar}>
        <div className="login-marca">
          <img src={icono} alt="" className="login-icono" />
          <div className="login-nombre">PIAR</div>
          <div className="login-sub">Plan Individual de Ajustes Razonables</div>
        </div>

        <div className="campo-icono">
          <span className="ci-icono"><IconoUsuario /></span>
          <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)}
                 placeholder="Usuario" required autoFocus aria-label="Usuario" />
        </div>

        <div className="campo-icono">
          <span className="ci-icono"><IconoCandado /></span>
          <input type={verClave ? 'text' : 'password'} value={clave} onChange={(e) => setClave(e.target.value)}
                 placeholder="Contraseña" required aria-label="Contraseña" />
          <button type="button" className="ci-ojo" onClick={() => setVerClave(v => !v)}
                  aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'} title={verClave ? 'Ocultar' : 'Mostrar'}>
            <IconoOjo off={verClave} />
          </button>
        </div>

        {error && <div className="mensaje-error">{error}</div>}

        <button className="btn-login" disabled={cargando}>
          {cargando ? 'Ingresando…' : 'Iniciar sesión'}
        </button>

        <p className="login-ayuda">¿Olvidaste tu contraseña?</p>

        <div className="login-a11y" aria-hidden="true">
          {ICONOS_A11Y.map((ic, i) => (
            <span key={i} className="a11y-item">
              {ic}
              {i < ICONOS_A11Y.length - 1 && <span className="a11y-sep" />}
            </span>
          ))}
        </div>

        <p className="demo-hint">
          Demo: docente@piar.co · rector@piar.co · orientador@piar.co · familia@piar.co<br />
          Contraseña: <strong>piar123</strong>
        </p>
      </form>
    </div>
  );
}
