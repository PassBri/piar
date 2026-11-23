import { Router } from 'express';
import { query } from '../db.js';
import { autenticar, autorizar } from '../middleware/auth.js';

const router = Router();
router.use(autenticar);

// GET /api/areas  (áreas de la institución del usuario)
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM area WHERE institucion_id = $1 ORDER BY nombre',
      [req.usuario.institucion_id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/areas  (agregar asignatura; disponible para el equipo pedagógico)
router.post('/', autorizar('administrador', 'rector', 'docente', 'psicoorientador', 'superadmin'), async (req, res, next) => {
  try {
    const { nombre, institucion_id } = req.body;
    const inst = req.usuario.rol === 'superadmin' ? (institucion_id || null) : req.usuario.institucion_id;
    if (!nombre || !inst) return res.status(400).json({ error: 'Nombre de la asignatura e institución son obligatorios.' });
    const { rows } = await query(
      'INSERT INTO area (institucion_id, nombre) VALUES ($1,$2) RETURNING *',
      [inst, nombre]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

export default router;
