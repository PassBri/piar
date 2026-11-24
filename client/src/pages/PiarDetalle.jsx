import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const TIPOS = [
  ['actividades', 'Actividades'], ['materiales', 'Materiales'], ['espacios', 'Espacios'],
  ['comunicacion', 'Comunicación'], ['apoyos_humanos', 'Apoyos humanos'], ['tecnologias', 'Tecnologías'],
];
const INTENSIDADES = ['generalizado', 'extenso', 'limitado', 'intermitente'];
const DESEMPENOS = ['', 'Superior', 'Alto', 'Básico', 'Bajo'];

const nombrePeriodo = (p) => (p === 5 ? 'Promoción' : `Periodo ${p}`);
const ROLES_LABEL = {
  superadmin: 'Administrador general', rector: 'Rector', coordinador: 'Coordinador',
  psicoorientador: 'Psicoorientador', docente: 'Docente', padre: 'Padre de familia', administrador: 'Administrador',
};
const BADGE_ACCION = { crear: 'ok', editar: 'gris', eliminar: 'error', firmar: 'morado' };

function Barra({ etiqueta, valor }) {
  const color = valor >= 80 ? '#2e7d32' : valor >= 40 ? '#f9a825' : '#c62828';
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
        <span>{etiqueta}</span><b>{valor}%</b>
      </div>
      <div style={{ background: 'var(--gris-200)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
        <div style={{ width: `${valor}%`, height: '100%', background: color, transition: 'width .3s' }} />
      </div>
    </div>
  );
}

export default function PiarDetalle() {
  const { id } = useParams();
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
  const [error, setError] = useState('');
  const ajusteVacio = { area_id: '', periodo: 1, objetivo: '', barrera: '', tipo: 'actividades', descripcion: '', apoyo: '', intensidad: 'intermitente', evaluacion: '' };
  const [nuevo, setNuevo] = useState(ajusteVacio);
  const [nuevaArea, setNuevaArea] = useState('');
  const [periodoActivo, setPeriodoActivo] = useState(1); // 1..5, o 0 = todos
  const [bitacora, setBitacora] = useState([]);
  const [vista, setVista] = useState('anexo2'); // anexo2 | anexo3 | anexo4
  const a4vacio = { logros: '', recomendaciones: '', grado_destino: '', institucion_destino: '', apoyos_transicion: '', observaciones: '', firmada_entrega: false };
  const [anexo4, setAnexo4] = useState(a4vacio);
  const supervisa = ['rector', 'coordinador', 'psicoorientador', 'administrador', 'superadmin'].includes(usuario.rol);

  const numPeriodos = piar?.num_periodos || 4;
  const usaPromocion = piar?.usa_promocion ?? true;
  const periodosBase = Array.from({ length: numPeriodos }, (_, i) => i + 1);
  const periodosDisponibles = usaPromocion ? [...periodosBase, 5] : periodosBase;

  async function cargar() {
    try {
      const p = await api.get(`/piar/${id}`);
      setPiar(p);
      setActa(p.acta || { compromisos_familia: '', compromisos_institucion: '', firmada_familia: false, firmada_institucion: false });
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
  }
  async function guardarAnexo4(e) {
    e.preventDefault();
    try { await api.put(`/anexo4/${id}`, anexo4); cargar(); cargarBitacora(); } catch (err) { setError(err.message); }
  }
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
  async function guardarActa(e) {
    e.preventDefault();
    try { await api.put(`/actas/${id}`, acta); cargar(); } catch (err) { setError(err.message); }
  }
  function valorDe(area_id, periodo) {
    const v = valoraciones.find((x) => x.area_id === area_id && x.periodo === periodo);
    return v ? v.desempeno || '' : '';
  }
  async function guardarValoracion(area_id, periodo, desempeno) {
    await api.put('/valoraciones', { piar_id: Number(id), area_id, periodo, desempeno });
    cargarValoraciones();
  }
  async function guardarCabecera(e) {
    e.preventDefault();
    await api.put(`/piar/${id}`, {
      periodo: piar.periodo, valoracion: piar.valoracion,
      aspectos_generales: piar.aspectos_generales, estado: piar.estado,
      pmi: piar.pmi, grado: piar.grado, director_grupo: piar.director_grupo,
      fecha_elaboracion: piar.fecha_elaboracion,
    });
    cargar();
  }
  async function guardarPeriodos(n, promo) {
    try {
      await api.put(`/geografia/instituciones/${piar.institucion_id}/periodos`, { num_periodos: n, usa_promocion: promo });
      cargar();
    } catch (err) { setError(err.message); }
  }
  async function agregarAjuste(e) {
    e.preventDefault();
    try {
      const periodo = periodoActivo === 0 ? nuevo.periodo : periodoActivo;
      await api.post('/ajustes', { piar_id: Number(id), ...nuevo, periodo, area_id: nuevo.area_id || null });
      setNuevo(ajusteVacio);
      cargar();
    } catch (err) { setError(err.message); }
  }
  async function agregarArea() {
    if (!nuevaArea.trim()) return;
    try {
      const a = await api.post('/areas', { nombre: nuevaArea.trim() });
      setNuevaArea('');
      const lista = await api.get('/areas'); setAreas(lista);
      setNuevo((n) => ({ ...n, area_id: a.id }));
    } catch (err) { setError(err.message); }
  }
  async function eliminarAjuste(aid) { await api.del(`/ajustes/${aid}`); cargar(); }

  if (!piar) return <div>{error || 'Cargando…'}</div>;

  const av = piar.avance || { anexo1: 0, anexo2: 0, anexo3: 0, total: 0 };
  const ajustesVisibles = piar.ajustes.filter((a) => periodoActivo === 0 || a.periodo === periodoActivo);
  const sufijoPdf = periodoActivo === 0 ? 'all' : periodoActivo;
  const nombrePdf = periodoActivo === 0 ? 'Anexo2_todos' : (periodoActivo === 5 ? 'Anexo2_promocion' : `Anexo2_P${periodoActivo}`);

  return (
    <div>
      <Link to={`/estudiantes/${piar.estudiante_id}`} className="btn sec sm">← Volver al estudiante</Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0', flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ color: 'var(--gris-700)', margin: 0 }}>PIAR — {piar.estudiante_nombre} ({piar.periodo})</h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className="btn sec sm" onClick={() => api.abrirPdf(`/informes/competencias/${id}/pdf`)}>Informe anual</button>
          <button className="btn sec sm" title="Descargar informe anual de competencias" onClick={() => api.descargarPdf(`/informes/competencias/${id}/pdf`, 'Informe_anual_competencias.pdf')}>↓</button>
          <button className="btn sec sm" onClick={() => api.abrirPdf(`/informes/seguimiento/${id}/pdf`)}>Seguimiento</button>
          <button className="btn sec sm" title="Descargar seguimiento" onClick={() => api.descargarPdf(`/informes/seguimiento/${id}/pdf`, 'Seguimiento.pdf')}>↓</button>
          <button className="btn sec sm" onClick={() => api.abrirPdf(`/informes/acta/${id}/pdf`)}>Acta</button>
          <button className="btn sec sm" title="Descargar acta" onClick={() => api.descargarPdf(`/informes/acta/${id}/pdf`, 'Acta.pdf')}>↓</button>
        </div>
      </div>
      {error && <div className="mensaje-error">{error}</div>}

      <div className="anexos-tabs">
        <Link to={`/estudiantes/${piar.estudiante_id}`}>Anexo 1 · Información</Link>
        <button type="button" className={vista === 'anexo2' ? 'activo' : ''} onClick={() => setVista('anexo2')}>Anexo 2 · Valoración y ajustes</button>
        <button type="button" className={vista === 'anexo3' ? 'activo' : ''} onClick={() => setVista('anexo3')}>Anexo 3 · Acta de acuerdo</button>
        <button type="button" className={vista === 'anexo4' ? 'activo' : ''} onClick={() => setVista('anexo4')}>Anexo 4 · Seguimiento y transición</button>
      </div>

      {/* Mecanismo de control: avance de diligenciamiento por anexo */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h2 style={{ margin: 0 }}>Avance de diligenciamiento</h2>
          <span className="badge gris" style={{ fontSize: 14 }}>Total {av.total}%</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <Barra etiqueta="Anexo 1 · Información" valor={av.anexo1} />
          <Barra etiqueta="Anexo 2 · Valoración y ajustes" valor={av.anexo2} />
          <Barra etiqueta="Anexo 3 · Acta de acuerdo" valor={av.anexo3} />
        </div>
      </div>

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
        <form onSubmit={guardarCabecera}>
          <table className="ftabla">
            <tbody>
              <tr><td className="banda" colSpan={2}>Datos del estudiante y elaboración</td></tr>
              <tr><td className="lbl">Estudiante</td><td className="val"><input value={piar.estudiante_nombre} disabled /></td></tr>
              <tr><td className="lbl">Grado (de este año)</td>
                <td className="val"><input value={piar.grado || ''} onChange={(e) => setPiar({ ...piar, grado: e.target.value })} disabled={!editable} placeholder="Grado que cursa este año" /></td></tr>
              <tr><td className="lbl">Año / Periodo</td><td className="val"><input value={piar.periodo || ''} disabled /></td></tr>
              <tr><td className="lbl">Director(a) de grupo</td>
                <td className="val"><input value={piar.director_grupo || ''} onChange={(e) => setPiar({ ...piar, director_grupo: e.target.value })} disabled={!editable} placeholder="Nombre del director de grupo" /></td></tr>
              <tr><td className="lbl">Fecha de elaboración</td>
                <td className="val"><input type="date" value={piar.fecha_elaboracion ? piar.fecha_elaboracion.slice(0, 10) : ''} onChange={(e) => setPiar({ ...piar, fecha_elaboracion: e.target.value })} disabled={!editable} /></td></tr>
              <tr><td className="banda" colSpan={2}>1. Características del estudiante</td></tr>
              <tr><td className="lbl">Síntesis de la valoración pedagógica</td>
                <td className="val"><textarea value={piar.valoracion || ''} onChange={(e) => setPiar({ ...piar, valoracion: e.target.value })} disabled={!editable} /></td></tr>
              <tr><td className="lbl">Aspectos generales (gustos, habilidades, apoyos que requiere)</td>
                <td className="val"><textarea value={piar.aspectos_generales || ''} onChange={(e) => setPiar({ ...piar, aspectos_generales: e.target.value })} disabled={!editable} /></td></tr>
              <tr><td className="lbl">Estado del PIAR</td>
                <td className="val">
                  <select value={piar.estado} onChange={(e) => setPiar({ ...piar, estado: e.target.value })} disabled={!editable}>
                    <option value="borrador">Borrador</option><option value="vigente">Vigente</option><option value="cerrado">Cerrado</option>
                  </select></td></tr>
              <tr><td className="banda" colSpan={2}>7. Recomendaciones para el Plan de Mejoramiento Institucional (PMI)</td></tr>
              <tr><td className="lbl">Acciones para eliminar las barreras a nivel institucional</td>
                <td className="val"><textarea value={piar.pmi || ''} onChange={(e) => setPiar({ ...piar, pmi: e.target.value })} disabled={!editable} placeholder="Recomendaciones de infraestructura, formación, recursos, etc. para eliminar las barreras detectadas" /></td></tr>
            </tbody>
          </table>
          {editable && <div style={{ padding: 10 }}><button className="btn">Guardar valoración</button></div>}
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
          <button className="btn sec sm" onClick={() => api.abrirPdf(`/informes/piar/${id}/pdf?periodo=${sufijoPdf}`)}>
            Imprimir {periodoActivo === 0 ? 'todos los periodos' : nombrePeriodo(periodoActivo)}
          </button>
          <button className="btn sec sm" title="Descargar" onClick={() => api.descargarPdf(`/informes/piar/${id}/pdf?periodo=${sufijoPdf}`, `${nombrePdf}.pdf`)}>↓</button>
        </div>

        {/* Valoración por área */}
        <h3 style={{ marginBottom: 6 }}>Valoración por área {periodoActivo === 0 ? '(todos los periodos)' : `· ${nombrePeriodo(periodoActivo)}`}</h3>
        <table className="ftabla" style={{ marginBottom: 16 }}>
          <thead>
            {periodoActivo === 0
              ? <tr><th>Área</th>{periodosDisponibles.map((p) => <th key={p}>{nombrePeriodo(p)}</th>)}</tr>
              : <tr><th>Área</th><th style={{ width: '30%' }}>Desempeño</th></tr>}
          </thead>
          <tbody>
            {areas.map((a) => (
              <tr key={a.id}>
                <td className="lbl">{a.nombre}</td>
                {(periodoActivo === 0 ? periodosDisponibles : [periodoActivo]).map((p) => (
                  <td className="val" key={p}>
                    <select value={valorDe(a.id, p)} disabled={!editable} onChange={(e) => guardarValoracion(a.id, p, e.target.value)}>
                      {DESEMPENOS.map((d) => <option key={d} value={d}>{d || '—'}</option>)}
                    </select>
                  </td>
                ))}
              </tr>
            ))}
            {areas.length === 0 && <tr><td className="val" colSpan={periodoActivo === 0 ? periodosDisponibles.length + 1 : 2} style={{ color: 'var(--gris-500)', padding: 8 }}>No hay áreas configuradas.</td></tr>}
          </tbody>
        </table>

        {/* Barreras y ajustes razonables del periodo */}
        <h3 style={{ marginBottom: 6 }}>Barreras y ajustes razonables {periodoActivo === 0 ? '(todos)' : `· ${nombrePeriodo(periodoActivo)}`}</h3>
        <table className="ftabla">
          <thead>
            <tr>
              {periodoActivo === 0 && <th style={{ width: '7%' }}>Per.</th>}
              <th style={{ width: '15%' }}>Área</th><th>Objetivo / propósito</th><th>Barrera</th><th>Ajuste razonable</th><th>Evaluación</th>{editable && <th style={{ width: '8%' }}></th>}
            </tr>
          </thead>
          <tbody>
            {ajustesVisibles.map((a) => (
              <tr key={a.id} style={a.retirado ? { opacity: 0.5 } : null}>
                {periodoActivo === 0 && <td className="lbl" style={{ textAlign: 'center' }}>{nombrePeriodo(a.periodo)}</td>}
                <td className="val" style={{ padding: '5px 7px' }}>{a.area_nombre || '—'}</td>
                <td className="val" style={{ padding: '5px 7px' }}>{a.objetivo || '—'}</td>
                <td className="val" style={{ padding: '5px 7px' }}>{a.barrera}</td>
                <td className="val" style={{ padding: '5px 7px' }}>{a.descripcion}</td>
                <td className="val" style={{ padding: '5px 7px' }}>{a.evaluacion || '—'}</td>
                {editable && <td className="val" style={{ textAlign: 'center' }}><button className="btn sec sm" onClick={() => eliminarAjuste(a.id)}>×</button></td>}
              </tr>
            ))}
            {ajustesVisibles.length === 0 && <tr><td className="val" colSpan={periodoActivo === 0 ? 7 : 6} style={{ color: 'var(--gris-500)', padding: 8 }}>Sin ajustes en esta selección.</td></tr>}
          </tbody>
        </table>
      </div>

      {editable && (
        <form className="card" onSubmit={agregarAjuste}>
          <h2>Agregar ajuste razonable {periodoActivo !== 0 && `· ${nombrePeriodo(periodoActivo)}`}</h2>
          <div className="fila">
            {periodoActivo === 0 && (
              <div className="campo"><label>Periodo</label>
                <select value={nuevo.periodo} onChange={(e) => setNuevo({ ...nuevo, periodo: Number(e.target.value) })}>
                  {periodosDisponibles.map((p) => <option key={p} value={p}>{nombrePeriodo(p)}</option>)}
                </select></div>
            )}
            <div className="campo"><label>Área / asignatura</label>
              <select value={nuevo.area_id} onChange={(e) => setNuevo({ ...nuevo, area_id: e.target.value })}>
                <option value="">— Área —</option>
                {areas.map((ar) => <option key={ar.id} value={ar.id}>{ar.nombre}</option>)}
              </select></div>
            <div className="campo"><label>Tipo de ajuste</label>
              <select value={nuevo.tipo} onChange={(e) => setNuevo({ ...nuevo, tipo: e.target.value })}>
                {TIPOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select></div>
            <div className="campo"><label>Intensidad del apoyo</label>
              <select value={nuevo.intensidad} onChange={(e) => setNuevo({ ...nuevo, intensidad: e.target.value })}>
                {INTENSIDADES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select></div>
          </div>
          {puedeCrearArea ? (
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', marginBottom: 10 }}>
              <div className="campo" style={{ flex: 1, marginBottom: 0 }}>
                <label>¿Falta una asignatura? Agrégala (coordinador / psicoorientador)</label>
                <input value={nuevaArea} onChange={(e) => setNuevaArea(e.target.value)} placeholder="Nombre de la asignatura" />
              </div>
              <button type="button" className="btn sec" onClick={agregarArea}>+ Agregar asignatura</button>
            </div>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--gris-500)', marginBottom: 10 }}>
              Escoge el área de la lista. Si falta una asignatura, el coordinador o el psicoorientador debe agregarla.
            </p>
          )}
          <div className="campo"><label>Objetivo / propósito (según EBC y DBA)</label>
            <textarea value={nuevo.objetivo} onChange={(e) => setNuevo({ ...nuevo, objetivo: e.target.value })} /></div>
          <div className="campo"><label>Barrera para el aprendizaje, el desarrollo o la participación</label>
            <textarea value={nuevo.barrera} onChange={(e) => setNuevo({ ...nuevo, barrera: e.target.value })} required /></div>
          <div className="campo"><label>Ajuste razonable (apoyos / estrategias)</label>
            <textarea value={nuevo.descripcion} onChange={(e) => setNuevo({ ...nuevo, descripcion: e.target.value })} required /></div>
          <div className="campo"><label>Evaluación de los ajustes (observaciones)</label>
            <textarea value={nuevo.evaluacion} onChange={(e) => setNuevo({ ...nuevo, evaluacion: e.target.value })} /></div>
          {catalogo.length > 0 && (
            <div className="campo">
              <label>Sugerencias del catálogo (MEN) — clic para usar</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {catalogo.map((c) => (
                  <button type="button" key={c.id} className="btn sec sm" onClick={() => setNuevo({ ...nuevo, descripcion: c.descripcion })}>{c.descripcion}</button>
                ))}
              </div>
            </div>
          )}
          <div className="campo"><label>Apoyo requerido</label>
            <input value={nuevo.apoyo} onChange={(e) => setNuevo({ ...nuevo, apoyo: e.target.value })} /></div>
          <button className="btn">Agregar ajuste</button>
        </form>
      )}
      </>}

      {vista === 'anexo3' && (
      <form className="card" id="anexo3" onSubmit={guardarActa}>
        <h2>Acta de acuerdo con la familia (Anexo 3)</h2>
        <div className="campo"><label>Compromisos de la familia</label>
          <textarea value={acta.compromisos_familia || ''} disabled={esPadre}
            onChange={(e) => setActa({ ...acta, compromisos_familia: e.target.value })} /></div>
        <div className="campo"><label>Compromisos de la institución</label>
          <textarea value={acta.compromisos_institucion || ''} disabled={esPadre}
            onChange={(e) => setActa({ ...acta, compromisos_institucion: e.target.value })} /></div>
        <div className="campo"><label>En casa, la familia apoyará con las siguientes actividades</label>
          <textarea value={acta.actividades_casa || ''} disabled={esPadre}
            onChange={(e) => setActa({ ...acta, actividades_casa: e.target.value })} placeholder="Actividades de apoyo en casa, incluidos los recesos escolares" /></div>
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
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn">{esPadre ? 'Firmar acta' : 'Guardar acta'}</button>
          <button type="button" className="btn sec" onClick={() => api.descargarPdf(`/informes/acta/${id}/pdf`, 'Acta.pdf')}>Descargar acta ↓</button>
        </div>
      </form>
      )}

      {vista === 'anexo4' && (
      <form className="card" onSubmit={guardarAnexo4}>
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
        {editable && <button className="btn">Guardar Anexo 4</button>}
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
