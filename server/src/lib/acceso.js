// Control de acceso: confidencialidad entre colegios y casos reservados.
import { query } from '../db.js';

// Roles que pueden ver casos reservados (equipo de orientación y directivos).
export const ROLES_RESERVADO = ['psicoorientador', 'coordinador', 'rector', 'administrador', 'superadmin'];

/**
 * Decide si se niega el acceso a un estudiante.
 * info = { institucion_id, reservado } del estudiante (o null si no existe).
 * Devuelve { status, error } si se niega, o null si tiene acceso.
 */
export function negarAcceso(usuario, info) {
  if (!info) return { status: 404, error: 'Recurso no encontrado.' };
  // Confidencialidad entre colegios: solo el superadmin cruza instituciones.
  if (usuario.rol !== 'superadmin' && info.institucion_id !== usuario.institucion_id) {
    return { status: 403, error: 'No tiene acceso a información de otra institución.' };
  }
  // Caso reservado: solo el equipo de orientación y directivos.
  if (info.reservado && !ROLES_RESERVADO.includes(usuario.rol)) {
    return { status: 403, error: 'Caso reservado: solo el equipo de orientación y los directivos pueden acceder.' };
  }
  return null;
}

/** Carga institución y reserva de un estudiante. */
export async function accesoEstudiante(id) {
  const r = await query('SELECT institucion_id, reservado FROM estudiante WHERE id = $1', [id]);
  return r.rows[0] || null;
}

/** Carga institución y reserva del estudiante dueño de un PIAR. */
export async function accesoPiar(piarId) {
  const r = await query(
    `SELECT e.institucion_id, e.reservado FROM piar p
     JOIN estudiante e ON e.id = p.estudiante_id WHERE p.id = $1`, [piarId]);
  return r.rows[0] || null;
}
