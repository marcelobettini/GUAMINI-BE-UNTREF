import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';

// Protege register/resend: cada llamada dispara un email, así que sin límite
// alguien podría usar la API para llenar de correos la casilla de un tercero.
// Memoria local por proceso; con varias instancias haría falta un store compartido (Redis).
export function createLimiter({ windowMs, limit } = {}) {
  return rateLimit({
    windowMs: windowMs ?? env.RATE_LIMIT_WINDOW_MIN * 60 * 1000,
    limit: limit ?? env.RATE_LIMIT_MAX,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Demasiadas solicitudes, probá más tarde' },
  });
}
