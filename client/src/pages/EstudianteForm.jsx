import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

// Campos oficiales del Anexo 1 (Formato PIAR - Decreto 1421). t: 'area' = textarea.
const CAMPOS = {
  identificacion: {
    titulo: '1. Información general',
    campos: [
      ['sede', 'Sede'], ['jornada', 'Jornada'], ['grado_ingreso', 'Grado al que aspira ingresar'],
      ['lugar_nacimiento', 'Lugar de nacimiento'], ['sexo', 'Sexo'],
      ['departamento_vive', 'Departamento donde vive'], ['municipio_vive', 'Municipio'],
      ['direccion', 'Dirección de vivienda'], ['barrio', 'Barrio / vereda'],
      ['telefono', 'Teléfono'], ['correo', 'Correo electrónico'],
      ['centro_proteccion', '¿Está en centro de protección? ¿Dónde?'],
      ['grupo_etnico', '¿Pertenece a un grupo étnico? ¿Cuál?'],
      ['victima_conflicto', '¿Víctima del conflicto armado? (¿registro?)'],
    ],
  },
  entorno_salud: {
    titulo: '2. Entorno salud',
    campos: [
      ['afiliacion', 'Afiliación al sistema de salud (Sí/No)'], ['eps', 'EPS'],
      ['regimen', 'Régimen (Contributivo/Subsidiado)'],
      ['lugar_atencion', 'Lugar de atención en emergencia'],
      ['atendido_salud', '¿Atendido por el sector salud? Frecuencia'],
      ['diagnostico', 'Diagnóstico médico (¿cuál?)'],
      ['discapacidad', 'Tipo de discapacidad (si aplica)'],
      ['terapias', '¿Asiste a terapias? ¿Cuáles? Frecuencia'],
      ['tratamiento', '¿Recibe tratamiento médico? (¿cuál?)'],
      ['medicamentos', '¿Consume medicamentos? Nombre, frecuencia y horario', 'area'],
      ['productos_apoyo', '¿Productos de apoyo? ¿Cuáles? (silla, bastón, audífonos…)', 'area'],
    ],
  },
  entorno_hogar: {
    titulo: '3. Entorno hogar',
    campos: [
      ['nombre_madre', 'Nombre de la madre'], ['ocupacion_madre', 'Ocupación de la madre'], ['nivel_madre', 'Nivel educativo de la madre'],
      ['nombre_padre', 'Nombre del padre'], ['ocupacion_padre', 'Ocupación del padre'], ['nivel_padre', 'Nivel educativo del padre'],
      ['nombre_cuidador', 'Nombre del cuidador'], ['parentesco_cuidador', 'Parentesco con el estudiante'],
      ['nivel_cuidador', 'Nivel educativo del cuidador'], ['telefono_cuidador', 'Teléfono / correo del cuidador'],
      ['num_hermanos', 'N.º de hermanos'], ['lugar_ocupa', 'Lugar que ocupa'],
      ['personas_vive', 'Personas con quien vive'], ['apoyan_crianza', '¿Quiénes apoyan la crianza?'],
      ['bajo_proteccion', '¿Está bajo protección? (Sí/No)'], ['subsidio', '¿Recibe algún subsidio? ¿Cuál?'],
    ],
  },
  entorno_educativo: {
    titulo: '4. Entorno educativo (trayectoria)',
    campos: [
      ['vinculado_otra_ie', '¿Vinculado antes a otra IE / fundación? ¿Cuáles?'],
      ['ultimo_grado', 'Último grado cursado'], ['aprobo', '¿Aprobó? (Sí/No)'],
      ['observaciones', 'Observaciones (motivos de cambio de IE o modalidad)', 'area'],
      ['recibe_informe', '¿Recibe informe pedagógico? ¿De qué institución?'],
      ['programas_complementarios', '¿Asiste a programas complementarios? ¿Cuáles? (deporte, danza, música…)'],
      ['ie_matricula', 'IE en la que se matricula'], ['sede_matricula', 'Sede'],
      ['transporte', 'Medio de transporte a la institución'],
      ['distancia', 'Distancia IE–hogar (tiempo)'],
    ],
  },
};
const GRUPOS = Object.keys(CAMPOS);
const vacio = {
  nombres: '', documento_tipo: 'TI', documento_numero: '', grado: '', fecha_nacimiento: '',
  identificacion: {}, entorno_personal: {}, entorno_salud: {}, entorno_hogar: {}, entorno_educativo: {},
};

export default function EstudianteForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const editable = ['docente', 'psicoorientador', 'administrador', 'superadmin'].includes(usuario.rol);
  const [form, setForm] = useState(vacio);
  const [piars, setPiars] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => {
    if (id) {
      api.get(`/estudiantes/${id}`).then((e) => setForm({
        ...vacio, ...e,
        fecha_nacimiento: e.fecha_nacimiento ? e.fecha_nacimiento.slice(0, 10) : '',
        identificacion: e.identificacion || {}, entorno_personal: e.entorno_personal || {},
        entorno_salud: e.entorno_salud || {}, entorno_hogar: e.entorno_hogar || {},
        entorno_educativo: e.entorno_educativo || {},
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
    const p = await api.post('/piar', { estudiante_id: Number(id), periodo: String(new Date().getFullYear()) });
    navigate(`/piar/${p.id}`);
  }

  function Grupo({ grupo }) {
    const def = CAMPOS[grupo];
    return (
      <div className="card">
        <h2>{def.titulo}</h2>
        <div className="fila" style={{ flexWrap: 'wrap' }}>
          {def.campos.map(([k, label, tipo]) => (
            <div className="campo" key={k} style={tipo === 'area' ? { flexBasis: '100%' } : { flexBasis: '31%' }}>
              <label>{label}</label>
              {tipo === 'area'
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/estudiantes" className="btn sec sm">← Volver</Link>
        {id && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" className="btn sec sm" onClick={() => api.abrirPdf(`/informes/estudiante/${id}/pdf`)}>Imprimir Anexo 1</button>
            <button type="button" className="btn sec sm" title="Descargar Anexo 1" onClick={() => api.descargarPdf(`/informes/estudiante/${id}/pdf`, 'Anexo1.pdf')}>↓</button>
          </div>
        )}
      </div>
      <h2 style={{ color: 'var(--gris-700)', marginTop: 12 }}>
        {id ? form.nombres : 'Nuevo estudiante'} — Anexo 1 (Información general del estudiante)
      </h2>
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
                <option>RC</option><option>TI</option><option>CC</option><option>PEP</option><option>PPT</option><option>Otro</option>
              </select></div>
            <div className="campo"><label>N.º de identificación</label>
              <input value={form.documento_numero || ''} onChange={(e) => set('documento_numero', e.target.value)} disabled={!editable} /></div>
            <div className="campo"><label>Grado actual</label>
              <input value={form.grado || ''} onChange={(e) => set('grado', e.target.value)} disabled={!editable} /></div>
            <div className="campo"><label>Fecha de nacimiento</label>
              <input type="date" value={form.fecha_nacimiento || ''} onChange={(e) => set('fecha_nacimiento', e.target.value)} disabled={!editable} /></div>
          </div>
        </div>

        {GRUPOS.map((g) => <Grupo key={g} grupo={g} />)}

        {editable && <button className="btn">Guardar Anexo 1</button>}
      </form>

      {id && (
        <div className="card" style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>PIAR del estudiante (por año, con sus 4 periodos)</h2>
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
