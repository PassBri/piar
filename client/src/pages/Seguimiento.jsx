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
  const [filtro, setFiltro] = useState({ sede: '', grado: '', curso: '', edad: '', discapacidad: '' });

  function edadDe(f) {
    if (!f) return null;
    const d = new Date(f), h = new Date();
    let a = h.getFullYear() - d.getFullYear();
    if (h.getMonth() < d.getMonth() || (h.getMonth() === d.getMonth() && h.getDate() < d.getDate())) a--;
    return a >= 0 && a < 120 ? a : null;
  }

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

      {supervisa && (() => {
        const sedes = [...new Set(avances.map((a) => a.curso_sede).filter(Boolean))].sort();
        const grados = [...new Set(avances.map((a) => a.curso_grado || a.grado).filter(Boolean))].sort();
        const cursos = [...new Set(avances.map((a) => a.curso_grupo).filter(Boolean))].sort();
        const edades = [...new Set(avances.map((a) => edadDe(a.fecha_nacimiento)).filter((x) => x != null))].sort((x, y) => x - y);
        const visibles = avances.filter((a) => {
          if (filtro.sede && a.curso_sede !== filtro.sede) return false;
          if (filtro.grado && (a.curso_grado || a.grado) !== filtro.grado) return false;
          if (filtro.curso && a.curso_grupo !== filtro.curso) return false;
          if (filtro.edad && String(edadDe(a.fecha_nacimiento)) !== String(filtro.edad)) return false;
          if (filtro.discapacidad && !(a.discapacidad || '').toLowerCase().includes(filtro.discapacidad.toLowerCase())) return false;
          return true;
        });
        return (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Estudiantes · avance de diligenciamiento</h2>
          <div className="fila" style={{ marginBottom: 12 }}>
            <div className="campo" style={{ marginBottom: 0 }}><label>Sede</label>
              <select value={filtro.sede} onChange={(e) => setFiltro({ ...filtro, sede: e.target.value })}>
                <option value="">— Todas —</option>{sedes.map((s) => <option key={s} value={s}>{s}</option>)}
              </select></div>
            <div className="campo" style={{ marginBottom: 0 }}><label>Grado</label>
              <select value={filtro.grado} onChange={(e) => setFiltro({ ...filtro, grado: e.target.value })}>
                <option value="">— Todos —</option>{grados.map((g) => <option key={g} value={g}>{g}</option>)}
              </select></div>
            <div className="campo" style={{ marginBottom: 0 }}><label>Curso</label>
              <select value={filtro.curso} onChange={(e) => setFiltro({ ...filtro, curso: e.target.value })}>
                <option value="">— Todos —</option>{cursos.map((c) => <option key={c} value={c}>Grupo {c}</option>)}
              </select></div>
            <div className="campo" style={{ marginBottom: 0 }}><label>Edad</label>
              <select value={filtro.edad} onChange={(e) => setFiltro({ ...filtro, edad: e.target.value })}>
                <option value="">— Todas —</option>{edades.map((ed) => <option key={ed} value={ed}>{ed} años</option>)}
              </select></div>
            <div className="campo" style={{ marginBottom: 0 }}><label>Discapacidad</label>
              <input value={filtro.discapacidad} onChange={(e) => setFiltro({ ...filtro, discapacidad: e.target.value })} placeholder="Buscar…" /></div>
          </div>
          <p style={{ color: 'var(--gris-600)', fontSize: 13, marginTop: 0 }}>
            {visibles.length} de {avances.length} estudiante(s). Abre cualquiera para diligenciar sus anexos.
          </p>
          <table>
            <thead><tr><th>Estudiante</th><th>Grado</th><th>Anexo 1</th><th>Anexo 2</th><th>Anexo 3</th><th>Total</th><th></th></tr></thead>
            <tbody>
              {visibles.map((a) => (
                <tr key={a.piar_id}>
                  <td>{a.estudiante_nombre}</td>
                  <td>{a.curso_grado || a.grado || '—'}</td>
                  {celdaPct(a.avance.anexo1)}
                  {celdaPct(a.avance.anexo2)}
                  {celdaPct(a.avance.anexo3)}
                  <td><span className="badge gris">{a.avance.total}%</span></td>
                  <td><Link className="btn sec sm" to={`/estudiantes/${a.estudiante_id}`}>Abrir</Link></td>
                </tr>
              ))}
              {visibles.length === 0 && <tr><td colSpan="7" style={{ color: 'var(--gris-500)' }}>Ningún estudiante con esos filtros.</td></tr>}
            </tbody>
          </table>
        </div>
        );
      })()}

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
