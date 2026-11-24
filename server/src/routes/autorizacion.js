import { Router } from 'express';
import { query } from '../db.js';
import { autenticar } from '../middleware/auth.js';
import { auditar } from '../lib/auditoria.js';
import { negarAcceso, accesoEstudiante } from '../lib/acceso.js';

const router = Router();
router.use(autenticar);

// GET /api/autorizacion/:estudianteId
router.get('/:estudianteId', async (req, res, next) => {
  try {
    const neg = negarAcceso(req.usuario, await accesoEstudiante(req.params.estudianteId));
    if (neg) return res.status(neg.status).json({ error: neg.error });
    const { rows } = await query('SELECT * FROM autorizacion_datos WHERE estudiante_id=$1', [req.params.estudianteId]);
    res.json(rows[0] || null);
  } catch (err) { next(err); }
});

// PUT /api/autorizacion/:estudianteId  (la familia autoriza; el acudiente firma)
router.put('/:estudianteId', async (req, res, next) => {
  try {
    const neg = negarAcceso(req.usuario, await accesoEstudiante(req.params.estudianteId));
    if (neg) return res.status(neg.status).json({ error: neg.error });
    const { autoriza, nombre_acudiente, documento_acudiente, parentesco, fecha, firma_img } = req.body;
    const { rows } = await query(
      `INSERT INTO autorizacion_datos (estudiante_id, autoriza, nombre_acudiente, documento_acudiente, parentesco, fecha, firma_img)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (estudiante_id) DO UPDATE SET autoriza=EXCLUDED.autoriza, nombre_acudiente=EXCLUDED.nombre_acudiente,
         documento_acudiente=EXCLUDED.documento_acudiente, parentesco=EXCLUDED.parentesco, fecha=EXCLUDED.fecha,
         firma_img=COALESCE(EXCLUDED.firma_img, autorizacion_datos.firma_img)
       RETURNING *`,
      [req.params.estudianteId, !!autoriza, nombre_acudiente || null, documento_acudiente || null,
       parentesco || null, fecha || null, firma_img || null]
    );
    await auditar(req, { entidad: 'autorizacion', entidad_id: rows[0].id, estudiante_id: Number(req.params.estudianteId), accion: 'editar', descripcion: `Autorización de datos ${autoriza ? 'otorgada' : 'actualizada'}` });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

export default router;
