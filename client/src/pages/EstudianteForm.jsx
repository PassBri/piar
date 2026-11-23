import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const vacio = {
  nombres: '', documento_tipo: 'TI', documento_numero: '', grado: '', fecha_nacimiento: '',
  identificacion: { sede: '', jornada: '', lugar_nacimiento: '', sexo: '', grupo_etnico: '', estrato: '', direccion: '', telefono: '', grado_ingreso: '' },
  entorno_personal: { descripcion: '', comunicacion: '', movilidad: '', autonomia: '', productos_apoyo: '' },
  entorno_salud: { eps: '', regimen: '', discapacidad: '', diagnostico_soporte: '', medicamentos: '', terapias: '' },
  entorno_hogar: { con_quien_vive: '', nombre_madre: '', nombre_padre: '', nivel_educativo_cuidador: '', transporte: '', servicios: '' },
};

// Definición de los campos de cada grupo (Anexo 1 del MEN)
const CAMPOS = {
  identificacion: [
    ['sede', 'Sede'], ['jornada', 'Jornada'], ['grado_ingreso', 'Grado al que ingresa'],
    ['lugar_nacimiento', 'Lugar de nacimiento'], ['sexo', 'Sexo'], ['grupo_etnico', 'Grupo étnico'],
    ['estrato', 'Estrato'], ['direccion', 'Dirección'], ['telefono', 'Teléfono'],
  ],
  entorno_personal: [
    ['descripcion', 'Descripción (gustos, intereses, características)', true],
    ['comunicacion', '¿Cómo se comunica?'], ['movilidad', '¿Cómo se moviliza?'],
    ['autonomia', 'Nivel de autonomía'], ['productos_apoyo', 'Productos de apoyo que usa'],
  ],
  entorno_salud: [
    ['eps', 'EPS / afiliación'], ['regimen', 'Régimen (contributivo/subsidiado)'],
    ['discapacidad', 'Tipo de discapacidad (si aplica)'],
    ['diagnostico_soporte', 'Soporte de diagnóstico (opcional, no obligatorio)'],
    ['medicamentos', 'Medicamentos (nombre y horario)'], ['terapias', '¿Asiste a terapias? ¿Cuáles?'],
  ],
  entorno_hogar: [
    ['con_quien_vive', '¿Con quién vive?'], ['nombre_madre', 'Nombre de la madre'],
    ['nombre_padre', 'Nombre del padre'], ['nivel_educativo_cuidador', 'Nivel educativo del cuidador'],
    ['transporte', 'Medio de transporte a la institución'], ['servicios', 'Servicios públicos del hogar'],
  ],
};
const TITULOS = {
  identificacion: 'Identificación', entorno_personal: 'Entorno personal',
  entorno_salud: 'Entorno de salud', entorno_hogar: 'Entorno de hogar',
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
        identificacion: { ...vacio.identificacion, ...(e.identificacion || {}) },
        entorno_personal: { ...vacio.entorno_personal, ...(e.entorno_personal || {}) },
        entorno_salud: { ...vacio.entorno_salud, ...(e.entorno_salud || {}) },
        entorno_hogar: { ...vacio.entorno_hogar, ...(e.entorno_hogar || {}) },
      })).catch((err) => setError(err.message));
      api.get(`/piar?estudiante_id=${id}`).then(setPiars).catch(() => {});
    }
  }, [id]);

  const set = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));
  const setG = (grupo, campo, valor) => setForm((f) => ({ ...f, [grupo]: { ...f[grupo], [campo]: valor } }));

  async function guardar(e) {
    e.preventDefault();
    setError(''); setOk('');
    try {
      const saved = id ? await api.put(`/estudiantes/${id}`, form) : await api.post('/estudiantes', form);
      setOk('Anexo 1 guardado correctamente.');
      if (!id) navigate(`/estudiantes/${saved.id}`);
    } catch (err) { setError(err.message); }
  }

  async function crearPiar() {
    const periodo = String(new Date().getFullYear());
    const p = await api.post('/piar', { estudiante_id: Number(id), periodo });
    navigate(`/piar/${p.id}`);
  }

  function Grupo({ grupo }) {
    return (
      <div className="card">
        <h2>{TITULOS[grupo]}</h2>
        <div className="fila" style={{ flexWrap: 'wrap' }}>
          {CAMPOS[grupo].map(([k, label, textarea]) => (
            <div className="campo" key={k} style={textarea ? { flexBasis: '100%' } : {}}>
              <label>{label}</label>
              {textarea
                ? <textarea value={form[grupo][k] || ''} onChange={(e) => setG(grupo, k, e.target.value)} disabled={!editable} />
                : <input value={form[grupo][k] || ''} onChange={(e) => setG(grupo, k, e.target.value)} disabled={!editable} />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link to="/estudiantes" className="btn sec sm">← Volver</Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <h2 style={{ color: 'var(--gris-700)', margin: 0 }}>
          {id ? form.nombres : 'Nuevo estudiante'} — Anexo 1 (Información general)
        </h2>
        {id && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" className="btn sec sm" onClick={() => api.abrirPdf(`/informes/estudiante/${id}/pdf`)}>Imprimir Anexo 1</button>
            <button type="button" className="btn sec sm" title="Descargar Anexo 1" onClick={() => api.descargarPdf(`/informes/estudiante/${id}/pdf`, 'Anexo1.pdf')}>↓</button>
          </div>
        )}
      </div>
      {error && <div className="mensaje-error">{error}</div>}
      {ok && <div style={{ color: 'var(--ok)', fontSize: 14 }}>{ok}</div>}

      <form onSubmit={guardar}>
        <div className="card">
          <h2>Datos básicos</h2>
          <div className="fila">
            <div className="campo" style={{ flexBasis: '100%' }}><label>Nombres y apellidos</label>
              <input value={form.nombres} onChange={(e) => set('nombres', e.target.value)} disabled={!editable} required /></div>
          </div>
          <div className="fila">
            <div className="campo"><label>Tipo de documento</label>
              <select value={form.documento_tipo} onChange={(e) => set('documento_tipo', e.target.value)} disabled={!editable}>
                <option>RC</option><option>TI</option><option>CC</option><option>PEP</option><option>PPT</option>
              </select></div>
            <div className="campo"><label>Número</label>
              <input value={form.documento_numero || ''} onChange={(e) => set('documento_numero', e.target.value)} disabled={!editable} /></div>
            <div className="campo"><label>Grado actual</label>
              <input value={form.grado || ''} onChange={(e) => set('grado', e.target.value)} disabled={!editable} /></div>
            <div className="campo"><label>Fecha de nacimiento</label>
              <input type="date" value={form.fecha_nacimiento || ''} onChange={(e) => set('fecha_nacimiento', e.target.value)} disabled={!editable} /></div>
          </div>
        </div>

        <Grupo grupo="identificacion" />
        <Grupo grupo="entorno_personal" />
        <Grupo grupo="entorno_salud" />
        <Grupo grupo="entorno_hogar" />

        {editable && <button className="btn">Guardar Anexo 1</button>}
      </form>

      {id && (
        <div className="card" style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>PIAR del estudiante (por periodo/año)</h2>
            {editable && <button className="btn sm" onClick={crearPiar}>+ Nuevo PIAR</button>}
          </div>
          <table>
            <thead><tr><th>Periodo/Año</th><th>Estado</th><th></th></tr></thead>
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
