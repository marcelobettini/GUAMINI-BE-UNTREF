// Módulo de conexión a MongoDB usando el driver Mongoose
// Implementa un Singleton -> una única instancia de MongoClient es compartida por toda la app
import mongoose from "mongoose";
import { MongoMemoryServer } from 'mongodb-memory-server';
const DB_NAME = process.env.DB_NAME;

// Referencia al proceso mongod en memoria, para poder detenerlo con disconnectDB()
let mongod;


// Crear el cliente, abrir la conexión con la DB. Como es un Singleton debemos llamarla una sola vez al arrancar el servidor, antes del app.listen().

export async function connectDB() {
    mongod = await MongoMemoryServer.create({ instance: { dbName: DB_NAME } });
    const uri = mongod.getUri();
    await mongoose.connect(uri, { dbName: DB_NAME });

    console.log(`Conectado a MongoDB en memoria - base de datos: ${DB_NAME}`);
};


export function getDB() {
    if (mongoose.connection.readyState !== 1) throw new Error("No hay conexión a la base de datos. Debes llamar a connectDB() antes de usar getDB().");
    return mongoose.connection.db;
}

// Cierra la conexión con la DB y detiene el proceso mongod en memoria. Útil para un shutdown limpio del servidor, o para tests unitarios que arrancan y detienen la DB en memoria varias veces.
export async function disconnectDB() {
    await mongoose.disconnect();
    if (mongod) {
        await mongod.stop();
        console.log(`Desconectado de MongoDB en memoria - base de datos: ${DB_NAME}`);
    }
}