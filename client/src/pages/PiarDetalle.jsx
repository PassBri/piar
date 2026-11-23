import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const TIPOS = [
  ['actividades', 'Actividades'], ['materiales', 'Materiales'], ['espacios', 'Espacios'],
  ['comunicacion', 'Comunicación'], ['apoyos_humanos', 'Apoyos humanos'], ['tecnologias', 'Tecnologías'],
];
const INTENSIDADES = ['generalizado', 'extenso', 'limitado', 'intermitente'];

export default function PiarDetalle() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const editable = ['docente', 'psicoorientador', 'administrador'].includes(usuario.rol);
  const [piar, setPiar] = useState(null);
  const [areas, setAreas] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [valoraciones, setValoraciones] = useState([]);
  const [acta, setActa] = useState({ compromisos_familia: '', compromisos_institucion: '', firmada_familia: false, firmada_institucion: false });
  const esPadre = usuario.rol === 'padre';
  const [error, setError] = useState('');
  const [nuevo, setNuevo] = useState({ area_id: '', barrera: '', tipo: 'actividades', descripcion: '', apoyo: '', intensidad: 'intermitente' });

  const PERIODOS = [1, 2, 3, 4];
  const DESEMPENOS = ['', 'Superior', 'Alto', 'Básico', 'Bajo'];

  async function cargar() {
    try {
      const p = await api.get(`/piar/${id}`);
      setPiar(p);
      setActa(p.acta || { compromisos_familia: '', compromisos_institucion: '', firmada_familia: false, firmada_institucion: false });
    } catch (e) { setError(e.message); }
  }

  function subirFirma(campo, file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setActa((a) => ({ ...a, [campo]: reader.result }));
    reader.readAsDataURL(file);
  }

  async function guardarActa(e) {
    e.preventDefault();
    try {
      await api.put(`/actas/${id}`, acta);
      cargar();
    } catch (err) { setError(err.message); }
  }
  function cargarValoraciones() {
    api.get(`/valoraciones?piar_id=${id}`).then(setValoraciones).catch(() => {});
  }
  useEffect(() => {
    cargar();
    cargarValoraciones();
    api.get('/areas').then(setAreas).catch(() => {});
  }, [id]);

  function valorDe(area_id, periodo) {
    const v = valoraciones.find((x) => x.area_id === area_id && x.periodo === periodo);
    return v ? v.desempeno || '' : '';
  }
  async function guardarValoracion(area_id, periodo, desempeno) {
    await api.put('/valoraciones', { piar_id: Number(id), area_id, periodo, desempeno });
    cargarValoraciones();
  }

  useEffect(() => {
    api.get(`/catalogo?tipo=${nuevo.tipo}`).then(setCatalogo).catch(() => {});
  }, [nuevo.tipo]);

  async function guardarCabecera(e) {
    e.preventDefault();
    await api.put(`/piar/${id}`, {
      periodo: piar.periodo, valoracion: piar.valoracion,
      aspectos_generales: piar.aspectos_generales, estado: piar.estado,
    });
    cargar();
  }

  async function agregarAjuste(e) {
    e.preventDefault();
    try {
      await api.post('/ajustes', { piar_id: Number(id), ...nuevo, area_id: nuevo.area_id || null });
      setNuevo({ area_id: '', barrera: '', tipo: 'actividades', descripcion: '', apoyo: '', intensidad: 'intermitente' });
      cargar();
    } catch (err) { setError(err.message); }
  }

  async function eliminarAjuste(aid) {
    await api.del(`/ajustes/${aid}`);
    cargar();
  }

  if (!piar) return <div>{error || 'Cargando…'}</div>;

  return (
    <div>
      <Link to={`/estudiantes/${piar.estudiante_id}`} className="btn sec sm">← Volver al estudiante</Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0' }}>
        <h2 style={{ color: 'var(--gris-700)', margin: 0 }}>
          PIAR — {piar.estudiante_nombre} ({piar.periodo})
        </h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className="btn sec sm" onClick={() => api.abrirPdf(`/informes/piar/${id}/pdf`)}>Anexo 2</button>
          <button className="btn sec sm" title="Descargar Anexo 2" onClick={() => api.descargarPdf(`/informes/piar/${id}/pdf`, 'Anexo2.pdf')}>↓</button>
          <button className="btn sec sm" onClick={() => api.abrirPdf(`/informes/seguimiento/${id}/pdf`)}>Seguimiento</button>
          <button className="btn sec sm" title="Descargar seguimiento" onClick={() => api.descargarPdf(`/informes/seguimiento/${id}/pdf`, 'Seguimiento.pdf')}>↓</button>
          <button className="btn sec sm" onClick={() => api.abrirPdf(`/informes/acta/${id}/pdf`)}>Acta</button>
          <button className="btn sec sm" title="Descargar acta" onClick={() => api.descargarPdf(`/informes/acta/${id}/pdf`, 'Acta.pdf')}>↓</button>
        </div>
      </div>
      {error && <div className="mensaje-error">{error}</div>}

      <form className="card" onSubmit={guardarCabecera}>
        <h2>Valoración pedagógica (Anexo 2)</h2>
        <div className="campo"><label>Síntesis de la valoración</label>
          <textarea value={piar.valoracion || ''} onChange={(e) => setPiar({ ...piar, valoracion: e.target.value })} disabled={!editable} /></div>
        <div className="campo"><label>Aspectos generales (gustos, habilidades, apoyos que requiere)</label>
          <textarea value={piar.aspectos_generales || ''} onChange={(e) => setPiar({ ...piar, aspectos_generales: e.target.value })} disabled={!editable} /></div>
        <div className="fila">
          <div className="campo"><label>Estado</label>
            <select value={piar.estado} onChange={(e) => setPiar({ ...piar, estado: e.target.value })} disabled={!editable}>
              <option value="borrador">Borrador</option><option value="vigente">Vigente</option><option value="cerrado">Cerrado</option>
            </select></div>
        </div>
        {editable && <button className="btn">Guardar valoración</button>}
      </form>

      <div className="card">
        <h2>Valoración por área y periodo (plan de estudios)</h2>
        <p style={{ fontSize: 13, color: 'var(--gris-600)', marginTop: 0 }}>
          Desempeño del estudiante en cada área, por periodo académico. Se guarda al seleccionar.
        </p>
        <table>
          <thead>
            <tr><th>Área</th>{PERIODOS.map((p) => <th key={p}>Periodo {p}</th>)}</tr>
          </thead>
          <tbody>
            {areas.map((a) => (
              <tr key={a.id}>
                <td>{a.nombre}</td>
                {PERIODOS.map((p) => (
                  <td key={p}>
                    <select value={valorDe(a.id, p)} disabled={!editable}
                      onChange={(e) => guardarValoracion(a.id, p, e.target.value)}>
                      {DESEMPENOS.map((d) => <option key={d} value={d}>{d || '—'}</option>)}
                    </select>
                  </td>
                ))}
              </tr>
            ))}
            {areas.length === 0 && <tr><td colSpan={5} style={{ color: 'var(--gris-500)' }}>No hay áreas configuradas en la institución.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Barreras y ajustes razonables</h2>
        <table>
          <thead><tr><th>Área</th><th>Barrera</th><th>Tipo</th><th>Ajuste</th><th>Intensidad</th>{editable && <th></th>}</tr></thead>
          <tbody>
            {piar.ajustes.map((a) => (
              <tr key={a.id} style={a.retirado ? { opacity: 0.5 } : null}>
                <td>{a.area_nombre || '—'}</td>
                <td>{a.barrera}</td>
                <td>{a.tipo}</td>
                <td>{a.descripcion}</td>
                <td>{a.intensidad}</td>
                {editable && <td><button className="btn sec sm" onClick={() => eliminarAjuste(a.id)}>Eliminar</button></td>}
              </tr>
            ))}
            {piar.ajustes.length === 0 && <tr><td colSpan="6" style={{ color: 'var(--gris-500)' }}>Sin ajustes. Agrega al menos uno por barrera.</td></tr>}
          </tbody>
        </table>
      </div>

      {editable && (
        <form className="card" onSubmit={agregarAjuste}>
          <h2>Agregar ajuste razonable</h2>
          <div className="fila">
            <div className="campo"><label>Área</label>
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
          <div className="campo"><label>Barrera para el aprendizaje, el desarrollo o la participación</label>
            <textarea value={nuevo.barrera} onChange={(e) => setNuevo({ ...nuevo, barrera: e.target.value })} required /></div>
          <div className="campo"><label>Ajuste razonable</label>
            <textarea value={nuevo.descripcion} onChange={(e) => setNuevo({ ...nuevo, descripcion: e.target.value })} required /></div>
          {catalogo.length > 0 && (
            <div className="campo">
              <label>Sugerencias del catálogo (MEN) — clic para usar</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {catalogo.map((c) => (
                  <button type="button" key={c.id} className="btn sec sm"
                    onClick={() => setNuevo({ ...nuevo, descripcion: c.descripcion })}>{c.descripcion}</button>
                ))}
              </div>
            </div>
          )}
          <div className="campo"><label>Apoyo requerido</label>
            <input value={nuevo.apoyo} onChange={(e) => setNuevo({ ...nuevo, apoyo: e.target.value })} /></div>
          <button className="btn">Agregar ajuste</button>
        </form>
      )}

      <form className="card" onSubmit={guardarActa}>
        <h2>Acta de acuerdo con la familia (Anexo 3)</h2>
        <div className="campo"><label>Compromisos de la familia</label>
          <textarea value={acta.compromisos_familia || ''} disabled={esPadre}
            onChange={(e) => setActa({ ...acta, compromisos_familia: e.target.value })} /></div>
        <div className="campo"><label>Compromisos de la institución</label>
          <textarea value={acta.compromisos_institucion || ''} disabled={esPadre}
            onChange={(e) => setActa({ ...acta, compromisos_institucion: e.target.value })} /></div>
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
    </div>
  );
}
