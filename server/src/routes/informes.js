import { Router } from 'express';
import PDFDocument from 'pdfkit';
import { query } from '../db.js';
import { autenticar } from '../middleware/auth.js';

const router = Router();
router.use(autenticar);

const GRIS = '#37474F';
const GRIS_MEDIO = '#607D8B';
const GRIS_CLARO = '#ECEFF1';
const BORDE = '#888';
const X0 = 36, ANCHO = 523, TOPE = 735; // área útil

function disposicion(req, filename) {
  return `${req.query.descargar ? 'attachment' : 'inline'}; filename="${filename}"`;
}

// ---- Maquetación estilo formato oficial del MEN ----
// Dibuja el membrete y el pie en coordenadas absolutas, sin provocar paginación.
function decorar(doc) {
  doc.lineWidth(1).rect(444, 28, 114, 32).stroke('#999');
  doc.font('Helvetica-Bold').fontSize(11).fillColor(GRIS).text('PIAR', 444, 33, { width: 114, align: 'center', lineBreak: false });
  doc.font('Helvetica').fontSize(7.5).fillColor(GRIS_MEDIO).text('Decreto 1421/2017', 444, 47, { width: 114, align: 'center', lineBreak: false });
  doc.font('Helvetica').fontSize(7).fillColor(GRIS_MEDIO)
     .text('Ministerio de Educación Nacional – Viceministerio de Educación Preescolar, Básica y Media – Decreto 1421 de 2017',
       X0, 745, { width: ANCHO, align: 'center', lineBreak: false });
  doc.fillColor('#000');
}

function iniciar(res, req, filename) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', disposicion(req, filename));
  const doc = new PDFDocument({ size: 'LETTER', bufferPages: true, margins: { top: 68, bottom: 26, left: 36, right: 36 } });
  doc.pipe(res);
  return doc;
}

// Decora todas las páginas y cierra el documento.
function finalizar(doc) {
  const r = doc.bufferedPageRange();
  for (let i = r.start; i < r.start + r.count; i++) { doc.switchToPage(i); decorar(doc); }
  doc.end();
}

function titulo(doc, texto, sub) {
  doc.fillColor('#000').font('Helvetica-Bold').fontSize(12).text(texto, X0, doc.y, { width: 400 });
  if (sub) doc.font('Helvetica').fontSize(8.5).fillColor(GRIS_MEDIO).text(sub, X0, doc.y, { width: 400 });
  doc.fillColor('#000').moveDown(0.6);
}

function saltoSi(doc, alto) { if (doc.y + alto > TOPE) doc.addPage(); }

function banda(doc, texto) {
  saltoSi(doc, 20);
  const y = doc.y;
  doc.rect(X0, y, ANCHO, 16).fill(GRIS);
  doc.fillColor('#fff').font('Helvetica-Bold').fontSize(9).text(texto, X0 + 5, y + 4, { width: ANCHO - 10 });
  doc.fillColor('#000'); doc.y = y + 16;
}

// Fila de campos: pares [etiqueta, valor]; 1 o 2 por fila
function campos(doc, pares) {
  const n = pares.length;
  const colW = ANCHO / n;
  const labelW = colW * 0.44, valW = colW - labelW;
  let alto = 15;
  pares.forEach(([l, v]) => {
    doc.font('Helvetica-Bold').fontSize(8);
    const hl = doc.heightOfString(l || '', { width: labelW - 6 });
    doc.font('Helvetica').fontSize(8);
    const hv = doc.heightOfString(String(v || '—'), { width: valW - 6 });
    alto = Math.max(alto, hl + 6, hv + 6);
  });
  saltoSi(doc, alto);
  const y = doc.y;
  pares.forEach(([l, v], i) => {
    const cx = X0 + i * colW;
    doc.rect(cx, y, labelW, alto).fillAndStroke(GRIS_CLARO, BORDE);
    doc.fillColor('#000').font('Helvetica-Bold').fontSize(8).text(l, cx + 3, y + 3, { width: labelW - 6 });
    doc.rect(cx + labelW, y, valW, alto).stroke(BORDE);
    doc.font('Helvetica').fontSize(8).text(String(v || '—'), cx + labelW + 3, y + 3, { width: valW - 6 });
  });
  doc.y = y + alto;
}

// Dibuja un objeto JSON como pares (2 por fila) según un listado [clave, etiqueta]
function seccionJson(doc, obj, listado) {
  obj = obj || {};
  const fila = [];
  listado.forEach(([k, label, ancho]) => {
    const par = [label, obj[k]];
    if (ancho === 'full') {
      if (fila.length) { campos(doc, [...fila]); fila.length = 0; }
      campos(doc, [par]);
    } else {
      fila.push(par);
      if (fila.length === 2) { campos(doc, fila.slice()); fila.length = 0; }
    }
  });
  if (fila.length) campos(doc, fila);
}

