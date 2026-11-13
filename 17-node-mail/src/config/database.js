import { Sequelize } from 'sequelize';
import { env } from './env.js';

// logging:false para no inundar la consola; usar `console.log` al depurar SQL.
const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASS, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: 'mysql',
  logging: false,
});

export default sequelize;
