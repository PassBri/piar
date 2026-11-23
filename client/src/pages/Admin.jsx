import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function Admin() {
  const [indicadores, setIndicadores] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState('');
  const [nuevo, setNuevo] = useState({ nombres: '', correo: '', clave: '', rol: 'docente' });
  const [ok, setOk] = useState('');

  function cargar() {
    api.get('/informes/indicadores').then((d) => setIndicadores(d.por_institucion)).catch((e) => setError(e.message));
    api.get('/usuarios').then(setUsuarios).catch(() => {});
  }
  useEffect(cargar, []);

  async function crearUsuario(e) {
    e.preventDefault();
    setError(''); setOk('');
    try {
      await api.post('/usuarios', nuevo);
      setOk('Usuario creado.');
      setNuevo({ nombres: '', correo: '', clave: '', rol: 'docente' });
      cargar();
    } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <h2 style={{ color: 'var(--gris-700)' }}>Administración</h2>
      {error && <div className="mensaje-error">{error}</div>}
      {ok && <div style={{ color: 'var(--ok)', fontSize: 14 }}>{ok}</div>}

      <div className="card">
        <h2>Indicadores por territorio</h2>
        <table>
          <thead><tr><th>Departamento</th><th>Municipio</th><th>Institución</th><th>Estudiantes</th><th>PIAR vigentes</th></tr></thead>
          <tbody>
            {indicadores.map((i) => (
              <tr key={i.id}>
                <td>{i.departamento || '—'}</td>
                <td>{i.municipio || '—'}</td>
                <td>{i.institucion}</td>
                <td>{i.estudiantes}</td>
                <td>{i.piar_vigentes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Usuarios de la institución</h2>
        <table>
          <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Activo</th></tr></thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}><td>{u.nombres}</td><td>{u.correo}</td><td>{u.rol}</td>
                <td>{u.activo ? 'Sí' : 'No'}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <form className="card" onSubmit={crearUsuario}>
        <h2>Crear usuario</h2>
        <div className="fila">
          <div className="campo"><label>Nombres</label>
            <input value={nuevo.nombres} onChange={(e) => setNuevo({ ...nuevo, nombres: e.target.value })} required /></div>
          <div className="campo"><label>Correo</label>
            <input type="email" value={nuevo.correo} onChange={(e) => setNuevo({ ...nuevo, correo: e.target.value })} required /></div>
        </div>
        <div className="fila">
          <div className="campo"><label>Contraseña</label>
            <input type="text" value={nuevo.clave} onChange={(e) => setNuevo({ ...nuevo, clave: e.target.value })} required /></div>
          <div className="campo"><label>Rol</label>
            <select value={nuevo.rol} onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value })}>
              <option value="docente">Docente</option>
              <option value="psicoorientador">Psicoorientador</option>
              <option value="rector">Rector</option>
              <option value="padre">Padre de familia</option>
              <option value="administrador">Administrador</option>
            </select></div>
        </div>
        <button className="btn">Crear usuario</button>
      </form>
    </div>
  );
}
