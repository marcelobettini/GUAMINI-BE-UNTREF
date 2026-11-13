import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

// Error propio: el resto de la app no debe depender de los errores internos de
// Nodemailer. El errorHandler lo traduce a un 502.
export class EmailDeliveryError extends Error {
  constructor(cause) {
    super('No se pudo enviar el email');
    this.name = 'EmailDeliveryError';
    this.cause = cause;
  }
}

let transporter;

// El transporte se crea una sola vez y se reutiliza: Nodemailer mantiene la
// conexión SMTP, crear uno por email sería lento y desperdicia conexiones.
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE, // true sólo para el puerto 465; en 587/1025 se negocia STARTTLS si está disponible
      // Mailpit no usa autenticación: sin usuario no mandamos credenciales.
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

// Permite que los tests inyecten un transporte falso (jsonTransport o un mock).
export function setTransporter(t) {
  transporter = t;
}

// Se llama al arrancar: detecta host/puerto/credenciales mal configurados
// antes de recibir tráfico.
export async function verifyTransport() {
  await getTransporter().verify();
}

export async function sendMail({ to, subject, html, text }) {
  try {
    return await getTransporter().sendMail({ from: env.MAIL_FROM, to, subject, html, text });
  } catch (err) {
    throw new EmailDeliveryError(err);
  }
}
