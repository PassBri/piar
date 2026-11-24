import { Router } from 'express';
import { query } from '../db.js';
import { autenticar, autorizar } from '../middleware/auth.js';
import { negarAcceso, accesoEstudiante, accesoPiar } from '../lib/acceso.js';

const router = Router();
router.use(autenticar);

// GET /api/auditoria?estudiante_id=&piar_id=&limite=  — control de cambios
router.get('/', autorizar('superadmin', 'rector', 'coordinador', 'psicoorientador', 'administrador', 'docente'), async (req, res, next) => {
  try {
    const { estudiante_id, piar_id } = req.query;
    // Confidencialidad: solo se consulta la bitácora de recursos de la propia institución (y no reservados ajenos).
    if (piar_id) {
      const neg = negarAcceso(req.usuario, await accesoPiar(piar_id));
      if (neg) return res.status(neg.status).json({ error: neg.error });
    } else if (estudiante_id) {
      const neg = negarAcceso(req.usuario, await accesoEstudiante(estudiante_id));
      if (neg) return res.status(neg.status).json({ error: neg.error });
    } else if (req.usuario.rol !== 'superadmin') {
      return res.status(400).json({ error: 'Indica el estudiante o el PIAR a consultar.' });
    }
    const limite = Math.min(500, Number(req.query.limite) || 100);
    const params = [];
    let sql = `SELECT a.*, COALESCE(u.nombres, a.usuario_nombre) AS nombre_actual
               FROM auditoria a LEFT JOIN usuario u ON u.id = a.usuario_id WHERE 1=1`;
    if (estudiante_id) { params.push(estudiante_id); sql += ` AND a.estudiante_id = $${params.length}`; }
    if (piar_id) { params.push(piar_id); sql += ` AND a.piar_id = $${params.length}`; }
    sql += ` ORDER BY a.creado_en DESC LIMIT ${limite}`;
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
});

export default router;
