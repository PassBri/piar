import { useState } from 'react';
import { CATEGORIAS_DISCAPACIDAD } from '../data/discapacidades.js';

export default function Discapacidades() {
  const [abierta, setAbierta] = useState(0);

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>Discapacidades y estrategias pedagógicas</h1>
      <p style={{ color: 'var(--gris-600)', fontSize: 14, marginTop: 0 }}>
        Guía de las categorías de discapacidad según el Decreto 1421 de 2017, con estrategias generales
        y por asignatura. Sirve de apoyo al docente al diligenciar los ajustes razonables del PIAR.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
        {CATEGORIAS_DISCAPACIDAD.map((d, i) => {
          const open = abierta === i;
          return (
            <div className="card" key={d.nombre} style={{ padding: 0, overflow: 'hidden' }}>
              <button
                onClick={() => setAbierta(open ? -1 : i)}
                style={{
                  width: '100%', textAlign: 'left', background: open ? 'var(--gris-700)' : 'var(--blanco)',
                  color: open ? '#fff' : 'var(--gris-900)', border: 'none', cursor: 'pointer',
                  padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
              >
                <span>
                  <strong style={{ fontSize: 15 }}>{d.nombre}</strong>
                  <span style={{ marginLeft: 10, fontSize: 12, opacity: 0.8 }}>· {d.categoria}</span>
                </span>
                <span style={{ fontSize: 18 }}>{open ? '–' : '+'}</span>
              </button>
              {open && (
                <div style={{ padding: '16px 18px' }}>
                  <p style={{ marginTop: 0, color: 'var(--gris-800)' }}>{d.descripcion}</p>

                  <h3 style={{ marginBottom: 6 }}>Estrategias generales</h3>
                  <ul style={{ marginTop: 0, color: 'var(--gris-800)' }}>
                    {d.estrategias.map((e, k) => <li key={k} style={{ marginBottom: 4 }}>{e}</li>)}
                  </ul>

                  <h3 style={{ marginBottom: 6 }}>Estrategias por asignatura</h3>
                  <table className="ftabla">
                    <thead><tr><th style={{ width: '24%' }}>Asignatura</th><th>Estrategia sugerida</th></tr></thead>
                    <tbody>
                      {Object.entries(d.porAsignatura).map(([area, txt]) => (
                        <tr key={area}>
                          <td className="lbl">{area}</td>
                          <td className="val" style={{ padding: '6px 8px', fontSize: 13 }}>{txt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
