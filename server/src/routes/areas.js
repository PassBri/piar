import { Router } from 'express';
import { query } from '../db.js';
import { autenticar, autorizar } from '../middleware/auth.js';
import { auditar } from '../lib/auditoria.js';

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
router.post('/', autorizar('administrador', 'rector', 'coordinador', 'psicoorientador', 'superadmin'), async (req, res, next) => {
  try {
    const { nombre, institucion_id } = req.body;
    const inst = req.usuario.rol === 'superadmin' ? (institucion_id || null) : req.usuario.institucion_id;
    if (!nombre || !inst) return res.status(400).json({ error: 'Nombre de la asignatura e institución son obligatorios.' });
    // Si ya existe esa área (ignorando mayúsculas y espacios), la devuelve en vez de duplicarla.
    const { rows: existe } = await query(
      'SELECT * FROM area WHERE institucion_id = $1 AND lower(btrim(nombre)) = lower(btrim($2)) LIMIT 1',
      [inst, nombre]
    );
    if (existe[0]) return res.json(existe[0]);
    const { rows } = await query(
      'INSERT INTO area (institucion_id, nombre) VALUES ($1,$2) RETURNING *',
      [inst, nombre]
    );
    await auditar(req, { entidad: 'area', entidad_id: rows[0].id, accion: 'crear', descripcion: `Agregó la asignatura "${nombre}"` });
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

export default router;
