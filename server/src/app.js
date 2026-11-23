import express from 'express';
import cors from 'cors';
import { config } from './config.js';

import authRoutes from './routes/auth.js';
import estudiantesRoutes from './routes/estudiantes.js';
import piarRoutes from './routes/piar.js';
import ajustesRoutes from './routes/ajustes.js';
import seguimientoRoutes from './routes/seguimiento.js';
import actasRoutes from './routes/actas.js';
import catalogoRoutes from './routes/catalogo.js';
import areasRoutes from './routes/areas.js';
import usuariosRoutes from './routes/usuarios.js';
import informesRoutes from './routes/informes.js';
import geografiaRoutes from './routes/geografia.js';
import estadisticasRoutes from './routes/estadisticas.js';
import valoracionesRoutes from './routes/valoraciones.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.clientOrigin, credentials: true }));
  app.use(express.json({ limit: '2mb' }));

  // Salud del servicio
  app.get('/api/health', (req, res) => res.json({ ok: true, servicio: 'PIAR API' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/estudiantes', estudiantesRoutes);
  app.use('/api/piar', piarRoutes);
  app.use('/api/ajustes', ajustesRoutes);
  app.use('/api/seguimientos', seguimientoRoutes);
  app.use('/api/actas', actasRoutes);
  app.use('/api/catalogo', catalogoRoutes);
  app.use('/api/areas', areasRoutes);
  app.use('/api/usuarios', usuariosRoutes);
  app.use('/api/informes', informesRoutes);
  app.use('/api/geografia', geografiaRoutes);
  app.use('/api/estadisticas', estadisticasRoutes);
  app.use('/api/valoraciones', valoracionesRoutes);

  // 404
  app.use((req, res) => res.status(404).json({ error: 'Recurso no encontrado.' }));

  // Manejo de errores
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor.' });
  });

  return app;
}
