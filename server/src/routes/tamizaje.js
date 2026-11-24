import { Router } from 'express';
import { query } from '../db.js';
import { autenticar, autorizar } from '../middleware/auth.js';
import { auditar } from '../lib/auditoria.js';
import { negarAcceso, accesoEstudiante } from '../lib/acceso.js';

const router = Router();
router.use(autenticar);

// GET /api/tamizaje?estudiante_id=
router.get('/', async (req, res, next) => {
  try {
    const { estudiante_id } = req.query;
    if (!estudiante_id) return res.json([]);
    const neg = negarAcceso(req.usuario, await accesoEstudiante(estudiante_id));
    if (neg) return res.status(neg.status).json({ error: neg.error });
    const { rows } = await query(
      `SELECT t.*, u.nombres AS aplicado_nombre FROM tamizaje t
       LEFT JOIN usuario u ON u.id = t.aplicado_por
       WHERE t.estudiante_id = $1 ORDER BY t.fecha DESC, t.id DESC`, [estudiante_id]);
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/tamizaje  — guarda una aplicación de las escalas
router.post('/', autorizar('docente', 'psicoorientador', 'coordinador', 'rector', 'administrador', 'superadmin'), async (req, res, next) => {
  try {
    const { estudiante_id, respuestas, dominios_alerta, observaciones } = req.body;
    if (!estudiante_id) return res.status(400).json({ error: 'Falta el estudiante.' });
    const neg = negarAcceso(req.usuario, await accesoEstudiante(estudiante_id));
    if (neg) return res.status(neg.status).json({ error: neg.error });
    const { rows } = await query(
      `INSERT INTO tamizaje (estudiante_id, aplicado_por, respuestas, dominios_alerta, observaciones)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [estudiante_id, req.usuario.id, respuestas || {}, JSON.stringify(dominios_alerta || []), observaciones || null]
    );
    await auditar(req, { entidad: 'tamizaje', entidad_id: rows[0].id, estudiante_id: Number(estudiante_id), accion: 'crear', descripcion: 'Aplicó el tamizaje de detección en el aula' });
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

export default router;
