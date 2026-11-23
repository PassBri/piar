import { Router } from 'express';
import PDFDocument from 'pdfkit';
import { query } from '../db.js';
import { autenticar } from '../middleware/auth.js';

const router = Router();
router.use(autenticar);

const GRIS = '#37474F';
const GRIS_MEDIO = '#607D8B';

// Decide si el PDF se abre en el navegador (inline) o se descarga (attachment)
function disposicion(req, filename) {
  const modo = req.query.descargar ? 'attachment' : 'inline';
  return `${modo}; filename="${filename}"`;
}

// Inserta una firma (imagen dataURL) en el PDF, si existe
function firma(doc, dataUrl, label, x, y) {
  doc.fontSize(9).fillColor(GRIS_MEDIO).text(label, x, y + 42, { width: 180 });
  if (dataUrl && dataUrl.startsWith('data:image')) {
    try {
      const base64 = dataUrl.split(',')[1];
      doc.image(Buffer.from(base64, 'base64'), x, y, { fit: [170, 40] });
    } catch { /* firma inválida, se omite */ }
  } else {
    doc.moveTo(x, y + 40).lineTo(x + 170, y + 40).strokeColor(GRIS_MEDIO).stroke();
  }
}

function encabezado(doc, titulo, inst) {
  doc.fillColor(GRIS).fontSize(16).text('PIAR', { continued: false });
  doc.fillColor(GRIS_MEDIO).fontSize(10)
     .text('Plan Individual de Ajustes Razonables — Decreto 1421 de 2017');
  if (inst) {
    doc.fillColor('#000').fontSize(9)
       .text(`${inst.departamento_nombre || ''} · ${inst.municipio_nombre || ''} · ${inst.nombre || ''}`);
  }
  doc.moveDown(0.5);
  doc.fillColor(GRIS).fontSize(13).text(titulo);
  doc.moveTo(doc.x, doc.y).lineTo(555, doc.y).strokeColor(GRIS_MEDIO).stroke();
  doc.moveDown(0.5).fillColor('#000').fontSize(10);
}

async function cargarPiar(id) {
  const { rows } = await query(
    `SELECT p.*, e.nombres AS estudiante, e.documento_numero, e.grado,
            i.nombre AS inst_nombre, m.nombre AS municipio_nombre, d.nombre AS departamento_nombre
     FROM piar p
     JOIN estudiante e ON e.id = p.estudiante_id
     LEFT JOIN institucion i ON i.id = e.institucion_id
     LEFT JOIN municipio m ON m.id = i.municipio_id
     LEFT JOIN departamento d ON d.id = m.departamento_id
     WHERE p.id = $1`, [id]
  );
  if (!rows[0]) return null;
  const ajustes = await query(
    `SELECT a.*, ar.nombre AS area_nombre FROM ajuste_razonable a
     LEFT JOIN area ar ON ar.id = a.area_id WHERE a.piar_id = $1 ORDER BY a.id`, [id]
  );
  return { piar: rows[0], ajustes: ajustes.rows };
}

