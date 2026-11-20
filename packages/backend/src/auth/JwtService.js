import jwt from "jsonwebtoken"
import { UnauthorizedError } from "../errors/AppError.js"

const ALGORITMO = "HS256" // firma simétrica: el mismo secreto firma y verifica
const EMISOR = "ticket-it"

// Adaptador sobre la librería jsonwebtoken. El resto de la app sólo conoce firmar() y verificar().
export class JwtService {
    constructor({ secreto, expiraEn = "1h" }) {
        if (!secreto || secreto.length < 32) {
            throw new Error("JWT_SECRET es obligatorio y debe tener al menos 32 caracteres (ver .env.example)")
        }
        this.secreto = secreto
        this.expiraEn = expiraEn
    }

    // Genera el token. El payload lleva sólo lo mínimo: quién es (sub) y su rol. Nada sensible.
    firmar({ usuarioId, rol }) {
        const token = jwt.sign({ rol }, this.secreto, {
            algorithm: ALGORITMO,
            issuer: EMISOR,
            subject: String(usuarioId),
            expiresIn: this.expiraEn
        })
        const { iat, exp } = jwt.decode(token)
        return { token, expiraEnSegundos: exp - iat }
    }

    // Comprueba firma, algoritmo, emisor y vencimiento. Si algo falla lanza 401.
    verificar(token) {
        let payload
        try {
            // `algorithms` fijado: evita que un atacante elija otro algoritmo (ej. "none") en el header del token.
            payload = jwt.verify(token, this.secreto, { algorithms: [ALGORITMO], issuer: EMISOR })
        } catch (error) {
            if (error.name === "TokenExpiredError") throw new UnauthorizedError("El token expiró: iniciá sesión nuevamente")
            throw new UnauthorizedError("Token inválido")
        }
        return { usuarioId: payload.sub, rol: payload.rol }
    }
}
