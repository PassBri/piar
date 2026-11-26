import { useEffect, useState, Fragment } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

// Secciones (niveles) para clasificar las áreas/asignaturas.
const SECCIONES = [
  ['preescolar', 'Preescolar (dimensiones)'],
  ['primaria', 'Básica primaria'],
  ['secundaria', 'Básica secundaria'],
  ['media', 'Media y media técnica'],
];
const SEC_LABEL = Object.fromEntries(SECCIONES);

// Nivel educativo de un curso según su grado (para mostrar solo sus áreas).
function nivelDeCursoGrado(grado) {
  const g = (grado || '').toString().toLowerCase();
  if (/pre|jard|transic|p[aá]rvul|inicial/.test(g)) return 'preescolar';
  const m = g.match(/\d+/);
  const n = m ? parseInt(m[0], 10) : null;
  if (n !== null) { if (n === 0) return 'preescolar'; if (n <= 5) return 'primaria'; if (n <= 9) return 'secundaria'; return 'media'; }
  return null;
}

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
  const [areasAdmin, setAreasAdmin] = useState([]);
  const [cargaOpen, setCargaOpen] = useState(null); // id del docente cuya carga se edita
  const [cargaItems, setCargaItems] = useState([]); // [{curso_id, area_id}]
  const [cargaNuevo, setCargaNuevo] = useState({ curso_id: '', area_id: '' });

  const nombreCurso = (cid) => { const c = cursos.find((x) => x.id === Number(cid)); return c ? `${c.sede} · ${c.jornada} · ${c.grado} · ${c.grupo}` : `Curso ${cid}`; };
  const nombreArea = (aid) => { const a = areasAdmin.find((x) => x.id === Number(aid)); return a ? a.nombre : `Área ${aid}`; };
  async function abrirCarga(u) {
    if (cargaOpen === u.id) { setCargaOpen(null); return; }
    try {
      const items = await api.get(`/usuarios/${u.id}/carga`);
      setCargaItems(items.map((r) => ({ curso_id: r.curso_id, area_id: r.area_id })));
      setCargaNuevo({ curso_id: '', area_id: '' });
      setCargaOpen(u.id);
    } catch (err) { setError(err.message); }
  }
  function agregarCargaItem() {
    const { curso_id, area_id } = cargaNuevo;
    if (!curso_id || !area_id) return;
    if (cargaItems.some((x) => String(x.curso_id) === String(curso_id) && String(x.area_id) === String(area_id))) return;
    setCargaItems((xs) => [...xs, { curso_id: Number(curso_id), area_id: Number(area_id) }]);
    setCargaNuevo({ curso_id: '', area_id: '' });
  }
  const quitarCargaItem = (i) => setCargaItems((xs) => xs.filter((_, j) => j !== i));
  async function guardarCarga(u) {
    try {
      await api.put(`/usuarios/${u.id}/carga`, { items: cargaItems });
      setOk(`Carga académica guardada para ${u.nombres}.`);
      setCargaOpen(null);
      api.get('/usuarios').then(setUsuarios).catch(() => {});
    } catch (err) { setError(err.message); }
  }

  // Plan de estudios del curso (áreas / asignaturas que tiene cada curso).
  const [areasCursoOpen, setAreasCursoOpen] = useState(null);
  const [areasCursoSel, setAreasCursoSel] = useState([]);
  const [cargaAreasCurso, setCargaAreasCurso] = useState([]); // áreas del curso elegido en la carga
  const AREAS_BASICAS_NOMBRES = ['Matemáticas', 'Humanidades, Lengua Castellana e Idiomas Extranjeros', 'Ciencias Naturales y Educación Ambiental', 'Ciencias Sociales, Historia, Geografía y Democracia', 'Educación Artística y Cultural', 'Educación Física, Recreación y Deportes', 'Educación Religiosa', 'Educación Ética y en Valores Humanos', 'Tecnología e Informática', 'Ciencias Económicas y Políticas', 'Filosofía'];
  async function abrirAreasCurso(c) {
    if (areasCursoOpen === c.id) { setAreasCursoOpen(null); return; }
    try { const list = await api.get(`/cursos/${c.id}/areas`); setAreasCursoSel(list.map((x) => x.area_id)); setAreasCursoOpen(c.id); }
    catch (err) { setError(err.message); }
  }
  async function toggleAreaCurso(aid) {
    const nueva = areasCursoSel.includes(aid) ? areasCursoSel.filter((x) => x !== aid) : [...areasCursoSel, aid];
    setAreasCursoSel(nueva);
    if (areasCursoOpen) { try { await api.put(`/cursos/${areasCursoOpen}/areas`, { area_ids: nueva }); } catch (err) { setError(err.message); } }
  }
  async function renombrarAreaRapido(a) {
    const n = window.prompt('Nuevo nombre del área o asignatura:', a.nombre);
    if (n == null) return; const nombre = n.trim();
    if (!nombre || nombre === a.nombre) return;
    try { await api.put(`/areas/${a.id}`, { nombre }); setAreasAdmin(await api.get('/areas')); setOk('Área renombrada.'); }
    catch (err) { setError(err.message); }
  }
  const marcarBasicas = () => setAreasCursoSel(areasAdmin.filter((a) => AREAS_BASICAS_NOMBRES.includes(a.nombre)).map((a) => a.id));
  async function guardarAreasCurso(c) {
    try { await api.put(`/cursos/${c.id}/areas`, { area_ids: areasCursoSel }); setOk('Áreas del curso guardadas.'); setAreasCursoOpen(null); }
    catch (err) { setError(err.message); }
  }
  // Catálogo de áreas del colegio: crear, renombrar, eliminar.
  const [nuevaAreaCat, setNuevaAreaCat] = useState('');
  const [nuevaAreaCatSecs, setNuevaAreaCatSecs] = useState([]);
  const [editAreaId, setEditAreaId] = useState(null);
  const [editAreaNombre, setEditAreaNombre] = useState('');
  const [editAreaSecs, setEditAreaSecs] = useState([]);
  const toggleSecCat = (s) => setNuevaAreaCatSecs((xs) => (xs.includes(s) ? xs.filter((x) => x !== s) : [...xs, s]));
  const toggleSecEdit = (s) => setEditAreaSecs((xs) => (xs.includes(s) ? xs.filter((x) => x !== s) : [...xs, s]));
  async function crearAreaCatalogo() {
    const nombre = nuevaAreaCat.trim(); if (!nombre) return;
    try { await api.post('/areas', { nombre, secciones: nuevaAreaCatSecs, ...(esSuper ? { institucion_id: cursoInst || undefined } : {}) }); setAreasAdmin(await api.get('/areas')); setNuevaAreaCat(''); setNuevaAreaCatSecs([]); setOk('Área creada.'); }
    catch (err) { setError(err.message); }
  }
  function abrirEditArea(a) { setEditAreaId(a.id); setEditAreaNombre(a.nombre); setEditAreaSecs(a.secciones || []); }
  async function guardarEditArea() {
    const nombre = editAreaNombre.trim(); if (!nombre) return;
    try { await api.put(`/areas/${editAreaId}`, { nombre, secciones: editAreaSecs }); setAreasAdmin(await api.get('/areas')); setEditAreaId(null); setOk('Área actualizada.'); }
    catch (err) { setError(err.message); }
  }
  async function eliminarArea(a) {
    if (!window.confirm(`¿Eliminar el área "${a.nombre}"? Esta acción no se puede deshacer.`)) return;
    try { await api.del(`/areas/${a.id}`); setAreasAdmin(await api.get('/areas')); setAreasCursoSel((s) => s.filter((x) => x !== a.id)); setOk('Área eliminada.'); }
    catch (err) { setError(err.message); }
  }

  const [nuevaAreaTexto, setNuevaAreaTexto] = useState('');
  const [nuevaAreaSecs, setNuevaAreaSecs] = useState([]);
  const toggleSecNueva = (s) => setNuevaAreaSecs((xs) => (xs.includes(s) ? xs.filter((x) => x !== s) : [...xs, s]));
  async function agregarAreaNueva(secDefault) {
    const nombre = nuevaAreaTexto.trim();
    if (!nombre) return;
    const secs = nuevaAreaSecs.length ? nuevaAreaSecs : (secDefault ? [secDefault] : []);
    try {
      const area = await api.post('/areas', { nombre, secciones: secs, ...(esSuper ? { institucion_id: cursoInst || undefined } : {}) });
      const lista = await api.get('/areas'); setAreasAdmin(lista);
      if (area && area.id) {
        const nueva = areasCursoSel.includes(area.id) ? areasCursoSel : [...areasCursoSel, area.id];
        setAreasCursoSel(nueva);
        if (areasCursoOpen) await api.put(`/cursos/${areasCursoOpen}/areas`, { area_ids: nueva });
      }
      setNuevaAreaTexto(''); setNuevaAreaSecs([]);
      setOk(`Área "${nombre}" creada y agregada al curso.`);
    } catch (err) { setError(err.message); }
  }
  async function elegirCursoCarga(cid) {
    setCargaNuevo((n) => ({ ...n, curso_id: cid, area_id: '' }));
    if (!cid) { setCargaAreasCurso([]); return; }
    try { setCargaAreasCurso(await api.get(`/cursos/${cid}/areas`)); } catch { setCargaAreasCurso([]); }
  }

  function cargarCursos() {
    const q = esSuper ? (cursoInst ? `?institucion_id=${cursoInst}` : null) : '';
    if (q === null) { setCursos([]); return; }
    api.get(`/cursos${q}`).then(setCursos).catch(() => {});
  }
  function cargar() {
    api.get('/informes/indicadores').then((d) => setIndicadores(d.por_institucion)).catch(() => {});
    if (puedeUsuarios) api.get('/usuarios').then(setUsuarios).catch(() => {});
    if (puedeUsuarios) api.get('/areas').then(setAreasAdmin).catch(() => {});
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
      <h1>
        {esSuper ? 'Administración general de la plataforma' : 'Administración'}
      </h1>
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
              <Fragment key={c.id}>
              <tr>
                <td>{c.sede}</td><td>{c.jornada}</td><td>{c.grado}</td><td>{c.grupo}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn sec sm" style={{ marginRight: 6 }} onClick={() => abrirAreasCurso(c)}>{areasCursoOpen === c.id ? 'Cerrar' : 'Áreas del curso'}</button>
                  <button className="btn sec sm" onClick={() => eliminarCurso(c.id)}>Eliminar</button>
                </td>
              </tr>
              {areasCursoOpen === c.id && (
                <tr>
                  <td colSpan="5" style={{ background: '#f3f8ff' }}>
                    <div style={{ padding: '6px 2px' }}>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                        Áreas / asignaturas de {c.sede} · {c.jornada} · {c.grado} · {c.grupo}
                        <button type="button" className="btn sec sm" style={{ marginLeft: 10 }} onClick={marcarBasicas}>Marcar áreas básicas</button>
                      </div>
                      {areasAdmin.length === 0
                        ? <div style={{ fontSize: 12, color: 'var(--gris-500)' }}>No hay áreas en el catálogo todavía. Créalas abajo o en la tarjeta “Áreas / asignaturas del colegio”.</div>
                        : (
                          <div className="secc-grid">
                            {(() => {
                              const nivelC = nivelDeCursoGrado(c.grado);
                              const base = nivelC ? SECCIONES.filter(([k]) => k === nivelC) : SECCIONES;
                              return [...base, ['otras', 'Otras / propias del colegio']];
                            })().map(([sec, label]) => {
                              const lista = sec === 'otras'
                                ? areasAdmin.filter((a) => !(a.secciones || []).length)
                                : areasAdmin.filter((a) => (a.secciones || []).includes(sec));
                              if (!lista.length) return null;
                              const marcadas = lista.filter((a) => areasCursoSel.includes(a.id)).length;
                              return (
                                <div key={sec} className={`secc-card secc-${sec}`}>
                                  <div className="secc-card-head">
                                    <span className="secc-card-nom">{label}</span>
                                    <span className="secc-card-badge">{marcadas}/{lista.length}</span>
                                  </div>
                                  <div className="secc-card-body">
                                    {lista.map((a) => {
                                      const on = areasCursoSel.includes(a.id);
                                      return (
                                        <span key={a.id} className={`secc-chip${on ? ' on' : ''}`}>
                                          <button type="button" className="secc-chip-main" onClick={() => toggleAreaCurso(a.id)}>
                                            <span className="secc-chip-mark" aria-hidden="true">{on ? '✓' : '+'}</span>{a.nombre}
                                          </button>
                                          <button type="button" className="secc-chip-ic" title="Renombrar" onClick={() => renombrarAreaRapido(a)}>✎</button>
                                          <button type="button" className="secc-chip-ic" title="Eliminar" onClick={() => eliminarArea(a)}>×</button>
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', margin: '4px 0 4px', flexWrap: 'wrap' }}>
                        <input value={nuevaAreaTexto} onChange={(e) => setNuevaAreaTexto(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarAreaNueva(nivelDeCursoGrado(c.grado)); } }}
                          placeholder="Agregar otra área o asignatura (ej. Técnico en Sistemas - SENA)" style={{ flex: '1 1 320px', minWidth: 240 }} />
                        <button type="button" className="btn sec sm" onClick={() => agregarAreaNueva(nivelDeCursoGrado(c.grado))}>+ Crear área</button>
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '0 0 10px', fontSize: 11.5, color: 'var(--gris-500)' }}>
                        <span>Se agrega a <strong>{SEC_LABEL[nivelDeCursoGrado(c.grado)]?.split(' (')[0] || 'Otras'}</strong>. ¿En otras secciones? Márcalas:</span>
                        {SECCIONES.map(([s, l]) => (
                          <label key={s} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <input type="checkbox" checked={nuevaAreaSecs.includes(s)} onChange={() => toggleSecNueva(s)} /> {l.split(' (')[0]}
                          </label>
                        ))}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                        <button type="button" className="btn sec sm" onClick={() => setAreasCursoOpen(null)}>Listo</button>
                        <span style={{ fontSize: 11.5, color: 'var(--gris-500)' }}>✓ Los cambios se guardan automáticamente.</span>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              </Fragment>
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
        <h2>Áreas / asignaturas del colegio</h2>
        <p style={{ color: 'var(--gris-600)', marginTop: -4 }}>Crea, renombra o elimina las áreas del catálogo. Luego las asignas a cada curso (plan de estudios) y a cada docente (carga académica).</p>
        <div style={{ margin: '6px 0 12px' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <input value={nuevaAreaCat} onChange={(e) => setNuevaAreaCat(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); crearAreaCatalogo(); } }}
              placeholder="Nueva área o asignatura (ej. Técnico en Sistemas - SENA)" style={{ flex: '1 1 340px', minWidth: 240 }} />
            <button type="button" className="btn" onClick={crearAreaCatalogo}>+ Crear área</button>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6, fontSize: 12 }}>
            <span style={{ color: 'var(--gris-600)' }}>Sección:</span>
            {SECCIONES.map(([s, l]) => (
              <label key={s} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input type="checkbox" checked={nuevaAreaCatSecs.includes(s)} onChange={() => toggleSecCat(s)} /> {l}
              </label>
            ))}
          </div>
        </div>
        {areasAdmin.length === 0
          ? <p style={{ color: 'var(--gris-500)' }}>Aún no hay áreas. Crea la primera arriba.</p>
          : (
            <table>
              <thead><tr><th>Área / asignatura</th><th>Secciones</th><th style={{ width: 190 }}></th></tr></thead>
              <tbody>
                {areasAdmin.map((a) => (
                  <tr key={a.id}>
                    <td>
                      {editAreaId === a.id
                        ? <input value={editAreaNombre} onChange={(e) => setEditAreaNombre(e.target.value)} style={{ width: '100%' }} autoFocus />
                        : a.nombre}
                    </td>
                    <td style={{ fontSize: 11.5 }}>
                      {editAreaId === a.id
                        ? <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{SECCIONES.map(([s, l]) => (
                            <label key={s} style={{ display: 'flex', gap: 3, alignItems: 'center' }}><input type="checkbox" checked={editAreaSecs.includes(s)} onChange={() => toggleSecEdit(s)} /> {l.split(' (')[0]}</label>
                          ))}</div>
                        : ((a.secciones || []).length ? (a.secciones || []).map((s) => SEC_LABEL[s]?.split(' (')[0] || s).join(', ') : <span style={{ color: 'var(--gris-500)' }}>— otras —</span>)}
                    </td>
                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                      {editAreaId === a.id
                        ? (<><button className="btn sm" style={{ marginRight: 6 }} onClick={guardarEditArea}>Guardar</button><button className="btn sec sm" onClick={() => setEditAreaId(null)}>Cancelar</button></>)
                        : (<><button className="btn sec sm" style={{ marginRight: 6 }} onClick={() => abrirEditArea(a)}>Editar</button><button className="btn sec sm" onClick={() => eliminarArea(a)}>Eliminar</button></>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>}

      {puedeUsuarios && <div className="card">
        <h2>Usuarios {esSuper ? 'de toda la plataforma' : 'de la institución'}</h2>
        <table>
          <thead><tr><th>Nombre</th><th>Correo</th><th>Nivel de usuario</th>{esSuper && <th>Institución</th>}<th>Áreas</th><th>Activo</th><th></th></tr></thead>
          <tbody>
            {usuarios.map((u) => (
              <Fragment key={u.id}>
              <tr>
                <td>{u.nombres}</td><td>{u.correo}</td><td style={{ textTransform: 'capitalize' }}>{u.rol}</td>
                {esSuper && <td>{u.institucion || '— (general)'}</td>}
                <td style={{ textAlign: 'center' }}>{u.rol === 'docente' ? `${u.areas_carga || 0}` : '—'}</td>
                <td>{u.activo ? 'Sí' : 'No'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {u.rol === 'docente' && <button className="btn sec sm" style={{ marginRight: 6 }} onClick={() => abrirCarga(u)}>{cargaOpen === u.id ? 'Cerrar' : 'Carga académica'}</button>}
                  <button className="btn sec sm" onClick={() => restablecerClave(u)}>Restablecer clave</button>
                </td>
              </tr>
              {cargaOpen === u.id && (
                <tr>
                  <td colSpan={esSuper ? 7 : 6} style={{ background: '#f3f8ff' }}>
                    <div style={{ padding: '6px 2px' }}>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Carga académica de {u.nombres} <span style={{ fontWeight: 400, color: 'var(--gris-600)' }}>· áreas que dicta en cada curso</span></div>
                      {cargaItems.length === 0
                        ? <div style={{ fontSize: 12, color: 'var(--gris-500)', marginBottom: 6 }}>Sin áreas asignadas todavía.</div>
                        : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                            {cargaItems.map((it, i) => (
                              <span key={i} className="carga-chip">
                                {nombreArea(it.area_id)} <small>· {nombreCurso(it.curso_id)}</small>
                                <button type="button" onClick={() => quitarCargaItem(i)} title="Quitar">×</button>
                              </span>
                            ))}
                          </div>
                        )}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <select value={cargaNuevo.curso_id} onChange={(e) => elegirCursoCarga(e.target.value)}>
                          <option value="">— Curso —</option>
                          {cursos.map((c) => <option key={c.id} value={c.id}>{c.sede} · {c.jornada} · {c.grado} · {c.grupo}</option>)}
                        </select>
                        <select value={cargaNuevo.area_id} onChange={(e) => setCargaNuevo((n) => ({ ...n, area_id: e.target.value }))} disabled={!cargaNuevo.curso_id}>
                          <option value="">{!cargaNuevo.curso_id ? '— Elige un curso —' : (cargaAreasCurso.length ? '— Área —' : '— El curso no tiene áreas —')}</option>
                          {cargaAreasCurso.map((a) => <option key={a.area_id} value={a.area_id}>{a.area_nombre}</option>)}
                        </select>
                        <button type="button" className="btn sec sm" onClick={agregarCargaItem}>+ Agregar</button>
                        <button type="button" className="btn sm" onClick={() => guardarCarga(u)}>Guardar carga</button>
                      </div>
                      {cursos.length === 0 && <div style={{ fontSize: 12, color: 'var(--gris-500)', marginTop: 6 }}>Primero crea cursos{esSuper ? ' (elige una institución arriba)' : ''} para poder asignar la carga.</div>}
                    </div>
                  </td>
                </tr>
              )}
              </Fragment>
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
