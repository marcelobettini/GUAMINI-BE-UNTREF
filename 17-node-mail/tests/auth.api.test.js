import request from 'supertest';
import { User, PendingRegistration } from '../src/models/index.js';
import { createApp } from '../src/app.js';
import {
  setupDb, teardownDb, resetDb, installFakeTransport, extractToken,
} from './helpers.js';

const app = createApp();
let sendMail;

beforeAll(setupDb);
afterAll(teardownDb);
beforeEach(async () => {
  await resetDb();
  sendMail = installFakeTransport();
});

const registrar = (body) => request(app).post('/api/auth/register').send(body);
const valido = { email: 'ana@mail.com', password: 'secreto123' };

describe('POST /api/auth/register', () => {
  test('202 y envía el email', async () => {
    const res = await registrar(valido);
    expect(res.status).toBe(202);
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(await PendingRegistration.count()).toBe(1);
  });

  test('normaliza el email también vía HTTP (espacios y mayúsculas)', async () => {
    const res = await registrar({ email: '  Ana@Mail.COM ', password: 'secreto123' });
    expect(res.status).toBe(202);
    expect(sendMail.mock.calls[0][0].to).toBe('ana@mail.com');
  });

  test('responde igual para un email nuevo y uno ya registrado (anti-enumeración)', async () => {
    const nuevo = await registrar(valido);
    await request(app).get(`/api/auth/confirm?token=${extractToken(sendMail.mock.calls[0][0])}`);
    const existente = await registrar(valido);
    expect(existente.status).toBe(nuevo.status);
    expect(existente.body).toEqual(nuevo.body);
  });

  test.each([
    ['email inválido', { email: 'no-es-email', password: 'secreto123' }],
    ['contraseña corta', { email: 'a@x.com', password: '123' }],
    ['contraseña de más de 72 caracteres (límite de bcrypt)', { email: 'a@x.com', password: 'a'.repeat(73) }],
    ['sin cuerpo', undefined],
  ])('400 con %s', async (_nombre, body) => {
    const res = await registrar(body);
    expect(res.status).toBe(400);
    expect(sendMail).not.toHaveBeenCalled();
  });

  test('400 (no 500) con JSON malformado', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{"email": "a@x.com", ');
    expect(res.status).toBe(400);
  });

  test('502 si falla el envío, y la pendiente queda guardada', async () => {
    installFakeTransport({ fail: true });
    const res = await registrar(valido);
    expect(res.status).toBe(502);
    expect(await PendingRegistration.count()).toBe(1);
  });
});

describe('GET /api/auth/confirm', () => {
  const tokenDelUltimoEmail = () => extractToken(sendMail.mock.calls.at(-1)[0]);

  test('201 y la cuenta real se crea recién ahora', async () => {
    await registrar(valido);
    expect(await User.count()).toBe(0);

    const res = await request(app).get(`/api/auth/confirm?token=${tokenDelUltimoEmail()}`);
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('ana@mail.com');
    expect(res.body.user.passwordHash).toBeUndefined(); // nunca exponer el hash
    expect(await User.count()).toBe(1);
  });

  test('400 con token mal formado, desconocido o ya usado (mismo mensaje)', async () => {
    await registrar(valido);
    const token = tokenDelUltimoEmail();
    await request(app).get(`/api/auth/confirm?token=${token}`);

    const reutilizado = await request(app).get(`/api/auth/confirm?token=${token}`);
    const desconocido = await request(app).get(`/api/auth/confirm?token=${'b'.repeat(64)}`);
    const malFormado = await request(app).get('/api/auth/confirm?token=xyz');
    const ausente = await request(app).get('/api/auth/confirm');

    expect(reutilizado.status).toBe(400);
    expect(desconocido.status).toBe(400);
    expect(reutilizado.body).toEqual(desconocido.body);
    expect(malFormado.status).toBe(400);
    expect(ausente.status).toBe(400);
  });
});

describe('POST /api/auth/resend-confirmation', () => {
  test('202 y reenvía si hay pendiente', async () => {
    await registrar(valido);
    const res = await request(app).post('/api/auth/resend-confirmation').send({ email: valido.email });
    expect(res.status).toBe(202);
    expect(sendMail).toHaveBeenCalledTimes(2);
  });

  test('202 idéntico si el email no existe, y no envía nada', async () => {
    const existente = await registrar(valido);
    sendMail.mockClear();
    const res = await request(app).post('/api/auth/resend-confirmation').send({ email: 'nadie@mail.com' });
    expect(res.status).toBe(202);
    expect(res.body).toEqual(existente.body);
    expect(sendMail).not.toHaveBeenCalled();
  });

  test('400 con email inválido', async () => {
    const res = await request(app).post('/api/auth/resend-confirmation').send({ email: 'x' });
    expect(res.status).toBe(400);
  });
});

describe('rate limit y rutas inexistentes', () => {
  test('429 al superar el límite en register', async () => {
    const limitada = createApp({ rateLimit: { limit: 2 } });
    const enviar = () => request(limitada).post('/api/auth/register').send(valido);
    expect((await enviar()).status).toBe(202);
    expect((await enviar()).status).toBe(202);
    expect((await enviar()).status).toBe(429);
  });

  test('404 JSON en rutas desconocidas', async () => {
    const res = await request(app).get('/nada');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});
