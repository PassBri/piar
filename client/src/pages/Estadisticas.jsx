import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import MapaColombia from '../components/MapaColombia.jsx';

export default function Estadisticas() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [sel, setSel] = useState(null);

  useEffect(() => {
    api.get('/estadisticas/mapa').then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="mensaje-error">{error}</div>;
  if (!data) return <div>Cargando estadísticas…</div>;

  const { totales, municipios, departamentos } = data;

  return (
    <div>
      <h2 style={{ color: 'var(--gris-700)' }}>Estadísticas de atención — PIAR</h2>

      <div className="grid">
        <div className="card"><div className="kpi">{totales.colegios}</div><div className="kpi-label">Colegios</div></div>
        <div className="card"><div className="kpi">{totales.estudiantes}</div><div className="kpi-label">Estudiantes atendidos</div></div>
        <div className="card"><div className="kpi">{totales.municipios}</div><div className="kpi-label">Municipios con atención</div></div>
      </div>

      <div className="card">
        <h2>Mapa de atención por municipio</h2>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: '2 1 460px', minWidth: 320 }}>
            <MapaColombia municipios={municipios} departamentos={departamentos} onSelect={setSel} />
          </div>
          <div style={{ flex: '1 1 260px', fontSize: 13, color: 'var(--gris-600)' }}>
            {sel ? (
              <div className="card" style={{ margin: 0, background: 'var(--gris-050)' }}>
                <h2 style={{ marginBottom: 6 }}>{sel.nombre}</h2>
                <div style={{ fontSize: 13 }}>
                  {sel.tipo === 'municipio' && <div>Departamento: {sel.departamento}</div>}
                  <div style={{ marginTop: 6 }}><span className="kpi" style={{ fontSize: 22 }}>{sel.colegios}</span> colegios</div>
                  <div><span className="kpi" style={{ fontSize: 22 }}>{sel.estudiantes}</span> estudiantes atendidos</div>
                </div>
                <button className="btn sec sm" style={{ marginTop: 10 }} onClick={() => setSel(null)}>Cerrar</button>
              </div>
            ) : (
              <p style={{ marginTop: 0 }}>
                El color de cada departamento indica el número de estudiantes atendidos;
                cada punto dorado es un municipio con colegios que aplican el PIAR. Pasa el
                cursor para ver el detalle y <strong>haz clic</strong> para fijarlo aquí.
              </p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
              <span style={{ width: 14, height: 14, background: '#ECEFF1', display: 'inline-block', border: '1px solid #CFD8DC' }} />
              <span>Sin atención</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <span style={{ width: 14, height: 14, background: '#37474F', display: 'inline-block' }} />
              <span>Mayor número de estudiantes</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#C9A227', display: 'inline-block' }} />
              <span>Municipio con colegios PIAR</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Detalle por municipio</h2>
        <table>
          <thead><tr><th>Departamento</th><th>Municipio</th><th>Colegios</th><th>Estudiantes</th></tr></thead>
          <tbody>
            {municipios.map((m) => (
              <tr key={m.id}>
                <td>{m.departamento}</td><td>{m.municipio}</td>
                <td>{m.colegios}</td><td>{m.estudiantes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
