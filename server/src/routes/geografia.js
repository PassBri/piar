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
    const { municipio_id, nombre, sede, codigo_dane, num_periodos, usa_promocion } = req.body;
    const { rows } = await query(
      `INSERT INTO institucion (municipio_id, nombre, sede, codigo_dane, num_periodos, usa_promocion)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [municipio_id || null, nombre, sede || null, codigo_dane || null,
        Math.min(4, Math.max(1, Number(num_periodos) || 4)), usa_promocion !== false]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// GET /api/geografia/mi-institucion — datos del colegio del usuario
router.get('/mi-institucion', async (req, res, next) => {
  try {
    const id = req.query.id || req.usuario.institucion_id;
    if (!id) return res.json(null);
    const { rows } = await query(
      `SELECT i.*, m.nombre AS municipio_nombre, d.nombre AS departamento_nombre
       FROM institucion i LEFT JOIN municipio m ON m.id = i.municipio_id
       LEFT JOIN departamento d ON d.id = m.departamento_id WHERE i.id = $1`, [id]);
    res.json(rows[0] || null);
  } catch (err) { next(err); }
});

// PUT /api/geografia/instituciones/:id/datos — logo, nombre y NIT del colegio
router.put('/instituciones/:id/datos', autorizar('superadmin', 'administrador', 'rector', 'coordinador', 'psicoorientador'), async (req, res, next) => {
  try {
    if (req.usuario.rol !== 'superadmin' && Number(req.params.id) !== req.usuario.institucion_id) {
      return res.status(403).json({ error: 'Solo puede editar los datos de su propia institución.' });
    }
    const { nombre, nit, logo, sede } = req.body;
    const { rows } = await query(
      `UPDATE institucion SET nombre = COALESCE($1, nombre), nit = $2, logo = $3, sede = COALESCE($4, sede)
       WHERE id = $5 RETURNING *`,
      [nombre || null, nit || null, logo || null, sede || null, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Institución no encontrada.' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// Configuración de periodos del colegio (cuántos periodos maneja y si usa promoción)
router.put('/instituciones/:id/periodos', autorizar('superadmin', 'administrador', 'rector', 'coordinador'), async (req, res, next) => {
  try {
    const { num_periodos, usa_promocion, sistema_evaluacion } = req.body;
    // El rector solo puede configurar su propia institución
    if (req.usuario.rol === 'rector' && Number(req.params.id) !== req.usuario.institucion_id) {
      return res.status(403).json({ error: 'Solo puede configurar su propia institución.' });
    }
    const n = Math.min(4, Math.max(1, Number(num_periodos) || 4));
    const sis = ['cualitativo', 'numerico5', 'numerico10'].includes(sistema_evaluacion) ? sistema_evaluacion : null;
    const { rows } = await query(
      'UPDATE institucion SET num_periodos=$1, usa_promocion=$2, sistema_evaluacion=COALESCE($3, sistema_evaluacion) WHERE id=$4 RETURNING *',
      [n, usa_promocion !== false, sis, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Institución no encontrada.' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

export default router;
