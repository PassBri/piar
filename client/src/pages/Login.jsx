import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Accesibilidad from '../components/Accesibilidad.jsx';
import icono from '../assets/icono-app.png';

function IconoUsuario() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
    </svg>
  );
}
function IconoCandado() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="10" width="16" height="11" rx="2.5" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /><circle cx="12" cy="15.5" r="1.4" />
    </svg>
  );
}
function IconoOjo({ off }) {
  return off ? (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3l18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.4 5.2A9.6 9.6 0 0 1 12 5c5 0 9 4.5 9 7a12 12 0 0 1-2.2 3M6.3 6.3C3.9 7.7 2 10.1 2 12c0 2.5 4 7 9 7a9.3 9.3 0 0 0 3.3-.6" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [recordar, setRecordar] = useState(false);
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
    <div className="login-wrap login-wrap-img">
      <div className="login-panel login-panel-centro">
          <form className="login-card" onSubmit={enviar}>
            <div className="login-card-marca">
              <img src={icono} alt="" className="login-card-icono" />
            </div>
            <h2 className="login-card-titulo">Bienvenido a PIAR</h2>
            <p className="login-card-sub">Plan Individual de Ajustes Razonables</p>

            <label className="login-label" htmlFor="correo">Correo electrónico</label>
            <div className="campo-icono">
              <span className="ci-icono"><IconoUsuario /></span>
              <input id="correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)}
                placeholder="usuario@institucion.edu.co" required autoFocus autoComplete="username" />
            </div>

            <label className="login-label" htmlFor="clave">Contraseña</label>
            <div className="campo-icono">
              <span className="ci-icono"><IconoCandado /></span>
              <input id="clave" type={verClave ? 'text' : 'password'} value={clave} onChange={(e) => setClave(e.target.value)}
                placeholder="••••••••" required autoComplete="current-password" />
              <button type="button" className="ci-ojo" onClick={() => setVerClave((v) => !v)}
                aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'} title={verClave ? 'Ocultar' : 'Mostrar'}>
                <IconoOjo off={verClave} />
              </button>
            </div>

            <div className="login-fila">
              <label className="login-recordar">
                <input type="checkbox" checked={recordar} onChange={(e) => setRecordar(e.target.checked)} /> Recordarme
              </label>
              <button type="button" className="login-link" onClick={(e) => e.preventDefault()}>Recuperar contraseña</button>
            </div>

            {error && <div className="mensaje-error">{error}</div>}

            <button className="btn-login" disabled={cargando}>
              {cargando ? 'Ingresando…' : 'Iniciar sesión'}
            </button>
          </form>

          <footer className="login-footer">
            <span>PIAR © 2026 · Educación inclusiva</span>
            <nav className="login-footer-nav">
              <Link to="/privacidad">Privacidad</Link>
              <span>·</span>
              <Link to="/soporte">Soporte</Link>
              <span>·</span>
              <Link to="/terminos">Términos</Link>
            </nav>
          </footer>
      </div>

      <Accesibilidad anclaje="fab" />
    </div>
  );
}
