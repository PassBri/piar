import { Router } from 'express';
import { query } from '../db.js';
import { autenticar } from '../middleware/auth.js';

const router = Router();
router.use(autenticar);

// GET /api/catalogo?tipo=   (ajustes sugeridos del MEN)
router.get('/', async (req, res, next) => {
  try {
    const { tipo } = req.query;
    const { rows } = await query(
      `SELECT * FROM catalogo_ajuste WHERE ($1::text IS NULL OR tipo = $1::tipo_ajuste)
       ORDER BY tipo, id`,
      [tipo || null]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

export default router;
