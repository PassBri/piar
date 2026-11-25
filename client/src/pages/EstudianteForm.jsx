import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useExpediente } from '../context/ExpedienteContext.jsx';
import { NOMBRES_DISCAPACIDAD } from '../data/discapacidades.js';
import Guardado from '../components/Guardado.jsx';
import NavAnexos from '../components/NavAnexos.jsx';

// Campos oficiales del Anexo 1 (Formato PIAR - Decreto 1421). t: 'area' = textarea.
const CAMPOS = {
  diligenciamiento: {
    titulo: 'Diligenciamiento del Anexo 1',
    store: 'identificacion',
    campos: [
      ['fecha_diligenciamiento', 'Fecha de diligenciamiento (DD/MM/AAAA)'],
      ['lugar_diligenciamiento', 'Lugar de diligenciamiento'],
      ['nombre_diligencia', 'Nombre de la persona que diligencia'],
      ['rol_diligencia', 'Rol que desempeña en la SE o la IE'],
    ],
  },
  identificacion: {
    titulo: '1) Información general del estudiante',
    campos: [
      ['edad', 'Edad'],
      ['sede', 'Sede'], ['jornada', 'Jornada'], ['grado_ingreso', 'Grado al que aspira ingresar'],
      ['lugar_nacimiento', 'Lugar de nacimiento'], ['sexo', 'Sexo'],
      ['departamento_vive', 'Departamento donde vive'], ['municipio_vive', 'Municipio'],
      ['direccion', 'Dirección de vivienda'], ['barrio', 'Barrio / vereda'],
      ['telefono', 'Teléfono'], ['correo', 'Correo electrónico'],
      ['centro_proteccion', '¿Está en centro de protección? ¿Dónde?'],
      ['grupo_etnico', '¿Pertenece a un grupo étnico? ¿Cuál?'],
      ['victima_conflicto', '¿Víctima del conflicto armado? (¿registro?)', 'area'],
    ],
  },
  entorno_salud: {
    titulo: '2) Entorno salud',
    campos: [
      ['afiliacion', 'Afiliación al sistema de salud (Sí/No)'], ['eps', 'EPS'],
      ['regimen', 'Régimen (Contributivo/Subsidiado)'], ['lugar_atencion', 'Lugar de atención en emergencia'],
      ['atendido_salud', '¿Atendido por el sector salud? Frecuencia'], ['diagnostico', 'Diagnóstico médico (¿cuál?)'],
      ['discapacidad', 'Tipo de discapacidad (si aplica)'], ['terapias', '¿Asiste a terapias? ¿Cuáles? Frecuencia'],
      ['tratamiento', '¿Recibe tratamiento médico? (¿cuál?)'],
      ['medicamentos', '¿Consume medicamentos? Nombre, frecuencia y horario', 'area'],
      ['productos_apoyo', '¿Productos de apoyo? ¿Cuáles? (silla, bastón, audífonos…)', 'area'],
    ],
  },
  entorno_hogar: {
    titulo: '3) Entorno hogar',
    campos: [
      ['nombre_madre', 'Nombre de la madre'], ['ocupacion_madre', 'Ocupación de la madre'],
      ['nivel_madre', 'Nivel educativo de la madre'], ['nombre_padre', 'Nombre del padre'],
      ['ocupacion_padre', 'Ocupación del padre'], ['nivel_padre', 'Nivel educativo del padre'],
      ['nombre_cuidador', 'Nombre del cuidador'], ['parentesco_cuidador', 'Parentesco con el estudiante'],
      ['nivel_cuidador', 'Nivel educativo del cuidador'], ['telefono_cuidador', 'Teléfono / correo del cuidador'],
      ['num_hermanos', 'N.º de hermanos'], ['lugar_ocupa', 'Lugar que ocupa'],
      ['personas_vive', 'Personas con quien vive'], ['apoyan_crianza', '¿Quiénes apoyan la crianza?'],
      ['bajo_proteccion', '¿Está bajo protección? (Sí/No)'], ['subsidio', '¿Recibe algún subsidio? ¿Cuál?'],
    ],
  },
  entorno_educativo: {
    titulo: '4) Entorno educativo (trayectoria)',
    campos: [
      ['vinculado_otra_ie', '¿Vinculado antes a otra IE / fundación? ¿Cuáles?'],
      ['ultimo_grado', 'Último grado cursado'], ['aprobo', '¿Aprobó? (Sí/No)'],
      ['recibe_informe', '¿Recibe informe pedagógico? ¿De qué institución?'],
      ['observaciones', 'Observaciones (motivos de cambio de IE o modalidad)', 'area'],
      ['programas_complementarios', '¿Asiste a programas complementarios? ¿Cuáles?', 'area'],
      ['ie_matricula', 'IE en la que se matricula'], ['sede_matricula', 'Sede'],
      ['transporte', 'Medio de transporte a la institución'], ['distancia', 'Distancia IE–hogar (tiempo)'],
    ],
  },
};
const GRUPOS = Object.keys(CAMPOS);
const ROLES_RESERVADO = ['psicoorientador', 'coordinador', 'rector', 'administrador', 'superadmin'];
const vacio = {
  nombres: '', documento_tipo: 'TI', documento_numero: '', grado: '', fecha_nacimiento: '', curso_id: '', foto: '', reservado: false,
  identificacion: {}, entorno_personal: {}, entorno_salud: {}, entorno_hogar: {}, entorno_educativo: {},
};

