import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

// Registro en espera de confirmación. `email` es único: un nuevo registro con el
// mismo email REEMPLAZA al anterior (ver services/registration.js).
// Guardamos el SHA-256 del token, no el token: si alguien lee la base no puede
// armar links de confirmación válidos.
const PendingRegistration = sequelize.define('PendingRegistration', {
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING(255), allowNull: false },
  tokenHash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
}, { tableName: 'pending_registrations' });

export default PendingRegistration;
