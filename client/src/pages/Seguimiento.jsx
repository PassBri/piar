import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

function celdaPct(v) {
  const color = v >= 80 ? '#2e7d32' : v >= 40 ? '#f9a825' : '#c62828';
  return (
    <td style={{ minWidth: 90 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ flex: 1, background: 'var(--gris-200)', borderRadius: 5, height: 7, overflow: 'hidden' }}>
          <div style={{ width: `${v}%`, height: '100%', background: color }} />
        </div>
        <span style={{ fontSize: 12, minWidth: 30, textAlign: 'right' }}>{v}%</span>
      </div>
    </td>
  );
}

export default function Seguimiento() {
  const { usuario } = useAuth();
  const supervisa = ['rector', 'coordinador', 'psicoorientador', 'administrador', 'superadmin'].includes(usuario.rol);
  const [pendientes, setPendientes] = useState([]);
  const [avances, setAvances] = useState([]);
  const [error, setError] = useState('');
  const [registro, setRegistro] = useState(null); // ajuste en edición
  const [datos, setDatos] = useState({ impacto: '', decision: 'mantener' });

  function cargar() {
    api.get('/seguimientos/pendientes').then(setPendientes).catch((e) => setError(e.message));
  }
  useEffect(cargar, []);
  useEffect(() => {
    if (supervisa) api.get('/piar/avance/listado').then(setAvances).catch(() => {});
  }, [supervisa]);

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

      {supervisa && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Avance de diligenciamiento de los PIAR</h2>
          <p style={{ color: 'var(--gris-600)', fontSize: 13, marginTop: 0 }}>
            Control del porcentaje diligenciado en cada anexo, por estudiante.
          </p>
          <table>
            <thead><tr><th>Estudiante</th><th>Grado</th><th>Anexo 1</th><th>Anexo 2</th><th>Anexo 3</th><th>Total</th><th></th></tr></thead>
            <tbody>
              {avances.map((a) => (
                <tr key={a.piar_id}>
                  <td>{a.estudiante_nombre}</td>
                  <td>{a.grado || '—'}</td>
                  {celdaPct(a.avance.anexo1)}
                  {celdaPct(a.avance.anexo2)}
                  {celdaPct(a.avance.anexo3)}
                  <td><span className="badge gris">{a.avance.total}%</span></td>
                  <td><Link className="btn sec sm" to={`/piar/${a.piar_id}`}>Abrir</Link></td>
                </tr>
              ))}
              {avances.length === 0 && <tr><td colSpan="7" style={{ color: 'var(--gris-500)' }}>Aún no hay PIAR para controlar.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Seguimientos pendientes</h2>
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
