import { Router } from 'express';
import { query } from '../db.js';
import { autenticar, autorizar } from '../middleware/auth.js';

const router = Router();
router.use(autenticar);

// ---------- Departamentos ----------
router.get('/departamentos', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM departamento ORDER BY nombre');
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/departamentos', autorizar('superadmin', 'administrador'), async (req, res, next) => {
  try {
    const { nombre, codigo_dane } = req.body;
    const { rows } = await query(
      'INSERT INTO departamento (nombre, codigo_dane) VALUES ($1,$2) RETURNING *',
      [nombre, codigo_dane || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// ---------- Municipios (por departamento) ----------
router.get('/municipios', async (req, res, next) => {
  try {
    const { departamento_id } = req.query;
    const { rows } = await query(
      `SELECT m.*, d.nombre AS departamento_nombre FROM municipio m
       JOIN departamento d ON d.id = m.departamento_id
       WHERE ($1::int IS NULL OR m.departamento_id = $1)
       ORDER BY m.nombre`,
      [departamento_id || null]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/municipios', autorizar('superadmin', 'administrador'), async (req, res, next) => {
  try {
    const { departamento_id, nombre, codigo_dane } = req.body;
    const { rows } = await query(
      'INSERT INTO municipio (departamento_id, nombre, codigo_dane) VALUES ($1,$2,$3) RETURNING *',
      [departamento_id, nombre, codigo_dane || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// ---------- Instituciones (por municipio) ----------
router.get('/instituciones', async (req, res, next) => {
  try {
    const { municipio_id } = req.query;
    const { rows } = await query(
      `SELECT i.*, m.nombre AS municipio_nombre, d.nombre AS departamento_nombre
       FROM institucion i
       LEFT JOIN municipio m ON m.id = i.municipio_id
       LEFT JOIN departamento d ON d.id = m.departamento_id
       WHERE ($1::int IS NULL OR i.municipio_id = $1)
       ORDER BY i.nombre`,
      [municipio_id || null]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/instituciones', autorizar('superadmin', 'administrador'), async (req, res, next) => {
  try {
    const { municipio_id, nombre, sede, codigo_dane } = req.body;
    const { rows } = await query(
      'INSERT INTO institucion (municipio_id, nombre, sede, codigo_dane) VALUES ($1,$2,$3,$4) RETURNING *',
      [municipio_id || null, nombre, sede || null, codigo_dane || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

export default router;
