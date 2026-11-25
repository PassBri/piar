import { useNavigate } from 'react-router-dom';
import { useExpediente } from '../context/ExpedienteContext.jsx';

const COLORES = ['#5C6BC0', '#26A69A', '#EF6C00', '#8E24AA', '#00897B', '#C62828', '#3949AB', '#6D4C41'];

function iniciales(nombre = '') {
  const p = nombre.trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase() || '·';
}
function colorDe(texto = '') {
  let h = 0;
  for (let i = 0; i < texto.length; i++) h = texto.charCodeAt(i) + ((h << 5) - h);
  return COLORES[Math.abs(h) % COLORES.length];
}
function fotoSrc(foto) {
  if (!foto) return null;
  return foto.startsWith('data:') ? foto : `data:image/jpeg;base64,${foto}`;
}

export default function FichaEstudiante() {
  const { estudiante, limpiarExpediente } = useExpediente();
  const navigate = useNavigate();
  if (!estudiante) return null;

  const { nombres, foto, grado, curso_sede, documento, discapacidad, reservado } = estudiante;
  const src = fotoSrc(foto);

  function salir(e) {
    e.stopPropagation();
    limpiarExpediente();
    navigate('/seguimiento');
  }

  return (
    <div className="ficha-est" onClick={(e) => e.stopPropagation()}>
      <div className="ficha-foto" style={!src ? { background: colorDe(nombres) } : undefined}>
        {src ? <img src={src} alt={nombres} /> : <span>{iniciales(nombres)}</span>}
      </div>
      <div className="ficha-nombre" title={nombres}>
        {nombres}{reservado && <span className="ficha-reservado" title="Información reservada"> 🔒</span>}
      </div>
      <div className="ficha-meta">
        {[grado && `Grado ${grado}`, curso_sede].filter(Boolean).join(' · ') || 'Sin grado'}
      </div>
      {documento && <div className="ficha-doc">Doc. {documento}</div>}
      {discapacidad && <div className="ficha-chip">{discapacidad}</div>}
      <button className="ficha-salir" onClick={salir}>← Salir del expediente</button>
    </div>
  );
}
