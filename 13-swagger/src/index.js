// Entry point: Configuramos Express y arrancamos el server
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import openapiSpec from './docs/openapi.js';
import tasksRouter from './routes/tasks.js';
import healthRouter from "./routes/health.js";
import { connectDB, disconnectDB } from './db/mongoClient.js';
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from './middlewares/errorHandler.js';
const app = express();
const PORT = process.env.PORT || 3001;
app.disable("x-powered-by");


// Parsear el body de las request como JSON
app.use(express.json());


const API_PREFIX = '/api';

// Montamos el router de auth bajo el prefijo /api/auth
app.use(`${API_PREFIX}/auth`, (req, res) => { });
// Montamos el router de tareas bajo el prefijo /api/v1/tasks
app.use(`${API_PREFIX}/tasks`, tasksRouter);

app.use(`${API_PREFIX}/docs`, swaggerUi.serve, swaggerUi.setup(openapiSpec));




app.use("/health", healthRouter);


// 404 para rutas no definidas, trabaja en conjunto con el error handler global
app.use(notFound);

// Manejador de errores centralizado (si le paso 4 params Express lo reconoce como
// error handler). Atrapa tanto los AppError que tiran las rutas como cualquier otra
// excepción/rejection: malformed JSON de express.json() (trae status: 400), CastError/
// ValidationError de Mongoose, o lo que sea inesperado (cae a 500).
app.use(errorHandler);

async function main() {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`http://localhost:${PORT}`);
    });
}

async function shutdown() {
    await disconnectDB();
    console.log("\n\n Cerrando Base de datos...\n\n");
    process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main().catch(err => {
    console.log('Error al iniciar el servidor:', err);
    process.exit(1);
});
