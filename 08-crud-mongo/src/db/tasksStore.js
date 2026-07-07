// operaciones CRUD contra la base de datos
import { getDb } from "./mongoClient.js";
// Devuelve todas las tareas. 
export async function getAll() {

    return getDb().collection('tasks').find().toArray();
}


