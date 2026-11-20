// Errores HTTP "genéricos". El ErrorHandler (middlewares/errorHandler.js) los traduce a respuestas.
export class AppError extends Error {
    constructor(message, statusCode, details = undefined) {
        super(message)
        this.name = this.constructor.name
        this.statusCode = statusCode
        this.status = statusCode >= 500 ? "error" : "fail"
        this.details = details
        this.timestamp = new Date().toISOString()
        this.isOperational = true
    }
}

export class BadRequestError extends AppError {
    constructor(message, details) { super(message, 400, details) }
}

export class ValidationError extends AppError {
    constructor(message = "Datos de entrada inválidos", details) { super(message, 400, details) }
}

export class UnauthorizedError extends AppError {
    constructor(message = "No se pudo identificar al usuario") { super(message, 401) }
}

export class ForbiddenError extends AppError {
    constructor(message = "No tenés permisos para realizar esta acción") { super(message, 403) }
}

export class NotFoundError extends AppError {
    constructor(message = "Recurso no encontrado") { super(message, 404) }
}

export class ConflictError extends AppError {
    constructor(message = "Conflicto con el estado actual del recurso") { super(message, 409) }
}

export class UnprocessableEntityError extends AppError {
    constructor(message = "La entidad no cumple las reglas de negocio") { super(message, 422) }
}
