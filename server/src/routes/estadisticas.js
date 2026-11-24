import { Router } from 'express';
import { query } from '../db.js';
import { autenticar } from '../middleware/auth.js';

const router = Router();
router.use(autenticar);

// GET /api/estadisticas/mapa — colegios y estudiantes atendidos por municipio y departamento
router.get('/mapa', async (req, res, next) => {
  try {
    // Filtro opcional por tipo de discapacidad (va en el ON para no excluir municipios).
    const params = [];
    let filtE = '';
    if (req.query.discapacidad) { params.push(req.query.discapacidad); filtE = ` AND e.entorno_salud->>'discapacidad' = $${params.length}`; }
    const municipios = await query(
      `SELECT m.id, m.nombre AS municipio, d.nombre AS departamento,
              m.lat, m.lng,
              COUNT(DISTINCT i.id)  AS colegios,
              COUNT(DISTINCT e.id)  AS estudiantes
       FROM municipio m
       JOIN departamento d ON d.id = m.departamento_id
       LEFT JOIN institucion i ON i.municipio_id = m.id
       LEFT JOIN estudiante e ON e.institucion_id = i.id${filtE}
       GROUP BY m.id, m.nombre, d.nombre, m.lat, m.lng
       HAVING COUNT(DISTINCT i.id) > 0
       ORDER BY d.nombre, m.nombre`, params
    );
    const departamentos = await query(
      `SELECT d.nombre AS departamento,
              COUNT(DISTINCT i.id) AS colegios,
              COUNT(DISTINCT e.id) AS estudiantes
       FROM departamento d
       LEFT JOIN municipio m ON m.departamento_id = d.id
       LEFT JOIN institucion i ON i.municipio_id = m.id
       LEFT JOIN estudiante e ON e.institucion_id = i.id${filtE}
       GROUP BY d.nombre`, params
    );
    const totales = await query(
      `SELECT COUNT(DISTINCT i.id) AS colegios, COUNT(DISTINCT e.id) AS estudiantes,
              COUNT(DISTINCT m.id) FILTER (WHERE i.id IS NOT NULL) AS municipios
       FROM institucion i
       LEFT JOIN municipio m ON m.id = i.municipio_id
       LEFT JOIN estudiante e ON e.institucion_id = i.id`
    );
    res.json({
      municipios: municipios.rows,
      departamentos: departamentos.rows,
      totales: totales.rows[0],
    });
  } catch (err) { next(err); }
});

export default router;
