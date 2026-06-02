import express from 'express';
import healthRouter from './src/routes/health.js';
import tasksRouter from './src/routes/tasks.js';

const PORT = process.env.PORT || 3000;
const API_PREFIX = "/api/v1";
const server = express();

/* cuando empezamos a enviar requests con un body en formato JSON (ej: POST, PUT, PATCH) necesitamos habilitar el middleware de Express llamado json() para poder acceder a esos datos en dicho formato. */
server.use(express.json());

// index route - implementar una vista HTML con el motor de plantillas EJS con la documentación de la API

server.get("/", (req, res) => {

});

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

server.listen(PORT, (err) => {
    if (err) {
        console.error('Error al iniciar el servidor:', err);
        return;
    }
    console.log(`Servidor escuchando en el puerto http://localhost:${PORT}`);
});