import bcrypt from 'bcryptjs';
import { User, PendingRegistration } from '../src/models/index.js';
import {
  register, resendConfirmation, confirm, InvalidTokenError, hashToken,
} from '../src/services/registration.js';
import { EmailDeliveryError } from '../src/services/mailer.js';
import {
  setupDb, teardownDb, resetDb, installFakeTransport, extractToken,
} from './helpers.js';

let sendMail;

beforeAll(setupDb);
afterAll(teardownDb);
beforeEach(async () => {
  await resetDb();
  sendMail = installFakeTransport();
});

const caducar = (email) =>
  PendingRegistration.update({ expiresAt: new Date(Date.now() - 1000) }, { where: { email } });

describe('register', () => {
  test('crea una pendiente (no un User) y envía el email de confirmación', async () => {
    await register({ email: 'ana@mail.com', password: 'secreto123' });

    expect(await User.count()).toBe(0);
    const pendiente = await PendingRegistration.findOne({ where: { email: 'ana@mail.com' } });
    expect(pendiente.passwordHash).not.toBe('secreto123');
    expect(await bcrypt.compare('secreto123', pendiente.passwordHash)).toBe(true);

    expect(sendMail).toHaveBeenCalledTimes(1);
    const mail = sendMail.mock.calls[0][0];
    expect(mail.to).toBe('ana@mail.com');
    const token = extractToken(mail);
    expect(pendiente.tokenHash).toBe(hashToken(token));
    expect(pendiente.tokenHash).not.toBe(token); // en la base nunca el token en claro
    expect(mail.text).toContain('http://localhost:3000/api/auth/confirm?token='); // sin // doble
    expect(pendiente.expiresAt.getTime()).toBeGreaterThan(Date.now() + 23 * 3600 * 1000);
  });

  test('normaliza el email (mayúsculas y espacios)', async () => {
    await register({ email: '  Ana@Mail.COM ', password: 'secreto123' });
    expect(await PendingRegistration.count({ where: { email: 'ana@mail.com' } })).toBe(1);
    expect(sendMail.mock.calls[0][0].to).toBe('ana@mail.com');
  });

  test('re-registrar un email pendiente reemplaza datos y token (queda una sola fila)', async () => {
    await register({ email: 'ana@mail.com', password: 'primera123' });
    await register({ email: 'ANA@mail.com', password: 'segunda123' });

    expect(await PendingRegistration.count()).toBe(1);
    const [primero, segundo] = sendMail.mock.calls.map((c) => c[0]);
    await expect(confirm(extractToken(primero))).rejects.toBeInstanceOf(InvalidTokenError);
    await confirm(extractToken(segundo));
    const user = await User.findOne({ where: { email: 'ana@mail.com' } });
    expect(await bcrypt.compare('segunda123', user.passwordHash)).toBe(true);
  });

  test('si el email ya tiene cuenta activa: no toca nada y avisa al dueño', async () => {
    const original = await User.create({ email: 'ana@mail.com', passwordHash: 'hash-original', confirmedAt: new Date() });
    await register({ email: 'ana@mail.com', password: 'otra12345' });

    expect(await PendingRegistration.count()).toBe(0);
    expect((await User.findByPk(original.id)).passwordHash).toBe('hash-original');
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail.mock.calls[0][0].subject).toMatch(/intento de registro/i);
    expect(sendMail.mock.calls[0][0].text).not.toContain('token=');
  });

  test('borra de forma oportunista las pendientes vencidas', async () => {
    await register({ email: 'vieja@mail.com', password: 'secreto123' });
    await caducar('vieja@mail.com');
    await register({ email: 'nueva@mail.com', password: 'secreto123' });
    expect(await PendingRegistration.count({ where: { email: 'vieja@mail.com' } })).toBe(0);
  });

  test('si el SMTP falla lanza EmailDeliveryError pero la pendiente queda guardada', async () => {
    sendMail = installFakeTransport({ fail: true });
    await expect(register({ email: 'ana@mail.com', password: 'secreto123' }))
      .rejects.toBeInstanceOf(EmailDeliveryError);
    expect(await PendingRegistration.count()).toBe(1);

    // ...y se puede recuperar con el reenvío cuando el SMTP vuelve.
    sendMail = installFakeTransport();
    await resendConfirmation({ email: 'ana@mail.com' });
    expect(sendMail).toHaveBeenCalledTimes(1);
  });
});

describe('confirm', () => {
  async function registrarYObtenerToken(email = 'ana@mail.com') {
    await register({ email, password: 'secreto123' });
    return extractToken(sendMail.mock.calls.at(-1)[0]);
  }

  test('crea el User con el mismo hash y borra la pendiente', async () => {
    const token = await registrarYObtenerToken();
    const pendiente = await PendingRegistration.findOne({ where: { email: 'ana@mail.com' } });

    const resultado = await confirm(token);

    expect(resultado).toEqual({ id: expect.any(Number), email: 'ana@mail.com' });
    const user = await User.findOne({ where: { email: 'ana@mail.com' } });
    expect(user.passwordHash).toBe(pendiente.passwordHash);
    expect(user.confirmedAt).toBeInstanceOf(Date);
    expect(await PendingRegistration.count()).toBe(0);
  });

  test('token vencido -> InvalidTokenError y no se crea cuenta', async () => {
    const token = await registrarYObtenerToken();
    await caducar('ana@mail.com');
    await expect(confirm(token)).rejects.toBeInstanceOf(InvalidTokenError);
    expect(await User.count()).toBe(0);
  });

  test('token ya usado -> InvalidTokenError', async () => {
    const token = await registrarYObtenerToken();
    await confirm(token);
    await expect(confirm(token)).rejects.toBeInstanceOf(InvalidTokenError);
  });

  test('token desconocido -> InvalidTokenError', async () => {
    await expect(confirm('a'.repeat(64))).rejects.toBeInstanceOf(InvalidTokenError);
  });

  test('dos clics simultáneos: uno confirma y el otro falla limpio (una sola cuenta)', async () => {
    const token = await registrarYObtenerToken();
    const resultados = await Promise.allSettled([confirm(token), confirm(token)]);

    expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rechazado = resultados.find((r) => r.status === 'rejected');
    expect(rechazado.reason).toBeInstanceOf(InvalidTokenError);
    expect(await User.count()).toBe(1);
  });
});

describe('resendConfirmation', () => {
  test('genera un token nuevo e invalida el anterior', async () => {
    await register({ email: 'ana@mail.com', password: 'secreto123' });
    await resendConfirmation({ email: ' ANA@mail.com' });

    expect(sendMail).toHaveBeenCalledTimes(2);
    const [primero, segundo] = sendMail.mock.calls.map((c) => c[0]);
    expect(segundo.subject).toMatch(/nuevo enlace/i);
    await expect(confirm(extractToken(primero))).rejects.toBeInstanceOf(InvalidTokenError);
    await expect(confirm(extractToken(segundo))).resolves.toMatchObject({ email: 'ana@mail.com' });
  });

  test('si no hay pendiente no envía nada y no falla', async () => {
    await expect(resendConfirmation({ email: 'nadie@mail.com' })).resolves.toBeUndefined();
    expect(sendMail).not.toHaveBeenCalled();
  });
});
