import { Router } from 'express';
import { query } from '../db.js';
import { autenticar, autorizar } from '../middleware/auth.js';
import { auditar } from '../lib/auditoria.js';

const router = Router();
router.use(autenticar);

const ACTORES = ['familia', 'docentes', 'directivos', 'administrativos', 'pares'];
const EDITA = ['coordinador', 'rector', 'administrador', 'superadmin'];

function instDe(req) {
  return req.usuario.rol === 'superadmin' ? (req.query.institucion_id || req.body?.institucion_id || null) : req.usuario.institucion_id;
}

// GET /api/pmi-institucional?anio=&sede=&jornada=  -> los 5 actores con sus valores
router.get('/', async (req, res, next) => {
  try {
    const institucion_id = instDe(req);
    const anio = String(req.query.anio || new Date().getFullYear());
    const sede = req.query.sede || '';
    const jornada = req.query.jornada || '';
    const { rows } = await query(
      `SELECT actor, acciones, estrategias FROM pmi_institucional
       WHERE institucion_id=$1 AND anio=$2 AND sede=$3 AND jornada=$4`,
      [institucion_id, anio, sede, jornada]
    );
    const mapa = Object.fromEntries(rows.map((r) => [r.actor, r]));
    const data = ACTORES.map((a) => ({ actor: a, acciones: mapa[a]?.acciones || '', estrategias: mapa[a]?.estrategias || '' }));
    res.json({ anio, sede, jornada, actores: data });
  } catch (err) { next(err); }
});

// PUT /api/pmi-institucional  -> upsert de un actor para (anio, sede, jornada)
router.put('/', autorizar(...EDITA), async (req, res, next) => {
  try {
    const institucion_id = instDe(req);
    if (!institucion_id) return res.status(400).json({ error: 'Institución no definida.' });
    const { anio, sede = '', jornada = '', actor, acciones = '', estrategias = '' } = req.body;
    if (!anio || !ACTORES.includes(actor)) return res.status(400).json({ error: 'Datos inválidos.' });
    await query(
      `INSERT INTO pmi_institucional (institucion_id, anio, sede, jornada, actor, acciones, estrategias, actualizado_en)
       VALUES ($1,$2,$3,$4,$5,$6,$7, now())
       ON CONFLICT (institucion_id, anio, sede, jornada, actor)
       DO UPDATE SET acciones=EXCLUDED.acciones, estrategias=EXCLUDED.estrategias, actualizado_en=now()`,
      [institucion_id, String(anio), sede, jornada, actor, acciones, estrategias]
    );
    await auditar(req, { entidad: 'pmi_institucional', accion: 'editar', descripcion: `Actualizó el PMI institucional (${anio}${sede ? ' · ' + sede : ''}${jornada ? ' · ' + jornada : ''})` });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
