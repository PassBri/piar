import { Link } from 'react-router-dom';

function Barra({ etiqueta, valor }) {
  const color = valor >= 80 ? '#2e7d32' : valor >= 40 ? '#f9a825' : '#c62828';
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
        <span>{etiqueta}</span><b>{valor}%</b>
      </div>
      <div style={{ background: 'var(--gris-200)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
        <div style={{ width: `${valor}%`, height: '100%', background: color, transition: 'width .3s' }} />
      </div>
    </div>
  );
}

// Navegación unificada de anexos (igual en Anexo 1 y en el PIAR).
// vista: 'anexo1' | 'anexo2' | 'anexo3' | 'anexo4'
// onVista: si se pasa (PiarDetalle), los anexos 2/3/4 son botones de sección;
//          si no (EstudianteForm), son enlaces a /piar/:piarId?v=anexoX
export default function NavAnexos({ vista, estudianteId, piarId, av, onVista }) {
  const tab = (clave, texto) => {
    if (vista === clave) return <span className="activo" key={clave}>{texto}</span>;
    // Dentro del PIAR (onVista): todas las pestañas cambian de sección sin recargar
    if (onVista) return <button type="button" key={clave} onClick={() => onVista(clave)}>{texto}</button>;
    // Standalone (Anexo 1 en su propia ruta): navegación por enlaces
    if (clave === 'anexo1') {
      return estudianteId
        ? <Link to={`/estudiantes/${estudianteId}`} key={clave}>{texto}</Link>
        : <span className="deshab" key={clave}>{texto}</span>;
    }
    return piarId
      ? <Link to={`/piar/${piarId}?v=${clave}`} key={clave}>{texto}</Link>
      : <span className="deshab" key={clave}>{texto}</span>;
  };

  return (
    <>
      <div className="anexos-tabs">
        {tab('anexo1', 'Anexo 1 · Información')}
        {tab('anexo2', 'Anexo 2 · Valoración y ajustes')}
        {tab('anexo3', 'Anexo 3 · Acta de acuerdo')}
        {tab('anexo4', 'Anexo 4 · Seguimiento y transición')}
      </div>
      {av && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h2 style={{ margin: 0 }}>Avance de diligenciamiento</h2>
            <span className="badge gris" style={{ fontSize: 14 }}>Total {av.total}%</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            <Barra etiqueta="Anexo 1 · Información" valor={av.anexo1} />
            <Barra etiqueta="Anexo 2 · Valoración y ajustes" valor={av.anexo2} />
            <Barra etiqueta="Anexo 3 · Acta de acuerdo" valor={av.anexo3} />
          </div>
        </div>
      )}
    </>
  );
}
