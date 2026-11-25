import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Guardado from './Guardado.jsx';

const ACTORES = [
  ['familia', 'Familia, cuidadores o con quienes vive'],
  ['docentes', 'Docentes'],
  ['directivos', 'Directivos'],
  ['administrativos', 'Administrativos'],
  ['pares', 'Pares (sus compañeros)'],
];
const EDITA = ['coordinador', 'rector', 'administrador', 'superadmin'];

export default function PmiInstitucional() {
  const { usuario } = useAuth();
  const puede = EDITA.includes(usuario.rol);
  const [cursos, setCursos] = useState([]);
  const [anio, setAnio] = useState(String(new Date().getFullYear()));
  const [sede, setSede] = useState('');
  const [jornada, setJornada] = useState('');
  const [actores, setActores] = useState(ACTORES.map(([a]) => ({ actor: a, acciones: '', estrategias: '' })));
  const [guardado, setGuardado] = useState('idle');
  const timers = useRef({});

  useEffect(() => { api.get('/cursos').then(setCursos).catch(() => {}); }, []);

  function cargar() {
    const qs = new URLSearchParams({ anio, sede, jornada }).toString();
    api.get(`/pmi-institucional?${qs}`).then((d) => setActores(d.actores)).catch(() => {});
  }
  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, [anio, sede, jornada]);

  const sedes = [...new Set(cursos.map((c) => c.sede).filter(Boolean))].sort();
  const jornadas = [...new Set(cursos.filter((c) => !sede || c.sede === sede).map((c) => c.jornada).filter(Boolean))].sort();

  async function guardar(actor, fila) {
    setGuardado('saving');
    try {
      await api.put('/pmi-institucional', { anio, sede, jornada, actor, acciones: fila.acciones, estrategias: fila.estrategias });
      setGuardado('saved');
    } catch { setGuardado('error'); }
  }
  function cambiar(actor, campo, valor) {
    setActores((prev) => {
      const next = prev.map((a) => (a.actor === actor ? { ...a, [campo]: valor } : a));
      const fila = next.find((a) => a.actor === actor);
      clearTimeout(timers.current[actor]);
      timers.current[actor] = setTimeout(() => guardar(actor, fila), 700);
      return next;
    });
  }

  const ambito = sede || jornada
    ? `${sede || 'Todas las sedes'}${jornada ? ' · ' + jornada : ''}`
    : 'Toda la institución';

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ margin: 0 }}>Plan institucional (diligenciable)</h2>
        {puede && <Guardado estado={guardado} />}
      </div>
      <p style={{ color: 'var(--gris-600)', fontSize: 13, marginTop: 4 }}>
        El equipo directivo registra aquí el plan de la institución por actor. Puede ser general (toda la institución)
        o específico por sede y jornada.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <div className="campo" style={{ margin: 0, minWidth: 110 }}>
          <label>Año</label>
          <input type="number" value={anio} onChange={(e) => setAnio(e.target.value)} min="2000" max="2100" />
        </div>
        <div className="campo" style={{ margin: 0, minWidth: 200 }}>
          <label>Sede</label>
          <select value={sede} onChange={(e) => { setSede(e.target.value); setJornada(''); }}>
            <option value="">Toda la institución</option>
            {sedes.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="campo" style={{ margin: 0, minWidth: 170 }}>
          <label>Jornada</label>
          <select value={jornada} onChange={(e) => setJornada(e.target.value)} disabled={!sede && jornadas.length === 0}>
            <option value="">Todas las jornadas</option>
            {jornadas.map((j) => <option key={j} value={j}>{j}</option>)}
          </select>
        </div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--gris-600)', marginBottom: 8 }}>Ámbito: <strong>{ambito}</strong></div>
      <div style={{ overflowX: 'auto' }}>
        <table className="tabla-actores">
          <thead><tr><th>Actores</th><th>Acciones</th><th>Estrategias a implementar</th></tr></thead>
          <tbody>
            {actores.map((a) => {
              const nombre = ACTORES.find(([c]) => c === a.actor)?.[1] || a.actor;
              return (
                <tr key={a.actor}>
                  <td className="ta-actor">{nombre}</td>
                  <td style={{ padding: 4 }}>
                    <textarea className="pmi-ta" value={a.acciones} disabled={!puede}
                      onChange={(e) => cambiar(a.actor, 'acciones', e.target.value)} placeholder={puede ? 'Acciones…' : '—'} />
                  </td>
                  <td style={{ padding: 4 }}>
                    <textarea className="pmi-ta" value={a.estrategias} disabled={!puede}
                      onChange={(e) => cambiar(a.actor, 'estrategias', e.target.value)} placeholder={puede ? 'Estrategias…' : '—'} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
