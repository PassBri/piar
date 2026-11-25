import { useNavigate } from 'react-router-dom';
import { useExpediente } from '../context/ExpedienteContext.jsx';

const GRADIENTES = [
  ['#5C6BC0', '#3949AB'], ['#26A69A', '#00796B'], ['#EF6C00', '#E65100'],
  ['#8E24AA', '#6A1B9A'], ['#039BE5', '#0277BD'], ['#C62828', '#AD1457'],
  ['#43A047', '#2E7D32'], ['#6D4C41', '#4E342E'],
];

function iniciales(nombre = '') {
  const p = nombre.trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase() || '·';
}
function gradienteDe(texto = '') {
  let h = 0;
  for (let i = 0; i < texto.length; i++) h = texto.charCodeAt(i) + ((h << 5) - h);
  return GRADIENTES[Math.abs(h) % GRADIENTES.length];
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
  const [c1, c2] = gradienteDe(nombres || discapacidad || 'piar');

  function salir(e) {
    e.stopPropagation();
    limpiarExpediente();
    navigate('/seguimiento');
  }

  return (
    <div className="ficha-est" onClick={(e) => e.stopPropagation()}>
      <div className="ficha-foto" style={!src ? { background: `linear-gradient(135deg, ${c1}, ${c2})` } : undefined}>
        {src ? <img src={src} alt={nombres} /> : <span>{iniciales(nombres)}</span>}
      </div>
      <div className="ficha-nombre" title={nombres}>
        {nombres}{reservado && <span className="ficha-reservado" title="Información reservada"> 🔒</span>}
      </div>
      <div className="ficha-meta">
        {[grado && `Grado ${grado}`, curso_sede].filter(Boolean).join(' · ') || 'Sin grado'}
      </div>
      {documento && <div className="ficha-doc">Doc. {documento}</div>}
      {discapacidad && (
        <div className="ficha-chip" style={{ background: `${c1}2e`, color: '#fff', border: `1px solid ${c1}66` }}>
          {discapacidad}
        </div>
      )}
      <button className="ficha-salir" onClick={salir}>← Salir del expediente</button>
    </div>
  );
}
