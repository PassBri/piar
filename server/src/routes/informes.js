import { Router } from 'express';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../db.js';
import { autenticar, autorizar } from '../middleware/auth.js';
import { negarAcceso, accesoEstudiante, accesoPiar, ROLES_RESERVADO } from '../lib/acceso.js';

const router = Router();
router.use(autenticar);

// Logos PIAR para portadas de los PDF: el pollito (patrón de fondo) y el logo blanco (marca central)
const DIR_ASSETS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets');
const LOGO_BLANCO = (() => { try { return fs.readFileSync(path.join(DIR_ASSETS, 'icono-pdf.png')); } catch { return null; } })();
const FONDO_PDF = (() => { try { return fs.readFileSync(path.join(DIR_ASSETS, 'fondo-pdf.jpg')); } catch { return null; } })();

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
function decorar(doc, indicePagina) {
  // Las portadas no llevan encabezado ni pie
  if (doc._portadas && doc._portadas.has(indicePagina)) return;
  const cab = doc._cab;
  if (cab) {
    // Encabezado elegante en cada hoja: logo y datos del colegio a la izquierda, sello PIAR a la derecha
    let tx = X0;
    if (cab.inst && cab.inst.logo && String(cab.inst.logo).startsWith('data:image')) {
      try { doc.image(Buffer.from(cab.inst.logo.split(',')[1], 'base64'), X0, 20, { fit: [26, 26] }); tx = X0 + 32; } catch { /* */ }
    }
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(GRIS).text(cab.inst?.nombre || '', tx, 21, { width: 320, lineBreak: false });
    if (cab.inst?.nit) doc.font('Helvetica').fontSize(7).fillColor(GRIS_MEDIO).text(`NIT ${cab.inst.nit}`, tx, 32, { width: 320, lineBreak: false });
    // Sello PIAR a la derecha
    doc.lineWidth(0.8).rect(470, 18, 88, 26).stroke('#B0BEC5');
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(GRIS).text('PIAR', 470, 22, { width: 88, align: 'center', lineBreak: false });
    doc.font('Helvetica').fontSize(6.5).fillColor(GRIS_MEDIO).text('Decreto 1421/2017', 470, 34, { width: 88, align: 'center', lineBreak: false });
    // Línea inferior del encabezado: estudiante (anexos) o texto propio (informes institucionales)
    const lineaInf = cab.linea || `Estudiante: ${cab.estudiante || '—'}${cab.documento ? `   ·   Documento: ${cab.documento}` : ''}`;
    doc.font('Helvetica').fontSize(7.5).fillColor('#000').text(lineaInf, X0, 49, { width: ANCHO, lineBreak: false });
    doc.moveTo(X0, 62).lineTo(X0 + ANCHO, 62).lineWidth(0.6).stroke('#CFD8DC');
  } else {
    // Encabezado simple (documentos sin estudiante)
    doc.lineWidth(1).rect(444, 28, 114, 32).stroke('#999');
    doc.font('Helvetica-Bold').fontSize(11).fillColor(GRIS).text('PIAR', 444, 33, { width: 114, align: 'center', lineBreak: false });
    doc.font('Helvetica').fontSize(7.5).fillColor(GRIS_MEDIO).text('Decreto 1421/2017', 444, 47, { width: 114, align: 'center', lineBreak: false });
  }
  // Pie: fecha de impresión (izq), número de página (der) y nota ministerial (centro)
  const hoy = new Date().toLocaleDateString('es-CO');
  const total = doc.bufferedPageRange().count;
  doc.font('Helvetica').fontSize(6.5).fillColor(GRIS_MEDIO)
     .text(`Impreso el ${hoy}`, X0, 736, { width: 200, lineBreak: false });
  doc.text(`Página ${indicePagina + 1} de ${total}`, X0 + ANCHO - 140, 736, { width: 140, align: 'right', lineBreak: false });
  doc.font('Helvetica').fontSize(6.5).fillColor(GRIS_MEDIO)
     .text('Ministerio de Educación Nacional – Viceministerio de Educación Preescolar, Básica y Media – Decreto 1421 de 2017',
       X0, 748, { width: ANCHO, align: 'center', lineBreak: false });
  doc.fillColor('#000');
}

function iniciar(res, req, filename, cab) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', disposicion(req, filename));
  const conCab = !!cab;
  const doc = new PDFDocument({ size: 'LETTER', bufferPages: true, margins: { top: conCab ? 78 : 68, bottom: 26, left: 36, right: 36 } });
  doc._cab = cab || null;       // {inst:{logo,nombre,nit}, estudiante, documento}
  doc._portadas = new Set();    // páginas que son portada (no llevan encabezado)
  doc.pipe(res);
  return doc;
}

// Portada: fondo gris (como el login), logo del pollito, título, estudiante y datos del colegio
function portada(doc, { tituloDoc, estudiante, documento, inst }) {
  doc._portadas.add(doc.bufferedPageRange().count - 1);
  doc.save();
  // Fondo: patrón de íconos de accesibilidad (imagen) a toda la página
  if (FONDO_PDF) {
    try { doc.image(FONDO_PDF, 0, 0, { width: doc.page.width, height: doc.page.height }); }
    catch { doc.rect(0, 0, doc.page.width, doc.page.height).fill('#1A1A1A'); }
  } else {
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#1A1A1A');
  }
  // Velo oscuro para dar contraste al texto central
  doc.save(); doc.opacity(0.22); doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0E0F11'); doc.opacity(1); doc.restore();
  // Ícono PIAR (braille) centrado arriba, con el nombre y el subtítulo debajo
  const cx = doc.page.width / 2;
  if (LOGO_BLANCO) {
    const s = 108;
    try { doc.image(LOGO_BLANCO, cx - s / 2, 140, { fit: [s, s] }); } catch { /* */ }
  }
  doc.fillColor('#fff').font('Helvetica-Bold').fontSize(34).text('PIAR', 0, 262, { width: doc.page.width, align: 'center', characterSpacing: 6 });
  doc.fillColor('#CFD8DC').font('Helvetica').fontSize(11).text('Plan Individual de Ajustes Razonables', 0, 304, { width: doc.page.width, align: 'center' });
  doc.fillColor('#90A4AE').font('Helvetica').fontSize(9).text('Decreto 1421 de 2017', 0, 330, { width: doc.page.width, align: 'center' });
  // Título del documento
  doc.fillColor('#fff').font('Helvetica-Bold').fontSize(16).text(tituloDoc, 60, 380, { width: doc.page.width - 120, align: 'center' });
  // Nombre del estudiante
  if (estudiante) {
    doc.fillColor('#ECEFF1').font('Helvetica').fontSize(13).text(estudiante, 60, 418, { width: doc.page.width - 120, align: 'center' });
    if (documento) doc.fillColor('#B0BEC5').fontSize(10).text(`Documento: ${documento}`, 60, 440, { width: doc.page.width - 120, align: 'center' });
  }
  // Pie de portada: logo y datos del colegio
  if (inst && inst.logo && String(inst.logo).startsWith('data:image')) {
    try { doc.image(Buffer.from(inst.logo.split(',')[1], 'base64'), cx - 24, 560, { fit: [48, 48] }); } catch { /* */ }
  }
  if (inst && (inst.nombre || inst.nit)) {
    doc.fillColor('#ECEFF1').font('Helvetica-Bold').fontSize(11).text(inst.nombre || '', 60, 616, { width: doc.page.width - 120, align: 'center' });
    if (inst.nit) doc.fillColor('#B0BEC5').font('Helvetica').fontSize(9).text(`NIT ${inst.nit}`, 60, 632, { width: doc.page.width - 120, align: 'center' });
  }
  // Fecha de impresión
  const hoy = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.fillColor('#90A4AE').font('Helvetica').fontSize(8.5).text(`Impreso el ${hoy}`, 0, 690, { width: doc.page.width, align: 'center' });
  doc.restore();
  doc.addPage(); // el contenido empieza en la página siguiente
}

// Decora todas las páginas y cierra el documento.
function finalizar(doc) {
  const r = doc.bufferedPageRange();
  for (let i = r.start; i < r.start + r.count; i++) { doc.switchToPage(i); decorar(doc, i); }
  doc.end();
}