// ---- Tabla de ajustes razonables (Anexo 2), estilo oficial ----
const COLS_AJ = [
  ['Área/Aprendizaje', 68], ['Objetivos/Propósitos', 108], ['Barreras', 104],
  ['Ajustes razonables', 120], ['Evaluación de los ajustes', 123],
];
function cabeceraAjustes(doc) {
  saltoSi(doc, 26);
  const y = doc.y; let x = X0;
  COLS_AJ.forEach(([t, w]) => {
    doc.rect(x, y, w, 24).fillAndStroke(GRIS, BORDE);
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(7.5).text(t, x + 2, y + 3, { width: w - 4, align: 'center' });
    x += w;
  });
  doc.fillColor('#000'); doc.y = y + 24;
}
function filaAjuste(doc, a) {
  const vals = [a.area_nombre || '—', a.objetivo || '—', a.barrera || '—', a.descripcion || '—',
                a.evaluacion || (a.apoyo ? `Apoyo: ${a.apoyo}` : '—')];
  let alto = 18;
  vals.forEach((v, i) => {
    doc.font('Helvetica').fontSize(7.5);
    alto = Math.max(alto, doc.heightOfString(String(v), { width: COLS_AJ[i][1] - 6 }) + 6);
  });
  if (doc.y + alto > TOPE) { doc.addPage(); cabeceraAjustes(doc); }
  const y = doc.y; let x = X0;
  COLS_AJ.forEach(([, w], i) => {
    doc.rect(x, y, w, alto).stroke(BORDE);
    doc.fillColor('#000').font('Helvetica').fontSize(7.5).text(String(vals[i]), x + 3, y + 3, { width: w - 6 });
    x += w;
  });
  doc.y = y + alto;
}

async function cargarPiar(id) {
  const { rows } = await query(
    `SELECT p.*, e.nombres AS estudiante, e.documento_tipo, e.documento_numero, e.grado, e.fecha_nacimiento,
            i.nombre AS inst_nombre, i.sede AS inst_sede, m.nombre AS municipio_nombre, d.nombre AS departamento_nombre
     FROM piar p JOIN estudiante e ON e.id = p.estudiante_id
     LEFT JOIN institucion i ON i.id = e.institucion_id
     LEFT JOIN municipio m ON m.id = i.municipio_id
     LEFT JOIN departamento d ON d.id = m.departamento_id WHERE p.id = $1`, [id]);
  if (!rows[0]) return null;
  const ajustes = await query(
    `SELECT a.*, ar.nombre AS area_nombre FROM ajuste_razonable a
     LEFT JOIN area ar ON ar.id = a.area_id WHERE a.piar_id = $1 ORDER BY a.periodo, a.id`, [id]);
  return { piar: rows[0], ajustes: ajustes.rows };
}

