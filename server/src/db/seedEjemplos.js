// Siembra de estudiantes de ejemplo con fotos (corre una sola vez, marcada en _seed_marca).
// Quita cualquier nombre personal que se haya usado en pruebas y deja 6 estudiantes
// de ejemplo con fotos tipo documento. No borra los PIAR ni los ajustes existentes.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../db.js';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const DIR_FOTOS = path.resolve(aqui, '../../db/fotos');

function dataUrl(nombreArchivo) {
  const p = path.join(DIR_FOTOS, nombreArchivo);
  const b64 = fs.readFileSync(p).toString('base64');
  return `data:image/jpeg;base64,${b64}`;
}

const EJEMPLOS = [
  { doc: '1098765001', nombre: 'Valentina Ríos Mejía', sexo: 'Femenino', grado: '10', nac: '2009-05-14', foto: 'ej1.jpg' },
  { doc: '1098765002', nombre: 'Samuel Herrera Ortiz', sexo: 'Masculino', grado: '8', nac: '2011-08-03', foto: 'ej2.jpg' },
  { doc: '1098765003', nombre: 'Isabela Moreno Castro', sexo: 'Femenino', grado: '9', nac: '2010-11-20', foto: 'ej3.jpg' },
  { doc: '1098765004', nombre: 'Mateo Vargas León', sexo: 'Masculino', grado: '8', nac: '2011-03-09', foto: 'ej4.jpg' },
  { doc: '1098765005', nombre: 'Daniela Jiménez Rojas', sexo: 'Femenino', grado: '9', nac: '2010-06-27', foto: 'ej5.jpg' },
  { doc: '1098765006', nombre: 'Sebastián Niño Parra', sexo: 'Masculino', grado: '11', nac: '2008-09-15', foto: 'ej6.jpg' },
];

export async function seedEjemplos() {
  try {
    await pool.query('CREATE TABLE IF NOT EXISTS _seed_marca (clave TEXT PRIMARY KEY, aplicado_en TIMESTAMPTZ NOT NULL DEFAULT now())');
    const ya = await pool.query("SELECT 1 FROM _seed_marca WHERE clave = 'fotos_ejemplo_v1'");
    if (ya.rowCount) return;

    const inst = await pool.query('SELECT id FROM institucion ORDER BY id LIMIT 1');
    if (!inst.rowCount) return; // base aún sin institución
    const instId = inst.rows[0].id;

    for (const e of EJEMPLOS) {
      const foto = dataUrl(e.foto);
      const existe = await pool.query(
        'SELECT id FROM estudiante WHERE institucion_id=$1 AND documento_numero=$2',
        [instId, e.doc]
      );
      if (existe.rowCount) {
        await pool.query(
          `UPDATE estudiante
             SET nombres=$1, grado=$2, fecha_nacimiento=$3, foto=$4,
                 identificacion = identificacion || jsonb_build_object('sexo',$5::text)
           WHERE id=$6`,
          [e.nombre, e.grado, e.nac, foto, e.sexo, existe.rows[0].id]
        );
      } else {
        await pool.query(
          `INSERT INTO estudiante (institucion_id, documento_tipo, documento_numero, nombres, fecha_nacimiento, grado, foto, identificacion)
           VALUES ($1,'TI',$2,$3,$4,$5,$6, jsonb_build_object('sexo',$7::text,'sede','Sede A','jornada','Mañana'))`,
          [instId, e.doc, e.nombre, e.nac, e.grado, foto, e.sexo]
        );
      }
    }

    // Seguridad: quita cualquier nombre personal usado en pruebas que no sea de los ejemplos.
    await pool.query(
      `UPDATE estudiante SET nombres='Estudiante de ejemplo'
         WHERE nombres ILIKE '%suarez acevedo%' OR nombres ILIKE '%suárez acevedo%'`
    );

    await pool.query("INSERT INTO _seed_marca (clave) VALUES ('fotos_ejemplo_v1') ON CONFLICT DO NOTHING");
    console.log('Estudiantes de ejemplo con fotos: aplicado.');
  } catch (e) {
    console.error('No se pudo sembrar los estudiantes de ejemplo:', e.message);
  }
}
