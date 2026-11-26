import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { autenticar, autorizar } from '../middleware/auth.js';

const router = Router();
router.use(autenticar);

const esSuper = (req) => req.usuario.rol === 'superadmin';

// Política de contraseñas: mínimo 8 caracteres, con letras y números.
function claveDebil(clave) {
  if (!clave || clave.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (!/[a-zA-Z]/.test(clave) || !/[0-9]/.test(clave)) return 'La contraseña debe incluir letras y números.';
  return null;
}

// GET /api/usuarios  (superadmin: todos; rector/admin: su institución)
// Lista de docentes de la institución (para asignar responsables de área).
router.get('/docentes', autorizar('coordinador', 'psicoorientador', 'rector', 'administrador', 'superadmin'), async (req, res, next) => {
  try {
    const inst = req.usuario.rol === 'superadmin' ? null : req.usuario.institucion_id;
    const { rows } = await query(
      "SELECT id, nombres FROM usuario WHERE rol='docente' AND activo=true AND ($1::int IS NULL OR institucion_id=$1) ORDER BY nombres",
      [inst]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/', autorizar('superadmin', 'administrador', 'rector'), async (req, res, next) => {
  try {
    let sql = `SELECT u.id, u.nombres, u.correo, u.rol, u.activo, u.institucion_id,
                      i.nombre AS institucion
               FROM usuario u LEFT JOIN institucion i ON i.id = u.institucion_id`;
    const params = [];
    if (!esSuper(req)) {
      sql += ' WHERE u.institucion_id = $1';
      params.push(req.usuario.institucion_id);
    }
    sql += ' ORDER BY i.nombre NULLS FIRST, u.rol, u.nombres';
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/usuarios  (crear usuario)
router.post('/', autorizar('superadmin', 'administrador', 'rector'), async (req, res, next) => {
  try {
    const { nombres, correo, clave, rol, institucion_id } = req.body;
    if (!nombres || !correo || !clave || !rol) {
      return res.status(400).json({ error: 'Nombres, correo, clave y rol son obligatorios.' });
    }
    const debil = claveDebil(clave);
    if (debil) return res.status(400).json({ error: debil });
    // Solo el superadmin puede crear superadmins o elegir institución libremente
    let inst;
    if (esSuper(req)) {
      inst = (rol === 'superadmin') ? null : (institucion_id || null);
    } else {
      if (rol === 'superadmin') return res.status(403).json({ error: 'No puedes crear administradores generales.' });
      inst = req.usuario.institucion_id;
    }
    const hash = await bcrypt.hash(clave, 10);
    const { rows } = await query(
      `INSERT INTO usuario (institucion_id, nombres, correo, clave_hash, rol)
       VALUES ($1,$2,$3,$4,$5) RETURNING id, nombres, correo, rol, activo, institucion_id`,
      [inst, nombres, correo.toLowerCase().trim(), hash, rol]
    );
    // Asignar cursos (grados/grupos) si se enviaron
    const cursos = Array.isArray(req.body.cursos) ? req.body.cursos : [];
    for (const cid of cursos) {
      await query('INSERT INTO usuario_curso (usuario_id, curso_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [rows[0].id, cid]);
    }
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'El correo ya está registrado.' });
    next(err);
  }
});

// PUT /api/usuarios/:id/clave  (restablecer contraseña)
router.put('/:id/clave', autorizar('superadmin', 'administrador', 'rector'), async (req, res, next) => {
  try {
    const { clave } = req.body;
    const debil = claveDebil(clave);
    if (debil) return res.status(400).json({ error: debil });
    // Verificar alcance: no-super solo puede cambiar claves de su institución
    const objetivo = await query('SELECT institucion_id FROM usuario WHERE id=$1', [req.params.id]);
    if (!objetivo.rows[0]) return res.status(404).json({ error: 'Usuario no encontrado.' });
    if (!esSuper(req) && objetivo.rows[0].institucion_id !== req.usuario.institucion_id) {
      return res.status(403).json({ error: 'No puedes cambiar la clave de usuarios de otra institución.' });
    }
    const hash = await bcrypt.hash(clave, 10);
    await query('UPDATE usuario SET clave_hash=$1 WHERE id=$2', [hash, req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// GET /api/usuarios/:id/cursos  (cursos asignados a un usuario)
router.get('/:id/cursos', autorizar('superadmin', 'administrador', 'rector', 'coordinador'), async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT c.* FROM usuario_curso uc JOIN curso c ON c.id = uc.curso_id
       WHERE uc.usuario_id = $1 ORDER BY c.sede, c.grado, c.grupo`, [req.params.id]);
    res.json(rows);
  } catch (err) { next(err); }
});

// PUT /api/usuarios/:id/cursos  (reemplaza los cursos asignados)  body: { cursos: [ids] }
router.put('/:id/cursos', autorizar('superadmin', 'administrador', 'rector', 'coordinador'), async (req, res, next) => {
  try {
    const objetivo = await query('SELECT institucion_id FROM usuario WHERE id=$1', [req.params.id]);
    if (!objetivo.rows[0]) return res.status(404).json({ error: 'Usuario no encontrado.' });
    if (!esSuper(req) && objetivo.rows[0].institucion_id !== req.usuario.institucion_id) {
      return res.status(403).json({ error: 'No puedes asignar cursos a usuarios de otra institución.' });
    }
    const cursos = Array.isArray(req.body.cursos) ? req.body.cursos : [];
    await query('DELETE FROM usuario_curso WHERE usuario_id=$1', [req.params.id]);
    for (const cid of cursos) {
      await query('INSERT INTO usuario_curso (usuario_id, curso_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.params.id, cid]);
    }
    res.json({ ok: true, cursos: cursos.length });
  } catch (err) { next(err); }
});

// GET /api/usuarios/:id/carga  (carga académica del docente: área × curso)
router.get('/:id/carga', autorizar('superadmin', 'administrador', 'rector', 'coordinador'), async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT ca.curso_id, ca.area_id, a.nombre AS area_nombre,
              c.sede, c.jornada, c.grado, c.grupo
         FROM carga_academica ca
         JOIN curso c ON c.id = ca.curso_id
         JOIN area a ON a.id = ca.area_id
        WHERE ca.docente_id = $1
        ORDER BY c.sede, c.grado, c.grupo, a.nombre`, [req.params.id]);
    res.json(rows);
  } catch (err) { next(err); }
});

// PUT /api/usuarios/:id/carga  (reemplaza la carga del docente)  body: { items: [{curso_id, area_id}] }
router.put('/:id/carga', autorizar('superadmin', 'administrador', 'rector', 'coordinador'), async (req, res, next) => {
  try {
    const objetivo = await query('SELECT institucion_id FROM usuario WHERE id=$1', [req.params.id]);
    if (!objetivo.rows[0]) return res.status(404).json({ error: 'Usuario no encontrado.' });
    if (!esSuper(req) && objetivo.rows[0].institucion_id !== req.usuario.institucion_id) {
      return res.status(403).json({ error: 'No puedes asignar carga a usuarios de otra institución.' });
    }
    const items = Array.isArray(req.body.items) ? req.body.items.filter((x) => x && x.curso_id && x.area_id) : [];
    // Quita de este docente las parejas (curso, área) que ya no tiene.
    await query('DELETE FROM carga_academica WHERE docente_id=$1', [req.params.id]);
    // Asigna cada pareja a este docente (la toma de quien la tuviera: UNIQUE por curso+área).
    for (const it of items) {
      await query(
        `INSERT INTO carga_academica (docente_id, curso_id, area_id) VALUES ($1,$2,$3)
         ON CONFLICT (curso_id, area_id) DO UPDATE SET docente_id=EXCLUDED.docente_id`,
        [req.params.id, it.curso_id, it.area_id]);
    }
    res.json({ ok: true, items: items.length });
  } catch (err) { next(err); }
});

// PUT /api/usuarios/:id  (editar rol/estado; solo superadmin)
router.put('/:id', autorizar('superadmin'), async (req, res, next) => {
  try {
    const { nombres, rol, institucion_id, activo } = req.body;
    const inst = rol === 'superadmin' ? null : (institucion_id ?? null);
    const { rows } = await query(
      `UPDATE usuario SET nombres=COALESCE($1,nombres), rol=COALESCE($2,rol),
         institucion_id=$3, activo=COALESCE($4,activo)
       WHERE id=$5 RETURNING id, nombres, correo, rol, activo, institucion_id`,
      [nombres || null, rol || null, inst, activo, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

export default router;
