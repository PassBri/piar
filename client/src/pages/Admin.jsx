import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const ROLES = [
  ['docente', 'Docente'], ['psicoorientador', 'Psicoorientador'], ['rector', 'Rector'],
  ['padre', 'Padre de familia'], ['administrador', 'Administrador de institución'],
];

export default function Admin() {
  const { usuario } = useAuth();
  const esSuper = usuario.rol === 'superadmin';
  const [indicadores, setIndicadores] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [instituciones, setInstituciones] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const rolesDisponibles = esSuper ? [...ROLES, ['superadmin', 'Administrador general']] : ROLES;
  const [nuevo, setNuevo] = useState({ nombres: '', correo: '', clave: '', rol: 'docente', institucion_id: '' });
  const [nuevaInst, setNuevaInst] = useState({ nombre: '', sede: '', municipio_id: '' });
  const [municipios, setMunicipios] = useState([]);

  function cargar() {
    api.get('/informes/indicadores').then((d) => setIndicadores(d.por_institucion)).catch((e) => setError(e.message));
    api.get('/usuarios').then(setUsuarios).catch(() => {});
    if (esSuper) {
      api.get('/geografia/instituciones').then(setInstituciones).catch(() => {});
      api.get('/geografia/municipios').then(setMunicipios).catch(() => {});
    }
  }
  useEffect(cargar, []);

  async function crearUsuario(e) {
    e.preventDefault();
    setError(''); setOk('');
    try {
      await api.post('/usuarios', { ...nuevo, institucion_id: nuevo.institucion_id || null });
      setOk('Usuario creado.');
      setNuevo({ nombres: '', correo: '', clave: '', rol: 'docente', institucion_id: '' });
      cargar();
    } catch (err) { setError(err.message); }
  }

  async function restablecerClave(u) {
    const clave = prompt(`Nueva contraseña para ${u.nombres} (${u.correo}):`);
    if (!clave) return;
    try {
      await api.put(`/usuarios/${u.id}/clave`, { clave });
      setOk(`Contraseña actualizada para ${u.correo}.`);
    } catch (err) { setError(err.message); }
  }

  async function crearInstitucion(e) {
    e.preventDefault();
    setError(''); setOk('');
    try {
      await api.post('/geografia/instituciones', { ...nuevaInst, municipio_id: nuevaInst.municipio_id || null });
      setOk('Institución creada.');
      setNuevaInst({ nombre: '', sede: '', municipio_id: '' });
      cargar();
    } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <h2 style={{ color: 'var(--gris-700)' }}>
        {esSuper ? 'Administración general de la plataforma' : 'Administración'}
      </h2>
      {esSuper && <p style={{ color: 'var(--gris-600)', fontSize: 14, marginTop: 0 }}>
        Como administrador general controlas todas las instituciones, los usuarios, las
        contraseñas y la información de toda la plataforma.
      </p>}
      {error && <div className="mensaje-error">{error}</div>}
      {ok && <div style={{ color: 'var(--ok)', fontSize: 14 }}>{ok}</div>}

      <div className="card">
        <h2>Indicadores por territorio</h2>
        <table>
          <thead><tr><th>Departamento</th><th>Municipio</th><th>Institución</th><th>Estudiantes</th><th>PIAR vigentes</th></tr></thead>
          <tbody>
            {indicadores.map((i) => (
              <tr key={i.id}>
                <td>{i.departamento || '—'}</td><td>{i.municipio || '—'}</td><td>{i.institucion}</td>
                <td>{i.estudiantes}</td><td>{i.piar_vigentes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Usuarios {esSuper ? 'de toda la plataforma' : 'de la institución'}</h2>
        <table>
          <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th>{esSuper && <th>Institución</th>}<th>Activo</th><th></th></tr></thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>{u.nombres}</td><td>{u.correo}</td><td>{u.rol}</td>
                {esSuper && <td>{u.institucion || '— (general)'}</td>}
                <td>{u.activo ? 'Sí' : 'No'}</td>
                <td><button className="btn sec sm" onClick={() => restablecerClave(u)}>Restablecer clave</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form className="card" onSubmit={crearUsuario}>
        <h2>Crear usuario</h2>
        <div className="fila">
          <div className="campo"><label>Nombres</label>
            <input value={nuevo.nombres} onChange={(e) => setNuevo({ ...nuevo, nombres: e.target.value })} required /></div>
          <div className="campo"><label>Correo</label>
            <input type="email" value={nuevo.correo} onChange={(e) => setNuevo({ ...nuevo, correo: e.target.value })} required /></div>
        </div>
        <div className="fila">
          <div className="campo"><label>Contraseña</label>
            <input type="text" value={nuevo.clave} onChange={(e) => setNuevo({ ...nuevo, clave: e.target.value })} required /></div>
          <div className="campo"><label>Rol</label>
            <select value={nuevo.rol} onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value })}>
              {rolesDisponibles.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select></div>
          {esSuper && nuevo.rol !== 'superadmin' && (
            <div className="campo"><label>Institución</label>
              <select value={nuevo.institucion_id} onChange={(e) => setNuevo({ ...nuevo, institucion_id: e.target.value })}>
                <option value="">— Elegir —</option>
                {instituciones.map((i) => <option key={i.id} value={i.id}>{i.nombre} ({i.municipio_nombre})</option>)}
              </select></div>
          )}
        </div>
        <button className="btn">Crear usuario</button>
      </form>

      {esSuper && (
        <form className="card" onSubmit={crearInstitucion}>
          <h2>Crear institución educativa</h2>
          <div className="fila">
            <div className="campo"><label>Nombre</label>
              <input value={nuevaInst.nombre} onChange={(e) => setNuevaInst({ ...nuevaInst, nombre: e.target.value })} required /></div>
            <div className="campo"><label>Sede</label>
              <input value={nuevaInst.sede} onChange={(e) => setNuevaInst({ ...nuevaInst, sede: e.target.value })} /></div>
            <div className="campo"><label>Municipio</label>
              <select value={nuevaInst.municipio_id} onChange={(e) => setNuevaInst({ ...nuevaInst, municipio_id: e.target.value })} required>
                <option value="">— Elegir —</option>
                {municipios.map((m) => <option key={m.id} value={m.id}>{m.nombre} ({m.departamento_nombre})</option>)}
              </select></div>
          </div>
          <button className="btn">Crear institución</button>
        </form>
      )}
    </div>
  );
}
