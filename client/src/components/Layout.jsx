import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import logo from '../assets/favicon-piar.png';

const ROLES_LABEL = {
  superadmin: 'Administrador general', rector: 'Rector', psicoorientador: 'Psicoorientador',
  docente: 'Docente', padre: 'Padre de familia', administrador: 'Administrador',
};

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  function salir() {
    logout();
    navigate('/login');
  }

  const esGestor = ['docente', 'psicoorientador', 'administrador', 'rector', 'superadmin'].includes(usuario.rol);

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
          {esGestor && <NavLink to="/seguimiento" className={({ isActive }) => isActive ? 'activo' : ''}>Seguimiento</NavLink>}
          {esGestor && <NavLink to="/estadisticas" className={({ isActive }) => isActive ? 'activo' : ''}>Estadísticas</NavLink>}
          <NavLink to="/aprendizaje" className={({ isActive }) => isActive ? 'activo' : ''}>Aprendizaje</NavLink>
          {['administrador', 'rector', 'superadmin'].includes(usuario.rol) &&
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
          <button className="btn sec sm" onClick={salir}>Cerrar sesión</button>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
