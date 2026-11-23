import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';

export default function Seguimiento() {
  const [pendientes, setPendientes] = useState([]);
  const [error, setError] = useState('');
  const [registro, setRegistro] = useState(null); // ajuste en edición
  const [datos, setDatos] = useState({ impacto: '', decision: 'mantener' });

  function cargar() {
    api.get('/seguimientos/pendientes').then(setPendientes).catch((e) => setError(e.message));
  }
  useEffect(cargar, []);

  async function guardar(e) {
    e.preventDefault();
    try {
      await api.post('/seguimientos', { ajuste_id: registro.ajuste_id, ...datos, periodo: registro.periodo });
      setRegistro(null); setDatos({ impacto: '', decision: 'mantener' });
      cargar();
    } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <h2 style={{ color: 'var(--gris-700)' }}>Seguimiento de ajustes</h2>
      <p style={{ color: 'var(--gris-600)', fontSize: 14 }}>
        El Decreto 1421 exige seguir cada ajuste al menos tres veces al año. Aquí aparecen los que aún no completan sus tres seguimientos.
      </p>
      {error && <div className="mensaje-error">{error}</div>}

      <div className="card">
        <table>
          <thead><tr><th>Estudiante</th><th>Ajuste</th><th>Periodo</th><th>Seguimientos</th><th></th></tr></thead>
          <tbody>
            {pendientes.map((p) => (
              <tr key={p.ajuste_id}>
                <td>{p.estudiante}</td>
                <td>{p.descripcion}</td>
                <td>{p.periodo}</td>
                <td><span className="badge alerta">{p.seguimientos}/3</span></td>
                <td>
                  <button className="btn sm" onClick={() => setRegistro(p)}>Registrar</button>{' '}
                  <Link className="btn sec sm" to={`/piar/${p.piar_id}`}>Ver PIAR</Link>
                </td>
              </tr>
            ))}
            {pendientes.length === 0 && <tr><td colSpan="5" style={{ color: 'var(--gris-500)' }}>No hay seguimientos pendientes.</td></tr>}
          </tbody>
        </table>
      </div>

      {registro && (
        <form className="card" onSubmit={guardar}>
          <h2>Registrar seguimiento — {registro.estudiante}</h2>
          <p style={{ fontSize: 13, color: 'var(--gris-600)' }}>{registro.descripcion}</p>
          <div className="campo"><label>Impacto del ajuste</label>
            <textarea value={datos.impacto} onChange={(e) => setDatos({ ...datos, impacto: e.target.value })} required /></div>
          <div className="campo"><label>Decisión</label>
            <select value={datos.decision} onChange={(e) => setDatos({ ...datos, decision: e.target.value })}>
              <option value="mantener">Mantener</option>
              <option value="modificar">Modificar</option>
              <option value="retirar">Retirar</option>
            </select></div>
          <button className="btn">Guardar seguimiento</button>{' '}
          <button type="button" className="btn sec" onClick={() => setRegistro(null)}>Cancelar</button>
        </form>
      )}
    </div>
  );
}
