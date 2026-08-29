import { AppError } from "../errors/AppErrors.js";
// Catch all route: 404 para rutas no definidas, trabaja en conjunto con el error handler global

export function notFound(req, res, next) {
    next(new AppError(`Not Found:  ${req.method} ${req.originalUrl}`, 404));
};