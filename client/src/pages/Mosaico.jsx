import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Mosaico() {
  const { usuario } = useAuth();
  const esSuper = usuario.rol === 'superadmin';
  const [instituciones, setInstituciones] = useState([]);
  const [inst, setInst] = useState('');
  const [cursos, setCursos] = useState([]);
  const [sede, setSede] = useState('');
  const [cursoId, setCursoId] = useState('');
  const [datos, setDatos] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (esSuper) api.get('/geografia/instituciones').then(setInstituciones).catch(() => {});
  }, [esSuper]);

  // cursos disponibles para los filtros
  useEffect(() => {
    const q = esSuper ? (inst ? `?institucion_id=${inst}` : null) : '';
    if (q === null) { setCursos([]); return; }
    api.get(`/cursos${q}`).then(setCursos).catch(() => {});
  }, [inst, esSuper]);

  function cargar() {
    const p = new URLSearchParams();
    if (esSuper && inst) p.set('institucion_id', inst);
    if (sede) p.set('sede', sede);
    if (cursoId) p.set('curso_id', cursoId);
    const qs = p.toString();
    api.get(`/estudiantes/mosaico/datos${qs ? `?${qs}` : ''}`).then(setDatos).catch((e) => setError(e.message));
  }
  useEffect(cargar, [inst, sede, cursoId]);

  const sedes = [...new Set(cursos.map((c) => c.sede))];
  const pdfQuery = () => {
    const p = new URLSearchParams();
    if (esSuper && inst) p.set('institucion_id', inst);
    if (sede) p.set('sede', sede);
    if (cursoId) p.set('curso_id', cursoId);
    const c = cursos.find((x) => String(x.id) === String(cursoId));
    if (c) p.set('grupo', `${c.grado} ${c.grupo}`);
    return p.toString();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ margin: 0 }}>Mosaico de estudiantes</h1>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn sec sm" onClick={() => api.abrirPdf(`/informes/mosaico/pdf?${pdfQuery()}`)}>Imprimir mosaico</button>
          <button className="btn sec sm" title="Descargar mosaico" onClick={() => api.descargarPdf(`/informes/mosaico/pdf?${pdfQuery()}`, 'Mosaico.pdf')}>↓</button>
        </div>
      </div>
      <p style={{ color: 'var(--gris-600)', fontSize: 13 }}>Fotos de los estudiantes con nombre, grado y discapacidad, por colegio, sede y grupo.</p>
      {error && <div className="mensaje-error">{error}</div>}

      <div className="card" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {esSuper && (
          <div className="campo" style={{ marginBottom: 0, minWidth: 220 }}>
            <label>Colegio</label>
            <select value={inst} onChange={(e) => { setInst(e.target.value); setSede(''); setCursoId(''); }}>
              <option value="">— Todos —</option>
              {instituciones.map((i) => <option key={i.id} value={i.id}>{i.nombre}</option>)}
            </select>
          </div>
        )}
        <div className="campo" style={{ marginBottom: 0, minWidth: 160 }}>
          <label>Sede</label>
          <select value={sede} onChange={(e) => setSede(e.target.value)}>
            <option value="">— Todas —</option>
            {sedes.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="campo" style={{ marginBottom: 0, minWidth: 220 }}>
          <label>Grupo / curso</label>
          <select value={cursoId} onChange={(e) => setCursoId(e.target.value)}>
            <option value="">— Todos —</option>
            {cursos.filter((c) => !sede || c.sede === sede).map((c) => (
              <option key={c.id} value={c.id}>{c.sede} · {c.grado} · Grupo {c.grupo}</option>
            ))}
          </select>
        </div>
        <span style={{ color: 'var(--gris-500)', fontSize: 13 }}>{datos.length} estudiante(s)</span>
      </div>

      <div className="mosaico-grid">
        {datos.map((e) => (
          <div className="mosaico-tarjeta" key={e.id}>
            {e.foto
              ? <img src={e.foto} alt={e.nombres} />
              : <div className="mosaico-sinfoto">Sin foto</div>}
            <div className="mosaico-nombre">{e.nombres}</div>
            <div className="mosaico-grado">{e.curso_grado || e.grado || '—'}{e.curso_grupo ? ` · Grupo ${e.curso_grupo}` : ''}</div>
            <div className="mosaico-disc">{e.discapacidad || 'Sin discapacidad registrada'}</div>
          </div>
        ))}
        {datos.length === 0 && <p style={{ color: 'var(--gris-500)' }}>No hay estudiantes para esta selección.</p>}
      </div>
    </div>
  );
}
