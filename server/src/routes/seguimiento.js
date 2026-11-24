import { Router } from 'express';
import { query } from '../db.js';
import { autenticar, autorizar } from '../middleware/auth.js';

const router = Router();
router.use(autenticar);

// POST /api/seguimientos  (registrar seguimiento de un ajuste)
router.post('/', autorizar('docente', 'psicoorientador', 'administrador', 'coordinador', 'rector'), async (req, res, next) => {
  try {
    const { ajuste_id, fecha, periodo, impacto, decision } = req.body;
    if (!ajuste_id) return res.status(400).json({ error: 'El ajuste es obligatorio.' });
    const { rows } = await query(
      `INSERT INTO seguimiento (ajuste_id, fecha, periodo, impacto, decision, registrado_por)
       VALUES ($1, COALESCE($2, CURRENT_DATE), $3, $4, $5, $6) RETURNING *`,
      [ajuste_id, fecha || null, periodo, impacto, decision || 'mantener', req.usuario.id]
    );
    // Si la decisión es retirar, marcar el ajuste como retirado
    if ((decision || 'mantener') === 'retirar') {
      await query('UPDATE ajuste_razonable SET retirado = TRUE WHERE id = $1', [ajuste_id]);
    }
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// GET /api/seguimientos/pendientes  (ajustes con menos de 3 seguimientos en el periodo)
router.get('/pendientes', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT a.id AS ajuste_id, a.descripcion, p.id AS piar_id, p.periodo,
              e.nombres AS estudiante, COUNT(s.id) AS seguimientos
       FROM ajuste_razonable a
       JOIN piar p ON p.id = a.piar_id
       JOIN estudiante e ON e.id = p.estudiante_id
       LEFT JOIN seguimiento s ON s.ajuste_id = a.id
       WHERE e.institucion_id = $1 AND a.retirado = FALSE AND p.estado = 'vigente'
       GROUP BY a.id, a.descripcion, p.id, p.periodo, e.nombres
       HAVING COUNT(s.id) < 3
       ORDER BY seguimientos ASC, e.nombres`,
      [req.usuario.institucion_id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

export default router;
