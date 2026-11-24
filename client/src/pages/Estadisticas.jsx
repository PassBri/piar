import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import MapaColombia from '../components/MapaColombia.jsx';
import { NOMBRES_DISCAPACIDAD } from '../data/discapacidades.js';

const COLORES = ['#37474F', '#546E7A', '#5e8a8c', '#6f8f7a', '#8d6e63', '#7e6fa8', '#c9a227', '#4e7a9c'];

function Barras({ titulo, datos }) {
  const max = Math.max(1, ...datos.map((d) => d.total));
  return (
    <div className="card" style={{ flex: '1 1 300px', minWidth: 280 }}>
      <h2 style={{ marginTop: 0 }}>{titulo}</h2>
      {datos.length === 0 && <p style={{ color: 'var(--gris-500)' }}>Sin datos.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {datos.map((d, i) => (
          <div key={d.etiqueta} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 130, fontSize: 12, color: 'var(--gris-700)', textAlign: 'right', flexShrink: 0 }}>{d.etiqueta}</div>
            <div style={{ flex: 1, background: 'var(--gris-100)', borderRadius: 5, height: 18, overflow: 'hidden' }}>
              <div style={{ width: `${(d.total / max) * 100}%`, height: '100%', background: COLORES[i % COLORES.length], minWidth: 2 }} />
            </div>
            <div style={{ width: 34, fontSize: 13, fontWeight: 600 }}>{d.total}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Estadisticas() {
  const [mapa, setMapa] = useState(null);
  const [socio, setSocio] = useState(null);
  const [error, setError] = useState('');
  const [sel, setSel] = useState(null);
  const [disc, setDisc] = useState('');

  useEffect(() => {
    const q = disc ? `?discapacidad=${encodeURIComponent(disc)}` : '';
    api.get(`/estadisticas/mapa${q}`).then(setMapa).catch((e) => setError(e.message));
    api.get(`/informes/estadisticas${q}`).then(setSocio).catch(() => {});
  }, [disc]);

  if (error) return <div className="mensaje-error">{error}</div>;
  if (!mapa) return <div>Cargando estadísticas…</div>;

  const { totales, municipios, departamentos } = mapa;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ margin: 0 }}>Estadísticas de atención — PIAR</h1>
        <div className="campo" style={{ margin: 0, minWidth: 240 }}>
          <label>Filtrar por discapacidad</label>
          <select value={disc} onChange={(e) => setDisc(e.target.value)}>
            <option value="">Todas las discapacidades</option>
            {NOMBRES_DISCAPACIDAD.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      <div className="grid">
        <div className="card"><div className="kpi">{totales.colegios}</div><div className="kpi-label">Colegios</div></div>
        <div className="card"><div className="kpi">{totales.estudiantes}</div><div className="kpi-label">Estudiantes atendidos</div></div>
        <div className="card"><div className="kpi">{totales.municipios}</div><div className="kpi-label">Municipios con atención</div></div>
      </div>

      {socio && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 4 }}>
          <Barras titulo="Por tipo de discapacidad" datos={socio.por_discapacidad} />
          <Barras titulo="Por género" datos={socio.por_genero} />
          <Barras titulo="Por rango de edad" datos={socio.por_edad} />
        </div>
      )}

      <div className="card">
        <h2>Mapa de atención por municipio{disc ? ` · ${disc}` : ''}</h2>
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
                  <div><span className="kpi" style={{ fontSize: 22 }}>{sel.estudiantes}</span> estudiantes{disc ? ` con ${disc.toLowerCase()}` : ' atendidos'}</div>
                </div>
                <button className="btn sec sm" style={{ marginTop: 10 }} onClick={() => setSel(null)}>Cerrar</button>
              </div>
            ) : (
              <p style={{ marginTop: 0 }}>
                El color de cada departamento indica el número de estudiantes{disc ? ` con ${disc.toLowerCase()}` : ' atendidos'};
                cada punto dorado es un municipio con colegios PIAR. Pasa el cursor y <strong>haz clic</strong> para fijar el detalle.
              </p>
            )}
          </div>
        </div>
      </div>

      {socio && socio.ambito === 'nacional' && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Barras titulo="Por departamento" datos={socio.por_departamento.slice(0, 12)} />
          <Barras titulo="Por colegio" datos={socio.por_institucion.slice(0, 12)} />
        </div>
      )}

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