// Recorta la foto a proporción 3:4 (tipo documento) centrada y la guarda a 300x400 JPEG
function procesarFoto(file, cb) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const DEST_W = 300, DEST_H = 400; // 3:4
      const relDest = DEST_W / DEST_H;
      const relImg = img.width / img.height;
      // Área de recorte centrada que respeta 3:4
      let sw = img.width, sh = img.height, sx = 0, sy = 0;
      if (relImg > relDest) { sw = img.height * relDest; sx = (img.width - sw) / 2; }
      else { sh = img.width / relDest; sy = (img.height - sh) / 2; }
      const canvas = document.createElement('canvas');
      canvas.width = DEST_W; canvas.height = DEST_H;
      canvas.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, DEST_W, DEST_H);
      cb(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

export default function EstudianteForm({ estudianteId: propId, embebido = false } = {}) {
  const params = useParams();
  const id = propId ?? params.id;
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const editable = ['docente', 'psicoorientador', 'administrador', 'coordinador', 'rector', 'superadmin'].includes(usuario.rol);
  const puedeReservar = ROLES_RESERVADO.includes(usuario.rol);
  const [form, setForm] = useState(vacio);
  const [piars, setPiars] = useState([]);
  const [avance, setAvance] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [autoriz, setAutoriz] = useState({ autoriza: false, nombre_acudiente: '', documento_acudiente: '', parentesco: '', fecha: '', firma_img: '' });
  const [evidencias, setEvidencias] = useState([]);
  const [tipoEvid, setTipoEvid] = useState('Estudio médico');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [conPortada, setConPortada] = useState(true);
  const pp = conPortada ? '' : '?portada=0';

  useEffect(() => {
    api.get('/cursos').then(setCursos).catch(() => {});
    if (id) {
      api.get(`/estudiantes/${id}`).then((e) => setForm({
        ...vacio, ...e, curso_id: e.curso_id || '',
        fecha_nacimiento: e.fecha_nacimiento ? e.fecha_nacimiento.slice(0, 10) : '',
        identificacion: e.identificacion || {}, entorno_personal: e.entorno_personal || {},
        entorno_salud: e.entorno_salud || {}, entorno_hogar: e.entorno_hogar || {},
        entorno_educativo: e.entorno_educativo || {},
      })).catch((err) => setError(err.message));
      api.get(`/piar?estudiante_id=${id}`).then((lista) => {
        setPiars(lista);
        if (lista[0]) api.get(`/piar/${lista[0].id}`).then((p) => setAvance(p.avance)).catch(() => {});
      }).catch(() => {});
      api.get(`/autorizacion/${id}`).then((d) => d && setAutoriz({ ...d, fecha: d.fecha ? d.fecha.slice(0, 10) : '' })).catch(() => {});
      api.get(`/evidencias/${id}`).then(setEvidencias).catch(() => {});
    }
  }, [id]);

  // Ficha del estudiante en la barra lateral mientras se edita su expediente
  const { fijarExpediente, limpiarExpediente } = useExpediente();
  useEffect(() => {
    if (id && form.nombres) fijarExpediente({
      id, nombres: form.nombres, foto: form.foto, grado: form.grado,
      curso_sede: form.curso_sede, documento: form.documento_numero,
      discapacidad: form.entorno_salud?.discapacidad, reservado: form.reservado,
    });
  }, [id, form.nombres, form.foto, form.grado, form.documento_numero, form.reservado, fijarExpediente]);
  useEffect(() => () => limpiarExpediente(), [limpiarExpediente]);

  function subirEvidencia(file) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('El archivo supera los 10 MB permitidos.'); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setError('');
        await api.post(`/evidencias/${id}`, { nombre: file.name, tipo: tipoEvid, mime: file.type, datos: reader.result });
        setEvidencias(await api.get(`/evidencias/${id}`));
        setOk('Documento adjuntado.');
      } catch (err) { setError(err.message); }
    };
    reader.readAsDataURL(file);
  }
  async function descargarEvidencia(docId, nombre) {
    try {
      const d = await api.get(`/evidencias/archivo/${docId}`);
      const a = document.createElement('a'); a.href = d.datos; a.download = d.nombre || nombre; a.click();
    } catch (err) { setError(err.message); }
  }
  async function eliminarEvidencia(docId) {
    try { await api.del(`/evidencias/archivo/${docId}`); setEvidencias(await api.get(`/evidencias/${id}`)); }
    catch (err) { setError(err.message); }
  }

  const [guardadoAut, setGuardadoAut] = useState('idle');
  const timerAut = useRef(null);
  async function guardarAutorizacion() {
    if (!id) return;
    setGuardadoAut('saving');
    try { await api.put(`/autorizacion/${id}`, autoriz); setGuardadoAut('saved'); } catch (err) { setError(err.message); setGuardadoAut('error'); }
  }
  function autosaveAut() { clearTimeout(timerAut.current); timerAut.current = setTimeout(guardarAutorizacion, 700); }
  function subirFirmaAut(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAutoriz((a) => ({ ...a, firma_img: reader.result }));
    reader.readAsDataURL(file);
  }

  function elegirCurso(cid) {
    const c = cursos.find((x) => String(x.id) === String(cid));
    setForm((f) => ({ ...f, curso_id: cid, grado: c ? c.grado : f.grado }));
  }

  const set = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));
  const setG = (grupo, campo, valor) => setForm((f) => ({ ...f, [grupo]: { ...f[grupo], [campo]: valor } }));

  const [guardado, setGuardado] = useState('idle'); // idle|saving|saved|error
  const timerRef = useRef(null);
  const guardandoRef = useRef(false);
  async function guardar() {
    if (!editable) return;
    if (!form.nombres?.trim()) return;         // el nombre es obligatorio para guardar
    if (guardandoRef.current) return;
    guardandoRef.current = true;
    setGuardado('saving'); setError('');
    try {
      const saved = id ? await api.put(`/estudiantes/${id}`, form) : await api.post('/estudiantes', form);
      setGuardado('saved');
      if (!id) navigate(`/estudiantes/${saved.id}`);
    } catch (err) { setError(err.message); setGuardado('error'); }
    finally { guardandoRef.current = false; }
  }
  function autosave() {
    if (!editable) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(guardar, 700);
  }
  async function crearPiar() {
    const p = await api.post('/piar', { estudiante_id: Number(id), periodo: String(new Date().getFullYear()) });
    navigate(`/piar/${p.id}`);
  }

  const campoInput = (grupo, k, tipo) => {
    const store = CAMPOS[grupo].store || grupo;
    if (k === 'discapacidad') {
      return (
        <select value={form[store][k] || ''} onChange={(e) => setG(store, k, e.target.value)} disabled={!editable}>
          <option value="">— Sin discapacidad / no aplica —</option>
          {NOMBRES_DISCAPACIDAD.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      );
    }
    return tipo === 'area'
      ? <textarea value={form[store][k] || ''} onChange={(e) => setG(store, k, e.target.value)} disabled={!editable} />
      : <input value={form[store][k] || ''} onChange={(e) => setG(store, k, e.target.value)} disabled={!editable} />;
  };

  function filasSeccion(grupo) {
    const def = CAMPOS[grupo];
    const rows = [<tr key={`b-${grupo}`}><td className="banda" colSpan={4}>{def.titulo}</td></tr>];
    let i = 0;
    while (i < def.campos.length) {
      const [k, label, tipo] = def.campos[i];
      if (tipo === 'area') {
        rows.push(<tr key={k}><td className="lbl">{label}</td><td className="val" colSpan={3}>{campoInput(grupo, k, tipo)}</td></tr>);
        i += 1;
      } else {
        const next = def.campos[i + 1];
        if (next && next[2] !== 'area') {
          rows.push(<tr key={k}>
            <td className="lbl">{label}</td><td className="val">{campoInput(grupo, k)}</td>
            <td className="lbl">{next[1]}</td><td className="val">{campoInput(grupo, next[0])}</td>
          </tr>);
          i += 2;
        } else {
          rows.push(<tr key={k}><td className="lbl">{label}</td><td className="val" colSpan={3}>{campoInput(grupo, k)}</td></tr>);
          i += 1;
        }
      }
    }
    return rows;
  }

  return (
    <div>
      {!embebido && (<>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/estudiantes" className="btn sec sm">← Volver</Link>
        {id && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--gris-600)', fontWeight: 400 }}>
              <input type="checkbox" checked={conPortada} style={{ width: 'auto' }} onChange={(e) => setConPortada(e.target.checked)} />
              Con portada
            </label>
            <button type="button" className="btn sec sm" onClick={() => api.abrirPdf(`/informes/estudiante/${id}/pdf${pp}`)}>Imprimir Anexo 1</button>
            <button type="button" className="btn sec sm" title="Descargar Anexo 1" onClick={() => api.descargarPdf(`/informes/estudiante/${id}/pdf${pp}`, 'Anexo1.pdf')}>↓</button>
          </div>
        )}
      </div>
      <h1 style={{ marginTop: 12 }}>{id ? form.nombres : 'Nuevo estudiante'}</h1>
      {id && (
        <NavAnexos vista="anexo1" estudianteId={id} piarId={piars[0]?.id} av={avance} />
      )}
      </>)}
      {error && <div className="mensaje-error">{error}</div>}
      {ok && <div style={{ color: 'var(--ok)', fontSize: 14, margin: '6px 0' }}>{ok}</div>}

      {!id && (
        <form className="card" onSubmit={(e) => { e.preventDefault(); guardar(); }} style={{ maxWidth: 600 }}>
          <h2 style={{ marginTop: 0 }}>Nuevo estudiante</h2>
          <p style={{ color: 'var(--gris-600)', fontSize: 13, marginTop: 0 }}>
            Registra los datos básicos. El Anexo 1 completo y los demás anexos se diligencian después, al abrir el estudiante.
          </p>
          <div className="campo"><label>Nombres y apellidos</label>
            <input value={form.nombres} onChange={(e) => set('nombres', e.target.value)} required autoFocus /></div>
          <div className="fila">
            <div className="campo" style={{ maxWidth: 120 }}><label>Tipo doc.</label>
              <select value={form.documento_tipo} onChange={(e) => set('documento_tipo', e.target.value)}>
                <option>RC</option><option>TI</option><option>CC</option><option>PEP</option><option>PPT</option><option>Otro</option>
              </select></div>
            <div className="campo"><label>N.º de documento</label>
              <input value={form.documento_numero || ''} onChange={(e) => set('documento_numero', e.target.value)} /></div>
          </div>
          <div className="fila">
            <div className="campo"><label>Grado</label>
              <input value={form.grado || ''} onChange={(e) => set('grado', e.target.value)} placeholder="Ej. 6" /></div>
            <div className="campo"><label>Curso (opcional)</label>
              <select value={form.curso_id || ''} onChange={(e) => elegirCurso(e.target.value)}>
                <option value="">— Sin asignar —</option>
                {cursos.map((c) => <option key={c.id} value={c.id}>{c.sede} · {c.jornada} · {c.grado} · Grupo {c.grupo}</option>)}
              </select></div>
          </div>
          <div className="campo"><label>Discapacidad</label>
            <select value={form.entorno_salud.discapacidad || ''} onChange={(e) => setG('entorno_salud', 'discapacidad', e.target.value)}>
              <option value="">— Sin discapacidad / no aplica —</option>
              {NOMBRES_DISCAPACIDAD.map((n) => <option key={n} value={n}>{n}</option>)}
            </select></div>
          <button className="btn" type="submit">Crear estudiante</button>
        </form>
      )}

      {id && (puedeReservar || form.reservado) && (
        <div className="config-periodos" style={{ borderColor: form.reservado ? '#c62828' : 'var(--gris-200)', background: form.reservado ? '#FBE3E3' : 'var(--gris-100)' }}>
          {puedeReservar ? (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, margin: 0 }}>
              <input type="checkbox" checked={!!form.reservado} style={{ width: 'auto' }} disabled={!editable}
                onChange={(e) => set('reservado', e.target.checked)} />
              Caso reservado — acceso restringido al equipo de orientación y directivos
            </label>
          ) : (
            <span style={{ color: '#c62828', fontWeight: 600 }}>🔒 Caso reservado — acceso restringido</span>
          )}
        </div>
      )}

      {id && (
      <form onSubmit={(e) => { e.preventDefault(); guardar(); }} onBlur={autosave}>
        <div className="formato">
          <div className="formato-head">
            <div>
              <h3>Información general del estudiante</h3>
              <div className="sub">Información para la matrícula – Anexo 1 PIAR</div>
            </div>
            <div className="formato-sello"><b>PIAR</b><span>Decreto 1421/2017</span></div>
          </div>
          <div className="anexo1-identidad">
            <div className="foto-anexo">
              {form.foto ? <img src={form.foto} alt="Foto" /> : <span>Foto</span>}
              {editable && (
                <div className="foto-acciones">
                  <label className="btn sec sm" style={{ cursor: 'pointer' }}>
                    {form.foto ? 'Cambiar' : 'Subir'}
                    <input type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={(e) => e.target.files[0] && procesarFoto(e.target.files[0], (d) => set('foto', d))} />
                  </label>
                  {form.foto && <button type="button" className="btn sec sm" onClick={() => set('foto', '')}>Quitar</button>}
                </div>
              )}
            </div>
            <table className="ftabla anexo1-datos">
              <tbody>
                <tr><td className="banda" colSpan={4}>Datos del estudiante</td></tr>
                <tr>
                  <td className="lbl">Nombres y apellidos</td>
                  <td className="val" colSpan={3}><input value={form.nombres} onChange={(e) => set('nombres', e.target.value)} disabled={!editable} required /></td>
                </tr>
                <tr>
                  <td className="lbl">Tipo de documento</td>
                  <td className="val">
                    <select value={form.documento_tipo} onChange={(e) => set('documento_tipo', e.target.value)} disabled={!editable}>
                      <option>RC</option><option>TI</option><option>CC</option><option>PEP</option><option>PPT</option><option>Otro</option>
                    </select>
                  </td>
                  <td className="lbl">N.º de identificación</td>
                  <td className="val"><input value={form.documento_numero || ''} onChange={(e) => set('documento_numero', e.target.value)} disabled={!editable} /></td>
                </tr>
                <tr>
                  <td className="lbl">Grado actual</td>
                  <td className="val"><input value={form.grado || ''} onChange={(e) => set('grado', e.target.value)} disabled={!editable} /></td>
                  <td className="lbl">Fecha de nacimiento</td>
                  <td className="val"><input type="date" value={form.fecha_nacimiento || ''} onChange={(e) => set('fecha_nacimiento', e.target.value)} disabled={!editable} /></td>
                </tr>
                <tr>
                  <td className="lbl">Curso (sede · jornada · grado · grupo)</td>
                  <td className="val" colSpan={3}>
                    <select value={form.curso_id || ''} onChange={(e) => elegirCurso(e.target.value)} disabled={!editable}>
                      <option value="">— Sin asignar —</option>
                      {cursos.map((c) => <option key={c.id} value={c.id}>{c.sede} · {c.jornada} · {c.grado} · Grupo {c.grupo}</option>)}
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <table className="ftabla">
            <tbody>
              {GRUPOS.map((g) => filasSeccion(g))}
            </tbody>
          </table>
          <div className="formato-pie">Ministerio de Educación Nacional – Viceministerio de Educación Preescolar, Básica y Media – Decreto 1421 de 2017</div>
        </div>
        {editable && <div style={{ marginTop: 8 }}><Guardado estado={guardado} /></div>}
      </form>
      )}

      {id && (
        <form className="card" onSubmit={(e) => { e.preventDefault(); guardarAutorizacion(); }} onBlur={autosaveAut} style={{ marginTop: 18, borderLeft: autoriz.autoriza ? '4px solid var(--ok)' : '4px solid #c62828' }}>
          <h2 style={{ marginTop: 0 }}>Autorización de tratamiento de datos (Habeas data · Ley 1581)</h2>
          {!autoriz.autoriza && <div className="mensaje-error" style={{ background: '#FBE3E3' }}>Falta la autorización de la familia para tratar los datos sensibles (salud y discapacidad) del estudiante.</div>}
          <p style={{ fontSize: 13, color: 'var(--gris-600)' }}>
            La familia autoriza a la institución a recolectar y tratar los datos del estudiante, incluidos los de salud y
            discapacidad, con la única finalidad de elaborar y hacer seguimiento al PIAR (Decreto 1421).
          </p>
          <div className="fila">
            <div className="campo"><label>Nombre del acudiente</label>
              <input value={autoriz.nombre_acudiente || ''} onChange={(e) => setAutoriz({ ...autoriz, nombre_acudiente: e.target.value })} /></div>
            <div className="campo"><label>Documento del acudiente</label>
              <input value={autoriz.documento_acudiente || ''} onChange={(e) => setAutoriz({ ...autoriz, documento_acudiente: e.target.value })} /></div>
            <div className="campo"><label>Parentesco</label>
              <input value={autoriz.parentesco || ''} onChange={(e) => setAutoriz({ ...autoriz, parentesco: e.target.value })} /></div>
            <div className="campo"><label>Fecha</label>
              <input type="date" value={autoriz.fecha || ''} onChange={(e) => setAutoriz({ ...autoriz, fecha: e.target.value })} /></div>
          </div>
          <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0' }}>
            <input type="checkbox" checked={!!autoriz.autoriza} style={{ width: 'auto' }}
              onChange={(e) => { setAutoriz({ ...autoriz, autoriza: e.target.checked }); autosaveAut(); }} />
            La familia autoriza el tratamiento de los datos
          </label>
          <div className="campo">
            <label>Firma del acudiente (imagen)</label>
            {autoriz.firma_img
              ? <img src={autoriz.firma_img} alt="firma" style={{ height: 46, border: '1px solid var(--gris-200)', borderRadius: 6, background: '#fff' }} />
              : <div style={{ fontSize: 13, color: 'var(--gris-500)' }}>Sin firma</div>}
            <input type="file" accept="image/*" style={{ marginTop: 6 }} onChange={(e) => subirFirmaAut(e.target.files[0])} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Guardado estado={guardadoAut} />
            <button type="button" className="btn sec" onClick={() => api.descargarPdf(`/informes/autorizacion/${id}/pdf`, 'Autorizacion_datos.pdf')}>Descargar formato ↓</button>
          </div>
        </form>
      )}

      {id && (
        <div className="card" style={{ marginTop: 18 }}>
          <h2 style={{ marginTop: 0 }}>Documentos de soporte (evidencias)</h2>
          <p style={{ color: 'var(--gris-600)', fontSize: 13, marginTop: 0 }}>
            Estudios médicos, psicológicos, diagnósticos, informes y demás soportes del estudiante (PDF o imagen, hasta 10 MB).
          </p>
          {editable && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 10 }}>
              <div className="campo" style={{ marginBottom: 0 }}>
                <label>Tipo de documento</label>
                <select value={tipoEvid} onChange={(e) => setTipoEvid(e.target.value)}>
                  <option>Estudio médico</option><option>Estudio psicológico</option>
                  <option>Diagnóstico</option><option>Informe pedagógico</option>
                  <option>Historia clínica</option><option>Terapias</option><option>Otro</option>
                </select>
              </div>
              <label className="btn sec" style={{ cursor: 'pointer' }}>
                + Subir documento
                <input type="file" accept="application/pdf,image/*" style={{ display: 'none' }}
                  onChange={(e) => { subirEvidencia(e.target.files[0]); e.target.value = ''; }} />
              </label>
            </div>
          )}
          <table>
            <thead><tr><th>Documento</th><th>Tipo</th><th>Subido por</th><th></th></tr></thead>
            <tbody>
              {evidencias.map((d) => (
                <tr key={d.id}>
                  <td>{d.nombre}</td>
                  <td><span className="badge gris">{d.tipo || '—'}</span></td>
                  <td style={{ fontSize: 13 }}>{d.subido_nombre || '—'} · {new Date(d.creado_en).toLocaleDateString('es-CO')}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button type="button" className="btn sec sm" onClick={() => descargarEvidencia(d.id, d.nombre)}>Ver / descargar</button>
                    {editable && <button type="button" className="btn sec sm" title="Eliminar" onClick={() => eliminarEvidencia(d.id)}>×</button>}
                  </td>
                </tr>
              ))}
              {evidencias.length === 0 && <tr><td colSpan="4" style={{ color: 'var(--gris-500)' }}>Sin documentos adjuntos todavía.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {id && (
        <div className="card" style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Trayectoria del estudiante (un PIAR por año, grado a grado)</h2>
            {editable && <button className="btn sm" onClick={crearPiar}>+ Nuevo PIAR (año actual)</button>}
          </div>
          <p style={{ color: 'var(--gris-600)', fontSize: 13, marginTop: 0 }}>Cada año se registra un PIAR con su grado; el historial se conserva mientras el estudiante avanza.</p>
          <table>
            <thead><tr><th>Año</th><th>Grado</th><th>Director de grupo</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {piars.map((p) => (
                <tr key={p.id}>
                  <td><b>{p.periodo}</b></td>
                  <td>{p.grado || p.grado_actual || '—'}</td>
                  <td style={{ fontSize: 13 }}>{p.director_grupo || '—'}</td>
                  <td><span className="badge gris">{p.estado}</span></td>
                  <td><Link className="btn sec sm" to={`/piar/${p.id}`}>Abrir</Link></td>
                </tr>
              ))}
              {piars.length === 0 && <tr><td colSpan="5" style={{ color: 'var(--gris-500)' }}>Sin PIAR todavía.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
