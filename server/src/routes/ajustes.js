import { Router } from 'express';
import { query } from '../db.js';
import { autenticar, autorizar } from '../middleware/auth.js';

const router = Router();
router.use(autenticar);

// POST /api/ajustes  (añadir ajuste razonable a un PIAR)
router.post('/', autorizar('docente', 'psicoorientador', 'administrador'), async (req, res, next) => {
  try {
    const { piar_id, area_id, objetivo, barrera, tipo, descripcion, apoyo, intensidad } = req.body;
    if (!piar_id || !barrera || !tipo || !descripcion) {
      return res.status(400).json({ error: 'PIAR, barrera, tipo y descripción son obligatorios.' });
    }
    const { rows } = await query(
      `INSERT INTO ajuste_razonable
        (piar_id, area_id, objetivo, barrera, tipo, descripcion, apoyo, intensidad)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [piar_id, area_id || null, objetivo, barrera, tipo, descripcion, apoyo, intensidad || 'intermitente']
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// PUT /api/ajustes/:id
router.put('/:id', autorizar('docente', 'psicoorientador', 'administrador'), async (req, res, next) => {
  try {
    const { area_id, objetivo, barrera, tipo, descripcion, apoyo, intensidad, retirado, justificacion_retiro } = req.body;
    const { rows } = await query(
      `UPDATE ajuste_razonable SET area_id=$1, objetivo=$2, barrera=$3, tipo=$4,
         descripcion=$5, apoyo=$6, intensidad=$7, retirado=COALESCE($8,retirado),
         justificacion_retiro=$9
       WHERE id=$10 RETURNING *`,
      [area_id || null, objetivo, barrera, tipo, descripcion, apoyo, intensidad,
       retirado, justificacion_retiro, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Ajuste no encontrado.' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/ajustes/:id
router.delete('/:id', autorizar('docente', 'psicoorientador', 'administrador'), async (req, res, next) => {
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
