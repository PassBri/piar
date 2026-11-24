import { Router } from 'express';
import { query } from '../db.js';
import { autenticar } from '../middleware/auth.js';
import { auditar } from '../lib/auditoria.js';

const router = Router();
router.use(autenticar);

// GET /api/actas/:piarId
router.get('/:piarId', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM acta_acuerdo WHERE piar_id=$1', [req.params.piarId]);
    res.json(rows[0] || null);
  } catch (err) { next(err); }
});

// PUT /api/actas/:piarId  (crear o actualizar el acta de acuerdo, Anexo 3)
router.put('/:piarId', async (req, res, next) => {
  try {
    const { compromisos_familia, compromisos_institucion,
            firmada_familia, firmada_institucion, fecha_firma,
            firma_familia_img, firma_institucion_img } = req.body;
    const rol = req.usuario.rol;

    // El padre solo puede registrar/firmar la parte de la familia
    if (rol === 'padre') {
      const { rows } = await query(
        `INSERT INTO acta_acuerdo (piar_id, firmada_familia, firma_familia_img, fecha_firma)
         VALUES ($1, TRUE, $2, COALESCE($3, CURRENT_DATE))
         ON CONFLICT (piar_id) DO UPDATE SET firmada_familia = TRUE,
           firma_familia_img = COALESCE(EXCLUDED.firma_familia_img, acta_acuerdo.firma_familia_img),
           fecha_firma = COALESCE(acta_acuerdo.fecha_firma, EXCLUDED.fecha_firma)
         RETURNING *`,
        [req.params.piarId, firma_familia_img || null, fecha_firma || null]
      );
      await auditar(req, { entidad: 'acta', entidad_id: rows[0].id, piar_id: Number(req.params.piarId), accion: 'firmar', descripcion: 'La familia firmó el acta de acuerdo (Anexo 3)' });
      return res.json(rows[0]);
    }

    const { rows } = await query(
      `INSERT INTO acta_acuerdo
        (piar_id, compromisos_familia, compromisos_institucion, firmada_familia, firmada_institucion,
         firma_familia_img, firma_institucion_img, fecha_firma)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (piar_id) DO UPDATE SET
         compromisos_familia = EXCLUDED.compromisos_familia,
         compromisos_institucion = EXCLUDED.compromisos_institucion,
         firmada_familia = EXCLUDED.firmada_familia,
         firmada_institucion = EXCLUDED.firmada_institucion,
         firma_familia_img = COALESCE(EXCLUDED.firma_familia_img, acta_acuerdo.firma_familia_img),
         firma_institucion_img = COALESCE(EXCLUDED.firma_institucion_img, acta_acuerdo.firma_institucion_img),
         fecha_firma = EXCLUDED.fecha_firma
       RETURNING *`,
      [req.params.piarId, compromisos_familia, compromisos_institucion,
       !!firmada_familia, !!firmada_institucion,
       firma_familia_img || null, firma_institucion_img || null, fecha_firma || null]
    );
    await auditar(req, { entidad: 'acta', entidad_id: rows[0].id, piar_id: Number(req.params.piarId), accion: 'editar', descripcion: 'Actualizó el acta de acuerdo (Anexo 3)' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

export default router;
