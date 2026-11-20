import { ForbiddenError, UnauthorizedError } from "../errors/AppError.js"

// AUTENTICACIÓN ("¿quién sos?"): exige el header `Authorization: Bearer <token>`, verifica el token y deja la
// identidad en la request. Es la ÚNICA fuente de identidad: ningún controller lee el usuario del body ni de la URL.
//   req.usuarioId  <- claim `sub` del token
//   req.rol        <- claim `rol` del token
export function crearAutenticar(tokenService) {
    return function autenticar(req, res, next) {
        const header = req.get("authorization")
        if (!header) {
            return next(new UnauthorizedError("Falta el header Authorization: Bearer <token>"))
        }
        const [esquema, token, ...sobrante] = header.trim().split(/\s+/)
        if (esquema?.toLowerCase() !== "bearer" || !token || sobrante.length > 0) {
            return next(new UnauthorizedError("El header Authorization debe tener el formato: Bearer <token>"))
        }
        try {
            const { usuarioId, rol } = tokenService.verificar(token)
            req.usuarioId = usuarioId
            req.rol = rol
            next()
        } catch (error) {
            next(error)
        }
    }
}

// AUTORIZACIÓN por rol ("¿tu rol puede entrar a esta ruta?"). Se usa después de `autenticar`.
// La autorización por pertenencia ("¿esta compra es tuya?") no se hace acá: depende del recurso y la resuelve el dominio.
export const autorizar =
    (...rolesPermitidos) =>
    (req, res, next) => {
        if (!rolesPermitidos.includes(req.rol)) {
            return next(new ForbiddenError(`Esta acción requiere el rol: ${rolesPermitidos.join(" o ")}`))
        }
        next()
    }
