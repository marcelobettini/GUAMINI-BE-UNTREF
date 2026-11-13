// Node sabe leer archivos .env por sí solo (process.loadEnvFile): no hace falta dotenv.
// Carga las variables del archivo .env en process.env. Si el archivo no existe
// (p. ej. en producción, donde las variables las define la plataforma) seguimos
// con las que ya tenga el sistema. Las variables ya definidas NO se pisan.
// En los tests no se usa: `npm test` carga .env.test con `node --env-file`.
try {
  process.loadEnvFile();
} catch (err) {
  if (err.code !== 'ENOENT') throw err;
}

const e = process.env;

// Todas las variables de entorno llegan como texto: acá las convertimos a su tipo
// real y damos valores por defecto cómodos para desarrollo local.
// (Para no distraer del tema del curso, no validamos el .env.)
export const env = {
  PORT: Number(e.PORT ?? 3000),

  DB_HOST: e.DB_HOST ?? 'localhost',
  DB_PORT: Number(e.DB_PORT ?? 3306),
  DB_NAME: e.DB_NAME ?? 'node_email',
  DB_USER: e.DB_USER ?? 'root',
  DB_PASS: e.DB_PASS ?? '',

  SMTP_HOST: e.SMTP_HOST ?? 'localhost',
  SMTP_PORT: Number(e.SMTP_PORT ?? 1025),
  SMTP_SECURE: e.SMTP_SECURE === 'true',
  SMTP_USER: e.SMTP_USER,
  SMTP_PASS: e.SMTP_PASS,
  MAIL_FROM: e.MAIL_FROM ?? 'Mi App <no-reply@miapp.local>',

  // Sin barra final: así `${APP_BASE_URL}/api/...` nunca produce "//api".
  APP_BASE_URL: (e.APP_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, ''),

  TOKEN_TTL_HOURS: Number(e.TOKEN_TTL_HOURS ?? 24),
  BCRYPT_ROUNDS: Number(e.BCRYPT_ROUNDS ?? 12),
  RATE_LIMIT_MAX: Number(e.RATE_LIMIT_MAX ?? 10),
  RATE_LIMIT_WINDOW_MIN: Number(e.RATE_LIMIT_WINDOW_MIN ?? 15),
};
