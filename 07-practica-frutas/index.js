
import express from 'express';
import { connectDB } from "./src/db/mongoClient.js";
import { getAll } from './src/db/frutasStore.js';
const app = express();
const PORT = process.env.PORT || 3000;



const API_PREFIX = '/api';

// async / await

app.get(`${API_PREFIX}/frutas`, async (req, res) => {
    const allFruits = await getAll();
    res.json(allFruits);
});

//completar según consigna de la clase
app.get(`${API_PREFIX}/frutas/nombre/:nombre`, (req, res) => {
    const { nombre } = req.params;
    res.json({ message: "Devuelve las frutas que contienen el nombre:", nombre });
});

//completar según consigna de la clase
app.get(`${API_PREFIX}/frutas/precio/:precio`, (req, res) => {
    const { precio } = req.params;
    res.json({ message: "Devuelve todas las frutas dado el precio:", precio });
});




// 404 — rutas no definidas
app.use((req, res, next) => {
    const error = new Error('Route not found');
    error.status = 404;
    next(error); // delega al error handler global
});

// Error handler global
app.use((err, req, res, next) => {
    console.error(err.stack);

    const status = err.status || err.statusCode || 500;
    //Por qué usamos las props status o statusCode?
    //Es para garantizar compatibilidad con distintos tipos de errores: algunos frameworks o librerías (como http-errors) usan err.status, mientras que otros (como los errores nativos de Node) podrían usar err.statusCode. Al verificar ambos, nos aseguramos de capturar el código de estado correcto sin importar el origen del error. Es un seguro barato para mejorar la robustez de nuestro error handling. Programación Defensiva 101: anticipar variaciones en los objetos de error que podríamos recibir.
    //

    const message = status < 500 ? err.message : 'Internal server error';
    //                              ↑ no exponer detalles internos en errores 5xx

    res.status(status).json({ error: message });
});

// Conectar a MongoDB antes de abrir el puerto.
// Si la conexión falla no tiene sentido arrancar el servidor — process.exit(1)
// asegura un fallo rápido y visible en lugar de quedar en estado roto silencioso.
async function main() {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

main().catch((err) => {
    console.error('Error al iniciar el servidor:', err);
    process.exit(1);
});
