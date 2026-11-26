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
    const secciones = Array.isArray(req.body.secciones) ? req.body.secciones.filter((s) => typeof s === 'string') : [];
    if (existe[0]) {
      if (secciones.length) { const { rows: up } = await query('UPDATE area SET secciones=$1 WHERE id=$2 RETURNING *', [secciones, existe[0].id]); return res.json(up[0]); }
      return res.json(existe[0]);
    }
    const { rows } = await query(
      'INSERT INTO area (institucion_id, nombre, secciones) VALUES ($1,$2,$3) RETURNING *',
      [inst, nombre, secciones]
    );
    await auditar(req, { entidad: 'area', entidad_id: rows[0].id, accion: 'crear', descripcion: `Agregó la asignatura "${nombre}"` });
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

const GESTIONA_AREA = ['administrador', 'rector', 'coordinador', 'superadmin'];

// PUT /api/areas/:id  (renombrar área)
router.put('/:id', autorizar(...GESTIONA_AREA), async (req, res, next) => {
  try {
    const nombre = (req.body.nombre || '').trim();
    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio.' });
    const esSuper = req.usuario.rol === 'superadmin';
    const actual = await query('SELECT * FROM area WHERE id=$1', [req.params.id]);
    if (!actual.rows[0]) return res.status(404).json({ error: 'Área no encontrada.' });
    if (!esSuper && actual.rows[0].institucion_id !== req.usuario.institucion_id) {
      return res.status(403).json({ error: 'No puedes editar áreas de otra institución.' });
    }
    // Evita chocar con otra área de la misma institución (ignorando mayúsculas/espacios).
    const dup = await query(
      'SELECT 1 FROM area WHERE institucion_id=$1 AND lower(btrim(nombre))=lower(btrim($2)) AND id<>$3',
      [actual.rows[0].institucion_id, nombre, req.params.id]
    );
    if (dup.rows[0]) return res.status(409).json({ error: 'Ya existe un área con ese nombre.' });
    const secciones = Array.isArray(req.body.secciones) ? req.body.secciones.filter((s) => typeof s === 'string') : null;
    const { rows } = secciones
      ? await query('UPDATE area SET nombre=$1, secciones=$2 WHERE id=$3 RETURNING *', [nombre, secciones, req.params.id])
      : await query('UPDATE area SET nombre=$1 WHERE id=$2 RETURNING *', [nombre, req.params.id]);
    await auditar(req, { entidad: 'area', entidad_id: Number(req.params.id), accion: 'editar', descripcion: `Renombró el área a "${nombre}"` });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/areas/:id  (eliminar área; bloquea si está en uso en ajustes)
router.delete('/:id', autorizar(...GESTIONA_AREA), async (req, res, next) => {
  try {
    const esSuper = req.usuario.rol === 'superadmin';
    const actual = await query('SELECT * FROM area WHERE id=$1', [req.params.id]);
    if (!actual.rows[0]) return res.status(404).json({ error: 'Área no encontrada.' });
    if (!esSuper && actual.rows[0].institucion_id !== req.usuario.institucion_id) {
      return res.status(403).json({ error: 'No puedes eliminar áreas de otra institución.' });
    }
    const uso = await query('SELECT count(*)::int n FROM ajuste_razonable WHERE area_id=$1', [req.params.id]);
    if (uso.rows[0].n > 0) {
      return res.status(409).json({ error: `El área está en uso en ${uso.rows[0].n} ajuste(s) del PIAR. Quítala de esos registros antes de eliminarla.` });
    }
    await query('DELETE FROM area WHERE id=$1', [req.params.id]);
    await auditar(req, { entidad: 'area', entidad_id: Number(req.params.id), accion: 'eliminar', descripcion: `Eliminó el área "${actual.rows[0].nombre}"` });
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
