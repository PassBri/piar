import { Router } from 'express';
import { query } from '../db.js';
import { autenticar, autorizar } from '../middleware/auth.js';

const router = Router();
router.use(autenticar);

// POST /api/ajustes  (añadir ajuste razonable a un PIAR)
router.post('/', autorizar('docente', 'psicoorientador', 'administrador', 'coordinador', 'rector'), async (req, res, next) => {
  try {
    const { piar_id, area_id, periodo, objetivo, barrera, tipo, descripcion, apoyo, intensidad, evaluacion } = req.body;
    if (!piar_id || !barrera || !tipo || !descripcion) {
      return res.status(400).json({ error: 'PIAR, barrera, tipo y descripción son obligatorios.' });
    }
    const { rows } = await query(
      `INSERT INTO ajuste_razonable
        (piar_id, area_id, periodo, objetivo, barrera, tipo, descripcion, apoyo, intensidad, evaluacion)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [piar_id, area_id || null, periodo || 1, objetivo, barrera, tipo, descripcion, apoyo, intensidad || 'intermitente', evaluacion]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// PUT /api/ajustes/:id
router.put('/:id', autorizar('docente', 'psicoorientador', 'administrador', 'coordinador', 'rector'), async (req, res, next) => {
  try {
    const { area_id, periodo, objetivo, barrera, tipo, descripcion, apoyo, intensidad, evaluacion, retirado, justificacion_retiro } = req.body;
    const { rows } = await query(
      `UPDATE ajuste_razonable SET area_id=$1, periodo=COALESCE($2,periodo), objetivo=$3, barrera=$4, tipo=$5,
         descripcion=$6, apoyo=$7, intensidad=$8, evaluacion=$9, retirado=COALESCE($10,retirado),
         justificacion_retiro=$11
       WHERE id=$12 RETURNING *`,
      [area_id || null, periodo, objetivo, barrera, tipo, descripcion, apoyo, intensidad, evaluacion,
       retirado, justificacion_retiro, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Ajuste no encontrado.' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/ajustes/:id
router.delete('/:id', autorizar('docente', 'psicoorientador', 'administrador', 'coordinador', 'rector'), async (req, res, next) => {
  try {
    const { rowCount } = await query('DELETE FROM ajuste_razonable WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Ajuste no encontrado.' });
    res.status(204).end();
  } catch (err) { next(err); }
});

// GET /api/ajustes/:id/seguimientos
router.get('/:id/seguimientos', async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM seguimiento WHERE ajuste_id=$1 ORDER BY fecha DESC', [req.params.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

export default router;
