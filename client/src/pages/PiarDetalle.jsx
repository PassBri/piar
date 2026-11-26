import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useExpediente } from '../context/ExpedienteContext.jsx';
import Guardado from '../components/Guardado.jsx';
import NavAnexos from '../components/NavAnexos.jsx';
import AgregarAnio from '../components/AgregarAnio.jsx';
import MenuDocumentos from '../components/MenuDocumentos.jsx';
import { NIVELES_AREAS } from '../data/areas.js';
import { SUGERENCIAS, ETIQUETA_SUG } from '../data/sugerencias.js';
import EstudianteForm from './EstudianteForm.jsx';

// Menú compacto de sugerencias que se despliega dentro de cada casilla.
// Al escoger una, se agrega al texto de esa casilla (no agranda el formato).
function SugMenu({ campo, onPick }) {
  const items = SUGERENCIAS[campo] || [];
  if (!items.length) return null;
  return (
    <select className="sug-menu" value="" title={`Sugerencias para ${ETIQUETA_SUG[campo] || campo}`}
      onChange={(e) => { if (e.target.value) { onPick(e.target.value); e.target.value = ''; } }}>
      <option value="">💡 Sugerencias…</option>
      {items.map((t, i) => <option key={i} value={t}>{t}</option>)}
    </select>
  );
}

// Deduce el nivel educativo (clave de NIVELES_AREAS) a partir del grado del estudiante.
function nivelDeGrado(grado) {
  const g = (grado || '').toString().trim().toLowerCase();
  if (!g) return null;
  if (/pre|jard|transic|p[aá]rvul|infan|inicial|^-/.test(g)) return 'preescolar';
  const m = g.match(/\d+/);
  const n = m ? parseInt(m[0], 10) : null;
  if (n !== null) {
    if (n === 0) return 'preescolar';
    if (n >= 1 && n <= 5) return 'primaria';
    if (n >= 6 && n <= 9) return 'secundaria';
    if (n >= 10) return 'media';
  }
  if (/(primero|segundo|tercero|cuarto|quinto)/.test(g)) return 'primaria';
  if (/(sexto|s[eé]ptimo|octavo|noveno)/.test(g)) return 'secundaria';
  if (/(d[eé]cimo|once|und[eé]cimo|media)/.test(g)) return 'media';
  return null;
}

const TIPOS = [
  ['actividades', 'Actividades'], ['materiales', 'Materiales'], ['espacios', 'Espacios'],
  ['comunicacion', 'Comunicación'], ['apoyos_humanos', 'Apoyos humanos'], ['tecnologias', 'Tecnologías'],
];
const INTENSIDADES = ['generalizado', 'extenso', 'limitado', 'intermitente'];
// Sistema de evaluación (SIEE) del colegio: define las opciones de desempeño
const OPCIONES_EVAL = {
  cualitativo: ['Superior', 'Alto', 'Básico', 'Bajo'],
  numerico5: ['5', '4', '3', '2', '1'],
  numerico10: ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1'],
};

// Actores del Plan de Mejoramiento Institucional (punto 7 del formato oficial)
const ACTORES_PMI = [
  ['familia', 'Familia, cuidadores o con quienes vive'],
  ['docentes', 'Docentes'],
  ['directivos', 'Directivos'],
  ['administrativos', 'Administrativos'],
  ['pares', 'Pares (sus compañeros)'],
];

const nombrePeriodo = (p) => (p === 5 ? 'Promoción' : `Periodo ${p}`);
const ROLES_LABEL = {
  superadmin: 'Administrador general', rector: 'Rector', coordinador: 'Coordinador',
  psicoorientador: 'Psicoorientador', docente: 'Docente', padre: 'Padre de familia', administrador: 'Administrador',
};
const BADGE_ACCION = { crear: 'ok', editar: 'gris', eliminar: 'error', firmar: 'morado' };


