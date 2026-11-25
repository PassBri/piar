import { useState, useRef, useEffect } from 'react';
import { api } from '../api/client.js';

const Icono = {
  doc: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />,
  chart: <path d="M4 20h16v-2H4v2zM6 16h2V9H6v7zm5 0h2V5h-2v11zm5 0h2v-5h-2v5z" />,
  track: <path d="M9 16.2l-3.5-3.5L4 14.2 9 19.2 20 8.2l-1.5-1.5L9 16.2z" />,
  download: <path d="M12 16l-5-5 1.4-1.4L11 12.2V4h2v8.2l2.6-2.6L17 11l-5 5zm-7 4v-2h14v2H5z" />,
  open: <path d="M14 3v2h3.6l-9.8 9.8 1.4 1.4L19 6.4V10h2V3h-7zM5 5h5V3H3v18h18v-7h-2v5H5V5z" />,
  print: <path d="M19 8H5a3 3 0 0 0-3 3v6h4v4h12v-4h4v-6a3 3 0 0 0-3-3zm-3 11H8v-5h8v5zm3-7a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm-1-6H6V3h12v3z" />,
  chevron: <path d="M7 10l5 5 5-5z" />,
};
function Svg({ name, size = 18 }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">{Icono[name]}</svg>;
}

export default function MenuDocumentos({ docs, conPortada, setConPortada }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!abierto) return undefined;
    const fuera = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false); };
    document.addEventListener('mousedown', fuera);
    return () => document.removeEventListener('mousedown', fuera);
  }, [abierto]);

  return (
    <div className="menu-docs" ref={ref}>
      <button type="button" className={`md-boton ${abierto ? 'activo' : ''}`} onClick={() => setAbierto((v) => !v)}>
        <Svg name="print" size={18} /> <span>Imprimir / Descargar</span> <Svg name="chevron" size={18} />
      </button>
      {abierto && (
        <div className="md-panel" role="menu">
          <button type="button" role="switch" aria-checked={conPortada}
            className={`md-switch ${conPortada ? 'on' : ''}`} onClick={() => setConPortada(!conPortada)}>
            <span className="md-switch-track"><span className="md-switch-thumb" /></span>
            <span>Incluir portada</span>
          </button>
          <div className="md-sep" />
          {docs.map((d) => (
            <div className="md-fila" key={d.clave}>
              <button type="button" className="md-nombre" title={`Ver / imprimir ${d.nombre}`} onClick={() => { api.abrirPdf(d.url); setAbierto(false); }}>
                <Svg name={d.icono || 'doc'} /> {d.nombre}
              </button>
              <button type="button" className="md-descargar" title={`Descargar ${d.nombre}`} onClick={() => { api.descargarPdf(d.url, d.archivo); setAbierto(false); }}><Svg name="download" size={18} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
