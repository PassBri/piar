import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { autenticar, autorizar } from '../middleware/auth.js';

const router = Router();
router.use(autenticar);

// GET /api/usuarios  (de la institución; solo rector/administrador)
router.get('/', autorizar('administrador', 'rector'), async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, nombres, correo, rol, activo FROM usuario
       WHERE institucion_id = $1 ORDER BY rol, nombres`,
      [req.usuario.institucion_id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/usuarios  (crear usuario)
router.post('/', autorizar('administrador', 'rector'), async (req, res, next) => {
  try {
    const { nombres, correo, clave, rol, institucion_id } = req.body;
    if (!nombres || !correo || !clave || !rol) {
      return res.status(400).json({ error: 'Nombres, correo, clave y rol son obligatorios.' });
    }
    const hash = await bcrypt.hash(clave, 10);
    const inst = req.usuario.rol === 'administrador' ? (institucion_id || req.usuario.institucion_id)
                                                     : req.usuario.institucion_id;
    const { rows } = await query(
      `INSERT INTO usuario (institucion_id, nombres, correo, clave_hash, rol)
       VALUES ($1,$2,$3,$4,$5) RETURNING id, nombres, correo, rol, activo`,
      [inst, nombres, correo.toLowerCase().trim(), hash, rol]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'El correo ya está registrado.' });
    next(err);
  }
});

export default router;
