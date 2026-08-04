export const HTTP_STATUS = {
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
};

export function createError(status, message) {
    const err = new Error(message);
    err.status = status;
    return err;
}

export function notFoundHandler(req, res, next) {
    next(createError(HTTP_STATUS.NOT_FOUND, `Ruta no encontrada ${req.method} - ${req.originalUrl}`));
}

export function errorHandler(err, req, res, next) {
    console.log("Middleware de errores");
    // caso de uso: formato de _id inválido CastError
    if (err.name === "CastError") {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: err.message });
    }

    // caso de uso: error de validación de Mongoose ValidationError
    if (err.name === "ValidationError") {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: err.message });
    }

    const status = err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;

    return res.status(status).json({ message: err.message || "Error interno del servidor" });
}