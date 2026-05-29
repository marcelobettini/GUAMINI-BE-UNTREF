// Módulo de persistencia: maneja la lectura y escritura de tareas en un archivo JSON
// Mantiene una copia en memoria que se sincroniza con el archivo.

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE_PATH = join(__dirname, '../data/tasks.json');

let tasks = [];

// Cargar tareas desde el archivo al iniciar el servidor
function loadTasks() {
    try {
        const jsonData = readFileSync(FILE_PATH, 'utf-8');
        tasks = JSON.parse(jsonData);
    } catch (err) {
        if (err.code !== 'ENOENT') {
            const error = new Error("Error al cargar tareas: " + err.message);
            error.status = 500;
            return next(error);
        }
        // Si el archivo no existe, inicializamos con un array vacío
        save();
    }
}

function save() {
    writeFileSync(FILE_PATH, JSON.stringify(tasks, null, 2), 'utf-8');
}
function add(newTask) {
    tasks.push(newTask);
    save();
}

function getAllTasks() {
    return [...tasks];
}

function getById(id) {
    return tasks.find(task => task.id === id);
}
loadTasks();

export { getAllTasks, getById, add };