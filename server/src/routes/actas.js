import { Router } from 'express';
import { query } from '../db.js';
import { autenticar, autorizar } from '../middleware/auth.js';

const router = Router();
router.use(autenticar);

// PUT /api/actas/:piarId  (crear o actualizar el acta de acuerdo, Anexo 3)
router.put('/:piarId', async (req, res, next) => {
  try {
    const { compromisos_familia, compromisos_institucion,
            firmada_familia, firmada_institucion, fecha_firma } = req.body;
    const rol = req.usuario.rol;
    // El padre solo puede firmar la parte de la familia
    if (rol === 'padre') {
      const { rows } = await query(
        `INSERT INTO acta_acuerdo (piar_id, firmada_familia, fecha_firma)
         VALUES ($1, TRUE, COALESCE($2, CURRENT_DATE))
         ON CONFLICT (piar_id) DO UPDATE SET firmada_familia = TRUE,
           fecha_firma = COALESCE(acta_acuerdo.fecha_firma, EXCLUDED.fecha_firma)
         RETURNING *`,
        [req.params.piarId, fecha_firma || null]
      );
      return res.json(rows[0]);
    }
    const { rows } = await query(
      `INSERT INTO acta_acuerdo
        (piar_id, compromisos_familia, compromisos_institucion, firmada_familia, firmada_institucion, fecha_firma)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (piar_id) DO UPDATE SET
         compromisos_familia = EXCLUDED.compromisos_familia,
         compromisos_institucion = EXCLUDED.compromisos_institucion,
         firmada_familia = EXCLUDED.firmada_familia,
         firmada_institucion = EXCLUDED.firmada_institucion,
         fecha_firma = EXCLUDED.fecha_firma
       RETURNING *`,
      [req.params.piarId, compromisos_familia, compromisos_institucion,
       !!firmada_familia, !!firmada_institucion, fecha_firma || null]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
});

export default router;
