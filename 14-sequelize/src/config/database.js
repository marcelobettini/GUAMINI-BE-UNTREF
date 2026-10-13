import { Sequelize } from 'sequelize';
process.loadEnvFile();
const database = process.env.DATABASE;
const dbUser = process.env.DB_USER;
const password = process.env.PASSWORD;
const host = process.env.HOST;

const sequelize = new Sequelize(database, dbUser, password, {
    host,
    dialect: 'mysql',
    logging: false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

export default sequelize;