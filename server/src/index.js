import { createApp } from './app.js';
import { config } from './config.js';
import { pool } from './db.js';

const app = createApp();

app.listen(config.port, () => {
  console.log(`PIAR API escuchando en el puerto ${config.port}`);
});

// Cierre ordenado
process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});
