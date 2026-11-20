import { AppError } from "../errors/AppError.js"

const responder = (res, statusCode, status, message, extra = {}) =>
    res.status(statusCode).json({ status, message, timestamp: new Date().toISOString(), ...extra })

// ErrorHandler único de la aplicación: traduce cualquier error a una respuesta HTTP consistente.
// Los controllers nunca arman respuestas de error: dejan propagar el error hasta acá.
export function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err)
    }

    // Errores propios (dominio, services, validación): ya traen status code y mensaje.
    if (err instanceof AppError) {
        // Estándar HTTP: un 401 indica con qué esquema autenticarse.
        if (err.statusCode === 401) res.set("WWW-Authenticate", "Bearer")
        return responder(res, err.statusCode, err.status, err.message, err.details ? { details: err.details } : {})
    }

    // JSON mal formado en el body (lo lanza express.json())
    if (err.type === "entity.parse.failed") {
        return responder(res, 400, "fail", "El cuerpo de la request no es un JSON válido")
    }

    // Error no previsto: no se filtran detalles internos al cliente.
    return responder(res, 500, "error", "Error interno del servidor")
}
