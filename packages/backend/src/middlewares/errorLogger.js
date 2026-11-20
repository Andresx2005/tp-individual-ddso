// Loguea sólo lo inesperado (5xx) con stack; los errores de negocio (4xx) se loguean en una línea.
export function errorLogger(err, req, res, next) {
    const esInesperado = !err.isOperational && !err.statusCode && !err.type
    if (esInesperado) {
        console.error({
            timestamp: new Date().toISOString(),
            method: req.method,
            path: req.originalUrl,
            error: { name: err.name, message: err.message, stack: err.stack }
        })
    } else if (process.env.NODE_ENV !== "test") {
        console.warn(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${err.statusCode ?? 400} ${err.message}`)
    }
    next(err)
}
