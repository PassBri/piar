import { Router } from 'express';
import { query } from '../db.js';
import { autenticar, autorizar } from '../middleware/auth.js';
import { auditar } from '../lib/auditoria.js';
import { negarAcceso, ROLES_RESERVADO } from '../lib/acceso.js';

const router = Router();
router.use(autenticar);

// GET /api/estudiantes  (lista; el padre solo ve a su hijo)
router.get('/', async (req, res, next) => {
  try {
    const { rol, id, institucion_id } = req.usuario;
    let sql = `SELECT e.id, e.nombres, e.documento_tipo, e.documento_numero, e.grado,
                      e.fecha_nacimiento, e.institucion_id, e.curso_id, e.reservado,
                      e.entorno_salud->>'discapacidad' AS discapacidad,
                      c.sede AS curso_sede, c.jornada AS curso_jornada, c.grado AS curso_grado, c.grupo AS curso_grupo
               FROM estudiante e LEFT JOIN curso c ON c.id = e.curso_id WHERE 1=1`;
    const params = [];
    // Confidencialidad entre colegios: solo el superadmin ve varias instituciones.
    if (rol !== 'superadmin') {
      params.push(institucion_id);
      sql += ` AND e.institucion_id = $${params.length}`;
    } else if (req.query.institucion_id) {
      params.push(req.query.institucion_id);
      sql += ` AND e.institucion_id = $${params.length}`;
    }
    if (rol === 'padre') {
      params.push(id);
      sql += ` AND e.acudiente_id = $${params.length}`;
    }
    // Los casos reservados se ocultan a quien no sea del equipo de orientación/directivo.
    if (!ROLES_RESERVADO.includes(rol)) sql += ' AND e.reservado = FALSE';
    // Filtros opcionales
    if (req.query.curso_id) { params.push(req.query.curso_id); sql += ` AND e.curso_id = $${params.length}`; }
    if (req.query.sede) { params.push(req.query.sede); sql += ` AND c.sede = $${params.length}`; }
    if (req.query.discapacidad) { params.push(`%${req.query.discapacidad}%`); sql += ` AND e.entorno_salud->>'discapacidad' ILIKE $${params.length}`; }
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
    if (!ROLES_RESERVADO.includes(req.usuario.rol)) sql += ' AND e.reservado = FALSE';
    if (req.query.curso_id) { params.push(req.query.curso_id); sql += ` AND e.curso_id = $${params.length}`; }
    if (req.query.sede) { params.push(req.query.sede); sql += ` AND c.sede = $${params.length}`; }
    if (req.query.discapacidad) { params.push(`%${req.query.discapacidad}%`); sql += ` AND e.entorno_salud->>'discapacidad' ILIKE $${params.length}`; }
    sql += ' ORDER BY i.nombre, c.sede, c.grado, c.grupo, e.nombres';
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/estudiantes/exportar/csv  — exporta los estudiantes del colegio
router.get('/exportar/csv', async (req, res, next) => {
  try {
    const inst = req.usuario.rol === 'superadmin' ? (req.query.institucion_id || null) : req.usuario.institucion_id;
    const extra = ROLES_RESERVADO.includes(req.usuario.rol) ? '' : ' AND reservado = FALSE';
    const { rows } = await query(
      `SELECT documento_tipo, documento_numero, nombres, grado, entorno_salud->>'discapacidad' AS discapacidad
       FROM estudiante WHERE ($1::int IS NULL OR institucion_id = $1)${extra} ORDER BY nombres`, [inst || null]);
    const esc = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
    const cab = 'Tipo documento,Documento,Nombres,Grado,Discapacidad';
    const lineas = rows.map((r) => [r.documento_tipo, r.documento_numero, r.nombres, r.grado, r.discapacidad].map(esc).join(','));
    const csv = '﻿' + [cab, ...lineas].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="estudiantes.csv"');
    res.send(csv);
  } catch (err) { next(err); }
});

// POST /api/estudiantes/importar  — crea estudiantes en lote (desde CSV/Excel)
router.post('/importar', autorizar('docente', 'psicoorientador', 'administrador', 'coordinador', 'rector', 'superadmin'), async (req, res, next) => {
  try {
    const inst = req.usuario.rol === 'superadmin' ? (req.body.institucion_id || null) : req.usuario.institucion_id;
    const filas = Array.isArray(req.body.estudiantes) ? req.body.estudiantes : [];
    let creados = 0;
    for (const f of filas) {
      if (!f.nombres || !String(f.nombres).trim()) continue;
      await query(
        `INSERT INTO estudiante (institucion_id, documento_tipo, documento_numero, nombres, grado, creado_por)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [inst, (f.documento_tipo || 'TI').trim(), f.documento_numero || null, String(f.nombres).trim(), f.grado || null, req.usuario.id]);
      creados += 1;
    }
    await auditar(req, { entidad: 'estudiante', accion: 'crear', descripcion: `Importó ${creados} estudiante(s) en lote` });
    res.json({ creados });
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
    const neg = negarAcceso(req.usuario, est);
    if (neg) return res.status(neg.status).json({ error: neg.error });
    if (req.usuario.rol === 'padre' && est.acudiente_id !== req.usuario.id) {
      return res.status(403).json({ error: 'Solo puedes ver el expediente de tu hijo.' });
    }
    res.json(est);
  } catch (err) { next(err); }
});

// POST /api/estudiantes  (crear; Anexo 1)
router.post('/', autorizar('docente', 'psicoorientador', 'administrador', 'coordinador', 'rector', 'superadmin'), async (req, res, next) => {
  try {
    const { documento_tipo, documento_numero, nombres, fecha_nacimiento, grado, curso_id, foto, reservado,
            identificacion, entorno_personal, entorno_salud, entorno_hogar, entorno_educativo, acudiente_id } = req.body;
    if (!nombres) return res.status(400).json({ error: 'El nombre es obligatorio.' });
    const inst = req.usuario.rol === 'superadmin' ? (req.body.institucion_id || null) : req.usuario.institucion_id;
    const resv = ROLES_RESERVADO.includes(req.usuario.rol) ? !!reservado : false;
    const { rows } = await query(
      `INSERT INTO estudiante
        (institucion_id, documento_tipo, documento_numero, nombres, fecha_nacimiento, grado, curso_id, foto, reservado,
         identificacion, entorno_personal, entorno_salud, entorno_hogar, entorno_educativo, acudiente_id, creado_por)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [inst, documento_tipo, documento_numero, nombres,
       fecha_nacimiento || null, grado, curso_id || null, foto || null, resv, identificacion || {},
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
    const { documento_tipo, documento_numero, nombres, fecha_nacimiento, grado, curso_id, foto, reservado,
            identificacion, entorno_personal, entorno_salud, entorno_hogar, entorno_educativo, acudiente_id } = req.body;
    // Validar acceso (institución y caso reservado) antes de modificar.
    const prev = await query('SELECT institucion_id, reservado FROM estudiante WHERE id=$1', [req.params.id]);
    const neg = negarAcceso(req.usuario, prev.rows[0]);
    if (neg) return res.status(neg.status).json({ error: neg.error });
    // Solo el equipo de orientación/directivo puede cambiar la marca de reservado.
    const nuevoReservado = ROLES_RESERVADO.includes(req.usuario.rol) ? !!reservado : prev.rows[0].reservado;
    const { rows } = await query(
      `UPDATE estudiante SET
        documento_tipo=$1, documento_numero=$2, nombres=$3, fecha_nacimiento=$4, grado=$5, curso_id=$6, foto=$7,
        identificacion=$8, entorno_personal=$9, entorno_salud=$10, entorno_hogar=$11, entorno_educativo=$12, acudiente_id=$13,
        reservado=$15
       WHERE id=$14 RETURNING *`,
      [documento_tipo, documento_numero, nombres, fecha_nacimiento || null, grado, curso_id || null, foto || null,
       identificacion || {}, entorno_personal || {}, entorno_salud || {}, entorno_hogar || {}, entorno_educativo || {},
       acudiente_id || null, req.params.id, nuevoReservado]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Estudiante no encontrado.' });
    await auditar(req, { entidad: 'estudiante', entidad_id: Number(req.params.id), estudiante_id: Number(req.params.id), accion: 'editar', descripcion: 'Actualizó el Anexo 1 (información del estudiante)' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

export default router;
