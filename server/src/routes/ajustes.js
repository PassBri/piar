import { Router } from 'express';
import { query } from '../db.js';
import { autenticar, autorizar } from '../middleware/auth.js';
import { auditar } from '../lib/auditoria.js';

const router = Router();
router.use(autenticar);

const PERIODO_NOMBRE = (p) => (Number(p) === 5 ? 'Promoción' : `Periodo ${p}`);

// Roles que supervisan y pueden gestionar lo de cualquier docente.
const SUPERVISA = ['coordinador', 'psicoorientador', 'rector', 'administrador', 'superadmin'];
// Reglas para un docente:
//  - Si el área de la fila tiene responsable asignado (por coordinación/orientación),
//    solo ese docente la modifica.
//  - Si el área no tiene responsable, aplica la autoría (su propia fila o filas sin autor).
// Docente responsable de un área para un estudiante: excepción explícita o, si no,
// el docente que tiene esa área en el curso del estudiante (carga académica).
async function responsableDe(estudianteId, areaId) {
  if (!areaId) return null;
  const ex = await query('SELECT docente_id FROM responsable_area WHERE estudiante_id=$1 AND area_id=$2', [estudianteId, areaId]);
  if (ex.rows[0] && ex.rows[0].docente_id != null) return ex.rows[0].docente_id;
  const d = await query(
    `SELECT ca.docente_id FROM estudiante e
       JOIN carga_academica ca ON ca.curso_id = e.curso_id AND ca.area_id = $2
      WHERE e.id = $1`, [estudianteId, areaId]);
  return d.rows[0]?.docente_id ?? null;
}

async function puedeModificar(req, ajusteId) {
  if (SUPERVISA.includes(req.usuario.rol)) return true;
  const r = await query(
    `SELECT a.creado_por, a.area_id, p.estudiante_id
       FROM ajuste_razonable a JOIN piar p ON p.id = a.piar_id WHERE a.id=$1`,
    [ajusteId]
  );
  if (!r.rows[0]) return true; // no existe: el 404 se maneja después
  const { creado_por, area_id, estudiante_id } = r.rows[0];
  // Estricto: con área definida, solo su docente responsable puede modificarla.
  if (area_id) {
    const dueno = await responsableDe(estudiante_id, area_id);
    return dueno != null && dueno === req.usuario.id;
  }
  // Sin área aún: la completa quien la creó (para elegir una de sus áreas).
  return creado_por == null || creado_por === req.usuario.id;
}
const ERROR_AUTORIA = 'Esta área no está en tu carga académica. Solo su docente responsable o la coordinación pueden diligenciarla.';

// POST /api/ajustes  (añadir ajuste razonable a un PIAR)
router.post('/', autorizar('docente', 'psicoorientador', 'administrador', 'coordinador', 'rector', 'superadmin'), async (req, res, next) => {
  try {
    const { piar_id, area_id, periodo, objetivo, barrera, tipo, descripcion, apoyo, intensidad, evaluacion, desempeno } = req.body;
    // Se permite crear filas vacías: la barrera y el ajuste se completan después
    // (varios docentes diligencian el mismo formato, cada uno su área).
    if (!piar_id) {
      return res.status(400).json({ error: 'Falta el PIAR.' });
    }
    // Estricto: un docente solo puede crear filas en áreas de su carga académica.
    if (area_id && !SUPERVISA.includes(req.usuario.rol)) {
      const est = await query('SELECT estudiante_id FROM piar WHERE id=$1', [piar_id]);
      const dueno = await responsableDe(est.rows[0]?.estudiante_id, area_id);
      if (dueno !== req.usuario.id) return res.status(403).json({ error: ERROR_AUTORIA });
    }
    const { rows } = await query(
      `INSERT INTO ajuste_razonable
        (piar_id, area_id, periodo, objetivo, barrera, tipo, descripcion, apoyo, intensidad, evaluacion, desempeno, creado_por)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [piar_id, area_id || null, periodo || 1, objetivo, barrera || '', tipo || 'actividades', descripcion || '', apoyo, intensidad || 'intermitente', evaluacion, desempeno || null, req.usuario.id]
    );
    await auditar(req, { entidad: 'ajuste', entidad_id: rows[0].id, piar_id, accion: 'crear', descripcion: `Agregó un ajuste razonable (${PERIODO_NOMBRE(periodo || 1)})` });
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// PUT /api/ajustes/:id
router.put('/:id', autorizar('docente', 'psicoorientador', 'administrador', 'coordinador', 'rector', 'superadmin'), async (req, res, next) => {
  try {
    if (!(await puedeModificar(req, req.params.id))) return res.status(403).json({ error: ERROR_AUTORIA });
    const { area_id, periodo, objetivo, barrera, tipo, descripcion, apoyo, intensidad, evaluacion, retirado, justificacion_retiro, desempeno } = req.body;
    // Estricto: un docente no puede mover una fila a un área que no es de su carga.
    if (area_id && !SUPERVISA.includes(req.usuario.rol)) {
      const info = await query('SELECT p.estudiante_id FROM ajuste_razonable a JOIN piar p ON p.id=a.piar_id WHERE a.id=$1', [req.params.id]);
      const dueno = await responsableDe(info.rows[0]?.estudiante_id, area_id);
      if (dueno !== req.usuario.id) return res.status(403).json({ error: ERROR_AUTORIA });
    }
    const { rows } = await query(
      `UPDATE ajuste_razonable SET area_id=$1, periodo=COALESCE($2,periodo), objetivo=$3, barrera=$4, tipo=$5,
         descripcion=$6, apoyo=$7, intensidad=$8, evaluacion=$9, retirado=COALESCE($10,retirado),
         justificacion_retiro=$11, desempeno=$13
       WHERE id=$12 RETURNING *`,
      [area_id || null, periodo, objetivo, barrera, tipo, descripcion, apoyo, intensidad, evaluacion,
       retirado, justificacion_retiro, req.params.id, desempeno ?? null]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Ajuste no encontrado.' });
    await auditar(req, { entidad: 'ajuste', entidad_id: Number(req.params.id), piar_id: rows[0].piar_id, accion: 'editar', descripcion: `Editó un ajuste razonable (${PERIODO_NOMBRE(rows[0].periodo)})` });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/ajustes/:id
router.delete('/:id', autorizar('docente', 'psicoorientador', 'administrador', 'coordinador', 'rector', 'superadmin'), async (req, res, next) => {
  try {
    if (!(await puedeModificar(req, req.params.id))) return res.status(403).json({ error: ERROR_AUTORIA });
    const prev = await query('SELECT piar_id, periodo FROM ajuste_razonable WHERE id=$1', [req.params.id]);
    const { rowCount } = await query('DELETE FROM ajuste_razonable WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Ajuste no encontrado.' });
    await auditar(req, { entidad: 'ajuste', entidad_id: Number(req.params.id), piar_id: prev.rows[0]?.piar_id, accion: 'eliminar', descripcion: `Eliminó un ajuste razonable (${PERIODO_NOMBRE(prev.rows[0]?.periodo)})` });
    res.status(204).end();
  } catch (err) { next(err); }
});

// GET /api/ajustes/:id/seguimientos
router.get('/:id/seguimientos', async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM seguimiento WHERE ajuste_id=$1 ORDER BY fecha DESC', [req.params.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

export default router;