// GET /api/informes/estudiante/:id/pdf — imprime el Anexo 1 (información general)
router.get('/estudiante/:id/pdf', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT e.*, i.nombre AS inst_nombre, m.nombre AS municipio_nombre, d.nombre AS departamento_nombre
       FROM estudiante e
       LEFT JOIN institucion i ON i.id = e.institucion_id
       LEFT JOIN municipio m ON m.id = i.municipio_id
       LEFT JOIN departamento d ON d.id = m.departamento_id
       WHERE e.id = $1`, [req.params.id]
    );
    const e = rows[0];
    if (!e) return res.status(404).json({ error: 'Estudiante no encontrado.' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', disposicion(req, `Anexo1_${e.id}.pdf`));
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    doc.pipe(res);
    encabezado(doc, 'Anexo 1 — Información general del estudiante',
      { nombre: e.inst_nombre, municipio_nombre: e.municipio_nombre, departamento_nombre: e.departamento_nombre });

    const linea = (k, v) => doc.font('Helvetica-Bold').text(`${k}: `, { continued: true })
      .font('Helvetica').text(v || 'N/D');
    doc.fontSize(10);
    linea('Nombres', e.nombres);
    linea('Documento', `${e.documento_tipo || ''} ${e.documento_numero || ''}`);
    linea('Grado', e.grado);
    linea('Fecha de nacimiento', e.fecha_nacimiento ? new Date(e.fecha_nacimiento).toLocaleDateString('es-CO') : null);

    const bloque = (titulo, obj) => {
      doc.moveDown(0.5).fillColor(GRIS).font('Helvetica-Bold').fontSize(12).text(titulo);
      doc.fillColor('#000').fontSize(10);
      const entradas = Object.entries(obj || {}).filter(([, v]) => v);
      if (entradas.length === 0) doc.font('Helvetica-Oblique').text('Sin información.');
      entradas.forEach(([k, v]) => linea(k.replace(/_/g, ' '), v));
    };
    bloque('Identificación', e.identificacion);
    bloque('Entorno personal', e.entorno_personal);
    bloque('Entorno de salud', e.entorno_salud);
    bloque('Entorno de hogar', e.entorno_hogar);
    doc.end();
  } catch (err) { next(err); }
});

// GET /api/informes/piar/:id/pdf  — imprime los formatos del PIAR (Anexo 2)
router.get('/piar/:id/pdf', async (req, res, next) => {
  try {
    const data = await cargarPiar(req.params.id);
    if (!data) return res.status(404).json({ error: 'PIAR no encontrado.' });
    const { piar, ajustes } = data;
    const inst = { nombre: piar.inst_nombre, municipio_nombre: piar.municipio_nombre, departamento_nombre: piar.departamento_nombre };

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', disposicion(req, `PIAR_${piar.estudiante_id}.pdf`));
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    doc.pipe(res);

    encabezado(doc, 'Plan Individual de Ajustes Razonables (Anexo 2)', inst);
    doc.font('Helvetica-Bold').text(`Estudiante: `, { continued: true }).font('Helvetica').text(piar.estudiante || '');
    doc.font('Helvetica-Bold').text(`Documento: `, { continued: true }).font('Helvetica').text(piar.documento_numero || 'N/D');
    doc.font('Helvetica-Bold').text(`Grado: `, { continued: true }).font('Helvetica').text(piar.grado || 'N/D');
    doc.font('Helvetica-Bold').text(`Periodo: `, { continued: true }).font('Helvetica').text(piar.periodo || '');
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Valoración pedagógica:').font('Helvetica').text(piar.valoracion || 'Sin registrar.');
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold').text('Aspectos generales:').font('Helvetica').text(piar.aspectos_generales || 'Sin registrar.');
    doc.moveDown(0.5);

    doc.fillColor(GRIS).font('Helvetica-Bold').fontSize(12).text('Barreras y ajustes razonables');
    doc.moveDown(0.3).fillColor('#000').fontSize(10);
    if (ajustes.length === 0) {
      doc.font('Helvetica-Oblique').text('No se han registrado ajustes.');
    }
    ajustes.forEach((a, i) => {
      doc.font('Helvetica-Bold').text(`${i + 1}. Área: ${a.area_nombre || 'N/D'}  ·  Tipo: ${a.tipo}`);
      doc.font('Helvetica').text(`Barrera: ${a.barrera}`);
      doc.text(`Ajuste: ${a.descripcion}`);
      if (a.apoyo) doc.text(`Apoyo requerido: ${a.apoyo} (${a.intensidad})`);
      if (a.retirado) doc.fillColor(GRIS_MEDIO).text(`Retirado: ${a.justificacion_retiro || ''}`).fillColor('#000');
      doc.moveDown(0.3);
    });

    doc.moveDown(2);
    doc.fontSize(9).fillColor(GRIS_MEDIO)
       .text('_______________________________        _______________________________');
    doc.text('Docente                                             Coordinación / Rectoría');
    doc.end();
  } catch (err) { next(err); }
});

// GET /api/informes/seguimiento/:piarId/pdf — informe de seguimiento
router.get('/seguimiento/:piarId/pdf', async (req, res, next) => {
  try {
    const data = await cargarPiar(req.params.piarId);
    if (!data) return res.status(404).json({ error: 'PIAR no encontrado.' });
    const { piar, ajustes } = data;
    const inst = { nombre: piar.inst_nombre, municipio_nombre: piar.municipio_nombre, departamento_nombre: piar.departamento_nombre };

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', disposicion(req, `Seguimiento_${piar.estudiante_id}.pdf`));
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    doc.pipe(res);
    encabezado(doc, 'Informe de seguimiento de ajustes', inst);
    doc.font('Helvetica-Bold').text(`Estudiante: `, { continued: true }).font('Helvetica').text(piar.estudiante || '');
    doc.font('Helvetica-Bold').text(`Periodo: `, { continued: true }).font('Helvetica').text(piar.periodo || '');
    doc.moveDown(0.5);

    for (const a of ajustes) {
      const seg = await query('SELECT * FROM seguimiento WHERE ajuste_id=$1 ORDER BY fecha', [a.id]);
      doc.fillColor(GRIS).font('Helvetica-Bold').fontSize(11).text(`Ajuste: ${a.descripcion}`);
      doc.fillColor('#000').fontSize(10).font('Helvetica').text(`Barrera: ${a.barrera}`);
      doc.font('Helvetica-Bold').text(`Seguimientos registrados: ${seg.rows.length} (mínimo 3 al año)`);
      doc.font('Helvetica');
      seg.rows.forEach((s) => {
        const f = new Date(s.fecha).toLocaleDateString('es-CO');
        doc.text(`  • ${f} — ${s.decision}: ${s.impacto || 'sin observación'}`);
      });
      doc.moveDown(0.4);
    }
    doc.end();
  } catch (err) { next(err); }
});

// GET /api/informes/acta/:piarId/pdf — Acta de acuerdo (Anexo 3) con firmas
router.get('/acta/:piarId/pdf', async (req, res, next) => {
  try {
    const data = await cargarPiar(req.params.piarId);
    if (!data) return res.status(404).json({ error: 'PIAR no encontrado.' });
    const { piar } = data;
    const a = (await query('SELECT * FROM acta_acuerdo WHERE piar_id=$1', [req.params.piarId])).rows[0] || {};
    const inst = { nombre: piar.inst_nombre, municipio_nombre: piar.municipio_nombre, departamento_nombre: piar.departamento_nombre };

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', disposicion(req, `Acta_${piar.estudiante_id}.pdf`));
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    doc.pipe(res);
    encabezado(doc, 'Acta de acuerdo con la familia (Anexo 3)', inst);
    doc.font('Helvetica-Bold').text('Estudiante: ', { continued: true }).font('Helvetica').text(piar.estudiante || '');
    doc.font('Helvetica-Bold').text('Periodo: ', { continued: true }).font('Helvetica').text(piar.periodo || '');
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Compromisos de la familia:').font('Helvetica').text(a.compromisos_familia || 'Sin registrar.');
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold').text('Compromisos de la institución:').font('Helvetica').text(a.compromisos_institucion || 'Sin registrar.');
    doc.moveDown(2.5);

    const y = doc.y;
    firma(doc, a.firma_familia_img, a.firmada_familia ? 'Firma de la familia / acudiente' : 'Firma de la familia / acudiente (pendiente)', 60, y);
    firma(doc, a.firma_institucion_img, 'Firma de la institución', 330, y);
    doc.end();
  } catch (err) { next(err); }
});

// GET /api/informes/indicadores — agregados por territorio
router.get('/indicadores', async (req, res, next) => {
  try {
    const porInstitucion = await query(
      `SELECT i.id, i.nombre AS institucion, m.nombre AS municipio, d.nombre AS departamento,
              COUNT(DISTINCT e.id) AS estudiantes,
              COUNT(DISTINCT p.id) FILTER (WHERE p.estado = 'vigente') AS piar_vigentes
       FROM institucion i
       LEFT JOIN municipio m ON m.id = i.municipio_id
       LEFT JOIN departamento d ON d.id = m.departamento_id
       LEFT JOIN estudiante e ON e.institucion_id = i.id
       LEFT JOIN piar p ON p.estudiante_id = e.id
       GROUP BY i.id, i.nombre, m.nombre, d.nombre
       ORDER BY d.nombre, m.nombre, i.nombre`
    );
    res.json({ por_institucion: porInstitucion.rows });
  } catch (err) { next(err); }
});

export default router;
