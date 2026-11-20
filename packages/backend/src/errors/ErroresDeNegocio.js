// Errores específicos del negocio. Heredan de los HTTP para que el ErrorHandler los resuelva sin código extra.
import { ConflictError } from "./AppError.js"

export class CupoInsuficienteError extends ConflictError {
    constructor(message = "No hay cupo suficiente para la cantidad solicitada") { super(message) }
}

export class EventoYaRealizadoError extends ConflictError {
    constructor(message = "El evento ya se realizó") { super(message) }
}

export class TransicionDeEstadoInvalidaError extends ConflictError {
    constructor(message = "La transición de estado de la compra no es válida") { super(message) }
}
