import { useState, useEffect } from 'react';

// Menú de accesibilidad funcional: aplica ajustes reales a toda la plataforma
// y los recuerda (localStorage). Pensado para un software de educación inclusiva.
const OPCIONES = [
  { k: 'contraste', label: 'Alto contraste' },
  { k: 'legible', label: 'Texto legible' },
  { k: 'espaciado', label: 'Espaciado de texto' },
  { k: 'enlaces', label: 'Resaltar enlaces' },
  { k: 'cursor', label: 'Cursor ampliado' },
];

function leer() { try { return JSON.parse(localStorage.getItem('a11y') || '{}'); } catch { return {}; } }
function guardar(s) { try { localStorage.setItem('a11y', JSON.stringify(s)); } catch { /* */ } }

export function aplicarA11y(s) {
  const r = document.documentElement;
  OPCIONES.forEach((o) => r.classList.toggle(`a11y-${o.k}`, !!s[o.k]));
  r.classList.toggle('a11y-lectura', !!s.lectura);
  r.style.setProperty('--a11y-escala', String(s.escala || 1));
}
export function aplicarA11yGuardado() { aplicarA11y(leer()); }

function IconAccesibilidad() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="4" r="1.6" /><path d="M4 8h16M12 8v6m0 0l-3.5 5m3.5-5l3.5 5" />
    </svg>
  );
}

export default function Accesibilidad({ anclaje = 'fab' }) {
  const [abierto, setAbierto] = useState(false);
  const [s, setS] = useState(leer());

  useEffect(() => { aplicarA11y(s); guardar(s); }, [s]);

  // Lectura de texto: al activarla, un clic sobre cualquier texto lo lee en voz alta.
  useEffect(() => {
    if (!s.lectura || typeof window.speechSynthesis === 'undefined') return;
    const onClick = (e) => {
      if (e.target.closest('.a11y-panel') || e.target.closest('.a11y-fab')) return;
      const t = (e.target.innerText || e.target.textContent || '').trim();
      if (!t) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(t.slice(0, 500));
      u.lang = 'es-CO';
      window.speechSynthesis.speak(u);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [s.lectura]);

  const set = (k, v) => setS((p) => ({ ...p, [k]: v }));
  const toggle = (k) => set(k, !s[k]);
  const escala = s.escala || 1;
  const reset = () => { window.speechSynthesis?.cancel(); setS({}); };

  return (
    <div className={`a11y-root ${anclaje}`}>
      <button type="button" className="a11y-fab" onClick={() => setAbierto((o) => !o)}
        aria-expanded={abierto} aria-label="Opciones de accesibilidad" title="Opciones de accesibilidad">
        <IconAccesibilidad />
        <span className="a11y-fab-txt">Accesibilidad</span>
      </button>
      {abierto && (
        <div className="a11y-panel" role="dialog" aria-label="Opciones de accesibilidad">
          <div className="a11y-panel-top">
            <span>Accesibilidad</span>
            <button type="button" className="a11y-x" onClick={() => setAbierto(false)} aria-label="Cerrar">×</button>
          </div>
          <div className="a11y-fila">
            <span>Tamaño del texto</span>
            <div className="a11y-escala">
              <button type="button" onClick={() => set('escala', Math.max(0.9, Math.round((escala - 0.1) * 10) / 10))} aria-label="Reducir texto">A−</button>
              <b>{Math.round(escala * 100)}%</b>
              <button type="button" onClick={() => set('escala', Math.min(1.6, Math.round((escala + 0.1) * 10) / 10))} aria-label="Aumentar texto">A+</button>
            </div>
          </div>
          {OPCIONES.map((o) => (
            <label key={o.k} className="a11y-opt"><input type="checkbox" checked={!!s[o.k]} onChange={() => toggle(o.k)} /> {o.label}</label>
          ))}
          <label className="a11y-opt"><input type="checkbox" checked={!!s.lectura} onChange={() => toggle('lectura')} /> Lectura de texto <small>(clic para oír)</small></label>
          <button type="button" className="a11y-reset" onClick={reset}>Restablecer</button>
        </div>
      )}
    </div>
  );
}
