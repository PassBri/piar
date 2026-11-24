import { Router } from 'express';
import { query } from '../db.js';
import { autenticar, autorizar } from '../middleware/auth.js';

const router = Router();
router.use(autenticar);

// GET /api/respaldo  — exporta los datos en JSON (respaldo lógico descargable). Solo superadmin.
router.get('/', autorizar('superadmin'), async (req, res, next) => {
  try {
    const tablas = ['departamento', 'municipio', 'institucion', 'curso', 'area',
      'estudiante', 'piar', 'ajuste_razonable', 'valoracion_area', 'acta_acuerdo',
      'anexo4', 'promocion', 'prueba_estado', 'remision', 'tamizaje', 'seguimiento',
      'autorizacion_datos'];
    const dump = { generado: new Date().toISOString(), tablas: {} };
    for (const t of tablas) {
      const { rows } = await query(`SELECT * FROM ${t}`);
      dump.tablas[t] = rows;
    }
    // Usuarios sin el hash de la contraseña
    dump.tablas.usuario = (await query('SELECT id, institucion_id, nombres, correo, rol, activo FROM usuario')).rows;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="respaldo_piar_${new Date().toISOString().slice(0, 10)}.json"`);
    res.send(JSON.stringify(dump, null, 2));
  } catch (err) { next(err); }
});

export default router;
