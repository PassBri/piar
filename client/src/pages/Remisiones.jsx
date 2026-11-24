import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const ESTADOS = [['', 'Todas'], ['enviada', 'Enviadas'], ['en_proceso', 'En proceso'], ['respondida', 'Atendidas']];

export default function Remisiones() {
  const { usuario } = useAuth();
  const [lista, setLista] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [nuevo, setNuevo] = useState({ estudiante_id: '', motivo: '' });
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const puedeRemitir = ['docente', 'psicoorientador', 'coordinador', 'rector', 'administrador', 'superadmin'].includes(usuario.rol);
  const puedeAtender = ['psicoorientador', 'coordinador', 'rector', 'administrador', 'superadmin'].includes(usuario.rol);

  function cargar() {
    api.get('/apoyos/remisiones-institucion').then(setLista).catch((e) => setError(e.message));
  }
  useEffect(() => {
    cargar();
    api.get('/estudiantes').then(setEstudiantes).catch(() => {});
  }, []);

  async function crear() {
    if (!nuevo.estudiante_id) { setError('Elige el estudiante.'); return; }
    if (!nuevo.motivo.trim()) { setError('Escribe el motivo de la remisión.'); return; }
    try {
      setError('');
      await api.post('/apoyos/remisiones', { estudiante_id: Number(nuevo.estudiante_id), sector: 'Psicoorientación', entidad: 'Orientación escolar', motivo: nuevo.motivo.trim() });
      setNuevo({ estudiante_id: '', motivo: '' }); setOk('Remisión enviada a psicoorientación.');
      cargar();
    } catch (err) { setError(err.message); }
  }
  async function actualizar(rid, estado, respuesta) {
    try { await api.put(`/apoyos/remisiones/${rid}`, { estado, respuesta }); cargar(); }
    catch (err) { setError(err.message); }
  }

  const visibles = filtro ? lista.filter((r) => r.estado === filtro) : lista;
  const badge = (e) => (e === 'respondida' ? 'ok' : e === 'en_proceso' ? 'alerta' : 'gris');

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>Remisiones a psicoorientación</h1>
      <p style={{ color: 'var(--gris-600)', fontSize: 14, marginTop: 0 }}>
        El docente remite al estudiante cuando observa señales que requieren valoración; el equipo de orientación hace el seguimiento hasta atenderla.
      </p>
      {error && <div className="mensaje-error">{error}</div>}
      {ok && <div style={{ color: 'var(--ok)', fontSize: 14, margin: '6px 0' }}>{ok}</div>}

      {puedeRemitir && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Nueva remisión</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="campo" style={{ marginBottom: 0, minWidth: 240 }}>
              <label>Estudiante</label>
              <select value={nuevo.estudiante_id} onChange={(e) => setNuevo({ ...nuevo, estudiante_id: e.target.value })}>
                <option value="">— Elegir —</option>
                {estudiantes.map((e) => <option key={e.id} value={e.id}>{e.nombres}{e.curso_grado ? ` · ${e.curso_grado}` : ''}</option>)}
              </select>
            </div>
            <div className="campo" style={{ flex: 1, minWidth: 260, marginBottom: 0 }}>
              <label>Motivo</label>
              <textarea rows={2} value={nuevo.motivo} onChange={(e) => setNuevo({ ...nuevo, motivo: e.target.value })}
                placeholder="Describe lo observado en el aula que motiva la remisión" />
            </div>
            <button type="button" className="btn" onClick={crear}>Remitir</button>
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, flex: 1 }}>Seguimiento</h2>
          <select value={filtro} onChange={(e) => setFiltro(e.target.value)} style={{ maxWidth: 180 }}>
            {ESTADOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <table>
          <thead><tr><th>Fecha</th><th>Estudiante</th><th>Motivo</th><th>Remitió</th><th>Estado</th><th>Respuesta de orientación</th></tr></thead>
          <tbody>
            {visibles.map((r) => (
              <tr key={r.id}>
                <td style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{r.fecha ? new Date(r.fecha).toLocaleDateString('es-CO') : '—'}</td>
                <td style={{ fontSize: 13 }}>{r.estudiante_nombre}{r.reservado ? ' 🔒' : ''}</td>
                <td style={{ fontSize: 13 }}>{r.motivo}</td>
                <td style={{ fontSize: 13 }}>{r.remitente || '—'}</td>
                <td>
                  {puedeAtender
                    ? <select value={r.estado} onChange={(e) => actualizar(r.id, e.target.value, r.respuesta)} style={{ fontSize: 12 }}>
                        <option value="enviada">Enviada</option><option value="en_proceso">En proceso</option><option value="respondida">Atendida</option>
                      </select>
                    : <span className={`badge ${badge(r.estado)}`}>{r.estado}</span>}
                </td>
                <td style={{ fontSize: 13, minWidth: 200 }}>
                  {puedeAtender
                    ? <textarea key={`r${r.id}`} rows={2} defaultValue={r.respuesta || ''} placeholder="Síntesis de la atención / valoración"
                        onBlur={(e) => { if ((r.respuesta || '') !== e.target.value) actualizar(r.id, r.estado === 'enviada' ? 'en_proceso' : r.estado, e.target.value); }} />
                    : (r.respuesta || '—')}
                </td>
              </tr>
            ))}
            {visibles.length === 0 && <tr><td colSpan="6" style={{ color: 'var(--gris-500)' }}>Sin remisiones en esta selección.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
