import { Router } from 'express';
import { query } from '../db.js';
import { autenticar, autorizar } from '../middleware/auth.js';
import { auditar } from '../lib/auditoria.js';

const router = Router();
router.use(autenticar);

// GET /api/estudiantes  (lista; el padre solo ve a su hijo)
router.get('/', async (req, res, next) => {
  try {
    const { rol, id, institucion_id } = req.usuario;
    let sql = `SELECT e.id, e.nombres, e.documento_tipo, e.documento_numero, e.grado,
                      e.fecha_nacimiento, e.institucion_id, e.curso_id,
                      c.sede AS curso_sede, c.jornada AS curso_jornada, c.grado AS curso_grado, c.grupo AS curso_grupo
               FROM estudiante e LEFT JOIN curso c ON c.id = e.curso_id WHERE 1=1`;
    const params = [];
    // El administrador general ve todos los estudiantes; los demás, los de su institución.
    if (rol !== 'superadmin') {
      params.push(institucion_id);
      sql += ` AND e.institucion_id = $${params.length}`;
    }
    if (rol === 'padre') {
      params.push(id);
      sql += ` AND e.acudiente_id = $${params.length}`;
    }
    sql += ' ORDER BY e.nombres';
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/estudiantes/mosaico  (foto, nombre, discapacidad y grado; filtrable)
router.get('/mosaico/datos', autorizar('superadmin', 'rector', 'coordinador', 'psicoorientador', 'administrador', 'docente'), async (req, res, next) => {
  try {
    const esSuper = req.usuario.rol === 'superadmin';
    const inst = esSuper ? (req.query.institucion_id || null) : req.usuario.institucion_id;
    const params = [inst || null];
    let sql = `SELECT e.id, e.nombres, e.grado, e.foto,
                      e.entorno_salud->>'discapacidad' AS discapacidad,
                      e.curso_id, c.sede AS curso_sede, c.jornada AS curso_jornada,
                      c.grado AS curso_grado, c.grupo AS curso_grupo,
                      i.nombre AS institucion_nombre
               FROM estudiante e
               LEFT JOIN curso c ON c.id = e.curso_id
               LEFT JOIN institucion i ON i.id = e.institucion_id
               WHERE ($1::int IS NULL OR e.institucion_id = $1)`;
    if (req.query.curso_id) { params.push(req.query.curso_id); sql += ` AND e.curso_id = $${params.length}`; }
    if (req.query.sede) { params.push(req.query.sede); sql += ` AND c.sede = $${params.length}`; }
    sql += ' ORDER BY i.nombre, c.sede, c.grado, c.grupo, e.nombres';
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/estudiantes/:id  (detalle con Anexo 1)
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT e.*, c.sede AS curso_sede, c.jornada AS curso_jornada,
              c.grado AS curso_grado, c.grupo AS curso_grupo
       FROM estudiante e LEFT JOIN curso c ON c.id = e.curso_id WHERE e.id = $1`,
      [req.params.id]);
    const est = rows[0];
    if (!est) return res.status(404).json({ error: 'Estudiante no encontrado.' });
    if (req.usuario.rol === 'padre' && est.acudiente_id !== req.usuario.id) {
      return res.status(403).json({ error: 'Solo puedes ver el expediente de tu hijo.' });
    }
    res.json(est);
  } catch (err) { next(err); }
});

// POST /api/estudiantes  (crear; Anexo 1)
router.post('/', autorizar('docente', 'psicoorientador', 'administrador', 'coordinador', 'rector', 'superadmin'), async (req, res, next) => {
  try {
    const { documento_tipo, documento_numero, nombres, fecha_nacimiento, grado, curso_id, foto,
            identificacion, entorno_personal, entorno_salud, entorno_hogar, entorno_educativo, acudiente_id } = req.body;
    if (!nombres) return res.status(400).json({ error: 'El nombre es obligatorio.' });
    const inst = req.usuario.rol === 'superadmin' ? (req.body.institucion_id || null) : req.usuario.institucion_id;
    const { rows } = await query(
      `INSERT INTO estudiante
        (institucion_id, documento_tipo, documento_numero, nombres, fecha_nacimiento, grado, curso_id, foto,
         identificacion, entorno_personal, entorno_salud, entorno_hogar, entorno_educativo, acudiente_id, creado_por)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [inst, documento_tipo, documento_numero, nombres,
       fecha_nacimiento || null, grado, curso_id || null, foto || null, identificacion || {},
       entorno_personal || {}, entorno_salud || {}, entorno_hogar || {}, entorno_educativo || {},
       acudiente_id || null, req.usuario.id]
    );
    await auditar(req, { entidad: 'estudiante', entidad_id: rows[0].id, estudiante_id: rows[0].id, accion: 'crear', descripcion: 'Creó el expediente del estudiante (Anexo 1)' });
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// PUT /api/estudiantes/:id
router.put('/:id', autorizar('docente', 'psicoorientador', 'administrador', 'coordinador', 'rector', 'superadmin'), async (req, res, next) => {
  try {
    const { documento_tipo, documento_numero, nombres, fecha_nacimiento, grado, curso_id, foto,
            identificacion, entorno_personal, entorno_salud, entorno_hogar, entorno_educativo, acudiente_id } = req.body;
    const { rows } = await query(
      `UPDATE estudiante SET
        documento_tipo=$1, documento_numero=$2, nombres=$3, fecha_nacimiento=$4, grado=$5, curso_id=$6, foto=$7,
        identificacion=$8, entorno_personal=$9, entorno_salud=$10, entorno_hogar=$11, entorno_educativo=$12, acudiente_id=$13
       WHERE id=$14 RETURNING *`,
      [documento_tipo, documento_numero, nombres, fecha_nacimiento || null, grado, curso_id || null, foto || null,
       identificacion || {}, entorno_personal || {}, entorno_salud || {}, entorno_hogar || {}, entorno_educativo || {},
       acudiente_id || null, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Estudiante no encontrado.' });
    await auditar(req, { entidad: 'estudiante', entidad_id: Number(req.params.id), estudiante_id: Number(req.params.id), accion: 'editar', descripcion: 'Actualizó el Anexo 1 (información del estudiante)' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

export default router;
