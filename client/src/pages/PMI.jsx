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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ margin: 0 }}>Plan de Mejoramiento Institucional (PMI)</h1>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn sec sm" onClick={() => api.abrirPdf('/informes/pmi/pdf')}>Imprimir formato PMI</button>
          <button className="btn sec sm" title="Descargar" onClick={() => api.descargarPdf('/informes/pmi/pdf', 'Formato_PMI.pdf')}>↓</button>
        </div>
      </div>
      <p style={{ color: 'var(--gris-600)', fontSize: 14, marginTop: 4 }}>
        Consolidado derivado de los PIAR del colegio: barreras recurrentes y recomendaciones para eliminarlas
        a nivel institucional (infraestructura, formación, recursos, gestión).
      </p>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Barreras recurrentes identificadas en los PIAR</h2>
        {data.barreras.length === 0 && <p style={{ color: 'var(--gris-500)' }}>Aún no se han registrado barreras en los PIAR.</p>}
        <table>
          <thead><tr><th>Barrera</th><th style={{ width: 90 }}>Casos</th></tr></thead>
          <tbody>
            {data.barreras.map((b, i) => (
              <tr key={i}><td>{b.barrera}</td><td><span className="badge gris">{b.n}</span></td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Recomendaciones para el PMI</h2>
        <p style={{ color: 'var(--gris-600)', fontSize: 13, marginTop: 0 }}>
          Se diligencian en el Anexo 2 de cada estudiante (sección 7) y se consolidan aquí.
        </p>
        {data.recomendaciones.length === 0 && <p style={{ color: 'var(--gris-500)' }}>Aún no hay recomendaciones PMI registradas en los PIAR.</p>}
        <table>
          <thead><tr><th>Estudiante</th><th>Grado</th><th>Año</th><th>Recomendación para el PMI</th></tr></thead>
          <tbody>
            {data.recomendaciones.map((r) => (
              <tr key={r.piar_id}>
                <td>{r.nombres}</td>
                <td>{r.grado_piar || r.grado || '—'}</td>
                <td>{r.periodo}</td>
                <td style={{ fontSize: 13 }}>{r.pmi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
