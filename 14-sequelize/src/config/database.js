import { Sequelize } from 'sequelize';
process.loadEnvFile();
const database = process.env.DB;
const dbUser = process.env.DB_USER;
const password = process.env.DB_PASS;
const host = process.env.DB_HOST;

export const sequelize = new Sequelize(database, dbUser, password, {
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


export async function connect() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}
