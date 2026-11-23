import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Estudiantes() {
  const { usuario } = useAuth();
  const [lista, setLista] = useState([]);
  const [error, setError] = useState('');
  const puedeCrear = ['docente', 'psicoorientador', 'administrador'].includes(usuario.rol);

  useEffect(() => {
    api.get('/estudiantes').then(setLista).catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ color: 'var(--gris-700)' }}>Estudiantes</h2>
        {puedeCrear && <Link className="btn" to="/estudiantes/nuevo">+ Nuevo estudiante</Link>}
      </div>
      {error && <div className="mensaje-error">{error}</div>}
      <div className="card">
        <table>
          <thead>
            <tr><th>Nombres</th><th>Documento</th><th>Grado</th><th></th></tr>
          </thead>
          <tbody>
            {lista.map((e) => (
              <tr key={e.id}>
                <td>{e.nombres}</td>
                <td>{e.documento_numero || '—'}</td>
                <td>{e.grado || '—'}</td>
                <td><Link className="btn sec sm" to={`/estudiantes/${e.id}`}>Abrir</Link></td>
              </tr>
            ))}
            {lista.length === 0 && <tr><td colSpan="4" style={{ color: 'var(--gris-500)' }}>Aún no hay estudiantes registrados.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