// ====== ANEXO 1 ======
router.get('/estudiante/:id/pdf', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT e.*, i.nombre AS inst_nombre, i.sede AS inst_sede, m.nombre AS municipio_nombre, d.nombre AS departamento_nombre
       FROM estudiante e LEFT JOIN institucion i ON i.id = e.institucion_id
       LEFT JOIN municipio m ON m.id = i.municipio_id LEFT JOIN departamento d ON d.id = m.departamento_id
       WHERE e.id = $1`, [req.params.id]);
    const e = rows[0];
    if (!e) return res.status(404).json({ error: 'Estudiante no encontrado.' });
    const doc = iniciar(res, req, `Anexo1_${e.id}.pdf`);
    titulo(doc, 'INFORMACIÓN GENERAL DEL ESTUDIANTE', 'Información para la matrícula – Anexo 1 PIAR');
    campos(doc, [['Institución educativa', e.inst_nombre], ['Sede', e.inst_sede]]);
    campos(doc, [['Municipio', e.municipio_nombre], ['Departamento', e.departamento_nombre]]);

    banda(doc, '1) Información general del estudiante');
    campos(doc, [['Nombres y apellidos', e.nombres], ['Documento', `${e.documento_tipo || ''} ${e.documento_numero || ''}`]]);
    campos(doc, [['Fecha de nacimiento', e.fecha_nacimiento ? new Date(e.fecha_nacimiento).toLocaleDateString('es-CO') : '—'], ['Grado actual', e.grado]]);
    seccionJson(doc, e.identificacion, [
      ['sede', 'Sede'], ['jornada', 'Jornada'], ['grado_ingreso', 'Grado al que aspira ingresar'],
      ['lugar_nacimiento', 'Lugar de nacimiento'], ['sexo', 'Sexo'],
      ['departamento_vive', 'Departamento donde vive'], ['municipio_vive', 'Municipio'],
      ['direccion', 'Dirección'], ['barrio', 'Barrio / vereda'],
      ['telefono', 'Teléfono'], ['correo', 'Correo electrónico'],
      ['centro_proteccion', '¿Centro de protección?'], ['grupo_etnico', 'Grupo étnico'],
      ['victima_conflicto', '¿Víctima del conflicto armado?', 'full'],
    ]);

    banda(doc, '2) Entorno salud');
    seccionJson(doc, e.entorno_salud, [
      ['afiliacion', 'Afiliación a salud'], ['eps', 'EPS'], ['regimen', 'Régimen'],
      ['lugar_atencion', 'Lugar de atención en emergencia'], ['atendido_salud', '¿Atendido por el sector salud?'],
      ['diagnostico', 'Diagnóstico médico'], ['discapacidad', 'Tipo de discapacidad'],
      ['terapias', '¿Asiste a terapias?'], ['tratamiento', '¿Tratamiento médico?'],
      ['medicamentos', '¿Consume medicamentos?', 'full'], ['productos_apoyo', 'Productos de apoyo', 'full'],
    ]);

    banda(doc, '3) Entorno hogar');
    seccionJson(doc, e.entorno_hogar, [
      ['nombre_madre', 'Nombre de la madre'], ['ocupacion_madre', 'Ocupación de la madre'],
      ['nivel_madre', 'Nivel educativo madre'], ['nombre_padre', 'Nombre del padre'],
      ['ocupacion_padre', 'Ocupación del padre'], ['nivel_padre', 'Nivel educativo padre'],
      ['nombre_cuidador', 'Nombre del cuidador'], ['parentesco_cuidador', 'Parentesco'],
      ['nivel_cuidador', 'Nivel educativo cuidador'], ['telefono_cuidador', 'Teléfono / correo cuidador'],
      ['num_hermanos', 'N.º de hermanos'], ['lugar_ocupa', 'Lugar que ocupa'],
      ['personas_vive', 'Personas con quien vive'], ['apoyan_crianza', 'Apoyan la crianza'],
      ['bajo_proteccion', '¿Bajo protección?'], ['subsidio', '¿Recibe subsidio?'],
    ]);

    banda(doc, '4) Entorno educativo (trayectoria)');
    seccionJson(doc, e.entorno_educativo, [
      ['vinculado_otra_ie', '¿Vinculado a otra IE?'], ['ultimo_grado', 'Último grado cursado'],
      ['aprobo', '¿Aprobó?'], ['recibe_informe', '¿Recibe informe pedagógico?'],
      ['observaciones', 'Observaciones', 'full'],
      ['programas_complementarios', '¿Programas complementarios?', 'full'],
      ['ie_matricula', 'IE en la que se matricula'], ['sede_matricula', 'Sede'],
      ['transporte', 'Medio de transporte'], ['distancia', 'Distancia IE–hogar'],
    ]);

    saltoSi(doc, 56);
    doc.moveDown(1);
    const yf = doc.y;
    ['Nombre y firma', 'Nombre y firma', 'Nombre y firma'].forEach((t, i) => {
      const x = X0 + i * (ANCHO / 3) + 10;
      doc.moveTo(x, yf + 24).lineTo(x + 140, yf + 24).stroke(BORDE);
      doc.font('Helvetica').fontSize(8).fillColor(GRIS_MEDIO).text(t, x, yf + 26, { width: 140, lineBreak: false });
      doc.text('Área: ________________', x, yf + 38, { width: 150, lineBreak: false });
    });
    doc.y = yf + 52;
    finalizar(doc);
  } catch (err) { next(err); }
});

// ====== ANEXO 2 ======
router.get('/piar/:id/pdf', async (req, res, next) => {
  try {
    const data = await cargarPiar(req.params.id);
    if (!data) return res.status(404).json({ error: 'PIAR no encontrado.' });
    const { piar, ajustes } = data;
    const doc = iniciar(res, req, `Anexo2_${piar.estudiante_id}.pdf`);
    titulo(doc, 'PLAN INDIVIDUAL DE AJUSTES RAZONABLES – ANEXO 2');
    campos(doc, [['Institución educativa', piar.inst_nombre], ['Sede', piar.inst_sede]]);
    campos(doc, [['Periodo / Año', piar.periodo], ['Estado', piar.estado]]);

    banda(doc, 'Datos del estudiante');
    campos(doc, [['Nombre del estudiante', piar.estudiante], ['Documento', `${piar.documento_tipo || ''} ${piar.documento_numero || ''}`]]);
    campos(doc, [['Grado', piar.grado], ['Fecha de nacimiento', piar.fecha_nacimiento ? new Date(piar.fecha_nacimiento).toLocaleDateString('es-CO') : '—']]);

    banda(doc, '1. Características del estudiante');
    campos(doc, [['Valoración pedagógica', piar.valoracion || '—']]);
    campos(doc, [['Aspectos generales (gustos, habilidades, apoyos)', piar.aspectos_generales || '—']]);

    banda(doc, '2. Ajustes razonables (por periodo)');
    const PERIODOS = ['PRIMER PERIODO', 'SEGUNDO PERIODO', 'TERCER PERIODO', 'CUARTO PERIODO'];
    [1, 2, 3, 4].forEach((p) => {
      const delP = ajustes.filter((a) => a.periodo === p);
      if (delP.length === 0) return;
      doc.moveDown(0.3);
      saltoSi(doc, 44);
      doc.font('Helvetica-Bold').fontSize(9).fillColor(GRIS).text(PERIODOS[p - 1], X0, doc.y);
      doc.fillColor('#000'); doc.moveDown(0.2);
      cabeceraAjustes(doc);
      delP.forEach((a) => filaAjuste(doc, a));
    });
    if (ajustes.length === 0) doc.font('Helvetica-Oblique').fontSize(9).text('No se han registrado ajustes razonables.');
    finalizar(doc);
  } catch (err) { next(err); }
});

// ====== ANEXO 3 (Acta) ======
router.get('/acta/:piarId/pdf', async (req, res, next) => {
  try {
    const data = await cargarPiar(req.params.piarId);
    if (!data) return res.status(404).json({ error: 'PIAR no encontrado.' });
    const { piar } = data;
    const a = (await query('SELECT * FROM acta_acuerdo WHERE piar_id=$1', [req.params.piarId])).rows[0] || {};
    const doc = iniciar(res, req, `Anexo3_Acta_${piar.estudiante_id}.pdf`);
    titulo(doc, 'ACTA DE ACUERDO CON LA FAMILIA – ANEXO 3');
    campos(doc, [['Institución educativa', piar.inst_nombre], ['Sede', piar.inst_sede]]);
    campos(doc, [['Estudiante', piar.estudiante], ['Periodo / Año', piar.periodo]]);
    banda(doc, 'Compromisos de la familia');
    campos(doc, [['Compromisos', a.compromisos_familia || '—']]);
    banda(doc, 'Compromisos de la institución');
    campos(doc, [['Compromisos', a.compromisos_institucion || '—']]);

    saltoSi(doc, 80);
    doc.moveDown(2);
    const y = doc.y;
    const firma = (x, img, label) => {
      if (img && img.startsWith('data:image')) {
        try { doc.image(Buffer.from(img.split(',')[1], 'base64'), x, y, { fit: [180, 46] }); } catch { /* ignora */ }
      }
      doc.moveTo(x, y + 50).lineTo(x + 190, y + 50).stroke(BORDE);
      doc.font('Helvetica').fontSize(8.5).fillColor(GRIS_MEDIO).text(label, x, y + 53, { width: 200, lineBreak: false });
    };
    firma(60, a.firma_familia_img, a.firmada_familia ? 'Firma de la familia / acudiente' : 'Firma de la familia / acudiente (pendiente)');
    firma(320, a.firma_institucion_img, 'Firma de la institución');
    finalizar(doc);
  } catch (err) { next(err); }
});

// ====== Informe de seguimiento ======
router.get('/seguimiento/:piarId/pdf', async (req, res, next) => {
  try {
    const data = await cargarPiar(req.params.piarId);
    if (!data) return res.status(404).json({ error: 'PIAR no encontrado.' });
    const { piar, ajustes } = data;
    const doc = iniciar(res, req, `Seguimiento_${piar.estudiante_id}.pdf`);
    titulo(doc, 'INFORME DE SEGUIMIENTO DE AJUSTES');
    campos(doc, [['Estudiante', piar.estudiante], ['Periodo / Año', piar.periodo]]);
    for (const a of ajustes) {
      const seg = await query('SELECT * FROM seguimiento WHERE ajuste_id=$1 ORDER BY fecha', [a.id]);
      banda(doc, `Periodo ${a.periodo} · ${a.area_nombre || 'Área'} · ${a.descripcion}`);
      campos(doc, [['Barrera', a.barrera], ['Seguimientos (mín. 3/año)', String(seg.rows.length)]]);
      seg.rows.forEach((s) => {
        campos(doc, [[new Date(s.fecha).toLocaleDateString('es-CO'), `${s.decision}: ${s.impacto || 'sin observación'}`]]);
      });
    }
    if (ajustes.length === 0) doc.font('Helvetica-Oblique').fontSize(9).text('Sin ajustes para seguir.');
    finalizar(doc);
  } catch (err) { next(err); }
});

// ====== Indicadores por territorio ======
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
       ORDER BY d.nombre, m.nombre, i.nombre`);
    res.json({ por_institucion: porInstitucion.rows });
  } catch (err) { next(err); }
});

export default router;
