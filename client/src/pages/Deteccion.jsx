import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { DOMINIOS, NIVELES, calcularAlertas } from '../data/tamizaje.js';

export default function Deteccion() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [estId, setEstId] = useState('');
  const [historial, setHistorial] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => { api.get('/estudiantes').then(setEstudiantes).catch(() => {}); }, []);
  function cargarHistorial(id) {
    if (!id) { setHistorial([]); return; }
    api.get(`/tamizaje?estudiante_id=${id}`).then(setHistorial).catch(() => {});
  }
  useEffect(() => { cargarHistorial(estId); setRespuestas({}); setObservaciones(''); setOk(''); }, [estId]);

  function set(dom, idx, val) {
    setRespuestas((r) => ({ ...r, [dom]: { ...(r[dom] || {}), [idx]: val } }));
  }
  const alertas = calcularAlertas(respuestas);

  async function guardar(e) {
    e.preventDefault();
    setError(''); setOk('');
    try {
      await api.post('/tamizaje', { estudiante_id: Number(estId), respuestas, dominios_alerta: alertas, observaciones });
      setOk('Tamizaje guardado.');
      setRespuestas({}); setObservaciones('');
      cargarHistorial(estId);
    } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>Detección en el aula (tamizaje)</h1>
      <p style={{ color: 'var(--gris-600)', fontSize: 14, marginTop: 0 }}>
        Escalas de observación del MEN. Valore cada afirmación de 1 (nunca) a 4 (siempre). El sistema marca
        señales de alerta cuando más del 40% de un dominio puntúa 1 o 2. Es una observación de aula, no un diagnóstico.
      </p>
      {error && <div className="mensaje-error">{error}</div>}
      {ok && <div style={{ color: 'var(--ok)', fontSize: 14, margin: '6px 0' }}>{ok}</div>}

      <div className="card">
        <div className="campo" style={{ maxWidth: 420, marginBottom: 0 }}>
          <label>Estudiante</label>
          <select value={estId} onChange={(e) => setEstId(e.target.value)}>
            <option value="">— Elegir estudiante —</option>
            {estudiantes.map((e) => <option key={e.id} value={e.id}>{e.nombres} {e.curso_grado ? `· ${e.curso_grado}` : ''}</option>)}
          </select>
        </div>
      </div>

      {estId && (
        <>
          {historial.length > 0 && (
            <div className="card">
              <h2 style={{ marginTop: 0 }}>Tamizajes anteriores</h2>
              <table>
                <thead><tr><th>Fecha</th><th>Aplicado por</th><th>Dominios en alerta</th><th></th></tr></thead>
                <tbody>
                  {historial.map((t) => (
                    <tr key={t.id}>
                      <td>{new Date(t.fecha).toLocaleDateString('es-CO')}</td>
                      <td>{t.aplicado_nombre || '—'}</td>
                      <td>{(t.dominios_alerta || []).length === 0
                        ? <span className="badge ok">Sin alertas</span>
                        : <span className="badge error">{(t.dominios_alerta || []).length} dominio(s)</span>}</td>
                      <td><button className="btn sec sm" onClick={() => api.abrirPdf(`/informes/tamizaje/${t.id}/pdf`)}>PDF</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <form className="card" onSubmit={guardar}>
            <h2 style={{ marginTop: 0 }}>Nueva aplicación</h2>
            {DOMINIOS.map((d) => {
              const enAlerta = alertas.includes(d.clave);
              return (
                <div key={d.clave} style={{ marginBottom: 14 }}>
                  <h3 style={{ marginBottom: 4, color: enAlerta ? '#c62828' : 'var(--gris-800)' }}>
                    {enAlerta && '⚠ '}{d.nombre}
                  </h3>
                  <table className="ftabla">
                    <tbody>
                      {d.indicadores.map((ind, i) => (
                        <tr key={i}>
                          <td className="lbl" style={{ width: '52%' }}>{ind}</td>
                          <td className="val" style={{ padding: 4 }}>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                              {NIVELES.map((n) => (
                                <label key={n.v} style={{ display: 'flex', alignItems: 'center', gap: 3, fontWeight: 400, fontSize: 12 }}>
                                  <input type="radio" name={`${d.clave}-${i}`} checked={respuestas[d.clave]?.[i] === n.v}
                                    onChange={() => set(d.clave, i, n.v)} style={{ width: 'auto' }} />
                                  {n.t}
                                </label>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
            {alertas.length > 0 && (
              <div className="mensaje-error" style={{ background: '#FBE3E3' }}>
                Señales de alerta en: {alertas.map((c) => DOMINIOS.find((d) => d.clave === c).nombre).join('; ')}.
                Se sugiere remitir al equipo de orientación / valoración.
              </div>
            )}
            <div className="campo"><label>Observaciones del docente</label>
              <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} /></div>
            <button className="btn">Guardar tamizaje</button>
          </form>
        </>
      )}
    </div>
  );
}
