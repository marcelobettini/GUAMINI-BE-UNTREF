export function notFound(req, res) {
    res.status(404).json({ message: 'Resource not found' });
}

export function errorHandler(err, req, res, next) {
    console.error(err.stack);
    const status = err.status ?? 500;
    if (status >= 500) {
        console.error(err);

        res.status(status).json({ error: status >= 500 ? 'Internal Server Error' : err.message });
    }
}