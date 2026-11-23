import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import logo from '../assets/logo.svg';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
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
        <div className="logo"><img src={logo} alt="SIGPIAR" /></div>
        <h1>SIGPIAR</h1>
        <p className="sub">Gestión del Plan Individual de Ajustes Razonables</p>
        <div className="campo">
          <label>Correo</label>
          <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required autoFocus />
        </div>
        <div className="campo">
          <label>Contraseña</label>
          <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} required />
        </div>
        {error && <div className="mensaje-error">{error}</div>}
        <button className="btn" style={{ width: '100%' }} disabled={cargando}>
          {cargando ? 'Ingresando…' : 'Ingresar'}
        </button>
        <p className="demo-hint">
          Demo: docente@sigpiar.co · rector@sigpiar.co · orientador@sigpiar.co · familia@sigpiar.co<br />
          Contraseña: <strong>sigpiar123</strong>
        </p>
      </form>
    </div>
  );
}
