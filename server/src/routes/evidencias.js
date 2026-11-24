import { Router } from 'express';
import { query } from '../db.js';
import { autenticar, autorizar } from '../middleware/auth.js';
import { auditar } from '../lib/auditoria.js';
import { negarAcceso, accesoEstudiante } from '../lib/acceso.js';

const router = Router();
router.use(autenticar);

const GESTORES = ['docente', 'psicoorientador', 'administrador', 'coordinador', 'rector', 'superadmin'];

// GET /api/evidencias/:estudianteId  (lista los documentos sin el contenido pesado)
router.get('/:estudianteId', async (req, res, next) => {
  try {
    const neg = negarAcceso(req.usuario, await accesoEstudiante(req.params.estudianteId));
    if (neg) return res.status(neg.status).json({ error: neg.error });
    const { rows } = await query(
      `SELECT d.id, d.nombre, d.tipo, d.mime, d.creado_en, u.nombres AS subido_nombre,
              length(d.datos) AS tam
       FROM documento_evidencia d LEFT JOIN usuario u ON u.id = d.subido_por
       WHERE d.estudiante_id = $1 ORDER BY d.creado_en DESC`, [req.params.estudianteId]);
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/evidencias/archivo/:docId  (descarga el contenido del documento)
router.get('/archivo/:docId', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM documento_evidencia WHERE id=$1', [req.params.docId]);
    const doc = rows[0];
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado.' });
    const neg = negarAcceso(req.usuario, await accesoEstudiante(doc.estudiante_id));
    if (neg) return res.status(neg.status).json({ error: neg.error });
    res.json({ id: doc.id, nombre: doc.nombre, mime: doc.mime, datos: doc.datos });
  } catch (err) { next(err); }
});

// POST /api/evidencias/:estudianteId  (subir un documento en base64)
router.post('/:estudianteId', autorizar(...GESTORES), async (req, res, next) => {
  try {
    const neg = negarAcceso(req.usuario, await accesoEstudiante(req.params.estudianteId));
    if (neg) return res.status(neg.status).json({ error: neg.error });
    const { nombre, tipo, mime, datos } = req.body;
    if (!nombre || !datos) return res.status(400).json({ error: 'El nombre y el archivo son obligatorios.' });
    if (datos.length > 14 * 1024 * 1024) return res.status(413).json({ error: 'El archivo supera el tamaño permitido (unos 10 MB).' });
    const { rows } = await query(
      `INSERT INTO documento_evidencia (estudiante_id, nombre, tipo, mime, datos, subido_por)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, nombre, tipo, mime, creado_en`,
      [req.params.estudianteId, nombre, tipo || null, mime || null, datos, req.usuario.id]);
    await auditar(req, { entidad: 'evidencia', entidad_id: rows[0].id, estudiante_id: Number(req.params.estudianteId), accion: 'crear', descripcion: `Adjuntó un documento de soporte: ${nombre}` });
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/evidencias/archivo/:docId
router.delete('/archivo/:docId', autorizar(...GESTORES), async (req, res, next) => {
  try {
    const prev = await query('SELECT estudiante_id, nombre FROM documento_evidencia WHERE id=$1', [req.params.docId]);
    if (!prev.rows[0]) return res.status(404).json({ error: 'Documento no encontrado.' });
    const neg = negarAcceso(req.usuario, await accesoEstudiante(prev.rows[0].estudiante_id));
    if (neg) return res.status(neg.status).json({ error: neg.error });
    await query('DELETE FROM documento_evidencia WHERE id=$1', [req.params.docId]);
    await auditar(req, { entidad: 'evidencia', entidad_id: Number(req.params.docId), estudiante_id: prev.rows[0].estudiante_id, accion: 'eliminar', descripcion: `Eliminó el documento de soporte: ${prev.rows[0].nombre}` });
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