function titulo(doc, texto, sub, inst) {
  // Logo del colegio a la izquierda (si existe), con el título corrido a la derecha.
  let x = X0; let anchoTexto = 400;
  if (inst && inst.logo && typeof inst.logo === 'string' && inst.logo.startsWith('data:image')) {
    try {
      doc.image(Buffer.from(inst.logo.split(',')[1], 'base64'), X0, doc.y, { fit: [42, 42] });
      x = X0 + 50; anchoTexto = 360;
    } catch { /* logo inválido */ }
  }
  const yTop = doc.y;
  doc.fillColor('#000').font('Helvetica-Bold').fontSize(12).text(texto, x, yTop, { width: anchoTexto });
  if (sub) doc.font('Helvetica').fontSize(8.5).fillColor(GRIS_MEDIO).text(sub, x, doc.y, { width: anchoTexto });
  if (inst && (inst.nombre || inst.nit)) {
    doc.font('Helvetica').fontSize(8).fillColor(GRIS_MEDIO)
      .text(`${inst.nombre || ''}${inst.nit ? `  ·  NIT ${inst.nit}` : ''}`, x, doc.y, { width: anchoTexto });
  }
  if (x > X0 && doc.y < yTop + 44) doc.y = yTop + 44; // deja pasar el alto del logo
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
  ['Área/Aprendizaje', 62], ['Objetivos/Propósitos', 100], ['Barreras', 98],
  ['Ajustes razonables', 112], ['Evaluación de los ajustes', 108], ['Desempeño', 43],
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
                a.evaluacion || (a.apoyo ? `Apoyo: ${a.apoyo}` : '—'), a.desempeno || '—'];
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
            i.nombre AS inst_nombre, i.sede AS inst_sede, i.logo AS inst_logo, i.nit AS inst_nit, m.nombre AS municipio_nombre, d.nombre AS departamento_nombre
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
      `SELECT e.*, i.nombre AS inst_nombre, i.sede AS inst_sede, i.logo AS inst_logo, i.nit AS inst_nit, m.nombre AS municipio_nombre, d.nombre AS departamento_nombre
       FROM estudiante e LEFT JOIN institucion i ON i.id = e.institucion_id
       LEFT JOIN municipio m ON m.id = i.municipio_id LEFT JOIN departamento d ON d.id = m.departamento_id
       WHERE e.id = $1`, [req.params.id]);
    const e = rows[0];
    const neg = negarAcceso(req.usuario, e);
    if (neg) return res.status(neg.status).json({ error: neg.error });
    const inst1 = { logo: e.inst_logo, nombre: e.inst_nombre, nit: e.inst_nit };
    const doc = iniciar(res, req, `Anexo1_${e.id}.pdf`, { inst: inst1, estudiante: e.nombres, documento: e.documento_numero });
    if (req.query.portada !== '0') portada(doc, { tituloDoc: 'Anexo 1 · Información general del estudiante', estudiante: e.nombres, documento: e.documento_numero, inst: inst1 });
    titulo(doc, 'INFORMACIÓN GENERAL DEL ESTUDIANTE', 'Información para la matrícula – Anexo 1 PIAR');
    if (e.foto && typeof e.foto === 'string' && e.foto.startsWith('data:image')) {
      try {
        const buf = Buffer.from(e.foto.split(',')[1], 'base64');
        const fy = doc.y; const fw = 70; const fh = 84; const fx = X0 + (ANCHO - fw) / 2;
        doc.image(buf, fx, fy, { width: fw, height: fh });
        doc.rect(fx, fy, fw, fh).stroke(BORDE);
        doc.y = fy + fh + 6;
      } catch { /* foto inválida: se omite */ }
    }
    campos(doc, [['Institución educativa', e.inst_nombre], ['Sede', e.inst_sede]]);
    campos(doc, [['Municipio', e.municipio_nombre], ['Departamento', e.departamento_nombre]]);

    banda(doc, 'Diligenciamiento del Anexo 1');
    seccionJson(doc, e.identificacion, [
      ['fecha_diligenciamiento', 'Fecha de diligenciamiento'], ['lugar_diligenciamiento', 'Lugar de diligenciamiento'],
      ['nombre_diligencia', 'Nombre de quien diligencia'], ['rol_diligencia', 'Rol en la SE o la IE'],
    ]);

    banda(doc, '1) Información general del estudiante');
    campos(doc, [['Nombres y apellidos', e.nombres], ['Documento', `${e.documento_tipo || ''} ${e.documento_numero || ''}`]]);
    campos(doc, [['Fecha de nacimiento', e.fecha_nacimiento ? new Date(e.fecha_nacimiento).toLocaleDateString('es-CO') : '—'], ['Grado actual', e.grado]]);
    seccionJson(doc, e.identificacion, [
      ['edad', 'Edad'],
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
    { const neg = negarAcceso(req.usuario, await accesoPiar(data.piar.id)); if (neg) return res.status(neg.status).json({ error: neg.error }); }
    const { piar, ajustes } = data;
    const inst2 = { logo: piar.inst_logo, nombre: piar.inst_nombre, nit: piar.inst_nit };
    const doc = iniciar(res, req, `Anexo2_${piar.estudiante_id}.pdf`, { inst: inst2, estudiante: piar.estudiante, documento: piar.documento_numero });
    if (req.query.portada !== '0') portada(doc, { tituloDoc: 'Anexo 2 · Valoración pedagógica y ajustes razonables', estudiante: piar.estudiante, documento: piar.documento_numero, inst: inst2 });
    titulo(doc, 'PLAN INDIVIDUAL DE AJUSTES RAZONABLES – ANEXO 2', null);
    const cc = piar.caracteristicas || {};
    campos(doc, [['Institución educativa', piar.inst_nombre], ['Sede', piar.inst_sede]]);
    campos(doc, [['Jornada', cc.jornada || '—'], ['Fecha de elaboración', piar.fecha_elaboracion ? new Date(piar.fecha_elaboracion).toLocaleDateString('es-CO') : '—']]);
    campos(doc, [['Docentes que elaboran y cargo', cc.docentes_elabora || '—']]);

    banda(doc, 'Datos del estudiante');
    campos(doc, [['Nombre del estudiante', piar.estudiante], ['Documento', `${piar.documento_tipo || ''} ${piar.documento_numero || ''}`]]);
    campos(doc, [['Grado', piar.grado], ['Año / Periodo', piar.periodo]]);
    campos(doc, [['Director(a) de grupo', piar.director_grupo || '—'], ['Estado', piar.estado]]);

    banda(doc, '1. Características del estudiante');
    const car = piar.caracteristicas || {};
    campos(doc, [['Gustos, intereses, aspectos que le desagradan y expectativas del estudiante y la familia', car.gustos || piar.aspectos_generales || '—']]);
    campos(doc, [['Lo que hace, puede hacer o requiere apoyo para favorecer su proceso educativo', car.desempeno || piar.valoracion || '—']]);
    campos(doc, [['Habilidades, competencias, cualidades y aprendizajes con los que cuenta para el grado', car.habilidades || '—']]);

    // ?periodo=1..5 imprime un solo periodo (5 = promoción); 'all'/vacío imprime todos
    const NOMBRE_PERIODO = ['PRIMER PERIODO', 'SEGUNDO PERIODO', 'TERCER PERIODO', 'CUARTO PERIODO', 'PROMOCIÓN (CONSOLIDADO ANUAL)'];
    const q = String(req.query.periodo || 'all').toLowerCase();
    const soloP = /^[1-5]$/.test(q) ? Number(q) : null;
    const periodosImprimir = soloP ? [soloP] : [1, 2, 3, 4, 5];
    const tituloSeccion = soloP
      ? (soloP === 5 ? '2. Ajustes razonables — Promoción (consolidado anual)' : `2. Ajustes razonables — Periodo ${soloP}`)
      : '2. Ajustes razonables (por periodo)';
    banda(doc, tituloSeccion);
    let impresos = 0;
    periodosImprimir.forEach((p) => {
      const delP = ajustes.filter((a) => a.periodo === p);
      if (delP.length === 0) return;
      impresos += delP.length;
      doc.moveDown(0.3);
      saltoSi(doc, 44);
      doc.font('Helvetica-Bold').fontSize(9).fillColor(GRIS).text(NOMBRE_PERIODO[p - 1], X0, doc.y);
      doc.fillColor('#000'); doc.moveDown(0.2);
      cabeceraAjustes(doc);
      delP.forEach((a) => filaAjuste(doc, a));
    });
    if (impresos === 0) doc.font('Helvetica-Oblique').fontSize(9).text('No se han registrado ajustes razonables para esta selección.');
    if (!soloP) {
      banda(doc, '7. Recomendaciones para el Plan de Mejoramiento Institucional (eliminación de barreras)');
      const rp = piar.recomendaciones_pmi || {};
      const ACTORES = [['familia', 'Familia, cuidadores o con quienes vive'], ['docentes', 'Docentes'],
        ['directivos', 'Directivos'], ['administrativos', 'Administrativos'], ['pares', 'Pares (compañeros)']];
      let algo = false;
      ACTORES.forEach(([clave, nombre]) => {
        const a = rp[clave] || {};
        if ((a.acciones || '').trim() || (a.estrategias || '').trim()) {
          algo = true;
          campos(doc, [[nombre, `Acciones: ${a.acciones || '—'}\nEstrategias: ${a.estrategias || '—'}`]]);
        }
      });
      if (!algo && (piar.pmi || '').trim()) campos(doc, [['Acciones para eliminar barreras a nivel institucional', piar.pmi]]);
      if (!algo && !(piar.pmi || '').trim()) campos(doc, [['Recomendaciones', '—']]);
    }

    // Firmas de quienes realizan la valoración
    saltoSi(doc, 70);
    doc.moveDown(1.2);
    doc.font('Helvetica-Oblique').fontSize(8).fillColor(GRIS_MEDIO).text(
      'Firma y cargo de quienes realizan el proceso de valoración: docentes, coordinadores, docente de apoyo u otro profesional. Si hay varios docentes a cargo del curso, cada uno aporta su valoración y los ajustes de su área.',
      X0, doc.y, { width: ANCHO });
    doc.moveDown(1.5);
    const yf = doc.y;
    ['Nombre y firma', 'Nombre y firma', 'Nombre y firma'].forEach((t, i) => {
      const x = X0 + i * (ANCHO / 3) + 6;
      doc.moveTo(x, yf + 22).lineTo(x + 140, yf + 22).stroke(BORDE);
      doc.font('Helvetica').fontSize(8).fillColor(GRIS_MEDIO).text(t, x, yf + 25, { width: 140, lineBreak: false });
      doc.text('Área: ______________', x, yf + 37, { width: 150, lineBreak: false });
    });
    doc.y = yf + 50;
    finalizar(doc);
  } catch (err) { next(err); }
});

