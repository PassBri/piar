import { Router } from 'express';
import { query } from '../db.js';
import { autenticar, autorizar } from '../middleware/auth.js';
import { auditar } from '../lib/auditoria.js';

const router = Router();
router.use(autenticar);

const PERIODO_NOMBRE = (p) => (Number(p) === 5 ? 'Promoción' : `Periodo ${p}`);

// Roles que supervisan y pueden gestionar lo de cualquier docente.
const SUPERVISA = ['coordinador', 'psicoorientador', 'rector', 'administrador', 'superadmin'];
// Un docente solo modifica sus propias filas (o filas sin autor previas).
async function puedeModificar(req, ajusteId) {
  if (SUPERVISA.includes(req.usuario.rol)) return true;
  const r = await query('SELECT creado_por FROM ajuste_razonable WHERE id=$1', [ajusteId]);
  if (!r.rows[0]) return true; // no existe: el 404 se maneja después
  const dueno = r.rows[0].creado_por;
  return dueno == null || dueno === req.usuario.id;
}
const ERROR_AUTORIA = 'Esta fila la diligenció otro docente. Solo el coordinador o el psicoorientador pueden modificarla.';

// POST /api/ajustes  (añadir ajuste razonable a un PIAR)
router.post('/', autorizar('docente', 'psicoorientador', 'administrador', 'coordinador', 'rector', 'superadmin'), async (req, res, next) => {
  try {
    const { piar_id, area_id, periodo, objetivo, barrera, tipo, descripcion, apoyo, intensidad, evaluacion, desempeno } = req.body;
    // Se permite crear filas vacías: la barrera y el ajuste se completan después
    // (varios docentes diligencian el mismo formato, cada uno su área).
    if (!piar_id) {
      return res.status(400).json({ error: 'Falta el PIAR.' });
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
