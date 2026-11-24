import { Router } from 'express';
import { query } from '../db.js';
import { autenticar, autorizar } from '../middleware/auth.js';
import { auditar } from '../lib/auditoria.js';
import { negarAcceso, accesoPiar } from '../lib/acceso.js';

const router = Router();
router.use(autenticar);

// GET /api/anexo4/:piarId
router.get('/:piarId', async (req, res, next) => {
  try {
    const neg = negarAcceso(req.usuario, await accesoPiar(req.params.piarId));
    if (neg) return res.status(neg.status).json({ error: neg.error });
    const { rows } = await query('SELECT * FROM anexo4 WHERE piar_id = $1', [req.params.piarId]);
    res.json(rows[0] || null);
  } catch (err) { next(err); }
});

// PUT /api/anexo4/:piarId  (crear o actualizar)
router.put('/:piarId', autorizar('docente', 'psicoorientador', 'administrador', 'coordinador', 'rector', 'superadmin'), async (req, res, next) => {
  try {
    const neg = negarAcceso(req.usuario, await accesoPiar(req.params.piarId));
    if (neg) return res.status(neg.status).json({ error: neg.error });
    const { logros, recomendaciones, grado_destino, institucion_destino, apoyos_transicion,
            observaciones, firmada_entrega, firma_entrega_img, firma_recibe_img, fecha } = req.body;
    const { rows } = await query(
      `INSERT INTO anexo4
        (piar_id, logros, recomendaciones, grado_destino, institucion_destino, apoyos_transicion,
         observaciones, firmada_entrega, firma_entrega_img, firma_recibe_img, fecha)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (piar_id) DO UPDATE SET
         logros = EXCLUDED.logros, recomendaciones = EXCLUDED.recomendaciones,
         grado_destino = EXCLUDED.grado_destino, institucion_destino = EXCLUDED.institucion_destino,
         apoyos_transicion = EXCLUDED.apoyos_transicion, observaciones = EXCLUDED.observaciones,
         firmada_entrega = EXCLUDED.firmada_entrega,
         firma_entrega_img = COALESCE(EXCLUDED.firma_entrega_img, anexo4.firma_entrega_img),
         firma_recibe_img = COALESCE(EXCLUDED.firma_recibe_img, anexo4.firma_recibe_img),
         fecha = EXCLUDED.fecha
       RETURNING *`,
      [req.params.piarId, logros || null, recomendaciones || null, grado_destino || null,
       institucion_destino || null, apoyos_transicion || null, observaciones || null,
       !!firmada_entrega, firma_entrega_img || null, firma_recibe_img || null, fecha || null]
    );
    await auditar(req, { entidad: 'anexo4', entidad_id: rows[0].id, piar_id: Number(req.params.piarId), accion: 'editar', descripcion: 'Actualizó el Anexo 4 (seguimiento/entrega y transición)' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

export default router;
