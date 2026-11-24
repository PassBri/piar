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
  const supervisa = ['docente', 'rector', 'coordinador', 'psicoorientador', 'administrador', 'superadmin'].includes(usuario.rol);
  const puedeCrear = supervisa;
  const [pendientes, setPendientes] = useState([]);
  const [avances, setAvances] = useState([]);
  const [error, setError] = useState('');
  const [registro, setRegistro] = useState(null); // ajuste en edición
  const [datos, setDatos] = useState({ impacto: '', decision: 'mantener' });

  function cargar() {
    api.get('/seguimientos/pendientes').then(setPendientes).catch((e) => setError(e.message));
    if (supervisa) api.get('/piar/avance/listado').then(setAvances).catch(() => {});
  }
  useEffect(cargar, []);

  // Importa estudiantes desde CSV (Tipo documento, Documento, Nombres, Grado)
  function importarCSV(ev) {
    const file = ev.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const lineas = reader.result.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
        const parseLinea = (l) => {
          const out = []; let cur = ''; let q = false;
          for (let i = 0; i < l.length; i++) {
            const c = l[i];
            if (c === '"') { if (q && l[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
            else if (c === ',' && !q) { out.push(cur); cur = ''; }
            else cur += c;
          }
          out.push(cur); return out;
        };
        const filas = lineas.slice(1).map(parseLinea).map((c) => ({
          documento_tipo: c[0]?.trim(), documento_numero: c[1]?.trim(), nombres: c[2]?.trim(), grado: c[3]?.trim(),
        })).filter((f) => f.nombres);
        if (filas.length === 0) { setError('El archivo no tiene filas válidas (se espera: Tipo documento, Documento, Nombres, Grado).'); return; }
        const r = await api.post('/estudiantes/importar', { estudiantes: filas });
        setError(''); cargar();
        alert(`Se importaron ${r.creados} estudiante(s).`);
      } catch (e) { setError(e.message); }
      finally { ev.target.value = ''; }
    };
    reader.readAsText(file, 'utf-8');
  }

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ color: 'var(--gris-700)', margin: 0 }}>Estudiantes y seguimiento</h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className="btn sec sm" onClick={() => api.descargarArchivo('/estudiantes/exportar/csv', 'estudiantes.csv')}>Exportar CSV ↓</button>
          {puedeCrear && (
            <label className="btn sec sm" style={{ cursor: 'pointer' }}>
              Importar CSV ↑
              <input type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={importarCSV} />
            </label>
          )}
          {puedeCrear && <Link className="btn" to="/estudiantes/nuevo">+ Nuevo estudiante</Link>}
        </div>
      </div>
      <p style={{ color: 'var(--gris-600)', fontSize: 14 }}>
        Lista de estudiantes con el avance de cada PIAR. El Decreto 1421 exige seguir cada ajuste al menos tres veces al año.
      </p>
      {error && <div className="mensaje-error">{error}</div>}

      {supervisa && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Estudiantes · avance de diligenciamiento</h2>
          <p style={{ color: 'var(--gris-600)', fontSize: 13, marginTop: 0 }}>
            Abre cualquier estudiante para diligenciar sus anexos; el porcentaje muestra lo que lleva cada uno.
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
                  <td><Link className="btn sec sm" to={`/estudiantes/${a.estudiante_id}`}>Abrir</Link></td>
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
