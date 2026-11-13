import express from 'express';
import { z } from 'zod';
import validate from '../middlewares/validate.js';
import * as controller from '../controllers/auth.controller.js';

// trim + toLowerCase ANTES de validar el formato (por eso z.string() primero y
// z.email() en el pipe). El servicio vuelve a normalizar: la validación da el 400
// temprano, el servicio garantiza la normalización aunque lo llamen desde otro lado.
const email = z.string().trim().toLowerCase().pipe(z.email().max(255));

const registerSchema = z.object({
  email,
  // 72: bcrypt ignora todo lo que pase de 72 bytes; rechazamos en vez de truncar en silencio.
  password: z.string().min(8).max(72),
});
const resendSchema = z.object({ email });
// El token son 32 bytes en hex = 64 caracteres: rechazar otro formato evita ir a la base.
const confirmSchema = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) });

const router = express.Router();

// El rate limit de register y resend-confirmation se aplica en app.js (antes de
// llegar acá): son las rutas que envían emails.
router.post('/register', validate(registerSchema), controller.register);
router.post('/resend-confirmation', validate(resendSchema), controller.resendConfirmation);
router.get('/confirm', validate(confirmSchema, 'query'), controller.confirm);

export default router;
