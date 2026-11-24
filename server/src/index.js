import { createApp } from './app.js';
import { config } from './config.js';
import { pool } from './db.js';
import { ensureSchema, migrar } from './db/init.js';

const app = createApp();

// Inicializa la base en el primer arranque (no borra datos si ya existe).
try {
  await ensureSchema();
  await migrar();
} catch (e) {
  console.error('No se pudo inicializar la base de datos:', e.message);
}

app.listen(config.port, () => {
  console.log(`PIAR API escuchando en el puerto ${config.port}`);
});

// Cierre ordenado
process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});
