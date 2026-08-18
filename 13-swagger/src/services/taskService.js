import Task from "../models/task.js";


export async function getAll({ completed, search } = {}) {
    const query = {};
    if (completed !== undefined) query.completed = completed;
    if (search) {
        //Escapamos caracteres especiales de regex para que la búsqueda sea literal, cubre casos como "C++" o "Node.js" que tienen caracteres especiales de regex. La búsqueda es case-insensitive.
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(escaped, "i");
        query.$or = [{ title: re }, { description: re }];
    }
    return Task.find(query);
}

export async function getById(id) {
    return Task.findById(id);
}

export async function add(fields) {
    return Task.create(fields);
}

export async function update(id, fields) {
    return Task.findByIdAndUpdate(id, { $set: fields }, { returnDocument: "after" });
}

export async function remove(id) {
    const deleted = await Task.findByIdAndDelete(id);
    return deleted !== null;
}

/*
Usamos un pipeline de actualización con $set y $not para invertir el valor de completed. Esto permite que la operación sea atómica y evita condiciones de carrera si múltiples clientes intentan alternar el mismo documento al mismo tiempo.
Atómico significa que la operación se realiza como una sola unidad indivisible: no puede ser interrumpida por otras operaciones y garantiza consistencia de datos. En este caso, el uso de un pipeline con $set y $not asegura que el valor de completed se invierta correctamente incluso si hay múltiples solicitudes concurrentes para alternar el mismo documento.
Esto también se puede resolver con una Transacción de MongoDB, pero para una sola operación de actualización como esta, el pipeline es más simple y eficiente.
ACID es un conjunto de propiedades que garantizan que las transacciones de bases de datos se procesen de manera confiable:
ACID:
1. Atomicidad
2. Consistencia
3. Aislamiento
4. Durabilidad
*/

export async function toggle(id) {
    return Task.findByIdAndUpdate(id, [{ $set: { completed: { $not: ["$completed"] } } }], { returnDocument: "after" });
}
