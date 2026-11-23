import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { config } from '../config.js';
import { autenticar } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { correo, clave } = req.body;
    if (!correo || !clave) {
      return res.status(400).json({ error: 'Correo y clave son obligatorios.' });
    }
    const { rows } = await query(
      'SELECT id, nombres, correo, clave_hash, rol, institucion_id, activo FROM usuario WHERE correo = $1',
      [correo.toLowerCase().trim()]
    );
    const usuario = rows[0];
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }
    const ok = await bcrypt.compare(clave, usuario.clave_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }
    const payload = {
      id: usuario.id,
      nombres: usuario.nombres,
      rol: usuario.rol,
      institucion_id: usuario.institucion_id,
    };
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpires });
    res.json({ token, usuario: payload });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', autenticar, (req, res) => {
  res.json({ usuario: req.usuario });
});

export default router;
