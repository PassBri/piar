import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

// Escala el logo a máx. 300px y lo guarda como PNG
function procesarLogo(file, cb) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const max = 300;
      const escala = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * escala); const h = Math.round(img.height * escala);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      cb(canvas.toDataURL('image/png'));
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

export default function MiColegio() {
  const { usuario } = useAuth();
  const esSuper = usuario.rol === 'superadmin';
  const [instituciones, setInstituciones] = useState([]);
  const [instId, setInstId] = useState('');
  const [inst, setInst] = useState(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => {
    if (esSuper) api.get('/geografia/instituciones').then(setInstituciones).catch(() => {});
  }, [esSuper]);

  function cargar(id) {
    const q = id ? `?id=${id}` : '';
    api.get(`/geografia/mi-institucion${q}`).then(setInst).catch((e) => setError(e.message));
  }
  useEffect(() => { if (!esSuper) cargar(); }, [esSuper]);
  useEffect(() => { if (esSuper && instId) cargar(instId); }, [instId]);

  async function guardar(e) {
    e.preventDefault();
    setError(''); setOk('');
    try {
      const saved = await api.put(`/geografia/instituciones/${inst.id}/datos`, {
        nombre: inst.nombre, nit: inst.nit, logo: inst.logo, sede: inst.sede,
      });
      setInst({ ...inst, ...saved });
      setOk('Datos del colegio guardados.');
    } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <h1>Datos del colegio</h1>
      <p style={{ color: 'var(--gris-600)', fontSize: 14, marginTop: 0 }}>
        Logo, nombre y NIT del colegio. Aparecen en el encabezado de los informes.
      </p>
      {error && <div className="mensaje-error">{error}</div>}
      {ok && <div style={{ color: 'var(--ok)', fontSize: 14, margin: '6px 0' }}>{ok}</div>}

      {esSuper && (
        <div className="card">
          <div className="campo" style={{ maxWidth: 360, marginBottom: 0 }}>
            <label>Colegio</label>
            <select value={instId} onChange={(e) => setInstId(e.target.value)}>
              <option value="">— Elegir colegio —</option>
              {instituciones.map((i) => <option key={i.id} value={i.id}>{i.nombre}</option>)}
            </select>
          </div>
        </div>
      )}

      {inst && (
        <form className="card" onSubmit={guardar} style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="foto-anexo" style={{ width: 130 }}>
              {inst.logo
                ? <img src={inst.logo} alt="Logo" style={{ width: 120, height: 120, objectFit: 'contain', border: '1px solid var(--gris-200)', borderRadius: 8, background: '#fff' }} />
                : <span style={{ width: 120, height: 120 }}>Logo</span>}
              <div className="foto-acciones" style={{ marginTop: 8 }}>
                <label className="btn sec sm" style={{ cursor: 'pointer' }}>
                  {inst.logo ? 'Cambiar' : 'Subir logo'}
                  <input type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={(e) => e.target.files[0] && procesarLogo(e.target.files[0], (d) => setInst({ ...inst, logo: d }))} />
                </label>
                {inst.logo && <button type="button" className="btn sec sm" onClick={() => setInst({ ...inst, logo: '' })}>Quitar</button>}
              </div>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div className="campo"><label>Nombre del colegio</label>
              <input value={inst.nombre || ''} onChange={(e) => setInst({ ...inst, nombre: e.target.value })} required /></div>
            <div className="campo"><label>NIT</label>
              <input value={inst.nit || ''} onChange={(e) => setInst({ ...inst, nit: e.target.value })} placeholder="Ej. 800123456-7" /></div>
            <div className="campo"><label>Sede principal</label>
              <input value={inst.sede || ''} onChange={(e) => setInst({ ...inst, sede: e.target.value })} /></div>
            <div style={{ fontSize: 13, color: 'var(--gris-500)', marginBottom: 10 }}>
              {inst.municipio_nombre && `${inst.municipio_nombre}, ${inst.departamento_nombre}`}
            </div>
            <button className="btn">Guardar datos</button>
          </div>
        </form>
      )}
    </div>
  );
}
