import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const vacio = {
  nombres: '', documento_tipo: 'TI', documento_numero: '', grado: '', fecha_nacimiento: '',
  entorno_personal: { descripcion: '' },
  entorno_salud: { eps: '', diagnostico_soporte: '', terapias: '' },
  entorno_hogar: { con_quien_vive: '', transporte: '' },
};

export default function EstudianteForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const editable = ['docente', 'psicoorientador', 'administrador'].includes(usuario.rol);
  const [form, setForm] = useState(vacio);
  const [piars, setPiars] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => {
    if (id) {
      api.get(`/estudiantes/${id}`).then((e) => setForm({
        ...vacio, ...e,
        fecha_nacimiento: e.fecha_nacimiento ? e.fecha_nacimiento.slice(0, 10) : '',
        entorno_personal: e.entorno_personal || {},
        entorno_salud: e.entorno_salud || {},
        entorno_hogar: e.entorno_hogar || {},
      })).catch((err) => setError(err.message));
      api.get(`/piar?estudiante_id=${id}`).then(setPiars).catch(() => {});
    }
  }, [id]);

  function set(campo, valor) { setForm((f) => ({ ...f, [campo]: valor })); }
  function setEntorno(grupo, campo, valor) {
    setForm((f) => ({ ...f, [grupo]: { ...f[grupo], [campo]: valor } }));
  }

  async function guardar(e) {
    e.preventDefault();
    setError(''); setOk('');
    try {
      const saved = id
        ? await api.put(`/estudiantes/${id}`, form)
        : await api.post('/estudiantes', form);
      setOk('Guardado correctamente.');
      if (!id) navigate(`/estudiantes/${saved.id}`);
    } catch (err) { setError(err.message); }
  }

  async function crearPiar() {
    const periodo = String(new Date().getFullYear());
    const p = await api.post('/piar', { estudiante_id: Number(id), periodo });
    navigate(`/piar/${p.id}`);
  }

  return (
    <div>
      <Link to="/estudiantes" className="btn sec sm">← Volver</Link>
      <h2 style={{ color: 'var(--gris-700)', marginTop: 12 }}>
        {id ? form.nombres : 'Nuevo estudiante'} — Anexo 1
      </h2>
      {error && <div className="mensaje-error">{error}</div>}
      {ok && <div style={{ color: 'var(--ok)', fontSize: 14 }}>{ok}</div>}

      <form onSubmit={guardar}>
        <div className="card">
          <h2>Datos del estudiante</h2>
          <div className="fila">
            <div className="campo"><label>Nombres y apellidos</label>
              <input value={form.nombres} onChange={(e) => set('nombres', e.target.value)} disabled={!editable} required /></div>
          </div>
          <div className="fila">
            <div className="campo"><label>Tipo de documento</label>
              <select value={form.documento_tipo} onChange={(e) => set('documento_tipo', e.target.value)} disabled={!editable}>
                <option>RC</option><option>TI</option><option>CC</option><option>PEP</option>
              </select></div>
            <div className="campo"><label>Número</label>
              <input value={form.documento_numero || ''} onChange={(e) => set('documento_numero', e.target.value)} disabled={!editable} /></div>
            <div className="campo"><label>Grado</label>
              <input value={form.grado || ''} onChange={(e) => set('grado', e.target.value)} disabled={!editable} /></div>
            <div className="campo"><label>Fecha de nacimiento</label>
              <input type="date" value={form.fecha_nacimiento || ''} onChange={(e) => set('fecha_nacimiento', e.target.value)} disabled={!editable} /></div>
          </div>
        </div>

        <div className="card">
          <h2>Entorno personal</h2>
          <div className="campo"><label>Descripción (gustos, intereses, características)</label>
            <textarea value={form.entorno_personal.descripcion || ''}
              onChange={(e) => setEntorno('entorno_personal', 'descripcion', e.target.value)} disabled={!editable} /></div>
        </div>

        <div className="card">
          <h2>Entorno de salud</h2>
          <div className="fila">
            <div className="campo"><label>EPS / afiliación</label>
              <input value={form.entorno_salud.eps || ''} onChange={(e) => setEntorno('entorno_salud', 'eps', e.target.value)} disabled={!editable} /></div>
            <div className="campo"><label>Asiste a terapias</label>
              <input value={form.entorno_salud.terapias || ''} onChange={(e) => setEntorno('entorno_salud', 'terapias', e.target.value)} disabled={!editable} /></div>
          </div>
          <div className="campo"><label>Soporte de diagnóstico (opcional, no obligatorio)</label>
            <input value={form.entorno_salud.diagnostico_soporte || ''} onChange={(e) => setEntorno('entorno_salud', 'diagnostico_soporte', e.target.value)} disabled={!editable} /></div>
        </div>

        <div className="card">
          <h2>Entorno de hogar</h2>
          <div className="fila">
            <div className="campo"><label>¿Con quién vive?</label>
              <input value={form.entorno_hogar.con_quien_vive || ''} onChange={(e) => setEntorno('entorno_hogar', 'con_quien_vive', e.target.value)} disabled={!editable} /></div>
            <div className="campo"><label>Medio de transporte</label>
              <input value={form.entorno_hogar.transporte || ''} onChange={(e) => setEntorno('entorno_hogar', 'transporte', e.target.value)} disabled={!editable} /></div>
          </div>
        </div>

        {editable && <button className="btn">Guardar Anexo 1</button>}
      </form>

      {id && (
        <div className="card" style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>PIAR del estudiante</h2>
            {editable && <button className="btn sm" onClick={crearPiar}>+ Nuevo PIAR</button>}
          </div>
          <table>
            <thead><tr><th>Periodo</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {piars.map((p) => (
                <tr key={p.id}>
                  <td>{p.periodo}</td>
                  <td><span className="badge gris">{p.estado}</span></td>
                  <td><Link className="btn sec sm" to={`/piar/${p.id}`}>Abrir</Link></td>
                </tr>
              ))}
              {piars.length === 0 && <tr><td colSpan="3" style={{ color: 'var(--gris-500)' }}>Sin PIAR todavía.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
