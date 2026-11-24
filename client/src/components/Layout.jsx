import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import logo from '../assets/favicon-piar.png';

const ESCALAS = [0.9, 1, 1.15, 1.3];

const ROLES_LABEL = {
  superadmin: 'Administrador general', rector: 'Rector', coordinador: 'Coordinador',
  psicoorientador: 'Psicoorientador', docente: 'Docente', padre: 'Padre de familia', administrador: 'Administrador',
};

const GESTOR = ['docente', 'psicoorientador', 'administrador', 'rector', 'coordinador', 'superadmin'];
const DIRECTIVO = ['administrador', 'rector', 'coordinador', 'superadmin'];
const CONFIG = ['administrador', 'rector', 'coordinador', 'psicoorientador', 'superadmin'];

// Menú ordenado por el flujo del proceso PIAR, en secciones
const MENU = [
  { items: [{ to: '/', end: true, label: 'Panel' }] },
  { titulo: 'Estudiantes', items: [
    { to: '/seguimiento', label: 'Estudiantes', roles: GESTOR },
    { to: '/estudiantes', label: 'Mi hijo/a', roles: ['padre'] },
    { to: '/mosaico', label: 'Mosaico', roles: GESTOR },
  ] },
  { titulo: 'Proceso PIAR', items: [
    { to: '/deteccion', label: 'Detección', roles: GESTOR },
    { to: '/remisiones', label: 'Remisiones', roles: GESTOR },
    { to: '/apoyos', label: 'Apoyos', roles: GESTOR },
    { to: '/pmi', label: 'PMI', roles: DIRECTIVO },
  ] },
  { titulo: 'Análisis', items: [
    { to: '/estadisticas', label: 'Estadísticas', roles: GESTOR },
  ] },
  { titulo: 'Recursos', items: [
    { to: '/aprendizaje', label: 'Aprendizaje' },
    { to: '/discapacidades', label: 'Discapacidades' },
  ] },
  { titulo: 'Configuración', items: [
    { to: '/mi-colegio', label: 'Mi colegio', roles: CONFIG },
    { to: '/admin', label: 'Administración', roles: DIRECTIVO },
  ] },
];

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [escala, setEscala] = useState(() => Number(localStorage.getItem('piar_escala')) || 1);
  const [contraste, setContraste] = useState(() => localStorage.getItem('piar_contraste') === '1');
  const [menu, setMenu] = useState(false);

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

  const puede = (roles) => !roles || roles.includes(usuario.rol);

  return (
    <div className="app-shell">
      <div className={`overlay-menu ${menu ? 'visible' : ''}`} onClick={() => setMenu(false)} />
      <aside className={`sidebar ${menu ? 'abierto' : ''}`} onClick={() => setMenu(false)}>
        <div className="brand">
          <img src={logo} alt="PIAR" />
          <span>PIAR</span>
        </div>
        <nav>
          {MENU.map((grupo, gi) => {
            const items = grupo.items.filter((it) => puede(it.roles));
            if (!items.length) return null;
            return (
              <div className="nav-grupo" key={gi}>
                {grupo.titulo && <div className="nav-titulo">{grupo.titulo}</div>}
                {items.map((it) => (
                  <NavLink key={it.to} to={it.to} end={it.end} className={({ isActive }) => isActive ? 'activo' : ''}>
                    {it.label}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>
        <div className="rol">
          {usuario.nombres}<br />
          <strong>{ROLES_LABEL[usuario.rol]}</strong>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button className="menu-btn" aria-label="Abrir menú" onClick={() => setMenu(!menu)}>☰</button>
            <h1>Plan Individual de Ajustes Razonables</h1>
          </div>
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
