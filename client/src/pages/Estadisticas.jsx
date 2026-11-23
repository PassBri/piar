import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import MapaColombia from '../components/MapaColombia.jsx';

export default function Estadisticas() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

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
            <MapaColombia municipios={municipios} departamentos={departamentos} />
          </div>
          <div style={{ flex: '1 1 260px', fontSize: 13, color: 'var(--gris-600)' }}>
            <p style={{ marginTop: 0 }}>
              El color de cada departamento indica el número de estudiantes atendidos;
              cada punto dorado es un municipio con colegios que aplican el PIAR (su tamaño
              crece con el número de estudiantes). Pasa el cursor sobre un punto para ver el detalle.
            </p>
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
