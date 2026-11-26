// Responsables por área y estudiante (Anexo 2). Define qué docente diligencia
// cada área del PIAR de un estudiante. La asignación la hacen coordinación,
// orientación o directivos. Un docente puede tener varias áreas y cursos.
import { Router } from 'express';
import { query } from '../db.js';
import { autenticar, autorizar } from '../middleware/auth.js';
import { auditar } from '../lib/auditoria.js';

const router = Router();
router.use(autenticar);

const GESTIONA = ['coordinador', 'psicoorientador', 'rector', 'administrador', 'superadmin'];

// GET /api/responsables?estudiante_id=  (cualquiera autenticado puede verlos)
router.get('/', async (req, res, next) => {
  try {
    const { estudiante_id } = req.query;
    if (!estudiante_id) return res.json([]);
    // Responsable efectivo por área: excepción explícita si existe; si no,
    // el docente que tiene esa área en el curso del estudiante (carga académica).
    const explic = await query(
      `SELECT r.area_id, r.docente_id, u.nombres AS docente_nombre
         FROM responsable_area r LEFT JOIN usuario u ON u.id = r.docente_id
        WHERE r.estudiante_id = $1`, [estudiante_id]);
    const derivados = await query(
      `SELECT ca.area_id, ca.docente_id, u.nombres AS docente_nombre
         FROM estudiante e
         JOIN carga_academica ca ON ca.curso_id = e.curso_id
         JOIN usuario u ON u.id = ca.docente_id
        WHERE e.id = $1`, [estudiante_id]);
    const map = {};
    derivados.rows.forEach((d) => { map[d.area_id] = { area_id: d.area_id, docente_id: d.docente_id, docente_nombre: d.docente_nombre, origen: 'carga' }; });
    explic.rows.forEach((e) => { if (e.docente_id != null) map[e.area_id] = { area_id: e.area_id, docente_id: e.docente_id, docente_nombre: e.docente_nombre, origen: 'manual' }; });
    res.json(Object.values(map));
  } catch (err) { next(err); }
});

// PUT /api/responsables  { estudiante_id, area_id, docente_id|null }
router.put('/', autorizar(...GESTIONA), async (req, res, next) => {
  try {
    const { estudiante_id, area_id, docente_id } = req.body;
    if (!estudiante_id || !area_id) return res.status(400).json({ error: 'Faltan el estudiante y el área.' });
    if (docente_id) {
      await query(
        `INSERT INTO responsable_area (estudiante_id, area_id, docente_id, asignado_por)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (estudiante_id, area_id)
         DO UPDATE SET docente_id=EXCLUDED.docente_id, asignado_por=EXCLUDED.asignado_por, actualizado_en=now()`,
        [estudiante_id, area_id, docente_id, req.usuario.id]
      );
    } else {
      await query('DELETE FROM responsable_area WHERE estudiante_id=$1 AND area_id=$2', [estudiante_id, area_id]);
    }
    await auditar(req, { entidad: 'responsable_area', entidad_id: Number(area_id), accion: 'asignar', descripcion: `Asignó responsable del área (estudiante ${estudiante_id})` });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
