import { NotFoundError } from "../errors/AppError.js"

export function notFoundHandler(req, res, next) {
    next(new NotFoundError(`Ruta ${req.method} ${req.originalUrl} no encontrada`))
}
