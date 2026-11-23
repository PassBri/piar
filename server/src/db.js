import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err.message);
});

/** Ejecuta una consulta parametrizada y devuelve las filas. */
export async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}
