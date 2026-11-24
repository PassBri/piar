// Inicialización automática de la base de datos.
// En el primer arranque (base vacía) crea el esquema y carga los datos base.
// Si la base ya tiene tablas, no hace nada (no borra información existente).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../db.js';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const DIR_SQL = path.resolve(aqui, '../../db'); // server/db

function leerSql(nombre) {
  return fs.readFileSync(path.join(DIR_SQL, nombre), 'utf8');
}

/** Crea el esquema y los datos base solo si la base está vacía. */
export async function ensureSchema() {
  const r = await pool.query("SELECT to_regclass('public.usuario') AS t");
  if (r.rows[0].t) {
    console.log('Base de datos ya inicializada.');
    return false;
  }
  console.log('Inicializando la base de datos por primera vez…');
  for (const archivo of ['schema.sql', 'seed.sql', 'simulacion.sql']) {
    await pool.query(leerSql(archivo));
    console.log(`  aplicado: ${archivo}`);
  }
  console.log('Base de datos lista.');
  return true;
}

// Permite ejecutarlo a mano con: npm run db:init
if (import.meta.url === `file://${process.argv[1]}`) {
  ensureSchema()
    .then(() => pool.end())
    .catch((e) => { console.error('Error al inicializar la base:', e.message); process.exit(1); });
}
