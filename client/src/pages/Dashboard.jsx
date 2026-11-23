import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { usuario } = useAuth();
  const [estudiantes, setEstudiantes] = useState([]);
  const [pendientes, setPendientes] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/estudiantes').then(setEstudiantes).catch((e) => setError(e.message));
    if (['docente', 'psicoorientador', 'administrador', 'rector'].includes(usuario.rol)) {
      api.get('/seguimientos/pendientes').then(setPendientes).catch(() => {});
    }
  }, [usuario.rol]);

  return (
    <div>
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
