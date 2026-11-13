import * as registration from '../services/registration.js';

// Mismo mensaje exista o no el email: no revelamos qué correos están registrados.
const GENERIC = { message: 'Si los datos son válidos, te enviamos un email con las instrucciones' };

// Controllers finos: toman datos ya validados, delegan en el servicio y responden.
// Express 5 propaga solo los errores de funciones async al errorHandler.
export const register = async (req, res) => {
  await registration.register(req.validated.body);
  res.status(202).json(GENERIC);
};

export const resendConfirmation = async (req, res) => {
  await registration.resendConfirmation(req.validated.body);
  res.status(202).json(GENERIC);
};

export const confirm = async (req, res) => {
  const user = await registration.confirm(req.validated.query.token);
  res.status(201).json({ message: 'Cuenta confirmada', user });
};
