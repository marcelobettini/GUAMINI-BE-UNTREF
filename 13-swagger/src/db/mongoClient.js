// Módulo de conexión a MongoDB usando el driver oficial
// Implementa un Singleton -> una única instancia de MongoClient es compartida por toda la app
import { MongoClient } from "mongodb";
const DB_NAME = process.env.DB_NAME;
const MONGO_URI = process.env.MONGO_URI;
// Referencia a la DB activa, la vamos a asignar en connectDB()

let db;

// Crear el cliente, abrir la conexión con la DB. Como es un Singleton debemos llamarla una sola vez al arrancar el servidor, antes del app.listen().

export async function connectDB() {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log(`Conectado a MongoDB Atlas - base de datos: ${DB_NAME}`);
};

export function getDB() {
    if (!db) throw new Error("DB no inicializada. Debes correr connectDB() antes.");
    return db;
}