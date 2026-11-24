import { Router } from 'express';
import { query } from '../db.js';
import { autenticar, autorizar } from '../middleware/auth.js';
import { avancePiar } from '../lib/avance.js';
import { auditar } from '../lib/auditoria.js';
import { negarAcceso, accesoPiar } from '../lib/acceso.js';

const router = Router();
router.use(autenticar);

// GET /api/piar?estudiante_id=  (lista PIAR de un estudiante)
router.get('/', async (req, res, next) => {
  try {
    const { estudiante_id } = req.query;
    const esSuper = req.usuario.rol === 'superadmin';
    const { rows } = await query(
      `SELECT p.*, e.nombres AS estudiante_nombre, e.grado AS grado_actual
       FROM piar p JOIN estudiante e ON e.id = p.estudiante_id
       WHERE ($1::int IS NULL OR p.estudiante_id = $1)
         AND ($2::boolean OR e.institucion_id = $3)
       ORDER BY p.periodo DESC, p.creado_en DESC`,
      [estudiante_id || null, esSuper, req.usuario.institucion_id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/piar/avance/listado  (control: % de avance de cada PIAR, para supervisión)
router.get('/avance/listado', autorizar('superadmin', 'rector', 'coordinador', 'psicoorientador', 'administrador', 'docente'), async (req, res, next) => {
  try {
    const esSuper = req.usuario.rol === 'superadmin';
    const veReservados = ['psicoorientador', 'coordinador', 'rector', 'administrador', 'superadmin'].includes(req.usuario.rol);
    const { rows } = await query(
      `SELECT p.id AS piar_id, p.periodo, p.estado, p.valoracion, p.aspectos_generales, e.*,
              e.entorno_salud->>'discapacidad' AS discapacidad,
              i.nombre AS institucion_nombre,
              c.sede AS curso_sede, c.jornada AS curso_jornada, c.grado AS curso_grado, c.grupo AS curso_grupo,
              (SELECT count(*) FROM ajuste_razonable a WHERE a.piar_id = p.id)::int AS num_ajustes,
              (SELECT count(*) FROM ajuste_razonable a WHERE a.piar_id = p.id AND COALESCE(a.desempeno,'') <> '')::int AS areas_val,
              row_to_json(ac.*) AS acta
       FROM piar p
       JOIN estudiante e ON e.id = p.estudiante_id
       LEFT JOIN institucion i ON i.id = e.institucion_id
       LEFT JOIN curso c ON c.id = e.curso_id
       LEFT JOIN acta_acuerdo ac ON ac.piar_id = p.id
       WHERE ($1::boolean OR e.institucion_id = $2) AND ($3::boolean OR e.reservado = FALSE)
       ORDER BY e.nombres`,
      [esSuper, req.usuario.institucion_id, veReservados]
    );
    const lista = rows.map((r) => ({
      piar_id: r.piar_id, estudiante_id: r.id, estudiante_nombre: r.nombres,
      grado: r.grado, periodo: r.periodo, estado: r.estado,
      institucion_nombre: r.institucion_nombre,
      discapacidad: r.discapacidad || '', fecha_nacimiento: r.fecha_nacimiento,
      curso_sede: r.curso_sede || '', curso_jornada: r.curso_jornada || '',
      curso_grado: r.curso_grado || '', curso_grupo: r.curso_grupo || '',
      avance: avancePiar({
        estudiante: r, piar: { valoracion: r.valoracion, aspectos_generales: r.aspectos_generales },
        numAjustes: r.num_ajustes, numAreasValoradas: r.areas_val, acta: r.acta,
      }),
    }));
    res.json(lista);
  } catch (err) { next(err); }
});

// GET /api/piar/:id  (detalle con ajustes y acta)
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT p.*, e.nombres AS estudiante_nombre, e.grado, e.documento_numero, e.fecha_nacimiento,
              e.institucion_id, e.reservado, i.nombre AS inst_nombre, i.sede AS inst_sede,
              COALESCE(i.num_periodos, 4) AS num_periodos,
              COALESCE(i.usa_promocion, true) AS usa_promocion,
              COALESCE(i.sistema_evaluacion, 'cualitativo') AS sistema_evaluacion
       FROM piar p JOIN estudiante e ON e.id = p.estudiante_id
       LEFT JOIN institucion i ON i.id = e.institucion_id WHERE p.id = $1`,
      [req.params.id]
    );
    const piar = rows[0];
    const neg = negarAcceso(req.usuario, piar);
    if (neg) return res.status(neg.status).json({ error: neg.error });
    const ajustes = await query(
      `SELECT a.*, ar.nombre AS area_nombre FROM ajuste_razonable a
       LEFT JOIN area ar ON ar.id = a.area_id WHERE a.piar_id = $1 ORDER BY a.id`,
      [req.params.id]
    );
    const acta = await query('SELECT * FROM acta_acuerdo WHERE piar_id = $1', [req.params.id]);
    // Avance de diligenciamiento por anexo (mecanismo de control)
    const est = await query(
      `SELECT nombres, documento_numero, grado, fecha_nacimiento,
              identificacion, entorno_salud, entorno_hogar, entorno_educativo
       FROM estudiante WHERE id = $1`, [piar.estudiante_id]);
    const conDesempeno = ajustes.rows.filter((a) => (a.desempeno || '').trim()).length;
    const avance = avancePiar({
      estudiante: est.rows[0], piar, numAjustes: ajustes.rows.length,
      numAreasValoradas: conDesempeno, acta: acta.rows[0],
    });
    res.json({ ...piar, ajustes: ajustes.rows, acta: acta.rows[0] || null, avance });
  } catch (err) { next(err); }
});

// POST /api/piar  (crear PIAR)
router.post('/', autorizar('docente', 'psicoorientador', 'administrador', 'coordinador', 'rector', 'superadmin'), async (req, res, next) => {
  try {
    const { estudiante_id, periodo, valoracion, aspectos_generales, recomendaciones_pmi } = req.body;
    if (!estudiante_id || !periodo) {
      return res.status(400).json({ error: 'Estudiante y periodo son obligatorios.' });
    }
    // Hereda el grado actual del estudiante (grado de ese año, para la trayectoria)
    const gr = await query('SELECT grado FROM estudiante WHERE id=$1', [estudiante_id]);
    const { rows } = await query(
      `INSERT INTO piar (estudiante_id, periodo, valoracion, aspectos_generales, recomendaciones_pmi, grado, fecha_elaboracion, creado_por)
       VALUES ($1,$2,$3,$4,$5,$6,CURRENT_DATE,$7) RETURNING *`,
      [estudiante_id, periodo, valoracion, aspectos_generales, recomendaciones_pmi || {}, gr.rows[0]?.grado || null, req.usuario.id]
    );
    await auditar(req, { entidad: 'piar', entidad_id: rows[0].id, piar_id: rows[0].id, estudiante_id, accion: 'crear', descripcion: `Creó el PIAR (${periodo})` });
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// PUT /api/piar/:id
router.put('/:id', autorizar('docente', 'psicoorientador', 'administrador', 'coordinador', 'rector', 'superadmin'), async (req, res, next) => {
  try {
    const { periodo, valoracion, aspectos_generales, recomendaciones_pmi, estado,
            pmi, grado, director_grupo, fecha_elaboracion, caracteristicas } = req.body;
    const neg = negarAcceso(req.usuario, await accesoPiar(req.params.id));
    if (neg) return res.status(neg.status).json({ error: neg.error });
    const { rows } = await query(
      `UPDATE piar SET periodo=$1, valoracion=$2, aspectos_generales=$3,
         recomendaciones_pmi=$4, estado=COALESCE($5,estado),
         pmi=$6, grado=COALESCE($7,grado), director_grupo=$8,
         fecha_elaboracion=COALESCE($9,fecha_elaboracion),
         caracteristicas=COALESCE($11,caracteristicas), actualizado_en=now()
       WHERE id=$10 RETURNING *`,
      [periodo, valoracion, aspectos_generales, recomendaciones_pmi || {}, estado || null,
       pmi || null, grado || null, director_grupo || null, fecha_elaboracion || null, req.params.id,
       caracteristicas ? JSON.stringify(caracteristicas) : null]
    );
    if (!rows[0]) return res.status(404).json({ error: 'PIAR no encontrado.' });
    await auditar(req, { entidad: 'piar', entidad_id: Number(req.params.id), piar_id: Number(req.params.id), accion: 'editar', descripcion: 'Actualizó la valoración del PIAR (Anexo 2)' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

export default router;