export default function PiarDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const editable = ['docente', 'psicoorientador', 'administrador', 'coordinador', 'rector', 'superadmin'].includes(usuario.rol);
  const puedeConfigurar = ['rector', 'coordinador', 'administrador', 'superadmin'].includes(usuario.rol);
  // Las áreas (asignaturas) las crean coordinador/psicoorientador; el docente solo las escoge.
  const puedeCrearArea = ['psicoorientador', 'coordinador', 'administrador', 'rector', 'superadmin'].includes(usuario.rol);
  const esPadre = usuario.rol === 'padre';
  const [piar, setPiar] = useState(null);
  const [areas, setAreas] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [valoraciones, setValoraciones] = useState([]);
  const [acta, setActa] = useState({ compromisos_familia: '', compromisos_institucion: '', firmada_familia: false, firmada_institucion: false });
  const [responsables, setResponsables] = useState({}); // { area_id: { docente_id, docente_nombre } } (deducido de la carga académica)
  const [error, setError] = useState('');
  const ajusteVacio = { area_id: '', periodo: 1, objetivo: '', barrera: '', tipo: 'actividades', descripcion: '', apoyo: '', intensidad: 'intermitente', evaluacion: '' };
  const [nuevo, setNuevo] = useState(ajusteVacio);
  const celdasRef = useRef({});
  const ponerSugerencia = (a, campo, texto) => {
    const el = celdasRef.current[`${a.id}-${campo}`];
    if (!el) return;
    const act = (el.value || '').trim();
    const val = act ? `${act}\n${texto}` : texto;
    el.value = val;
    actualizarAjuste(a, { [campo]: val });
  };
  const appendNuevo = (campo, texto) => setNuevo((n) => {
    const act = (n[campo] || '').trim();
    return { ...n, [campo]: act ? `${act}\n${texto}` : texto };
  });
  const [nuevaArea, setNuevaArea] = useState('');
  const [avisoFila, setAvisoFila] = useState('');
  const [periodoActivo, setPeriodoActivo] = useState(1); // 1..5, o 0 = todos
  const [bitacora, setBitacora] = useState([]);
  const [searchParams] = useSearchParams();
  const [vista, setVista] = useState(() => {
    const v = searchParams.get('v');
    return ['anexo1', 'anexo2', 'anexo3', 'anexo4'].includes(v) ? v : 'anexo2';
  }); // anexo1 | anexo2 | anexo3 | anexo4
  const [conPortada, setConPortada] = useState(true);
  const pp = conPortada ? '' : '?portada=0';
  const ppAmp = conPortada ? '' : '&portada=0';
  const a4vacio = { logros: '', recomendaciones: '', grado_destino: '', institucion_destino: '', apoyos_transicion: '', observaciones: '', firmada_entrega: false };
  const [anexo4, setAnexo4] = useState(a4vacio);
  const promVacio = { decision: '', grado_cursado: '', grado_siguiente: '', criterios: '', observaciones: '' };
  const [promocion, setPromocion] = useState(promVacio);
  const supervisa = ['rector', 'coordinador', 'psicoorientador', 'administrador', 'superadmin'].includes(usuario.rol);

  const numPeriodos = piar?.num_periodos || 4;
  const usaPromocion = piar?.usa_promocion ?? true;
  const periodosBase = Array.from({ length: numPeriodos }, (_, i) => i + 1);
  const periodosDisponibles = usaPromocion ? [...periodosBase, 5] : periodosBase;

  const [aniosPiar, setAniosPiar] = useState([]);
  async function cargar() {
    try {
      const p = await api.get(`/piar/${id}`);
      setPiar(p);
      setActa(p.acta || { compromisos_familia: '', compromisos_institucion: '', firmada_familia: false, firmada_institucion: false });
      if (p.estudiante_id) {
        api.get(`/piar?estudiante_id=${p.estudiante_id}`).then(setAniosPiar).catch(() => {});
        api.get(`/responsables?estudiante_id=${p.estudiante_id}`).then((list) => {
          const m = {}; list.forEach((r) => { m[r.area_id] = { docente_id: r.docente_id, docente_nombre: r.docente_nombre, origen: r.origen }; });
          setResponsables(m);
        }).catch(() => {});
      }
    } catch (e) { setError(e.message); }
  }
  function cargarValoraciones() {
    api.get(`/valoraciones?piar_id=${id}`).then(setValoraciones).catch(() => {});
  }
  function cargarBitacora() {
    if (supervisa) api.get(`/auditoria?piar_id=${id}`).then(setBitacora).catch(() => {});
  }
  function cargarAnexo4() {
    api.get(`/anexo4/${id}`).then((d) => setAnexo4(d || a4vacio)).catch(() => {});
    api.get(`/apoyos/promocion/${id}`).then((d) => setPromocion(d || promVacio)).catch(() => {});
  }
  async function guardarPromocion(e) {
    e.preventDefault();
    try { await api.put(`/apoyos/promocion/${id}`, promocion); cargarBitacora(); } catch (err) { setError(err.message); }
  }
  const [guardadoA4, setGuardadoA4] = useState('idle');
  const timerA4 = useRef(null);
  async function guardarAnexo4() {
    setGuardadoA4('saving');
    try { await api.put(`/anexo4/${id}`, anexo4); setGuardadoA4('saved'); cargarBitacora(); } catch (err) { setError(err.message); setGuardadoA4('error'); }
  }
  function autosaveA4() { clearTimeout(timerA4.current); timerA4.current = setTimeout(guardarAnexo4, 700); }
  function subirFirmaA4(campo, file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAnexo4((a) => ({ ...a, [campo]: reader.result }));
    reader.readAsDataURL(file);
  }
  useEffect(() => {
    cargar(); cargarValoraciones(); cargarBitacora(); cargarAnexo4();
    api.get('/areas').then(setAreas).catch(() => {});
  }, [id]);
  // Ficha del estudiante en la barra lateral mientras se trabaja su expediente
  const { fijarExpediente, limpiarExpediente } = useExpediente();
  useEffect(() => {
    if (piar) fijarExpediente({
      id: piar.estudiante_id, nombres: piar.estudiante_nombre, foto: piar.estudiante_foto,
      grado: piar.grado, curso_sede: piar.inst_sede, documento: piar.documento_numero,
      discapacidad: piar.discapacidad, reservado: piar.reservado,
      anioPiar: piar.periodo, estadoPiar: piar.estado,
    });
  }, [piar, fijarExpediente]);
  useEffect(() => () => limpiarExpediente(), [limpiarExpediente]);
  useEffect(() => {
    api.get(`/catalogo?tipo=${nuevo.tipo}`).then(setCatalogo).catch(() => {});
  }, [nuevo.tipo]);
  // si el periodo activo deja de estar disponible (p.ej. se reduce num_periodos), volver al 1
  useEffect(() => {
    if (periodoActivo !== 0 && piar && !periodosDisponibles.includes(periodoActivo)) setPeriodoActivo(1);
  }, [numPeriodos, usaPromocion]); // eslint-disable-line

  function subirFirma(campo, file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setActa((a) => ({ ...a, [campo]: reader.result }));
    reader.readAsDataURL(file);
  }
  const [guardadoActa, setGuardadoActa] = useState('idle');
  const timerActa = useRef(null);
  async function guardarActa() {
    setGuardadoActa('saving');
    try { await api.put(`/actas/${id}`, acta); setGuardadoActa('saved'); } catch (err) { setError(err.message); setGuardadoActa('error'); }
  }
  function autosaveActa() { clearTimeout(timerActa.current); timerActa.current = setTimeout(guardarActa, 700); }
  // Familia del acta (nombre + parentesco); al menos 2 filas visibles
  const famRows = (acta.familia && acta.familia.length) ? acta.familia : [{ nombre: '', parentesco: '' }, { nombre: '', parentesco: '' }];
  const setFam = (i, campo, val) => {
    const arr = famRows.map((f, j) => (j === i ? { ...f, [campo]: val } : f));
    setActa((a) => ({ ...a, familia: arr }));
  };
  const addFam = () => setActa((a) => ({ ...a, familia: [...famRows, { nombre: '', parentesco: '' }] }));
  // Actividades de apoyo en casa (actividad, estrategia, frecuencia D/S/P)
  const actRows = acta.actividades || [];
  const setAct = (i, campo, val) => setActa((a) => ({ ...a, actividades: (a.actividades || []).map((x, j) => (j === i ? { ...x, [campo]: val } : x)) }));
  const addAct = () => setActa((a) => ({ ...a, actividades: [...(a.actividades || []), { actividad: '', estrategia: '', frecuencia: '' }] }));
  const delAct = (i) => setActa((a) => ({ ...a, actividades: (a.actividades || []).filter((_, j) => j !== i) }));
  function valorDe(area_id, periodo) {
    const v = valoraciones.find((x) => x.area_id === area_id && x.periodo === periodo);
    return v ? v.desempeno || '' : '';
  }
  async function guardarValoracion(area_id, periodo, desempeno) {
    await api.put('/valoraciones', { piar_id: Number(id), area_id, periodo, desempeno });
    cargarValoraciones();
  }
  async function guardarSistemaEval(sis) {
    try { await api.put(`/geografia/instituciones/${piar.institucion_id}/periodos`, { num_periodos: numPeriodos, usa_promocion: usaPromocion, sistema_evaluacion: sis }); cargar(); }
    catch (err) { setError(err.message); }
  }
  const [guardadoPiar, setGuardadoPiar] = useState('idle');
  const timerPiar = useRef(null);
  async function guardarCabecera() {
    if (!editable) return;
    setGuardadoPiar('saving');
    try {
      await api.put(`/piar/${id}`, {
        periodo: piar.periodo, valoracion: piar.valoracion,
        aspectos_generales: piar.aspectos_generales, estado: piar.estado,
        pmi: piar.pmi, grado: piar.grado, director_grupo: piar.director_grupo,
        fecha_elaboracion: piar.fecha_elaboracion,
        caracteristicas: piar.caracteristicas || {},
        recomendaciones_pmi: piar.recomendaciones_pmi || {},
      });
      setGuardadoPiar('saved');
    } catch (err) { setError(err.message); setGuardadoPiar('error'); }
  }
  function autosavePiar() { if (!editable) return; clearTimeout(timerPiar.current); timerPiar.current = setTimeout(guardarCabecera, 700); }
  const setCarac = (campo, valor) => setPiar((p) => ({ ...p, caracteristicas: { ...(p.caracteristicas || {}), [campo]: valor } }));
  function edadDe(fecha) {
    if (!fecha) return '';
    const d = new Date(fecha), h = new Date();
    let a = h.getFullYear() - d.getFullYear();
    if (h.getMonth() < d.getMonth() || (h.getMonth() === d.getMonth() && h.getDate() < d.getDate())) a--;
    return a >= 0 && a < 120 ? `${a} años` : '';
  }
  const setActor = (actor, campo, valor) => setPiar((p) => ({
    ...p, recomendaciones_pmi: { ...(p.recomendaciones_pmi || {}), [actor]: { ...((p.recomendaciones_pmi || {})[actor] || {}), [campo]: valor } },
  }));
  async function guardarPeriodos(n, promo) {
    try {
      await api.put(`/geografia/instituciones/${piar.institucion_id}/periodos`, { num_periodos: n, usa_promocion: promo });
      cargar();
    } catch (err) { setError(err.message); }
  }
  async function agregarAjuste(e) {
    e?.preventDefault?.();
    // Se puede agregar la fila aunque esté vacía (varios docentes diligencian el formato).
    try {
      setAvisoFila(''); setError('');
      const periodo = periodoActivo === 0 ? nuevo.periodo : periodoActivo;
      await api.post('/ajustes', { piar_id: Number(id), ...nuevo, periodo, area_id: nuevo.area_id || null });
      setNuevo(ajusteVacio);
      cargar();
    } catch (err) { setError(err.message); }
  }
  async function agregarArea(nombre) {
    const n = (nombre ?? nuevaArea).trim();
    if (!n) return;
    try {
      const existe = areas.find((a) => (a.nombre || '').trim().toLowerCase() === n.toLowerCase());
      let a = existe;
      if (!existe) { a = await api.post('/areas', { nombre: n }); const lista = await api.get('/areas'); setAreas(lista); }
      setNuevaArea('');
      setNuevo((nv) => ({ ...nv, area_id: a.id }));
    } catch (err) { setError(err.message); }
  }
  // Educación inicial: la valoración es por dimensiones y DBA de transición, no por áreas
  async function agregarDimensiones() {
    const DIMENSIONES = ['Dimensión corporal', 'Dimensión comunicativa', 'Dimensión cognitiva',
      'Dimensión personal-social', 'Dimensión artística', 'Dimensión ética y de valores', 'Dimensión espiritual'];
    try {
      const existentes = areas.map((a) => a.nombre);
      for (const d of DIMENSIONES) { if (!existentes.includes(d)) await api.post('/areas', { nombre: d }); }
      const lista = await api.get('/areas'); setAreas(lista);
    } catch (err) { setError(err.message); }
  }
  // Carga las áreas/asignaturas de un nivel educativo (Ley 115, art. 23)
  async function cargarAreasNivel(items) {
    try {
      const existentes = areas.map((a) => (a.nombre || '').trim().toLowerCase());
      for (const d of items) { if (!existentes.includes(d.trim().toLowerCase())) await api.post('/areas', { nombre: d }); }
      const lista = await api.get('/areas'); setAreas(lista);
    } catch (err) { setError(err.message); }
  }
  // Edición directa de una celda del ajuste (guarda al salir del campo)
  async function actualizarAjuste(a, cambios) {
    try {
      await api.put(`/ajustes/${a.id}`, {
        area_id: a.area_id, periodo: a.periodo, objetivo: a.objetivo, barrera: a.barrera,
        tipo: a.tipo, descripcion: a.descripcion, apoyo: a.apoyo, intensidad: a.intensidad,
        evaluacion: a.evaluacion, desempeno: a.desempeno, ...cambios,
      });
      cargar();
    } catch (err) { setError(err.message); }
  }
  async function eliminarAjuste(aid) { await api.del(`/ajustes/${aid}`); cargar(); }
  const esFilaVacia = (a) => !a.area_id && !['objetivo', 'barrera', 'descripcion', 'evaluacion'].some((k) => (a[k] || '').trim()) && !a.desempeno;
  async function limpiarFilasVacias() {
    const vacias = ajustesVisibles.filter((a) => esFilaVacia(a) && (supervisa || !a.creado_por || a.creado_por === usuario.id));
    if (!vacias.length) { setAvisoFila('No hay filas vacías para borrar en esta selección.'); return; }
    if (!window.confirm(`¿Borrar ${vacias.length} fila(s) vacía(s)?`)) return;
    for (const a of vacias) { await api.del(`/ajustes/${a.id}`); }
    setAvisoFila('');
    cargar();
  }

  if (!piar) return <div>{error || 'Cargando…'}</div>;

  const av = piar.avance || { anexo1: 0, anexo2: 0, anexo3: 0, total: 0 };
  const ajustesVisibles = piar.ajustes.filter((a) => periodoActivo === 0 || a.periodo === periodoActivo);
  // Áreas sin repetidos (ignora mayúsculas/espacios) para los selectores
  const areasUnicas = (() => {
    const vistos = new Set(); const out = [];
    for (const ar of areas) { const k = (ar.nombre || '').trim().toLowerCase(); if (!k || vistos.has(k)) continue; vistos.add(k); out.push(ar); }
    return out;
  })();
  // Un docente solo ve en el selector sus áreas asignadas y las que no tienen responsable.
  const areasParaMi = supervisa
    ? areasUnicas
    : areasUnicas.filter((ar) => { const r = responsables[ar.id]; return !r || r.docente_id == null || r.docente_id === usuario.id; });
  const opcionesDesempeno = OPCIONES_EVAL[piar.sistema_evaluacion] || OPCIONES_EVAL.cualitativo;
  const sufijoPdf = periodoActivo === 0 ? 'all' : periodoActivo;
  const nombrePdf = periodoActivo === 0 ? 'Anexo2_todos' : (periodoActivo === 5 ? 'Anexo2_promocion' : `Anexo2_P${periodoActivo}`);

  return (
    <div>
      <div className="exp-toolbar">
        <button type="button" className="exp-volver" onClick={() => navigate('/seguimiento')} title="Volver a la lista de estudiantes" aria-label="Volver">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20z" /></svg>
        </button>
        <h1 className="exp-titulo">{piar.estudiante_nombre} <span className="exp-anio-badge">PIAR {piar.periodo}</span></h1>
        <div className="exp-acciones">
          <MenuDocumentos conPortada={conPortada} setConPortada={setConPortada} docs={[
            { clave: 'a1', nombre: 'Anexo 1', icono: 'doc', url: `/informes/estudiante/${piar.estudiante_id}/pdf${pp}`, archivo: 'Anexo1.pdf' },
            { clave: 'a2', nombre: 'Anexo 2', icono: 'doc', url: `/informes/piar/${id}/pdf?periodo=all${ppAmp}`, archivo: 'Anexo2.pdf' },
            { clave: 'a3', nombre: 'Anexo 3', icono: 'doc', url: `/informes/acta/${id}/pdf${pp}`, archivo: 'Anexo3.pdf' },
            { clave: 'a4', nombre: 'Anexo 4', icono: 'doc', url: `/informes/anexo4/${id}/pdf${pp}`, archivo: 'Anexo4.pdf' },
            { clave: 'inf', nombre: 'Informe anual', icono: 'chart', url: `/informes/competencias/${id}/pdf${pp}`, archivo: 'Informe_anual.pdf' },
            { clave: 'seg', nombre: 'Seguimiento', icono: 'track', url: `/informes/seguimiento/${id}/pdf${pp}`, archivo: 'Seguimiento.pdf' },
          ]} />
        </div>
      </div>
      {error && <div className="mensaje-error">{error}</div>}

      {aniosPiar.length > 0 && (() => {
        const orden = [...aniosPiar].sort((a, b) => String(a.periodo).localeCompare(String(b.periodo)));
        const actual = orden.find((p) => String(p.id) === String(id));
        const eliminarAnio = async () => {
          if (!actual) return;
          if (!window.confirm(`¿Está seguro de eliminar el PIAR del año ${actual.periodo} (grado ${actual.grado || '—'})?\n\nSe borrarán todos los anexos de ese año y no se puede deshacer.`)) return;
          try {
            await api.del(`/piar/${id}`);
            const restantes = orden.filter((p) => String(p.id) !== String(id)).sort((a, b) => String(b.periodo).localeCompare(String(a.periodo)));
            navigate(restantes[0] ? `/piar/${restantes[0].id}` : '/seguimiento');
          } catch (e) { setError(e.message); }
        };
        return (
          <div className="anios-tabs">
            <span className="anios-label">Año</span>
            {orden.map((p) => (
              <Link key={p.id} to={`/piar/${p.id}`} className={String(p.id) === String(id) ? 'activo' : ''}
                title={`PIAR ${p.periodo} · estado: ${p.estado}`}>
                {p.periodo} · {p.grado || p.grado_actual || '—'}{p.estado === 'vigente' ? ' ●' : ''}
              </Link>
            ))}
            {editable && <AgregarAnio anios={orden} estudianteId={piar.estudiante_id}
              onCreado={(np) => navigate(`/piar/${np.id}`)} onError={setError} />}
            {puedeConfigurar && orden.length > 1 && (
              <button type="button" className="anios-eliminar" onClick={eliminarAnio} title={`Eliminar el año ${actual?.periodo || ''}`}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg>
                Eliminar año
              </button>
            )}
          </div>
        );
      })()}

      <NavAnexos vista={vista} estudianteId={piar.estudiante_id} piarId={id} av={av} onVista={setVista} />

      {vista === 'anexo1' && <EstudianteForm estudianteId={piar.estudiante_id} embebido />}

      {vista === 'anexo2' && <>
      {/* ANEXO 2 — mismo aspecto que el formato impreso */}
      <div className="formato" id="anexo2">
        <div className="formato-cab">
          <div>
            <h3>Plan Individual de Ajustes Razonables — Anexo 2</h3>
            <div className="sub">Valoración pedagógica y ajustes razonables</div>
          </div>
          <div className="formato-sello"><b>PIAR</b><span>Decreto 1421/2017</span></div>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); guardarCabecera(); }} onBlur={autosavePiar}>
          <table className="ftabla">
            <tbody>
              <tr><td className="banda" colSpan={4}>Datos de elaboración</td></tr>
              <tr><td className="lbl">Fecha de elaboración</td>
                <td className="val"><input type="date" value={piar.fecha_elaboracion ? piar.fecha_elaboracion.slice(0, 10) : ''} onChange={(e) => setPiar({ ...piar, fecha_elaboracion: e.target.value })} disabled={!editable} /></td>
                <td className="lbl">Jornada</td>
                <td className="val"><select value={(piar.caracteristicas || {}).jornada || ''} onChange={(e) => setCarac('jornada', e.target.value)} disabled={!editable}>
                  <option value="">— Jornada —</option>
                  {['Mañana', 'Tarde', 'Nocturna', 'Sabatino', 'Única'].map((j) => <option key={j} value={j}>{j}</option>)}
                </select></td></tr>
              <tr><td className="lbl">Institución educativa</td><td className="val"><input value={piar.inst_nombre || ''} disabled /></td>
                <td className="lbl">Sede</td><td className="val"><input value={piar.inst_sede || ''} disabled /></td></tr>
              <tr><td className="lbl">Docentes que elaboran y cargo</td>
                <td className="val" colSpan={3}><input value={(piar.caracteristicas || {}).docentes_elabora || ''} onChange={(e) => setCarac('docentes_elabora', e.target.value)} disabled={!editable} placeholder="Nombres y cargos de quienes elaboran el PIAR" /></td></tr>
              <tr><td className="banda" colSpan={4}>Datos del estudiante</td></tr>
              <tr><td className="lbl">Nombre del estudiante</td><td className="val"><input value={piar.estudiante_nombre} disabled /></td>
                <td className="lbl">Documento</td><td className="val"><input value={piar.documento_numero || ''} disabled /></td></tr>
              <tr><td className="lbl">Edad</td><td className="val"><input value={edadDe(piar.fecha_nacimiento)} disabled /></td>
                <td className="lbl">Grado</td>
                <td className="val"><input value={piar.grado || ''} onChange={(e) => setPiar({ ...piar, grado: e.target.value })} disabled={!editable} placeholder="Grado que cursa este año" /></td></tr>
              <tr><td className="lbl">Año / Periodo</td><td className="val"><input value={piar.periodo || ''} disabled /></td>
                <td className="lbl">Director(a) de grupo</td>
                <td className="val"><input value={piar.director_grupo || ''} onChange={(e) => setPiar({ ...piar, director_grupo: e.target.value })} disabled={!editable} placeholder="Director de grupo" /></td></tr>
              <tr><td className="banda" colSpan={4}>1. Características del estudiante</td></tr>
              <tr><td className="lbl">Descripción general: gustos e intereses o aspectos que le desagradan, y expectativas del estudiante y la familia</td>
                <td className="val" colSpan={3}><textarea rows={3} value={(piar.caracteristicas || {}).gustos || ''} onChange={(e) => setCarac('gustos', e.target.value)} disabled={!editable} /></td></tr>
              <tr><td className="lbl">Descripción de lo que hace, puede hacer o requiere apoyo para favorecer su proceso educativo</td>
                <td className="val" colSpan={3}><textarea rows={3} value={(piar.caracteristicas || {}).desempeno || ''} onChange={(e) => setCarac('desempeno', e.target.value)} disabled={!editable} /></td></tr>
              <tr><td className="lbl">Habilidades, competencias, cualidades y aprendizajes con los que cuenta para el grado en que fue matriculado</td>
                <td className="val" colSpan={3}><textarea rows={3} value={(piar.caracteristicas || {}).habilidades || ''} onChange={(e) => setCarac('habilidades', e.target.value)} disabled={!editable} /></td></tr>
              <tr><td className="lbl">Estado del PIAR</td>
                <td className="val" colSpan={3}>
                  <select value={piar.estado} onChange={(e) => setPiar({ ...piar, estado: e.target.value })} disabled={!editable}>
                    <option value="borrador">Borrador</option><option value="vigente">Vigente</option><option value="cerrado">Cerrado</option>
                  </select></td></tr>
            </tbody>
          </table>
          {editable && <div style={{ padding: 10 }}><Guardado estado={guardadoPiar} /></div>}
        </form>
        <div className="formato-pie">Ministerio de Educación Nacional – Decreto 1421 de 2017 – Anexo 2</div>
      </div>

      {/* Periodos: configuración, pestañas deslizables e impresión */}
      <div className="card">
        {puedeConfigurar && (
          <div className="config-periodos">
            <b>Periodos del colegio:</b>
            {[1, 2, 3, 4].map((n) => (
              <button key={n} type="button" className={`btn sm ${numPeriodos === n ? '' : 'sec'}`}
                onClick={() => guardarPeriodos(n, usaPromocion)}>{n}</button>
            ))}
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8, fontWeight: 400 }}>
              <input type="checkbox" checked={usaPromocion} style={{ width: 'auto' }}
                onChange={(e) => guardarPeriodos(numPeriodos, e.target.checked)} />
              Usar promoción (consolidado anual)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8, fontWeight: 400 }}>
              Evaluación:
              <select value={piar.sistema_evaluacion || 'cualitativo'} onChange={(e) => guardarSistemaEval(e.target.value)} style={{ width: 'auto' }}>
                <option value="cualitativo">Superior / Alto / Básico / Bajo</option>
                <option value="numerico5">Nota de 1 a 5</option>
                <option value="numerico10">Nota de 1 a 10</option>
              </select>
            </label>
          </div>
        )}
        <div className="periodos-scroll">
          {periodosDisponibles.map((p) => (
            <button key={p} type="button" className={`periodo-tab ${periodoActivo === p ? 'activo' : ''} ${p === 5 ? 'promo' : ''}`}
              onClick={() => setPeriodoActivo(p)}>{nombrePeriodo(p)}</button>
          ))}
          <button type="button" className={`periodo-tab ${periodoActivo === 0 ? 'activo' : ''}`} onClick={() => setPeriodoActivo(0)}>Todos</button>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          <button className="btn sec sm" onClick={() => api.abrirPdf(`/informes/piar/${id}/pdf?periodo=${sufijoPdf}${ppAmp}`)}>
            Imprimir {periodoActivo === 0 ? 'todos los periodos' : nombrePeriodo(periodoActivo)}
          </button>
          <button className="btn sec sm" title="Descargar" onClick={() => api.descargarPdf(`/informes/piar/${id}/pdf?periodo=${sufijoPdf}${ppAmp}`, `${nombrePdf}.pdf`)}>↓</button>
        </div>

        {/* Barreras y ajustes razonables del periodo — se diligencia por filas, una por área */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <h3 style={{ marginBottom: 2 }}>2. Ajustes razonables {periodoActivo === 0 ? '(todos)' : `· ${nombrePeriodo(periodoActivo)}`}</h3>
          {editable && ajustesVisibles.some(esFilaVacia) && (
            <button type="button" className="btn sec sm" onClick={limpiarFilasVacias} title="Borrar las filas que quedaron sin diligenciar">🧹 Limpiar filas vacías</button>
          )}
        </div>
        <p style={{ fontSize: 12, color: 'var(--gris-500)', margin: '0 0 6px' }}>
          Escribe directamente en cada fila. Los cambios se guardan al salir del campo. La última fila agrega un ajuste nuevo.
          Desliza la tabla a los lados si no cabe en la pantalla.
        </p>
        <div style={{ overflowX: 'auto', border: '1px solid var(--gris-200)', borderRadius: 8 }}>
        <table className="ftabla" style={{ minWidth: 1020, margin: 0 }}>
          <thead>
            <tr>
              {periodoActivo === 0 && <th style={{ minWidth: 58 }}>Per.</th>}
              <th style={{ minWidth: 150 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <span>Áreas / Aprendizajes</span>
                  {puedeCrearArea && (
                    <button type="button" className="th-add-area" title="Agregar una asignatura o área"
                      onClick={() => { const n = window.prompt('Nombre de la asignatura o área:'); if (n && n.trim()) agregarArea(n.trim()); }}>+ Área</button>
                  )}
                </div>
              </th>
              <th style={{ minWidth: 170 }}>Objetivos / propósitos<br /><span style={{ fontWeight: 400, fontSize: 10 }}>(para el grado, según EBC y DBA)</span></th>
              <th style={{ minWidth: 170 }}>Barreras<br /><span style={{ fontWeight: 400, fontSize: 10 }}>(en el contexto)</span></th>
              <th style={{ minWidth: 180 }}>Ajustes razonables<br /><span style={{ fontWeight: 400, fontSize: 10 }}>(apoyos/estrategias)</span></th>
              <th style={{ minWidth: 170 }}>Evaluación de los ajustes</th>
              <th style={{ minWidth: 110 }}>Desempeño</th>
              {editable && <th style={{ minWidth: 40 }}></th>}
            </tr>
          </thead>
          <tbody>
            {ajustesVisibles.map((a) => {
              const resp = responsables[a.area_id];
              const puedoFila = supervisa || (resp && resp.docente_id != null
                ? resp.docente_id === usuario.id
                : (!a.creado_por || a.creado_por === usuario.id));
              const edF = editable && puedoFila;
              const otroDocente = !supervisa && !puedoFila;
              const bloqueadaPor = (resp && resp.docente_nombre) || a.creador_nombre || 'Otro docente';
              return (
              <tr key={a.id} style={a.retirado ? { opacity: 0.5 } : null}>
                {periodoActivo === 0 && <td className="lbl" style={{ textAlign: 'center' }}>{nombrePeriodo(a.periodo)}</td>}
                <td className="val" style={{ padding: 4, verticalAlign: 'top' }}>
                  {edF ? (
                    <>
                      <select value={a.area_id || ''} onChange={(e) => actualizarAjuste(a, { area_id: e.target.value || null })} style={{ marginBottom: 4 }}>
                        <option value="">— Área —</option>
                        {areasParaMi.map((ar) => <option key={ar.id} value={ar.id}>{ar.nombre}</option>)}
                      </select>
                    </>
                  ) : (a.area_nombre || '—')}
                  {otroDocente && <div className="fila-autor" title="Área asignada a otro docente. Solo el coordinador o el psicoorientador pueden cambiarla.">🔒 {bloqueadaPor}</div>}
                </td>
                <td className="val" style={{ padding: 4, verticalAlign: 'top' }}>
                  {edF ? (<><SugMenu campo="objetivo" onPick={(t) => ponerSugerencia(a, 'objetivo', t)} /><textarea key={`o${a.id}`} ref={(el) => { if (el) celdasRef.current[`${a.id}-objetivo`] = el; }} rows={2} defaultValue={a.objetivo || ''} onBlur={(e) => { if ((a.objetivo || '') !== e.target.value) actualizarAjuste(a, { objetivo: e.target.value }); }} /></>) : (a.objetivo || '—')}
                </td>
                <td className="val" style={{ padding: 4, verticalAlign: 'top' }}>
                  {edF ? (<><SugMenu campo="barrera" onPick={(t) => ponerSugerencia(a, 'barrera', t)} /><textarea key={`b${a.id}`} ref={(el) => { if (el) celdasRef.current[`${a.id}-barrera`] = el; }} rows={2} defaultValue={a.barrera || ''} onBlur={(e) => { if ((a.barrera || '') !== e.target.value && e.target.value.trim()) actualizarAjuste(a, { barrera: e.target.value }); }} /></>) : a.barrera}
                </td>
                <td className="val" style={{ padding: 4, verticalAlign: 'top' }}>
                  {edF ? (<><SugMenu campo="descripcion" onPick={(t) => ponerSugerencia(a, 'descripcion', t)} /><textarea key={`d${a.id}`} ref={(el) => { if (el) celdasRef.current[`${a.id}-descripcion`] = el; }} rows={2} defaultValue={a.descripcion || ''} onBlur={(e) => { if ((a.descripcion || '') !== e.target.value && e.target.value.trim()) actualizarAjuste(a, { descripcion: e.target.value }); }} /></>) : a.descripcion}
                </td>
                <td className="val" style={{ padding: 4, verticalAlign: 'top' }}>
                  {edF ? <textarea key={`e${a.id}`} rows={2} defaultValue={a.evaluacion || ''} onBlur={(e) => { if ((a.evaluacion || '') !== e.target.value) actualizarAjuste(a, { evaluacion: e.target.value }); }} /> : (a.evaluacion || '—')}
                </td>
                <td className="val" style={{ padding: 4, verticalAlign: 'top', textAlign: 'center' }}>
                  {edF
                    ? <select value={a.desempeno || ''} onChange={(e) => actualizarAjuste(a, { desempeno: e.target.value })} style={{ fontSize: 11 }}>
                        <option value="">—</option>
                        {opcionesDesempeno.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    : (a.desempeno || '—')}
                </td>
                {editable && <td className="val" style={{ textAlign: 'center', verticalAlign: 'top' }}>{edF && <button type="button" className="btn sec sm" title="Eliminar fila" onClick={() => eliminarAjuste(a.id)}>×</button>}</td>}
              </tr>
              );
            })}
            {editable && (
              <tr style={{ background: '#F7FAFC' }}>
                {periodoActivo === 0 && (
                  <td className="val" style={{ padding: 4, verticalAlign: 'top' }}>
                    <select value={nuevo.periodo} onChange={(e) => setNuevo({ ...nuevo, periodo: Number(e.target.value) })} style={{ fontSize: 10 }}>
                      {periodosDisponibles.map((p) => <option key={p} value={p}>{nombrePeriodo(p)}</option>)}
                    </select>
                  </td>
                )}
                <td className="val" style={{ padding: 4, verticalAlign: 'top' }}>
                  <select value={nuevo.area_id} onChange={(e) => setNuevo({ ...nuevo, area_id: e.target.value })} style={{ marginBottom: 4 }}>
                    <option value="">— Área —</option>
                    {areasParaMi.map((ar) => <option key={ar.id} value={ar.id}>{ar.nombre}</option>)}
                  </select>
                </td>
                <td className="val" style={{ padding: 4, verticalAlign: 'top' }}><SugMenu campo="objetivo" onPick={(t) => appendNuevo('objetivo', t)} /><textarea rows={2} value={nuevo.objetivo} onChange={(e) => setNuevo({ ...nuevo, objetivo: e.target.value })} placeholder="Objetivo…" /></td>
                <td className="val" style={{ padding: 4, verticalAlign: 'top' }}><SugMenu campo="barrera" onPick={(t) => { setAvisoFila(''); appendNuevo('barrera', t); }} /><textarea rows={2} value={nuevo.barrera} onChange={(e) => { if (avisoFila) setAvisoFila(''); setNuevo({ ...nuevo, barrera: e.target.value }); }} placeholder="Barrera…" /></td>
                <td className="val" style={{ padding: 4, verticalAlign: 'top' }}><SugMenu campo="descripcion" onPick={(t) => { setAvisoFila(''); appendNuevo('descripcion', t); }} /><textarea rows={2} value={nuevo.descripcion} onChange={(e) => { if (avisoFila) setAvisoFila(''); setNuevo({ ...nuevo, descripcion: e.target.value }); }} placeholder="Ajuste razonable…" /></td>
                <td className="val" style={{ padding: 4, verticalAlign: 'top' }}><textarea rows={2} value={nuevo.evaluacion} onChange={(e) => setNuevo({ ...nuevo, evaluacion: e.target.value })} placeholder="Evaluación…" /></td>
                <td className="val" style={{ padding: 4, verticalAlign: 'top', textAlign: 'center' }}>
                  <select value={nuevo.desempeno || ''} onChange={(e) => setNuevo({ ...nuevo, desempeno: e.target.value })} style={{ fontSize: 11 }}>
                    <option value="">—</option>
                    {opcionesDesempeno.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </td>
                <td className="val" style={{ textAlign: 'center', verticalAlign: 'top' }}><button type="button" className="btn sm" title="Agregar esta fila" onClick={() => agregarAjuste()}>+</button></td>
              </tr>
            )}
            {editable && avisoFila && (
              <tr>
                <td colSpan={periodoActivo === 0 ? 8 : 7} style={{ padding: '6px 8px', color: '#b4232a', background: '#fdECEC', fontSize: 12.5, borderTop: '1px solid #f3c6c6' }}>
                  ⚠️ {avisoFila}
                </td>
              </tr>
            )}
            {ajustesVisibles.length === 0 && !editable && <tr><td className="val" colSpan={periodoActivo === 0 ? 7 : 6} style={{ color: 'var(--gris-500)', padding: 8 }}>Sin ajustes en esta selección.</td></tr>}
          </tbody>
        </table>
        </div>

        {editable && (
          <div style={{ marginTop: 10 }}>
            {puedeCrearArea ? (
              <>
                {(() => {
                  const claveRec = nivelDeGrado(piar.grado);
                  const nivelRec = NIVELES_AREAS.find((n) => n.clave === claveRec);
                  return (
                    <div style={{ margin: '4px 0 8px' }}>
                      {nivelRec && (
                        <div style={{ marginBottom: 6 }}>
                          <button type="button" className="btn sm" title={nivelRec.nota}
                            onClick={() => cargarAreasNivel(nivelRec.items)}>
                            📚 Cargar áreas de {nivelRec.etiqueta}
                          </button>
                          <span style={{ fontSize: 12, color: 'var(--gris-600)', marginLeft: 8 }}>
                            recomendado para <strong>grado {piar.grado || '—'}</strong>
                          </span>
                        </div>
                      )}
                      <span style={{ fontSize: 12, color: 'var(--gris-600)', fontWeight: 600, marginRight: 4 }}>
                        {nivelRec ? 'Otros niveles:' : 'Cargar áreas por nivel:'}
                      </span>
                      <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
                        {NIVELES_AREAS.map((n) => (
                          <button key={n.clave} type="button"
                            className={`chip-nivel${n.clave === claveRec ? ' recomendado' : ''}`}
                            title={n.nota} onClick={() => cargarAreasNivel(n.items)}>{n.etiqueta}</button>
                        ))}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--gris-500)', marginLeft: 8 }}>· para una asignatura suelta usa <strong>+ Área</strong> en el encabezado de la tabla.</span>
                    </div>
                  );
                })()}
                <p style={{ fontSize: 12, color: 'var(--gris-600)', margin: '0 0 8px', background: '#eef4fb', border: '1px solid #cfe0f3', borderRadius: 8, padding: '8px 10px' }}>
                  <strong>Preescolar y educación inicial:</strong> los propósitos se orientan según las bases curriculares
                  para la educación inicial y los DBA de transición, que no van por áreas ni asignaturas (usa las dimensiones).
                </p>
              </>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--gris-500)', marginBottom: 8 }}>
                Escoge el área de la lista en la última fila. Si falta una asignatura, el coordinador o el psicoorientador debe agregarla.
              </p>
            )}
            <p style={{ fontSize: 12, color: 'var(--gris-500)', margin: '6px 0 0' }}>
              💡 En cada casilla de <strong>Objetivos</strong>, <strong>Barreras</strong> y <strong>Ajustes razonables</strong>{' '}
              puedes abrir <em>Sugerencias</em> (orientaciones MEN) y escoge la que necesites; se agrega al texto y luego puedes editarla.
            </p>
          </div>
        )}
      </div>

      {/* 7. PMI por actores — va después de los ajustes razonables (orden oficial) */}
      <form className="formato" onSubmit={(e) => { e.preventDefault(); guardarCabecera(); }} onBlur={autosavePiar}>
        <div className="formato-cab">
          <div><h3>7. Recomendaciones para el Plan de Mejoramiento Institucional</h3>
            <div className="sub">Eliminación de barreras y creación de procesos para la participación, el aprendizaje y el progreso</div></div>
          <div className="formato-sello"><b>PIAR</b><span>Decreto 1421/2017</span></div>
        </div>
        <table className="ftabla">
          <thead><tr><th style={{ width: '20%' }}>Actores</th><th>Acciones</th><th>Estrategias a implementar</th></tr></thead>
          <tbody>
            {ACTORES_PMI.map(([clave, nombre]) => {
              const a = (piar.recomendaciones_pmi || {})[clave] || {};
              return (
                <tr key={clave}>
                  <td className="lbl" style={{ fontWeight: 600 }}>{nombre}</td>
                  <td className="val"><textarea rows={2} value={a.acciones || ''} onChange={(e) => setActor(clave, 'acciones', e.target.value)} disabled={!editable} /></td>
                  <td className="val"><textarea rows={2} value={a.estrategias || ''} onChange={(e) => setActor(clave, 'estrategias', e.target.value)} disabled={!editable} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {editable && <div style={{ padding: 10 }}><Guardado estado={guardadoPiar} /></div>}
        <div className="formato-pie">Firma y cargo de quienes realizan el proceso de valoración: docentes, coordinadores, docente de apoyo u otro profesional. Si hay varios docentes a cargo del curso, cada uno aporta su valoración y los ajustes de su área.</div>
      </form>
      </>}

      {vista === 'anexo3' && (
      <form className="card" id="anexo3" onSubmit={(e) => { e.preventDefault(); guardarActa(); }} onBlur={() => !esPadre && autosaveActa()}>
        <h2>Acta de Acuerdo — Anexo 3</h2>

        {/* Encabezado heredado del estudiante */}
        <table className="ftabla" style={{ marginBottom: 12 }}>
          <tbody>
            <tr><td className="lbl" style={{ width: '22%' }}>Institución y sede</td><td className="val"><input value={`${piar.inst_nombre || ''}${piar.inst_sede ? ' · ' + piar.inst_sede : ''}`} disabled /></td>
                <td className="lbl" style={{ width: '12%' }}>Fecha</td><td className="val"><input type="date" value={acta.fecha_firma ? acta.fecha_firma.slice(0, 10) : ''} disabled={esPadre} onChange={(e) => setActa({ ...acta, fecha_firma: e.target.value })} /></td></tr>
            <tr><td className="lbl">Nombre del estudiante</td><td className="val"><input value={piar.estudiante_nombre || ''} disabled /></td>
                <td className="lbl">Documento</td><td className="val"><input value={piar.documento_numero || ''} disabled /></td></tr>
            <tr><td className="lbl">Grado</td><td className="val"><input value={piar.grado || ''} disabled /></td>
                <td className="lbl">Año</td><td className="val"><input value={piar.periodo || ''} disabled /></td></tr>
            <tr><td className="lbl">Nombres del equipo directivo y de docentes</td>
                <td className="val" colSpan={3}><input value={acta.nombres_directivos || ''} disabled={esPadre}
                  onChange={(e) => setActa({ ...acta, nombres_directivos: e.target.value })} /></td></tr>
          </tbody>
        </table>

        {/* Familia del estudiante y parentesco */}
        <table className="ftabla" style={{ marginBottom: 12 }}>
          <thead><tr><th>Nombres de la familia del estudiante</th><th style={{ width: '30%' }}>Parentesco</th></tr></thead>
          <tbody>
            {famRows.map((f, i) => (
              <tr key={i}>
                <td className="val"><input value={f.nombre || ''} disabled={esPadre} onChange={(e) => setFam(i, 'nombre', e.target.value)} /></td>
                <td className="val"><input value={f.parentesco || ''} disabled={esPadre} onChange={(e) => setFam(i, 'parentesco', e.target.value)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!esPadre && <button type="button" className="btn sec sm" style={{ marginBottom: 12 }} onClick={addFam}>+ Agregar familiar</button>}

        <div style={{ fontSize: 12.5, color: 'var(--gris-700)', background: 'var(--gris-100)', padding: '12px 14px', borderRadius: 8, lineHeight: 1.5 }}>
          <p style={{ margin: '0 0 8px' }}>
            Según el Decreto 1421 de 2017 la educación inclusiva es un proceso permanente que reconoce, valora y responde a la
            diversidad de características, intereses, posibilidades y expectativas de los estudiantes para promover su desarrollo,
            aprendizaje y participación, en un ambiente de aprendizaje común, sin discriminación o exclusión.
          </p>
          <p style={{ margin: '0 0 8px' }}>
            La inclusión solo es posible cuando se unen los esfuerzos del colegio, el estudiante y la familia. De ahí la importancia
            de formalizar con las firmas, la presente Acta Acuerdo.
          </p>
          <p style={{ margin: 0 }}>
            <strong>El Establecimiento Educativo</strong> ha realizado la valoración y definido los ajustes razonables que
            facilitarán al estudiante su proceso educativo.
          </p>
        </div>

        <div className="campo"><label>La Familia se compromete a cumplir y firmar los compromisos señalados en el PIAR y en las actas de acuerdo, para fortalecer los procesos escolares del estudiante y en particular a:</label>
          <textarea value={acta.compromisos_familia || ''} disabled={esPadre}
            onChange={(e) => setActa({ ...acta, compromisos_familia: e.target.value })}
            placeholder="Compromisos específicos para implementar en el aula que requieran ampliación o detalle adicional al PIAR" /></div>
        <div className="campo"><label>Compromisos de la institución</label>
          <textarea value={acta.compromisos_institucion || ''} disabled={esPadre}
            onChange={(e) => setActa({ ...acta, compromisos_institucion: e.target.value })} /></div>

        {/* Y en casa apoyará con las siguientes actividades (tabla oficial) */}
        <label style={{ fontWeight: 600, fontSize: 13 }}>Y en casa apoyará con las siguientes actividades:</label>
        <table className="ftabla" style={{ margin: '4px 0 6px' }}>
          <thead><tr><th style={{ width: '28%' }}>Nombre de la actividad</th><th>Descripción de la estrategia</th><th style={{ width: '20%' }}>Frecuencia</th>{!esPadre && <th style={{ width: '5%' }}></th>}</tr></thead>
          <tbody>
            {actRows.map((a, i) => (
              <tr key={i}>
                <td className="val"><textarea rows={2} value={a.actividad || ''} disabled={esPadre} onChange={(e) => setAct(i, 'actividad', e.target.value)} /></td>
                <td className="val"><textarea rows={2} value={a.estrategia || ''} disabled={esPadre} onChange={(e) => setAct(i, 'estrategia', e.target.value)} /></td>
                <td className="val">
                  <select value={a.frecuencia || ''} disabled={esPadre} onChange={(e) => setAct(i, 'frecuencia', e.target.value)} style={{ fontSize: 12 }}>
                    <option value="">—</option><option value="Diaria">Diaria (D)</option><option value="Semanal">Semanal (S)</option><option value="Permanente">Permanente (P)</option>
                  </select>
                </td>
                {!esPadre && <td className="val" style={{ textAlign: 'center' }}><button type="button" className="btn sec sm" onClick={() => delAct(i)}>×</button></td>}
              </tr>
            ))}
            {actRows.length === 0 && <tr><td className="val" colSpan={esPadre ? 3 : 4} style={{ color: 'var(--gris-500)', padding: 8 }}>Sin actividades registradas.</td></tr>}
          </tbody>
        </table>
        {!esPadre && <button type="button" className="btn sec sm" style={{ marginBottom: 10 }} onClick={addAct}>+ Agregar actividad</button>}
        <div className="fila">
          <div className="campo">
            <label>Firma de la familia / acudiente</label>
            {acta.firma_familia_img
              ? <img src={acta.firma_familia_img} alt="firma" style={{ height: 50, border: '1px solid var(--gris-200)', borderRadius: 6, background: '#fff' }} />
              : <div style={{ fontSize: 13, color: 'var(--gris-500)' }}>Sin firma registrada</div>}
            {esPadre && <input type="file" accept="image/*" style={{ marginTop: 6 }}
              onChange={(e) => subirFirma('firma_familia_img', e.target.files[0])} />}
            <label style={{ fontWeight: 400, marginTop: 6 }}>
              <input type="checkbox" checked={!!acta.firmada_familia} style={{ width: 'auto', marginRight: 6 }}
                onChange={(e) => setActa({ ...acta, firmada_familia: e.target.checked })} />
              Firmada por la familia
            </label>
          </div>
          {!esPadre && (
            <div className="campo">
              <label>Firma de la institución</label>
              {acta.firma_institucion_img
                ? <img src={acta.firma_institucion_img} alt="firma" style={{ height: 50, border: '1px solid var(--gris-200)', borderRadius: 6, background: '#fff' }} />
                : <div style={{ fontSize: 13, color: 'var(--gris-500)' }}>Sin firma registrada</div>}
              <input type="file" accept="image/*" style={{ marginTop: 6 }}
                onChange={(e) => subirFirma('firma_institucion_img', e.target.files[0])} />
              <label style={{ fontWeight: 400, marginTop: 6 }}>
                <input type="checkbox" checked={!!acta.firmada_institucion} style={{ width: 'auto', marginRight: 6 }}
                  onChange={(e) => setActa({ ...acta, firmada_institucion: e.target.checked })} />
                Firmada por la institución
              </label>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {esPadre ? <button className="btn" type="submit">Firmar acta</button> : <Guardado estado={guardadoActa} />}
          <button type="button" className="btn sec" onClick={() => api.descargarPdf(`/informes/acta/${id}/pdf${pp}`, 'Acta.pdf')}>Descargar acta ↓</button>
        </div>
      </form>
      )}

      {vista === 'anexo4' && (
      <form className="card" onSubmit={(e) => { e.preventDefault(); guardarAnexo4(); }} onBlur={() => editable && autosaveA4()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <h2 style={{ margin: 0 }}>Anexo 4 · Seguimiento, entrega y transición</h2>
          <button type="button" className="btn sec sm" onClick={() => api.descargarPdf(`/informes/anexo4/${id}/pdf`, 'Anexo4.pdf')}>Descargar ↓</button>
        </div>
        <p style={{ color: 'var(--gris-600)', fontSize: 13 }}>Cierre del año: logros, recomendaciones para el año siguiente y datos de transición.</p>
        <div className="campo"><label>Logros y avances del estudiante durante el año</label>
          <textarea value={anexo4.logros || ''} disabled={!editable} onChange={(e) => setAnexo4({ ...anexo4, logros: e.target.value })} /></div>
        <div className="campo"><label>Ajustes que funcionaron y recomendaciones para el año siguiente</label>
          <textarea value={anexo4.recomendaciones || ''} disabled={!editable} onChange={(e) => setAnexo4({ ...anexo4, recomendaciones: e.target.value })} /></div>
        <div className="fila">
          <div className="campo"><label>Grado al que transita</label>
            <input value={anexo4.grado_destino || ''} disabled={!editable} onChange={(e) => setAnexo4({ ...anexo4, grado_destino: e.target.value })} /></div>
          <div className="campo"><label>Institución destino (si cambia)</label>
            <input value={anexo4.institucion_destino || ''} disabled={!editable} onChange={(e) => setAnexo4({ ...anexo4, institucion_destino: e.target.value })} /></div>
        </div>
        <div className="campo"><label>Apoyos requeridos para la transición</label>
          <textarea value={anexo4.apoyos_transicion || ''} disabled={!editable} onChange={(e) => setAnexo4({ ...anexo4, apoyos_transicion: e.target.value })} /></div>
        <div className="campo"><label>Observaciones</label>
          <textarea value={anexo4.observaciones || ''} disabled={!editable} onChange={(e) => setAnexo4({ ...anexo4, observaciones: e.target.value })} /></div>
        <div className="fila">
          <div className="campo">
            <label>Firma de quien entrega (docente / orientación)</label>
            {anexo4.firma_entrega_img
              ? <img src={anexo4.firma_entrega_img} alt="firma" style={{ height: 46, border: '1px solid var(--gris-200)', borderRadius: 6, background: '#fff' }} />
              : <div style={{ fontSize: 13, color: 'var(--gris-500)' }}>Sin firma</div>}
            {editable && <input type="file" accept="image/*" style={{ marginTop: 6 }} onChange={(e) => subirFirmaA4('firma_entrega_img', e.target.files[0])} />}
          </div>
          <div className="campo">
            <label>Firma de quien recibe (familia / docente siguiente)</label>
            {anexo4.firma_recibe_img
              ? <img src={anexo4.firma_recibe_img} alt="firma" style={{ height: 46, border: '1px solid var(--gris-200)', borderRadius: 6, background: '#fff' }} />
              : <div style={{ fontSize: 13, color: 'var(--gris-500)' }}>Sin firma</div>}
            {editable && <input type="file" accept="image/*" style={{ marginTop: 6 }} onChange={(e) => subirFirmaA4('firma_recibe_img', e.target.files[0])} />}
          </div>
        </div>
        <label style={{ fontWeight: 400, display: 'block', margin: '6px 0' }}>
          <input type="checkbox" checked={!!anexo4.firmada_entrega} style={{ width: 'auto', marginRight: 6 }} disabled={!editable}
            onChange={(e) => setAnexo4({ ...anexo4, firmada_entrega: e.target.checked })} />
          Entrega formalizada
        </label>
        {editable && <Guardado estado={guardadoA4} />}
      </form>
      )}

      {vista === 'anexo4' && (
      <form className="card" onSubmit={guardarPromocion}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <h2 style={{ margin: 0 }}>Promoción, egreso y titulación</h2>
          <button type="button" className="btn sec sm" onClick={() => api.descargarPdf(`/informes/promocion/${id}/pdf`, 'Acta_promocion.pdf')}>Acta de promoción ↓</button>
        </div>
        <p style={{ color: 'var(--gris-600)', fontSize: 13 }}>Decisión de fin de año con criterios flexibles (Decreto 1421).</p>
        <div className="fila">
          <div className="campo"><label>Decisión</label>
            <select value={promocion.decision || ''} disabled={!editable} onChange={(e) => setPromocion({ ...promocion, decision: e.target.value })}>
              <option value="">— Elegir —</option>
              <option value="promovido">Promovido</option>
              <option value="no_promovido">No promovido</option>
              <option value="promocion_anticipada">Promoción anticipada</option>
              <option value="egresado">Egresado</option>
              <option value="titulado">Titulado (bachiller)</option>
            </select></div>
          <div className="campo"><label>Grado cursado</label>
            <input value={promocion.grado_cursado || ''} disabled={!editable} onChange={(e) => setPromocion({ ...promocion, grado_cursado: e.target.value })} /></div>
          <div className="campo"><label>Grado al que se promueve</label>
            <input value={promocion.grado_siguiente || ''} disabled={!editable} onChange={(e) => setPromocion({ ...promocion, grado_siguiente: e.target.value })} /></div>
        </div>
        <div className="campo"><label>Criterios de promoción (flexibles)</label>
          <textarea value={promocion.criterios || ''} disabled={!editable} onChange={(e) => setPromocion({ ...promocion, criterios: e.target.value })} /></div>
        <div className="campo"><label>Observaciones</label>
          <textarea value={promocion.observaciones || ''} disabled={!editable} onChange={(e) => setPromocion({ ...promocion, observaciones: e.target.value })} /></div>
        {editable && <button className="btn">Guardar promoción</button>}
      </form>
      )}

      {supervisa && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Control de cambios</h2>
          <p style={{ color: 'var(--gris-600)', fontSize: 13, marginTop: 0 }}>Quién registró o modificó cada formato, y cuándo.</p>
          <table>
            <thead><tr><th>Fecha y hora</th><th>Quién</th><th>Acción</th><th>Qué</th></tr></thead>
            <tbody>
              {bitacora.map((b) => (
                <tr key={b.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{new Date(b.creado_en).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td>{b.nombre_actual || 'Usuario'}<br /><span className="badge gris" style={{ fontSize: 10 }}>{ROLES_LABEL[b.usuario_rol] || b.usuario_rol || '—'}</span></td>
                  <td><span className={`badge ${BADGE_ACCION[b.accion] || 'gris'}`}>{b.accion}</span></td>
                  <td style={{ fontSize: 13 }}>{b.descripcion}</td>
                </tr>
              ))}
              {bitacora.length === 0 && <tr><td colSpan="4" style={{ color: 'var(--gris-500)' }}>Sin movimientos registrados todavía.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
