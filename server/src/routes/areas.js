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

// POST /api/areas
router.post('/', autorizar('administrador', 'rector'), async (req, res, next) => {
  try {
    const { nombre } = req.body;
    const { rows } = await query(
      'INSERT INTO area (institucion_id, nombre) VALUES ($1,$2) RETURNING *',
      [req.usuario.institucion_id, nombre]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

export default router;
