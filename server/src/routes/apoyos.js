import { Router } from 'express';
import { query } from '../db.js';
import { autenticar, autorizar } from '../middleware/auth.js';
import { auditar } from '../lib/auditoria.js';
import { negarAcceso, accesoEstudiante, accesoPiar } from '../lib/acceso.js';

const router = Router();
router.use(autenticar);
const GESTION = ['docente', 'psicoorientador', 'coordinador', 'rector', 'administrador', 'superadmin'];

// ---------- Pruebas de Estado (adaptaciones ICFES/Saber) ----------
router.get('/pruebas-estado', async (req, res, next) => {
  try {
    const { estudiante_id } = req.query;
    if (!estudiante_id) return res.json([]);
    const neg = negarAcceso(req.usuario, await accesoEstudiante(estudiante_id));
    if (neg) return res.status(neg.status).json({ error: neg.error });
    const { rows } = await query('SELECT * FROM prueba_estado WHERE estudiante_id=$1 ORDER BY fecha DESC, id DESC', [estudiante_id]);
    res.json(rows);
  } catch (err) { next(err); }
});
router.post('/pruebas-estado', autorizar(...GESTION), async (req, res, next) => {
  try {
    const { estudiante_id, tipo, apoyos, otros_apoyos, observaciones } = req.body;
    const neg = negarAcceso(req.usuario, await accesoEstudiante(estudiante_id));
    if (neg) return res.status(neg.status).json({ error: neg.error });
    const { rows } = await query(
      `INSERT INTO prueba_estado (estudiante_id, tipo, apoyos, otros_apoyos, observaciones)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [estudiante_id, tipo || null, JSON.stringify(apoyos || []), otros_apoyos || null, observaciones || null]);
    await auditar(req, { entidad: 'prueba_estado', entidad_id: rows[0].id, estudiante_id: Number(estudiante_id), accion: 'crear', descripcion: 'Registró apoyos para pruebas de Estado' });
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// ---------- Remisiones y articulación intersectorial ----------
router.get('/remisiones', async (req, res, next) => {
  try {
    const { estudiante_id } = req.query;
    if (!estudiante_id) return res.json([]);
    const neg = negarAcceso(req.usuario, await accesoEstudiante(estudiante_id));
    if (neg) return res.status(neg.status).json({ error: neg.error });
    const { rows } = await query('SELECT * FROM remision WHERE estudiante_id=$1 ORDER BY fecha DESC, id DESC', [estudiante_id]);
    res.json(rows);
  } catch (err) { next(err); }
});
router.post('/remisiones', autorizar(...GESTION), async (req, res, next) => {
  try {
    const { estudiante_id, sector, entidad, motivo } = req.body;
    const neg = negarAcceso(req.usuario, await accesoEstudiante(estudiante_id));
    if (neg) return res.status(neg.status).json({ error: neg.error });
    const { rows } = await query(
      `INSERT INTO remision (estudiante_id, sector, entidad, motivo, creado_por) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [estudiante_id, sector || null, entidad || null, motivo || null, req.usuario.id]);
    await auditar(req, { entidad: 'remision', entidad_id: rows[0].id, estudiante_id: Number(estudiante_id), accion: 'crear', descripcion: `Registró una remisión (${sector || 'sector'})` });
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});
router.put('/remisiones/:id', autorizar(...GESTION), async (req, res, next) => {
  try {
    const { estado, respuesta } = req.body;
    const prev = await query('SELECT estudiante_id FROM remision WHERE id=$1', [req.params.id]);
    if (!prev.rows[0]) return res.status(404).json({ error: 'Remisión no encontrada.' });
    const neg = negarAcceso(req.usuario, await accesoEstudiante(prev.rows[0].estudiante_id));
    if (neg) return res.status(neg.status).json({ error: neg.error });
    const { rows } = await query(
      'UPDATE remision SET estado=COALESCE($1,estado), respuesta=$2 WHERE id=$3 RETURNING *',
      [estado || null, respuesta || null, req.params.id]);
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ---------- Promoción, egreso y titulación (por PIAR) ----------
router.get('/promocion/:piarId', async (req, res, next) => {
  try {
    const neg = negarAcceso(req.usuario, await accesoPiar(req.params.piarId));
    if (neg) return res.status(neg.status).json({ error: neg.error });
    const { rows } = await query('SELECT * FROM promocion WHERE piar_id=$1', [req.params.piarId]);
    res.json(rows[0] || null);
  } catch (err) { next(err); }
});
router.put('/promocion/:piarId', autorizar(...GESTION), async (req, res, next) => {
  try {
    const neg = negarAcceso(req.usuario, await accesoPiar(req.params.piarId));
    if (neg) return res.status(neg.status).json({ error: neg.error });
    const { decision, grado_cursado, grado_siguiente, criterios, observaciones } = req.body;
    const { rows } = await query(
      `INSERT INTO promocion (piar_id, decision, grado_cursado, grado_siguiente, criterios, observaciones)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (piar_id) DO UPDATE SET decision=EXCLUDED.decision, grado_cursado=EXCLUDED.grado_cursado,
         grado_siguiente=EXCLUDED.grado_siguiente, criterios=EXCLUDED.criterios, observaciones=EXCLUDED.observaciones
       RETURNING *`,
      [req.params.piarId, decision || null, grado_cursado || null, grado_siguiente || null, criterios || null, observaciones || null]);
    await auditar(req, { entidad: 'promocion', entidad_id: rows[0].id, piar_id: Number(req.params.piarId), accion: 'editar', descripcion: `Registró la decisión de promoción (${decision || '—'})` });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

export default router;
