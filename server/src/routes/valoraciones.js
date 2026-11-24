import { Router } from 'express';
import { query } from '../db.js';
import { autenticar, autorizar } from '../middleware/auth.js';
import { auditar } from '../lib/auditoria.js';

const router = Router();
router.use(autenticar);

// GET /api/valoraciones?piar_id=  — valoración por área y periodo
router.get('/', async (req, res, next) => {
  try {
    const { piar_id } = req.query;
    const { rows } = await query(
      `SELECT v.*, a.nombre AS area_nombre FROM valoracion_area v
       JOIN area a ON a.id = v.area_id
       WHERE v.piar_id = $1 ORDER BY a.nombre, v.periodo`,
      [piar_id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// PUT /api/valoraciones — crear o actualizar la valoración de un área en un periodo
router.put('/', autorizar('docente', 'psicoorientador', 'administrador', 'coordinador', 'rector', 'superadmin'), async (req, res, next) => {
  try {
    const { piar_id, area_id, periodo, desempeno, observacion } = req.body;
    if (!piar_id || !area_id || !periodo) {
      return res.status(400).json({ error: 'PIAR, área y periodo son obligatorios.' });
    }
    const { rows } = await query(
      `INSERT INTO valoracion_area (piar_id, area_id, periodo, desempeno, observacion)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (piar_id, area_id, periodo) DO UPDATE SET
         desempeno = EXCLUDED.desempeno, observacion = EXCLUDED.observacion
       RETURNING *`,
      [piar_id, area_id, periodo, desempeno || null, observacion || null]
    );
    await auditar(req, { entidad: 'valoracion', entidad_id: rows[0].id, piar_id, accion: 'editar', descripcion: `Registró el desempeño de un área (${Number(periodo) === 5 ? 'Promoción' : `Periodo ${periodo}`})` });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

export default router;
