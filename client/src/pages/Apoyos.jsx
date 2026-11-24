import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

const APOYOS_ICFES = [
  'Tiempo adicional', 'Cuestionario en Braille', 'Cuestionario en letra grande (macrotipo)',
  'Intérprete de Lengua de Señas Colombiana', 'Lector / transcriptor (amanuense)',
  'Software lector de pantalla', 'Cuestionario en audio', 'Ubicación preferencial',
  'Descansos adicionales', 'Acompañamiento de apoyo',
];
const SECTORES = ['Salud', 'Protección (ICBF)', 'Rehabilitación', 'Otro'];
const ESTADOS = ['enviada', 'en_proceso', 'respondida'];

export default function Apoyos() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [estId, setEstId] = useState('');
  const [pruebas, setPruebas] = useState([]);
  const [remisiones, setRemisiones] = useState([]);
  const [error, setError] = useState('');
  const [nuevaPrueba, setNuevaPrueba] = useState({ tipo: 'Saber 11°', apoyos: [], otros_apoyos: '', observaciones: '' });
  const [nuevaRem, setNuevaRem] = useState({ sector: 'Salud', entidad: '', motivo: '' });

  useEffect(() => { api.get('/estudiantes').then(setEstudiantes).catch(() => {}); }, []);
  function cargar(id) {
    if (!id) { setPruebas([]); setRemisiones([]); return; }
    api.get(`/apoyos/pruebas-estado?estudiante_id=${id}`).then(setPruebas).catch(() => {});
    api.get(`/apoyos/remisiones?estudiante_id=${id}`).then(setRemisiones).catch(() => {});
  }
  useEffect(() => { cargar(estId); }, [estId]);

  function toggleApoyo(a) {
    setNuevaPrueba((p) => ({ ...p, apoyos: p.apoyos.includes(a) ? p.apoyos.filter((x) => x !== a) : [...p.apoyos, a] }));
  }
  async function guardarPrueba(e) {
    e.preventDefault(); setError('');
    try { await api.post('/apoyos/pruebas-estado', { estudiante_id: Number(estId), ...nuevaPrueba }); setNuevaPrueba({ tipo: 'Saber 11°', apoyos: [], otros_apoyos: '', observaciones: '' }); cargar(estId); }
    catch (err) { setError(err.message); }
  }
  async function guardarRem(e) {
    e.preventDefault(); setError('');
    try { await api.post('/apoyos/remisiones', { estudiante_id: Number(estId), ...nuevaRem }); setNuevaRem({ sector: 'Salud', entidad: '', motivo: '' }); cargar(estId); }
    catch (err) { setError(err.message); }
  }
  async function actualizarRem(id, estado, respuesta) {
    await api.put(`/apoyos/remisiones/${id}`, { estado, respuesta }); cargar(estId);
  }

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>Apoyos externos y remisiones</h1>
      <p style={{ color: 'var(--gris-600)', fontSize: 14, marginTop: 0 }}>
        Apoyos para pruebas de Estado y articulación con otros sectores (salud, ICBF, rehabilitación).
      </p>
      {error && <div className="mensaje-error">{error}</div>}

      <div className="card">
        <div className="campo" style={{ maxWidth: 420, marginBottom: 0 }}>
          <label>Estudiante</label>
          <select value={estId} onChange={(e) => setEstId(e.target.value)}>
            <option value="">— Elegir estudiante —</option>
            {estudiantes.map((e) => <option key={e.id} value={e.id}>{e.nombres}</option>)}
          </select>
        </div>
      </div>

      {estId && (
        <>
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Pruebas de Estado (ICFES / Saber)</h2>
            {pruebas.length > 0 && (
              <table>
                <thead><tr><th>Fecha</th><th>Prueba</th><th>Apoyos</th><th></th></tr></thead>
                <tbody>
                  {pruebas.map((p) => (
                    <tr key={p.id}>
                      <td>{new Date(p.fecha).toLocaleDateString('es-CO')}</td>
                      <td>{p.tipo || '—'}</td>
                      <td style={{ fontSize: 13 }}>{(p.apoyos || []).join(', ') || '—'}</td>
                      <td><button className="btn sec sm" onClick={() => api.abrirPdf(`/informes/prueba-estado/${p.id}/pdf`)}>PDF</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <form onSubmit={guardarPrueba} style={{ marginTop: 10 }}>
              <div className="campo" style={{ maxWidth: 260 }}><label>Tipo de prueba</label>
                <input value={nuevaPrueba.tipo} onChange={(e) => setNuevaPrueba({ ...nuevaPrueba, tipo: e.target.value })} /></div>
              <label>Apoyos solicitados</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '6px 0 10px' }}>
                {APOYOS_ICFES.map((a) => (
                  <label key={a} style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 400, fontSize: 13, border: '1px solid var(--gris-200)', borderRadius: 8, padding: '5px 9px', cursor: 'pointer' }}>
                    <input type="checkbox" style={{ width: 'auto' }} checked={nuevaPrueba.apoyos.includes(a)} onChange={() => toggleApoyo(a)} />{a}
                  </label>
                ))}
              </div>
              <div className="campo"><label>Otros apoyos</label><input value={nuevaPrueba.otros_apoyos} onChange={(e) => setNuevaPrueba({ ...nuevaPrueba, otros_apoyos: e.target.value })} /></div>
              <div className="campo"><label>Observaciones</label><textarea value={nuevaPrueba.observaciones} onChange={(e) => setNuevaPrueba({ ...nuevaPrueba, observaciones: e.target.value })} /></div>
              <button className="btn">Guardar y generar solicitud</button>
            </form>
          </div>

          <div className="card">
            <h2 style={{ marginTop: 0 }}>Remisiones y articulación intersectorial</h2>
            {remisiones.length > 0 && (
              <table>
                <thead><tr><th>Fecha</th><th>Sector</th><th>Entidad</th><th>Estado</th><th></th></tr></thead>
                <tbody>
                  {remisiones.map((r) => (
                    <tr key={r.id}>
                      <td>{new Date(r.fecha).toLocaleDateString('es-CO')}</td>
                      <td>{r.sector}</td><td>{r.entidad || '—'}</td>
                      <td>
                        <select value={r.estado} onChange={(e) => actualizarRem(r.id, e.target.value, r.respuesta)} style={{ fontSize: 12, padding: '2px 4px' }}>
                          {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td><button className="btn sec sm" onClick={() => api.abrirPdf(`/informes/remision/${r.id}/pdf`)}>PDF</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <form onSubmit={guardarRem} style={{ marginTop: 10 }}>
              <div className="fila">
                <div className="campo"><label>Sector</label>
                  <select value={nuevaRem.sector} onChange={(e) => setNuevaRem({ ...nuevaRem, sector: e.target.value })}>
                    {SECTORES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select></div>
                <div className="campo"><label>Entidad (EPS/IPS/ICBF/fundación)</label>
                  <input value={nuevaRem.entidad} onChange={(e) => setNuevaRem({ ...nuevaRem, entidad: e.target.value })} /></div>
              </div>
              <div className="campo"><label>Motivo de la remisión</label>
                <textarea value={nuevaRem.motivo} onChange={(e) => setNuevaRem({ ...nuevaRem, motivo: e.target.value })} required /></div>
              <button className="btn">Registrar remisión</button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
