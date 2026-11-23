import { Router } from 'express';
import { query } from '../db.js';
import { autenticar, autorizar } from '../middleware/auth.js';

const router = Router();
router.use(autenticar);

// GET /api/piar?estudiante_id=  (lista PIAR de un estudiante)
router.get('/', async (req, res, next) => {
  try {
    const { estudiante_id } = req.query;
    const { rows } = await query(
      `SELECT p.*, e.nombres AS estudiante_nombre, e.grado
       FROM piar p JOIN estudiante e ON e.id = p.estudiante_id
       WHERE ($1::int IS NULL OR p.estudiante_id = $1)
         AND e.institucion_id = $2
       ORDER BY p.creado_en DESC`,
      [estudiante_id || null, req.usuario.institucion_id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/piar/:id  (detalle con ajustes y acta)
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT p.*, e.nombres AS estudiante_nombre, e.grado, e.documento_numero
       FROM piar p JOIN estudiante e ON e.id = p.estudiante_id WHERE p.id = $1`,
      [req.params.id]
    );
    const piar = rows[0];
    if (!piar) return res.status(404).json({ error: 'PIAR no encontrado.' });
    const ajustes = await query(
      `SELECT a.*, ar.nombre AS area_nombre FROM ajuste_razonable a
       LEFT JOIN area ar ON ar.id = a.area_id WHERE a.piar_id = $1 ORDER BY a.id`,
      [req.params.id]
    );
    const acta = await query('SELECT * FROM acta_acuerdo WHERE piar_id = $1', [req.params.id]);
    res.json({ ...piar, ajustes: ajustes.rows, acta: acta.rows[0] || null });
  } catch (err) { next(err); }
});

// POST /api/piar  (crear PIAR)
router.post('/', autorizar('docente', 'psicoorientador', 'administrador'), async (req, res, next) => {
  try {
    const { estudiante_id, periodo, valoracion, aspectos_generales, recomendaciones_pmi } = req.body;
    if (!estudiante_id || !periodo) {
      return res.status(400).json({ error: 'Estudiante y periodo son obligatorios.' });
    }
    const { rows } = await query(
      `INSERT INTO piar (estudiante_id, periodo, valoracion, aspectos_generales, recomendaciones_pmi, creado_por)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [estudiante_id, periodo, valoracion, aspectos_generales, recomendaciones_pmi || {}, req.usuario.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// PUT /api/piar/:id
router.put('/:id', autorizar('docente', 'psicoorientador', 'administrador'), async (req, res, next) => {
  try {
    const { periodo, valoracion, aspectos_generales, recomendaciones_pmi, estado } = req.body;
    const { rows } = await query(
      `UPDATE piar SET periodo=$1, valoracion=$2, aspectos_generales=$3,
         recomendaciones_pmi=$4, estado=COALESCE($5,estado), actualizado_en=now()
       WHERE id=$6 RETURNING *`,
      [periodo, valoracion, aspectos_generales, recomendaciones_pmi || {}, estado || null, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'PIAR no encontrado.' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

export default router;
