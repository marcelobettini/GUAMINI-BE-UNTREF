// conexión a la base de datos
// Módulo de conexión a MongoDB Atlas.
// Implementa el patrón singleton: una sola instancia de MongoClient
// compartida por toda la aplicación.

import { MongoClient } from 'mongodb';

const DB_NAME = 'todoAPI';

// Referencia a la DB activa; se asigna en connectDB()
let db;

// Crea el cliente, abre la conexión y guarda la referencia a la DB.
// Debe llamarse una sola vez al arrancar el servidor, antes de app.listen().
// El guard if (db) evita reconexiones accidentales si se llama más de una vez. Por ejemplo, cuando el servidor se reinicia automáticamente en modo desarrollo, o si por error alguien llama connectDB() desde otro módulo. Es una medida de seguridad para garantizar que siempre haya una sola conexión activa y evitar fugas de conexiones.
export async function connectDB() {
    if (db) return;
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log(`Conectado a MongoDB Atlas — base de datos: ${DB_NAME}`);
}

// Devuelve la instancia de DB activa.
// Lanza si se llama antes de connectDB() — fallo rápido y explícito.
export function getDb() {
    if (!db) throw new Error('DB no inicializada. Llamá a connectDB() primero.');
    return db;
}

/*
Por qué no exportamos también una función disconnectDB() para cerrar la conexión al apagar el servidor?

La razón es arquitectónica y se basa en el ciclo de vida del proceso:

En un servidor HTTP la conexión debe vivir tanto como el proceso. connectDB() se llama una vez al arrancar, antes de app.listen(), y desde ese momento la conexión está disponible para todas las requests durante toda la vida del servidor. Desconectarse deliberadamente en medio de eso no tiene sentido — sería como apagar el motor mientras el auto está en ruta.

El gestor de conexiones de MongoDB ya maneja el pool internamente. MongoClient mantiene un connection pool (por defecto 5 conexiones concurrentes). El driver se encarga de abrir, reusar y cerrar conexiones individuales del pool según la carga. No es necesario administrar eso manualmente.
*/