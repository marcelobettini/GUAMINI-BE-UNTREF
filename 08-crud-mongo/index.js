import express from 'express';
import healthRouter from './src/routes/health.js';
import tasksRouter from './src/routes/tasks.js';
import { connectDB } from './src/db/mongoClient.js';
const PORT = process.env.PORT || 3000;
const API_PREFIX = "/api";
const server = express();

/* cuando empezamos a enviar requests con un body en formato JSON (ej: POST, PUT, PATCH) necesitamos habilitar el middleware de Express llamado json() para poder acceder a esos datos en dicho formato. */
server.use(express.json());

// health check
server.use("/health", healthRouter);

server.use(`${API_PREFIX}/tasks`, tasksRouter);



// 404 Not Found
server.use((req, res, next) => {
    const error = new Error(`Not Found: ${req.method} ${req.originalUrl}`);
    error.status = 404;
    next(error);
});

// Global Error Handler
server.use((err, req, res, next) => {
    const status = err.status || 500;
    res.status(status).json({ status, error: err.message || 'Internal Server Error' });
});

async function main() {
    await connectDB();
    server.listen(PORT, () => {
        console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
}

main().catch((err) => {
    console.error('Error al iniciar la aplicación:', err);
    process.exit(1);
});