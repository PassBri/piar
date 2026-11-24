import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function PMI() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/informes/pmi').then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="mensaje-error">{error}</div>;
  if (!data) return <div>Cargando…</div>;

  const hayAlgo = (data.actores || []).some((a) => a.items.length > 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ margin: 0 }}>Plan de Mejoramiento Institucional (PMI)</h1>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn sec sm" onClick={() => api.abrirPdf('/informes/pmi/pdf')}>Imprimir PMI</button>
          <button className="btn sec sm" title="Descargar" onClick={() => api.descargarPdf('/informes/pmi/pdf', 'Plan_Mejoramiento_Institucional.pdf')}>↓</button>
        </div>
      </div>
      <p style={{ color: 'var(--gris-600)', fontSize: 14, marginTop: 4 }}>
        El sistema consolida las recomendaciones del punto 7 de cada PIAR (Anexo 2) y las agrupa por actor,
        como insumo para construir el Plan de Mejoramiento Institucional y eliminar barreras.
      </p>

      {/* Resumen por actor (insumo para el plan) */}
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Resumen por actor (insumo para el plan)</h2>
        {!hayAlgo && <p style={{ color: 'var(--gris-500)' }}>Aún no hay recomendaciones registradas. Se diligencian en el Anexo 2 (punto 7) de cada estudiante.</p>}
        {(data.actores || []).filter((a) => a.items.length > 0).map((a) => (
          <div key={a.clave} style={{ borderLeft: '4px solid var(--azul, #1565c0)', paddingLeft: 12, margin: '12px 0' }}>
            <h3 style={{ margin: '0 0 6px' }}>{a.nombre} <span className="badge gris" style={{ fontWeight: 400 }}>{a.items.length} PIAR</span></h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
              <div>
                <strong style={{ fontSize: 13 }}>Acciones</strong>
                <ul style={{ margin: '4px 0 0', paddingLeft: 18, fontSize: 13 }}>
                  {a.resumen_acciones.length ? a.resumen_acciones.map((t, i) => <li key={i}>{t}</li>) : <li style={{ color: 'var(--gris-500)' }}>—</li>}
                </ul>
              </div>
              <div>
                <strong style={{ fontSize: 13 }}>Estrategias a implementar</strong>
                <ul style={{ margin: '4px 0 0', paddingLeft: 18, fontSize: 13 }}>
                  {a.resumen_estrategias.length ? a.resumen_estrategias.map((t, i) => <li key={i}>{t}</li>) : <li style={{ color: 'var(--gris-500)' }}>—</li>}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Barreras recurrentes */}
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Barreras recurrentes en los PIAR</h2>
        {data.barreras.length === 0 && <p style={{ color: 'var(--gris-500)' }}>Aún no se han registrado barreras.</p>}
        {data.barreras.length > 0 && (
          <table>
            <thead><tr><th>Barrera</th><th style={{ width: 90 }}>Casos</th></tr></thead>
            <tbody>
              {data.barreras.map((b, i) => (
                <tr key={i}><td style={{ fontSize: 13 }}>{b.barrera}</td><td><span className="badge gris">{b.n}</span></td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detalle por estudiante */}
      {hayAlgo && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Detalle por PIAR</h2>
          <table>
            <thead><tr><th>Actor</th><th>Estudiante</th><th>Grado</th><th>Año</th><th>Acciones</th><th>Estrategias</th></tr></thead>
            <tbody>
              {(data.actores || []).flatMap((a) => a.items.map((it, i) => (
                <tr key={`${a.clave}-${i}`}>
                  <td style={{ fontSize: 12 }}>{a.nombre}</td>
                  <td style={{ fontSize: 13 }}>{it.estudiante}</td>
                  <td>{it.grado || '—'}</td>
                  <td>{it.periodo}</td>
                  <td style={{ fontSize: 13 }}>{it.acciones || '—'}</td>
                  <td style={{ fontSize: 13 }}>{it.estrategias || '—'}</td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
