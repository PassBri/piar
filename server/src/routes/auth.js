import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { config } from '../config.js';
import { autenticar } from '../middleware/auth.js';

const router = Router();

// Límite de intentos de ingreso (protección contra fuerza bruta)
const intentos = new Map(); // correo -> { n, hasta }
const MAX_INTENTOS = 5;
const BLOQUEO_MS = 15 * 60 * 1000; // 15 minutos

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { correo, clave } = req.body;
    if (!correo || !clave) {
      return res.status(400).json({ error: 'Correo y clave son obligatorios.' });
    }
    const clave_correo = correo.toLowerCase().trim();
    const reg = intentos.get(clave_correo);
    if (reg && reg.hasta > Date.now()) {
      const min = Math.ceil((reg.hasta - Date.now()) / 60000);
      return res.status(429).json({ error: `Demasiados intentos. Intenta de nuevo en ${min} minuto(s).` });
    }
    const { rows } = await query(
      'SELECT id, nombres, correo, clave_hash, rol, institucion_id, activo FROM usuario WHERE correo = $1',
      [clave_correo]
    );
    const usuario = rows[0];
    const fallar = () => {
      const r = intentos.get(clave_correo) || { n: 0, hasta: 0 };
      r.n += 1;
      if (r.n >= MAX_INTENTOS) { r.hasta = Date.now() + BLOQUEO_MS; r.n = 0; }
      intentos.set(clave_correo, r);
    };
    if (!usuario || !usuario.activo) {
      fallar();
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }
    const ok = await bcrypt.compare(clave, usuario.clave_hash);
    if (!ok) {
      fallar();
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }
    intentos.delete(clave_correo); // ingreso correcto: limpia el contador
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
