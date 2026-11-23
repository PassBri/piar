import { Router } from 'express';
import { query } from '../db.js';
import { autenticar, autorizar } from '../middleware/auth.js';

const router = Router();
router.use(autenticar);

// GET /api/estudiantes  (lista; el padre solo ve a su hijo)
router.get('/', async (req, res, next) => {
  try {
    const { rol, id, institucion_id } = req.usuario;
    let sql = `SELECT e.id, e.nombres, e.documento_tipo, e.documento_numero, e.grado,
                      e.fecha_nacimiento, e.institucion_id
               FROM estudiante e WHERE 1=1`;
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

// GET /api/estudiantes/:id  (detalle con Anexo 1)
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM estudiante WHERE id = $1', [req.params.id]);
    const est = rows[0];
    if (!est) return res.status(404).json({ error: 'Estudiante no encontrado.' });
    if (req.usuario.rol === 'padre' && est.acudiente_id !== req.usuario.id) {
      return res.status(403).json({ error: 'Solo puedes ver el expediente de tu hijo.' });
    }
    res.json(est);
  } catch (err) { next(err); }
});

// POST /api/estudiantes  (crear; Anexo 1)
router.post('/', autorizar('docente', 'psicoorientador', 'administrador'), async (req, res, next) => {
  try {
    const { documento_tipo, documento_numero, nombres, fecha_nacimiento, grado,
            identificacion, entorno_personal, entorno_salud, entorno_hogar, entorno_educativo, acudiente_id } = req.body;
    if (!nombres) return res.status(400).json({ error: 'El nombre es obligatorio.' });
    const inst = req.usuario.rol === 'superadmin' ? (req.body.institucion_id || null) : req.usuario.institucion_id;
    const { rows } = await query(
      `INSERT INTO estudiante
        (institucion_id, documento_tipo, documento_numero, nombres, fecha_nacimiento, grado,
         identificacion, entorno_personal, entorno_salud, entorno_hogar, entorno_educativo, acudiente_id, creado_por)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [inst, documento_tipo, documento_numero, nombres,
       fecha_nacimiento || null, grado, identificacion || {},
       entorno_personal || {}, entorno_salud || {}, entorno_hogar || {}, entorno_educativo || {},
       acudiente_id || null, req.usuario.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// PUT /api/estudiantes/:id
router.put('/:id', autorizar('docente', 'psicoorientador', 'administrador'), async (req, res, next) => {
  try {
    const { documento_tipo, documento_numero, nombres, fecha_nacimiento, grado,
            identificacion, entorno_personal, entorno_salud, entorno_hogar, entorno_educativo, acudiente_id } = req.body;
    const { rows } = await query(
      `UPDATE estudiante SET
        documento_tipo=$1, documento_numero=$2, nombres=$3, fecha_nacimiento=$4, grado=$5,
        identificacion=$6, entorno_personal=$7, entorno_salud=$8, entorno_hogar=$9, entorno_educativo=$10, acudiente_id=$11
       WHERE id=$12 RETURNING *`,
      [documento_tipo, documento_numero, nombres, fecha_nacimiento || null, grado,
       identificacion || {}, entorno_personal || {}, entorno_salud || {}, entorno_hogar || {}, entorno_educativo || {},
       acudiente_id || null, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Estudiante no encontrado.' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

export default router;
