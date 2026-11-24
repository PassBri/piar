import { Router } from 'express';
import { query } from '../db.js';
import { autenticar, autorizar } from '../middleware/auth.js';
import { auditar } from '../lib/auditoria.js';

const router = Router();
router.use(autenticar);

const GESTION = ['superadmin', 'rector', 'coordinador', 'administrador'];

// GET /api/cursos?institucion_id=  — cursos (sede/jornada/grado/grupo) de una institución
router.get('/', async (req, res, next) => {
  try {
    const esSuper = req.usuario.rol === 'superadmin';
    // Un usuario no-superadmin solo ve los cursos de su propia institución
    const inst = esSuper ? (req.query.institucion_id || null) : req.usuario.institucion_id;
    const { rows } = await query(
      `SELECT * FROM curso
       WHERE ($1::int IS NULL OR institucion_id = $1)
       ORDER BY sede, jornada, grado, grupo`,
      [inst || null]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/cursos — crear curso
router.post('/', autorizar(...GESTION), async (req, res, next) => {
  try {
    const esSuper = req.usuario.rol === 'superadmin';
    const institucion_id = esSuper ? req.body.institucion_id : req.usuario.institucion_id;
    const { sede, jornada, grado, grupo } = req.body;
    if (!institucion_id || !grado) {
      return res.status(400).json({ error: 'Institución y grado son obligatorios.' });
    }
    const { rows } = await query(
      `INSERT INTO curso (institucion_id, sede, jornada, grado, grupo)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (institucion_id, sede, jornada, grado, grupo) DO NOTHING
       RETURNING *`,
      [institucion_id, (sede || 'Principal').trim(), (jornada || 'Única').trim(), grado.trim(), (grupo || 'A').trim()]
    );
    if (!rows[0]) return res.status(409).json({ error: 'Ese curso ya existe.' });
    await auditar(req, { entidad: 'curso', entidad_id: rows[0].id, accion: 'crear', descripcion: `Creó el curso ${rows[0].sede} · ${rows[0].jornada} · ${rows[0].grado} · Grupo ${rows[0].grupo}` });
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/cursos/:id
router.delete('/:id', autorizar(...GESTION), async (req, res, next) => {
  try {
    const esSuper = req.usuario.rol === 'superadmin';
    const { rows } = await query(
      `DELETE FROM curso WHERE id = $1 AND ($2::boolean OR institucion_id = $3) RETURNING id`,
      [req.params.id, esSuper, req.usuario.institucion_id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Curso no encontrado.' });
    await auditar(req, { entidad: 'curso', entidad_id: Number(req.params.id), accion: 'eliminar', descripcion: 'Eliminó un curso' });
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
