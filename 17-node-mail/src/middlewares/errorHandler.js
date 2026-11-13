import { EmailDeliveryError } from '../services/mailer.js';
import { InvalidTokenError } from '../services/registration.js';

// Punto único donde los errores se convierten en respuestas HTTP. Los detalles
// internos (stack, mensajes de SMTP/SQL) se loguean pero nunca se devuelven.
// Express reconoce un manejador de errores por sus 4 parámetros: `next` debe estar.
// eslint-disable-next-line no-unused-vars
export default (err, req, res, next) => {
  if (err instanceof InvalidTokenError) {
    return res.status(400).json({ error: 'El enlace de confirmación es inválido o venció' });
  }
  if (err instanceof EmailDeliveryError) {
    console.error('[mail] fallo de envío:', err.cause);
    return res.status(502).json({
      error: 'No pudimos enviar el email. Pedí el reenvío de la confirmación en unos minutos',
    });
  }
  // Errores del cliente generados por Express/body-parser (p. ej. JSON malformado).
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ error: 'Solicitud inválida' });
  }
  console.error('[error]', err);
  res.status(500).json({ error: 'Error interno' });
};
