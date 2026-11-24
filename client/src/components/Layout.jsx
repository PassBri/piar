import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import logo from '../assets/favicon-piar.png';

const ESCALAS = [0.9, 1, 1.15, 1.3];

const ROLES_LABEL = {
  superadmin: 'Administrador general', rector: 'Rector', coordinador: 'Coordinador',
  psicoorientador: 'Psicoorientador', docente: 'Docente', padre: 'Padre de familia', administrador: 'Administrador',
};

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [escala, setEscala] = useState(() => Number(localStorage.getItem('piar_escala')) || 1);
  const [contraste, setContraste] = useState(() => localStorage.getItem('piar_contraste') === '1');

  useEffect(() => {
    document.documentElement.style.setProperty('--zoom', escala);
    localStorage.setItem('piar_escala', escala);
  }, [escala]);
  useEffect(() => {
    document.body.classList.toggle('alto-contraste', contraste);
    localStorage.setItem('piar_contraste', contraste ? '1' : '0');
  }, [contraste]);

  function cambiarEscala(dir) {
    const i = ESCALAS.indexOf(escala);
    const j = Math.min(ESCALAS.length - 1, Math.max(0, (i < 0 ? 1 : i) + dir));
    setEscala(ESCALAS[j]);
  }

  function salir() {
    logout();
    navigate('/login');
  }

  const esGestor = ['docente', 'psicoorientador', 'administrador', 'rector', 'coordinador', 'superadmin'].includes(usuario.rol);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img src={logo} alt="PIAR" />
          <span>PIAR</span>
        </div>
        <nav>
          <NavLink to="/" end className={({ isActive }) => isActive ? 'activo' : ''}>Panel</NavLink>
          <NavLink to="/estudiantes" className={({ isActive }) => isActive ? 'activo' : ''}>Estudiantes</NavLink>
          {esGestor && <NavLink to="/mosaico" className={({ isActive }) => isActive ? 'activo' : ''}>Mosaico</NavLink>}
          {esGestor && <NavLink to="/deteccion" className={({ isActive }) => isActive ? 'activo' : ''}>Detección</NavLink>}
          {esGestor && <NavLink to="/apoyos" className={({ isActive }) => isActive ? 'activo' : ''}>Apoyos</NavLink>}
          {esGestor && <NavLink to="/seguimiento" className={({ isActive }) => isActive ? 'activo' : ''}>Seguimiento</NavLink>}
          {esGestor && <NavLink to="/estadisticas" className={({ isActive }) => isActive ? 'activo' : ''}>Estadísticas</NavLink>}
          {['rector', 'coordinador', 'administrador', 'superadmin'].includes(usuario.rol) && <NavLink to="/pmi" className={({ isActive }) => isActive ? 'activo' : ''}>PMI</NavLink>}
          <NavLink to="/aprendizaje" className={({ isActive }) => isActive ? 'activo' : ''}>Aprendizaje</NavLink>
          <NavLink to="/discapacidades" className={({ isActive }) => isActive ? 'activo' : ''}>Discapacidades</NavLink>
          {['administrador', 'rector', 'coordinador', 'psicoorientador', 'superadmin'].includes(usuario.rol) &&
            <NavLink to="/mi-colegio" className={({ isActive }) => isActive ? 'activo' : ''}>Mi colegio</NavLink>}
          {['administrador', 'rector', 'coordinador', 'superadmin'].includes(usuario.rol) &&
            <NavLink to="/admin" className={({ isActive }) => isActive ? 'activo' : ''}>Administración</NavLink>}
        </nav>
        <div className="rol">
          {usuario.nombres}<br />
          <strong>{ROLES_LABEL[usuario.rol]}</strong>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <h1>Plan Individual de Ajustes Razonables</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="a11y" role="group" aria-label="Accesibilidad">
              <button className="btn sec sm" aria-label="Disminuir tamaño de letra" title="Letra más pequeña" onClick={() => cambiarEscala(-1)}>A−</button>
              <button className="btn sec sm" aria-label="Aumentar tamaño de letra" title="Letra más grande" onClick={() => cambiarEscala(1)}>A+</button>
              <button className={`btn sec sm ${contraste ? 'activo' : ''}`} aria-pressed={contraste} aria-label="Alto contraste" title="Alto contraste" onClick={() => setContraste(!contraste)}>◐</button>
            </div>
            <button className="btn sec sm" onClick={salir}>Cerrar sesión</button>
          </div>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
