import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Op, UniqueConstraintError } from 'sequelize';
import sequelize from '../config/database.js';
import { env } from '../config/env.js';
import { User, PendingRegistration } from '../models/index.js';
import { sendMail } from './mailer.js';
import { confirmationEmail, resendEmail, accountExistsEmail } from './emailTemplates.js';

// Un solo error para "inexistente", "vencido" o "ya usado": distinguirlos le
// regalaría información a quien prueba tokens al azar.
export class InvalidTokenError extends Error {
  constructor() {
    super('Token de confirmación inválido o vencido');
    this.name = 'InvalidTokenError';
  }
}

const normalizeEmail = (email) => email.trim().toLowerCase();

// SHA-256 (y no bcrypt) para el token: ya es aleatorio de 256 bits, no hay nada
// que "adivinar" por fuerza bruta, y necesitamos poder buscarlo por igualdad.
export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

function generateToken() {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, tokenHash: hashToken(token) };
}

const buildConfirmUrl = (token) => `${env.APP_BASE_URL}/api/auth/confirm?token=${token}`;
const expiryDate = () => new Date(Date.now() + env.TOKEN_TTL_HOURS * 3600 * 1000);

// Limpieza oportunista: evitamos un cron/job aparte (YAGNI). Se ejecuta en cada
// registro, que es justo cuando se acumulan las pendientes.
const purgeExpired = () => PendingRegistration.destroy({ where: { expiresAt: { [Op.lt]: new Date() } } });

export async function register({ email, password }) {
  email = normalizeEmail(email);
  await purgeExpired();

  // Email con cuenta real: no se modifica nada y se avisa al dueño. El controller
  // responde igual que en un registro nuevo (anti-enumeración).
  if (await User.findOne({ where: { email } })) {
    await sendMail({ to: email, ...accountExistsEmail() });
    return;
  }

  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
  const { token, tokenHash } = generateToken();

  // upsert (INSERT ... ON DUPLICATE KEY UPDATE): atómico, así dos registros
  // simultáneos del mismo email no chocan contra la restricción única.
  // Si ya había una pendiente, se reemplaza: el token anterior deja de valer.
  await PendingRegistration.upsert({ email, passwordHash, tokenHash, expiresAt: expiryDate() });

  // Si el envío falla, la pendiente se conserva: el usuario puede pedir un reenvío.
  await sendMail({ to: email, ...confirmationEmail({ confirmUrl: buildConfirmUrl(token) }) });
}

export async function resendConfirmation({ email }) {
  email = normalizeEmail(email);
  const pending = await PendingRegistration.findOne({ where: { email } });
  if (!pending) return; // el controller responde igual: no revelamos si existe

  const { token, tokenHash } = generateToken();
  await pending.update({ tokenHash, expiresAt: expiryDate() });
  await sendMail({ to: email, ...resendEmail({ confirmUrl: buildConfirmUrl(token) }) });
}

export async function confirm(token) {
  const tokenHash = hashToken(token);
  try {
    return await sequelize.transaction(async (t) => {
      // lock UPDATE: si llegan dos clics a la vez, el segundo espera a que el
      // primero termine, ya no encuentra la fila y cae en InvalidTokenError.
      const pending = await PendingRegistration.findOne({
        where: { tokenHash, expiresAt: { [Op.gt]: new Date() } },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!pending) throw new InvalidTokenError();

      // La cuenta "real" nace recién acá, con el hash ya calculado al registrar.
      const user = await User.create(
        { email: pending.email, passwordHash: pending.passwordHash, confirmedAt: new Date() },
        { transaction: t },
      );
      await pending.destroy({ transaction: t });
      return { id: user.id, email: user.email };
    });
  } catch (err) {
    // Red de seguridad: si el email ya existiera en users (carrera extrema),
    // la restricción única lo detiene y lo tratamos como enlace inválido.
    if (err instanceof UniqueConstraintError) throw new InvalidTokenError();
    throw err;
  }
}
