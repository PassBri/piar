import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const ROLES = [
  ['docente', 'Docente'], ['psicoorientador', 'Psicoorientador'], ['coordinador', 'Coordinador'],
  ['rector', 'Rector'], ['padre', 'Padre de familia'], ['administrador', 'Administrador de institución'],
];
const JORNADAS = ['Mañana', 'Tarde', 'Única', 'Nocturna', 'Fin de semana'];
const GRADOS = ['Preescolar', '1°', '2°', '3°', '4°', '5°', '6°', '7°', '8°', '9°', '10°', '11°'];

export default function Admin() {
  const { usuario } = useAuth();
  const esSuper = usuario.rol === 'superadmin';
  const puedeUsuarios = ['superadmin', 'administrador', 'rector'].includes(usuario.rol);
  const [indicadores, setIndicadores] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [instituciones, setInstituciones] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const rolesDisponibles = esSuper ? [...ROLES, ['superadmin', 'Administrador general']] : ROLES;
  const [nuevo, setNuevo] = useState({ nombres: '', correo: '', clave: '', rol: 'docente', institucion_id: '', cursos: [] });
  const [cursosForm, setCursosForm] = useState([]);
  const [nuevaInst, setNuevaInst] = useState({ nombre: '', sede: '', municipio_id: '' });
  const [municipios, setMunicipios] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [cursoInst, setCursoInst] = useState(''); // institución elegida (solo superadmin)
  const [nuevoCurso, setNuevoCurso] = useState({ sede: 'Principal', jornada: 'Mañana', grado: '1°', grupo: 'A' });

  function cargarCursos() {
    const q = esSuper ? (cursoInst ? `?institucion_id=${cursoInst}` : null) : '';
    if (q === null) { setCursos([]); return; }
    api.get(`/cursos${q}`).then(setCursos).catch(() => {});
  }
  function cargar() {
    api.get('/informes/indicadores').then((d) => setIndicadores(d.por_institucion)).catch(() => {});
    if (puedeUsuarios) api.get('/usuarios').then(setUsuarios).catch(() => {});
    if (esSuper) {
      api.get('/geografia/instituciones').then(setInstituciones).catch(() => {});
      api.get('/geografia/municipios').then(setMunicipios).catch(() => {});
    }
  }
  useEffect(cargar, []);
  useEffect(cargarCursos, [cursoInst]);

  async function crearCurso(e) {
    e.preventDefault();
    setError(''); setOk('');
    try {
      const payload = esSuper ? { ...nuevoCurso, institucion_id: cursoInst } : nuevoCurso;
      if (esSuper && !cursoInst) { setError('Elige una institución para el curso.'); return; }
      await api.post('/cursos', payload);
      setOk('Curso agregado.');
      cargarCursos();
    } catch (err) { setError(err.message); }
  }
  async function eliminarCurso(id) {
    try { await api.del(`/cursos/${id}`); cargarCursos(); } catch (err) { setError(err.message); }
  }

  // Cursos disponibles para asignar al nuevo usuario (según su institución)
  useEffect(() => {
    const inst = esSuper ? nuevo.institucion_id : usuario.institucion_id;
    const q = esSuper ? (inst ? `?institucion_id=${inst}` : null) : '';
    if (q === null) { setCursosForm([]); return; }
    api.get(`/cursos${q}`).then(setCursosForm).catch(() => {});
  }, [nuevo.institucion_id, esSuper]);

  function toggleCurso(id) {
    setNuevo((n) => ({ ...n, cursos: n.cursos.includes(id) ? n.cursos.filter((c) => c !== id) : [...n.cursos, id] }));
  }

  async function crearUsuario(e) {
    e.preventDefault();
    setError(''); setOk('');
    try {
      await api.post('/usuarios', { ...nuevo, institucion_id: nuevo.institucion_id || null });
      setOk('Usuario creado.');
      setNuevo({ nombres: '', correo: '', clave: '', rol: 'docente', institucion_id: '', cursos: [] });
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

      {esSuper && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Respaldo de datos</h2>
          <p style={{ color: 'var(--gris-600)', fontSize: 13, marginTop: 0 }}>
            Descarga una copia de seguridad de toda la información en formato JSON. Guárdala en un lugar seguro.
          </p>
          <button className="btn sec" onClick={() => api.descargarArchivo('/respaldo', `respaldo_piar_${new Date().toISOString().slice(0, 10)}.json`)}>Descargar respaldo ↓</button>
        </div>
      )}

      {/* Cursos: sedes, jornadas, grados y grupos del colegio */}
      <div className="card">
        <h2>Cursos del colegio (sedes, jornadas, grados y grupos)</h2>
        <p style={{ color: 'var(--gris-600)', fontSize: 13, marginTop: 0 }}>
          Un colegio puede tener varias sedes, jornadas, grados y cursos. Cada estudiante se asigna a uno.
        </p>
        {esSuper && (
          <div className="campo" style={{ maxWidth: 360 }}>
            <label>Institución</label>
            <select value={cursoInst} onChange={(e) => setCursoInst(e.target.value)}>
              <option value="">— Elegir institución —</option>
              {instituciones.map((i) => <option key={i.id} value={i.id}>{i.nombre} ({i.municipio_nombre})</option>)}
            </select>
          </div>
        )}
        <table>
          <thead><tr><th>Sede</th><th>Jornada</th><th>Grado</th><th>Grupo</th><th></th></tr></thead>
          <tbody>
            {cursos.map((c) => (
              <tr key={c.id}>
                <td>{c.sede}</td><td>{c.jornada}</td><td>{c.grado}</td><td>{c.grupo}</td>
                <td><button className="btn sec sm" onClick={() => eliminarCurso(c.id)}>Eliminar</button></td>
              </tr>
            ))}
            {cursos.length === 0 && <tr><td colSpan="5" style={{ color: 'var(--gris-500)' }}>
              {esSuper && !cursoInst ? 'Elige una institución para ver sus cursos.' : 'Aún no hay cursos. Agrega el primero abajo.'}
            </td></tr>}
          </tbody>
        </table>
        {(!esSuper || cursoInst) && (
          <form onSubmit={crearCurso} style={{ marginTop: 10 }}>
            <div className="fila">
              <div className="campo"><label>Sede</label>
                <input value={nuevoCurso.sede} onChange={(e) => setNuevoCurso({ ...nuevoCurso, sede: e.target.value })} placeholder="Principal" /></div>
              <div className="campo"><label>Jornada</label>
                <select value={nuevoCurso.jornada} onChange={(e) => setNuevoCurso({ ...nuevoCurso, jornada: e.target.value })}>
                  {JORNADAS.map((j) => <option key={j} value={j}>{j}</option>)}
                </select></div>
              <div className="campo"><label>Grado</label>
                <select value={nuevoCurso.grado} onChange={(e) => setNuevoCurso({ ...nuevoCurso, grado: e.target.value })}>
                  {GRADOS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select></div>
              <div className="campo"><label>Grupo</label>
                <input value={nuevoCurso.grupo} onChange={(e) => setNuevoCurso({ ...nuevoCurso, grupo: e.target.value })} placeholder="A" /></div>
            </div>
            <button className="btn">+ Agregar curso</button>
          </form>
        )}
      </div>

      {puedeUsuarios && <div className="card">
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
      </div>}

      {puedeUsuarios && <form className="card" onSubmit={crearUsuario}>
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
        {nuevo.rol !== 'superadmin' && nuevo.rol !== 'padre' && cursosForm.length > 0 && (
          <div className="campo">
            <label>Cursos asignados (grados/grupos) {nuevo.rol === 'docente' ? '— del docente' : ''}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {cursosForm.map((c) => (
                <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 400, fontSize: 13, border: '1px solid var(--gris-200)', borderRadius: 8, padding: '5px 9px', cursor: 'pointer' }}>
                  <input type="checkbox" style={{ width: 'auto' }} checked={nuevo.cursos.includes(c.id)} onChange={() => toggleCurso(c.id)} />
                  {c.sede} · {c.grado} · {c.grupo}
                </label>
              ))}
            </div>
          </div>
        )}
        <button className="btn">Crear usuario</button>
      </form>}

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
