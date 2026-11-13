import { User, PendingRegistration } from '../src/models/index.js';
import { setupDb, teardownDb, resetDb } from './helpers.js';

beforeAll(setupDb);
afterAll(teardownDb);
beforeEach(resetDb);

test('User exige email único', async () => {
  await User.create({ email: 'a@x.com', passwordHash: 'h', confirmedAt: new Date() });
  await expect(
    User.create({ email: 'a@x.com', passwordHash: 'h', confirmedAt: new Date() }),
  ).rejects.toMatchObject({ name: 'SequelizeUniqueConstraintError' });
});

test('PendingRegistration exige email único y guarda el hash del token', async () => {
  const datos = { email: 'a@x.com', passwordHash: 'h', tokenHash: 't1', expiresAt: new Date() };
  await PendingRegistration.create(datos);
  await expect(PendingRegistration.create({ ...datos, tokenHash: 't2' })).rejects.toMatchObject({ name: 'SequelizeUniqueConstraintError' });
});
