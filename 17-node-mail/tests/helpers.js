import { jest } from '@jest/globals';
import sequelize from '../src/config/database.js';
import { setTransporter } from '../src/services/mailer.js';
import { User, PendingRegistration } from '../src/models/index.js';

// Barrera de seguridad: setupDb hace sync({ force: true }), que BORRA las tablas.
// Nunca debe ejecutarse contra la base de desarrollo.
export async function setupDb() {
  const nombre = sequelize.config.database;
  if (!nombre.endsWith('_test')) {
    throw new Error(`Los tests sólo corren contra una base *_test (actual: ${nombre})`);
  }
  await sequelize.sync({ force: true });
}

export const teardownDb = () => sequelize.close();

export async function resetDb() {
  await PendingRegistration.destroy({ where: {} });
  await User.destroy({ where: {} });
}

// Reemplaza el transporte SMTP por un mock: así los tests leen los emails
// "enviados" sin servidor SMTP. El código real de mailer.js sí se ejecuta.
export function installFakeTransport({ fail = false } = {}) {
  const sendMail = jest.fn(async () => {
    if (fail) throw new Error('SMTP caído');
    return { messageId: 'fake' };
  });
  setTransporter({ sendMail, verify: jest.fn() });
  return sendMail;
}

// El token viaja en el link del email; la base sólo guarda su hash.
export const extractToken = (mail) => /token=([a-f0-9]{64})/.exec(mail.text)[1];
