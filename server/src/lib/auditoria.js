// Control de cambios: registra quién crea, edita o elimina cada formato.
import { query } from '../db.js';

/**
 * Registra un movimiento en la bitácora de auditoría.
 * Nunca interrumpe la operación principal: si la auditoría falla, solo se omite.
 */
export async function auditar(req, { entidad, entidad_id, estudiante_id, piar_id, accion, descripcion }) {
  try {
    const u = req.usuario || {};
    // Si solo viene el PIAR, resuelve el estudiante para agrupar la bitácora del expediente.
    let est = estudiante_id || null;
    if (!est && piar_id) {
      const r = await query('SELECT estudiante_id FROM piar WHERE id = $1', [piar_id]);
      est = r.rows[0]?.estudiante_id || null;
    }
    await query(
      `INSERT INTO auditoria
        (usuario_id, usuario_nombre, usuario_rol, entidad, entidad_id, estudiante_id, piar_id, accion, descripcion)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [u.id || null, u.nombres || null, u.rol || null, entidad,
       entidad_id || null, est, piar_id || null, accion, descripcion || null]
    );
  } catch (e) {
    console.error('Auditoría no registrada:', e.message);
  }
}