// ====== ANEXO 3 (Acta) ======
router.get('/acta/:piarId/pdf', async (req, res, next) => {
  try {
    const data = await cargarPiar(req.params.piarId);
    if (!data) return res.status(404).json({ error: 'PIAR no encontrado.' });
    { const neg = negarAcceso(req.usuario, await accesoPiar(data.piar.id)); if (neg) return res.status(neg.status).json({ error: neg.error }); }
    const { piar } = data;
    const a = (await query('SELECT * FROM acta_acuerdo WHERE piar_id=$1', [req.params.piarId])).rows[0] || {};
    const inst3 = { logo: piar.inst_logo, nombre: piar.inst_nombre, nit: piar.inst_nit };
    const doc = iniciar(res, req, `Anexo3_Acta_${piar.estudiante_id}.pdf`, { inst: inst3, estudiante: piar.estudiante, documento: piar.documento_numero });
    if (req.query.portada !== '0') portada(doc, { tituloDoc: 'Anexo 3 · Acta de Acuerdo con la familia', estudiante: piar.estudiante, documento: piar.documento_numero, inst: inst3 });
    titulo(doc, 'ACTA DE ACUERDO – ANEXO 3', 'Plan Individual de Ajustes Razonables – PIAR');
    campos(doc, [['Institución educativa y sede', `${piar.inst_nombre || ''}${piar.inst_sede ? ' · ' + piar.inst_sede : ''}`], ['Fecha', a.fecha_firma ? new Date(a.fecha_firma).toLocaleDateString('es-CO') : '—']]);
    campos(doc, [['Nombre del estudiante', piar.estudiante], ['Documento', piar.documento_numero || '—']]);
    campos(doc, [['Grado', piar.grado || '—'], ['Año', piar.periodo]]);
    campos(doc, [['Nombres del equipo directivo y de docentes', a.nombres_directivos || '—']]);
    const fam = Array.isArray(a.familia) ? a.familia.filter((f) => (f.nombre || '').trim()) : [];
    if (fam.length) fam.forEach((f) => campos(doc, [['Familia del estudiante', f.nombre || '—'], ['Parentesco', f.parentesco || '—']]));
    else campos(doc, [['Familia del estudiante', '—'], ['Parentesco', '—']]);

    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(8.5).fillColor(GRIS_MEDIO).text(
      'Según el Decreto 1421 de 2017, la educación inclusiva es un proceso permanente que reconoce, valora y responde a la diversidad de los estudiantes. La inclusión solo es posible cuando se unen los esfuerzos del colegio, el estudiante y la familia; por eso se formaliza con las firmas la presente Acta Acuerdo.',
      X0, doc.y, { width: ANCHO });
    doc.fillColor('#000').moveDown(0.3);

    banda(doc, 'La familia se compromete a cumplir y firmar los compromisos del PIAR, y en particular a:');
    campos(doc, [['Compromisos de la familia', a.compromisos_familia || '—']]);
    if ((a.compromisos_institucion || '').trim()) campos(doc, [['Compromisos de la institución', a.compromisos_institucion]]);

    banda(doc, 'Y en casa apoyará con las siguientes actividades');
    const acts = Array.isArray(a.actividades) ? a.actividades.filter((x) => (x.actividad || x.estrategia || '').trim()) : [];
    if (acts.length) {
      acts.forEach((x) => {
        const frec = x.frecuencia ? ` (Frecuencia: ${x.frecuencia})` : '';
        campos(doc, [[x.actividad || 'Actividad', `${x.estrategia || '—'}${frec}`]]);
      });
    } else if ((a.actividades_casa || '').trim()) {
      campos(doc, [['Actividades de apoyo en casa', a.actividades_casa]]);
    } else {
      campos(doc, [['Actividades', '—']]);
    }

    saltoSi(doc, 90);
    doc.moveDown(2);
    const y = doc.y;
    const firma = (x, yy, img, label) => {
      if (img && img.startsWith('data:image')) {
        try { doc.image(Buffer.from(img.split(',')[1], 'base64'), x, yy, { fit: [170, 40] }); } catch { /* ignora */ }
      }
      doc.moveTo(x, yy + 44).lineTo(x + 180, yy + 44).stroke(BORDE);
      doc.font('Helvetica').fontSize(8.5).fillColor(GRIS_MEDIO).text(label, x, yy + 47, { width: 190, lineBreak: false });
    };
    doc.font('Helvetica-Bold').fontSize(9).fillColor(GRIS).text('Firma de los actores comprometidos:', X0, y - 14);
    firma(60, y, a.firma_familia_img ? null : null, 'Estudiante');
    firma(320, y, a.firma_familia_img, a.firmada_familia ? 'Acudiente / familia' : 'Acudiente / familia (pendiente)');
    const y2 = y + 70;
    firma(60, y2, null, 'Docentes');
    firma(320, y2, a.firma_institucion_img, 'Directivo docente');
    doc.y = y2 + 56;
    finalizar(doc);
  } catch (err) { next(err); }
});

// ====== Anexo 4: acta de seguimiento/entrega e informe de transición ======
router.get('/anexo4/:piarId/pdf', async (req, res, next) => {
  try {
    const data = await cargarPiar(req.params.piarId);
    if (!data) return res.status(404).json({ error: 'PIAR no encontrado.' });
    { const neg = negarAcceso(req.usuario, await accesoPiar(data.piar.id)); if (neg) return res.status(neg.status).json({ error: neg.error }); }
    const { piar } = data;
    const a = (await query('SELECT * FROM anexo4 WHERE piar_id=$1', [req.params.piarId])).rows[0] || {};
    const inst4 = { logo: piar.inst_logo, nombre: piar.inst_nombre, nit: piar.inst_nit };
    const doc = iniciar(res, req, `Anexo4_${piar.estudiante_id}.pdf`, { inst: inst4, estudiante: piar.estudiante, documento: piar.documento_numero });
    if (req.query.portada !== '0') portada(doc, { tituloDoc: 'Anexo 4 · Acta de seguimiento, entrega y transición', estudiante: piar.estudiante, documento: piar.documento_numero, inst: inst4 });
    titulo(doc, 'ACTA DE SEGUIMIENTO, ENTREGA Y TRANSICIÓN – ANEXO 4', 'Cierre del año y transición del estudiante');
    campos(doc, [['Estudiante', piar.estudiante], ['Periodo / Año', piar.periodo]]);
    banda(doc, 'Logros y avances durante el año');
    campos(doc, [['Logros', a.logros || '—']]);
    banda(doc, 'Ajustes que funcionaron y recomendaciones para el año siguiente');
    campos(doc, [['Recomendaciones', a.recomendaciones || '—']]);
    banda(doc, 'Transición');
    campos(doc, [['Grado al que transita', a.grado_destino || '—'], ['Institución destino', a.institucion_destino || '—']]);
    campos(doc, [['Apoyos requeridos para la transición', a.apoyos_transicion || '—']]);
    campos(doc, [['Observaciones', a.observaciones || '—']]);

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
    firma(60, a.firma_entrega_img, 'Entrega: docente / orientación');
    firma(320, a.firma_recibe_img, 'Recibe: familia / docente siguiente');
    finalizar(doc);
  } catch (err) { next(err); }
});

