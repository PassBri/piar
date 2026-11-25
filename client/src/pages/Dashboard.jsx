import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { usuario } = useAuth();
  const [estudiantes, setEstudiantes] = useState([]);
  const [pendientes, setPendientes] = useState([]);
  const [alertas, setAlertas] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/estudiantes').then(setEstudiantes).catch((e) => setError(e.message));
    if (['docente', 'psicoorientador', 'administrador', 'rector', 'coordinador', 'superadmin'].includes(usuario.rol)) {
      api.get('/seguimientos/pendientes').then(setPendientes).catch(() => {});
      api.get('/informes/alertas').then(setAlertas).catch(() => {});
    }
  }, [usuario.rol]);

  const puedeInforme = ['docente', 'psicoorientador', 'administrador', 'rector', 'coordinador', 'superadmin'].includes(usuario.rol);

  return (
    <div>
      {puedeInforme && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <button className="btn sec sm" title="Informe consolidado del colegio en PDF"
            onClick={() => api.abrirPdf('/informes/institucional/pdf')}>Informe institucional (PDF)</button>
          <button className="btn sec sm" title="Descargar sin portada"
            onClick={() => api.descargarPdf('/informes/institucional/pdf?portada=0', 'Informe_institucional_PIAR.pdf')}>↓</button>
        </div>
      )}
      <div className="grid">
        <div className="card">
          <div className="kpi">{estudiantes.length}</div>
          <div className="kpi-label">Estudiantes con expediente</div>
        </div>
        <div className="card">
          <div className="kpi">{pendientes.length}</div>
          <div className="kpi-label">Seguimientos pendientes</div>
        </div>
      </div>

      {error && <div className="mensaje-error">{error}</div>}

      {alertas && (alertas.seguimientos_pendientes + alertas.piar_sin_ajustes + alertas.autorizaciones_faltantes) > 0 && (
        <div className="card" style={{ borderLeft: '4px solid var(--alerta)' }}>
          <h2 style={{ marginTop: 0 }}>Recordatorios</h2>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {alertas.seguimientos_pendientes > 0 && (
              <Link to="/seguimiento" className="card" style={{ margin: 0, minWidth: 180, textDecoration: 'none' }}>
                <div className="kpi" style={{ color: '#f9a825' }}>{alertas.seguimientos_pendientes}</div>
                <div className="kpi-label">Ajustes sin sus 3 seguimientos</div>
              </Link>
            )}
            {alertas.piar_sin_ajustes > 0 && (
              <div className="card" style={{ margin: 0, minWidth: 180 }}>
                <div className="kpi" style={{ color: '#c62828' }}>{alertas.piar_sin_ajustes}</div>
                <div className="kpi-label">PIAR vigentes sin ajustes</div>
              </div>
            )}
            {alertas.autorizaciones_faltantes > 0 && (
              <Link to="/estudiantes" className="card" style={{ margin: 0, minWidth: 180, textDecoration: 'none' }}>
                <div className="kpi" style={{ color: '#c62828' }}>{alertas.autorizaciones_faltantes}</div>
                <div className="kpi-label">Autorizaciones de datos faltantes</div>
              </Link>
            )}
          </div>
        </div>
      )}

      {pendientes.length > 0 && (
        <div className="card">
          <h2>Seguimientos por atender (mínimo 3 al año)</h2>
          <table>
            <thead>
              <tr><th>Estudiante</th><th>Ajuste</th><th>Periodo</th><th>Seguimientos</th></tr>
            </thead>
            <tbody>
              {pendientes.map((p) => (
                <tr key={p.ajuste_id}>
                  <td>{p.estudiante}</td>
                  <td>{p.descripcion}</td>
                  <td>{p.periodo}</td>
                  <td><span className="badge alerta">{p.seguimientos}/3</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card">
        <h2>Bienvenido, {usuario.nombres}</h2>
        <p style={{ color: 'var(--gris-600)', fontSize: 14 }}>
          Desde aquí puedes gestionar los expedientes de tus estudiantes, elaborar el PIAR
          (Anexos 1, 2 y 3), hacer el seguimiento de los ajustes razonables e imprimir los
          formatos e informes, en el marco del Decreto 1421 de 2017.
        </p>
      </div>
    </div>
  );
}
