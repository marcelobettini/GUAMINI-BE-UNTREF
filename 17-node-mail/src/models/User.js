import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

// Sólo cuentas REALES (ya confirmadas). Los registros sin confirmar viven en
// PendingRegistration: así ninguna consulta futura (login, listados) puede
// "ver" por error una cuenta que nadie confirmó.
// El email se guarda siempre normalizado (minúsculas, sin espacios): lo hace el
// servicio de registro, que es el único que crea usuarios.
// El esquema real se crea con db/schema.sql; estas definiciones deben coincidir
// con él (los tests recrean las tablas desde acá con sync).
const User = sequelize.define('User', {
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING(255), allowNull: false },
  confirmedAt: { type: DataTypes.DATE, allowNull: false },
}, { tableName: 'users' });

export default User;
