import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Estudiantes() {
  const { usuario } = useAuth();
  const esSuper = usuario.rol === 'superadmin';
  const [lista, setLista] = useState([]);
  const [instituciones, setInstituciones] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [error, setError] = useState('');
  const puedeCrear = ['docente', 'psicoorientador', 'administrador', 'coordinador', 'rector', 'superadmin'].includes(usuario.rol);
  const [f, setF] = useState({ institucion_id: '', sede: '', curso_id: '', discapacidad: '' });

  useEffect(() => {
    if (esSuper) api.get('/geografia/instituciones').then(setInstituciones).catch(() => {});
  }, [esSuper]);
  useEffect(() => {
    const q = esSuper ? (f.institucion_id ? `?institucion_id=${f.institucion_id}` : null) : '';
    if (q === null) { setCursos([]); return; }
    api.get(`/cursos${q}`).then(setCursos).catch(() => {});
  }, [f.institucion_id, esSuper]);

  function cargar() {
    const p = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => { if (v) p.set(k, v); });
    const qs = p.toString();
    api.get(`/estudiantes${qs ? `?${qs}` : ''}`).then(setLista).catch((e) => setError(e.message));
  }
  useEffect(cargar, [f]);

  const sedes = [...new Set(cursos.map((c) => c.sede))];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ color: 'var(--gris-700)' }}>Estudiantes</h2>
        {puedeCrear && <Link className="btn" to="/estudiantes/nuevo">+ Nuevo estudiante</Link>}
      </div>
      {error && <div className="mensaje-error">{error}</div>}

      <div className="card" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {esSuper && (
          <div className="campo" style={{ marginBottom: 0, minWidth: 200 }}>
            <label>Colegio</label>
            <select value={f.institucion_id} onChange={(e) => setF({ ...f, institucion_id: e.target.value, sede: '', curso_id: '' })}>
              <option value="">— Todos —</option>
              {instituciones.map((i) => <option key={i.id} value={i.id}>{i.nombre}</option>)}
            </select>
          </div>
        )}
        <div className="campo" style={{ marginBottom: 0, minWidth: 150 }}>
          <label>Sede</label>
          <select value={f.sede} onChange={(e) => setF({ ...f, sede: e.target.value })}>
            <option value="">— Todas —</option>
            {sedes.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="campo" style={{ marginBottom: 0, minWidth: 200 }}>
          <label>Curso</label>
          <select value={f.curso_id} onChange={(e) => setF({ ...f, curso_id: e.target.value })}>
            <option value="">— Todos —</option>
            {cursos.filter((c) => !f.sede || c.sede === f.sede).map((c) => (
              <option key={c.id} value={c.id}>{c.sede} · {c.grado} · Grupo {c.grupo}</option>
            ))}
          </select>
        </div>
        <div className="campo" style={{ marginBottom: 0, minWidth: 160, flex: 1 }}>
          <label>Discapacidad</label>
          <input value={f.discapacidad} onChange={(e) => setF({ ...f, discapacidad: e.target.value })} placeholder="Buscar por discapacidad" />
        </div>
        <span style={{ color: 'var(--gris-500)', fontSize: 13 }}>{lista.length} estudiante(s)</span>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr><th>Nombres</th><th>Documento</th><th>Grado / Curso</th><th>Discapacidad</th><th></th></tr>
          </thead>
          <tbody>
            {lista.map((e) => (
              <tr key={e.id}>
                <td>{e.nombres} {e.reservado && <span title="Caso reservado">🔒</span>}</td>
                <td>{e.documento_numero || '—'}</td>
                <td>{e.curso_grado || e.grado || '—'}{e.curso_grupo ? ` · Grupo ${e.curso_grupo}` : ''}</td>
                <td style={{ fontSize: 13, color: 'var(--gris-600)' }}>{e.discapacidad || '—'}</td>
                <td><Link className="btn sec sm" to={`/estudiantes/${e.id}`}>Abrir</Link></td>
              </tr>
            ))}
            {lista.length === 0 && <tr><td colSpan="5" style={{ color: 'var(--gris-500)' }}>No hay estudiantes para esta selección.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
