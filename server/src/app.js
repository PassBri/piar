import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';

const aqui = path.dirname(fileURLToPath(import.meta.url));

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
import cursosRoutes from './routes/cursos.js';
import auditoriaRoutes from './routes/auditoria.js';
import anexo4Routes from './routes/anexo4.js';

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
  app.use('/api/cursos', cursosRoutes);
  app.use('/api/auditoria', auditoriaRoutes);
  app.use('/api/anexo4', anexo4Routes);

  // En producción, el mismo servicio entrega el frontend compilado (SPA).
  if (process.env.NODE_ENV === 'production') {
    const dist = path.resolve(aqui, '../../client/dist');
    app.use(express.static(dist));
    // Cualquier ruta que no sea /api devuelve el index.html del SPA
    app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  // 404 (rutas /api no encontradas)
  app.use((req, res) => res.status(404).json({ error: 'Recurso no encontrado.' }));

  // Manejo de errores
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor.' });
  });

  return app;
}
