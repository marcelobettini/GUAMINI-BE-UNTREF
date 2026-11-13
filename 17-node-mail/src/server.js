import sequelize from './config/database.js';
import { env } from './config/env.js';
import { verifyTransport } from './services/mailer.js';
import { createApp } from './app.js';

try {
  await sequelize.authenticate(); // falla rápido si MySQL no responde
  // Las tablas las crea db/schema.sql. Este sync() sólo crea las que falten (nunca
  // modifica las existentes); para evolucionar el esquema en producción conviene
  // usar migraciones (siguiente paso documentado en TUTO.md).
  await sequelize.sync();
  await verifyTransport(); // falla rápido si el SMTP está mal configurado
  createApp().listen(env.PORT, () => console.log(`API escuchando en http://localhost:${env.PORT}`));
} catch (err) {
  console.error('No se pudo iniciar:', err.message);
  process.exit(1);
}
