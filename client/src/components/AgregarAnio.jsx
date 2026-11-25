import { useState } from 'react';
import { api } from '../api/client.js';

// Promueve el grado si es numérico (6 -> 7); si no, lo deja igual.
function gradoPromovido(g) {
  const n = parseInt(String(g || '').replace(/\D/g, ''), 10);
  return Number.isFinite(n) ? String(n + 1) : (g || '');
}

export default function AgregarAnio({ anios, estudianteId, onCreado, onError }) {
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const reciente = anios.length ? anios[anios.length - 1] : null;
  const anioSugerido = reciente ? String(Number(reciente.periodo) + 1) : String(new Date().getFullYear());
  const [anio, setAnio] = useState(anioSugerido);
  const [grado, setGrado] = useState(reciente ? gradoPromovido(reciente.grado) : '');

  function abrir() {
    const r = anios.length ? anios[anios.length - 1] : null;
    setAnio(r ? String(Number(r.periodo) + 1) : String(new Date().getFullYear()));
    setGrado(r ? gradoPromovido(r.grado) : '');
    setAbierto(true);
  }

  async function crear() {
    if (!anio) return;
    setGuardando(true);
    try {
      const np = await api.post('/piar', { estudiante_id: estudianteId, periodo: String(anio).trim(), grado: String(grado).trim() });
      setAbierto(false);
      onCreado(np);
    } catch (e) { onError && onError(e.message); }
    finally { setGuardando(false); }
  }

  if (!abierto) {
    return <button type="button" className="anios-nuevo" onClick={abrir} title="Agregar un año a la trayectoria">+ Agregar año</button>;
  }

  return (
    <div className="anio-nuevo-form">
      <label>Año
        <input type="number" value={anio} onChange={(e) => setAnio(e.target.value)} min="2000" max="2100" autoFocus />
      </label>
      <label>Grado
        <input type="text" value={grado} onChange={(e) => setGrado(e.target.value)} placeholder="Ej. 7" style={{ width: 70 }} />
      </label>
      <button type="button" className="btn sm" onClick={crear} disabled={guardando}>{guardando ? 'Creando…' : 'Crear'}</button>
      <button type="button" className="btn sec sm" onClick={() => setAbierto(false)}>Cancelar</button>
    </div>
  );
}
