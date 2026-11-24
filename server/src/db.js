import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

// En producción con base remota (Render, Neon, Supabase…) la conexión va por SSL.
const enProduccion = process.env.NODE_ENV === 'production';
const esLocal = /localhost|127\.0\.0\.1/.test(config.databaseUrl);
export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: enProduccion && !esLocal ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err.message);
});

/** Ejecuta una consulta parametrizada y devuelve las filas. */
export async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}