// ====== Informe de seguimiento ======
router.get('/seguimiento/:piarId/pdf', async (req, res, next) => {
  try {
    const data = await cargarPiar(req.params.piarId);
    if (!data) return res.status(404).json({ error: 'PIAR no encontrado.' });
    { const neg = negarAcceso(req.usuario, await accesoPiar(data.piar.id)); if (neg) return res.status(neg.status).json({ error: neg.error }); }
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

// ---- Tabla de competencias: Área × periodos (desempeño consolidado) ----
function tablaCompetencias(doc, periodos, filas) {
  const areaW = 170;
  const pw = (ANCHO - areaW) / periodos.length;
  const cabecera = () => {
    saltoSi(doc, 22);
    const y = doc.y; let x = X0;
    doc.rect(x, y, areaW, 20).fillAndStroke(GRIS, BORDE);
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(8).text('Área / Asignatura', x + 3, y + 6, { width: areaW - 6 });
    x += areaW;
    periodos.forEach((pe) => {
      doc.rect(x, y, pw, 20).fillAndStroke(GRIS, BORDE);
      doc.fillColor('#fff').font('Helvetica-Bold').fontSize(7).text(pe.label, x + 1, y + 6, { width: pw - 2, align: 'center' });
      x += pw;
    });
    doc.fillColor('#000'); doc.y = y + 20;
  };
  cabecera();
  filas.forEach((f) => {
    const alto = Math.max(16, doc.heightOfString(f.area, { width: areaW - 6 }) + 6);
    if (doc.y + alto > TOPE) { doc.addPage(); cabecera(); }
    const y = doc.y; let x = X0;
    doc.rect(x, y, areaW, alto).fillAndStroke(GRIS_CLARO, BORDE);
    doc.fillColor('#000').font('Helvetica-Bold').fontSize(7.5).text(f.area, x + 3, y + 3, { width: areaW - 6 });
    x += areaW;
    periodos.forEach((pe) => {
      doc.rect(x, y, pw, alto).stroke(BORDE);
      doc.font('Helvetica').fontSize(7.5).fillColor('#000').text(f.valores[pe.p] || '—', x + 1, y + 3, { width: pw - 2, align: 'center' });
      x += pw;
    });
    doc.y = y + alto;
  });
}

// ====== Informe anual de competencias ======
router.get('/competencias/:piarId/pdf', async (req, res, next) => {
  try {
    const data = await cargarPiar(req.params.piarId);
    if (!data) return res.status(404).json({ error: 'PIAR no encontrado.' });
    { const neg = negarAcceso(req.usuario, await accesoPiar(data.piar.id)); if (neg) return res.status(neg.status).json({ error: neg.error }); }
    const { piar, ajustes } = data;
    // institución (periodos/promoción) y curso del estudiante
    const extra = await query(
      `SELECT COALESCE(i.num_periodos,4) AS num_periodos, COALESCE(i.usa_promocion,true) AS usa_promocion,
              c.sede AS curso_sede, c.jornada AS curso_jornada, c.grado AS curso_grado, c.grupo AS curso_grupo
       FROM estudiante e LEFT JOIN institucion i ON i.id = e.institucion_id
       LEFT JOIN curso c ON c.id = e.curso_id WHERE e.id = $1`, [piar.estudiante_id]);
    const cfg = extra.rows[0] || { num_periodos: 4, usa_promocion: true };
    // valoraciones por área y periodo
    const val = await query(
      `SELECT a.nombre AS area, v.periodo, v.desempeno
       FROM valoracion_area v JOIN area a ON a.id = v.area_id
       WHERE v.piar_id = $1 ORDER BY a.nombre, v.periodo`, [req.params.piarId]);

    const periodos = [];
    for (let p = 1; p <= cfg.num_periodos; p++) periodos.push({ p, label: `P${p}` });
    if (cfg.usa_promocion) periodos.push({ p: 5, label: 'Promoción' });

    const porArea = {};
    val.rows.forEach((r) => {
      porArea[r.area] = porArea[r.area] || { area: r.area, valores: {} };
      porArea[r.area].valores[r.periodo] = r.desempeno || '—';
    });
    const filas = Object.values(porArea);

    const doc = iniciar(res, req, `Informe_competencias_${piar.estudiante_id}.pdf`);
    titulo(doc, 'INFORME ANUAL DE COMPETENCIAS', 'Consolidado del desempeño por área y periodo – PIAR', { logo: piar.inst_logo, nombre: piar.inst_nombre, nit: piar.inst_nit });
    campos(doc, [['Institución educativa', piar.inst_nombre], ['Año', piar.periodo]]);
    campos(doc, [['Estudiante', piar.estudiante], ['Documento', `${piar.documento_tipo || ''} ${piar.documento_numero || ''}`]]);
    campos(doc, [['Grado', piar.grado],
      ['Curso', cfg.curso_sede ? `${cfg.curso_sede} · ${cfg.curso_jornada} · ${cfg.curso_grado} · Grupo ${cfg.curso_grupo}` : '—']]);

    banda(doc, 'Desempeño por área y periodo');
    if (filas.length === 0) {
      doc.font('Helvetica-Oblique').fontSize(9).text('Aún no se han registrado valoraciones por área.', X0, doc.y + 4);
      doc.moveDown(0.5);
    } else {
      doc.moveDown(0.2);
      tablaCompetencias(doc, periodos, filas);
    }

    banda(doc, 'Ajustes razonables aplicados durante el año');
    doc.moveDown(0.2);
    if (ajustes.length === 0) {
      doc.font('Helvetica-Oblique').fontSize(9).text('No se registraron ajustes razonables.', X0, doc.y + 2);
    } else {
      cabeceraAjustes(doc);
      ajustes.forEach((a) => filaAjuste(doc, a));
    }

    banda(doc, 'Valoración y observaciones');
    campos(doc, [['Síntesis de la valoración', piar.valoracion || '—']]);
    campos(doc, [['Aspectos generales', piar.aspectos_generales || '—']]);

    saltoSi(doc, 56);
    doc.moveDown(1.2);
    const yf = doc.y;
    ['Docente / Director de grupo', 'Coordinación / Rectoría', 'Familia / Acudiente'].forEach((t, i) => {
      const x = X0 + i * (ANCHO / 3) + 10;
      doc.moveTo(x, yf + 22).lineTo(x + 150, yf + 22).stroke(BORDE);
      doc.font('Helvetica').fontSize(8).fillColor(GRIS_MEDIO).text(t, x, yf + 25, { width: 150, lineBreak: false });
    });
    doc.y = yf + 40;
    finalizar(doc);
  } catch (err) { next(err); }
});

// ====== Mosaico de estudiantes (foto, nombre, discapacidad, grado) ======
router.get('/mosaico/pdf', autorizar('superadmin', 'rector', 'coordinador', 'psicoorientador', 'administrador', 'docente'), async (req, res, next) => {
  try {
    const esSuper = req.usuario.rol === 'superadmin';
    const inst = esSuper ? (req.query.institucion_id || null) : req.usuario.institucion_id;
    const params = [inst || null];
    let sql = `SELECT e.nombres, e.grado, e.foto, e.entorno_salud->>'discapacidad' AS discapacidad,
                      c.sede AS curso_sede, c.grado AS curso_grado, c.grupo AS curso_grupo, i.nombre AS institucion_nombre
               FROM estudiante e LEFT JOIN curso c ON c.id = e.curso_id
               LEFT JOIN institucion i ON i.id = e.institucion_id
               WHERE ($1::int IS NULL OR e.institucion_id = $1)`;
    if (!ROLES_RESERVADO.includes(req.usuario.rol)) sql += ' AND e.reservado = FALSE';
    if (req.query.curso_id) { params.push(req.query.curso_id); sql += ` AND e.curso_id = $${params.length}`; }
    if (req.query.sede) { params.push(req.query.sede); sql += ` AND c.sede = $${params.length}`; }
    sql += ' ORDER BY i.nombre, c.sede, c.grado, c.grupo, e.nombres';
    const { rows } = await query(sql, params);

    const sub = [rows[0]?.institucion_nombre, req.query.sede, req.query.grupo].filter(Boolean).join(' · ') || 'Todos los estudiantes';
    const doc = iniciar(res, req, 'Mosaico_estudiantes.pdf');
    titulo(doc, 'MOSAICO DE ESTUDIANTES', sub);
    doc.moveDown(0.3);

    const cols = 4; const cw = ANCHO / cols; const ch = 150; const fw = 58; const fh = 70;
    let yFila = doc.y;
    rows.forEach((r, idx) => {
      const col = idx % cols;
      if (col === 0) {
        if (yFila + ch > TOPE) { doc.addPage(); yFila = doc.y; } else if (idx > 0) { yFila += ch; }
      }
      const x = X0 + col * cw;
      doc.rect(x + 2, yFila, cw - 4, ch - 6).stroke(BORDE);
      const fx = x + (cw - fw) / 2;
      if (r.foto && typeof r.foto === 'string' && r.foto.startsWith('data:image')) {
        try { doc.image(Buffer.from(r.foto.split(',')[1], 'base64'), fx, yFila + 8, { width: fw, height: fh }); } catch { /* omitir */ }
      } else {
        doc.rect(fx, yFila + 8, fw, fh).fillAndStroke(GRIS_CLARO, BORDE);
        doc.fillColor(GRIS_MEDIO).font('Helvetica').fontSize(6.5).text('Sin foto', fx, yFila + 38, { width: fw, align: 'center' });
      }
      doc.rect(fx, yFila + 8, fw, fh).stroke(BORDE);
      doc.fillColor('#000').font('Helvetica-Bold').fontSize(7.5).text(r.nombres || '—', x + 4, yFila + fh + 14, { width: cw - 8, align: 'center' });
      const grado = r.curso_grado || r.grado || '—';
      const grupo = r.curso_grupo ? ` · Grupo ${r.curso_grupo}` : '';
      doc.font('Helvetica').fontSize(7).fillColor(GRIS_MEDIO).text(`${grado}${grupo}`, x + 4, doc.y + 1, { width: cw - 8, align: 'center' });
      doc.font('Helvetica-Oblique').fontSize(6.8).fillColor(GRIS).text(r.discapacidad || 'Sin discapacidad registrada', x + 4, doc.y + 1, { width: cw - 8, align: 'center' });
    });
    if (rows.length === 0) doc.font('Helvetica-Oblique').fontSize(10).text('No hay estudiantes para esta selección.', X0, doc.y + 10);
    else doc.y = yFila + ch;
    finalizar(doc);
  } catch (err) { next(err); }
});

// ====== Lista de asistencia con foto (por grupo) ======
router.get('/asistencia/pdf', autorizar('superadmin', 'rector', 'coordinador', 'psicoorientador', 'administrador', 'docente'), async (req, res, next) => {
  try {
    const esSuper = req.usuario.rol === 'superadmin';
    const inst = esSuper ? (req.query.institucion_id || null) : req.usuario.institucion_id;
    const params = [inst || null];
    let sql = `SELECT e.nombres, e.grado, e.foto, e.entorno_salud->>'discapacidad' AS discapacidad,
                      c.sede AS curso_sede, c.jornada AS curso_jornada, c.grado AS curso_grado, c.grupo AS curso_grupo,
                      i.nombre AS institucion_nombre
               FROM estudiante e LEFT JOIN curso c ON c.id = e.curso_id
               LEFT JOIN institucion i ON i.id = e.institucion_id
               WHERE ($1::int IS NULL OR e.institucion_id = $1)`;
    if (!ROLES_RESERVADO.includes(req.usuario.rol)) sql += ' AND e.reservado = FALSE';
    if (req.query.curso_id) { params.push(req.query.curso_id); sql += ` AND e.curso_id = $${params.length}`; }
    if (req.query.sede) { params.push(req.query.sede); sql += ` AND c.sede = $${params.length}`; }
    sql += ' ORDER BY e.nombres';
    const { rows } = await query(sql, params);

    const r0 = rows[0] || {};
    const grupo = r0.curso_grado ? `${r0.curso_sede} · ${r0.curso_jornada} · ${r0.curso_grado} · Grupo ${r0.curso_grupo}` : (req.query.sede || 'Todos');
    const doc = iniciar(res, req, 'Lista_asistencia.pdf');
    titulo(doc, 'LISTA DE ASISTENCIA', `${r0.institucion_nombre || ''}  ·  ${grupo}`);
    campos(doc, [['Mes', ' '], ['Docente', ' ']]);
    doc.moveDown(0.3);

    // Columnas: N° | Foto | Estudiante | Discapacidad | 12 casillas de días
    const dias = 12;
    const xNum = X0, wNum = 18, wFoto = 30, wNom = 150, wDisc = 85;
    const xFoto = xNum + wNum, xNom = xFoto + wFoto, xDisc = xNom + wNom, xDias = xDisc + wDisc;
    const wDia = (ANCHO - (wNum + wFoto + wNom + wDisc)) / dias;
    const rowH = 34;
    const cabecera = () => {
      const y = doc.y;
      doc.rect(xNum, y, ANCHO, 16).fillAndStroke(GRIS, BORDE);
      doc.fillColor('#fff').font('Helvetica-Bold').fontSize(7);
      doc.text('N°', xNum, y + 5, { width: wNum, align: 'center' });
      doc.text('Foto', xFoto, y + 5, { width: wFoto, align: 'center' });
      doc.text('Estudiante', xNom + 3, y + 5, { width: wNom - 6 });
      doc.text('Discapacidad', xDisc + 2, y + 5, { width: wDisc - 4 });
      for (let d = 0; d < dias; d++) doc.text(String(d + 1), xDias + d * wDia, y + 5, { width: wDia, align: 'center' });
      doc.fillColor('#000'); doc.y = y + 16;
    };
    cabecera();
    rows.forEach((r, idx) => {
      if (doc.y + rowH > TOPE) { doc.addPage(); cabecera(); }
      const y = doc.y;
      doc.rect(xNum, y, wNum, rowH).stroke(BORDE);
      doc.font('Helvetica').fontSize(8).fillColor('#000').text(String(idx + 1), xNum, y + rowH / 2 - 4, { width: wNum, align: 'center' });
      doc.rect(xFoto, y, wFoto, rowH).stroke(BORDE);
      if (r.foto && typeof r.foto === 'string' && r.foto.startsWith('data:image')) {
        try { doc.image(Buffer.from(r.foto.split(',')[1], 'base64'), xFoto + 3, y + 2, { width: wFoto - 6, height: rowH - 4 }); } catch { /* omitir */ }
      }
      doc.rect(xNom, y, wNom, rowH).stroke(BORDE);
      doc.font('Helvetica-Bold').fontSize(8).text(r.nombres || '—', xNom + 4, y + rowH / 2 - 5, { width: wNom - 8 });
      doc.rect(xDisc, y, wDisc, rowH).stroke(BORDE);
      doc.font('Helvetica').fontSize(6.8).fillColor(GRIS).text(r.discapacidad || '—', xDisc + 3, y + rowH / 2 - 6, { width: wDisc - 6 });
      doc.fillColor('#000');
      for (let d = 0; d < dias; d++) doc.rect(xDias + d * wDia, y, wDia, rowH).stroke(BORDE);
      doc.y = y + rowH;
    });
    if (rows.length === 0) doc.font('Helvetica-Oblique').fontSize(10).text('No hay estudiantes para esta selección.', X0, doc.y + 10);
    finalizar(doc);
  } catch (err) { next(err); }
});

// Actores del PMI (orden del formato oficial)
const ACTORES_PMI = [
  ['familia', 'Familia, cuidadores o con quienes vive'], ['docentes', 'Docentes'],
  ['directivos', 'Directivos'], ['administrativos', 'Administrativos'], ['pares', 'Pares (compañeros)'],
];
// Consolida las recomendaciones PMI (Anexo 2, punto 7) de todos los PIAR, agrupadas por actor
function consolidarPmi(piars) {
  const dedup = (arr) => [...new Set(arr.map((s) => s.trim()).filter(Boolean))];
  return ACTORES_PMI.map(([clave, nombre]) => {
    const items = [];
    piars.forEach((p) => {
      const x = (p.recomendaciones_pmi || {})[clave];
      if (x && ((x.acciones || '').trim() || (x.estrategias || '').trim())) {
        items.push({ estudiante: p.nombres, grado: p.grado_piar || p.grado, periodo: p.periodo, acciones: x.acciones || '', estrategias: x.estrategias || '' });
      }
    });
    return {
      clave, nombre, items,
      resumen_acciones: dedup(items.map((i) => i.acciones)),
      resumen_estrategias: dedup(items.map((i) => i.estrategias)),
    };
  });
}

// Datos del PMI consolidado (para la pantalla)
router.get('/pmi', autorizar('superadmin', 'rector', 'coordinador', 'administrador'), async (req, res, next) => {
  try {
    const esSuper = req.usuario.rol === 'superadmin';
    const inst = esSuper ? (req.query.institucion_id || null) : req.usuario.institucion_id;
    const piars = (await query(
      `SELECT p.id AS piar_id, p.periodo, p.grado AS grado_piar, e.nombres, e.grado, p.recomendaciones_pmi
       FROM piar p JOIN estudiante e ON e.id = p.estudiante_id
       WHERE ($1::int IS NULL OR e.institucion_id = $1)
       ORDER BY e.nombres`, [inst || null])).rows;
    const actores = consolidarPmi(piars);
    const barreras = (await query(
      `SELECT a.barrera, COUNT(*)::int AS n
       FROM ajuste_razonable a JOIN piar p ON p.id = a.piar_id JOIN estudiante e ON e.id = p.estudiante_id
       WHERE ($1::int IS NULL OR e.institucion_id = $1) AND COALESCE(a.barrera,'') <> ''
       GROUP BY a.barrera ORDER BY n DESC LIMIT 20`, [inst || null])).rows;
    res.json({ actores, barreras });
  } catch (err) { next(err); }
});

// Helper: carga estudiante + institución para un formato por estudiante
async function cargarEstudianteInforme(id) {
  const { rows } = await query(
    `SELECT e.id, e.nombres AS estudiante, e.documento_tipo, e.documento_numero, e.grado,
            e.institucion_id, e.reservado, e.entorno_salud->>'discapacidad' AS discapacidad,
            i.nombre AS inst_nombre, i.logo AS inst_logo, i.nit AS inst_nit
     FROM estudiante e LEFT JOIN institucion i ON i.id = e.institucion_id WHERE e.id = $1`, [id]);
  return rows[0];
}

// ====== Formato de apoyos para pruebas de Estado ======
router.get('/prueba-estado/:id/pdf', async (req, res, next) => {
  try {
    const p = (await query('SELECT * FROM prueba_estado WHERE id=$1', [req.params.id])).rows[0];
    if (!p) return res.status(404).json({ error: 'No encontrado.' });
    const e = await cargarEstudianteInforme(p.estudiante_id);
    const neg = negarAcceso(req.usuario, e);
    if (neg) return res.status(neg.status).json({ error: neg.error });
    const doc = iniciar(res, req, `Pruebas_Estado_${e.id}.pdf`);
    titulo(doc, 'SOLICITUD DE APOYOS PARA PRUEBAS DE ESTADO', 'Estudiante con discapacidad — Decreto 1421 de 2017',
      { logo: e.inst_logo, nombre: e.inst_nombre, nit: e.inst_nit });
    campos(doc, [['Estudiante', e.estudiante], ['Documento', `${e.documento_tipo || ''} ${e.documento_numero || ''}`]]);
    campos(doc, [['Grado', e.grado], ['Tipo de prueba', p.tipo || '—']]);
    campos(doc, [['Discapacidad', e.discapacidad || '—']]);
    banda(doc, 'Apoyos solicitados');
    const apoyos = Array.isArray(p.apoyos) ? p.apoyos : [];
    if (apoyos.length === 0) doc.font('Helvetica-Oblique').fontSize(9).text('No se registraron apoyos.', X0, doc.y + 2);
    else apoyos.forEach((a) => { saltoSi(doc, 14); doc.font('Helvetica').fontSize(9).fillColor('#000').text(`•  ${a}`, X0 + 4, doc.y, { width: ANCHO - 8 }); });
    if (p.otros_apoyos) { doc.moveDown(0.3); campos(doc, [['Otros apoyos', p.otros_apoyos]]); }
    if (p.observaciones) campos(doc, [['Observaciones', p.observaciones]]);
    finalizar(doc);
  } catch (err) { next(err); }
});

// ====== Formato de remisión ======
router.get('/remision/:id/pdf', async (req, res, next) => {
  try {
    const r = (await query('SELECT * FROM remision WHERE id=$1', [req.params.id])).rows[0];
    if (!r) return res.status(404).json({ error: 'No encontrada.' });
    const e = await cargarEstudianteInforme(r.estudiante_id);
    const neg = negarAcceso(req.usuario, e);
    if (neg) return res.status(neg.status).json({ error: neg.error });
    const doc = iniciar(res, req, `Remision_${e.id}.pdf`);
    titulo(doc, 'FORMATO DE REMISIÓN / ARTICULACIÓN INTERSECTORIAL', 'Remisión a otro sector para el apoyo del estudiante',
      { logo: e.inst_logo, nombre: e.inst_nombre, nit: e.inst_nit });
    campos(doc, [['Estudiante', e.estudiante], ['Grado', e.grado]]);
    campos(doc, [['Fecha', r.fecha ? new Date(r.fecha).toLocaleDateString('es-CO') : '—'], ['Estado', r.estado]]);
    campos(doc, [['Sector', r.sector || '—'], ['Entidad', r.entidad || '—']]);
    banda(doc, 'Motivo de la remisión');
    campos(doc, [['Motivo', r.motivo || '—']]);
    if (r.respuesta) { banda(doc, 'Respuesta / informe recibido'); campos(doc, [['Síntesis', r.respuesta]]); }
    finalizar(doc);
  } catch (err) { next(err); }
});

// ====== Acta de promoción / egreso / titulación ======
router.get('/promocion/:piarId/pdf', async (req, res, next) => {
  try {
    const data = await cargarPiar(req.params.piarId);
    if (!data) return res.status(404).json({ error: 'PIAR no encontrado.' });
    { const neg = negarAcceso(req.usuario, await accesoPiar(data.piar.id)); if (neg) return res.status(neg.status).json({ error: neg.error }); }
    const { piar } = data;
    const pr = (await query('SELECT * FROM promocion WHERE piar_id=$1', [req.params.piarId])).rows[0] || {};
    const DEC = { promovido: 'Promovido', no_promovido: 'No promovido', promocion_anticipada: 'Promoción anticipada', egresado: 'Egresado', titulado: 'Titulado (bachiller)' };
    const doc = iniciar(res, req, `Promocion_${piar.estudiante_id}.pdf`);
    titulo(doc, 'ACTA DE PROMOCIÓN, EGRESO Y TITULACIÓN', 'Decisión de fin de año — estudiante con PIAR',
      { logo: piar.inst_logo, nombre: piar.inst_nombre, nit: piar.inst_nit });
    campos(doc, [['Estudiante', piar.estudiante], ['Año', piar.periodo]]);
    campos(doc, [['Grado cursado', pr.grado_cursado || piar.grado || '—'], ['Decisión', DEC[pr.decision] || '—']]);
    campos(doc, [['Grado al que se promueve', pr.grado_siguiente || '—']]);
    banda(doc, 'Criterios de promoción (flexibles)');
    campos(doc, [['Criterios', pr.criterios || '—']]);
    campos(doc, [['Observaciones', pr.observaciones || '—']]);
    saltoSi(doc, 70); doc.moveDown(2);
    const y = doc.y;
    [['Rector(a)', 60], ['Docente / orientación', 220], ['Familia / acudiente', 380]].forEach(([t, x]) => {
      doc.moveTo(x, y + 24).lineTo(x + 150, y + 24).stroke(BORDE);
      doc.font('Helvetica').fontSize(8).fillColor(GRIS_MEDIO).text(t, x, y + 27, { width: 150, lineBreak: false });
    });
    doc.y = y + 42;
    finalizar(doc);
  } catch (err) { next(err); }
});

// ====== Autorización de tratamiento de datos (habeas data, Ley 1581) ======
router.get('/autorizacion/:estudianteId/pdf', async (req, res, next) => {
  try {
    const e = await cargarEstudianteInforme(req.params.estudianteId);
    const neg = negarAcceso(req.usuario, e);
    if (neg) return res.status(neg.status).json({ error: neg.error });
    const a = (await query('SELECT * FROM autorizacion_datos WHERE estudiante_id=$1', [req.params.estudianteId])).rows[0] || {};
    const doc = iniciar(res, req, `Autorizacion_datos_${e.id}.pdf`);
    titulo(doc, 'AUTORIZACIÓN DE TRATAMIENTO DE DATOS PERSONALES', 'Ley 1581 de 2012 y Decreto 1377 de 2013 — datos sensibles de menores',
      { logo: e.inst_logo, nombre: e.inst_nombre, nit: e.inst_nit });
    campos(doc, [['Estudiante', e.estudiante], ['Documento', `${e.documento_tipo || ''} ${e.documento_numero || ''}`]]);
    doc.moveDown(0.3);
    const texto = `Yo, ${a.nombre_acudiente || '____________________'}, identificado(a) con documento ${a.documento_acudiente || '____________'}, en calidad de ${a.parentesco || 'acudiente'} del estudiante ${e.estudiante}, autorizo de manera libre, previa, expresa e informada a ${e.inst_nombre || 'la institución educativa'} para recolectar, almacenar y tratar los datos personales del estudiante, incluidos datos sensibles de salud y discapacidad, con la única finalidad de elaborar y hacer seguimiento al Plan Individual de Ajustes Razonables (PIAR) en el marco del Decreto 1421 de 2017. Conozco que puedo ejercer los derechos de acceso, corrección, actualización y supresión de los datos, y que estos no serán compartidos con terceros sin autorización, salvo obligación legal.`;
    doc.font('Helvetica').fontSize(10).fillColor('#000').text(texto, X0, doc.y, { width: ANCHO, align: 'justify', lineGap: 2 });
    doc.moveDown(0.6);
    campos(doc, [['¿Autoriza el tratamiento de datos?', a.autoriza ? 'SÍ AUTORIZO' : 'Pendiente de autorización']]);
    campos(doc, [['Fecha', a.fecha ? new Date(a.fecha).toLocaleDateString('es-CO') : '—']]);
    doc.moveDown(1.5);
    const y = doc.y;
    if (a.firma_img && a.firma_img.startsWith('data:image')) {
      try { doc.image(Buffer.from(a.firma_img.split(',')[1], 'base64'), X0, y, { fit: [180, 46] }); } catch { /* ignora */ }
    }
    doc.moveTo(X0, y + 50).lineTo(X0 + 200, y + 50).stroke(BORDE);
    doc.font('Helvetica').fontSize(8.5).fillColor(GRIS_MEDIO).text(`Firma: ${a.nombre_acudiente || 'acudiente'}`, X0, y + 53, { width: 220, lineBreak: false });
    doc.y = y + 70;
    finalizar(doc);
  } catch (err) { next(err); }
});

// ====== Formato de tamizaje (detección en el aula) ======
router.get('/tamizaje/:id/pdf', async (req, res, next) => {
  try {
    const { DOMINIOS_NOMBRE } = await import('../lib/tamizaje.js');
    const { rows } = await query(
      `SELECT t.*, u.nombres AS aplicado_nombre, e.nombres AS estudiante, e.grado, e.institucion_id, e.reservado,
              i.nombre AS inst_nombre, i.logo AS inst_logo, i.nit AS inst_nit
       FROM tamizaje t JOIN estudiante e ON e.id = t.estudiante_id
       LEFT JOIN usuario u ON u.id = t.aplicado_por
       LEFT JOIN institucion i ON i.id = e.institucion_id WHERE t.id = $1`, [req.params.id]);
    const t = rows[0];
    const neg = negarAcceso(req.usuario, t && { institucion_id: t.institucion_id, reservado: t.reservado });
    if (neg) return res.status(neg.status).json({ error: neg.error });
    const alerta = Array.isArray(t.dominios_alerta) ? t.dominios_alerta : [];

    const doc = iniciar(res, req, `Tamizaje_${t.estudiante_id}.pdf`);
    titulo(doc, 'DETECCIÓN EN EL AULA – TAMIZAJE DE CARACTERIZACIÓN', 'Escalas de observación (MEN). Valoración 1 a 4.',
      { logo: t.inst_logo, nombre: t.inst_nombre, nit: t.inst_nit });
    campos(doc, [['Estudiante', t.estudiante], ['Grado', t.grado]]);
    campos(doc, [['Fecha', t.fecha ? new Date(t.fecha).toLocaleDateString('es-CO') : '—'], ['Aplicado por', t.aplicado_nombre || '—']]);

    banda(doc, 'Resultado por dominio');
    doc.moveDown(0.2);
    Object.entries(DOMINIOS_NOMBRE).forEach(([clave, nombre]) => {
      const resp = t.respuestas?.[clave] || {};
      const vals = Object.values(resp).filter((v) => v >= 1 && v <= 4);
      const prom = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—';
      const enAlerta = alerta.includes(clave);
      saltoSi(doc, 16);
      doc.font('Helvetica-Bold').fontSize(9).fillColor(enAlerta ? '#c62828' : '#2e7d32')
        .text(enAlerta ? 'ALERTA   ' : 'OK       ', X0, doc.y, { continued: true });
      doc.font('Helvetica').fillColor('#000').text(`${nombre}  —  promedio ${prom}`, { width: ANCHO - 20 });
    });

    doc.moveDown(0.5);
    banda(doc, 'Conclusión');
    if (alerta.length === 0) {
      campos(doc, [['Observación', 'No se identificaron señales de alerta. Continuar la observación regular en el aula.']]);
    } else {
      const nombres = alerta.map((c) => DOMINIOS_NOMBRE[c]).join('; ');
      campos(doc, [['Dominios con señal de alerta', nombres]]);
      campos(doc, [['Recomendación', 'Se sugiere remitir al equipo de orientación / valoración pedagógica para profundizar en estos dominios. Este tamizaje es una observación de aula, no un diagnóstico.']]);
    }
    if (t.observaciones) campos(doc, [['Observaciones del docente', t.observaciones]]);
    finalizar(doc);
  } catch (err) { next(err); }
});

// ====== Formato de Plan de Mejoramiento Institucional (PMI) desde los PIAR ======
router.get('/pmi/pdf', autorizar('superadmin', 'rector', 'coordinador', 'administrador'), async (req, res, next) => {
  try {
    const esSuper = req.usuario.rol === 'superadmin';
    const inst = esSuper ? (req.query.institucion_id || null) : req.usuario.institucion_id;
    // PIAR del colegio con recomendaciones PMI (por actor) o barreras
    const { rows } = await query(
      `SELECT p.id, p.periodo, p.grado AS grado_piar, e.nombres, e.grado, p.recomendaciones_pmi,
              i.nombre AS institucion_nombre, i.logo AS inst_logo, i.nit AS inst_nit
       FROM piar p JOIN estudiante e ON e.id = p.estudiante_id
       LEFT JOIN institucion i ON i.id = e.institucion_id
       WHERE ($1::int IS NULL OR e.institucion_id = $1)
       ORDER BY e.nombres`, [inst || null]);
    // Barreras recurrentes (de los ajustes) para el colegio
    const barreras = await query(
      `SELECT a.barrera, COUNT(*)::int AS n
       FROM ajuste_razonable a JOIN piar p ON p.id = a.piar_id
       JOIN estudiante e ON e.id = p.estudiante_id
       WHERE ($1::int IS NULL OR e.institucion_id = $1) AND COALESCE(a.barrera,'') <> ''
       GROUP BY a.barrera ORDER BY n DESC LIMIT 15`, [inst || null]);

    const inst0 = rows[0] || {};
    const institucion = { logo: inst0.inst_logo, nombre: inst0.institucion_nombre, nit: inst0.inst_nit };
    const anio = String(req.query.anio || new Date().getFullYear());

    // Plan institucional diligenciable (pmi_institucional) — por ámbito (general o sede/jornada)
    const pmiInst = inst ? (await query(
      `SELECT sede, jornada, actor, acciones, estrategias FROM pmi_institucional
       WHERE institucion_id=$1 AND anio=$2 AND (COALESCE(acciones,'')<>'' OR COALESCE(estrategias,'')<>'')
       ORDER BY sede, jornada`, [inst, anio])).rows : [];
    const ambitos = [];
    for (const r of pmiInst) {
      const clave = `${r.sede}||${r.jornada}`;
      let g = ambitos.find((a) => a.clave === clave);
      if (!g) { g = { clave, sede: r.sede, jornada: r.jornada, filas: {} }; ambitos.push(g); }
      g.filas[r.actor] = { acciones: r.acciones, estrategias: r.estrategias };
    }
    const GUIA = [
      ['Familia, cuidadores o con quienes vive', 'Acompañar las actividades en casa, mantener comunicación con la institución, informar avances y necesidades del estudiante y participar en los acuerdos y el seguimiento.', 'Rutinas y hábitos de estudio en casa, refuerzo de lo trabajado en el aula, asistencia a reuniones y entrega de soportes.'],
      ['Docentes', 'Aplicar los ajustes razonables en el aula, flexibilizar actividades y evaluación, y hacer seguimiento al desempeño del estudiante.', 'Diseño Universal para el Aprendizaje (DUA), material adaptado, apoyos visuales, tiempo adicional y trabajo diferenciado por áreas.'],
      ['Directivos', 'Garantizar tiempos, recursos y condiciones; liderar la política de inclusión y acompañar al equipo docente.', 'Organización de jornadas y horarios, formación docente, asignación de apoyos y ajustes institucionales.'],
      ['Administrativos', 'Facilitar procesos, gestionar materiales y asegurar la accesibilidad física y de la información.', 'Adecuación de espacios, señalización, accesibilidad y gestión de insumos y recursos de apoyo.'],
      ['Pares (sus compañeros)', 'Acompañar, incluir y colaborar con el estudiante en las actividades escolares y de convivencia.', 'Trabajo colaborativo, tutoría entre pares, parejas o grupos de apoyo y actividades inclusivas.'],
    ];
    const COLS_PMI = [['Actores', 150], ['Acciones', 190, 'left'], ['Estrategias a implementar', 183, 'left']];

    const doc = iniciar(res, req, 'Formato_PMI.pdf', { inst: institucion, linea: `Plan de Mejoramiento Institucional · Año ${anio}` });
    if (req.query.portada !== '0') {
      portada(doc, { tituloDoc: 'Plan de Mejoramiento Institucional (PMI)', estudiante: `Año ${anio}`, documento: '', inst: institucion });
    }
    titulo(doc, 'PLAN DE MEJORAMIENTO INSTITUCIONAL (PMI)', `Eliminación de barreras — Año ${anio} · Decreto 1421 de 2017`, institucion);
    doc.moveDown(0.2);

    // 1) Plan institucional (diligenciable)
    banda(doc, 'Plan institucional (diligenciable)');
    doc.moveDown(0.2);
    if (ambitos.length === 0) {
      doc.font('Helvetica-Oblique').fontSize(9).text('Aún no se ha diligenciado el plan institucional. Se registra en el módulo PMI por actor (general o por sede y jornada).', X0, doc.y + 2, { width: ANCHO });
      doc.moveDown(0.4);
    } else {
      ambitos.forEach((g) => {
        const ambito = g.sede || g.jornada ? `${g.sede || 'Todas las sedes'}${g.jornada ? ' · ' + g.jornada : ''}` : 'Toda la institución';
        saltoSi(doc, 24);
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor(GRIS_MEDIO).text(`Ámbito: ${ambito}`, X0, doc.y + 2);
        doc.fillColor('#000').moveDown(0.2);
        tablaInforme(doc, COLS_PMI, ACTORES_PMI.map(([clave, nombre]) => {
          const f = g.filas[clave] || {};
          return [nombre, f.acciones || '—', f.estrategias || '—'];
        }), { alto: 16 });
      });
    }

    // 2) Cómo puede participar y aportar cada actor (guía)
    banda(doc, 'Cómo puede participar y aportar cada actor');
    doc.moveDown(0.2);
    tablaInforme(doc, COLS_PMI, GUIA, { alto: 16 });

    banda(doc, 'Barreras recurrentes identificadas en los PIAR');
    doc.moveDown(0.2);
    if (barreras.rows.length === 0) {
      doc.font('Helvetica-Oblique').fontSize(9).text('Aún no se han registrado barreras en los PIAR.', X0, doc.y + 2);
    } else {
      barreras.rows.forEach((b) => {
        saltoSi(doc, 16);
        doc.font('Helvetica-Bold').fontSize(9).fillColor(GRIS).text(`(${b.n})  `, X0, doc.y, { continued: true });
        doc.font('Helvetica').fillColor('#000').text(b.barrera, { width: ANCHO - 30 });
      });
    }

    banda(doc, 'Resumen por actor (insumo para el plan de mejoramiento)');
    doc.moveDown(0.2);
    const actores = consolidarPmi(rows);
    const hayAlgo = actores.some((a) => a.items.length > 0);
    if (!hayAlgo) {
      doc.font('Helvetica-Oblique').fontSize(9).text('Aún no se han registrado recomendaciones PMI en los PIAR. Se diligencian en el Anexo 2 (punto 7) de cada estudiante.', X0, doc.y + 2, { width: ANCHO });
    } else {
      actores.filter((a) => a.items.length > 0).forEach((a) => {
        saltoSi(doc, 40);
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor(GRIS).text(`${a.nombre}  (${a.items.length} PIAR)`, X0, doc.y + 4);
        doc.fillColor('#000').moveDown(0.2);
        doc.font('Helvetica-Bold').fontSize(8.5).text('Acciones:', X0 + 6, doc.y, { continued: false });
        a.resumen_acciones.forEach((t) => { saltoSi(doc, 12); doc.font('Helvetica').fontSize(8.5).text(`•  ${t}`, X0 + 12, doc.y, { width: ANCHO - 18 }); });
        if (!a.resumen_acciones.length) doc.font('Helvetica-Oblique').fontSize(8.5).text('—', X0 + 12, doc.y);
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#000').text('Estrategias a implementar:', X0 + 6, doc.y + 2);
        a.resumen_estrategias.forEach((t) => { saltoSi(doc, 12); doc.font('Helvetica').fontSize(8.5).text(`•  ${t}`, X0 + 12, doc.y, { width: ANCHO - 18 }); });
        if (!a.resumen_estrategias.length) doc.font('Helvetica-Oblique').fontSize(8.5).text('—', X0 + 12, doc.y);
        doc.moveDown(0.5);
      });
    }
    finalizar(doc);
  } catch (err) { next(err); }
});

// ====== Estadísticas sociodemográficas (agregadas, anónimas) ======
router.get('/estadisticas', async (req, res, next) => {
  try {
    const esSuper = req.usuario.rol === 'superadmin';
    // Confidencialidad: quien no es superadmin solo ve agregados de su institución.
    const cond = []; const params = [];
    if (!esSuper) { params.push(req.usuario.institucion_id); cond.push(`e.institucion_id = $${params.length}`); }
    else if (req.query.institucion_id) { params.push(req.query.institucion_id); cond.push(`e.institucion_id = $${params.length}`); }
    if (req.query.departamento) { params.push(req.query.departamento); cond.push(`d.nombre = $${params.length}`); }
    if (req.query.discapacidad) { params.push(req.query.discapacidad); cond.push(`e.entorno_salud->>'discapacidad' = $${params.length}`); }
    // Ocultar reservados a quien no sea del equipo de orientación
    if (!ROLES_RESERVADO.includes(req.usuario.rol)) cond.push('e.reservado = FALSE');
    const where = cond.length ? `WHERE ${cond.join(' AND ')}` : '';
    const base = `FROM estudiante e
       LEFT JOIN institucion i ON i.id = e.institucion_id
       LEFT JOIN municipio m ON m.id = i.municipio_id
       LEFT JOIN departamento d ON d.id = m.departamento_id ${where}`;
    const grupo = async (expr, alias) => (await query(
      `SELECT COALESCE(${expr}, 'Sin dato') AS ${alias}, COUNT(*)::int AS total ${base} GROUP BY 1 ORDER BY total DESC`, params)).rows;

    const por_discapacidad = await grupo("NULLIF(e.entorno_salud->>'discapacidad','')", 'etiqueta');
    const por_genero = await grupo("NULLIF(e.identificacion->>'sexo','')", 'etiqueta');
    const por_departamento = await grupo('d.nombre', 'etiqueta');
    const por_municipio = await grupo('m.nombre', 'etiqueta');
    const por_institucion = await grupo('i.nombre', 'etiqueta');
    // Rangos de edad
    const edades = (await query(
      `SELECT CASE
          WHEN date_part('year', age(e.fecha_nacimiento)) < 6 THEN '0-5'
          WHEN date_part('year', age(e.fecha_nacimiento)) < 11 THEN '6-10'
          WHEN date_part('year', age(e.fecha_nacimiento)) < 16 THEN '11-15'
          WHEN e.fecha_nacimiento IS NULL THEN 'Sin dato'
          ELSE '16+' END AS etiqueta, COUNT(*)::int AS total ${base}
        GROUP BY 1 ORDER BY 1`, params)).rows;
    const total = (await query(`SELECT COUNT(*)::int AS n ${base}`, params)).rows[0].n;

    res.json({ total, por_discapacidad, por_genero, por_edad: edades, por_departamento, por_municipio, por_institucion, ambito: esSuper ? 'nacional' : 'institucion' });
  } catch (err) { next(err); }
});

// ====== Alertas / recordatorios para el panel ======
router.get('/alertas', async (req, res, next) => {
  try {
    const esSuper = req.usuario.rol === 'superadmin';
    const inst = esSuper ? null : req.usuario.institucion_id;
    const p = [inst];
    const seguimientos = (await query(
      `SELECT COUNT(*)::int AS n FROM ajuste_razonable a
       JOIN piar pi ON pi.id = a.piar_id JOIN estudiante e ON e.id = pi.estudiante_id
       WHERE ($1::int IS NULL OR e.institucion_id = $1) AND a.retirado = FALSE
         AND (SELECT COUNT(*) FROM seguimiento s WHERE s.ajuste_id = a.id) < 3`, p)).rows[0].n;
    const piarSinAjustes = (await query(
      `SELECT COUNT(*)::int AS n FROM piar pi JOIN estudiante e ON e.id = pi.estudiante_id
       WHERE ($1::int IS NULL OR e.institucion_id = $1) AND pi.estado = 'vigente'
         AND NOT EXISTS (SELECT 1 FROM ajuste_razonable a WHERE a.piar_id = pi.id)`, p)).rows[0].n;
    const autorizaciones = (await query(
      `SELECT COUNT(*)::int AS n FROM estudiante e
       WHERE ($1::int IS NULL OR e.institucion_id = $1)
         AND NOT EXISTS (SELECT 1 FROM autorizacion_datos ad WHERE ad.estudiante_id = e.id AND ad.autoriza = TRUE)`, p)).rows[0].n;
    res.json({ seguimientos_pendientes: seguimientos, piar_sin_ajustes: piarSinAjustes, autorizaciones_faltantes: autorizaciones });
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

// ====== Informe institucional consolidado del PIAR ======
// Tabla simple con cabecera gris. cols: [[titulo, ancho, align]]; filas: [[v,v,...]]
function tablaInforme(doc, cols, filas, opts = {}) {
  const alto = opts.alto || 15;
  const dibujarCab = () => {
    saltoSi(doc, alto + 2);
    const y = doc.y; let x = X0;
    cols.forEach(([t, w]) => {
      doc.rect(x, y, w, alto).fillAndStroke(GRIS, BORDE);
      doc.fillColor('#fff').font('Helvetica-Bold').fontSize(8).text(t, x + 3, y + 4, { width: w - 6, align: 'left', lineBreak: false });
      x += w;
    });
    doc.fillColor('#000'); doc.y = y + alto;
  };
  dibujarCab();
  filas.forEach((f, idx) => {
    let hFila = alto;
    cols.forEach(([, w], i) => {
      doc.font('Helvetica').fontSize(8);
      hFila = Math.max(hFila, doc.heightOfString(String(f[i] ?? '—'), { width: w - 6 }) + 5);
    });
    if (doc.y + hFila > TOPE) { doc.addPage(); dibujarCab(); }
    const y = doc.y; let x = X0;
    cols.forEach(([, w, align], i) => {
      if (idx % 2 === 1) { doc.rect(x, y, w, hFila).fill('#F5F7F8'); }
      doc.rect(x, y, w, hFila).stroke(BORDE);
      doc.fillColor('#000').font('Helvetica').fontSize(8)
         .text(String(f[i] ?? '—'), x + 3, y + 3, { width: w - 6, align: align || 'left' });
      x += w;
    });
    doc.y = y + hFila;
  });
  doc.moveDown(0.5);
}

router.get('/institucional/pdf', autorizar('superadmin', 'rector', 'coordinador', 'psicoorientador', 'administrador', 'docente'), async (req, res, next) => {
  try {
    const esSuper = req.usuario.rol === 'superadmin';
    const instId = esSuper ? (req.query.institucion_id || null) : req.usuario.institucion_id;
    const veReservados = ROLES_RESERVADO.includes(req.usuario.rol);
    const P = [instId || null];

    const instRow = (await query(
      `SELECT i.id, i.nombre, i.sede, i.nit, i.logo, i.sistema_evaluacion, i.num_periodos,
              m.nombre AS municipio, d.nombre AS departamento
       FROM institucion i LEFT JOIN municipio m ON m.id = i.municipio_id
       LEFT JOIN departamento d ON d.id = m.departamento_id WHERE i.id = $1`, [instId]
    )).rows[0] || { nombre: 'Institución Educativa', nit: '', logo: null };
    const inst = { logo: instRow.logo, nombre: instRow.nombre, nit: instRow.nit };

    // Cifras generales
    const g = (await query(
      `SELECT
         COUNT(*)::int AS total_est,
         COUNT(*) FILTER (WHERE reservado)::int AS reservados,
         COUNT(DISTINCT entorno_salud->>'discapacidad') FILTER (WHERE COALESCE(entorno_salud->>'discapacidad','') <> '')::int AS tipos_disc
       FROM estudiante WHERE ($1::int IS NULL OR institucion_id = $1)`, P)).rows[0];
    const piarEstado = (await query(
      `SELECT p.estado::text AS estado, COUNT(*)::int AS n
       FROM piar p JOIN estudiante e ON e.id = p.estudiante_id
       WHERE ($1::int IS NULL OR e.institucion_id = $1) GROUP BY p.estado`, P)).rows;
    const nPiar = (s) => (piarEstado.find(r => r.estado === s)?.n || 0);
    const aj = (await query(
      `SELECT COUNT(*) FILTER (WHERE NOT a.retirado)::int AS activos,
              COUNT(*) FILTER (WHERE a.retirado)::int AS retirados,
              COUNT(*) FILTER (WHERE NOT a.retirado AND COALESCE(a.desempeno,'') <> '')::int AS valorados
       FROM ajuste_razonable a JOIN piar p ON p.id = a.piar_id JOIN estudiante e ON e.id = p.estudiante_id
       WHERE ($1::int IS NULL OR e.institucion_id = $1)`, P)).rows[0];
    const seg = (await query(
      `SELECT COALESCE(LEAST(n,3),0) AS grp, COUNT(*)::int AS ajustes FROM (
         SELECT a.id, COUNT(s.id) AS n
         FROM ajuste_razonable a JOIN piar p ON p.id=a.piar_id JOIN estudiante e ON e.id=p.estudiante_id
         LEFT JOIN seguimiento s ON s.ajuste_id = a.id
         WHERE NOT a.retirado AND ($1::int IS NULL OR e.institucion_id=$1) GROUP BY a.id
       ) t GROUP BY LEAST(n,3) ORDER BY 1`, P)).rows;
    const segN = (k) => (seg.find(r => Number(r.grp) === k)?.ajustes || 0);
    const con3 = segN(3);
    const totAjSeg = seg.reduce((s, r) => s + r.ajustes, 0);
    const actas = (await query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE firmada_familia)::int AS fam,
              COUNT(*) FILTER (WHERE firmada_institucion)::int AS insti
       FROM acta_acuerdo ac JOIN piar p ON p.id=ac.piar_id JOIN estudiante e ON e.id=p.estudiante_id
       WHERE ($1::int IS NULL OR e.institucion_id=$1)`, P)).rows[0];
    const otros = (await query(
      `SELECT
        (SELECT COUNT(*) FROM tamizaje t JOIN estudiante e ON e.id=t.estudiante_id WHERE ($1::int IS NULL OR e.institucion_id=$1))::int AS tamizajes,
        (SELECT COUNT(*) FROM autorizacion_datos au JOIN estudiante e ON e.id=au.estudiante_id WHERE ($1::int IS NULL OR e.institucion_id=$1))::int AS autoriz,
        (SELECT COUNT(*) FROM remision r JOIN estudiante e ON e.id=r.estudiante_id WHERE r.sector='Psicoorientación' AND ($1::int IS NULL OR e.institucion_id=$1))::int AS remisiones`, P)).rows[0];

    const porDisc = (await query(
      `SELECT COALESCE(NULLIF(entorno_salud->>'discapacidad',''),'Sin registrar') AS disc, COUNT(*)::int AS n
       FROM estudiante WHERE ($1::int IS NULL OR institucion_id=$1) GROUP BY 1 ORDER BY 2 DESC, 1`, P)).rows;
    const porGrado = (await query(
      `SELECT COALESCE(NULLIF(grado,''),'Sin grado') AS grado, COUNT(*)::int AS n
       FROM estudiante WHERE ($1::int IS NULL OR institucion_id=$1) GROUP BY 1 ORDER BY n DESC, grado`, P)).rows;

    let sqlList = `SELECT e.nombres, e.reservado, COALESCE(NULLIF(e.grado,''),'—') AS grado,
              COALESCE(NULLIF(e.entorno_salud->>'discapacidad',''),'Sin registrar') AS disc,
              COUNT(a.id) FILTER (WHERE NOT a.retirado)::int AS ajustes,
              COUNT(a.id) FILTER (WHERE NOT a.retirado AND COALESCE(a.desempeno,'')<>'')::int AS valorados
       FROM estudiante e LEFT JOIN piar p ON p.estudiante_id=e.id LEFT JOIN ajuste_razonable a ON a.piar_id=p.id
       WHERE ($1::int IS NULL OR e.institucion_id=$1)`;
    if (!veReservados) sqlList += ' AND e.reservado = FALSE';
    sqlList += ' GROUP BY e.id, e.nombres, e.reservado, e.grado, e.entorno_salud ORDER BY e.nombres';
    const listado = (await query(sqlList, P)).rows;

    const hoy = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
    const periodo = new Date().getFullYear();
    const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) + '%' : '—');

    const doc = iniciar(res, req, 'Informe_institucional_PIAR.pdf', { inst, linea: `Informe institucional del PIAR · Periodo ${periodo}` });
    if (req.query.portada !== '0') {
      portada(doc, { tituloDoc: 'Informe Institucional del PIAR', estudiante: `Periodo ${periodo}`, documento: '', inst });
    }

    titulo(doc, 'INFORME INSTITUCIONAL DEL PIAR', `Decreto 1421 de 2017 · Consolidado ${periodo} · Generado el ${hoy}`, inst);
    doc.moveDown(0.2);

    banda(doc, 'Resumen general');
    campos(doc, [['Estudiantes con expediente PIAR', g.total_est], ['PIAR vigentes', nPiar('vigente')]]);
    campos(doc, [['PIAR en borrador', nPiar('borrador')], ['PIAR cerrados', nPiar('cerrado')]]);
    campos(doc, [['Ajustes razonables activos', aj.activos], ['Tipos de discapacidad atendidos', g.tipos_disc]]);
    campos(doc, [['Detecciones / tamizajes', otros.tamizajes], ['Remisiones a psicoorientación', otros.remisiones]]);
    doc.moveDown(0.4);

    banda(doc, 'Cumplimiento del Decreto 1421');
    campos(doc, [['Ajustes con sus 3 seguimientos', `${con3} de ${totAjSeg}  (${pct(con3, totAjSeg)})`], ['Ajustes ya valorados (desempeño)', `${aj.valorados} de ${aj.activos}  (${pct(aj.valorados, aj.activos)})`]]);
    campos(doc, [['Actas de acuerdo firmadas por la familia', `${actas.fam} de ${actas.total}  (${pct(actas.fam, actas.total)})`], ['Actas firmadas por la institución', `${actas.insti} de ${actas.total}  (${pct(actas.insti, actas.total)})`]]);
    campos(doc, [['Autorizaciones de tratamiento de datos', otros.autoriz], ['Estudiantes con información reservada', g.reservados]]);
    doc.moveDown(0.5);

    banda(doc, 'Estudiantes por tipo de discapacidad');
    tablaInforme(doc, [['Tipo de discapacidad', 380], ['Estudiantes', 83, 'center'], ['%', 60, 'center']],
      porDisc.map(r => [r.disc, r.n, pct(r.n, g.total_est)]));

    banda(doc, 'Estudiantes por grado');
    tablaInforme(doc, [['Grado', 380], ['Estudiantes', 83, 'center'], ['%', 60, 'center']],
      porGrado.map(r => [r.grado, r.n, pct(r.n, g.total_est)]));

    banda(doc, 'Estado de los seguimientos (ajustes activos)');
    tablaInforme(doc, [['Seguimientos realizados', 380], ['Ajustes', 83, 'center'], ['%', 60, 'center']],
      [['Sin seguimientos', segN(0)], ['1 seguimiento', segN(1)], ['2 seguimientos', segN(2)], ['3 o más (completo)', segN(3)]]
        .map(([l, n]) => [l, n, pct(n, totAjSeg)]));

    banda(doc, `Estudiantes con PIAR (${listado.length})`);
    tablaInforme(doc,
      [['Estudiante', 210], ['Grado', 55, 'center'], ['Discapacidad', 140], ['Ajustes', 48, 'center'], ['Avance', 70, 'center']],
      listado.map(r => [
        r.reservado ? `${r.nombres}  (reservado)` : r.nombres,
        r.grado, r.disc, r.ajustes, `${r.valorados}/${r.ajustes} ${pct(r.valorados, r.ajustes)}`
      ]), { alto: 15 });
    if (!listado.length) doc.font('Helvetica-Oblique').fontSize(9).text('No hay estudiantes registrados para esta institución.', X0, doc.y + 6);

    finalizar(doc);
  } catch (err) { next(err); }
});

export default router;
