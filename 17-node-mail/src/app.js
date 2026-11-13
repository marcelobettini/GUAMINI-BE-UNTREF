import express from 'express';
import helmet from 'helmet';
import { createLimiter } from './middlewares/rateLimit.js';
import errorHandler from './middlewares/errorHandler.js';
import authRoutes from './routes/auth.routes.js';

// createApp NO llama a listen(): así supertest puede levantar la app sin puerto.
// `options.rateLimit` permite a los tests usar un límite pequeño.
export function createApp({ rateLimit = {} } = {}) {
  const app = express();
  app.use(helmet());
  app.use(express.json({ limit: '10kb' })); // los cuerpos de esta API son diminutos
  // Rate limit sólo donde se envían emails; un único contador para ambas rutas.
  app.use(['/api/auth/register', '/api/auth/resend-confirmation'], createLimiter(rateLimit));
  app.use('/api/auth', authRoutes);
  app.use((req, res) => res.status(404).json({ error: 'No encontrado' }));
  app.use(errorHandler); // siempre al final
  return app;
}
